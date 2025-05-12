"use client";

import { useState, useEffect, useRef } from "react";
import { X, Mic, Pause, Play, Square, Save, Check, ChevronDown, User, FileText, Settings } from "lucide-react";

/**
 * Dictation Modal Component
 * Provides a modal interface for voice dictation with border beam effect
 */
export default function DictationModal({ isOpen, onClose }) {
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  
  // UI states
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recordingFinished, setRecordingFinished] = useState(false);
  
  // Data states
  const [selectedTemplate, setSelectedTemplate] = useState("soap");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  
  // Refs
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const modalRef = useRef(null);
  
  // Sample templates
  const templates = [
    { id: "soap", name: "SOAP Note", description: "Standard SOAP format for medical documentation" },
    { id: "followup", name: "Follow-up Visit", description: "Brief note for follow-up appointments" },
    { id: "procedure", name: "Procedure Note", description: "Detailed documentation of medical procedures" },
    { id: "physical", name: "Physical Exam", description: "Comprehensive physical examination template" }
  ];
  
  // Sample patients
  const patients = [
    { id: 1, name: "John Doe", dob: "1980-05-15" },
    { id: 2, name: "Jane Smith", dob: "1975-11-23" },
    { id: 3, name: "Robert Johnson", dob: "1990-03-08" },
    { id: 4, name: "Emily Wilson", dob: "1965-09-30" }
  ];

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target) && !isRecording) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isRecording]);

  // Initialize speech recognition when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // Using the Web Speech API (currently with webkit prefix in most browsers)
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = transcript;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
      };
    }
    
    return () => {
      // Clean up timer and recognition on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]);

  // Start recording function
  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.");
      return;
    }
    
    setIsRecording(true);
    setIsPaused(false);
    
    // Start the timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Start speech recognition
    recognitionRef.current.start();
  };
  
  // Pause recording function
  const pauseRecording = () => {
    setIsPaused(true);
    
    // Pause the timer
    clearInterval(timerRef.current);
    
    // Pause speech recognition
    recognitionRef.current.stop();
  };
  
  // Resume recording function
  const resumeRecording = () => {
    setIsPaused(false);
    
    // Resume the timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Resume speech recognition
    recognitionRef.current.start();
  };
  
  // Stop recording function
  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    
    // Stop the timer
    clearInterval(timerRef.current);
    
    // Stop speech recognition
    recognitionRef.current.stop();
    
    // Process the transcript (in a real app, this would send to AI for SOAP note generation)
    console.log("Final transcript:", transcript);
    
    // Show save options
    setRecordingFinished(true);
    
    // Generate a default title based on template and patient if selected
    const patientName = selectedPatient ? selectedPatient.name : "";
    const templateName = templates.find(t => t.id === selectedTemplate)?.name || "Note";
    setNoteTitle(`${patientName ? patientName + " - " : ""}${templateName} ${new Date().toLocaleDateString()}`);
  };
  
  // Save note function
  const saveNote = () => {
    // In a real implementation, we would save the note to the backend
    console.log("Saving note:", {
      title: noteTitle,
      patient: selectedPatient,
      template: selectedTemplate,
      transcript,
      recordingTime,
      timestamp: new Date().toISOString()
    });
    
    // Close the modal
    onClose();
  };
  
  // Format recording time as MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-shadow-900/70">
      <div 
        ref={modalRef}
        className="relative bg-shadow-100 rounded-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Border Beam Effect */}
        <div className="absolute inset-0 rounded-xl border border-royal/50 [background:linear-gradient(var(--royal),var(--royal))_padding-box,linear-gradient(to_right,#2563eb,transparent)_border-box] z-0 animate-pulse"></div>
        
        {/* Modal Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading">
              {recordingFinished ? "Save Recording" : "Voice Dictation"}
            </h2>
            {(!isRecording && !recordingFinished) && (
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-shadow-200 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Pre-recording options */}
          {!isRecording && !recordingFinished && (
            <div className="mb-6 space-y-4">
              {/* Template Selector */}
              <div>
                <div 
                  className="flex items-center justify-between p-3 bg-shadow-200 rounded-lg cursor-pointer"
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                >
                  <div className="flex items-center">
                    <FileText size={18} className="mr-2 text-royal" />
                    <span>Template: {templates.find(t => t.id === selectedTemplate)?.name}</span>
                  </div>
                  <ChevronDown size={18} className={`transition-transform ${showTemplateSelector ? 'rotate-180' : ''}`} />
                </div>
                
                {showTemplateSelector && (
                  <div className="mt-2 border border-shadow-200 rounded-lg overflow-hidden">
                    {templates.map(template => (
                      <div 
                        key={template.id}
                        className={`p-3 cursor-pointer hover:bg-shadow-200 ${selectedTemplate === template.id ? 'bg-shadow-200' : ''}`}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setShowTemplateSelector(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{template.name}</span>
                          {selectedTemplate === template.id && <Check size={16} className="text-royal" />}
                        </div>
                        <p className="text-sm text-white/60 mt-1">{template.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Patient Selector */}
              <div>
                <div 
                  className="flex items-center justify-between p-3 bg-shadow-200 rounded-lg cursor-pointer"
                  onClick={() => setShowPatientSelector(!showPatientSelector)}
                >
                  <div className="flex items-center">
                    <User size={18} className="mr-2 text-royal" />
                    <span>
                      {selectedPatient ? `Patient: ${selectedPatient.name}` : "Select Patient (Optional)"}
                    </span>
                  </div>
                  <ChevronDown size={18} className={`transition-transform ${showPatientSelector ? 'rotate-180' : ''}`} />
                </div>
                
                {showPatientSelector && (
                  <div className="mt-2 border border-shadow-200 rounded-lg overflow-hidden">
                    {/* Option to clear selection */}
                    {selectedPatient && (
                      <div 
                        className="p-3 cursor-pointer hover:bg-shadow-200 border-b border-shadow-200"
                        onClick={() => {
                          setSelectedPatient(null);
                          setShowPatientSelector(false);
                        }}
                      >
                        <span className="text-white/70">No patient (clear selection)</span>
                      </div>
                    )}
                    
                    {patients.map(patient => (
                      <div 
                        key={patient.id}
                        className={`p-3 cursor-pointer hover:bg-shadow-200 ${selectedPatient?.id === patient.id ? 'bg-shadow-200' : ''}`}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPatientSelector(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{patient.name}</span>
                          {selectedPatient?.id === patient.id && <Check size={16} className="text-royal" />}
                        </div>
                        <p className="text-sm text-white/60 mt-1">DOB: {new Date(patient.dob).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Settings */}
              <div>
                <div 
                  className="flex items-center justify-between p-3 bg-shadow-200 rounded-lg cursor-pointer"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <div className="flex items-center">
                    <Settings size={18} className="mr-2 text-royal" />
                    <span>Recording Settings</span>
                  </div>
                  <ChevronDown size={18} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                </div>
                
                {showSettings && (
                  <div className="mt-2 p-3 border border-shadow-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Language</span>
                      <select className="bg-shadow-300 border border-shadow-400 rounded px-2 py-1 text-sm">
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-pause after silence</span>
                      <select className="bg-shadow-300 border border-shadow-400 rounded px-2 py-1 text-sm">
                        <option value="0">Disabled</option>
                        <option value="5">5 seconds</option>
                        <option value="10">10 seconds</option>
                        <option value="30">30 seconds</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Recording Status */}
          {!recordingFinished && (
            <div className="mb-6 text-center">
              <div className="text-3xl font-medium mb-2">
                {formatTime(recordingTime)}
              </div>
              <div className="text-white/70">
                {isRecording 
                  ? (isPaused ? "Paused" : "Recording...") 
                  : "Ready to record"}
              </div>
            </div>
          )}
          
          {/* Live Transcription Preview */}
          {isRecording && transcript && (
            <div className="mb-6 p-4 rounded-lg border border-shadow-200 bg-shadow-50 max-h-40 overflow-y-auto">
              <h3 className="text-sm font-medium text-white/70 mb-2">Live Transcription</h3>
              <p>{transcript || "Listening..."}</p>
            </div>
          )}
          
          {/* Save Options (after recording) */}
          {recordingFinished && (
            <div className="mb-6 space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Note Title</label>
                <input 
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full p-2 bg-shadow-200 border border-shadow-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal"
                  placeholder="Enter note title"
                />
              </div>
              
              {/* Transcript Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-white/70">Transcript</label>
                  <span className="text-xs text-white/50">{formatTime(recordingTime)} recorded</span>
                </div>
                <div className="p-3 bg-shadow-50 border border-shadow-200 rounded-lg max-h-40 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{transcript || "No transcription available."}</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-shadow-300 rounded-lg hover:bg-shadow-200 transition-colors"
                >
                  Cancel
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setRecordingFinished(false);
                      setTranscript("");
                      setRecordingTime(0);
                    }}
                    className="px-4 py-2 border border-shadow-300 rounded-lg hover:bg-shadow-200 transition-colors"
                  >
                    Discard & Re-record
                  </button>
                  
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-royal hover:bg-royal-700 rounded-lg transition-colors flex items-center"
                  >
                    <Save size={16} className="mr-1" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Recording Controls */}
          {!recordingFinished && (
            <div className="flex items-center justify-center space-x-6">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="relative flex items-center justify-center w-16 h-16 bg-royal hover:bg-royal-700 text-white rounded-full shadow-lg transition-colors"
                >
                  <Mic size={24} />
                  {/* Pulsating effect */}
                  <span className="absolute w-full h-full rounded-full bg-royal/20 animate-ping"></span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeRecording}
                      className="flex items-center justify-center w-12 h-12 bg-royal hover:bg-royal-700 text-white rounded-full shadow-md transition-colors"
                    >
                      <Play size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={pauseRecording}
                      className="flex items-center justify-center w-12 h-12 bg-shadow-300 hover:bg-shadow-400 text-white rounded-full shadow-md transition-colors"
                    >
                      <Pause size={20} />
                    </button>
                  )}
                  
                  <button
                    onClick={stopRecording}
                    className="flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
                  >
                    <Square size={20} />
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Help Text */}
          {!isRecording && !recordingFinished && (
            <div className="mt-6 text-center text-white/60 text-sm">
              <p>Click the microphone button to start recording your note.</p>
              <p className="mt-1">Your voice will be transcribed in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
