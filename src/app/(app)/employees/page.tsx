import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function EmployeesPage() {
  await requirePermission([PERMISSIONS.EMPLOYEES_VIEW]);
  return <PlaceholderPage title="Funcionarios" description="Modulo de funcionarios em construcao." />;
}
