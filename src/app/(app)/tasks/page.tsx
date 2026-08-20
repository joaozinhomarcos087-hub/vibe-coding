import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { taskWhereForUser, TASK_STATUS_ORDER, TASK_STATUS_LABELS } from "@/lib/tasks";
import { syncOrgTaskEscalation } from "@/lib/task-escalation";
import { TasksBoard } from "./tasks-board";

export default async function TasksPage() {
  const user = await requirePermission([PERMISSIONS.TASKS_VIEW_ALL, PERMISSIONS.TASKS_VIEW_OWN]);

  await syncOrgTaskEscalation(user.organizationId).catch(() => {});

  const tasks = await prisma.task.findMany({
    where: taskWhereForUser(user),
    include: { assignee: { select: { name: true } }, lead: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const cards = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    assigneeName: t.assignee.name,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    leadName: t.lead?.name ?? null,
  }));

  const columns = TASK_STATUS_ORDER.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    cards: cards.filter((c) => c.status === status),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Tarefas</h1>
          <p className="text-sm text-slate-500">{tasks.length} tarefa(s) visiveis para voce</p>
        </div>
        <Link
          href="/tasks/new"
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Nova tarefa
        </Link>
      </div>
      <TasksBoard columns={columns} />
    </div>
  );
}
