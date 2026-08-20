"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

type FormActionState = { error?: string; success?: boolean };

const createGoalSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  scope: z.enum(["COMPANY", "DEPARTMENT", "ROLE", "EMPLOYEE"]),
  departmentId: z.string().optional(),
  roleId: z.string().optional(),
  employeeId: z.string().optional(),
  targetValue: z.coerce.number(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function createGoal(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.GOALS_MANAGE]);
  const parsed = createGoalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  if (data.scope === "DEPARTMENT" && !data.departmentId) return { error: "Selecione o setor." };
  if (data.scope === "ROLE" && !data.roleId) return { error: "Selecione o cargo." };
  if (data.scope === "EMPLOYEE" && !data.employeeId) return { error: "Selecione o funcionario." };

  const goal = await prisma.goal.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      scope: data.scope,
      departmentId: data.scope === "DEPARTMENT" ? data.departmentId : undefined,
      roleId: data.scope === "ROLE" ? data.roleId : undefined,
      employeeId: data.scope === "EMPLOYEE" ? data.employeeId : undefined,
      targetValue: data.targetValue,
      period: data.period,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "Goal",
    entityId: goal.id,
    newData: { name: goal.name, scope: goal.scope },
  });

  revalidatePath("/goals");
  return { success: true };
}

const progressSchema = z.object({ achievedValue: z.coerce.number() });

export async function recordGoalProgress(goalId: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.GOALS_MANAGE]);
  const goal = await prisma.goal.findFirst({ where: { id: goalId, organizationId: user.organizationId } });
  if (!goal) return { error: "Meta nao encontrada." };

  const parsed = progressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };

  await prisma.goalProgress.create({ data: { goalId, achievedValue: parsed.data.achievedValue } });

  revalidatePath("/goals");
  return { success: true };
}
