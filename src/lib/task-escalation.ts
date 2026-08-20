import { prisma } from "@/lib/prisma";

/**
 * Section 17: an overdue task must be flagged LATE, notify its assignee,
 * and escalate to their manager. Idempotent (escalatedAt guards against
 * re-notifying); like the CRM alert engine this runs opportunistically from
 * page loads since there is no background worker in this environment — in
 * production it should run on a schedule instead.
 */
export async function syncOrgTaskEscalation(organizationId: string) {
  const now = new Date();

  const overdue = await prisma.task.findMany({
    where: {
      organizationId,
      status: { in: ["TODO", "IN_PROGRESS"] },
      dueDate: { lt: now },
    },
    select: {
      id: true,
      title: true,
      assigneeId: true,
      escalatedAt: true,
      assignee: { select: { employee: { select: { manager: { select: { userId: true } } } } } },
    },
  });

  for (const task of overdue) {
    const alreadyEscalated = !!task.escalatedAt;

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "LATE", escalatedAt: task.escalatedAt ?? now },
    });

    if (alreadyEscalated) continue;

    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        type: "TASK_LATE",
        title: "Tarefa atrasada",
        body: `"${task.title}" esta atrasada.`,
        link: "/tasks",
      },
    });

    const managerUserId = task.assignee.employee?.manager?.userId;
    if (managerUserId) {
      await prisma.notification.create({
        data: {
          userId: managerUserId,
          type: "TASK_LATE",
          title: "Tarefa da equipe atrasada",
          body: `"${task.title}" esta atrasada e foi escalada para voce.`,
          link: "/tasks",
        },
      });
    }
  }
}
