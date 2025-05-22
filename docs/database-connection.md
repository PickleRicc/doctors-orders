# Database Connection Guide

This document provides information about the database connection setup for Doctor's Orders, focusing on the Cloud SQL Proxy configuration and troubleshooting common issues.

## Cloud SQL Proxy

The application uses Google Cloud SQL Proxy to establish a secure connection to the Cloud SQL database. The proxy creates an encrypted tunnel between your local environment and the Google Cloud SQL instance.

### Prerequisites

1. Download the Cloud SQL Proxy executable from [GitHub](https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases)
2. Place it in the `/proxy` folder in the project root
3. Rename it to `cloud-sql-proxy` (or `cloud-sql-proxy.exe` on Windows)
4. Ensure you have a service account key file (typically `key.json`) in the project root

### Environment Variables

The following environment variables are required for the database connection:

```
GCP_DB_USER=your_database_user
GCP_DB_PASSWORD=your_database_password
GCP_DB_NAME=your_database_name
GCP_INSTANCE_CONNECTION_NAME=project-id:region:instance-name
GCP_DB_PORT=5432 (optional, defaults to 5432)
GCP_SQL_CREDENTIALS=path/to/key.json (optional, defaults to key.json in project root)
```

### Managing the Proxy

We've added several npm scripts to help manage the Cloud SQL Proxy:

```bash
# Start the proxy
npm run proxy:start

# Stop the proxy
npm run proxy:stop

# Check proxy status
npm run proxy:status

# Restart the proxy
npm run proxy:restart

# Start development server with proxy
npm run dev:with-proxy
```

## Troubleshooting

### Port Conflicts

If you encounter port conflicts (e.g., "Port 5432 is already in use"), you can:

1. Use the proxy manager script to automatically find an available port:
   ```bash
   npm run proxy:restart
   ```

2. Specify a different port in your `.env` file:
   ```
   GCP_DB_PORT=5433
   ```

### Connection Issues

If you're experiencing database connection issues:

1. Check if the proxy is running:
   ```bash
   npm run proxy:status
   ```

2. Verify your environment variables are correctly set

3. Ensure your service account has the necessary permissions:
   - Cloud SQL Client
   - Cloud SQL Instance User

4. Check for network issues or firewall restrictions

5. Restart the proxy:
   ```bash
   npm run proxy:restart
   ```

### Error Messages

| Error | Solution |
|-------|----------|
| "Database connection unavailable" | Restart the proxy using `npm run proxy:restart` |
| "Port conflict detected" | The script will automatically try to find an available port |
| "Cloud SQL Proxy executable not found" | Download the proxy and place it in the `/proxy` folder |
| "Service account key file not found" | Ensure your key file exists in the project root or specify the path in `GCP_SQL_CREDENTIALS` |

## Production Deployment

In production (e.g., on Vercel), the application uses a different approach:

1. The Cloud SQL credentials are stored as a JSON string in the `GCP_SQL_CREDENTIALS_JSON` environment variable
2. The application creates a temporary credentials file at runtime
3. The proxy is started automatically when needed

Make sure to set up all required environment variables in your production environment.
