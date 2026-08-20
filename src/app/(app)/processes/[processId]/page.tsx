import { notFound } from "next/navigation";
import { requirePermission, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PROCESS_STATUS_LABELS, STEP_STATUS_LABELS, RACI_LABELS } from "@/lib/processes";
import { StepStatusSelect } from "./step-status-select";
import { ChecklistItemRow } from "./checklist-item-row";
import { AddStepForm } from "./add-step-form";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

export default async function ProcessDetailPage({ params }: { params: Promise<{ processId: string }> }) {
  const user = await requirePermission([PERMISSIONS.PROCESSES_VIEW]);
  const { processId } = await params;

  const process = await prisma.process.findFirst({
    where: { id: processId, organizationId: user.organizationId },
    include: {
      department: { select: { name: true } },
      owner: { select: { name: true } },
      raci: true,
      steps: {
        orderBy: { order: "asc" },
        include: { owner: { select: { name: true } }, checklistItems: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!process) notFound();

  const users = await prisma.user.findMany({
    where: { organizationId: user.organizationId, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const editable = can(user, PERMISSIONS.PROCESSES_MANAGE);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{process.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{process.description}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {PROCESS_STATUS_LABELS[process.status]}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Setor</p>
            <p className="text-slate-800">{process.department?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Responsavel</p>
            <p className="text-slate-800">{process.owner.name}</p>
          </div>
          <div>
            <p className="text-slate-400">Prazo</p>
            <p className="text-slate-800">{formatDate(process.deadline)}</p>
          </div>
        </div>
      </div>

      {process.raci.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Matriz RACI</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {process.raci.map((r) => (
              <div key={r.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">{r.roleLabel}</p>
                <p className="text-xs text-slate-500">{RACI_LABELS[r.raciRole]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Etapas</h2>
        <div className="space-y-3">
          {process.steps.map((step) => (
            <div key={step.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{step.name}</p>
                  <p className="text-xs text-slate-500">
                    {step.owner.name} {step.deadline && `· prazo ${formatDate(step.deadline)}`}
                  </p>
                </div>
                <StepStatusSelect stepId={step.id} currentStatus={step.status} disabled={!editable} />
              </div>
              {step.checklistItems.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {step.checklistItems.map((item) => (
                    <ChecklistItemRow key={item.id} id={item.id} label={item.label} done={item.done} disabled={!editable} />
                  ))}
                </ul>
              )}
            </div>
          ))}
          {process.steps.length === 0 && <p className="text-sm text-slate-400">Nenhuma etapa cadastrada.</p>}
        </div>

        {editable && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <AddStepForm processId={process.id} users={users} />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {STEP_STATUS_LABELS.PENDING}, {STEP_STATUS_LABELS.IN_PROGRESS}, {STEP_STATUS_LABELS.DONE},{" "}
        {STEP_STATUS_LABELS.LATE}: use o seletor de cada etapa para atualizar o status.
      </p>
    </div>
  );
}
