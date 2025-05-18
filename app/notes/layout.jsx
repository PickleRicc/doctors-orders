import { createClient } from "../../supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";

/**
 * Notes layout
 * Provides authentication protection and consistent layout for the notes section
 * Reuses the same layout structure as the dashboard for consistency
 */
export default async function NotesLayout({ children }) {
  // Server-side authentication check
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Desktop Sidebar - Only shown on md+ screens */}
      <Sidebar user={user} />
      
      {/* Mobile Navigation */}
      <MobileNav user={user} />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-64 bg-gray-50 min-h-screen">
        {children}
      </div>
    </div>
  );
}
