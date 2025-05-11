import { create } from 'zustand';

/**
 * Onboarding store for managing onboarding state across multiple steps
 * Uses Zustand for state management
 */
export const useOnboardingStore = create((set) => ({
  // User information
  email: '',
  password: '',
  fullName: '',
  
  // Section 1: Role & Workflow
  primaryRole: '',
  currentDocumentationMethod: '',
  dailyDocumentationHours: 2, // Default mid-point
  
  // Section 2: Frustrations
  documentationFrustrations: [],
  delayedDocumentation: null,
  usingSpeechToText: null,
  currentSpeechToTextTool: '',
  
  // Section 3: Value
  timeSavingPriority: '',
  valueRealtimeDictation: true,
  valueAiSoapStructure: true,
  valueAutoSyncExport: true,
  dailyNoteCount: 0,
  
  // Section 4: Subscription
  payingForTimeSavings: 'Maybe',
  preferredPlan: 'Free Starter Plan',
  
  // Current step tracking
  currentStep: 0,
  
  // Update functions
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setFullName: (fullName) => set({ fullName }),
  setPrimaryRole: (primaryRole) => set({ primaryRole }),
  setCurrentDocumentationMethod: (method) => set({ currentDocumentationMethod: method }),
  setDailyDocumentationHours: (hours) => set({ dailyDocumentationHours: hours }),
  setDocumentationFrustrations: (frustrations) => set({ documentationFrustrations: frustrations }),
  setDelayedDocumentation: (delayed) => set({ delayedDocumentation: delayed }),
  setUsingSpeechToText: (using) => set({ usingSpeechToText: using }),
  setCurrentSpeechToTextTool: (tool) => set({ currentSpeechToTextTool: tool }),
  setTimeSavingPriority: (priority) => set({ timeSavingPriority: priority }),
  setValueRealtimeDictation: (value) => set({ valueRealtimeDictation: value }),
  setValueAiSoapStructure: (value) => set({ valueAiSoapStructure: value }),
  setValueAutoSyncExport: (value) => set({ valueAutoSyncExport: value }),
  setDailyNoteCount: (count) => set({ dailyNoteCount: count }),
  setPayingForTimeSavings: (value) => set({ payingForTimeSavings: value }),
  setPreferredPlan: (plan) => set({ preferredPlan: plan }),
  setCurrentStep: (step) => set({ currentStep: step }),
  
  // Progress to next step
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  // Go back to previous step
  prevStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),
  
  // Reset the store
  reset: () => set({
    email: '',
    password: '',
    fullName: '',
    primaryRole: '',
    currentDocumentationMethod: '',
    dailyDocumentationHours: 2,
    documentationFrustrations: [],
    delayedDocumentation: null,
    usingSpeechToText: null,
    currentSpeechToTextTool: '',
    timeSavingPriority: '',
    valueRealtimeDictation: true,
    valueAiSoapStructure: true,
    valueAutoSyncExport: true,
    dailyNoteCount: 0,
    payingForTimeSavings: 'Maybe',
    preferredPlan: 'Free Starter Plan',
    currentStep: 0,
  }),
}));
