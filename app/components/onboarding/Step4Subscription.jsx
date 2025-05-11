"use client";

import { useState, useEffect } from "react";
import { useOnboardingStore } from "../../utils/store/onboardingStore";
import { SectionTitle, OptionButton, ContinueButton } from "./OnboardingComponents";
import { signUpAction } from "../../actions";
import { saveOnboardingData } from "../../actions/onboarding";
import { useRouter } from "next/navigation";

/**
 * Step 4: Subscription Framing
 * Presents subscription options and completes the onboarding process
 */
export default function Step4Subscription() {
  const { 
    email,
    password,
    fullName,
    payingForTimeSavings, 
    setPayingForTimeSavings,
    preferredPlan,
    setPreferredPlan,
    reset
  } = useOnboardingStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Reset onboarding store on initial load
  useEffect(() => {
    // No need to reset here as we want to keep the data from previous steps
  }, []);
  
  // Available options for payment willingness
  const paymentOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'Maybe', label: 'Maybe' },
    { value: 'No', label: 'No' },
  ];
  
  // Available plan options
  const planOptions = [
    { 
      value: 'Free Starter Plan', 
      label: '🆓 Free Starter Plan – Up to 5 notes per month',
      description: 'Perfect for occasional use or to try out the service'
    },
    { 
      value: 'Pro Monthly', 
      label: '💼 Pro Monthly – Unlimited notes + AI + PDF export',
      description: 'Best for regular clinical documentation' 
    },
    { 
      value: 'Not Sure Yet', 
      label: '🕒 Not Sure Yet – Let me explore first',
      description: 'You can upgrade anytime' 
    },
  ];
  
  // Handle completion of the onboarding process
  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get all the data we need from the store before async operations
      // This prevents trying to access the store inside async functions
      const storeData = {
        email,
        password,
        fullName,
        primaryRole: useOnboardingStore.getState().primaryRole || '',
        currentDocumentationMethod: useOnboardingStore.getState().currentDocumentationMethod || '',
        dailyDocumentationHours: useOnboardingStore.getState().dailyDocumentationHours || 0,
        documentationFrustrations: useOnboardingStore.getState().documentationFrustrations || [],
        delayedDocumentation: useOnboardingStore.getState().delayedDocumentation === true,
        usingSpeechToText: useOnboardingStore.getState().usingSpeechToText === true,
        currentSpeechToTextTool: useOnboardingStore.getState().currentSpeechToTextTool || '',
        timeSavingPriority: useOnboardingStore.getState().timeSavingPriority || '',
        valueRealtimeDictation: useOnboardingStore.getState().valueRealtimeDictation === true,
        valueAiSoapStructure: useOnboardingStore.getState().valueAiSoapStructure === true,
        valueAutoSyncExport: useOnboardingStore.getState().valueAutoSyncExport === true,
        dailyNoteCount: useOnboardingStore.getState().dailyNoteCount || 0,
        payingForTimeSavings: useOnboardingStore.getState().payingForTimeSavings || '',
        preferredPlan: useOnboardingStore.getState().preferredPlan || ''
      };
      
      // Create form data with registration information
      const registrationData = new FormData();
      registrationData.append("email", storeData.email);
      registrationData.append("password", storeData.password);
      registrationData.append("full_name", storeData.fullName);
      
      // Attempt to sign up the user
      const signUpResult = await signUpAction(registrationData);
      
      if (signUpResult?.error) {
        setError(signUpResult.error);
        setIsSubmitting(false);
        return;
      }

      console.log("User registration successful");
      
      try {
        // Prepare onboarding data for submission
        const onboardingData = new FormData();
        
        // Add all relevant onboarding data fields, with fallbacks for null values
        onboardingData.append("primaryRole", storeData.primaryRole);
        onboardingData.append("currentDocumentationMethod", storeData.currentDocumentationMethod);
        onboardingData.append("dailyDocumentationHours", storeData.dailyDocumentationHours);
        onboardingData.append("documentationFrustrations", JSON.stringify(storeData.documentationFrustrations));
        onboardingData.append("delayedDocumentation", storeData.delayedDocumentation ? 'true' : 'false');
        onboardingData.append("usingSpeechToText", storeData.usingSpeechToText ? 'true' : 'false');
        onboardingData.append("currentSpeechToTextTool", storeData.currentSpeechToTextTool);
        onboardingData.append("timeSavingPriority", storeData.timeSavingPriority);
        onboardingData.append("valueRealtimeDictation", storeData.valueRealtimeDictation ? 'true' : 'false');
        onboardingData.append("valueAiSoapStructure", storeData.valueAiSoapStructure ? 'true' : 'false');
        onboardingData.append("valueAutoSyncExport", storeData.valueAutoSyncExport ? 'true' : 'false');
        onboardingData.append("dailyNoteCount", storeData.dailyNoteCount);
        onboardingData.append("payingForTimeSavings", storeData.payingForTimeSavings);
        onboardingData.append("preferredPlan", storeData.preferredPlan);
        
        // Submit onboarding data
        const onboardingResult = await saveOnboardingData(onboardingData);
        
        if (onboardingResult?.error) {
          console.error("Onboarding data save error:", onboardingResult.error);
          // Continue anyway - the user account is created, we'll redirect regardless
        } else {
          console.log("Onboarding data saved successfully");
        }
      } catch (onboardingError) {
        console.error("Error during onboarding data submission:", onboardingError);
        // We'll still proceed with redirection even if onboarding data saving fails
      }
      
      // Reset the store
      reset();
      
      // Always redirect to success page - auth callback will redirect to dashboard from there
      router.push("/auth/success");
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred during registration. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <SectionTitle>Would getting back 20+ hours a month be worth paying for?</SectionTitle>
      
      <div className="mb-6">
        {paymentOptions.map((option) => (
          <OptionButton
            key={option.value}
            label={option.value}
            selected={payingForTimeSavings === option.value}
            onClick={() => setPayingForTimeSavings(option.value)}
          />
        ))}
      </div>
      
      <SectionTitle>Which of these options best fits your current needs?</SectionTitle>
      
      <div className="mb-6">
        {planOptions.map((plan) => (
          <div key={plan.value} className="mb-4">
            <OptionButton
              label={plan.label}
              selected={preferredPlan === plan.value}
              onClick={() => setPreferredPlan(plan.value)}
            />
            {preferredPlan === plan.value && (
              <p className="text-sm text-gray-600 -mt-2 mb-3 ml-4">
                {plan.description}
              </p>
            )}
          </div>
        ))}
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="mt-6">
        <ContinueButton 
          onClick={handleComplete}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? "Creating Account..." : "Start Free – 5 Notes On Us"}
        </ContinueButton>
        <p className="text-center text-sm text-gray-600">
          🔒 HIPAA-aligned, secure, and built for your real-world workflow.
        </p>
      </div>
    </>
  );
}
