import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export async function writeAuditLog(params: {
  organizationId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldData: params.oldData,
      newData: params.newData,
      ip: params.ip ?? null,
    },
  });
}
