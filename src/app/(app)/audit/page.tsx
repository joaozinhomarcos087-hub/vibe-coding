import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function AuditPage() {
  await requirePermission([PERMISSIONS.AUDIT_VIEW]);
  return <PlaceholderPage title="Auditoria" description="Logs de auditoria em construcao." />;
}
