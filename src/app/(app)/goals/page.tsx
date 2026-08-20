import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function GoalsPage() {
  await requirePermission([PERMISSIONS.GOALS_VIEW]);
  return <PlaceholderPage title="Metas" description="Modulo de metas em construcao." />;
}
