import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function SettingsPage() {
  await requirePermission([PERMISSIONS.SETTINGS_MANAGE]);
  return <PlaceholderPage title="Configuracoes" description="Painel administrativo em construcao." />;
}
