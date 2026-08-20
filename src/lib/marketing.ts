import { PERMISSIONS } from "@/lib/permissions";
import { can } from "@/lib/authz";
import type { Prisma } from "@/generated/prisma/client";

export * from "@/lib/marketing-constants";

export function marketingTaskWhereForUser(user: {
  id: string;
  organizationId: string;
  permissions: string[];
}): Prisma.MarketingTaskWhereInput {
  const base: Prisma.MarketingTaskWhereInput = { assignee: { organizationId: user.organizationId } };
  if (can(user, PERMISSIONS.MARKETING_VIEW_ALL)) return base;
  return { ...base, OR: [{ assigneeId: user.id }, { requesterId: user.id }] };
}

export function canManageMarketingTask(
  user: { id: string; permissions: string[] },
  task: { assigneeId: string; requesterId: string }
) {
  if (can(user, PERMISSIONS.MARKETING_MANAGE_ALL)) return true;
  return can(user, PERMISSIONS.MARKETING_MANAGE_OWN) && (task.assigneeId === user.id || task.requesterId === user.id);
}
