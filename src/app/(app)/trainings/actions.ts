"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

type FormActionState = { error?: string; success?: boolean };

const createSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  roleId: z.string().optional(),
  materialUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  deadline: z.string().optional(),
});

export async function createTraining(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.TRAININGS_MANAGE]);
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  const training = await prisma.training.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      description: data.description || undefined,
      departmentId: data.departmentId || undefined,
      roleId: data.roleId || undefined,
      materialUrl: data.materialUrl || undefined,
      videoUrl: data.videoUrl || undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });

  const audience = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      status: "ACTIVE",
      ...(data.roleId ? { roleId: data.roleId } : {}),
      ...(data.departmentId ? { departmentId: data.departmentId } : {}),
    },
    select: { id: true },
  });

  await prisma.trainingProgress.createMany({
    data: audience.map((u) => ({ trainingId: training.id, userId: u.id })),
    skipDuplicates: true,
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "Training",
    entityId: training.id,
    newData: { name: training.name, audience: audience.length },
  });

  revalidatePath("/trainings");
  return { success: true };
}

const progressSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "LATE"]),
  progressPercent: z.coerce.number().min(0).max(100),
});

export async function updateMyTrainingProgress(trainingId: string, formData: FormData) {
  const user = await requireUser();

  const parsed = progressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos.");
  const data = parsed.data;

  await prisma.trainingProgress.upsert({
    where: { trainingId_userId: { trainingId, userId: user.id } },
    update: {
      status: data.status,
      progressPercent: data.progressPercent,
      completedAt: data.status === "DONE" ? new Date() : null,
    },
    create: {
      trainingId,
      userId: user.id,
      status: data.status,
      progressPercent: data.progressPercent,
      completedAt: data.status === "DONE" ? new Date() : undefined,
    },
  });

  revalidatePath("/trainings");
}
