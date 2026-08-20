import { notFound } from "next/navigation";
import { requireUser, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canManageLead, STAGE_LABELS, TEMPERATURE_LABELS } from "@/lib/crm";
import { computeAlertLevel, getAlertThresholds } from "@/lib/alerts";
import { StageSelect } from "./stage-select";
import { LeadEditForm } from "./lead-edit-form";
import { FollowUpPanel } from "./follow-up-panel";
import { NoteForm } from "./note-form";

function currency(v: number | null) {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const ALERT_LABEL: Record<string, string> = {
  NONE: "Em dia",
  YELLOW: "Alerta: sem follow-up ha muito tempo",
  RED: "Critico: sem follow-up",
};
const ALERT_CLASS: Record<string, string> = {
  NONE: "bg-emerald-100 text-emerald-700",
  YELLOW: "bg-amber-100 text-amber-700",
  RED: "bg-red-100 text-red-700",
};

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId: id } = await params;
  const user = await requireUser();
  if (!can(user, PERMISSIONS.CRM_VIEW_ALL) && !can(user, PERMISSIONS.CRM_VIEW_OWN)) notFound();

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: user.organizationId, deletedAt: null },
    include: {
      company: true,
      contact: true,
      owner: { select: { id: true, name: true } },
      followUps: { orderBy: { scheduledAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 30, include: { author: { select: { name: true } } } },
      deals: true,
      proposals: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();
  if (!can(user, PERMISSIONS.CRM_VIEW_ALL) && lead.ownerId !== user.id) notFound();

  const owners = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      status: "ACTIVE",
      role: { key: { in: ["SDR", "CLOSER", "GESTOR_COMERCIAL", "DIRETOR"] } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const thresholds = await getAlertThresholds(user.organizationId);
  const alertLevel = computeAlertLevel(lead.lastContactAt ?? lead.enteredAt, thresholds);
  const editable = canManageLead(user, lead);
  const pendingFollowUps = lead.followUps.filter((f) => f.status === "PENDENTE");
  const pastFollowUps = lead.followUps.filter((f) => f.status !== "PENDENTE");

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{lead.name}</h1>
              <p className="text-sm text-slate-500">{lead.company?.name ?? "Sem empresa vinculada"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${ALERT_CLASS[alertLevel]}`}>
              {ALERT_LABEL[alertLevel]}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-slate-400">Telefone</p>
              <p className="text-slate-800">{lead.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">E-mail</p>
              <p className="text-slate-800">{lead.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">Origem</p>
              <p className="text-slate-800">{lead.source ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">Valor potencial</p>
              <p className="text-slate-800">{currency(lead.potentialValue ? Number(lead.potentialValue) : null)}</p>
            </div>
            <div>
              <p className="text-slate-400">Ultimo contato</p>
              <p className="text-slate-800">{formatDate(lead.lastContactAt)}</p>
            </div>
            <div>
              <p className="text-slate-400">Proxima acao</p>
              <p className="text-slate-800">{formatDate(lead.nextContactAt)}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Etapa do pipeline</p>
            <StageSelect leadId={lead.id} currentStage={lead.stage} disabled={!editable} />
          </div>
        </div>

        <FollowUpPanel leadId={lead.id} pending={pendingFollowUps} past={pastFollowUps} editable={editable} />

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Historico / atividades</h2>
          {editable && <NoteForm leadId={lead.id} />}
          <ul className="mt-4 space-y-3">
            {lead.activities.length === 0 && <p className="text-sm text-slate-400">Nenhuma atividade registrada.</p>}
            {lead.activities.map((a) => (
              <li key={a.id} className="border-b border-slate-100 pb-3 text-sm last:border-0">
                <p className="text-slate-700">{a.description}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {a.author.name} · {formatDate(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Responsavel & classificacao</h2>
          <p className="text-sm text-slate-600">
            Responsavel atual: <span className="font-medium text-slate-900">{lead.owner.name}</span>
          </p>
          <p className="text-sm text-slate-600">
            Temperatura: <span className="font-medium text-slate-900">{TEMPERATURE_LABELS[lead.temperature]}</span>
          </p>
          <p className="text-sm text-slate-600">
            Etapa: <span className="font-medium text-slate-900">{STAGE_LABELS[lead.stage]}</span>
          </p>
          {editable && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <LeadEditForm
                leadId={lead.id}
                temperature={lead.temperature}
                potentialValue={lead.potentialValue ? Number(lead.potentialValue) : null}
                notes={lead.notes}
                ownerId={lead.ownerId}
                owners={owners}
                canReassign={can(user, PERMISSIONS.CRM_MANAGE_ALL)}
              />
            </div>
          )}
        </div>

        {lead.proposals.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Propostas</h2>
            <ul className="space-y-2">
              {lead.proposals.map((p) => (
                <li key={p.id} className="text-sm">
                  <p className="font-medium text-slate-800">{p.title}</p>
                  <p className="text-slate-500">
                    {currency(Number(p.value))} · {p.status}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lead.deals.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Negocio</h2>
            {lead.deals.map((d) => (
              <p key={d.id} className="text-sm text-slate-600">
                {currency(Number(d.value))} · {d.stage}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
