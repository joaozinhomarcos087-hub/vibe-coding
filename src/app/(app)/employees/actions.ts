"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

const updateSchema = z.object({
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]),
});

export async function updateEmployee(employeeId: string, formData: FormData) {
  const user = await requirePermission([PERMISSIONS.EMPLOYEES_MANAGE]);
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, user: { organizationId: user.organizationId } },
  });
  if (!employee) throw new Error("Funcionario nao encontrado.");

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos.");
  const data = parsed.data;

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      departmentId: data.departmentId || null,
      managerId: data.managerId || null,
      status: data.status,
    },
  });

  await prisma.user.update({
    where: { id: employee.userId },
    data: { departmentId: data.departmentId || null },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "UPDATE",
    entityType: "Employee",
    entityId: employeeId,
    oldData: { status: employee.status, departmentId: employee.departmentId },
    newData: data,
  });

  revalidatePath("/employees");
}
