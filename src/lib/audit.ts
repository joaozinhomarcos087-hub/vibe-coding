import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/generated/prisma/enums";

export async function writeAuditLog(params: {
  organizationId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldData: params.oldData === undefined ? undefined : (params.oldData as any),
      newData: params.newData === undefined ? undefined : (params.newData as any),
      ip: params.ip ?? null,
    },
  });
}
