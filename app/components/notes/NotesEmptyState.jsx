"use client";

import Link from 'next/link';
import { FileText, Mic } from 'lucide-react';

/**
 * NotesEmptyState component
 * Displays a message when the user has no notes yet
 */
export default function NotesEmptyState() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-gray-400" />
        </div>
        
        <h2 className="text-xl font-semibold mb-2">No notes yet</h2>
        <p className="text-gray-500 mb-6">
          Create your first medical note using voice dictation. Your notes will be securely stored and organized here.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dictation"
            className="flex items-center justify-center px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors"
          >
            <Mic size={18} className="mr-2" />
            Start Dictation
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
