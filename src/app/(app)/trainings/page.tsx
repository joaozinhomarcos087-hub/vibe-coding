import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function TrainingsPage() {
  await requirePermission([PERMISSIONS.TRAININGS_VIEW]);
  return <PlaceholderPage title="Treinamentos" description="Modulo de treinamentos em construcao." />;
}
