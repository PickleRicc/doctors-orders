"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { headers } from "next/headers";

/**
 * Server action for user sign-up
 * Follows Supabase best practices for Next.js App Router
 */
export const signUpAction = async (formData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

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
};

/**
 * Server action for user sign-in
 * Implements proper error handling as per project guidelines
 */
export const signInAction = async (formData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Return success so the client can redirect instead of throwing NEXT_REDIRECT
    return { success: true, redirectTo: "/dashboard" };
  } catch (err) {
    console.error("Authentication error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
};

/**
 * Server action for user sign-out
 */
export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};
