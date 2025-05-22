import { NextResponse } from 'next/server';
import { validateAuthToken, formatApiResponse } from '../../auth/authUtils';
import { isDatabaseHealthy } from '../../database/connectionManager';

/**
 * Individual Note API Route
 * Handles operations for a specific note by ID
 * Uses direct SSL connection in production for better reliability
 */

// Dynamic import for CommonJS modules
let databaseServicePromise = null;
function getDatabaseService() {
  if (!databaseServicePromise) {
    // In production, use the serverless database service
    // In development, use the GCP database service with proxy
    const servicePath = process.env.NODE_ENV === 'production'
      ? '../../../../backend/services/serverlessDatabaseService.js'
      : '../../../../backend/services/gcpDatabaseService.js';
      
    databaseServicePromise = import(servicePath)
      .then(importedModule => {
        // Handle both ESM default exports and CommonJS module.exports
        return importedModule.default || importedModule;
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
    if (process.env.NODE_ENV === 'production') {
      return await isDatabaseHealthy();
    } else {
      // For development, import and use the proxy manager
      const { isProxyHealthy } = await import('../../proxy/proxyManager');
      return await isProxyHealthy();
    }
  } catch (error) {
    console.error('Error ensuring database connection:', error);
    return false;
  }
}

/**
 * GET /api/notes/[id]
 * Get a single note by ID
 */
export async function GET(request, { params }) {
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
    // Await params to fix Next.js warning
    const { id: noteId } = params;
    
    // Validate authentication using our utility
    const userId = await validateAuthToken(request);
    
    // Get the database service
    const databaseService = await getDatabaseService();
    
    if (!databaseService) {
      console.error('Database service not available');
      return formatApiResponse(null, 'Database service unavailable', 500);
    }
    
    try {
      // Query the database for the specific note
      const note = await databaseService.getNote(noteId, userId);
      
      if (!note) {
        return formatApiResponse(null, 'Note not found', 404);
      }
      
      return formatApiResponse(note);
    } catch (dbError) {
      console.error('Error retrieving from database:', dbError);
      return formatApiResponse(null, `Database error: ${dbError.message}`, 500);
    }
  } catch (error) {
    console.error('Error getting note:', error);
    
    // Handle authentication errors specifically
    if (error.message && error.message.includes('Unauthorized')) {
      return formatApiResponse(null, error.message, 401);
    }
    
    return formatApiResponse(null, `Failed to get note: ${error.message}`, 500);
  }
}

/**
 * PUT /api/notes/[id]
 * Update a note
 */
export async function PUT(request, { params }) {
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
    // Await params to fix Next.js warning
    const { id: noteId } = params;
    const body = await request.json();
    
    // Validate authentication using our utility
    const userId = await validateAuthToken(request);
    
    // Get the database service
    const databaseService = await getDatabaseService();
    
    if (!databaseService) {
      console.error('Database service not available');
      return formatApiResponse(null, 'Database service unavailable', 500);
    }
    
    try {
      // Extract the fields to update
      const updateData = {};
      
      // Only include fields that are allowed to be updated
      if (body.title) updateData.title = body.title;
      if (body.content) updateData.content = body.content;
      if (body.raw_transcript) updateData.raw_transcript = body.raw_transcript;
      if (body.soap_data) updateData.soap_data = body.soap_data;
      if (body.patient_id) updateData.patient_id = body.patient_id;
      
      // Update the note in the database
      const updatedNote = await databaseService.updateNote(noteId, updateData, userId);
      
      if (!updatedNote) {
        return formatApiResponse(null, 'Note not found', 404);
      }
      
      return formatApiResponse(updatedNote);
    } catch (dbError) {
      console.error('Error updating database:', dbError);
      return formatApiResponse(null, `Database error: ${dbError.message}`, 500);
    }
  } catch (error) {
    console.error('Error updating note:', error);
    
    // Handle authentication errors specifically
    if (error.message && error.message.includes('Unauthorized')) {
      return formatApiResponse(null, error.message, 401);
    }
    
    return formatApiResponse(null, `Failed to update note: ${error.message}`, 500);
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete a note
 */
export async function DELETE(request, { params }) {
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
    // Await params to fix Next.js warning
    const { id: noteId } = params;
    
    // Validate authentication using our utility
    const userId = await validateAuthToken(request);
    
    // Get the database service
    const databaseService = await getDatabaseService();
    
    if (!databaseService) {
      console.error('Database service not available');
      return formatApiResponse(null, 'Database service unavailable', 500);
    }
    
    try {
      // Delete the note from the database
      const result = await databaseService.deleteNote(noteId, userId);
      
      if (!result) {
        return formatApiResponse(null, 'Note not found', 404);
      }
      
      return formatApiResponse({ id: noteId, deleted: true });
    } catch (dbError) {
      console.error('Error deleting from database:', dbError);
      return formatApiResponse(null, `Database error: ${dbError.message}`, 500);
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    
    // Handle authentication errors specifically
    if (error.message && error.message.includes('Unauthorized')) {
      return formatApiResponse(null, error.message, 401);
    }
    
    return formatApiResponse(null, `Failed to delete note: ${error.message}`, 500);
  }
}

/**
 * OPTIONS /api/notes/[id] - Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
