"use client";

import { useState } from "react";
import { useOnboardingStore } from "../../utils/store/onboardingStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Client-side SignUp form component that redirects to the onboarding flow
 * Collects initial registration information and stores it in the onboarding store
 */
export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setEmail, setPassword, setFullName, reset } = useOnboardingStore();
  const router = useRouter();
  
  // Reset onboarding store on initial load
  useState(() => {
    reset();
  }, [reset]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const fullName = formData.get("full_name")?.toString() || "";
    
    // Validate inputs
    if (!email || !password) {
      setError("Email and password are required");
      setIsLoading(false);
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }
    
    try {
      // Store registration info in the onboarding store
      setEmail(email);
      setPassword(password);
      setFullName(fullName);
      
      // Redirect to onboarding flow
      router.push("/auth/onboarding");
    } catch (err) {
      console.error("Error during registration setup:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Password must be at least 8 characters long
        </p>
      </div>
      
      {error && (
        <div className="p-2 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isLoading ? "Getting started..." : "Continue to setup"}
      </button>
      
      <p className="text-sm text-center text-gray-600">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
