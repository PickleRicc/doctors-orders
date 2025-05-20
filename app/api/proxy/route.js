import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// This will store our proxy process
let proxyProcess = null;
let isProxyRunning = false;

// Function to write the credentials to a temporary file
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

// Function to download and set up the Cloud SQL Proxy
async function setupProxy() {
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
    console.error('Error setting up proxy:', error);
    throw error;
  }
}

// Function to start the Cloud SQL Proxy
async function startProxy() {
  if (isProxyRunning) {
    return { status: 'already_running' };
  }
  
  try {
    // Get the connection name from environment variables
    const connectionName = process.env.GCP_INSTANCE_CONNECTION_NAME;
    if (!connectionName) {
      throw new Error('GCP_INSTANCE_CONNECTION_NAME environment variable not set');
    }
    
    // Set up the proxy and credentials
    const [proxyPath, keyFilePath] = await Promise.all([
      setupProxy(),
      writeCredentialsToTempFile()
    ]);
    
    // Start the proxy process
    proxyProcess = spawn(proxyPath, [
      `--credentials-file=${keyFilePath}`,
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
    });
    
    isProxyRunning = true;
    
    return { status: 'started' };
  } catch (error) {
    console.error('Error starting proxy:', error);
    return { status: 'error', message: error.message };
  }
}

// API route handler to start the proxy
export async function GET(request) {
  // This is just a simple endpoint to trigger the proxy start
  // In a real implementation, you'd want to add authentication
  
  try {
    const result = await startProxy();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
