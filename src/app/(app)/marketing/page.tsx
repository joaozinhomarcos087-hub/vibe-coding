import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function MarketingPage() {
  await requirePermission([PERMISSIONS.MARKETING_VIEW_ALL, PERMISSIONS.MARKETING_VIEW_OWN]);
  return <PlaceholderPage title="Marketing" description="Modulo de demandas de marketing em construcao." />;
}
