"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "../../actions";
import Link from "next/link";

/**
 * Client-side SignIn form component that uses server actions for authentication
 * Handles client-side redirection based on server action response
 */
export default function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await signInAction(formData);

      if (result && "error" in result) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      
      // Handle success with client-side redirect
      if (result && result.success) {
        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full p-2 mt-1 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <div className="p-2 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
