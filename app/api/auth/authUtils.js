/**
 * Authentication Utilities for API Routes
 * Provides standardized authentication handling for all API endpoints
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Validates authentication token and returns user ID
 * Works in both development and production environments
 * @param {Request} request - The incoming request object
 * @returns {Promise<string>} The authenticated user ID
 * @throws {Error} If authentication fails
 */
export async function validateAuthToken(request) {
  // Development mode uses a consistent UUID
  if (process.env.NODE_ENV === 'development') {
    return '00000000-0000-0000-0000-000000000000';
  }
  
  // Get authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // Initialize Supabase admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Verify the token
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    throw new Error('Unauthorized: Invalid token');
  }
  
  return data.user.id;
}

/**
 * Standard API response formatter
 * @param {any} data - The response data
 * @param {string|null} error - The error message, if any
 * @param {number} status - The HTTP status code
 * @returns {Response} A formatted Response object
 */
export function formatApiResponse(data = null, error = null, status = 200) {
  return new Response(
    JSON.stringify({ data, error }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}
