"use client";

import Link from "next/link";
import { Mic, FileText, Activity, Clock, Calendar, Settings, PlusCircle } from "lucide-react";

/**
 * DashboardContent component (Client Component)
 * Renders the dashboard UI with data passed from the server component
 */
export default function DashboardContent({ user, recentNotes, activityData }) {
  return (
    <div className="min-h-screen flex-1 md:ml-64">
      <div className="w-full">
        <div className="p-6 max-w-6xl mx-auto">
      {/* Top Header with User Info */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-white/70 text-sm">Welcome back, {user?.email || 'test1121@gmail.com'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-shadow-100 rounded-full transition-colors">
            <Settings size={18} className="text-white/70" />
          </button>
          <div className="h-8 w-8 bg-royal rounded-full flex items-center justify-center">
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
          <div className="bg-shadow-100 rounded-lg p-4 border border-shadow-200">
            <h3 className="text-xs font-medium text-white/70 mb-2">Notes Created</h3>
            <div className="flex justify-between items-end">
              <p className="text-3xl font-bold">{activityData.notesThisMonth}</p>
              <span className="text-royal text-xs">This Month</span>
            </div>
          </div>
          
          <div className="bg-shadow-100 rounded-lg p-4 border border-shadow-200">
            <h3 className="text-xs font-medium text-white/70 mb-2">Remaining Notes</h3>
            <div className="flex justify-between items-end">
              <p className="text-3xl font-bold">{activityData.remainingNotes} <span className="text-white/50 text-lg">/ {activityData.totalAllowed}</span></p>
              <span className="text-royal text-xs">{activityData.planStatus}</span>
            </div>
          </div>
          
          <div className="bg-shadow-100 rounded-lg p-4 border border-shadow-200">
            <h3 className="text-xs font-medium text-white/70 mb-2">Recent Activity</h3>
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
          <Link 
            href="/dictation"
            className="bg-royal hover:bg-royal-700 transition-colors rounded-lg p-4 flex items-center">
            <div className="rounded-full p-3 mr-3 bg-royal-700">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-0.5">Start Recording</h3>
              <p className="text-white/70 text-sm">Create a new note with voice dictation</p>
            </div>
          </Link>
          
          <Link 
            href="/notes"
            className="bg-shadow-100 hover:bg-shadow-200 transition-colors border border-shadow-200 rounded-lg p-4 flex items-center">
            <div className="bg-shadow-200 rounded-full p-3 mr-3">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-0.5">All Notes</h3>
              <p className="text-white/70 text-sm">Browse and manage your saved notes</p>
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
        
        <div className="bg-shadow-100 rounded-xl overflow-hidden border border-shadow-200">
          <table className="w-full">
            <thead className="bg-shadow-200">
              <tr>
                <th className="text-left py-3 px-4 text-white/70 font-medium text-sm">Title</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium text-sm hidden md:table-cell">Type</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium text-sm hidden md:table-cell">Status</th>
                <th className="text-left py-3 px-4 text-white/70 font-medium text-sm">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shadow-200">
              {recentNotes.map((note) => (
                <tr key={note.id} className="hover:bg-shadow-200/50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/notes/${note.id}`} className="block">
                      <h3 className="font-medium">{note.title}</h3>
                      <p className="text-white/50 text-sm line-clamp-1 md:hidden">{note.snippet}</p>
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-white/70">{note.type}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-royal/20 text-royal">
                      {note.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/70 whitespace-nowrap">
                    {new Date(note.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {recentNotes.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 px-4 text-center">
                    <p className="text-white/50 mb-4">You haven't created any notes yet</p>
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
        <div className="bg-shadow-100 rounded-xl p-5 border border-shadow-200 text-center py-8">
          <p className="text-white/70 mb-4">You don't have any upcoming sessions scheduled</p>
          <Link 
            href="/schedule" 
            className="inline-block px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors">
            Schedule a Session
          </Link>
        </div>
      </section>
        </div>
      </div>
    </div>
  );
}
