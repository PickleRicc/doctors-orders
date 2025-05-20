import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Middleware function to handle CORS
export function corsMiddleware(request) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '*';
  
  // Only apply CORS headers to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Create a response object
    const response = NextResponse.next();
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export async function middleware(req) {
  const res = await corsMiddleware(req);

  if (res) return res;

  try {
    // Create Supabase client for auth checks
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll().map(({ name, value }) => ({
              name,
              value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Get session safely with error handling
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth error in middleware:', error.message);
      // Continue the request but session will be null
    }
    
    const session = data?.session;

    // Protect routes that require authentication
    if (
      (req.nextUrl.pathname.startsWith("/dashboard") ||
       req.nextUrl.pathname.startsWith("/notes") ||
       req.nextUrl.pathname.startsWith("/dictation") ||
       req.nextUrl.pathname.startsWith("/settings") ||
       req.nextUrl.pathname.startsWith("/subscription")) && 
      !session
    ) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    
    // Redirect authenticated users away from auth pages
    if (
      (req.nextUrl.pathname.startsWith("/auth/signin") ||
       req.nextUrl.pathname.startsWith("/auth/signup")) &&
      session
    ) {
      // Success page is an exception - users should still be able to see it
      if (!req.nextUrl.pathname.startsWith("/auth/success")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    
    return res;
  } catch (e) {
    console.error('Unexpected error in middleware:', e);
    // Allow the request to continue to avoid blocking legitimate traffic
    // The user will likely be redirected if authentication is required downstream
    return res;
  }
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/webhook).*)",
    '/api/:path*',
  ],
};
