"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { headers } from "next/headers";

/**
 * Server action for user sign-up
 * Follows Supabase best practices for Next.js App Router
 */
export const signUpAction = async (formData) => {
  try {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const fullName = formData.get("full_name")?.toString() || "";
    
    if (!email || !password) {
      return { error: "Email and password are required" };
    }
    
    // Create Supabase client with error handling
    let supabase;
    let headersList;
    let origin;
    
    try {
      supabase = await createClient();
      headersList = await headers();
      origin = headersList.get("origin");
      
      if (!origin) {
        // Fallback if origin header is missing
        origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      }
    } catch (clientErr) {
      console.error("Setup error:", clientErr);
      return { error: "Unable to connect to authentication service" };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { success: "Check your email to confirm your account" };
    } catch (authErr) {
      console.error("Sign-up error:", authErr);
      return { error: "Registration failed. Please try again." };
    }
  } catch (err) {
    console.error("Unexpected error in signUpAction:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
};

/**
 * Server action for user sign-in
 * Implements proper error handling as per project guidelines
 */
export const signInAction = async (formData) => {
  try {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    
    if (!email || !password) {
      return { error: "Email and password are required" };
    }
    
    // Create Supabase client with error handling
    let supabase;
    try {
      supabase = await createClient();
    } catch (clientErr) {
      console.error("Supabase client creation error:", clientErr);
      return { error: "Unable to connect to authentication service" };
    }

    // Attempt sign in with proper error handling
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Return success so the client can redirect instead of throwing NEXT_REDIRECT
      return { success: true, redirectTo: "/dashboard" };
    } catch (authErr) {
      console.error("Authentication error:", authErr);
      return { error: "Authentication failed. Please check your credentials and try again." };
    }
  } catch (err) {
    console.error("Unexpected error in signInAction:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
};

/**
 * Server action for user sign-out
 */
export const signOutAction = async () => {
  try {
    // Create Supabase client with error handling
    let supabase;
    try {
      supabase = await createClient();
    } catch (clientErr) {
      console.error("Supabase client creation error:", clientErr);
      return redirect("/");
    }

    // Attempt sign out with proper error handling
    try {
      await supabase.auth.signOut();
    } catch (signOutErr) {
      console.error("Sign out error:", signOutErr);
      // Still redirect to home even if there's an error
    }
    
    return redirect("/");
  } catch (err) {
    console.error("Unexpected error in signOutAction:", err);
    return redirect("/");
  }
};
