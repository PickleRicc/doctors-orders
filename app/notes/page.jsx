import { createClient } from "../../supabase/server";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import NotesList from "../components/notes/NotesList";
import NotesEmptyState from "../components/notes/NotesEmptyState";

/**
 * Notes page
 * Displays a list of the user's medical notes with search and filter functionality
 */
export default async function NotesPage() {
  // Server-side data fetching
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch notes from the API
  let notes = [];
  let error = null;
  
  try {
    // Get auth token for API request
    const authToken = process.env.NODE_ENV === 'development' 
      ? 'dev-token' // Use a dev token in development
      : user?.token?.access_token; // Use the real token in production
    
    // Fetch notes from the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      // For development, fall back to dummy data if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using fallback dummy data');
        // Create dummy notes for development purposes
        notes = [
          {
            id: "1",
            title: "Patient: John Doe - Initial Consultation",
            date: "2025-05-15T10:30:00Z",
            patient: "John Doe",
            type: "SOAP Note",
            tags: ["Hypertension", "Diabetes"],
            snippet: "Patient presents with complaints of persistent headaches and fatigue for the past two weeks. Reports increased stress at work.",
            content: {
              subjective: "Patient is a 45-year-old male presenting with complaints of persistent headaches and fatigue for the past two weeks. Reports increased stress at work and difficulty sleeping.",
              objective: "Vital Signs: BP: 142/88 mmHg, HR: 78 bpm, RR: 16/min, Temp: 98.6°F",
              assessment: "1. Tension headaches, likely related to stress and possible hypertension\n2. Fatigue, possibly related to poor sleep quality",
              plan: "1. Start lisinopril 10mg daily for hypertension\n2. Recommend stress management techniques"
            }
          },
          {
            id: "2",
            title: "Patient: Jane Smith - Follow-up Visit",
            date: "2025-05-14T14:15:00Z",
            patient: "Jane Smith",
            type: "Progress Note",
            tags: ["Asthma", "Allergies"],
            snippet: "Patient returns for follow-up of asthma management. Reports improved symptoms with current medication regimen.",
            content: "Patient returns for follow-up of asthma management. Reports improved symptoms with current medication regimen."
          }
        ];
        return; // Skip the error throw to use the fallback notes
      }
      
      throw new Error(`Failed to fetch notes: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // The API returns an object with a 'notes' property containing the array of notes
    const notesData = result.data || { notes: [], total: 0 };
    notes = notesData.notes || [];
    
    // Transform the notes to match the expected format for the NotesList component
    notes = notes.map(note => ({
      id: note.id,
      title: note.title || 'Untitled Note',
      date: note.created_at || note.timestamp || new Date().toISOString(),
      patient: note.first_name && note.last_name ? 
        `${note.first_name} ${note.last_name}` : 
        (note.patient_name || 'No Patient'),
      type: note.template_id ? 'SOAP Note' : 'Note',
      tags: note.tags || [],
      snippet: note.raw_transcript ? 
        note.raw_transcript.substring(0, 150) + (note.raw_transcript.length > 150 ? '...' : '') : 
        (note.soap_data ? 'SOAP Note' : 'No content'),
      content: note.soap_data || {}
    }));
    
  } catch (err) {
    console.error('Error fetching notes:', err);
    error = err.message;
    
    // For development, use dummy data if there's an error
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using dummy data due to error');
      notes = [
        {
          id: "dev-1",
          title: "Development Note - Error Fallback",
          date: new Date().toISOString(),
          patient: "Test Patient",
          type: "SOAP Note",
          tags: ["Development", "Test", "Error"],
          snippet: "This is a fallback note created for development purposes when an error occurs: " + err.message,
          content: {
            subjective: "Patient reports symptoms consistent with the test case.",
            objective: "Examination reveals expected test results.",
            assessment: "Development testing in progress. Error encountered: " + err.message,
            plan: "Debug the API error and fix the issue."
          }
        }
      ];
    }
  }
  
  // Check if there are any notes
  const hasNotes = notes.length > 0;
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Medical Notes</h1>
          <p className="text-gray-500 text-sm">
            {hasNotes 
              ? `You have ${notes.length} saved note${notes.length !== 1 ? 's' : ''}`
              : 'Create and manage your medical notes'}
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-1">Error: {error}</p>
          )}
        </div>
        
        <Link
          href="/dictation"
          className="flex items-center px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          New Note
        </Link>
      </header>
      
      {/* Notes Content */}
      {hasNotes ? (
        <NotesList notes={notes} />
      ) : (
        <NotesEmptyState />
      )}
    </div>
  );
}
