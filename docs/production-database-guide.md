# Production Database Connection Guide

This document explains the optimized database connection architecture implemented for the Doctor's Orders application in production environments, particularly on Vercel.

## Table of Contents

1. [Problem Overview](#problem-overview)
2. [Solution Architecture](#solution-architecture)
3. [Implementation Details](#implementation-details)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

## Problem Overview

Connecting to Google Cloud SQL from serverless environments like Vercel presents several challenges:

1. **Ephemeral Execution**: Serverless functions are short-lived and don't maintain persistent processes
2. **Connection Pooling**: Each function invocation creates a new connection, quickly exhausting available connections
3. **Cloud SQL Proxy Limitations**: The proxy approach that works locally isn't suitable for serverless environments
4. **File System Restrictions**: Serverless environments have limited file system access for credential files

## Solution Architecture

The implemented solution uses a direct SSL connection approach optimized for serverless environments:

1. **Direct SSL Connection**: Connect directly to Cloud SQL without requiring a proxy
2. **Connection Pooling**: Implement connection pooling optimized for serverless environments
3. **Environment Detection**: Automatically use the appropriate connection method based on the environment
4. **Fluid Compute Compatibility**: Designed to work with Vercel's Fluid Compute for better connection reuse

### Architecture Diagram

```
┌─────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│                 │      │                   │      │                   │
│  Next.js API    │──────▶  Connection Pool  │──────▶  Google Cloud SQL │
│  Route          │      │  Manager          │      │  Database         │
│                 │      │                   │      │                   │
└─────────────────┘      └───────────────────┘      └───────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────┐      ┌───────────────────┐
│                 │      │                   │
│  Serverless     │      │  Connection       │
│  Database       │      │  Reuse            │
│  Service        │      │  (Fluid Compute)  │
│                 │      │                   │
└─────────────────┘      └───────────────────┘
```

## Implementation Details

### 1. Connection Manager (`app/api/database/connectionManager.js`)

The connection manager provides a production-ready connection management solution:

```javascript
// Create connection pool with SSL for production
function createConnectionPool(connectionName = 'default') {
  // Configure the connection pool
  const poolConfig = {
    connectionString: getConnectionString(),
    ssl: getSslConfig(),
    max: 10, // Maximum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
  
  // Create and return pool
  const pool = new Pool(poolConfig);
  return pool;
}
```

Key features:
- Direct SSL connections without requiring Cloud SQL Proxy
- Connection pooling optimized for serverless environments
- Automatic retries and error handling
- Environment detection (development vs production)

### 2. Serverless Database Service (`backend/services/serverlessDatabaseService.js`)

This service implements the same interface as the existing database service but uses the optimized connection manager:

```javascript
// Example function using the connection manager
async function getNotes(userId, options = {}) {
  // Build query with proper parameters
  const notesQuery = `
    SELECT * FROM notes
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  
  // Execute query using the connection manager
  const result = await query(notesQuery, [userId]);
  return result.rows;
}
```

### 3. API Route Integration (`app/api/notes/route.js`)

The API routes automatically use the appropriate database service based on the environment:

```javascript
// Dynamic import for the appropriate database service
function getDatabaseService() {
  const servicePath = process.env.NODE_ENV === 'production'
    ? '../../../backend/services/serverlessDatabaseService.js'
    : '../../../backend/services/gcpDatabaseService.js';
    
  return import(servicePath);
}
```

## Vercel Deployment Setup

### 1. Environment Variables

The following environment variables must be configured in your Vercel project:

```
# Database Connection
GCP_DB_USER=your-db-user
GCP_DB_PASSWORD=your-db-password
GCP_DB_NAME=your-db-name
GCP_INSTANCE_CONNECTION_NAME=project:region:instance

# Authentication
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Configure Google Cloud SQL

1. **Enable Public IP**: Make sure your Cloud SQL instance has a public IP address enabled

2. **Authorized Networks**: Add `0.0.0.0/0` to the authorized networks list in your Cloud SQL instance
   - Go to Google Cloud Console > SQL > Your Instance > Connections > Networking
   - Under "Authorized networks", click "Add network"
   - Enter `0.0.0.0/0` as the network and add a description like "Vercel Serverless Functions"
   - Click "Done" and then "Save"

3. **SSL Configuration**: Ensure SSL is properly configured
   - Go to Google Cloud Console > SQL > Your Instance > Connections > SSL
   - Make sure SSL is enabled

### 3. Enable Fluid Compute in Vercel

For better connection pooling, enable Vercel's Fluid Compute feature:

1. Go to your Vercel project settings
2. Navigate to the "Functions" tab
3. Enable "Fluid Compute"

This will allow better connection reuse between function invocations.

## Troubleshooting

### 1. Connection Issues

If you encounter connection issues in production:

1. **Check Environment Variables**: Ensure all required environment variables are correctly set in Vercel
2. **Verify Network Access**: Make sure your Cloud SQL instance allows connections from external IPs
3. **Check SSL Configuration**: Verify SSL is properly configured on your Cloud SQL instance
4. **Review Logs**: Check Vercel logs for detailed error messages

### 2. Common Error Messages

#### "Database connection not available"

This error typically indicates one of the following issues:

- **Environment Variables**: Missing or incorrect database credentials in Vercel
- **Network Access**: Your Cloud SQL instance doesn't allow connections from Vercel
- **SSL Configuration**: SSL issues between Vercel and Cloud SQL

#### "ECONNREFUSED" or "Connection refused"

This error indicates that the connection attempt was actively rejected:

- **IP Restrictions**: Your Cloud SQL instance may be blocking connections
- **Firewall Issues**: Check Google Cloud firewall rules
- **Wrong Connection String**: Verify the instance connection name is correct

#### "Timeout exceeded when trying to connect"

This error indicates a network connectivity issue:

- **Network Latency**: There might be network issues between Vercel and Google Cloud
- **Instance Overload**: Your database instance might be under heavy load
- **Connection Limits**: You might have reached the maximum number of connections

### 2. Performance Issues

If you experience performance issues:

1. **Increase Pool Size**: Adjust the `max` parameter in the connection pool configuration
2. **Check Query Performance**: Review and optimize slow queries
3. **Enable Fluid Compute**: Make sure Vercel's Fluid Compute is enabled for better connection reuse

## Best Practices

1. **Connection Management**:
   - Use connection pooling to minimize connection overhead
   - Keep pool sizes reasonable (10-20 connections)
   - Implement proper error handling and retries

2. **Security**:
   - Use SSL for all database connections
   - Store credentials in environment variables, not in code
   - Use IAM authentication when possible

3. **Monitoring**:
   - Monitor connection usage and errors
   - Set up alerts for database connection issues
   - Regularly review performance metrics

4. **Deployment**:
   - Test database connections before deploying to production
   - Use staging environments to verify connection behavior
   - Implement progressive rollouts for database changes
