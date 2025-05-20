import { createClient } from "../../../supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import NoteCard from "../../components/notes/NoteCard";

/**
 * Individual Note Page
 * Displays a single note with all its details
 */
export default async function NotePage({ params }) {
  // Get the note ID from the URL params
  const id = params.id;
  
  // Server-side authentication check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch the specific note from the API
  let note = null;
  let error = null;
  
  try {
    // Get auth token for API request
    const authToken = process.env.NODE_ENV === 'development' 
      ? 'dev-token' // Use a dev token in development
      : user?.token?.access_token; // Use the real token in production
    
    // Fetch the note from the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/notes/${id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      // For development, fall back to dummy data if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using fallback dummy data');
        // Create a dummy note for development purposes
        note = {
          id,
          title: `Development Note ${id}`,
          date: new Date().toISOString(),
          patient: "Test Patient",
          type: "SOAP Note",
          tags: ["Development", "Test"],
          snippet: "This is a fallback note created for development purposes when the API is unavailable.",
          content: {
            subjective: "Patient reports symptoms consistent with the test case.",
            objective: "Examination reveals expected test results.",
            assessment: "Development testing in progress.",
            plan: "Continue development and fix API issues."
          }
        };
        return; // Skip the error throw to use the fallback note
      }
      
      throw new Error(`Failed to fetch note: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (!result.data) {
      throw new Error('Note not found');
    }
    
    // Transform the note to match the expected format for the NoteCard component
    const rawNote = result.data;
    
    // Parse the SOAP data if it's a string
    let soapData = rawNote.soap_data;
    if (typeof soapData === 'string') {
      try {
        soapData = JSON.parse(soapData);
      } catch (e) {
        console.error('Error parsing SOAP data:', e);
        soapData = {
          subjective: 'Error parsing data',
          objective: 'Error parsing data',
          assessment: 'Error parsing data',
          plan: 'Error parsing data'
        };
      }
    }
    
    // Ensure SOAP data has the expected structure
    const formattedSoapData = {
      subjective: soapData?.subjective || '',
      objective: soapData?.objective || '',
      assessment: soapData?.assessment || '',
      plan: soapData?.plan || ''
    };
    
    note = {
      id: rawNote.id,
      title: rawNote.title || 'Untitled Note',
      date: rawNote.created_at || rawNote.timestamp || new Date().toISOString(),
      patient: rawNote.first_name && rawNote.last_name ? 
        `${rawNote.first_name} ${rawNote.last_name}` : 
        (rawNote.patient_name || 'No Patient'),
      type: 'SOAP Note',
      tags: rawNote.tags || [],
      snippet: rawNote.raw_transcript ? 
        rawNote.raw_transcript.substring(0, 150) + (rawNote.raw_transcript.length > 150 ? '...' : '') : 
        'No content',
      content: formattedSoapData
    };
    
  } catch (err) {
    console.error('Error fetching note:', err);
    error = err.message;
    
    // For development, create a dummy note if there's an error
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Creating dummy note due to error');
      note = {
        id,
        title: `Development Note ${id}`,
        date: new Date().toISOString(),
        patient: "Test Patient",
        type: "SOAP Note",
        tags: ["Development", "Test", "Error"],
        snippet: "This is a fallback note created for development purposes when an error occurs.",
        content: {
          subjective: "Patient reports symptoms consistent with the test case.",
          objective: "Examination reveals expected test results.",
          assessment: "Development testing in progress. Error encountered: " + err.message,
          plan: "Debug the API error and fix the issue."
        }
      };
    }
  }
  
  // If no note is found or there was an error, show a "not found" UI
  if (!note || error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Link href="/notes" className="flex items-center text-royal hover:underline mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Back to Notes
        </Link>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Note Not Found</h1>
          <p className="text-gray-500 mb-6">
            {error ? `Error: ${error}` : "The note you're looking for doesn't exist or has been deleted."}
          </p>
          <Link 
            href="/notes" 
            className="inline-block px-4 py-2 bg-royal text-white rounded-md hover:bg-royal-700 transition-colors"
          >
            View All Notes
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link href="/notes" className="flex items-center text-royal hover:underline mb-6">
        <ArrowLeft size={18} className="mr-2" />
        Back to Notes
      </Link>
      
      {/* Note Card */}
      <NoteCard note={note} />
    </div>
  );
}
