import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { PermissionCode } from "@/lib/permissions";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function can(user: { permissions: string[] } | null | undefined, code: PermissionCode) {
  return !!user?.permissions?.includes(code);
}

export function canAny(user: { permissions: string[] } | null | undefined, codes: PermissionCode[]) {
  return codes.some((c) => can(user, c));
}

/**
 * Guards a page/server-action: redirects to /dashboard when the user lacks
 * every permission in `anyOf`. Use for whole-module access control; combine
 * with row-level scoping (leadWhereForUser, etc.) for record-level rules.
 */
export async function requirePermission(anyOf: PermissionCode[]) {
  const user = await requireUser();
  if (!canAny(user, anyOf)) redirect("/dashboard");
  return user;
}
