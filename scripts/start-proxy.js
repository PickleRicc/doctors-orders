/**
 * Cloud SQL Proxy Starter Script
 * 
 * This script starts the Cloud SQL Proxy to connect securely to your GCP Cloud SQL instance.
 * It's designed to be simple to use and will automatically read your environment variables.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const PROXY_FOLDER = path.join(__dirname, '..', 'proxy');
const PROXY_EXECUTABLE = process.platform === 'win32' ? 'cloud-sql-proxy.exe' : 'cloud-sql-proxy';
const PROXY_PATH = path.join(PROXY_FOLDER, PROXY_EXECUTABLE);

// Get key file path from environment variable or use default
const KEY_FILE = process.env.GCP_SQL_CREDENTIALS || path.join(__dirname, '..', 'key.json');

// Check if the connection name is set
const connectionName = process.env.GCP_INSTANCE_CONNECTION_NAME;
if (!connectionName) {
  console.error('Error: GCP_INSTANCE_CONNECTION_NAME is not set in your .env file');
  console.error('Please add it in the format: project-id:region:instance-name');
  process.exit(1);
}

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

// Make the proxy executable (for Unix systems)
if (process.platform !== 'win32') {
  try {
    fs.chmodSync(PROXY_PATH, '755');
  } catch (error) {
    console.error(`Error making proxy executable: ${error.message}`);
    process.exit(1);
  }
}

console.log('Starting Cloud SQL Proxy...');
console.log(`Connecting to: ${connectionName}`);
console.log('Database connection info:');
console.log(`Host: ${process.env.GCP_DB_HOST}`);
console.log(`Port: ${process.env.GCP_DB_PORT}`);
console.log(`Database: ${process.env.GCP_DB_NAME}`);
console.log(`User: ${process.env.GCP_DB_USER}`);

// Start the proxy
const proxy = spawn(PROXY_PATH, [
  `--credentials-file=${KEY_FILE}`,
  connectionName
]);

// Handle proxy output
proxy.stdout.on('data', (data) => {
  console.log(`[SQL Proxy] ${data.toString().trim()}`);
});

proxy.stderr.on('data', (data) => {
  console.error(`[SQL Proxy Error] ${data.toString().trim()}`);
});

proxy.on('close', (code) => {
  console.log(`Cloud SQL Proxy exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping Cloud SQL Proxy...');
  proxy.kill();
  process.exit(0);
});

console.log('Cloud SQL Proxy is running. Press Ctrl+C to stop.');
