"use client";

import { useOnboardingStore } from "../../utils/store/onboardingStore";

/**
 * Layout component for onboarding screens
 * Provides consistent styling and navigation controls inspired by Speechify's clean design
 */
export default function OnboardingLayout({ children, showBackButton = true }) {
  const { currentStep, prevStep } = useOnboardingStore();
  
  // Total number of onboarding steps
  const totalSteps = 4;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white bg-opacity-90 backdrop-blur-sm shadow-sm py-4 px-6 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="font-bold text-xl text-blue-600">Doctors Orders</div>
          <div className="text-sm font-medium text-gray-600 bg-blue-50 px-4 py-1 rounded-full">
            {currentStep + 1}/{totalSteps}
          </div>
        </div>
      </header>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1">
        <div 
          className="bg-blue-600 h-1 transition-all duration-300 ease-in-out" 
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        ></div>
      </div>
      
      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 sm:p-8 mx-auto my-4 sm:my-8">
          {/* Back button */}
          {showBackButton && currentStep > 0 && (
            <button
              onClick={prevStep}
              className="mb-6 text-gray-500 hover:text-gray-700 flex items-center transition duration-150"
              aria-label="Go back to previous step"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          
          {/* Onboarding step content */}
          {children}
        </div>
        
        {/* Footer info for reassurance */}
        <div className="text-center text-sm text-gray-500 mt-4 max-w-md">
          <p className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your information is secure and HIPAA-compliant
          </p>
        </div>
      </main>
    </div>
  );
}
