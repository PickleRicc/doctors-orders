"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "../../actions";
import { Home, FileText, Settings, CreditCard, Mic } from "lucide-react";
import DictationModal from "../dictation/DictationModal";

/**
 * Mobile navigation component with hamburger menu
 * Based on the wireframe specifications for mobile responsiveness
 */
export default function MobileNav({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDictationModalOpen, setIsDictationModalOpen] = useState(false);
  const pathname = usePathname();
  
  const isActive = (path) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOutAction();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const openDictationModal = () => {
    setIsDictationModalOpen(true);
  };
  
  const closeDictationModal = () => {
    setIsDictationModalOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold text-blue-600">Doctors Orders</h1>
        <button 
          onClick={toggleMenu}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Slide-in Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-bold text-blue-600">Doctors Orders</h1>
              <button 
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 mr-3">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-medium">{user?.email || "User"}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {user?.user_metadata?.full_name || ""}
                    </p>
                  </div>
                </div>
                
                <nav className="space-y-2">
                  <Link 
                    href="/dashboard" 
                    onClick={toggleMenu}
                    className={`flex items-center px-4 py-3 rounded-md ${
                      isActive("/dashboard") 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                  
                  <Link 
                    href="/dictation" 
                    onClick={toggleMenu}
                    className={`flex items-center px-4 py-3 rounded-md ${
                      isActive("/dictation") 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    New Recording
                  </Link>
                  
                  <Link 
                    href="/notes" 
                    onClick={toggleMenu}
                    className={`flex items-center px-4 py-3 rounded-md ${
                      isActive("/notes") 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    All Notes
                  </Link>
                  
                  <Link 
                    href="/settings" 
                    onClick={toggleMenu}
                    className={`flex items-center px-4 py-3 rounded-md ${
                      isActive("/settings") 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  
                  <Link 
                    href="/subscription" 
                    onClick={toggleMenu}
                    className={`flex items-center px-4 py-3 rounded-md ${
                      isActive("/subscription") 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Subscription
                  </Link>
                </nav>
              </div>
            </div>
            
            <div className="p-4 border-t">
              <button 
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-shadow-50 border-t border-shadow-200 z-10">
        <div className="grid grid-cols-5 h-16">
          <Link 
            href="/dashboard" 
            className={`flex flex-col items-center justify-center ${
              isActive("/dashboard") ? "text-royal" : "text-white/70"
            }`}
          >
            <Home size={22} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link 
            href="/notes" 
            className={`flex flex-col items-center justify-center ${
              isActive("/notes") ? "text-royal" : "text-white/70"
            }`}
          >
            <FileText size={22} />
            <span className="text-xs mt-1">Notes</span>
          </Link>
          
          {/* Center Record Button */}
          <button 
            onClick={openDictationModal}
            className="flex flex-col items-center justify-center relative"
          >
            <div className="relative w-14 h-14 rounded-full bg-royal flex items-center justify-center text-white -mt-5 shadow-lg">
              {/* Border Beam Effect */}
              <div className="absolute inset-0 rounded-full border border-royal/50 [background:linear-gradient(var(--royal),var(--royal))_padding-box,linear-gradient(to_right,#2563eb,transparent)_border-box] z-0 animate-pulse"></div>
              <Mic size={24} className="relative z-10" />
            </div>
            <span className="text-xs mt-1 text-white/70">Record</span>
          </button>
          
          <Link 
            href="/settings" 
            className={`flex flex-col items-center justify-center ${
              isActive("/settings") ? "text-royal" : "text-white/70"
            }`}
          >
            <Settings size={22} />
            <span className="text-xs mt-1">Settings</span>
          </Link>
          
          <Link 
            href="/subscription" 
            className={`flex flex-col items-center justify-center ${
              isActive("/subscription") ? "text-royal" : "text-white/70"
            }`}
          >
            <CreditCard size={22} />
            <span className="text-xs mt-1">Plan</span>
          </Link>
        </div>
      </div>
      
      {/* Dictation Modal */}
      <DictationModal isOpen={isDictationModalOpen} onClose={closeDictationModal} />
    </div>
  );
}
