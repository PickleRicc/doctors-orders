/**
 * Cloud SQL Proxy Manager
 * Handles starting, monitoring, and health checking for the Cloud SQL Proxy
 */

import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Proxy state tracking
let proxyProcess = null;
let isProxyRunning = false;
let proxyStartTime = null;
let proxyPort = null;

/**
 * Check if a port is in use
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} Whether the port is in use
 */
async function isPortInUse(port) {
  try {
    if (process.platform === 'win32') {
      // Windows command to check port
      const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
      return stdout.trim().length > 0;
    } else {
      // Unix command to check port
      const { stdout } = await execPromise(`lsof -i:${port} | grep LISTEN`);
      return stdout.trim().length > 0;
    }
  } catch (error) {
    // If the command fails, it likely means the port is not in use
    return false;
  }
}

/**
 * Find an available port starting from the given port
 * @param {number} startPort - The port to start checking from
 * @returns {Promise<number>} An available port
 */
async function findAvailablePort(startPort) {
  let port = startPort;
  const maxAttempts = 20; // Try up to 20 ports
  let attempts = 0;
  
  while (await isPortInUse(port) && attempts < maxAttempts) {
    port++;
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
  }
  
  return port;
}

/**
 * Checks if the proxy is running and healthy
 * @returns {Promise<boolean>} Whether the proxy is healthy
 */
export async function isProxyHealthy() {
  // First check if the port is in use
  const port = proxyPort || (process.env.GCP_DB_PORT || 5432);
  const portInUse = await isPortInUse(port);
  
  // If the port is not in use, the proxy is definitely not running
  if (!portInUse) {
    console.log(`Port ${port} is not in use, proxy is not running`);
    return false;
  }
  
  // If our internal state doesn't match the port check, update it
  if (!isProxyRunning && portInUse) {
    console.log(`Port ${port} is in use but proxy state is not running, assuming external proxy`);
    isProxyRunning = true;
    proxyStartTime = Date.now();
  }
  
  // If proxy was never started by us or has been running for more than 12 hours, try a connection test
  if (!proxyStartTime || (Date.now() - proxyStartTime > 12 * 60 * 60 * 1000)) {
    console.log('Proxy uptime check failed, testing database connection directly');
  }
  
  // Try a test connection to the database
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.GCP_DB_USER,
      host: '127.0.0.1',
      database: process.env.GCP_DB_NAME,
      password: process.env.GCP_DB_PASSWORD,
      port: port,
      ssl: false,
      connectionTimeoutMillis: 3000,
    });
    
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (error) {
    console.error('Proxy health check failed:', error);
    return false;
  }
}

/**
 * Starts the Cloud SQL Proxy
 * @returns {Promise<Object>} Status of the proxy start operation
 */
