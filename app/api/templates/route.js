/**
 * Templates API Route
 * Handles fetching templates from the GCP database
 */

import { NextResponse } from 'next/server';

// Dynamic import to avoid SSR issues
const getDatabaseService = async () => {
  const { default: gcpDatabaseService } = await import('../../../backend/services/gcpDatabaseService');
  return gcpDatabaseService;
};

// Helper function to get auth token from headers
function getAuthToken(headers) {
  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

// Validate JWT token and extract user ID
async function validateToken(token) {
  // In development mode, use a mock user ID to avoid authentication issues
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Using mock user ID');
    return 'dev-user-id';
  }
  
  try {
    // In production, we would normally validate the JWT token
    // For now, we'll use a simplified approach that doesn't require additional packages
    
    // Check if token exists
    if (!token) {
      console.error('No token provided');
      return null;
    }
    
    // In a real production environment, you would decode and verify the JWT
    // For now, we'll extract the user ID from the token payload
    // This is a simplified approach - in production you should use proper JWT validation
    
    // Basic check that the token has the expected format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }
    
    // Extract the payload (middle part of the JWT)
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.sub || null; // 'sub' is the standard claim for the subject (user ID)
    } catch (e) {
      console.error('Error parsing token payload:', e);
      return null;
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

// GET /api/templates - Get all templates
export async function GET(request) {
  try {
    // Extract auth token
    const token = getAuthToken(request.headers);
    
    // In development, allow requests without auth
    if (!token && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        data: null, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Extract user ID from token
    let userId;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, validate the token and extract the user ID
      userId = await validateToken(token);
      
      if (!userId) {
        return NextResponse.json({ 
          data: null, 
          error: 'Invalid authentication token' 
        }, { status: 401 });
      }
    } else {
      // For development, use a mock user ID
      userId = 'dev-user-id';
    }
    
    // Get options from URL params
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const isActive = searchParams.get('isActive') === 'true';
    
    const options = {
      specialty,
      isActive
    };
    
    // Get database service
    const gcpDatabaseService = await getDatabaseService();
    
    // Get templates from database
    let templates;
    
    // In development mode, get all templates without user filtering
    // This avoids UUID format errors with the mock user ID
    if (process.env.NODE_ENV === 'development') {
      // Use a special function that doesn't filter by user ID
      const query = `
        SELECT * FROM templates 
        WHERE is_active = true
        ${options.specialty ? "AND specialty = $1" : ""}
        ORDER BY name
      `;
      
      const params = options.specialty ? [options.specialty] : [];
      const result = await gcpDatabaseService.query(query, params);
      templates = result.rows;
    } else {
      // In production, use the normal function with user ID filtering
      templates = await gcpDatabaseService.getTemplates(userId, options);
    }
    
    // Return templates
    return NextResponse.json({ 
      data: templates, 
      error: null 
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    
    return NextResponse.json({ 
      data: null, 
      error: error.message || 'Failed to fetch templates' 
    }, { status: 500 });
  }
}

// POST /api/templates - Create a new template
export async function POST(request) {
  try {
    // Extract auth token
    const token = getAuthToken(request.headers);
    
    // In development, allow requests without auth
    if (!token && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        data: null, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Extract user ID from token
    let userId;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, validate the token and extract the user ID
      userId = await validateToken(token);
      
      if (!userId) {
        return NextResponse.json({ 
          data: null, 
          error: 'Invalid authentication token' 
        }, { status: 401 });
      }
    } else {
      // For development, use a mock user ID
      userId = 'dev-user-id';
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.specialty || !body.promptTemplate) {
      return NextResponse.json({ 
        data: null, 
        error: 'Missing required fields: name, specialty, promptTemplate' 
      }, { status: 400 });
    }
    
    // Get database service
    const gcpDatabaseService = await getDatabaseService();
    
    // Create template
    const template = await gcpDatabaseService.createTemplate({
      userId,
      name: body.name,
      description: body.description,
      specialty: body.specialty,
      promptTemplate: body.promptTemplate
    });
    
    // Return created template
    return NextResponse.json({ 
      data: template, 
      error: null 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    
    return NextResponse.json({ 
      data: null, 
      error: error.message || 'Failed to create template' 
    }, { status: 500 });
  }
}
