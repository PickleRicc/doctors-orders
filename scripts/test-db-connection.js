/**
 * Database Connection Test Script
 * 
 * This script tests the connection to the GCP Cloud SQL database
 * Run with: node scripts/test-db-connection.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool with the same configuration as the service
const pool = new Pool({
  user: process.env.GCP_DB_USER,
  host: process.env.GCP_DB_HOST,
  database: process.env.GCP_DB_NAME,
  password: process.env.GCP_DB_PASSWORD,
  port: process.env.GCP_DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production',
  connectionTimeoutMillis: 5000, // 5 seconds
});

// Print connection info
console.log('Database connection info:');
console.log(`Host: ${process.env.GCP_DB_HOST}`);
console.log(`Port: ${process.env.GCP_DB_PORT}`);
console.log(`Database: ${process.env.GCP_DB_NAME}`);
console.log(`User: ${process.env.GCP_DB_USER}`);
console.log('-----------------------------------');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try a simple query
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log(`Server time: ${result.rows[0].now}`);
    
    // Try to create the schema if it doesn't exist
    console.log('\nChecking if schema exists...');
    
    // Check if the notes table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notes'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Schema not found. You need to create the database schema.');
      console.log('Run the SQL commands from db/migrations/003_create_gcp_schema.sql');
    } else {
      console.log('✅ Schema exists!');
      
      // Check if there are any templates
      const templateCount = await pool.query('SELECT COUNT(*) FROM templates');
      console.log(`Found ${templateCount.rows[0].count} templates`);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code === '28P01') {
      console.error('\nPassword authentication failed. Please check:');
      console.error('1. The user exists in the database');
      console.error('2. The password in your .env file is correct');
      console.error('3. The user has the correct permissions');
    } else if (error.code === '3D000') {
      console.error('\nDatabase does not exist. Please create it first.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. Please check:');
      console.error('1. The Cloud SQL Proxy is running');
      console.error('2. The host and port are correct');
    }
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the test
testConnection();
