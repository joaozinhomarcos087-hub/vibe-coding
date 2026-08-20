"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

type FormActionState = { error?: string; success?: boolean };

const createKpiSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  description: z.string().optional(),
  formula: z.string().optional(),
  departmentId: z.string().optional(),
  targetValue: z.coerce.number(),
  unit: z.string().optional(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]),
});

export async function createKpi(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.KPIS_MANAGE]);
  const parsed = createKpiSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  const kpi = await prisma.kpi.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      description: data.description || undefined,
      formula: data.formula || undefined,
      departmentId: data.departmentId || undefined,
      ownerId: user.id,
      targetValue: data.targetValue,
      unit: data.unit || undefined,
      period: data.period,
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "Kpi",
    entityId: kpi.id,
    newData: { name: kpi.name },
  });

  revalidatePath("/kpis");
  return { success: true };
}

const recordResultSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  resultValue: z.coerce.number(),
  status: z.enum(["ON_TARGET", "WARNING", "OFF_TARGET"]),
});

export async function recordKpiResult(kpiId: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.KPIS_MANAGE]);
  const kpi = await prisma.kpi.findFirst({ where: { id: kpiId, organizationId: user.organizationId } });
  if (!kpi) return { error: "KPI nao encontrado." };

  const parsed = recordResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  await prisma.kpiResult.create({
    data: {
      kpiId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      resultValue: data.resultValue,
      status: data.status,
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "KpiResult",
    entityId: kpiId,
    newData: data,
  });

  revalidatePath("/kpis");
  return { success: true };
}
