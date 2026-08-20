import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { syncOrgLeadAlerts } from "@/lib/alerts";
import { syncOrgTaskEscalation } from "@/lib/task-escalation";
import { NotificationRow } from "./notification-row";
import { MarkAllReadButton } from "./mark-all-read-button";

export default async function NotificationsPage() {
  const user = await requireUser();

  await Promise.all([
    syncOrgLeadAlerts(user.organizationId).catch(() => {}),
    syncOrgTaskEscalation(user.organizationId).catch(() => {}),
  ]);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Notificacoes</h1>
          <p className="text-sm text-slate-500">{unreadCount} nao lida(s)</p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <NotificationRow
            key={n.id}
            id={n.id}
            title={n.title}
            body={n.body}
            link={n.link}
            read={n.read}
            createdAt={n.createdAt.toISOString()}
          />
        ))}
        {notifications.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Nenhuma notificacao.
          </p>
        )}
      </div>
    </div>
  );
}
