"use client";

import { useOnboardingStore } from "../../utils/store/onboardingStore";
import { 
  SectionTitle, 
  TextInput, 
  ContinueButton,
  Checkbox
} from "./OnboardingComponents";

/**
 * Step 3: Prime Value & Outcomes
 * Collects information about potential value and outcomes 
 * the user could gain from using the app
 */
export default function Step3Value() {
  const { 
    timeSavingPriority, 
    setTimeSavingPriority,
    valueRealtimeDictation,
    setValueRealtimeDictation,
    valueAiSoapStructure,
    setValueAiSoapStructure,
    valueAutoSyncExport,
    setValueAutoSyncExport,
    dailyNoteCount,
    setDailyNoteCount,
    nextStep 
  } = useOnboardingStore();
  
  // Handle continue button click
  const handleContinue = () => {
    nextStep();
  };
  
  // Handle daily note count input
  const handleNoteCountChange = (value) => {
    // Convert to number and ensure it's not negative
    const count = Math.max(0, parseInt(value) || 0);
    setDailyNoteCount(count);
  };
  
  return (
    <>
      <SectionTitle>Imagine spending 50% less time on notes—what would you do with that time?</SectionTitle>
      
      <div className="mb-6">
        <TextInput
          placeholder="e.g., See more patients, Get home earlier, Reduce stress"
          value={timeSavingPriority}
          onChange={setTimeSavingPriority}
        />
      </div>
      
      <SectionTitle>Would you find value in an app that:</SectionTitle>
      
      <div className="mb-6">
        <Checkbox
          label="Dictates notes in real-time"
          checked={valueRealtimeDictation}
          onChange={setValueRealtimeDictation}
        />
        <Checkbox
          label="Uses AI to generate SOAP structure"
          checked={valueAiSoapStructure}
          onChange={setValueAiSoapStructure}
        />
        <Checkbox
          label="Automatically syncs to your system or exports notes"
          checked={valueAutoSyncExport}
          onChange={setValueAutoSyncExport}
        />
      </div>
      
      <SectionTitle>How many clinical notes do you typically write per day?</SectionTitle>
      
      <div className="mb-6">
        <TextInput
          type="number"
          placeholder="Number of notes per day"
          value={dailyNoteCount.toString()}
          onChange={handleNoteCountChange}
        />
        <p className="text-sm text-gray-500 mt-1">
          This helps us understand your needs. Our free tier includes 5 notes per month.
        </p>
      </div>
      
      <ContinueButton onClick={handleContinue} />
    </>
  );
}
