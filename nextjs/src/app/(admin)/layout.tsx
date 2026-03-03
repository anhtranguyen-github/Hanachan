"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface AdminUser {
  id: string;
  email?: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user has admin role
        const { data: adminRole, error } = await supabase
          .from("admin_roles")
          .select("role, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (error || !adminRole) {
          console.error("Admin access denied:", error);
          router.push("/dashboard");
          return;
        }

        setAdminUser({
          id: user.id,
          email: user.email,
          role: adminRole.role,
        });
      } catch (err) {
        console.error("Error checking admin access:", err);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader user={adminUser} adminRole={{ role: adminUser.role }} />
      <div className="flex">
        <AdminSidebar adminRole={adminUser.role} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
