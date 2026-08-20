import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NewMarketingTaskForm } from "./new-marketing-task-form";

export default async function NewMarketingTaskPage() {
  const user = await requirePermission([PERMISSIONS.MARKETING_MANAGE_ALL, PERMISSIONS.MARKETING_MANAGE_OWN]);

  const assignees = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      status: "ACTIVE",
      role: { key: { in: ["MARKETING", "DESIGNER", "FILMMAKER", "SOCIAL_MEDIA", "TRAFEGO", "GESTOR_MARKETING"] } },
    },
    select: { id: true, name: true, role: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Nova demanda de marketing</h1>
      <NewMarketingTaskForm assignees={assignees} />
    </div>
  );
}
