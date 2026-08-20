import { requireUser, canAny } from "@/lib/authz";
import { MODULE_ACCESS } from "@/lib/permissions";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const modules = MODULE_ACCESS.filter((m) => canAny(user, m.anyOf));
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar modules={modules} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar name={user.name ?? user.email ?? ""} roleName={user.roleName} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
