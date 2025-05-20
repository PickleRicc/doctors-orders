import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Dynamic import for CommonJS modules
let gcpDatabaseServicePromise = null;
function getGcpDatabaseService() {
  if (!gcpDatabaseServicePromise) {
    // Use a relative path instead of process.cwd()
    gcpDatabaseServicePromise = import('../../../../backend/services/gcpDatabaseService.js')
      .then(module => {
        // Handle both ESM default exports and CommonJS module.exports
        return module.default || module;
      })
      .catch(err => {
        console.error('Error importing GCP database service:', err);
        return null;
      });
  }
  return gcpDatabaseServicePromise;
}

/**
 * GET /api/notes/[id]
 * Get a single note by ID
 */
export async function GET(request, { params }) {
  try {
    // Await params to fix Next.js warning
    const { id: noteId } = params;
    
    // Verify authentication (optional in dev)
    const authHeader = request.headers.get('authorization');
    // Use a valid UUID for dev mode instead of a string
    let userId = '00000000-0000-0000-0000-000000000000'; // Valid UUID for dev mode
    
    if (process.env.NODE_ENV === 'production') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { data: null, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json(
          { data: null, error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      userId = user.id;
    }
    
    // Get the GCP database service
    const gcpDatabaseService = await getGcpDatabaseService();
    
    if (!gcpDatabaseService) {
      console.error('GCP database service not available');
      return NextResponse.json(
        { data: null, error: 'Database service unavailable' },
        { status: 500 }
      );
    }
    
    try {
      // Query the database for the specific note
      const note = await gcpDatabaseService.getNoteById(noteId, userId);
      
      if (!note) {
        return NextResponse.json(
          { data: null, error: 'Note not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        data: note,
        error: null
      });
    } catch (dbError) {
      console.error('Error retrieving from database:', dbError);
      return NextResponse.json(
        { data: null, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error getting note:', error);
    return NextResponse.json(
      { data: null, error: `Failed to get note: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notes/[id]
 * Update a note
 */
export async function PUT(request, { params }) {
  try {
    // Await params to fix Next.js warning
    const { id: noteId } = params;
    const body = await request.json();
    
    // Verify authentication (optional in dev)
    const authHeader = request.headers.get('authorization');
    // Use a valid UUID for dev mode instead of a string
    let userId = '00000000-0000-0000-0000-000000000000'; // Valid UUID for dev mode
    
    if (process.env.NODE_ENV === 'production') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { data: null, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json(
          { data: null, error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      userId = user.id;
    }
    
    // Get the GCP database service
    const gcpDatabaseService = await getGcpDatabaseService();
    
    if (!gcpDatabaseService) {
      console.error('GCP database service not available');
      return NextResponse.json(
        { data: null, error: 'Database service unavailable' },
        { status: 500 }
      );
    }
    
    try {
      // Extract the fields to update
      const updateData = {};
      
      // Only include fields that are allowed to be updated
      if (body.title) updateData.title = body.title;
      if (body.transcript) updateData.transcript = body.transcript;
      if (body.soapData) updateData.soapData = body.soapData;
      if (body.patientId) updateData.patientId = body.patientId;
      
      // Update the note in the database
      const updatedNote = await gcpDatabaseService.updateNote(noteId, userId, updateData);
      
      if (!updatedNote) {
        return NextResponse.json(
          { data: null, error: 'Note not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        data: updatedNote,
        error: null
      });
    } catch (dbError) {
      console.error('Error updating database:', dbError);
      return NextResponse.json(
        { data: null, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { data: null, error: `Failed to update note: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete a note
 */
export async function DELETE(request, { params }) {
  try {
    // Await params to fix Next.js warning
    const { id: noteId } = params;
    
    // Verify authentication (optional in dev)
    const authHeader = request.headers.get('authorization');
    // Use a valid UUID for dev mode instead of a string
    let userId = '00000000-0000-0000-0000-000000000000'; // Valid UUID for dev mode
    
    if (process.env.NODE_ENV === 'production') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { data: null, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json(
          { data: null, error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      userId = user.id;
    }
    
    // Get the GCP database service
    const gcpDatabaseService = await getGcpDatabaseService();
    
    if (!gcpDatabaseService) {
      console.error('GCP database service not available');
      return NextResponse.json(
        { data: null, error: 'Database service unavailable' },
        { status: 500 }
      );
    }
    
    try {
      // Delete the note from the database
      const result = await gcpDatabaseService.deleteNote(noteId, userId);
      
      if (!result) {
        return NextResponse.json(
          { data: null, error: 'Note not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        data: { id: noteId, deleted: true },
        error: null
      });
    } catch (dbError) {
      console.error('Error deleting from database:', dbError);
      return NextResponse.json(
        { data: null, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { data: null, error: `Failed to delete note: ${error.message}` },
      { status: 500 }
    );
  }
}
