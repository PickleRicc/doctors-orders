"use client";

import { useState } from 'react';
import Link from 'next/link';
import { X, Menu } from 'lucide-react';

/**
 * Navbar component for the landing page
 * 
 * @returns {JSX.Element} The navbar component
 */
export default function Navbar() {
  // State for mobile menu toggle
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-shadow/90 backdrop-blur-md py-4 shadow-lg shadow-shadow-300/20">
      <div className="container-content">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-white text-xl font-bold">Doctors Orders</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="nav-link">
              Features
            </Link>
            <Link href="#how-it-works" className="nav-link">
              How It Works
            </Link>
            <Link href="#pricing" className="nav-link">
              Pricing
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/auth/signin" 
              className="btn-secondary"
            >
              Log in
            </Link>
            <Link 
              href="/auth/signup" 
              className="btn-primary"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white bg-transparent border-none cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-shadow-100 py-4 px-4 absolute w-full">
          <nav className="flex flex-col space-y-4">
            <Link 
              href="#features" 
              className="text-white/80 hover:text-royal transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-white/80 hover:text-royal transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              href="#pricing" 
              className="text-white/80 hover:text-royal transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="pt-2 flex flex-col space-y-3">
              <Link 
                href="/auth/signin" 
                className="px-4 py-2 text-center text-white border border-white/20 rounded-md hover:border-royal hover:text-royal transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link 
                href="/auth/signup" 
                className="px-4 py-2 text-center text-shadow bg-royal hover:bg-royal-700 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
