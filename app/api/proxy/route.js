import { NextResponse } from 'next/server';
import { startProxy, isProxyHealthy } from './proxyManager';

/**
 * Handles API requests to start and check the Cloud SQL Proxy
 * This endpoint is used by both the frontend and backend to ensure database connectivity
 */

/**
 * GET /api/proxy - Start or check the Cloud SQL Proxy
 * @param {Request} request - The incoming request
 * @returns {Response} JSON response with proxy status
 */
export async function GET(request) {
  try {
    // Check if we need to check health only
    const url = new URL(request.url);
    const checkOnly = url.searchParams.get('check') === 'true';
    
    if (checkOnly) {
      const healthy = await isProxyHealthy();
      return NextResponse.json({
        status: healthy ? 'healthy' : 'unhealthy',
        message: healthy ? 'Proxy is running and connected' : 'Proxy is not healthy'
      });
    }
    
    // Start or restart the proxy
    const result = await startProxy();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in proxy API:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/proxy - Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
