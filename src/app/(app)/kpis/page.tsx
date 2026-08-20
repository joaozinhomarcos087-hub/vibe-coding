import { requirePermission, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { KPI_STATUS_LABELS, KPI_STATUS_ICON, KPI_STATUS_CLASS, PERIOD_LABELS } from "@/lib/kpis";
import { NewKpiForm } from "./new-kpi-form";
import { RecordResultForm } from "./record-result-form";

export default async function KpisPage() {
  const user = await requirePermission([PERMISSIONS.KPIS_VIEW]);
  const manage = can(user, PERMISSIONS.KPIS_MANAGE);

  const [kpis, departments] = await Promise.all([
    prisma.kpi.findMany({
      where: { organizationId: user.organizationId },
      include: {
        department: { select: { name: true } },
        results: { orderBy: { periodEnd: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">KPIs</h1>
          <p className="text-sm text-slate-500">{kpis.length} indicador(es) configurado(s)</p>
        </div>
      </div>

      {manage && (
        <details className="rounded-2xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">+ Novo KPI</summary>
          <div className="mt-4">
            <NewKpiForm departments={departments} />
          </div>
        </details>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const latest = kpi.results[0];
          return (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <p className="font-medium text-slate-900">{kpi.name}</p>
                {latest && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${KPI_STATUS_CLASS[latest.status]}`}>
                    {KPI_STATUS_ICON[latest.status]} {KPI_STATUS_LABELS[latest.status]}
                  </span>
                )}
              </div>
              {kpi.description && <p className="mt-1 text-xs text-slate-500">{kpi.description}</p>}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">
                  {latest ? Number(latest.resultValue).toLocaleString("pt-BR") : "—"}
                </span>
                <span className="text-sm text-slate-400">
                  / meta {Number(kpi.targetValue).toLocaleString("pt-BR")} {kpi.unit}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {kpi.department?.name ?? "Geral"} · {PERIOD_LABELS[kpi.period]}
              </p>
              {manage && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-slate-500">Registrar resultado</summary>
                  <div className="mt-2">
                    <RecordResultForm kpiId={kpi.id} />
                  </div>
                </details>
              )}
            </div>
          );
        })}
        {kpis.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Nenhum KPI cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
