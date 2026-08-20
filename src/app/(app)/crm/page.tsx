import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { leadWhereForUser, STAGE_ORDER, STAGE_LABELS, TEMPERATURE_LABELS } from "@/lib/crm";
import { computeAlertLevel, getAlertThresholds, syncOrgLeadAlerts } from "@/lib/alerts";
import { KanbanBoard } from "./kanban-board";

export default async function CrmPage() {
  const user = await requirePermission([PERMISSIONS.CRM_VIEW_ALL, PERMISSIONS.CRM_VIEW_OWN]);

  await syncOrgLeadAlerts(user.organizationId).catch(() => {});
  const thresholds = await getAlertThresholds(user.organizationId);

  const leads = await prisma.lead.findMany({
    where: leadWhereForUser(user),
    include: {
      company: { select: { name: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date();
  const cards = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    companyName: lead.company?.name ?? null,
    ownerName: lead.owner.name,
    stage: lead.stage,
    temperature: lead.temperature,
    temperatureLabel: TEMPERATURE_LABELS[lead.temperature],
    potentialValue: lead.potentialValue ? Number(lead.potentialValue) : null,
    alertLevel: computeAlertLevel(lead.lastContactAt ?? lead.enteredAt, thresholds, now),
    nextContactAt: lead.nextContactAt ? lead.nextContactAt.toISOString() : null,
  }));

  const columns = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    cards: cards.filter((c) => c.stage === stage),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">CRM — Pipeline de Vendas</h1>
          <p className="text-sm text-slate-500">{leads.length} lead(s) visiveis para voce</p>
        </div>
        <Link
          href="/crm/new"
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Novo lead
        </Link>
      </div>
      <KanbanBoard columns={columns} />
    </div>
  );
}
