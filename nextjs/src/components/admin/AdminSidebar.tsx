"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  ShieldAlert,
  FileText,
  Activity,
  Settings,
  AlertTriangle,
  Cpu,
} from "lucide-react";

interface AdminSidebarProps {
  adminRole: string;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    requiredRole: ["viewer", "moderator", "admin", "super_admin"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    requiredRole: ["moderator", "admin", "super_admin"],
  },
  {
    label: "Cost Control",
    href: "/admin/costs",
    icon: DollarSign,
    requiredRole: ["viewer", "moderator", "admin", "super_admin"],
  },
  {
    label: "Abuse Alerts",
    href: "/admin/abuse-alerts",
    icon: ShieldAlert,
    requiredRole: ["moderator", "admin", "super_admin"],
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
    requiredRole: ["viewer", "moderator", "admin", "super_admin"],
  },
  {
    label: "System Health",
    href: "/admin/health",
    icon: Activity,
    requiredRole: ["viewer", "moderator", "admin", "super_admin"],
  },
  {
    label: "AI Debugging",
    href: "/admin/debug",
    icon: Cpu,
    requiredRole: ["admin", "super_admin"],
  },
  {
    label: "Rate Limits",
    href: "/admin/rate-limits",
    icon: Settings,
    requiredRole: ["admin", "super_admin"],
  },
];

const roleHierarchy = ["viewer", "moderator", "admin", "super_admin"];

function hasAccess(userRole: string, requiredRoles: string[]): boolean {
  const userLevel = roleHierarchy.indexOf(userRole);
  return requiredRoles.some((role) => roleHierarchy.indexOf(role) <= userLevel);
}

export function AdminSidebar({ adminRole }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-64px)]">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          if (!hasAccess(adminRole, item.requiredRole)) {
            return null;
          }

          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500">
          <AlertTriangle className="w-4 h-4" />
          <span>Control Plane Access</span>
        </div>
        <div className="px-4 py-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400">
            {adminRole}
          </span>
        </div>
      </div>
    </aside>
  );
}
