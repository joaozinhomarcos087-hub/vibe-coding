"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { canManageMarketingTask } from "@/lib/marketing";
import type { ContentStatus, MarketingTaskType } from "@/generated/prisma/enums";

type FormActionState = { error?: string; success?: boolean };

const TYPES: [MarketingTaskType, ...MarketingTaskType[]] = [
  "ARTE",
  "VIDEO",
  "REELS",
  "COPY",
  "CAMPANHA",
  "SOCIAL_MEDIA",
  "TRAFEGO",
  "OUTRO",
];

const createSchema = z.object({
  title: z.string().min(2, "Titulo obrigatorio"),
  description: z.string().optional(),
  type: z.enum(TYPES),
  assigneeId: z.string().min(1, "Responsavel obrigatorio"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
});

export async function createMarketingTask(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.MARKETING_MANAGE_ALL, PERMISSIONS.MARKETING_MANAGE_OWN]);
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  const task = await prisma.marketingTask.create({
    data: {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      assigneeId: data.assigneeId,
      requesterId: user.id,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: "BACKLOG",
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "MarketingTask",
    entityId: task.id,
    newData: { title: task.title },
  });

  revalidatePath("/marketing");
  return { success: true };
}

export async function updateMarketingTaskStatus(taskId: string, newStatus: ContentStatus) {
  const user = await requireUser();
  const task = await prisma.marketingTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Demanda nao encontrada.");
  if (!canManageMarketingTask(user, task)) throw new Error("Sem permissao.");
  if (newStatus === task.status) return;

  await prisma.marketingTask.update({
    where: { id: taskId },
    data: { status: newStatus, approvedAt: newStatus === "APROVADO" ? new Date() : task.approvedAt },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "MarketingTask",
    entityId: taskId,
    oldData: { status: task.status },
    newData: { status: newStatus },
  });

  revalidatePath("/marketing");
}
