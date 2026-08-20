"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Workflow,
  Megaphone,
  Gauge,
  Target,
  UserSquare2,
  GraduationCap,
  FileBarChart,
  Bell,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  crm: Users,
  tasks: CheckSquare,
  processes: Workflow,
  marketing: Megaphone,
  kpis: Gauge,
  goals: Target,
  employees: UserSquare2,
  trainings: GraduationCap,
  reports: FileBarChart,
  notifications: Bell,
  audit: ShieldCheck,
  settings: Settings,
};

export function Sidebar({
  modules,
}: {
  modules: { key: string; label: string; href: string }[];
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
          O
        </div>
        <span className="text-sm font-semibold text-slate-900">Operacional SaaS</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {modules.map((m) => {
          const Icon = ICONS[m.key] ?? LayoutDashboard;
          const active = pathname === m.href || pathname.startsWith(m.href + "/");
          return (
            <Link
              key={m.key}
              href={m.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
