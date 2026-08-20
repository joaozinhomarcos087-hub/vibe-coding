import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function ReportsPage() {
  await requirePermission([PERMISSIONS.REPORTS_VIEW]);
  return <PlaceholderPage title="Relatorios" description="Modulo de relatorios em construcao." />;
}
