import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function KpisPage() {
  await requirePermission([PERMISSIONS.KPIS_VIEW]);
  return <PlaceholderPage title="KPIs" description="Modulo de KPIs em construcao." />;
}
