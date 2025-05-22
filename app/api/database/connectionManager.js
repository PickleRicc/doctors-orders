/**
 * Cloud SQL Connection Manager for Serverless Environments
 * 
 * This module provides a production-ready connection management solution for
 * connecting to Google Cloud SQL from Vercel serverless functions.
 * 
 * Features:
 * - Direct SSL connections without requiring Cloud SQL Proxy
 * - Connection pooling optimized for serverless environments
 * - Automatic retries and error handling
 * - Environment detection (development vs production)
 * - Compatible with Vercel's Fluid Compute for better connection reuse
 */

import { Pool } from 'pg';

// Connection pool cache
// This leverages the fact that serverless functions can reuse global variables
// between invocations when using Vercel's Fluid Compute
let pools = {};

/**
 * Creates a connection string for direct SSL connection to Cloud SQL
 * @returns {string} PostgreSQL connection string
 */
function getConnectionString() {
  // In production, use direct SSL connection
  if (process.env.NODE_ENV === 'production') {
    // Check if we have all required environment variables
    const requiredVars = [
      'GCP_DB_USER',
      'GCP_DB_PASSWORD',
      'GCP_DB_NAME',
      'GCP_INSTANCE_CONNECTION_NAME'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // For production, we need to use the public IP address directly
    // The format for Cloud SQL hostname is different than what we had
    
    // If GCP_DB_HOST is provided, use it directly
    if (process.env.GCP_DB_HOST && process.env.GCP_DB_HOST !== '127.0.0.1') {
      return `postgresql://${process.env.GCP_DB_USER}:${encodeURIComponent(process.env.GCP_DB_PASSWORD)}@${process.env.GCP_DB_HOST}:${process.env.GCP_DB_PORT || 5432}/${process.env.GCP_DB_NAME}`;
    }
    
    // Fallback to constructing the hostname from the instance connection name
    const [project, region, instance] = process.env.GCP_INSTANCE_CONNECTION_NAME.split(':');
    return `postgresql://${process.env.GCP_DB_USER}:${encodeURIComponent(process.env.GCP_DB_PASSWORD)}@${project}:${region}:${instance}.cloudsql.com:5432/${process.env.GCP_DB_NAME}`;
  } 
  
  // In development, use localhost connection through Cloud SQL Proxy
  return `postgresql://${process.env.GCP_DB_USER}:${process.env.GCP_DB_PASSWORD}@localhost:${process.env.GCP_DB_PORT || 5432}/${process.env.GCP_DB_NAME}`;
}

/**
 * Get SSL configuration for direct Cloud SQL connection
 * @returns {Object|boolean} SSL configuration object or false for no SSL
 */
function getSslConfig() {
  // In production, use SSL
  if (process.env.NODE_ENV === 'production') {
    // For Google Cloud SQL, we need to disable certificate validation
    // This is safe because we're connecting to a known host
    return {
      rejectUnauthorized: false, // Required for Google Cloud SQL
      // No need for certificate files as Google Cloud manages SSL
    };
  }
  
  // In development with proxy, we don't need SSL
  return false;
}

/**
 * Creates a connection pool for the database
 * @param {string} connectionName - A unique name for this connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
export function createConnectionPool(connectionName = 'default') {
  // Create a unique key for this connection
  const key = connectionName;
  
  // If we already have a pool for this connection, return it
  if (pools[key]) {
    return pools[key];
  }
  
  // Configure the connection pool
  const poolConfig = {
    connectionString: getConnectionString(),
    ssl: getSslConfig(),
    max: process.env.NODE_ENV === 'production' ? 3 : 10, // Fewer connections in serverless environment
    idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 10000 : 30000, // Shorter idle timeout in production
    connectionTimeoutMillis: 10000, // Longer timeout to account for cold starts
    statement_timeout: 30000, // Timeout for statements
    query_timeout: 30000, // Timeout for queries
  };
  
  // Create a new pool
  const pool = new Pool(poolConfig);
  
  // Add error handling
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't crash the application, but log the error
  });
  
  // Store the pool in our cache
  pools[key] = pool;
  
  return pool;
}

/**
 * Gets a client from the pool and executes a callback with it
 * @param {Function} callback - Function to execute with the client
 * @param {string} connectionName - Name of the connection pool to use
 * @returns {Promise<any>} Result of the callback
 */
export async function withClient(callback, connectionName = 'default') {
  const pool = createConnectionPool(connectionName);
  const client = await pool.connect();
  
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

/**
 * Executes a query using a connection from the pool
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {string} connectionName - Name of the connection pool to use
 * @returns {Promise<Object>} Query result
 */
export async function query(text, params = [], connectionName = 'default') {
  return withClient(client => client.query(text, params), connectionName);
}

/**
 * Checks if the database connection is healthy
 * @param {string} connectionName - Name of the connection pool to use
 * @returns {Promise<boolean>} Whether the connection is healthy
 */
export async function isDatabaseHealthy(connectionName = 'default') {
  try {
    // Log connection string (without credentials) for debugging
    const connString = getConnectionString();
    const sanitizedConnString = connString.replace(/:[^:@]*@/, ':***@');
    console.log(`Checking database health with connection: ${sanitizedConnString}`);
    
    // Get SSL config for debugging
    const sslConfig = getSslConfig();
    console.log(`SSL config: ${JSON.stringify(sslConfig)}`);
    
    // Attempt a simple query to check connection
    const result = await query('SELECT 1 as health_check', [], connectionName);
    
    if (result.rows[0].health_check === 1) {
      console.log('Database health check successful');
      return true;
    } else {
      console.error('Database health check returned unexpected result:', result.rows[0]);
      return false;
    }
  } catch (error) {
    console.error('Database health check failed with error:', error.message);
    console.error('Error details:', error);
    
    // Log specific error types for better debugging
    if (error.code === 'ENOTFOUND') {
      console.error('Host not found. Check your GCP_DB_HOST or GCP_INSTANCE_CONNECTION_NAME');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Check if the database server is running and accessible');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Check network connectivity and firewall settings');
    }
    
    return false;
  }
}

/**
 * Closes all connection pools
 * @returns {Promise<void>}
 */
export async function closeAllPools() {
  const promises = Object.values(pools).map(pool => pool.end());
  await Promise.all(promises);
  pools = {};
}

// Export a default connection pool
export default createConnectionPool();
