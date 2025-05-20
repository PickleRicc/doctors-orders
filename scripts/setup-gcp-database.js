/**
 * GCP Database Setup Script
 * 
 * This script helps set up the GCP database with the correct name and permissions
 * Run with: node scripts/setup-gcp-database.js
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration from .env
const config = {
  user: process.env.GCP_DB_USER,
  password: process.env.GCP_DB_PASSWORD,
  host: process.env.GCP_DB_HOST,
  port: process.env.GCP_DB_PORT || 5432,
  database: 'postgres', // Connect to default postgres database first
  ssl: process.env.NODE_ENV === 'production',
  connectionTimeoutMillis: 5000,
};

// Target database name from .env
const targetDbName = process.env.GCP_DB_NAME;

async function setupDatabase() {
  console.log('=== GCP Database Setup ===');
  console.log('Configuration:');
  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`User: ${config.user}`);
  console.log(`Target Database: ${targetDbName}`);
  
  // Step 1: Connect to postgres database
  const client = new Client(config);
  
  try {
    console.log('\nStep 1: Connecting to postgres database...');
    await client.connect();
    console.log('✅ Connected to postgres database');
    
    // Step 2: Check if target database exists
    console.log(`\nStep 2: Checking if database '${targetDbName}' exists...`);
    const dbResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [targetDbName]);
    
    if (dbResult.rows.length === 0) {
      console.log(`Database '${targetDbName}' does not exist. Creating it...`);
      
      // Create the database with exact name from .env
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database '${targetDbName}' created successfully!`);
    } else {
      console.log(`✅ Database '${targetDbName}' already exists.`);
    }
    
    await client.end();
    
    // Step 3: Apply schema to the target database
    await applySchema();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === '28P01') {
      console.error('\nPassword authentication failed. Please check:');
      console.error(`1. The user '${config.user}' exists in the database`);
      console.error('2. The password in your .env file is correct');
      console.error('\nYou may need to:');
      console.error('1. Go to GCP Console > SQL > Your Instance > Users');
      console.error(`2. Create or update the user '${config.user}'`);
      console.error('3. Set the password to match your .env file');
    } else if (error.code === '42501') {
      console.error('\nPermission denied. Please check:');
      console.error(`1. The user '${config.user}' has permission to create databases`);
      console.error('\nYou may need to:');
      console.error('1. Connect to your database as a superuser');
      console.error(`2. Run: ALTER USER ${config.user} WITH CREATEDB;`);
    }
    
    if (client) {
      await client.end().catch(console.error);
    }
  }
}

async function applySchema() {
  console.log(`\nStep 3: Applying schema to database '${targetDbName}'...`);
  
  // Connect to target database
  const client = new Client({
    ...config,
    database: targetDbName, // Connect to our target database
  });
  
  try {
    await client.connect();
    console.log(`✅ Connected to '${targetDbName}' database`);
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'db', 'migrations', '003_create_gcp_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Apply the schema
    console.log('Applying schema...');
    await client.query(schema);
    console.log('✅ Schema applied successfully!');
    
    // Check if tables were created
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nTables created:');
    tableResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\n✅ Database setup complete!');
    console.log('\nYou can now run your application with:');
    console.log('npm run dev');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    
    if (error.code === '42P07') {
      console.log('Tables already exist. This is not an error.');
      console.log('✅ Database is ready to use!');
    } else {
      console.error('\nYou may need to:');
      console.error('1. Check the schema file for errors');
      console.error(`2. Make sure the user '${config.user}' has permission to create tables`);
    }
    
    if (client) {
      await client.end().catch(console.error);
    }
  }
}

// Run the script
setupDatabase();
