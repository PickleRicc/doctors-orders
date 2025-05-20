"use client";

import { useState } from 'react';
import { Save, X } from 'lucide-react';

/**
 * SoapNotePreview component
 * Displays a preview of a generated SOAP note with options to edit and save
 */
export default function SoapNotePreview({ 
  soapData, 
  noteTitle, 
  onTitleChange, 
  onSave, 
  onCancel, 
  onEdit,
  recordingTime,
  isSaving
}) {
  // Format recording time as MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Generated SOAP Note</h3>
        <div className="text-sm text-gray-500">{formatTime(recordingTime)}</div>
      </div>
      
      {/* Note Title */}
      <div className="mb-4">
        <label htmlFor="previewNoteTitle" className="block text-sm font-medium text-gray-700 mb-1">Note Title</label>
        <input
          type="text"
          id="previewNoteTitle"
          value={noteTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal focus:border-royal"
        />
      </div>
      
      {/* SOAP Content Preview */}
      <div className="space-y-4">
        {/* Subjective */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-1">Subjective</h4>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
            <p className="whitespace-pre-wrap">{soapData.subjective}</p>
          </div>
        </div>
        
        {/* Objective */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-1">Objective</h4>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
            <p className="whitespace-pre-wrap">{soapData.objective}</p>
          </div>
        </div>
        
        {/* Assessment */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-1">Assessment</h4>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
            <p className="whitespace-pre-wrap">{soapData.assessment}</p>
          </div>
        </div>
        
        {/* Plan */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-1">Plan</h4>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
            <p className="whitespace-pre-wrap">{soapData.plan}</p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 text-sm"
        >
          Back to Transcript
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 text-sm"
          >
            Edit
          </button>
          
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 bg-royal hover:bg-royal-700 rounded-lg transition-colors flex items-center text-white disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
