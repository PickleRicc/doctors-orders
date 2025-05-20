"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOutAction } from "../../actions";
import { LayoutDashboard, Mic, FileText, Settings, CreditCard, LogOut, Stethoscope } from "lucide-react";
import DictationModal from "../dictation/DictationModal";

/**
 * Sidebar navigation component for desktop view
 * Dark theme sidebar with clean icons and hover effects
 */
export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [isDictationModalOpen, setIsDictationModalOpen] = useState(false);
  
  const isActive = (path) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOutAction();
  };

  const openDictationModal = () => {
    setIsDictationModalOpen(true);
  };

  const closeDictationModal = () => {
    setIsDictationModalOpen(false);
  };

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-shadow h-screen fixed top-0 left-0 border-r border-shadow-200">
        <div className="p-5 flex items-center space-x-3">
          <div className="bg-royal w-8 h-8 rounded-md flex items-center justify-center">
            <Stethoscope size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Doctors Orders</h1>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link 
            href="/dashboard" 
            className={`flex items-center px-3 py-2.5 rounded-lg ${
              isActive("/dashboard") 
                ? "bg-royal text-white" 
                : "text-white/80 hover:bg-shadow-200 transition-colors"
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
          
          <button 
            onClick={openDictationModal}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-white/80 hover:bg-shadow-200 transition-colors"
          >
            <Mic className="h-5 w-5 mr-3" />
            New Recording
          </button>
          
          <Link 
            href="/notes" 
            className={`flex items-center px-3 py-2.5 rounded-lg ${
              isActive("/notes") 
                ? "bg-royal text-white" 
                : "text-white/80 hover:bg-shadow-200 transition-colors"
            }`}
          >
            <FileText className="h-5 w-5 mr-3" />
            All Notes
          </Link>
          
          <Link 
            href="/settings" 
            className={`flex items-center px-3 py-2.5 rounded-lg ${
              isActive("/settings") 
                ? "bg-royal text-white" 
                : "text-white/80 hover:bg-shadow-200 transition-colors"
            }`}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link>
          
          <Link 
            href="/subscription" 
            className={`flex items-center px-3 py-2.5 rounded-lg ${
              isActive("/subscription") 
                ? "bg-royal text-white" 
                : "text-white/80 hover:bg-shadow-200 transition-colors"
            }`}
          >
            <CreditCard className="h-5 w-5 mr-3" />
            Subscription
          </Link>
        </nav>
        
        <div className="p-4 mt-auto border-t border-shadow-200">
          <div className="flex items-center mb-3">
            <div className="h-9 w-9 rounded-full bg-royal/20 flex items-center justify-center text-royal mr-3">
              <span className="text-sm font-medium">
                {user?.email ? user.email[0].toUpperCase() : user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.email || 'No email'}</p>
              <p className="text-xs text-white/50">{user?.user_metadata?.full_name || 'User'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full px-3 py-2 text-sm font-medium text-white/90 bg-shadow-200 rounded-lg hover:bg-shadow-300 transition-colors flex items-center justify-center group"
          >
            <LogOut className="h-4 w-4 mr-2 group-hover:text-royal transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>
      
      {/* Dictation Modal */}
      <DictationModal 
        isOpen={isDictationModalOpen} 
        onClose={closeDictationModal} 
      />
    </>
  );
}
