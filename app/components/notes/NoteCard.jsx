"use client";

import { useState } from 'react';
import { Calendar, Clock, User, Tag, FileText, MoreVertical, Edit, Download, Trash, Share2 } from 'lucide-react';
import NoteEditor from './NoteEditor';

/**
 * NoteCard component
 * Displays a single note with detailed information and actions
 */
export default function NoteCard({ note }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState(note);
  
  if (!currentNote) return null;
  
  // Format date for display
  const formattedDate = new Date(currentNote.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Format time for display
  const formattedTime = new Date(currentNote.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Handle opening the editor
  const handleEdit = () => {
    setIsEditing(true);
    setMenuOpen(false);
  };
  
  // Handle saving edited note
  const handleSaveEdit = (updatedNote) => {
    // In a real implementation, we would send the updated note to the GCP backend
    // For now, we'll just update our local state
    setCurrentNote(updatedNote);
    setIsEditing(false);
  };
  
  // Render the note card
  const renderNoteCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Note Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{currentNote.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                {formattedDate}
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                {formattedTime}
              </div>
              <div className="flex items-center">
                <User size={16} className="mr-1" />
                {currentNote.patient}
              </div>
              <div className="flex items-center">
                <FileText size={16} className="mr-1" />
                {currentNote.type}
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-gray-500" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleEdit}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Note
                  </button>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      // Download functionality would go here
                      setMenuOpen(false);
                    }}
                  >
                    <Download size={16} className="mr-2" />
                    Export as PDF
                  </button>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      // Share functionality would go here
                      setMenuOpen(false);
                    }}
                  >
                    <Share2 size={16} className="mr-2" />
                    Share Note
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      // Delete functionality would go here
                      setMenuOpen(false);
                    }}
                  >
                    <Trash size={16} className="mr-2" />
                    Delete Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tags */}
        {currentNote.tags && currentNote.tags.length > 0 && (
          <div className="mt-4 flex items-center flex-wrap gap-2">
            <Tag size={16} className="text-gray-400" />
            {currentNote.tags.map((tag, index) => (
              <span 
                key={index}
                className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Note Content */}
      <div className="p-6">
        {/* If SOAP note, display structured content */}
        {currentNote.type === 'SOAP Note' && currentNote.content && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2 text-royal">Subjective</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{currentNote.content.subjective}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2 text-royal">Objective</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{currentNote.content.objective}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2 text-royal">Assessment</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{currentNote.content.assessment}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2 text-royal">Plan</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{currentNote.content.plan}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* For other note types, display as plain text */}
        {currentNote.type !== 'SOAP Note' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{currentNote.content || currentNote.snippet}</p>
          </div>
        )}
      </div>
      
      {/* Note Footer */}
      <div className="p-6 border-t border-gray-100 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated: {formattedDate} at {formattedTime}
          </div>
          <div>
            <button 
              className="px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors"
              onClick={handleEdit}
            >
              <Edit size={16} className="inline mr-1" />
              Edit Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      {/* Note Card */}
      {renderNoteCard()}
      
      {/* Edit Modal */}
      {isEditing && (
        <NoteEditor 
          note={currentNote} 
          onClose={() => setIsEditing(false)} 
          onSave={handleSaveEdit} 
        />
      )}
    </>
  );
}
