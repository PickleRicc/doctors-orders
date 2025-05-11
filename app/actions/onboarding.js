"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server action to save onboarding data to the database
 * Stores user preferences and insights from the onboarding process
 */
export async function saveOnboardingData(formData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { error: "You must be logged in to complete onboarding" };
    }
    
    const userId = session.user.id;
    
    // Parse form data 
    const payload = {};
    for (const [key, value] of formData.entries()) {
      try {
        // Try to parse as JSON if applicable (for arrays and objects)
        payload[key] = JSON.parse(value);
      } catch (e) {
        // Otherwise store as string
        payload[key] = value;
      }
    }
    
    // Log payload for debugging
    console.log("Onboarding payload:", payload);
    
    // Convert boolean-like values properly
    const safeBoolean = (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return null; // For null or undefined values
    };

    // Prepare onboarding data with proper types
    const onboardingData = {
      id: userId, // Changed from user_id to id to match the schema
      primary_role: payload.primaryRole || '',
      current_documentation_method: payload.currentDocumentationMethod || '', // Fixed column name
      daily_documentation_hours: Math.round(parseFloat(payload.dailyDocumentationHours) || 0), // Convert to integer for DB schema
      documentation_frustrations: Array.isArray(payload.documentationFrustrations) 
        ? payload.documentationFrustrations 
        : [],
      delayed_documentation: safeBoolean(payload.delayedDocumentation),
      using_speech_to_text: safeBoolean(payload.usingSpeechToText),
      current_speech_to_text_tool: payload.currentSpeechToTextTool || '', // Fixed column name
      time_saving_priority: payload.timeSavingPriority || '',
      value_realtime_dictation: safeBoolean(payload.valueRealtimeDictation),
      value_ai_soap_structure: safeBoolean(payload.valueAiSoapStructure),
      value_auto_sync_export: safeBoolean(payload.valueAutoSyncExport),
      daily_note_count: parseInt(payload.dailyNoteCount || 0),
      paying_for_time_savings: payload.payingForTimeSavings || '',
      preferred_plan: payload.preferredPlan || '',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(), // Fixed column name
    };
    
    console.log("Processed onboarding data:", onboardingData);
    
    // Insert user onboarding data
    const { error: insertError } = await supabase
      .from('user_onboarding')
      .upsert(onboardingData);
    
    if (insertError) {
      console.error("Error saving onboarding data:", insertError);
      return { error: "Failed to save onboarding data. Please try again." };
    }
    
    // Update the user's profile if needed - note: we're not updating onboarding status in profiles table
    // because those columns don't exist in the schema
    try {
      // Instead, just log that onboarding is complete - actual onboarding data is in user_onboarding table
      console.log("Onboarding completed for user ID:", userId);
    } catch (error) {
      console.warn("Non-critical error:", error);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Onboarding action error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
