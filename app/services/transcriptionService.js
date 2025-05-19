/**
 * Transcription Service
 * Handles communication with the backend for transcription and SOAP note generation
 */

// Update to use port 3000 to match our API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Generate a SOAP note from a transcript using GCP Natural Language API
 * @param {string} transcript - The transcribed text
 * @param {Object} options - Optional parameters (template, patient info, etc.)
 * @returns {Promise<Object>} The generated SOAP note
 */
export async function generateSoapNote(transcript, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/transcription/soap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        transcript,
        options
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate SOAP note');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error generating SOAP note:', error);
    throw error;
  }
}

/**
 * Save a note to the database
 * @param {Object} noteData - The note data (title, transcript, SOAP sections, etc.)
 * @returns {Promise<Object>} The saved note
 */
export async function saveNote(noteData) {
  try {
    // First, generate the SOAP note if we only have a transcript
    let soapData = noteData.soapData;
    
    if (!soapData && noteData.transcript) {
      const options = {
        template: noteData.template,
        patientInfo: noteData.patient
      };
      
      soapData = await generateSoapNote(noteData.transcript, options);
    }
    
    // Then save the complete note
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        title: noteData.title,
        patient: noteData.patient,
        template: noteData.template,
        transcript: noteData.transcript,
        recordingTime: noteData.recordingTime,
        soapData,
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to save note');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
}

/**
 * Process audio directly with GCP Speech-to-Text (alternative to Web Speech API)
 * This is a fallback for browsers that don't support Web Speech API
 * @param {Blob|File|Base64String} audioData - The audio data to transcribe
 * @param {Object} options - Transcription options
 * @returns {Promise<Object>} The transcription result
 */
export async function transcribeAudio(audioData, options = {}) {
  try {
    // Convert File/Blob to base64 if needed
    let audioContent = audioData;
    
    if (audioData instanceof Blob || audioData instanceof File) {
      audioContent = await blobToBase64(audioData);
    }
    
    const response = await fetch(`${API_BASE_URL}/transcription/audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        audio: audioContent,
        options
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to transcribe audio');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Process audio and generate SOAP note in one request
 * @param {Blob|File|Base64String} audioData - The audio data to transcribe
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} The transcription and SOAP note
 */
export async function processAudioComplete(audioData, options = {}) {
  try {
    // Convert File/Blob to base64 if needed
    let audioContent = audioData;
    
    if (audioData instanceof Blob || audioData instanceof File) {
      audioContent = await blobToBase64(audioData);
    }
    
    const response = await fetch(`${API_BASE_URL}/transcription/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        audio: audioContent,
        options
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to process audio');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error processing audio:', error);
    throw error;
  }
}

// Helper function to convert Blob to base64
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper function to get auth token from Supabase
async function getAuthToken() {
  try {
    // For development, we can use a mock token
    if (process.env.NODE_ENV === 'development') {
      return localStorage.getItem('supabase.auth.token') || 'dev-token';
    }
    
    // In production, get the actual token from Supabase
    // Import is inside the function to avoid SSR issues
    const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    return session.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    
    // In development, fall back to a mock token
    if (process.env.NODE_ENV === 'development') {
      return 'dev-token';
    }
    
    throw error;
  }
}
