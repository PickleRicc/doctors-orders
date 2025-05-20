# GCP Database Setup Guide

This guide explains how to set up the GCP Cloud SQL database for Doctor's Orders and connect to it using Cloud SQL Proxy.

## 1. Create a Cloud SQL Instance

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to SQL in the left menu
3. Click "Create Instance"
4. Select "PostgreSQL"
5. Configure your instance:
   - Name: `doctors-orders-db`
   - Password: Create a strong password
   - Region: Choose one close to your users (e.g., `us-central1`)
   - Database version: PostgreSQL 14
   - Machine type: 2 vCPUs, 4GB RAM (or smaller for development)
   - Storage: 10GB SSD
   - Enable automatic backups
6. Click "Create"

## 2. Set Up the Database

1. Once your instance is created, click on it
2. Go to "Databases" tab
3. Click "Create Database"
4. Enter name: `doctors_orders`
5. Click "Create"

## 3. Create a Database User

1. Go to "Users" tab
2. Click "Add User Account"
3. Choose "Built-in authentication"
4. Username: `doctors_orders_app`
5. Password: Create another strong password
6. Click "Add"

## 4. Apply Our Schema

1. Go to "Databases" tab
2. Click on `doctors_orders`
3. Click "Query editor"
4. Copy the contents of `db/migrations/003_create_gcp_schema.sql`
5. Paste into the query editor
6. Click "Run"

## 5. Set Up Cloud SQL Proxy

### Download the Proxy

1. Create a `proxy` folder in your project root:
   ```
   mkdir proxy
   ```

2. Download the Cloud SQL Proxy from [Google's GitHub](https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases)
   - For Windows: Download the Windows 64-bit version
   - For Mac: Download the macOS 64-bit version
   - For Linux: Download the Linux 64-bit version

3. Move the downloaded file to the `proxy` folder and rename it:
   - Windows: `cloud-sql-proxy.exe`
   - Mac/Linux: `cloud-sql-proxy`

4. On Mac/Linux, make it executable:
   ```
   chmod +x proxy/cloud-sql-proxy
   ```

### Create a Service Account Key

1. Go to Google Cloud Console > "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `doctors-orders-sql`
4. Grant role: "Cloud SQL Client"
5. Click "Create and Continue" then "Done"
6. Find your new service account in the list
7. Click the three dots menu > "Manage keys"
8. Click "Add Key" > "Create new key"
9. Choose JSON
10. Save the file to your project root as `key.json`

### Update Environment Variables

Add these to your `.env` file:

```
GCP_DB_USER=doctors_orders_app
GCP_DB_PASSWORD=your-password-here
GCP_DB_NAME=doctors_orders
GCP_DB_HOST=127.0.0.1
GCP_DB_PORT=5432
GCP_INSTANCE_CONNECTION_NAME=your-project-id:your-region:doctors-orders-db
```

## 6. Start the Proxy and Application

1. Start the Cloud SQL Proxy:
   ```
   node scripts/start-proxy.js
   ```

2. In another terminal, start your application:
   ```
   npm run dev
   ```

## Troubleshooting

### Connection Issues

If you can't connect to the database:

1. Check that the Cloud SQL Proxy is running
2. Verify your environment variables are correct
3. Make sure your service account has the "Cloud SQL Client" role
4. Check that your database user has the correct permissions

### Schema Issues

If there are errors applying the schema:

1. Check for syntax errors in the SQL file
2. Make sure the database user has permission to create tables
3. Try running the statements one by one in the query editor

## Security Notes

- Never commit your `key.json` file to version control
- Add `key.json` to your `.gitignore` file
- For production, consider using a more secure method to store credentials
- Enable private IP for your Cloud SQL instance in production