export async function startProxy() {
  if (isStarting) {
    console.log('Cloud SQL Proxy is already starting');
    return { status: 'already_starting' };
  }
  
  isStarting = true;
  
  const port = process.env.GCP_DB_PORT || 5432;
  
  // First check if the port is already in use
  const portInUse = await isPortInUse(port);
  if (portInUse) {
    console.log(`Port ${port} is already in use`);
    
    // Check if it's our proxy process or an external one
    if (isProxyRunning && proxyProcess) {
      // It's our proxy, check if it's healthy
      const healthy = await isProxyHealthy();
      if (healthy) {
        return { status: 'already_running', healthy: true };
      }
      
      // If not healthy, terminate the existing process
      try {
        proxyProcess.kill();
        // Wait for the process to terminate and port to be released
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.error('Error killing existing proxy process:', e);
        return { 
          status: 'error', 
          message: 'Port is in use but could not terminate existing proxy process. Try restarting the application.' 
        };
      }
    } else {
      // It's an external process using the port
      console.log('Port is in use by an external process');
      
      // Try a direct database connection to see if it's a working proxy
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          user: process.env.GCP_DB_USER,
          host: '127.0.0.1',
          database: process.env.GCP_DB_NAME,
          password: process.env.GCP_DB_PASSWORD,
          port: port,
          ssl: false,
          connectionTimeoutMillis: 3000,
        });
        
        await pool.query('SELECT 1');
        await pool.end();
        
        // If we get here, the external process is a working proxy
        isProxyRunning = true;
        proxyStartTime = Date.now();
        return { 
          status: 'external_proxy_detected', 
          healthy: true,
          message: 'An external proxy is already running and working correctly' 
        };
      } catch (error) {
        // The port is in use but not by a working proxy
        return { 
          status: 'port_conflict', 
          healthy: false,
          message: `Port ${port} is in use by another application. Please free the port or change GCP_DB_PORT in your environment variables.` 
        };
      }
    }
  }
  
  // Find an available port
  try {
    proxyPort = await findAvailablePort(port);
  } catch (error) {
    console.error('Error finding available port:', error);
    return { status: 'error', message: error.message };
  }
  
  // Setup for Vercel or local environment
  const isVercel = process.env.VERCEL === '1';
  
  try {
    // Get connection name from environment
    const connectionName = process.env.GCP_INSTANCE_CONNECTION_NAME;
    if (!connectionName) {
      throw new Error('GCP_INSTANCE_CONNECTION_NAME not set');
    }
    
    // Setup proxy path and credentials
    let proxyPath, keyFilePath;
    
    if (isVercel) {
      // For Vercel, download proxy and create temp credentials file
      [proxyPath, keyFilePath] = await Promise.all([
        setupProxyForVercel(),
        writeCredentialsToTempFile()
      ]);
    } else {
      // For local environment, use local files
      proxyPath = path.join(process.cwd(), 'proxy', process.platform === 'win32' ? 'cloud-sql-proxy.exe' : 'cloud-sql-proxy');
      keyFilePath = process.env.GCP_SQL_CREDENTIALS || path.join(process.cwd(), 'key.json');
      
      // Ensure the proxy is executable on Unix systems
      if (process.platform !== 'win32') {
        try {
          await fs.chmod(proxyPath, '755');
        } catch (error) {
          console.error('Error making proxy executable:', error);
        }
      }
    }
    
    // Start the proxy with improved parameters
    proxyProcess = spawn(proxyPath, [
      `--credentials-file=${keyFilePath}`,
      '--structured-logs',
      '--max-connections=10',
      connectionName
    ]);
    
    // Handle proxy output
    proxyProcess.stdout.on('data', (data) => {
      console.log(`[SQL Proxy] ${data.toString().trim()}`);
    });
    
    proxyProcess.stderr.on('data', (data) => {
      console.error(`[SQL Proxy Error] ${data.toString().trim()}`);
    });
    
    proxyProcess.on('close', (code) => {
      console.log(`Cloud SQL Proxy exited with code ${code}`);
      isProxyRunning = false;
      proxyStartTime = null;
    });
    
    isProxyRunning = true;
    proxyStartTime = Date.now();
    
    // Wait for proxy to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify connection
    const healthy = await isProxyHealthy();
    
    return { 
      status: 'started', 
      healthy,
      message: healthy ? 'Proxy started and connected' : 'Proxy started but connection not verified'
    };
  } catch (error) {
    console.error('Error starting proxy:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Sets up the Cloud SQL Proxy for Vercel environment
 * @private
 * @returns {Promise<string>} Path to the proxy executable
 */
async function setupProxyForVercel() {
  try {
    // For Vercel, we need to download the proxy binary at runtime
    const tempDir = os.tmpdir();
    const proxyPath = path.join(tempDir, 'cloud-sql-proxy');
    
    // Download the proxy binary
    const response = await fetch(
      'https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.0.0/cloud-sql-proxy.linux.amd64'
    );
    
    if (!response.ok) {
      throw new Error(`Failed to download proxy: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    await fs.writeFile(proxyPath, Buffer.from(buffer));
    
    // Make the proxy executable
    await fs.chmod(proxyPath, 0o755);
    
    return proxyPath;
  } catch (error) {
    console.error('Error setting up proxy for Vercel:', error);
    throw error;
  }
}

/**
 * Writes GCP credentials to a temporary file
 * @private
 * @returns {Promise<string>} Path to the credentials file
 */
async function writeCredentialsToTempFile() {
  try {
    // For Vercel, we need to use environment variables instead of files
    const credentialsJson = process.env.GCP_SQL_CREDENTIALS_JSON;
    if (!credentialsJson) {
      throw new Error('GCP_SQL_CREDENTIALS_JSON environment variable not set');
    }
    
    // Create a temporary file in the /tmp directory (available in Vercel)
    const tempDir = os.tmpdir();
    const keyFilePath = path.join(tempDir, 'gcp-key.json');
    
    // Write the credentials JSON to the temporary file
    await fs.writeFile(keyFilePath, credentialsJson, 'utf8');
    
    return keyFilePath;
  } catch (error) {
    console.error('Error creating credentials file:', error);
    throw error;
  }
}
