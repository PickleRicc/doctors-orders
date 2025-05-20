/**
 * Database Creation Script
 * 
 * This script checks if the database exists and creates it if needed
 * Run with: node scripts/create-database.js
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// First, connect to the default 'postgres' database to check if our database exists
async function checkAndCreateDatabase() {
  console.log('Checking if database exists...');
  
  // Connect to the default postgres database
  const client = new Client({
    user: process.env.GCP_DB_USER,
    host: process.env.GCP_DB_HOST,
    database: 'postgres', // Connect to default postgres database
    password: process.env.GCP_DB_PASSWORD,
    port: process.env.GCP_DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production',
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('Connected to postgres database');
    
    // Check if our database exists
    const result = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [process.env.GCP_DB_NAME]);
    
    if (result.rows.length === 0) {
      console.log(`Database '${process.env.GCP_DB_NAME}' does not exist. Creating it...`);
      
      // Create the database
      await client.query(`CREATE DATABASE "${process.env.GCP_DB_NAME}"`);
      console.log(`Database '${process.env.GCP_DB_NAME}' created successfully!`);
    } else {
      console.log(`Database '${process.env.GCP_DB_NAME}' already exists.`);
    }
    
    await client.end();
    
    // Now apply the schema
    await applySchema();
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === '28P01') {
      console.error('\nPassword authentication failed. Please check:');
      console.error('1. The user exists in the database');
      console.error('2. The password in your .env file is correct');
    } else if (error.code === '3D000') {
      console.error('\nDatabase does not exist. Please create it first.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. Please check:');
      console.error('1. The Cloud SQL Proxy is running');
      console.error('2. The host and port are correct');
    }
    
    if (client) {
      await client.end();
    }
  }
}

// Apply the schema to the database
async function applySchema() {
  console.log(`Applying schema to database '${process.env.GCP_DB_NAME}'...`);
  
  // Connect to our database
  const client = new Client({
    user: process.env.GCP_DB_USER,
    host: process.env.GCP_DB_HOST,
    database: process.env.GCP_DB_NAME,
    password: process.env.GCP_DB_PASSWORD,
    port: process.env.GCP_DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production',
  });
  
  try {
    await client.connect();
    console.log(`Connected to '${process.env.GCP_DB_NAME}' database`);
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'db', 'migrations', '003_create_gcp_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Apply the schema
    await client.query(schema);
    console.log('Schema applied successfully!');
    
    // Check if tables were created
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tables created:');
    tableResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    await client.end();
    console.log('Database setup complete!');
    
  } catch (error) {
    console.error('Error applying schema:', error.message);
    if (client) {
      await client.end();
    }
  }
}

// Run the script
checkAndCreateDatabase();
