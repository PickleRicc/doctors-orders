import Link from 'next/link';
import Image from 'next/image';
import Navbar from './components/landing/Navbar';
import BorderBeam from './components/effects/BorderBeam';
import { Safari } from '../components/magicui/safari';
import Iphone15Pro from '../components/magicui/iphone-15-pro';
import { MicIcon, ClipboardCheckIcon, SparklesIcon } from 'lucide-react';

/**
 * Modern landing page component
 * Designed with Shadow Black backgrounds, Royal Blue accents, and clean modern aesthetic
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-shadow text-white">
      {/* Modern Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container-content">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 p-4 md:p-6 rounded-xl overflow-hidden">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white max-w-4xl z-10 relative">
                Medical <span className="text-royal">Note-Taking</span> Made Simple
              </h1>
              <BorderBeam 
                size={100}
                duration={6}
                colorFrom="#2563eb"
                colorTo="#60a5fa"
              />
              <BorderBeam 
                size={100}
                duration={6}
                delay={3}
                colorFrom="#60a5fa"
                colorTo="#93c5fd"
                reverse
              />
            </div>
            <p className="mb-8 text-xl md:text-2xl text-white/80 leading-relaxed max-w-2xl">
              Save hours on documentation with real-time voice dictation and AI-assisted SOAP notes generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link 
                href="/auth/signup" 
                className="btn-primary text-center text-lg font-medium px-8 py-3"
              >
                Get Started Free
              </Link>
              <Link
                href="#how-it-works"
                className="btn-secondary text-center text-lg font-medium px-8 py-3"
              >
                See How It Works
              </Link>
            </div>
            
            {/* Safari Browser Mockup */}
            <div className="w-full max-w-6xl mx-auto flex justify-center py-8">
              <div className="relative w-full max-w-4xl">
                <Safari 
                  url="app.doctorsorders.ai/create-note" 
                  width="100%" 
                  height="100%" 
                  mode="default"
                />
                {/* Placeholder for screenshot - will be replaced with actual app screenshot */}
                <div className="absolute inset-[52px] bottom-[1px] flex items-center justify-center bg-shadow-100">
                  <div className="text-center p-6">
                    <MicIcon size={74} className="text-royal mb-4 mx-auto" />
                    <h3 className="text-2xl md:text-3xl font-bold text-white">Voice-Powered Note Taking</h3>
                    <p className="text-white/70 text-lg max-w-xl mt-2">Dictate your notes in real-time with AI-assisted SOAP formatting</p>
                    <div className="mt-6 inline-block">
                      <div className="px-4 py-1 bg-royal/20 border border-royal/30 rounded-md text-royal animate-pulse">
                        Recording...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-shadow-50">
        <div className="container-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Powerful <span className="text-royal">Features</span></h2>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">Everything you need to streamline your medical documentation workflow</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="card p-6">
                  <div className="rounded-full bg-shadow-200 w-12 h-12 flex items-center justify-center mb-4">
                    <MicIcon className="text-royal" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Real-time Voice Dictation</h3>
                  <p className="text-white/70">Speak naturally and see your words appear instantly, with smart pause detection and voice commands.</p>
                </div>

                {/* Feature 2 */}
                <div className="card p-6">
                  <div className="rounded-full bg-shadow-200 w-12 h-12 flex items-center justify-center mb-4">
                    <SparklesIcon className="text-royal" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">AI-Powered SOAP Structure</h3>
                  <p className="text-white/70">Let artificial intelligence automatically organize your dictation into professional SOAP-formatted notes.</p>
                </div>

                {/* Feature 3 */}
                <div className="card p-6">
                  <div className="rounded-full bg-shadow-200 w-12 h-12 flex items-center justify-center mb-4">
                    <ClipboardCheckIcon className="text-royal" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Smart Templates</h3>
                  <p className="text-white/70">Choose from specialty-specific templates to streamline your workflow and ensure comprehensive documentation.</p>
                </div>
              </div>
            </div>
            
            {/* Mobile View */}
            <div className="flex justify-center">
              <div className="relative">
                <Iphone15Pro 
                  width={240} 
                  height={500}
                >
                  {/* Placeholder for mobile app screenshot - will be replaced with actual mobile app screenshot */}
                  <div className="absolute inset-0 flex items-center justify-center bg-shadow-100">
                    <div className="text-center p-4">
                      <MicIcon size={24} className="text-royal mb-2 mx-auto" />
                      <h3 className="text-sm font-bold text-white">Voice Notes</h3>
                      <div className="mt-2 inline-block">
                        <div className="px-2 py-1 bg-royal/20 border border-royal/30 rounded-sm text-xs text-royal animate-pulse">
                          Recording...
                        </div>
                      </div>
                    </div>
                  </div>
                </Iphone15Pro>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/auth/signup" className="btn-primary text-lg font-medium px-8 py-3 inline-block">
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 bg-shadow">
        <div className="container-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">How It <span className="text-royal">Works</span></h2>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">Three simple steps to transform your documentation workflow</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-white bg-royal rounded-full">
                <span className="font-bold">1</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Record</h3>
              <p className="text-white/70">
                Dictate your patient encounters using our intuitive voice recording interface.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-white bg-royal rounded-full">
                <span className="font-bold">2</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Process</h3>
              <p className="text-white/70">
                Our AI automatically structures your dictation into professional SOAP-formatted notes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-white bg-royal rounded-full">
                <span className="font-bold">3</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Export</h3>
              <p className="text-white/70">
                Review, edit, and export your notes directly to your EMR system or as a PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-shadow-50">
        <div className="container-content">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Simple, <span className="text-royal">Transparent</span> Pricing</h2>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">Choose the plan that works best for your practice</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="card p-6">
              <h3 className="mb-2 text-xl font-semibold text-white">Free</h3>
              <p className="mb-4 text-3xl font-bold text-white">$0<span className="text-sm font-normal text-white/70">/month</span></p>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center text-white/80">
                  <svg className="w-5 h-5 mr-2 text-royal" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  5 SOAP notes per month
                </li>
                <li className="flex items-center text-white/80">
                  <svg className="w-5 h-5 mr-2 text-royal" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Basic voice dictation
                </li>
                <li className="flex items-center text-white/80">
                  <svg className="w-5 h-5 mr-2 text-royal" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Simple export options
                </li>
              </ul>
              <Link href="/auth/signup" className="btn-secondary block w-full text-center">
                Get Started
              </Link>
            </div>

            {/* Monthly Tier */}
            <div className="p-6 bg-royal rounded-lg border border-royal-700 text-white">
              <h3 className="mb-2 text-xl font-semibold">Monthly</h3>
              <p className="mb-4 text-3xl font-bold">$29<span className="text-sm font-normal text-white/80">/month</span></p>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Unlimited SOAP notes
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Advanced AI assistance
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  EMR export options
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Priority support
                </li>
              </ul>
              <Link href="/auth/signup" className="block w-full px-4 py-2 text-center text-royal bg-white rounded-md hover:bg-white/90 transition-colors">
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-shadow-300 text-white">
        <div className="container-content">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Doctors Orders</h3>
              <p className="mt-1 text-sm text-white/50">© 2025 All Rights Reserved</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-white/50 hover:text-royal transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-white/50 hover:text-royal transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-sm text-white/50 hover:text-royal transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
