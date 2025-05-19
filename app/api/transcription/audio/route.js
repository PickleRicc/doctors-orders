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
 * POST /api/transcription/audio
 * Transcribe audio using Google Speech-to-Text
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    if (!body.audio) {
      return NextResponse.json(
        { data: null, error: 'Audio data is required' },
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
    
    const audioData = body.audio;
    const options = body.options || {};
    
    try {
      // Try to use the GCP service directly
      const gcpService = await getGcpService();
      
      if (gcpService) {
        console.log('Using GCP service for audio transcription');
        
        // Check if we have the transcribeAudio method
        if (typeof gcpService.transcribeAudio === 'function') {
          const transcription = await gcpService.transcribeAudio(audioData, options);
          return NextResponse.json({ data: transcription, error: null });
        } else {
          console.error('GCP service loaded but transcribeAudio method not found');
          throw new Error('GCP service method not found');
        }
      } else {
        // Fall back to mock if GCP service is not available
        console.log('GCP service not available, using mock transcription');
        
        // Simple mock transcription
        const mockTranscription = {
          transcript: "This is a mock transcription. The GCP service is not available.",
          confidence: 0.8,
          generatedBy: 'fallback'
        };
        
        return NextResponse.json({ data: mockTranscription, error: null });
      }
    } catch (serviceError) {
      console.error('Error using GCP service:', serviceError);
      
      // Fall back to mock on error
      console.log('Error with GCP service, using mock transcription');
      
      // Simple mock transcription
      const mockTranscription = {
        transcript: "This is a mock transcription. There was an error with the GCP service.",
        confidence: 0.7,
        generatedBy: 'fallback'
      };
      
      return NextResponse.json({ data: mockTranscription, error: null });
    }
    
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { data: null, error: `Failed to transcribe audio: ${error.message}` },
      { status: 500 }
    );
  }
}
