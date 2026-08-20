"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

type FormActionState = { error?: string; success?: boolean };

const thresholdSchema = z.object({
  yellow: z.coerce.number().positive(),
  red: z.coerce.number().positive(),
});

export async function updateAlertThresholds(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.SETTINGS_MANAGE]);
  const parsed = thresholdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  if (parsed.data.red <= parsed.data.yellow) return { error: "O limite vermelho deve ser maior que o amarelo." };

  await prisma.systemSetting.upsert({
    where: { organizationId_key: { organizationId: user.organizationId, key: "lead_alert_thresholds_hours" } },
    update: { value: parsed.data },
    create: { organizationId: user.organizationId, key: "lead_alert_thresholds_hours", value: parsed.data },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "UPDATE",
    entityType: "SystemSetting",
    entityId: "lead_alert_thresholds_hours",
    newData: parsed.data,
  });

  revalidatePath("/settings");
  return { success: true };
}

const departmentSchema = z.object({ name: z.string().min(2, "Nome obrigatorio"), description: z.string().optional() });

export async function createDepartment(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.SETTINGS_MANAGE]);
  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };

  const existing = await prisma.department.findFirst({
    where: { organizationId: user.organizationId, name: parsed.data.name },
  });
  if (existing) return { error: "Ja existe um setor com esse nome." };

  await prisma.department.create({
    data: { organizationId: user.organizationId, name: parsed.data.name, description: parsed.data.description || undefined },
  });

  revalidatePath("/settings");
  return { success: true };
}

const userSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  roleId: z.string().min(1, "Cargo obrigatorio"),
  departmentId: z.string().optional(),
  jobTitle: z.string().min(2, "Cargo (titulo) obrigatorio"),
});

export async function createUser(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const admin = await requirePermission([PERMISSIONS.SETTINGS_MANAGE]);
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) return { error: "Ja existe um usuario com esse e-mail." };

  const role = await prisma.role.findFirst({ where: { id: data.roleId, organizationId: admin.organizationId } });
  if (!role) return { error: "Cargo invalido." };

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      organizationId: admin.organizationId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      roleId: data.roleId,
      departmentId: data.departmentId || undefined,
      status: "ACTIVE",
    },
  });

  await prisma.employee.create({
    data: {
      userId: user.id,
      jobTitle: data.jobTitle,
      departmentId: data.departmentId || undefined,
      hireDate: new Date(),
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    organizationId: admin.organizationId,
    userId: admin.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    newData: { name: user.name, email: user.email, roleId: user.roleId },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function toggleRolePermission(roleId: string, permissionId: string, granted: boolean) {
  const admin = await requirePermission([PERMISSIONS.SETTINGS_MANAGE]);
  const role = await prisma.role.findFirst({ where: { id: roleId, organizationId: admin.organizationId } });
  if (!role) throw new Error("Cargo nao encontrado.");

  if (granted) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  } else {
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  }

  await writeAuditLog({
    organizationId: admin.organizationId,
    userId: admin.id,
    action: "PERMISSION_CHANGE",
    entityType: "Role",
    entityId: roleId,
    newData: { permissionId, granted },
  });

  revalidatePath("/settings");
}

export async function toggleUserStatus(userId: string, active: boolean) {
  const admin = await requirePermission([PERMISSIONS.SETTINGS_MANAGE]);
  const target = await prisma.user.findFirst({ where: { id: userId, organizationId: admin.organizationId } });
  if (!target) throw new Error("Usuario nao encontrado.");
  if (target.id === admin.id) throw new Error("Voce nao pode desativar sua propria conta.");

  await prisma.user.update({ where: { id: userId }, data: { status: active ? "ACTIVE" : "INACTIVE" } });

  await writeAuditLog({
    organizationId: admin.organizationId,
    userId: admin.id,
    action: "STATUS_CHANGE",
    entityType: "User",
    entityId: userId,
    newData: { status: active ? "ACTIVE" : "INACTIVE" },
  });

  revalidatePath("/settings");
}
