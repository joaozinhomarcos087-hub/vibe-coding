import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function TasksPage() {
  await requirePermission([PERMISSIONS.TASKS_VIEW_ALL, PERMISSIONS.TASKS_VIEW_OWN]);
  return <PlaceholderPage title="Tarefas" description="Modulo de tarefas em construcao." />;
}
