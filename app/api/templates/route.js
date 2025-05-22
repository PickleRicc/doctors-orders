/**
 * Templates API Route
 * Handles fetching templates from the database
 * Uses direct SSL connection in production for better reliability
 */

import { NextResponse } from 'next/server';
import { validateAuthToken, formatApiResponse } from '../auth/authUtils';
import { isDatabaseHealthy } from '../database/connectionManager';

// Dynamic import to avoid SSR issues
const getDatabaseService = async () => {
  // In production, use the serverless database service
  // In development, use the GCP database service with proxy
  const servicePath = process.env.NODE_ENV === 'production'
    ? '../../../backend/services/serverlessDatabaseService.js'
    : '../../../backend/services/gcpDatabaseService.js';
    
  const importedModule = await import(servicePath);
  return importedModule.default || importedModule;
};

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
      const { isProxyHealthy, startProxy } = await import('../proxy/proxyManager');
      
      // Check if proxy is healthy
      const healthy = await isProxyHealthy();
      
      // If not healthy, try to start it
      if (!healthy) {
        console.log('Database proxy not healthy, attempting to start...');
        const result = await startProxy();
        return result.healthy;
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error ensuring database connection:', error);
    return false;
  }
}

// GET /api/templates - Get all templates
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
    
    try {
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
    } catch (dbError) {
      console.error('Database error fetching templates:', dbError);
      
      // Check for port conflict or proxy issues
      if (dbError.message && dbError.message.includes('port conflict')) {
        return formatApiResponse(
          null,
          'Database connection unavailable due to port conflict. Please restart the application or contact support.',
          503
        );
      }
      
      // Use fallback templates if database query fails
      console.log('Using fallback templates due to database error');
      templates = [
        { 
          id: "default", 
          name: "Default SOAP Note", 
          description: "Standard SOAP format for medical documentation",
          specialty: "General",
          prompt_template: "Create a comprehensive SOAP note based on the following transcription: {{transcription}}"
        }
      ];
    }
    
    // Return templates
    return formatApiResponse(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    
    // Handle authentication errors specifically
    if (error.message.includes('Unauthorized')) {
      return formatApiResponse(null, error.message, 401);
    }
    
    // Handle database connection errors with a more user-friendly message
    if (error.message.includes('database connection unavailable') || 
        error.message.includes('port conflict')) {
      return formatApiResponse(
        null, 
        'Database connection unavailable. This may be due to a port conflict. Please restart the application or contact support.',
        503
      );
    }
    
    return formatApiResponse(null, error.message || 'Failed to fetch templates', 500);
  }
}

// POST /api/templates - Create a new template
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
    // Validate authentication using our utility
    const userId = await validateAuthToken(request);
    
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
    
    // Return the created template
    return formatApiResponse(template);
  } catch (error) {
    console.error('Error creating template:', error);
    
    // Handle authentication errors specifically
    if (error.message.includes('Unauthorized')) {
      return formatApiResponse(null, error.message, 401);
    }
    
    return formatApiResponse(null, error.message || 'Failed to create template', 500);
  }
}

/**
 * OPTIONS /api/templates - Handle CORS preflight requests
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
