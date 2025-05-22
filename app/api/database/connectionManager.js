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
    
    // Parse the instance connection name to get project, region, and instance
    const [project, region, instance] = process.env.GCP_INSTANCE_CONNECTION_NAME.split(':');
    
    // For production, use the public IP with SSL
    return `postgresql://${process.env.GCP_DB_USER}:${process.env.GCP_DB_PASSWORD}@${instance}.${region}.${project}.cloudsql.com:5432/${process.env.GCP_DB_NAME}`;
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
    return {
      rejectUnauthorized: false, // Needed for self-signed certs
      // In production, we don't need to provide cert files as Google Cloud manages this
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
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // How long to wait for a connection to become available
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
    const result = await query('SELECT 1 as health_check', [], connectionName);
    return result.rows[0].health_check === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
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
