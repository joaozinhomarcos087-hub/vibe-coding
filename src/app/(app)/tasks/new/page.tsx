import { requirePermission, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NewTaskForm } from "./new-task-form";

export default async function NewTaskPage() {
  const user = await requirePermission([PERMISSIONS.TASKS_MANAGE_ALL, PERMISSIONS.TASKS_MANAGE_OWN]);

  const assignees = can(user, PERMISSIONS.TASKS_MANAGE_ALL)
    ? await prisma.user.findMany({
        where: { organizationId: user.organizationId, status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [{ id: user.id, name: user.name ?? user.email ?? "Eu" }];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Nova tarefa</h1>
      <p className="mb-6 text-sm text-slate-500">Toda tarefa precisa de um responsavel.</p>
      <NewTaskForm assignees={assignees} defaultAssigneeId={user.id} />
    </div>
  );
}
