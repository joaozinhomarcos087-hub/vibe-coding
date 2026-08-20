import { requirePermission, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { daysAgo } from "@/lib/date";
import { StatCard, SectionTitle } from "@/components/stat-card";
import { BarChartCard } from "@/components/bar-chart-card";
import { PeriodFilter } from "./period-filter";
import {
  getExecutiveDashboardData,
  getDepartmentDashboardData,
  getPersonalDashboardData,
} from "./queries";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await requirePermission([
    PERMISSIONS.DASHBOARD_VIEW_EXECUTIVE,
    PERMISSIONS.DASHBOARD_VIEW_DEPARTMENT,
    PERMISSIONS.DASHBOARD_VIEW_OWN,
  ]);

  const params = await searchParams;
  const days = Number(params.days ?? "30") || 30;
  const since = daysAgo(days);

  if (can(user, PERMISSIONS.DASHBOARD_VIEW_EXECUTIVE)) {
    const data = await getExecutiveDashboardData(user.organizationId, since);
    return (
      <div className="space-y-6">
        <Header title="Visao executiva" subtitle="A empresa inteira, de um so lugar" />

        <div>
          <SectionTitle>Comercial</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Leads totais" value={String(data.comercial.totalLeads)} />
            <StatCard label="Leads novos" value={String(data.comercial.newLeads)} hint={`ultimos ${days} dias`} />
            <StatCard label="Leads qualificados" value={String(data.comercial.qualifiedLeads)} />
            <StatCard label="Taxa de conversao" value={`${data.comercial.conversionRate.toFixed(1)}%`} />
            <StatCard label="Follow-ups pendentes" value={String(data.comercial.pendingFollowUps)} />
            <StatCard label="Propostas enviadas" value={String(data.comercial.proposalsSent)} />
            <StatCard label="Propostas aprovadas" value={String(data.comercial.proposalsApproved)} />
            <StatCard label="Faturamento (fechado/ganho)" value={data.comercial.revenue} tone="good" />
            <StatCard label="Ticket medio" value={data.comercial.avgTicket} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <BarChartCard title="Pipeline por etapa" data={data.charts.pipeline} />
          <BarChartCard title="Leads por origem" data={data.charts.leadsBySource} color="#0369a1" />
        </div>

        <div>
          <SectionTitle>Marketing</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Investimento" value={data.marketing.spend} hint={`ultimos ${days} dias`} />
            <StatCard label="Leads gerados" value={String(data.marketing.campaignLeads)} />
            <StatCard label="CPL" value={data.marketing.cpl} />
            <StatCard label="ROAS" value={data.marketing.roas} />
            <StatCard label="ROI" value={data.marketing.roi} />
          </div>
        </div>

        <div>
          <SectionTitle>Operacoes</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Tarefas abertas" value={String(data.operacoes.openTasks)} />
            <StatCard
              label="Tarefas atrasadas"
              value={String(data.operacoes.lateTasks)}
              tone={data.operacoes.lateTasks > 0 ? "bad" : "good"}
            />
            <StatCard label="Processos em andamento" value={String(data.operacoes.activeProcesses)} />
          </div>
        </div>

        <div>
          <SectionTitle>Pessoas</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Funcionarios ativos" value={String(data.pessoas.activeEmployees)} />
            <StatCard
              label="Treinamentos concluidos"
              value={`${data.pessoas.trainingsDone}/${data.pessoas.trainingsTotal}`}
            />
          </div>
        </div>

        <div>
          <SectionTitle>Clientes</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Clientes ativos" value={String(data.clientes.activeClients)} />
            <StatCard label="Novos clientes" value={String(data.clientes.newClients)} hint={`ultimos ${days} dias`} />
            <StatCard label="Churn" value={data.clientes.churnRate} tone={data.clientes.churnedClients > 0 ? "warning" : "good"} />
          </div>
        </div>
      </div>
    );
  }

  if (can(user, PERMISSIONS.DASHBOARD_VIEW_DEPARTMENT)) {
    const data = await getDepartmentDashboardData(user, since);
    return (
      <div className="space-y-6">
        <Header title={`Setor: ${data.departmentName}`} subtitle="Indicadores do seu setor" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Tarefas abertas" value={String(data.tasks.openTasks)} />
          <StatCard label="Tarefas atrasadas" value={String(data.tasks.lateTasks)} tone={data.tasks.lateTasks > 0 ? "bad" : "good"} />
          <StatCard label="Tarefas concluidas" value={String(data.tasks.doneTasks)} hint={`ultimos ${days} dias`} />
          <StatCard label="Processos ativos" value={String(data.processes)} />
          <StatCard label="Funcionarios ativos" value={String(data.employees)} />
        </div>

        {data.commercial && (
          <div>
            <SectionTitle>Comercial do setor</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Leads" value={String(data.commercial.totalLeads)} />
              <StatCard label="Fechados" value={String(data.commercial.wonCount)} />
              <StatCard label="Faturamento" value={data.commercial.revenue} tone="good" />
              <StatCard label="Follow-ups pendentes" value={String(data.commercial.pendingFollowUps)} />
            </div>
            <div className="mt-3">
              <BarChartCard title="Pipeline do setor" data={data.commercial.pipeline} />
            </div>
          </div>
        )}

        {data.marketing && (
          <div>
            <SectionTitle>Demandas de marketing</SectionTitle>
            <BarChartCard title="Demandas por status" data={data.marketing.demands} color="#7c3aed" />
          </div>
        )}
      </div>
    );
  }

  const data = await getPersonalDashboardData(user, since);
  return (
    <div className="space-y-6">
      <Header title="Meu desempenho" subtitle="O que voce precisa acompanhar hoje" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Meus leads" value={String(data.leadsCount)} />
        <StatCard label="Follow-ups pendentes" value={String(data.pendingFollowUps)} />
        <StatCard label="Tarefas abertas" value={String(data.tasks.openTasks)} />
        <StatCard label="Tarefas atrasadas" value={String(data.tasks.lateTasks)} tone={data.tasks.lateTasks > 0 ? "bad" : "good"} />
        <StatCard label="Tarefas concluidas" value={String(data.tasks.doneTasksInPeriod)} hint={`ultimos ${days} dias`} />
      </div>

      {data.pipeline.length > 0 && <BarChartCard title="Meu pipeline" data={data.pipeline} />}

      {data.goals.length > 0 && (
        <div>
          <SectionTitle>Minhas metas</SectionTitle>
          <div className="space-y-2">
            {data.goals.map((g, i) => {
              const pct = g.target > 0 ? Math.min(100, (g.achieved / g.target) * 100) : 0;
              return (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{g.name}</span>
                    <span className="text-slate-500">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-900"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.trainings.length > 0 && (
        <div>
          <SectionTitle>Meus treinamentos</SectionTitle>
          <div className="space-y-2">
            {data.trainings.map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <span className="text-slate-800">{t.name}</span>
                <span className="text-slate-500">
                  {t.status} · {t.progress}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <PeriodFilter />
    </div>
  );
}
