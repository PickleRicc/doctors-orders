"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "../../utils/store/onboardingStore";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import Step1Role from "../../components/onboarding/Step1Role";
import Step2Frustrations from "../../components/onboarding/Step2Frustrations";
import Step3Value from "../../components/onboarding/Step3Value";
import Step4Subscription from "../../components/onboarding/Step4Subscription";

/**
 * Main onboarding page that manages the flow between different steps
 * Integrates with the registration process
 */
export default function OnboardingPage() {
  const { currentStep, email, password, fullName } = useOnboardingStore();
  const router = useRouter();
  
  // Ensure onboarding is accessed only after initial registration info
  useEffect(() => {
    if (!email || !password || !fullName) {
      router.push("/auth/signup");
    }
  }, [email, password, fullName, router]);
  
  // Render the appropriate step based on currentStep
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Role />;
      case 1:
        return <Step2Frustrations />;
      case 2:
        return <Step3Value />;
      case 3:
        return <Step4Subscription />;
      default:
        return <Step1Role />;
    }
  };
  
  // If no registration info, show loading until redirect
  if (!email || !password || !fullName) {
    return (
      <OnboardingLayout showBackButton={false}>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Preparing your onboarding experience...</p>
        </div>
      </OnboardingLayout>
    );
  }
  
  return (
    <OnboardingLayout>
      {renderStep()}
    </OnboardingLayout>
  );
}
