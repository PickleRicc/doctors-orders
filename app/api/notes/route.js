import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateAuthToken, formatApiResponse } from '../auth/authUtils';
import { isDatabaseHealthy } from '../database/connectionManager';

/**
 * Notes API Route
 * Handles CRUD operations for notes with GCP database integration
 * Follows project standards for authentication and error handling
 * Uses direct SSL connection in production for better reliability
 */

// Dynamic import for CommonJS modules
let databaseServicePromise = null;
function getDatabaseService() {
  if (!databaseServicePromise) {
    // In production, use the serverless database service
    // In development, use the GCP database service with proxy
    const servicePath = process.env.NODE_ENV === 'production'
      ? '../../../backend/services/serverlessDatabaseService.js'
      : '../../../backend/services/gcpDatabaseService.js';
      
    databaseServicePromise = import(servicePath)
      .then(module => {
        // Handle both ESM default exports and CommonJS module.exports
        return module.default || module;
      })
      .catch(err => {
        console.error('Error importing database service:', err);
        return null;
      });
  }
  return databaseServicePromise;
}

/**
 * Helper function to ensure database connection is available
 * @returns {Promise<boolean>} Whether the database is connected
 */
async function ensureDatabaseConnection() {
  try {
    // In production, we use direct SSL connection, so just check if it's healthy
    // In development, we still use the proxy approach
    if (process.env.NODE_ENV === 'production') {
      const healthy = await isDatabaseHealthy();
      return healthy;
    } else {
      // For development, import and use the proxy manager
      const { isProxyHealthy, startProxy } = await import('../proxy/proxyManager');
      
      // Check if proxy is healthy
      const healthy = await isProxyHealthy();
      
      // If not healthy, try to start it
      if (!healthy) {
        console.log('Database proxy not healthy, attempting to start...');
        const result = await startProxy();
        
        // Wait a moment for the proxy to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check health again after starting
        const healthyAfterStart = await isProxyHealthy();
        return healthyAfterStart;
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error ensuring database connection:', error);
    return false;
  }
}

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
export async function GET(request) {
  // Ensure database connection is available
  const connected = await ensureDatabaseConnection();
  if (!connected) {
    return formatApiResponse(
      null, 
      'Database connection not available. Please try again in a moment.',
      503
    );
  }
  
  try {
    // Validate authentication using our utility
    const userId = await validateAuthToken(request);
    
    // Get query parameters for filtering and pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const patientId = url.searchParams.get('patientId');
    
    // Get the GCP database service
    const databaseService = await getDatabaseService();
    
    if (!databaseService) {
      console.error('GCP database service not available');
      return formatApiResponse(null, 'Database service unavailable', 500);
    }
    
    try {
      // Create options object with query parameters
      const options = {
        limit,
        offset,
        patientId: patientId || null,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      };
      
      // Get notes with proper options object
      const notes = await databaseService.getNotes(userId, options);
      
      // Return notes
      return formatApiResponse(notes);
    } catch (dbError) {
      console.error('Database error fetching notes:', dbError);
      
      // Check for port conflict or proxy issues
      if (dbError.message && (dbError.message.includes('port conflict') || 
                             dbError.message.includes('connection refused') ||
                             dbError.message.includes('database connection unavailable'))) {
        return formatApiResponse(
          null,
          'Database connection unavailable. This may be due to a port conflict. Please restart the application or contact support.',
          503
        );
      }
      
      // For development, return empty notes array instead of error
      if (process.env.NODE_ENV === 'development') {
        console.log('Using empty notes array due to database error in development');
        return formatApiResponse([]);
      }
      
      throw dbError; // Re-throw to be caught by outer catch
    }
    
  } catch (error) {
    console.error('Error fetching notes:', error);
    
    // Handle authentication errors specifically
    if (error.message.includes('Unauthorized')) {
      return formatApiResponse(null, error.message, 401);
    }
    
    // Handle database connection errors with a more user-friendly message
    if (error.message.includes('database connection unavailable') || 
        error.message.includes('port conflict') ||
        error.message.includes('connection refused')) {
      return formatApiResponse(
        null, 
        'Database connection unavailable. This may be due to a port conflict. Please restart the application or contact support.',
        503
      );
    }
    
    return formatApiResponse(null, error.message || 'Failed to fetch notes', 500);
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(request) {
  // Ensure database connection is available
  const connected = await ensureDatabaseConnection();
  if (!connected) {
    return formatApiResponse(
      null, 
      'Database connection not available. Please try again in a moment.',
      503
    );
  }
  
  try {
    // Validate the authentication token and get user ID
    const userId = await validateAuthToken(request);
    
    // Parse the request body
    const noteData = await request.json();
    
    // Validate required fields
    if (!noteData.patient_id || !noteData.content) {
      return formatApiResponse(null, 'Missing required fields: patient_id, content', 400);
    }
    
    // Add the user ID to the note data
    noteData.user_id = userId;
    
    // Add created_at timestamp if not provided
    if (!noteData.created_at) {
      noteData.created_at = new Date().toISOString();
    }
    
    // Save the note to the database
    try {
      const databaseService = await getDatabaseService();
      if (!databaseService) {
        console.error('GCP database service not available');
        return formatApiResponse(null, 'Database service unavailable', 500);
      }
      const savedNote = await databaseService.createNote(noteData);
      // Return the saved note
      return formatApiResponse(savedNote);
    } catch (dbError) {
      console.error('Database error creating note:', dbError);
      
      // Check for port conflict or proxy issues
      if (dbError.message && (dbError.message.includes('port conflict') || 
                             dbError.message.includes('connection refused') ||
                             dbError.message.includes('database connection unavailable'))) {
        return formatApiResponse(
          null,
          'Database connection unavailable. This may be due to a port conflict. Please restart the application or contact support.',
          503
        );
      }
      
      throw dbError; // Re-throw to be caught by outer catch
    }
    
  } catch (error) {
    console.error('Error creating note:', error);
    
    // Handle authentication errors specifically
    if (error.message.includes('Unauthorized')) {
      return formatApiResponse(null, error.message, 401);
    }
    
    // Handle database connection errors with a more user-friendly message
    if (error.message.includes('database connection unavailable') || 
        error.message.includes('port conflict') ||
        error.message.includes('connection refused')) {
      return formatApiResponse(
        null, 
        'Database connection unavailable. This may be due to a port conflict. Please restart the application or contact support.',
        503
      );
    }
    
    return formatApiResponse(null, error.message || 'Failed to create note', 500);
  }
}

/**
 * OPTIONS /api/notes - Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
