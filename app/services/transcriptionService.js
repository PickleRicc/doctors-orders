/**
 * Transcription Service
 * Handles communication with the backend for transcription and SOAP note generation
 */

// Use a relative URL that works in all environments
const API_BASE_URL = '/api';

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
        templateName: noteData.templateName || '', // Include template name for consistency
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

/**
 * Fetch templates from the database
 * @param {Object} options - Query options (specialty, isActive)
 * @returns {Promise<Array>} List of templates
 */
export async function getTemplates(options = {}) {
  try {
    // Build query string from options
    const queryParams = new URLSearchParams();
    if (options.specialty) queryParams.append('specialty', options.specialty);
    if (options.isActive !== undefined) queryParams.append('isActive', options.isActive);
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/templates${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch templates');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

/**
 * Create a new template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Created template
 */
export async function createTemplate(templateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify(templateData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create template');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

// Helper function to get auth token from Supabase
async function getAuthToken() {
  // For development, use a mock token
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Using mock auth token');
    return 'dev-token';
  }
  
  try {
    // In production, get the token from Supabase client
    // First try to get it from the Supabase client directly if available
    if (typeof window !== 'undefined' && window.supabase) {
      try {
        const { data } = await window.supabase.auth.getSession();
        if (data && data.session && data.session.access_token) {
          return data.session.access_token;
        }
      } catch (e) {
        console.log('Could not get token from Supabase client:', e);
        // Continue to fallback methods
      }
    }
    
    // Fallback to storage methods
    const getTokenFromStorage = () => {
      if (typeof window === 'undefined') return null;
      
      // Try to parse the Supabase cookie first (most reliable)
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'sb-access-token') {
            return decodeURIComponent(value);
          }
        }
      } catch (e) {
        console.log('Error parsing cookies:', e);
      }
      
      // Check different possible storage keys
      const possibleKeys = [
        'sb:token',  // New Supabase key format
        'supabase.auth.token',
        'sb-auth-token',
        'supabase.auth.access_token'
      ];
      
      // Check localStorage
      for (const key of possibleKeys) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            // Handle both raw tokens and JSON objects
            try {
              const parsed = JSON.parse(item);
              if (parsed.access_token) return parsed.access_token;
              if (parsed.token && parsed.token.access_token) return parsed.token.access_token;
            } catch {
              // If not JSON, it might be the raw token
              return item;
            }
          }
        } catch (e) {
          console.log(`Error accessing localStorage key ${key}:`, e);
        }
      }
      
      // Try session storage as last resort
      for (const key of possibleKeys) {
        try {
          const item = sessionStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              if (parsed.access_token) return parsed.access_token;
              if (parsed.token && parsed.token.access_token) return parsed.token.access_token;
            } catch {
              return item;
            }
          }
        } catch (e) {
          console.log(`Error accessing sessionStorage key ${key}:`, e);
        }
      }
      
      return null;
    };
    
    const token = getTokenFromStorage();
    
    if (token) {
      return token;
    }
    
    // If no token is found, redirect to sign-in page but don't do it immediately
    // This prevents redirect loops
    console.warn('No auth token found, will redirect to sign-in page');
    setTimeout(() => {
      window.location.href = '/auth/signin?redirectTo=' + encodeURIComponent(window.location.pathname);
    }, 100);
    
    // Return a temporary token to prevent immediate errors
    // The redirect will happen before this token is used
    return 'redirecting';
  } catch (error) {
    console.error('Error getting auth token:', error);
    
    // In development, fall back to a mock token
    if (process.env.NODE_ENV === 'development') {
      return 'dev-token';
    }
    
    // In production with error, redirect to sign-in page with a delay
    setTimeout(() => {
      window.location.href = '/auth/signin?redirectTo=' + encodeURIComponent(window.location.pathname);
    }, 100);
    throw error;
  }
}
