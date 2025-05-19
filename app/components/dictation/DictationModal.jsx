"use client";

import { useState, useEffect, useRef } from "react";
import { X, Mic, Pause, Play, Square, Save, Check, ChevronDown, User, FileText, Settings } from "lucide-react";
import { generateSoapNote, saveNote as saveNoteToBackend } from "../../services/transcriptionService";

// Custom hook for audio visualization
function useAudioVisualization(isRecording, isPaused) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  
  // Initialize audio context and analyser
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Start or stop audio capture based on recording state
  useEffect(() => {
    if (!audioContextRef.current || !analyserRef.current) return;
    
    if (isRecording && !isPaused) {
      // Start capturing audio
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          sourceRef.current.connect(analyserRef.current);
          draw();
        })
        .catch(err => console.error("Error accessing microphone:", err));
    } else {
      // Stop capturing audio
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // If paused, draw a static visualization
      if (isPaused && canvasRef.current) {
        drawPausedState();
      }
    }
    
    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
    };
  }, [isRecording, isPaused]);
  
  // Draw function for visualization
  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get audio data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Draw visualization
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    
    // Draw circular waveform
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#2563eb20';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw dynamic particles
    const bufferLength = analyserRef.current.frequencyBinCount;
    const angleStep = (2 * Math.PI) / bufferLength;
    
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArrayRef.current[i];
      const amplitude = value / 255;
      
      // Calculate position
      const angle = i * angleStep;
      const particleRadius = radius * (0.8 + amplitude * 0.5);
      const x = centerX + particleRadius * Math.cos(angle);
      const y = centerY + particleRadius * Math.sin(angle);
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(x, y, 2 + amplitude * 3, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(37, 99, 235, ${0.3 + amplitude * 0.7})`;
      ctx.fill();
      
      // Draw connecting line
      if (i % 4 === 0) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(37, 99, 235, ${0.1 + amplitude * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    
    // Draw pulsing center
    const pulseSize = 20 + Math.sin(Date.now() / 500) * 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(37, 99, 235, 0.5)';
    ctx.fill();
    
    // Continue animation
    animationRef.current = requestAnimationFrame(draw);
  };
  
  // Draw a static visualization when paused
  const drawPausedState = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    
    // Draw circular outline
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#2563eb40';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw pause symbol
    ctx.beginPath();
    ctx.fillStyle = '#2563eb80';
    ctx.fillRect(centerX - 15, centerY - 15, 10, 30);
    ctx.fillRect(centerX + 5, centerY - 15, 10, 30);
  };
  
  // Draw initial state
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    
    // Draw circular outline
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#2563eb20';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw microphone icon
    if (!isRecording) {
      ctx.beginPath();
      ctx.fillStyle = '#2563eb40';
      
      // Simplified microphone shape
      const micWidth = 20;
      const micHeight = 30;
      
      // Mic body
      ctx.roundRect(centerX - micWidth/2, centerY - micHeight/2, micWidth, micHeight, 5);
      
      // Mic stand
      ctx.rect(centerX - 1, centerY + micHeight/2, 2, 10);
      
      // Mic base
      ctx.roundRect(centerX - 10, centerY + micHeight/2 + 10, 20, 4, 2);
      
      ctx.fill();
    }
  }, [isRecording, isPaused]);
  
  return canvasRef;
}

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
  const [showTranscriptPreview, setShowTranscriptPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data states
  const [selectedTemplate, setSelectedTemplate] = useState("soap");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  
  // Audio visualization
  const visualizationCanvasRef = useAudioVisualization(isRecording, isPaused);
  
  // Refs
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const modalRef = useRef(null);
  const transcriptRef = useRef(""); // Ref to track transcript without dependency issues
  
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

  // Sync transcript state with ref when it changes
  useEffect(() => {
    // When transcript state changes, update our ref
    // This ensures our ref always has the latest state value
    transcriptRef.current = transcript;
  }, [transcript]);
  
  // Initialize speech recognition only once when component mounts
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }
    
    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    
    // Handle transcription results
    recognitionRef.current.onresult = (event) => {
      // Clear previous interim results to prevent duplication
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Get all final results from the current session
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else if (i >= event.resultIndex) {
          // Only add interim results from the current result set
          interimTranscript += event.results[i][0].transcript + ' ';
        }
      }
      
      // Store the final transcript in our ref
      transcriptRef.current = finalTranscript.trim();
      
      // Combine final and interim for display
      const newTranscript = (finalTranscript + interimTranscript).trim();
      
      // Update the state to trigger re-render with latest transcript
      setTranscript(newTranscript);
      
      // Log for debugging
      console.log("Transcript updated - Final:", finalTranscript.trim());
      console.log("Transcript updated - Interim:", interimTranscript.trim());
    };
    
    // Handle recognition errors
    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      
      if (event.error === 'not-allowed') {
        alert("Microphone access is required for dictation. Please allow microphone access and try again.");
        setIsRecording(false);
      }
    };
    
    // Handle recognition end
    recognitionRef.current.onend = () => {
      console.log("Speech recognition ended");
      
      // If we're still supposed to be recording, restart recognition
      if (isRecording && !isPaused) {
        console.log("Recognition ended unexpectedly. Restarting...");
        
        // Small delay before restarting to ensure clean restart
        setTimeout(() => {
          try {
            // Preserve the current transcript in our ref before restarting
            const currentText = transcriptRef.current;
            console.log("Current transcript before restart:", currentText);
            
            // Start recognition again
            recognitionRef.current.start();
            console.log("Recognition restarted successfully");
          } catch (error) {
            console.error("Error restarting recognition:", error);
            // If we can't restart, at least update the UI
            if (error.name !== 'InvalidStateError') { // If it's already running, that's fine
              setIsRecording(false);
            }
          }
        }, 100); // Small delay to ensure clean restart
      }
    };
    
    return () => {
      // Clean up on unmount only
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping (might not be active)
        }
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Start recording function with error handling and retry mechanism
  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.");
      return;
    }
    
    setIsRecording(true);
    setIsPaused(false);
    
    // Start the timer
    if (timerRef.current) {
      clearInterval(timerRef.current); // Clear any existing timer
    }
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Start speech recognition with error handling
    try {
      recognitionRef.current.start();
      console.log("Speech recognition started");
    } catch (error) {
      // Handle the case where recognition is already started
      if (error.name === 'InvalidStateError') {
        console.log("Recognition was already running, stopping and restarting");
        try {
          recognitionRef.current.stop();
          // Small delay to ensure stop completes before starting again
          setTimeout(() => {
            recognitionRef.current.start();
          }, 100);
        } catch (e) {
          console.error("Failed to restart recognition:", e);
          alert("There was an issue with the speech recognition. Please try again.");
          setIsRecording(false);
        }
      } else {
        console.error("Error starting speech recognition:", error);
        alert("There was an issue starting the speech recognition. Please try again.");
        setIsRecording(false);
      }
    }
  };
  
  // Pause recording function with improved error handling
  const pauseRecording = () => {
    setIsPaused(true);
    
    // Pause the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Pause speech recognition with error handling
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition paused");
      } catch (error) {
        console.error("Error pausing speech recognition:", error);
        // Even if there's an error, we still want the UI to show as paused
      }
    }
  };
  
  // Resume recording function with improved error handling
  const resumeRecording = () => {
    setIsPaused(false);
    
    // Resume the timer
    if (timerRef.current) {
      clearInterval(timerRef.current); // Clear any existing timer
    }
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Resume speech recognition with error handling
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        console.log("Speech recognition resumed");
      } catch (error) {
        console.error("Error resuming speech recognition:", error);
        
        // If it fails because it's already running, that's actually fine
        if (error.name !== 'InvalidStateError') {
          alert("There was an issue resuming the recording. Please try again.");
          setIsPaused(true);
          clearInterval(timerRef.current);
        }
      }
    }
  };
  
  // Stop recording function with improved error handling and transcript processing
  const stopRecording = () => {
    // Update UI state immediately for better responsiveness
    setIsRecording(false);
    setIsPaused(false);
    
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop speech recognition with error handling
    if (recognitionRef.current) {
      try {
        // Ensure we get any final results before stopping
        recognitionRef.current.stop();
        console.log("Speech recognition stopped");
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
        // Continue with the stopping process even if there's an error
      }
    }
    
    // Process the transcript
    console.log("Final transcript:", transcript);
    
    // Clean up the transcript (remove extra spaces, fix capitalization, etc.)
    const cleanedTranscript = transcript.trim();
    
    // We'll generate the SOAP note when saving, not here, to avoid unnecessary API calls
    
    // Only update if there are changes to avoid unnecessary re-renders
    if (cleanedTranscript !== transcript) {
      setTranscript(cleanedTranscript);
    }
    
    // Show save options
    setRecordingFinished(true);
    
    // Generate a smart default title based on template and patient if selected
    const currentDate = new Date().toLocaleDateString();
    const patientName = selectedPatient ? selectedPatient.name : "";
    const templateName = templates.find(t => t.id === selectedTemplate)?.name || "Note";
    
    // Create a more descriptive title that includes date and time for better organization
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNoteTitle(`${patientName ? patientName + " - " : ""}${templateName} ${currentDate} ${timeStr}`);
  };
  
  // Save note function
  const saveNote = async () => {
    try {
      // Show loading state
      setIsSaving(true);
      
      // Generate SOAP note from transcript using GCP via our API
      console.log('Generating SOAP note from transcript...');
      const soapData = await generateSoapNote(transcript, {
        template: selectedTemplate,
        patientInfo: selectedPatient
      });
      
      console.log('SOAP note generated successfully:', soapData);
      
      // Save the complete note
      console.log('Saving note to backend...');
      const savedNote = await saveNoteToBackend({
        title: noteTitle,
        patient: selectedPatient,
        template: selectedTemplate,
        transcript,
        recordingTime,
        soapData,
        timestamp: new Date().toISOString()
      });
      
      console.log('Note saved successfully:', savedNote);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error saving note:", error);
      alert(`There was an error saving your note: ${error.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }  
  };
  
  // Format recording time as MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
      <div 
        ref={modalRef}
        className={`relative bg-white rounded-xl border border-gray-200 shadow-md w-full max-w-xl mx-4 overflow-hidden transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {/* Border Beam Effect */}
        <div className="absolute inset-0 rounded-xl border border-royal/30 [background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#2563eb,transparent)_border-box] z-0"></div>
        
        {/* Modal Content */}
        <div className="relative z-10 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Mic size={20} className="mr-2 text-royal" />
              Voice Dictation
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          
          {/* Pre-recording options */}
          {!isRecording && !recordingFinished && (
            <div className="mb-6 space-y-4">
              {/* Template Selector */}
              <div>
                <div 
                  className="flex items-center justify-between p-3 bg-gray-100 rounded-lg cursor-pointer"
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                >
                  <div className="flex items-center">
                    <FileText size={18} className="mr-2 text-royal" />
                    <span>Template: {templates.find(t => t.id === selectedTemplate)?.name}</span>
                  </div>
                  <ChevronDown size={18} className={`transition-transform ${showTemplateSelector ? 'rotate-180' : ''}`} />
                </div>
                
                {showTemplateSelector && (
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                    {templates.map(template => (
                      <div 
                        key={template.id}
                        className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedTemplate === template.id ? 'bg-gray-100' : ''}`}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setShowTemplateSelector(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{template.name}</span>
                          {selectedTemplate === template.id && <Check size={16} className="text-royal" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Patient Selector */}
              <div>
                <div 
                  className="flex items-center justify-between p-3 bg-gray-100 rounded-lg cursor-pointer"
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
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Option to clear selection */}
                    {selectedPatient && (
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-200"
                        onClick={() => {
                          setSelectedPatient(null);
                          setShowPatientSelector(false);
                        }}
                      >
                        <span className="text-gray-500">No patient (clear selection)</span>
                      </div>
                    )}
                    
                    {patients.map(patient => (
                      <div 
                        key={patient.id}
                        className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedPatient?.id === patient.id ? 'bg-gray-100' : ''}`}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPatientSelector(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{patient.name}</span>
                          {selectedPatient?.id === patient.id && <Check size={16} className="text-royal" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">DOB: {new Date(patient.dob).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Settings */}
              <div>
                <div 
                  className="flex items-center justify-between p-3 bg-gray-100 rounded-lg cursor-pointer"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <div className="flex items-center">
                    <Settings size={18} className="mr-2 text-royal" />
                    <span>Recording Settings</span>
                  </div>
                  <ChevronDown size={18} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                </div>
                
                {showSettings && (
                  <div className="mt-2 p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Language</span>
                      <select className="bg-gray-100 border border-gray-200 rounded px-2 py-1 text-sm">
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-pause after silence</span>
                      <select className="bg-gray-100 border border-gray-200 rounded px-2 py-1 text-sm">
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
          {(isRecording || recordingFinished) && (
            <div className="mb-4 text-center">
              <div className="text-3xl font-medium mb-2">
                {formatTime(recordingTime)}
              </div>
              <div className="text-gray-500">
                {isRecording 
                  ? (isPaused ? "Paused" : "Recording...") 
                  : "Ready to record"}
              </div>
            </div>
          )}
          
          {/* Visualization Area */}
          {(isRecording || recordingFinished) && (
            <div className="mb-6">
              <div className="flex flex-col items-center justify-center">
                {/* Visualization Canvas */}
                <div className="mt-4 relative">
                  <div 
                    className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-royal/20 flex items-center justify-center relative"
                  >
                    <canvas 
                      ref={visualizationCanvasRef} 
                      width="200" 
                      height="200" 
                      className="absolute inset-0"
                    ></canvas>
                    
                    {/* Center dot */}
                    <div className={`w-4 h-4 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    
                    {/* Recording indicator */}
                    {isRecording && !isPaused && (
                      <div className="absolute top-2 right-2 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-1 animate-pulse"></div>
                        <span className="text-xs text-gray-500">REC</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Transcript Preview Toggle */}
                  {isRecording && (
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={() => setShowTranscriptPreview(!showTranscriptPreview)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center"
                      >
                        {showTranscriptPreview ? "Hide" : "Show"} live transcription
                        <ChevronDown 
                          size={14} 
                          className={`ml-1 transition-transform ${showTranscriptPreview ? 'rotate-180' : ''}`} 
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Live Transcription Preview */}
          {isRecording && transcript && showTranscriptPreview && (
            <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50 max-h-32 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Live Transcription</h3>
              <p className="text-sm">{transcript || "Listening..."}</p>
            </div>
          )}
          
          {/* Save Options (after recording) */}
          {recordingFinished && (
            <div className="mb-6 space-y-4">
              {/* Note Type Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Note Type</label>
                  <button className="flex items-center text-xs text-royal">
                    <Settings size={12} className="mr-1" />
                    Settings
                  </button>
                </div>
                <div className="relative">
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                  >
                    <option value="SOAP">SOAP Note</option>
                    <option value="Progress">Progress Note</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Procedure">Procedure Note</option>
                    <option value="Discharge">Discharge Summary</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Patient Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <div className="relative">
                  <select 
                    value={selectedPatient ? selectedPatient.id : ""}
                    onChange={(e) => {
                      const patientId = e.target.value;
                      if (patientId === "") {
                        setSelectedPatient(null);
                      } else {
                        const patient = patients.find(p => p.id === patientId);
                        setSelectedPatient(patient || null);
                      }
                    }}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                  >
                    <option value="">Select a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Note Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter a title for your note"
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                />
              </div>
              
              {/* Transcript */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Transcript</label>
                  <span className="text-xs text-gray-500">{formatTime(recordingTime)} recorded</span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{transcript || "No transcription available."}</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
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
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    Discard & Re-record
                  </button>
                  
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-royal hover:bg-royal-700 rounded-lg transition-colors flex items-center text-white"
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
                      className="flex items-center justify-center w-12 h-12 bg-gray-300 hover:bg-gray-400 text-white rounded-full shadow-md transition-colors"
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
            <div className="mt-6 text-center text-gray-500 text-sm">
              <p>Click the microphone button to start recording your note.</p>
              <p className="mt-1">Your voice will be transcribed in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
