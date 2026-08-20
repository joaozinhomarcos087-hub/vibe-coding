"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission, can } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { canManageTask } from "@/lib/tasks";
import type { TaskStatus } from "@/generated/prisma/enums";

type FormActionState = { error?: string; success?: boolean };

const createTaskSchema = z.object({
  title: z.string().min(2, "Titulo obrigatorio"),
  description: z.string().optional(),
  assigneeId: z.string().min(1, "Responsavel obrigatorio"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]),
  departmentId: z.string().optional(),
});

export async function createTask(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.TASKS_MANAGE_ALL, PERMISSIONS.TASKS_MANAGE_OWN]);

  const parsed = createTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  if (!can(user, PERMISSIONS.TASKS_MANAGE_ALL) && data.assigneeId !== user.id) {
    return { error: "Voce so pode criar tarefas atribuidas a si mesmo." };
  }

  const task = await prisma.task.create({
    data: {
      organizationId: user.organizationId,
      title: data.title,
      description: data.description || undefined,
      assigneeId: data.assigneeId,
      creatorId: user.id,
      departmentId: data.departmentId || user.departmentId || undefined,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      recurrence: data.recurrence,
      status: "TODO",
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "Task",
    entityId: task.id,
    newData: { title: task.title, assigneeId: task.assigneeId },
  });

  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const user = await requireUser();
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId: user.organizationId } });
  if (!task) throw new Error("Tarefa nao encontrada.");
  if (!canManageTask(user, task)) throw new Error("Sem permissao para alterar esta tarefa.");
  if (newStatus === task.status) return;

  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus, escalatedAt: newStatus === "DONE" || newStatus === "CANCELED" ? null : task.escalatedAt },
  });

  // Recurring tasks (section 17): completing one schedules the next occurrence.
  if (newStatus === "DONE" && task.recurrence !== "NONE" && task.dueDate) {
    const next = new Date(task.dueDate);
    if (task.recurrence === "DAILY") next.setDate(next.getDate() + 1);
    if (task.recurrence === "WEEKLY") next.setDate(next.getDate() + 7);
    if (task.recurrence === "MONTHLY") next.setMonth(next.getMonth() + 1);

    await prisma.task.create({
      data: {
        organizationId: task.organizationId,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
        departmentId: task.departmentId,
        priority: task.priority,
        dueDate: next,
        recurrence: task.recurrence,
        status: "TODO",
      },
    });
  }

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "Task",
    entityId: taskId,
    oldData: { status: task.status },
    newData: { status: newStatus },
  });

  revalidatePath("/tasks");
}

export async function addTaskComment(taskId: string, body: string) {
  const user = await requireUser();
  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId: user.organizationId } });
  if (!task) throw new Error("Tarefa nao encontrada.");
  if (!canManageTask(user, task)) throw new Error("Sem permissao.");
  if (!body.trim()) return;

  await prisma.comment.create({ data: { taskId, authorId: user.id, body: body.trim() } });
  revalidatePath("/tasks");
}
