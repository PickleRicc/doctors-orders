"use client";

import { useState } from "react";
import { useOnboardingStore } from "../../utils/store/onboardingStore";
import { 
  SectionTitle, 
  MultiSelectOption, 
  ContinueButton,
  OptionButton,
  TextInput
} from "./OnboardingComponents";

/**
 * Step 2: Highlight Friction & Emotional Drivers
 * Collects information about documentation frustrations and pain points
 */
export default function Step2Frustrations() {
  const { 
    documentationFrustrations, 
    setDocumentationFrustrations,
    delayedDocumentation,
    setDelayedDocumentation,
    usingSpeechToText,
    setUsingSpeechToText,
    currentSpeechToTextTool,
    setCurrentSpeechToTextTool,
    nextStep 
  } = useOnboardingStore();
  
  const [toolInput, setToolInput] = useState(currentSpeechToTextTool);
  
  // Available frustration options for multi-select
  const frustrationOptions = [
    { value: 'time_consuming', label: 'Too time-consuming' },
    { value: 'inaccurate_dictation', label: 'Inaccurate dictation' },
    { value: 'ehr_complexity', label: 'EHR complexity' },
    { value: 'disrupts_patient_flow', label: 'Disrupts patient flow' },
    { value: 'repetitive_tasks', label: 'Repetitive tasks' },
    { value: 'compliance_issues', label: 'Compliance issues' },
    { value: 'other', label: 'Other' },
  ];
  
  // Toggle frustration selection
  const toggleFrustration = (value) => {
    if (documentationFrustrations.includes(value)) {
      setDocumentationFrustrations(
        documentationFrustrations.filter(item => item !== value)
      );
    } else {
      setDocumentationFrustrations([...documentationFrustrations, value]);
    }
  };
  
  // Handle continue button click
  const handleContinue = () => {
    if (usingSpeechToText) {
      setCurrentSpeechToTextTool(toolInput);
    }
    nextStep();
  };
  
  return (
    <>
      <SectionTitle>What's the most frustrating part of writing clinical notes?</SectionTitle>
      
      <div className="mb-6 flex flex-wrap">
        {frustrationOptions.map((option) => (
          <MultiSelectOption
            key={option.value}
            label={option.label}
            selected={documentationFrustrations.includes(option.value)}
            onClick={() => toggleFrustration(option.value)}
          />
        ))}
      </div>
      
      <SectionTitle>Have you ever delayed notes or had to finish documentation after hours?</SectionTitle>
      
      <div className="mb-6">
        <OptionButton
          label="Yes"
          selected={delayedDocumentation === true}
          onClick={() => setDelayedDocumentation(true)}
        />
        <OptionButton
          label="No"
          selected={delayedDocumentation === false}
          onClick={() => setDelayedDocumentation(false)}
        />
      </div>
      
      <SectionTitle>Do you use any speech-to-text tools today?</SectionTitle>
      
      <div className="mb-6">
        <OptionButton
          label="Yes"
          selected={usingSpeechToText === true}
          onClick={() => setUsingSpeechToText(true)}
        />
        <OptionButton
          label="No"
          selected={usingSpeechToText === false}
          onClick={() => setUsingSpeechToText(false)}
        />
      </div>
      
      {usingSpeechToText && (
        <div className="mb-6">
          <p className="text-gray-700 mb-2">Which speech-to-text tool do you use?</p>
          <TextInput
            placeholder="e.g., Dragon Medical, built-in EHR dictation, etc."
            value={toolInput}
            onChange={setToolInput}
          />
        </div>
      )}
      
      <ContinueButton onClick={handleContinue} />
    </>
  );
}
