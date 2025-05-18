import Link from "next/link";
import { createClient } from "../../supabase/server";
import DashboardContent from "./DashboardContent";

/**
 * Dashboard page component (Server Component)
 * Fetches data and passes it to the client-side DashboardContent component
 */
export default async function Dashboard() {
  // Server-side data fetching
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // In a real implementation, we would fetch recent notes from the GCP backend
  // For now, we'll use placeholder data
  const recentNotes = [
    {
      id: "1",
      title: "Patient: John Doe",
      date: "2025-05-11T10:30:00Z",
      status: "Completed",
      type: "Initial Visit",
      snippet: "Patient presents with symptoms of seasonal allergies including sneezing and congestion...",
    },
    {
      id: "2",
      title: "Patient: Jane Smith",
      date: "2025-05-10T14:15:00Z",
      status: "Completed",
      type: "Follow-up",
      snippet: "Follow-up appointment for hypertension management. Blood pressure readings have improved...",
    },
    {
      id: "3",
      title: "Patient: Robert Johnson",
      date: "2025-05-09T09:00:00Z",
      status: "Completed",
      type: "New Patient",
      snippet: "New patient intake for chronic lower back pain. Patient reports pain began approximately 3 months ago...",
    },
  ];

  // Activity summary data
  const activityData = {
    notesThisMonth: 12,
    notesThisWeek: 3,
    remainingNotes: 2,
    totalAllowed: 5,
    planStatus: "Free Tier"
  };

  // Pass data to client component
  return (
    <div className="flex-1 bg-gray-50">
      <DashboardContent 
        user={user}
        recentNotes={recentNotes}
        activityData={activityData}
      />
    </div>
  );
}
