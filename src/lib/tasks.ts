import { PERMISSIONS } from "@/lib/permissions";
import { can } from "@/lib/authz";
import type { Prisma } from "@/generated/prisma/client";

export * from "@/lib/tasks-constants";

export function taskWhereForUser(user: {
  id: string;
  organizationId: string;
  permissions: string[];
}): Prisma.TaskWhereInput {
  const base: Prisma.TaskWhereInput = { organizationId: user.organizationId };
  if (can(user, PERMISSIONS.TASKS_VIEW_ALL)) return base;
  return { ...base, OR: [{ assigneeId: user.id }, { creatorId: user.id }] };
}

export function canManageTask(
  user: { id: string; permissions: string[] },
  task: { assigneeId: string; creatorId: string }
) {
  if (can(user, PERMISSIONS.TASKS_MANAGE_ALL)) return true;
  return can(user, PERMISSIONS.TASKS_MANAGE_OWN) && (task.assigneeId === user.id || task.creatorId === user.id);
}
