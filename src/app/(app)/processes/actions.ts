"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import type { StepStatus } from "@/generated/prisma/enums";

type FormActionState = { error?: string; success?: boolean };

const createProcessSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  ownerId: z.string().min(1, "Responsavel obrigatorio"),
  deadline: z.string().optional(),
});

export async function createProcess(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.PROCESSES_MANAGE]);
  const parsed = createProcessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  const process = await prisma.process.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      description: data.description || undefined,
      departmentId: data.departmentId || undefined,
      ownerId: data.ownerId,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "Process",
    entityId: process.id,
    newData: { name: process.name },
  });

  revalidatePath("/processes");
  return { success: true };
}

const addStepSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  ownerId: z.string().min(1, "Responsavel obrigatorio"),
  deadline: z.string().optional(),
});

export async function addProcessStep(processId: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.PROCESSES_MANAGE]);
  const process = await prisma.process.findFirst({ where: { id: processId, organizationId: user.organizationId } });
  if (!process) return { error: "Processo nao encontrado." };

  const parsed = addStepSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  const lastStep = await prisma.processStep.findFirst({ where: { processId }, orderBy: { order: "desc" } });

  await prisma.processStep.create({
    data: {
      processId,
      name: data.name,
      ownerId: data.ownerId,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      order: (lastStep?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/processes/${processId}`);
  return { success: true };
}

export async function updateStepStatus(stepId: string, status: StepStatus) {
  const user = await requirePermission([PERMISSIONS.PROCESSES_MANAGE]);
  const step = await prisma.processStep.findFirst({
    where: { id: stepId, process: { organizationId: user.organizationId } },
  });
  if (!step) throw new Error("Etapa nao encontrada.");

  await prisma.processStep.update({ where: { id: stepId }, data: { status } });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "ProcessStep",
    entityId: stepId,
    oldData: { status: step.status },
    newData: { status },
  });

  revalidatePath(`/processes/${step.processId}`);
}

export async function toggleChecklistItem(itemId: string, done: boolean) {
  const user = await requireUser();
  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, processStep: { process: { organizationId: user.organizationId } } },
    include: { processStep: true },
  });
  if (!item) throw new Error("Item nao encontrado.");

  await prisma.checklistItem.update({ where: { id: itemId }, data: { done } });
  revalidatePath(`/processes/${item.processStep.processId}`);
}

export async function addChecklistItem(stepId: string, label: string) {
  const user = await requirePermission([PERMISSIONS.PROCESSES_MANAGE]);
  const step = await prisma.processStep.findFirst({
    where: { id: stepId, process: { organizationId: user.organizationId } },
  });
  if (!step || !label.trim()) return;

  const lastItem = await prisma.checklistItem.findFirst({ where: { processStepId: stepId }, orderBy: { order: "desc" } });
  await prisma.checklistItem.create({
    data: { processStepId: stepId, label: label.trim(), order: (lastItem?.order ?? 0) + 1 },
  });

  revalidatePath(`/processes/${step.processId}`);
}
