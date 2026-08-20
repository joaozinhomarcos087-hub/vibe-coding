import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function DashboardPage() {
  await requirePermission([
    PERMISSIONS.DASHBOARD_VIEW_EXECUTIVE,
    PERMISSIONS.DASHBOARD_VIEW_DEPARTMENT,
    PERMISSIONS.DASHBOARD_VIEW_OWN,
  ]);
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Dashboard executivo em construcao (proxima etapa do roadmap)."
    />
  );
}
