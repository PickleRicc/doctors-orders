import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    if (!body.title || !body.transcript) {
      return NextResponse.json(
        { data: null, error: 'Title and transcript are required' },
        { status: 400 }
      );
    }
    
    // Verify authentication (optional in dev)
    const authHeader = request.headers.get('authorization');
    let userId = 'dev-user';
    
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
    
    // Create note object
    const note = {
      id: Date.now().toString(), // Simple ID generation
      userId: userId,
      title: body.title,
      patient: body.patient,
      template: body.template,
      transcript: body.transcript,
      recordingTime: body.recordingTime,
      soapData: body.soapData,
      timestamp: body.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    // In development, we'll just return the note without actually saving it
    // In production, this would save to the database (Cloud SQL via GCP)
    console.log('Saving note:', note);
    
    // Return the created note
    return NextResponse.json({
      data: note,
      error: null
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { data: null, error: `Failed to create note: ${error.message}` },
      { status: 500 }
    );
  }
}
