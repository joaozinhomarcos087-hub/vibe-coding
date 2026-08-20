import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ExportCsvButton } from "@/components/export-csv-button";

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default async function ReportsPage() {
  const user = await requirePermission([PERMISSIONS.REPORTS_VIEW]);

  const owners = await prisma.user.findMany({
    where: { organizationId: user.organizationId, ownedLeads: { some: {} } },
    select: {
      id: true,
      name: true,
      ownedLeads: { select: { stage: true, closedValue: true } },
    },
  });

  const commercialRows = owners.map((o) => {
    const total = o.ownedLeads.length;
    const won = o.ownedLeads.filter((l) => l.stage === "FECHADO_GANHO");
    const revenue = won.reduce((sum, l) => sum + Number(l.closedValue ?? 0), 0);
    return { name: o.name, total, won: won.length, revenue };
  });

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: user.organizationId },
    include: { metrics: true },
  });
  const marketingRows = campaigns.map((c) => {
    const spend = c.metrics.reduce((s, m) => s + Number(m.spend), 0);
    const revenue = c.metrics.reduce((s, m) => s + Number(m.revenue ?? 0), 0);
    const leads = c.metrics.reduce((s, m) => s + m.leadsCount, 0);
    return {
      name: c.name,
      channel: c.channel,
      leads,
      spend,
      cpl: leads > 0 ? spend / leads : 0,
      roas: spend > 0 ? revenue / spend : 0,
    };
  });

  const taskGroups = await prisma.task.groupBy({
    by: ["departmentId", "status"],
    where: { organizationId: user.organizationId },
    _count: { _all: true },
  });
  const departments = await prisma.department.findMany({ where: { organizationId: user.organizationId } });
  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? "Sem setor";
  const operationsRows = taskGroups.map((g) => ({
    department: deptName(g.departmentId),
    status: g.status,
    count: g._count._all,
  }));

  const goals = await prisma.goal.findMany({
    where: { organizationId: user.organizationId },
    include: { progress: { orderBy: { recordedAt: "desc" }, take: 1 } },
  });
  const peopleRows = goals.map((g) => ({
    name: g.name,
    scope: g.scope,
    target: Number(g.targetValue),
    achieved: g.progress[0] ? Number(g.progress[0].achievedValue) : 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Relatorios</h1>
        <p className="text-sm text-slate-500">Comercial, marketing, operacoes e pessoas</p>
      </div>

      <ReportSection
        title="Comercial — performance por vendedor"
        headers={["Vendedor", "Leads", "Fechados", "Faturamento"]}
        rows={commercialRows.map((r) => [r.name, r.total, r.won, currency(r.revenue)])}
        csvRows={commercialRows.map((r) => [r.name, r.total, r.won, r.revenue])}
        filename="comercial.csv"
      />

      <ReportSection
        title="Marketing — campanhas"
        headers={["Campanha", "Canal", "Leads", "Investimento", "CPL", "ROAS"]}
        rows={marketingRows.map((r) => [
          r.name,
          r.channel,
          r.leads,
          currency(r.spend),
          currency(r.cpl),
          `${r.roas.toFixed(2)}x`,
        ])}
        csvRows={marketingRows.map((r) => [r.name, r.channel, r.leads, r.spend, r.cpl, r.roas])}
        filename="marketing.csv"
      />

      <ReportSection
        title="Operacoes — tarefas por setor e status"
        headers={["Setor", "Status", "Quantidade"]}
        rows={operationsRows.map((r) => [r.department, r.status, r.count])}
        csvRows={operationsRows.map((r) => [r.department, r.status, r.count])}
        filename="operacoes.csv"
      />

      <ReportSection
        title="Pessoas — metas"
        headers={["Meta", "Escopo", "Alcancado", "Objetivo"]}
        rows={peopleRows.map((r) => [r.name, r.scope, r.achieved, r.target])}
        csvRows={peopleRows.map((r) => [r.name, r.scope, r.achieved, r.target])}
        filename="pessoas.csv"
      />
    </div>
  );
}

function ReportSection({
  title,
  headers,
  rows,
  csvRows,
  filename,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  csvRows: (string | number)[][];
  filename: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <ExportCsvButton filename={filename} headers={headers} rows={csvRows} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                {r.map((c, j) => (
                  <td key={j} className="px-4 py-2.5 text-slate-700">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-6 text-center text-sm text-slate-400">
                  Sem dados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
