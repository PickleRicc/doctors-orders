"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/**
 * Dictation page component with speech-to-text functionality
 * Based on the wireframe specifications for the recording interface
 */
export default function DictationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

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
    
    // Navigate to note review page (placeholder for now)
    // In a real implementation, we would save the transcript to the backend
    // and redirect to a note editing page
  };
  
  // Format recording time as MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Recording</h1>
        <div className="text-xl font-mono">{formatTime(recordingTime)}</div>
      </div>
      
      {/* Visual Feedback Area */}
      <div className="aspect-video bg-gray-100 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
        <div className={`relative w-full h-full flex flex-col items-center justify-center ${isRecording ? 'bg-blue-50' : 'bg-gray-50'}`}>
          {/* Sound Visualization (simple animation) */}
          {isRecording && !isPaused && (
            <div className="flex items-center justify-center space-x-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 40}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          )}
          
          {/* Recording status */}
          <div className="mb-4">
            {isRecording ? (
              <div className="flex items-center">
                <div className={`h-4 w-4 rounded-full mr-2 ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-lg font-medium">
                  {isPaused ? "Recording Paused" : "Recording in Progress"}
                </span>
              </div>
            ) : (
              <div className="text-lg font-medium text-gray-500">Ready to Record</div>
            )}
          </div>
          
          {/* Instructions */}
          <p className="text-gray-600 max-w-md text-center mb-6">
            {isRecording 
              ? "Speak clearly into your microphone. Your speech will be transcribed in real-time." 
              : "Click the button below to start recording your note."}
          </p>
        </div>
      </div>
      
      {/* Live Transcription Preview (optional, as per wireframe) */}
      {isRecording && transcript && (
        <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-white max-h-40 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Live Transcription</h3>
          <p className="text-gray-800">{transcript || "Listening..."}</p>
        </div>
      )}
      
      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center justify-center w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="flex items-center justify-center w-14 h-14 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            
            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* Template Selection (optional, this would be expanded in a full implementation) */}
      {!isRecording && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Choose a Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="p-3 border border-blue-600 bg-blue-50 text-blue-700 rounded-md text-left hover:bg-blue-100">
              <span className="font-medium">Default SOAP Template</span>
            </button>
            <button className="p-3 border border-gray-200 text-gray-700 rounded-md text-left hover:bg-gray-50">
              <span className="font-medium">Follow-up Visit</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
