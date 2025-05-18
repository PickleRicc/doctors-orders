"use client";

import { useState, useEffect } from 'react';
import { X, Save, ChevronDown, FileText, User, Tag, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * NoteEditor component
 * Provides an interface for editing existing notes
 */
export default function NoteEditor({ note, onClose, onSave }) {
  const router = useRouter();
  const [editedNote, setEditedNote] = useState(note);
  const [isSOAPNote, setIsSOAPNote] = useState(note?.type === 'SOAP Note');
  const [newTag, setNewTag] = useState('');
  
  // Initialize form when note changes
  useEffect(() => {
    if (note) {
      setEditedNote(note);
      setIsSOAPNote(note.type === 'SOAP Note');
    }
  }, [note]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedNote(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle SOAP content changes
  const handleSOAPChange = (e) => {
    const { name, value } = e.target;
    setEditedNote(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [name]: value
      }
    }));
  };
  
  // Handle non-SOAP content changes
  const handleContentChange = (e) => {
    setEditedNote(prev => ({
      ...prev,
      content: e.target.value
    }));
  };
  
  // Handle type change
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const isNewSOAP = newType === 'SOAP Note';
    setIsSOAPNote(isNewSOAP);
    
    // Convert content format if type changes between SOAP and non-SOAP
    let newContent;
    if (isNewSOAP && typeof editedNote.content === 'string') {
      // Convert string content to SOAP format
      newContent = {
        subjective: editedNote.content,
        objective: '',
        assessment: '',
        plan: ''
      };
    } else if (!isNewSOAP && typeof editedNote.content === 'object') {
      // Convert SOAP format to string
      newContent = Object.values(editedNote.content).filter(Boolean).join('\n\n');
    } else {
      newContent = editedNote.content;
    }
    
    setEditedNote(prev => ({
      ...prev,
      type: newType,
      content: newContent
    }));
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (newTag.trim() && !editedNote.tags.includes(newTag.trim())) {
      setEditedNote(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  // Handle tag removal
  const handleRemoveTag = (tagToRemove) => {
    setEditedNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real implementation, we would send the updated note to the GCP backend
    // For now, we'll just update our local state and simulate a save
    if (onSave) {
      onSave(editedNote);
    } else {
      // If no onSave prop is provided, we'll just close the editor
      // In a real implementation, you might want to show a success message
      console.log("Note saved:", editedNote);
      
      // Refresh the page to show the updated note
      // In a real implementation, this would be handled by revalidating the data
      router.refresh();
      
      if (onClose) {
        onClose();
      }
    }
  };
  
  if (!note) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold">Edit Note</h2>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Title</label>
              <input
                type="text"
                name="title"
                value={editedNote.title}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                required
              />
            </div>
            
            {/* Patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <input
                type="text"
                name="patient"
                value={editedNote.patient}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                required
              />
            </div>
            
            {/* Note Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />
                Note Type
              </label>
              <select
                name="type"
                value={editedNote.type}
                onChange={handleTypeChange}
                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
              >
                <option value="SOAP Note">SOAP Note</option>
                <option value="Progress Note">Progress Note</option>
                <option value="Consultation">Consultation</option>
                <option value="Procedure Note">Procedure Note</option>
                <option value="Discharge Summary">Discharge Summary</option>
                <option value="Preventive Care">Preventive Care</option>
              </select>
            </div>
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag size={14} className="inline mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editedNote.tags && editedNote.tags.map((tag, index) => (
                  <div 
                    key={index}
                    className="flex items-center bg-gray-100 px-2 py-1 rounded-full"
                  >
                    <span className="text-xs text-gray-700">{tag}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-grow px-3 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-gray-100 border border-gray-200 border-l-0 rounded-r-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            
            {/* Note Content */}
            {isSOAPNote ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">SOAP Note Content</h3>
                
                {/* Subjective */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjective</label>
                  <textarea
                    name="subjective"
                    value={editedNote.content?.subjective || ''}
                    onChange={handleSOAPChange}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                  ></textarea>
                </div>
                
                {/* Objective */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                  <textarea
                    name="objective"
                    value={editedNote.content?.objective || ''}
                    onChange={handleSOAPChange}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                  ></textarea>
                </div>
                
                {/* Assessment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                  <textarea
                    name="assessment"
                    value={editedNote.content?.assessment || ''}
                    onChange={handleSOAPChange}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                  ></textarea>
                </div>
                
                {/* Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <textarea
                    name="plan"
                    value={editedNote.content?.plan || ''}
                    onChange={handleSOAPChange}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                  ></textarea>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Content</label>
                <textarea
                  name="content"
                  value={typeof editedNote.content === 'string' ? editedNote.content : ''}
                  onChange={handleContentChange}
                  rows={12}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
                ></textarea>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-royal hover:bg-royal-700 rounded-lg transition-colors text-white flex items-center"
            >
              <Save size={16} className="mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
