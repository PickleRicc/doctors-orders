"use client";

/**
 * Shared UI components for onboarding flow
 * Modern, clean design inspired by Speechify for mobile and desktop
 */

// Title for each section
export function SectionTitle({ children }) {
  return (
    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 mt-8 first:mt-0">
      {children}
    </h2>
  );
}

// Button for selecting options
export function OptionButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      className={`w-full py-3.5 px-5 mb-3 rounded-xl border-2 text-left transition-all duration-200 ${selected
        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
        : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Multi-select option button
export function MultiSelectOption({ label, selected, onClick }) {
  return (
    <button
      type="button"
      className={`mb-3 mr-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${selected
        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
        : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <span className="font-medium">{label}</span>
      {selected && (
        <span className="ml-2 inline-flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}

// Text input field
export function TextInput({ placeholder, value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-4 mb-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
    />
  );
}

// Slider component with improved styling
export function Slider({ min, max, step, value, onChange }) {
  // Calculate percentage for background gradient
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="w-full mb-4 px-1">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
        }}
      />
      <div className="flex justify-between mt-2 text-sm text-gray-500">
        <span>{min} hr</span>
        <span>{max} hrs</span>
      </div>
    </div>
  );
}

// Checkbox component
export function Checkbox({ label, checked, onChange }) {
  return (
    <div className="flex items-center mb-4 select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex items-center focus:outline-none group"
      >
        <div className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-colors duration-200 ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-gray-400'}`}>
          {checked && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="ml-3 text-gray-700">{label}</span>
      </button>
    </div>
  );
}

// Continue button
export function ContinueButton({ onClick, disabled = false, children, className = "" }) {
  return (
    <button
      type="button"
      className={`w-full py-4 px-6 rounded-xl text-white font-medium text-lg transition-all duration-200 ${disabled
        ? "bg-gray-400 cursor-not-allowed opacity-70"
        : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children || "Continue"}
    </button>
  );
}

// Radio button component
export function RadioButton({ label, checked, onChange, name }) {
  return (
    <div className="flex items-center mb-3 select-none">
      <button
        type="button"
        onClick={() => onChange(true)}
        className="flex items-center focus:outline-none group"
      >
        <div className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-colors duration-200 ${checked ? 'border-blue-600' : 'border-gray-300 group-hover:border-gray-400'}`}>
          {checked && (
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          )}
        </div>
        <span className="ml-3 text-gray-700">{label}</span>
      </button>
    </div>
  );
}
