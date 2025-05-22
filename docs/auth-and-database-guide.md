# Authentication and Database Connection Guide

This document explains the authentication and database connection architecture implemented in the Doctor's Orders application. It's designed to serve as both documentation for the current project and as a boilerplate reference for future projects with similar requirements.

## Table of Contents

1. [Overview](#overview)
2. [Authentication System](#authentication-system)
3. [Database Connection Management](#database-connection-management)
4. [Error Handling](#error-handling)
5. [Implementation Details](#implementation-details)
6. [Troubleshooting](#troubleshooting)
7. [Using as a Boilerplate](#using-as-a-boilerplate)

## Overview

The Doctor's Orders application uses a combination of:

- **Supabase** for authentication (JWT-based)
- **Google Cloud SQL** for database storage (PostgreSQL)
- **Cloud SQL Proxy** for secure database connections
- **Next.js API Routes** for backend functionality

This architecture separates concerns between authentication and data storage while providing a secure and reliable connection to the database.

## Authentication System

### Key Components

1. **`authUtils.js`**: Centralizes authentication logic
   - Validates JWT tokens from Supabase
   - Extracts user IDs from tokens
   - Formats API responses consistently

### How Authentication Works

1. The client makes a request with a JWT token in the Authorization header
2. The `validateAuthToken` function:
   - Extracts the token from the request
   - Verifies the token with Supabase
   - Returns the user ID if valid
   - Throws an error if invalid
3. API routes use this user ID to filter data and enforce access control

## Database Connection Management

### Key Components

1. **`proxyManager.js`**: Manages the Cloud SQL Proxy lifecycle
   - Starts, stops, and monitors the proxy
   - Handles port conflicts automatically
   - Performs health checks
   
2. **`gcpDatabaseService.js`**: Provides database access
   - Manages connection pooling
   - Implements retry logic for transient errors
   - Provides CRUD operations for application data

3. **`manage-proxy.js`**: Command-line utility for proxy management
   - Provides commands to start, stop, and check proxy status
   - Helps with troubleshooting connection issues

### How Database Connection Works

1. When an API route needs database access, it first ensures the proxy is running
2. The proxy creates a secure tunnel to Google Cloud SQL
3. The database service uses this tunnel to execute queries
4. If the connection fails, the system attempts to:
   - Restart the proxy if it's not running
   - Find an alternative port if there's a conflict
   - Provide clear error messages to the client

## Error Handling

The system implements a comprehensive error handling strategy:

1. **Consistent Response Format**:
   ```javascript
   {
     data: resultData, // null if error
     error: errorMessage, // null if success
   }
   ```

2. **HTTP Status Codes**:
   - 200: Success
   - 400: Bad request (missing parameters)
   - 401: Unauthorized (invalid token)
   - 500: Server error
   - 503: Service unavailable (database connection issues)

3. **Graceful Degradation**:
   - Fallback templates when database is unavailable
   - Clear user-friendly error messages
   - Development mode special handling

## Implementation Details

### 1. Authentication Utility (`app/api/auth/authUtils.js`)

```javascript
// Validates the authentication token from the request
export async function validateAuthToken(request) {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token');
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify token with Supabase
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    throw new Error('Unauthorized: Invalid token');
  }
  
  return data.user.id;
}

// Format API responses consistently
export function formatApiResponse(data, error = null, status = 200) {
  return NextResponse.json(
    { data, error },
    { status }
  );
}
```

### 2. Proxy Manager (`app/api/proxy/proxyManager.js`)

```javascript
// Check if a port is in use
export async function isPortInUse(port) {
  try {
    // Platform-specific port checking
    const portInUse = /* check if port is in use */;
    return portInUse;
  } catch (error) {
    return false;
  }
}

// Find an available port
export async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
  }
  return port;
}

// Start the Cloud SQL Proxy
export async function startProxy(port = DEFAULT_PORT) {
  // Check if proxy is already running
  // Check if port is in use
  // Start proxy process
  // Monitor proxy health
}

// Check proxy health
export async function checkProxyHealth() {
  // Check if proxy is running
  // Check if port is in use
  // Try a test database connection
}
```

### 3. Database Service (`backend/services/gcpDatabaseService.js`)

```javascript
class GcpDatabaseService {
  constructor() {
    // Initialize connection pool
  }
  
  // Execute a query with retry logic
  async query(text, params) {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      // Handle connection errors
      // Implement retry logic
    }
  }
  
  // Get notes with filtering and pagination
  async getNotes(userId, options = {}) {
    // Extract options (limit, offset, etc.)
    // Build query with parameters
    // Execute query
    // Return formatted results
  }
  
  // Other CRUD operations...
}
```

### 4. API Routes (`app/api/notes/route.js`, `app/api/templates/route.js`)

```javascript
export async function GET(request) {
  // Ensure database connection
  const connected = await ensureDatabaseConnection();
  if (!connected) {
    return formatApiResponse(null, 'Database connection unavailable', 503);
  }
  
  try {
    // Validate authentication
    const userId = await validateAuthToken(request);
    
    // Extract query parameters
    // Get database service
    // Execute database query
    // Return formatted response
  } catch (error) {
    // Handle errors with appropriate status codes
  }
}
```

## Troubleshooting

Common issues and their solutions:

1. **Port Conflicts**:
   - The system will automatically try to find an available port
   - You can manually specify a different port in the environment variables
   - Use `npm run proxy:status` to check the current port

2. **Authentication Failures**:
   - Check that the JWT token is valid and not expired
   - Ensure the Authorization header is correctly formatted
   - Verify that the user exists in Supabase

3. **Database Connection Issues**:
   - Use `npm run proxy:restart` to restart the proxy
   - Check that the Cloud SQL instance is running
   - Verify that the service account has the necessary permissions

## Using as a Boilerplate

To adapt this architecture for a new project:

1. **Authentication Setup**:
   - Copy `authUtils.js` to your new project
   - Update Supabase configuration with your project details
   - Implement the same token validation pattern in your API routes

2. **Database Connection**:
   - Copy `proxyManager.js` and `manage-proxy.js`
   - Update environment variable names if needed
   - Adapt the database service to match your schema

3. **API Routes**:
   - Follow the pattern of checking connection, validating auth, and handling errors
   - Use the `formatApiResponse` function for consistent responses

4. **Environment Variables**:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Google Cloud SQL
   GCP_DB_USER=your-db-user
   GCP_DB_PASSWORD=your-db-password
   GCP_DB_NAME=your-db-name
   GCP_INSTANCE_CONNECTION_NAME=project:region:instance
   GCP_DB_PORT=5432
   GCP_SQL_CREDENTIALS=path/to/key.json
   ```

5. **Package Scripts**:
   ```json
   "scripts": {
     "proxy:start": "node scripts/manage-proxy.js start",
     "proxy:stop": "node scripts/manage-proxy.js stop",
     "proxy:status": "node scripts/manage-proxy.js status",
     "proxy:restart": "node scripts/manage-proxy.js restart",
     "dev:with-proxy": "npm run proxy:start && npm run dev"
   }
   ```

## Best Practices

1. **Separation of Concerns**:
   - Keep authentication logic separate from database logic
   - Use utility functions for common operations

2. **Error Handling**:
   - Always provide clear error messages
   - Use appropriate HTTP status codes
   - Implement fallbacks for critical failures

3. **Security**:
   - Never expose database credentials in client-side code
   - Always validate authentication before accessing data
   - Use environment variables for sensitive information

4. **Monitoring and Logging**:
   - Log important events and errors
   - Include relevant context in logs
   - Implement health checks for critical services

By following these patterns, you can create robust applications with secure authentication and reliable database connections.
