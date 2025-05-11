"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Success page shown after successful account creation
 * Provides a warm welcome and directs the user to the dashboard
 */
export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  
  // Automatically redirect to dashboard after 3 seconds
  useEffect(() => {
    // Use a smaller timeout for better UX
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
    
    // Force redirect if still on page after 5 seconds (backup)
    const backupTimer = setTimeout(() => {
      window.location.href = "/dashboard";
    }, 5000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(backupTimer);
    };
  }, [router]);
  
  // For immediate redirect on button click
  const handleDashboardClick = () => {
    router.push("/dashboard");
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 text-green-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to Doctors Orders!
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message || "Your account has been created successfully."}
        </p>
        
        <p className="text-gray-600 mb-8">
          You&apos;ll be redirected to your dashboard in a few seconds where you can start dictating your first note!
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={handleDashboardClick}
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center transition duration-150"
          >
            Go to Dashboard Now
          </button>
          
          <Link 
            href="/dictation" 
            className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-center transition duration-150"
          >
            Create First Note
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          🔒 HIPAA-aligned, secure, and built for healthcare professionals
        </p>
      </div>
    </div>
  );
}
