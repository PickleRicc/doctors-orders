"use client";

import { useState } from "react";
import Link from "next/link";
import { Mic, FileText, Activity, Clock, Calendar, Settings, PlusCircle } from "lucide-react";
import DictationModal from "../components/dictation/DictationModal";

/**
 * DashboardContent component (Client Component)
 * Renders the dashboard UI with data passed from the server component
 */
export default function DashboardContent({ user, recentNotes, activityData }) {
  const [isDictationModalOpen, setIsDictationModalOpen] = useState(false);
  
  const openDictationModal = () => {
    setIsDictationModalOpen(true);
  };
  
  const closeDictationModal = () => {
    setIsDictationModalOpen(false);
  };
  return (
    <div className="min-h-screen flex-1 md:ml-64">
      <div className="w-full">
        <div className="p-6 max-w-6xl mx-auto dashboard">
      {/* Top Header with User Info */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.email || 'test1121@gmail.com'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Settings size={18} className="text-gray-500" />
          </button>
          <div className="h-8 w-8 bg-royal rounded-full flex items-center justify-center text-white">
            <span className="font-medium">T</span>
          </div>
        </div>
      </header>
      
      {/* 30-Day Summary Cards */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Activity size={18} className="mr-2 text-royal" />
          30 Day Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Notes Created</h3>
            <div className="flex justify-between items-end">
              <p className="text-3xl font-bold">{activityData.notesThisMonth}</p>
              <span className="text-royal text-xs">This Month</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Remaining Notes</h3>
            <div className="flex justify-between items-end">
              <p className="text-3xl font-bold">{activityData.remainingNotes} <span className="text-gray-400 text-lg">/ {activityData.totalAllowed}</span></p>
              <span className="text-royal text-xs">{activityData.planStatus}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Recent Activity</h3>
            <div className="flex justify-between items-end">
              <p className="text-3xl font-bold">{activityData.notesThisWeek}</p>
              <span className="text-royal text-xs">This Week</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <PlusCircle size={18} className="mr-2 text-royal" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={openDictationModal}
            className="relative bg-royal hover:bg-royal-700 transition-colors rounded-lg p-4 flex items-center w-full text-left overflow-hidden text-white">
            {/* Border Beam Effect */}
            <div className="absolute inset-0 rounded-lg border border-royal/50 [background:linear-gradient(var(--royal),var(--royal))_padding-box,linear-gradient(to_right,#2563eb,transparent)_border-box] z-0 animate-pulse"></div>
            
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4 relative z-10">
              <Mic className="h-5 w-5" />
            </div>
            <div className="relative z-10">
              <h3 className="text-base font-semibold mb-0.5">New Dictation</h3>
              <p className="text-white/80 text-sm">Create a new note using voice dictation</p>
            </div>
          </button>
          
          <Link 
            href="/notes" 
            className="bg-white hover:bg-gray-50 transition-colors rounded-lg p-4 flex items-center border border-gray-200 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-royal/10 flex items-center justify-center mr-4 text-royal">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-0.5">All Notes</h3>
              <p className="text-gray-500 text-sm">Browse and manage your saved notes</p>
            </div>
          </Link>
        </div>
      </section>
      
      {/* Recent Notes Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Clock size={20} className="mr-2 text-royal" />
            Recent Notes
          </h2>
          <Link 
            href="/notes" 
            className="text-sm text-royal hover:text-royal-400 font-medium">
            View All
          </Link>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Title</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm hidden md:table-cell">Type</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm hidden md:table-cell">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentNotes.map((note) => (
                <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/notes/${note.id}`} className="block">
                      <h3 className="font-medium">{note.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-1 md:hidden">{note.snippet}</p>
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-gray-500">{note.type}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-royal/20 text-royal">
                      {note.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {new Date(note.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {recentNotes.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 px-4 text-center">
                    <p className="text-gray-500 mb-4">You haven't created any notes yet</p>
                    <Link 
                      href="/dictation" 
                      className="inline-block px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors">
                      Create Your First Note
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Calendar Preview (Optional) */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar size={20} className="mr-2 text-royal" />
          Upcoming Sessions
        </h2>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-center py-8">
          <p className="text-gray-500 mb-4">You don't have any upcoming sessions scheduled</p>
          <Link 
            href="/schedule" 
            className="inline-block px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors">
            Schedule a Session
          </Link>
        </div>
      </section>
        </div>
      </div>
      
      {/* Dictation Modal */}
      <DictationModal isOpen={isDictationModalOpen} onClose={closeDictationModal} />
    </div>
  );
}
