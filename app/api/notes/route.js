import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Dynamic import for CommonJS modules
let gcpDatabaseServicePromise = null;
function getGcpDatabaseService() {
  if (!gcpDatabaseServicePromise) {
    // Use a relative path instead of process.cwd()
    gcpDatabaseServicePromise = import('../../../backend/services/gcpDatabaseService.js')
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

// Helper function to ensure proxy is running in production
async function ensureProxyRunning() {
  // Only needed in production
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  try {
    console.log('Checking if Cloud SQL Proxy is running...');
    // Make a request to the proxy endpoint
    const response = await fetch(`${process.env.FRONTEND_URL || 'https://doctors-orders-sigma.vercel.app'}/api/proxy`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('Proxy status:', data);
    
    // If already running or started successfully, return true
    return data.status === 'already_running' || data.status === 'started';
  } catch (error) {
    console.error('Error ensuring proxy is running:', error);
    return false;
  }
}

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
export async function GET(request) {
  // Ensure proxy is running in production
  const proxyReady = await ensureProxyRunning();
  if (!proxyReady && process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      data: null,
      error: 'Database connection not available. Please try again in a moment.'
    }, { status: 503 });
  }
  
  try {
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
      
      // Initialize Supabase client properly
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return NextResponse.json(
          { data: null, error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      userId = user.id;
    }
    
    // Get query parameters for filtering and pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const patientId = url.searchParams.get('patientId');
    
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
      // Query the database for user's notes
      const notes = await gcpDatabaseService.getNotes(userId, {
        limit,
        offset,
        patientId
      });
      
      return NextResponse.json({
        data: notes,
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
    console.error('Error getting notes:', error);
    return NextResponse.json(
      { data: null, error: `Failed to get notes: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(request) {
  // Ensure proxy is running in production
  const proxyReady = await ensureProxyRunning();
  if (!proxyReady && process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      data: null,
      error: 'Database connection not available. Please try again in a moment.'
    }, { status: 503 });
  }
  
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
      
      // Initialize Supabase client properly
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
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
      // Extract patient info or create a new patient if needed
      let patientId = null;
      if (body.patient) {
        // Local implementation of findOrCreatePatient since it doesn't exist in the service
        const patientData = body.patient;
        
        try {
          // First try to find the patient by MRN if provided
          if (patientData.mrn) {
            // Search for patients with this MRN
            const patientsResult = await gcpDatabaseService.getPatients(userId, {
              searchTerm: patientData.mrn
            });
            
            if (patientsResult.patients && patientsResult.patients.length > 0) {
              // Found a patient with this MRN
              patientId = patientsResult.patients[0].id;
              console.log(`Found existing patient with MRN ${patientData.mrn}, ID: ${patientId}`);
            }
          }
          
          // If no patient found by MRN, try by name
          if (!patientId && patientData.name) {
            const nameParts = patientData.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            
            const patientsResult = await gcpDatabaseService.getPatients(userId, {
              searchTerm: patientData.name
            });
            
            if (patientsResult.patients && patientsResult.patients.length > 0) {
              // Found a patient with this name
              patientId = patientsResult.patients[0].id;
              console.log(`Found existing patient with name ${patientData.name}, ID: ${patientId}`);
            }
          }
          
          // If still no patient found, create a new one
          if (!patientId) {
            console.log('Creating new patient');
            const nameParts = patientData.name ? patientData.name.split(' ') : ['Unknown', 'Patient'];
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Patient';
            
            const newPatient = await gcpDatabaseService.createPatient({
              userId: userId,
              firstName: firstName,
              lastName: lastName,
              dateOfBirth: patientData.dob || null,
              gender: patientData.gender || null,
              mrn: patientData.mrn || null
            });
            
            patientId = newPatient.id;
            console.log(`Created new patient with ID: ${patientId}`);
          }
        } catch (patientError) {
          console.error('Error handling patient data:', patientError);
          // Continue without patient association if there's an error
        }
      }

      // Create note in the database
      const note = await gcpDatabaseService.createNote({
        userId: userId,
        patientId: patientId,
        title: body.title,
        transcript: body.transcript,
        templateId: body.template?.id,
        recordingTime: body.recordingTime,
        soapData: body.soapData,
        metadata: {
          source: 'dictation',
          timestamp: body.timestamp || new Date().toISOString()
        }
      });
      
      console.log('Note saved to GCP database:', note.id);
      
      // Return the created note
      return NextResponse.json({
        data: note,
        error: null
      });
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      return NextResponse.json(
        { data: null, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { data: null, error: `Failed to create note: ${error.message}` },
      { status: 500 }
    );
  }
}
