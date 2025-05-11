import { createClient } from "../../supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";

/**
 * Dashboard layout used for all authenticated sections
 * Provides authentication protection and consistent layout across app
 */
export default async function DashboardLayout({ children }) {
  // Server-side authentication check
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-shadow text-white">
      {/* Desktop Sidebar - Only shown on md+ screens */}
      <Sidebar user={user} />
      
      {/* Mobile Navigation */}
      <MobileNav user={user} />
      
      {/* Main Content */}
      {children}
    </div>
  );
}
