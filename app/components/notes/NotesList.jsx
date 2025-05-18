"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, FileText, User, Tag, ChevronDown } from 'lucide-react';

/**
 * NotesList component
 * Displays a filterable, searchable list of medical notes
 */
export default function NotesList({ notes = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    date: 'all',
    patient: 'all',
  });
  
  // Filter notes based on search term and filters
  const filteredNotes = notes.filter(note => {
    // Search term filter
    if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !note.snippet.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filters.type !== 'all' && note.type !== filters.type) {
      return false;
    }
    
    // Date filter (simplified for demo)
    if (filters.date === 'today') {
      const today = new Date().toDateString();
      const noteDate = new Date(note.date).toDateString();
      if (today !== noteDate) return false;
    } else if (filters.date === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(note.date) < weekAgo) return false;
    } else if (filters.date === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      if (new Date(note.date) < monthAgo) return false;
    }
    
    // Patient filter
    if (filters.patient !== 'all' && note.patient !== filters.patient) {
      return false;
    }
    
    return true;
  });
  
  // Get unique values for filters
  const noteTypes = ['all', ...new Set(notes.map(note => note.type))];
  const patients = ['all', ...new Set(notes.map(note => note.patient))];
  
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
          />
        </div>
        
        {/* Filter Button */}
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter size={18} className="mr-2 text-gray-500" />
          <span>Filter</span>
          <ChevronDown 
            size={16} 
            className={`ml-2 transition-transform ${filterOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>
      
      {/* Filter Options */}
      {filterOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Note Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText size={14} className="inline mr-1" />
              Note Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
            >
              {noteTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Date Range
            </label>
            <select
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          {/* Patient Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={14} className="inline mr-1" />
              Patient
            </label>
            <select
              value={filters.patient}
              onChange={(e) => setFilters({...filters, patient: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
            >
              {patients.map(patient => (
                <option key={patient} value={patient}>
                  {patient === 'all' ? 'All Patients' : patient}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* Notes List */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        {filteredNotes.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredNotes.map((note) => (
              <Link 
                key={note.id} 
                href={`/notes/${note.id}`}
                className="block hover:bg-gray-50 transition-colors"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg mb-1">{note.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{note.snippet}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-royal/20 text-royal mb-2">
                        {note.type}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(note.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <User size={14} className="text-gray-400 mr-1" />
                    <span className="text-gray-500 text-sm">{note.patient}</span>
                    {note.tags && note.tags.length > 0 && (
                      <div className="ml-4 flex items-center">
                        <Tag size={14} className="text-gray-400 mr-1" />
                        <div className="flex gap-1">
                          {note.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">No notes found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterOpen ? 
                "Try adjusting your search or filters" : 
                "You haven't created any notes yet"}
            </p>
            <Link 
              href="/dictation" 
              className="inline-block px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors"
            >
              Create Your First Note
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
