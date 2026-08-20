import { PERMISSIONS } from "@/lib/permissions";
import { can } from "@/lib/authz";
import type { Prisma } from "@/generated/prisma/client";

export * from "@/lib/crm-constants";

export function leadWhereForUser(user: {
  id: string;
  organizationId: string;
  permissions: string[];
}): Prisma.LeadWhereInput {
  const base: Prisma.LeadWhereInput = { organizationId: user.organizationId, deletedAt: null };
  if (can(user, PERMISSIONS.CRM_VIEW_ALL)) return base;
  return { ...base, ownerId: user.id };
}

export function canManageLead(
  user: { id: string; permissions: string[] },
  lead: { ownerId: string }
) {
  if (can(user, PERMISSIONS.CRM_MANAGE_ALL)) return true;
  return can(user, PERMISSIONS.CRM_MANAGE_OWN) && lead.ownerId === user.id;
}
