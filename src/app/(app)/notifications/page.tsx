import { requireUser } from "@/lib/authz";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function NotificationsPage() {
  await requireUser();
  return <PlaceholderPage title="Notificacoes" description="Central de notificacoes em construcao." />;
}
