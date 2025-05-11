"use client";

import { useOnboardingStore } from "../../utils/store/onboardingStore";
import { SectionTitle, OptionButton, TextInput, ContinueButton, Slider } from "./OnboardingComponents";
import { useState } from "react";

/**
 * Step 1: Identify Role & Workflow Context
 * Collects primary role, documentation method, and time spent
 */
export default function Step1Role() {
  const { 
    primaryRole, 
    setPrimaryRole, 
    currentDocumentationMethod, 
    setCurrentDocumentationMethod,
    dailyDocumentationHours,
    setDailyDocumentationHours,
    nextStep 
  } = useOnboardingStore();
  
  const [inputMethod, setInputMethod] = useState(currentDocumentationMethod);
  
  // Available roles for selection
  const roles = [
    { value: 'physician', label: 'Physician' },
    { value: 'nurse_practitioner', label: 'Nurse Practitioner' },
    { value: 'therapist', label: 'Therapist' },
    { value: 'physician_assistant', label: 'Physician Assistant' },
    { value: 'other', label: 'Other' },
  ];
  
  // Handle continue button click
  const handleContinue = () => {
    setCurrentDocumentationMethod(inputMethod);
    nextStep();
  };
  
  // Check if form is ready to continue
  const canContinue = primaryRole !== '';
  
  return (
    <>
      <SectionTitle>What's your primary role in patient care?</SectionTitle>
      
      <div className="mb-6">
        {roles.map((role) => (
          <OptionButton
            key={role.value}
            label={role.label}
            selected={primaryRole === role.value}
            onClick={() => setPrimaryRole(role.value)}
          />
        ))}
      </div>
      
      <SectionTitle>How do you currently handle patient documentation?</SectionTitle>
      
      <TextInput
        placeholder="e.g., EHR typing, dictation service, handwritten notes, etc."
        value={inputMethod}
        onChange={setInputMethod}
      />
      
      <SectionTitle>Roughly how much time do you spend per day on clinical documentation?</SectionTitle>
      
      <div className="mb-6">
        <Slider
          min={0}
          max={5}
          step={0.5}
          value={dailyDocumentationHours}
          onChange={setDailyDocumentationHours}
        />
        <p className="text-center font-medium text-lg mt-3">
          {dailyDocumentationHours} {dailyDocumentationHours === 1 ? 'hour' : 'hours'}
        </p>
      </div>
      
      <ContinueButton
        onClick={handleContinue}
        disabled={!canContinue}
      />
    </>
  );
}
