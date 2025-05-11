import { createClient } from "../../../supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback endpoint for handling Supabase authentication redirects
 * This is an essential part of the SSR authentication flow
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
