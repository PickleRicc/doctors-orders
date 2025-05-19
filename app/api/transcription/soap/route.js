import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Dynamic import for CommonJS modules
let gcpServicePromise = null;
function getGcpService() {
  if (!gcpServicePromise) {
    // Use a relative path instead of process.cwd()
    gcpServicePromise = import('../../../../backend/services/gcpService.js')
      .then(module => {
        // Handle both ESM default exports and CommonJS module.exports
        return module.default || module;
      })
      .catch(err => {
        console.error('Error importing GCP service:', err);
        return null;
      });
  }
  return gcpServicePromise;
}

/**
 * POST /api/transcription/soap
 * Generate SOAP note from transcript
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    if (!body.transcript) {
      return NextResponse.json(
        { data: null, error: 'Transcript is required' },
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
    
    const transcript = body.transcript;
    const options = body.options || {};
    
    try {
      // Try to use the GCP service directly
      const gcpService = await getGcpService();
      
      if (gcpService) {
        console.log('Using GCP service for SOAP note generation');
        
        // Check if we have the generateSoapNote method
        if (typeof gcpService.generateSoapNote === 'function') {
          const soapNote = await gcpService.generateSoapNote(transcript, options);
          return NextResponse.json({ data: soapNote, error: null });
        } else {
          console.error('GCP service loaded but generateSoapNote method not found');
          throw new Error('GCP service method not found');
        }
      } else {
        // Fall back to mock if GCP service is not available
        console.log('GCP service not available, using mock SOAP note generation');
        
        // Simple mock SOAP note structure
        const mockSoapNote = {
          subjective: transcript.substring(0, Math.min(300, transcript.length)),
          objective: "Potential conditions identified: None identified",
          assessment: "Assessment based on transcription analysis.",
          plan: "Potential medications mentioned: None identified",
          rawTranscription: transcript,
          entities: [],
          generatedBy: 'fallback',
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json({ data: mockSoapNote, error: null });
      }
    } catch (serviceError) {
      console.error('Error using GCP service:', serviceError);
      
      // Fall back to mock on error
      console.log('Error with GCP service, using mock SOAP note generation');
      
      // Simple mock SOAP note structure
      const mockSoapNote = {
        subjective: transcript.substring(0, Math.min(300, transcript.length)),
        objective: "Potential conditions identified: None identified",
        assessment: "Assessment based on transcription analysis.",
        plan: "Potential medications mentioned: None identified",
        rawAnalysis: {
          entities: [],
          medicalEntities: [],
          sentiment: {},
          categories: [{ name: 'Health', confidence: 0.9 }],
          language: 'en'
        },
        generatedBy: 'fallback',
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json({ data: mockSoapNote, error: null });
    }
    
  } catch (error) {
    console.error('Error generating SOAP note:', error);
    return NextResponse.json(
      { data: null, error: `Failed to generate SOAP note: ${error.message}` },
      { status: 500 }
    );
  }
}
