import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();

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
  ],
};
