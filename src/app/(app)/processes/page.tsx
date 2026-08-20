import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function ProcessesPage() {
  await requirePermission([PERMISSIONS.PROCESSES_VIEW]);
  return <PlaceholderPage title="Processos" description="Modulo de processos e RACI em construcao." />;
}
