/**
 * Cloud SQL Proxy Manager Script
 * 
 * This script provides utilities to manage the Cloud SQL Proxy:
 * - Check if the proxy is running
 * - Start the proxy if it's not running
 * - Stop the proxy if it's running
 * - Change the port if there's a conflict
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { promisify } = require('util');

// Promisify exec for cleaner async/await usage
const execPromise = promisify(exec);

// Load environment variables
dotenv.config();

// Configuration
const PROXY_FOLDER = path.join(__dirname, '..', 'proxy');
const PROXY_EXECUTABLE = process.platform === 'win32' ? 'cloud-sql-proxy.exe' : 'cloud-sql-proxy';
const PROXY_PATH = path.join(PROXY_FOLDER, PROXY_EXECUTABLE);

// Get key file path from environment variable or use default
const KEY_FILE = process.env.GCP_SQL_CREDENTIALS || path.join(__dirname, '..', 'key.json');

// Get connection name from environment variable
const CONNECTION_NAME = process.env.GCP_INSTANCE_CONNECTION_NAME;

// Get database port from environment variable or use default
const DB_PORT = process.env.GCP_DB_PORT || 5432;

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
  while (await isPortInUse(port)) {
    port++;
    if (port > startPort + 100) {
      throw new Error('Could not find an available port after 100 attempts');
    }
  }
  return port;
}

/**
 * Check if the proxy is running
 * @returns {Promise<boolean>} Whether the proxy is running
 */
async function isProxyRunning() {
  try {
    const portInUse = await isPortInUse(DB_PORT);
    if (!portInUse) {
      return false;
    }
    
    // Try to connect to the database to verify it's the proxy
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.GCP_DB_USER,
      host: '127.0.0.1',
      database: process.env.GCP_DB_NAME,
      password: process.env.GCP_DB_PASSWORD,
      port: DB_PORT,
      ssl: false,
      connectionTimeoutMillis: 3000,
    });
    
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Start the Cloud SQL Proxy
 * @param {number} port - The port to use
 * @returns {Promise<object>} The proxy process and status
 */
async function startProxy(port = DB_PORT) {
  // Check if the proxy executable exists
  if (!fs.existsSync(PROXY_PATH)) {
    console.error(`Error: Cloud SQL Proxy executable not found at ${PROXY_PATH}`);
    console.error('\nPlease follow these steps:');
    console.error('1. Create a "proxy" folder in your project root');
    console.error('2. Download the Cloud SQL Proxy from:');
    console.error('   https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases');
    console.error('3. Rename it to "cloud-sql-proxy" or "cloud-sql-proxy.exe" on Windows');
    console.error('4. Place it in the "proxy" folder');
    process.exit(1);
  }

  // Check if the key file exists
  if (!fs.existsSync(KEY_FILE)) {
    console.error(`Error: Service account key file not found at ${KEY_FILE}`);
    console.error('\nPlease follow these steps:');
    console.error('1. Go to Google Cloud Console > IAM & Admin > Service Accounts');
    console.error('2. Create a service account with the "Cloud SQL Client" role');
    console.error('3. Create a JSON key for this service account');
    console.error('4. Save the key file as "key.json" in your project root');
    process.exit(1);
  }

  // Check if the connection name is set
  if (!CONNECTION_NAME) {
    console.error('Error: GCP_INSTANCE_CONNECTION_NAME is not set in your .env file');
    console.error('Please add it in the format: project-id:region:instance-name');
    process.exit(1);
  }

  // Make the proxy executable (for Unix systems)
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(PROXY_PATH, '755');
    } catch (error) {
      console.error(`Error making proxy executable: ${error.message}`);
      process.exit(1);
    }
  }

  // Check if the port is already in use
  const portInUse = await isPortInUse(port);
  if (portInUse) {
    const proxyRunning = await isProxyRunning();
    if (proxyRunning) {
      console.log(`Cloud SQL Proxy is already running on port ${port}`);
      return { status: 'already_running', port };
    } else {
      console.log(`Port ${port} is in use by another application`);
      
      // Try to find an available port
      try {
        const availablePort = await findAvailablePort(port + 1);
        console.log(`Found available port: ${availablePort}`);
        
        // Update the environment variable
        process.env.GCP_DB_PORT = availablePort;
        
        console.log(`Using alternative port: ${availablePort}`);
        return startProxy(availablePort);
      } catch (error) {
        console.error(`Error finding available port: ${error.message}`);
        return { status: 'error', message: error.message };
      }
    }
  }

  console.log('Starting Cloud SQL Proxy...');
  console.log(`Connecting to: ${CONNECTION_NAME}`);
  console.log(`Port: ${port}`);
  console.log(`Database: ${process.env.GCP_DB_NAME}`);
  console.log(`User: ${process.env.GCP_DB_USER}`);

  // Start the proxy
  const proxy = spawn(PROXY_PATH, [
    `--credentials-file=${KEY_FILE}`,
    '--structured-logs',
    '--max-connections=10',
    `--port=${port}`,
    CONNECTION_NAME
  ], {
    detached: true,
    stdio: 'pipe'
  });

  // Handle proxy output
  proxy.stdout.on('data', (data) => {
    console.log(`[SQL Proxy] ${data.toString().trim()}`);
  });

  proxy.stderr.on('data', (data) => {
    console.error(`[SQL Proxy Error] ${data.toString().trim()}`);
  });

  // Handle proxy exit
  proxy.on('close', (code) => {
    console.log(`Cloud SQL Proxy exited with code ${code}`);
  });

  // Wait for the proxy to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if the proxy started successfully
  const proxyRunning = await isProxyRunning();
  if (proxyRunning) {
    console.log(`Cloud SQL Proxy is running on port ${port}`);
    return { status: 'started', port, process: proxy };
  } else {
    console.error('Failed to start Cloud SQL Proxy');
    return { status: 'error', message: 'Failed to start Cloud SQL Proxy' };
  }
}

/**
 * Stop the Cloud SQL Proxy
 * @returns {Promise<boolean>} Whether the proxy was stopped
 */
async function stopProxy() {
  try {
    if (process.platform === 'win32') {
      // Windows
      await execPromise(`taskkill /F /IM ${PROXY_EXECUTABLE}`);
    } else {
      // Unix
      await execPromise(`pkill -f "${PROXY_EXECUTABLE}"`);
    }
    return true;
  } catch (error) {
    console.error(`Error stopping proxy: ${error.message}`);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Execute the appropriate command
(async () => {
  try {
    switch (command) {
      case 'start':
        await startProxy();
        break;
      case 'stop':
        const stopped = await stopProxy();
        console.log(stopped ? 'Proxy stopped' : 'Failed to stop proxy');
        break;
      case 'restart':
        await stopProxy();
        await startProxy();
        break;
      case 'status':
        const running = await isProxyRunning();
        console.log(running ? 'Proxy is running' : 'Proxy is not running');
        break;
      case 'check-port':
        const port = args[1] || DB_PORT;
        const inUse = await isPortInUse(port);
        console.log(inUse ? `Port ${port} is in use` : `Port ${port} is available`);
        break;
      default:
        console.log('Usage: node manage-proxy.js [start|stop|restart|status|check-port]');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
})();
