import { prisma } from "@/lib/prisma";
import { STAGE_LABELS } from "@/lib/crm-constants";

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export async function getPipelineByStage(where: { organizationId: string; ownerId?: string }) {
  const groups = await prisma.lead.groupBy({
    by: ["stage"],
    where: { ...where, deletedAt: null },
    _count: { _all: true },
  });
  return groups.map((g) => ({ label: STAGE_LABELS[g.stage], value: g._count._all }));
}

export async function getLeadsBySource(where: { organizationId: string; ownerId?: string }) {
  const groups = await prisma.lead.groupBy({
    by: ["source"],
    where: { ...where, deletedAt: null },
    _count: { _all: true },
  });
  return groups
    .map((g) => ({ label: g.source ?? "Sem origem", value: g._count._all }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export async function getExecutiveDashboardData(organizationId: string, since: Date) {
  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    pendingFollowUps,
    proposalsSent,
    proposalsApproved,
    wonAgg,
    wonInPeriod,
    campaignMetrics,
    openTasks,
    lateTasks,
    activeProcesses,
    activeEmployees,
    activeClients,
    newClients,
    churnedClients,
    trainingProgress,
  ] = await Promise.all([
    prisma.lead.count({ where: { organizationId, deletedAt: null } }),
    prisma.lead.count({ where: { organizationId, deletedAt: null, enteredAt: { gte: since } } }),
    prisma.lead.count({
      where: { organizationId, deletedAt: null, stage: { notIn: ["NOVO_LEAD", "PRIMEIRO_CONTATO"] } },
    }),
    prisma.followUp.count({ where: { status: "PENDENTE", lead: { organizationId } } }),
    prisma.proposal.count({ where: { lead: { organizationId }, status: { not: "DRAFT" } } }),
    prisma.proposal.count({ where: { lead: { organizationId }, status: "APPROVED" } }),
    prisma.lead.aggregate({
      where: { organizationId, stage: "FECHADO_GANHO" },
      _sum: { closedValue: true },
      _count: { _all: true },
    }),
    prisma.lead.count({ where: { organizationId, stage: "FECHADO_GANHO", closedAt: { gte: since } } }),
    prisma.campaignMetric.aggregate({
      where: { campaign: { organizationId }, periodStart: { gte: since } },
      _sum: { spend: true, revenue: true, leadsCount: true },
    }),
    prisma.task.count({ where: { organizationId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
    prisma.task.count({ where: { organizationId, status: "LATE" } }),
    prisma.process.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.employee.count({ where: { user: { organizationId }, status: "ACTIVE" } }),
    prisma.company.count({ where: { organizationId, isClient: true, churnedAt: null } }),
    prisma.company.count({ where: { organizationId, isClient: true, createdAt: { gte: since } } }),
    prisma.company.count({ where: { organizationId, churnedAt: { not: null } } }),
    prisma.trainingProgress.findMany({ where: { user: { organizationId } }, select: { status: true } }),
  ]);

  const revenue = Number(wonAgg._sum.closedValue ?? 0);
  const wonCount = wonAgg._count._all;
  const avgTicket = wonCount > 0 ? revenue / wonCount : 0;
  const conversionRate = newLeads > 0 ? (wonInPeriod / newLeads) * 100 : 0;

  const spend = Number(campaignMetrics._sum.spend ?? 0);
  const campaignRevenue = Number(campaignMetrics._sum.revenue ?? 0);
  const campaignLeads = campaignMetrics._sum.leadsCount ?? 0;
  const cpl = campaignLeads > 0 ? spend / campaignLeads : 0;
  const roas = spend > 0 ? campaignRevenue / spend : 0;
  const roi = spend > 0 ? ((campaignRevenue - spend) / spend) * 100 : 0;

  const totalClients = activeClients + churnedClients;
  const churnRate = totalClients > 0 ? (churnedClients / totalClients) * 100 : 0;

  const trainingsDone = trainingProgress.filter((t) => t.status === "DONE").length;
  const trainingsTotal = trainingProgress.length;

  const [pipeline, leadsBySource] = await Promise.all([
    getPipelineByStage({ organizationId }),
    getLeadsBySource({ organizationId }),
  ]);

  return {
    comercial: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      conversionRate,
      proposalsSent,
      proposalsApproved,
      pendingFollowUps,
      revenue: currency(revenue),
      avgTicket: currency(avgTicket),
    },
    marketing: {
      spend: currency(spend),
      campaignLeads,
      cpl: currency(cpl),
      roas: `${roas.toFixed(2)}x`,
      roi: `${roi.toFixed(0)}%`,
    },
    operacoes: { openTasks, lateTasks, activeProcesses },
    pessoas: {
      activeEmployees,
      trainingsDone,
      trainingsTotal,
    },
    clientes: { activeClients, newClients, churnedClients, churnRate: `${churnRate.toFixed(1)}%` },
    charts: { pipeline, leadsBySource },
  };
}

export async function getDepartmentDashboardData(
  user: { organizationId: string; departmentId: string | null; id: string },
  since: Date
) {
  const departmentId = user.departmentId;

  const [department, tasks, processes, employees] = await Promise.all([
    departmentId ? prisma.department.findUnique({ where: { id: departmentId } }) : null,
    Promise.all([
      prisma.task.count({ where: { organizationId: user.organizationId, departmentId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
      prisma.task.count({ where: { organizationId: user.organizationId, departmentId, status: "LATE" } }),
      prisma.task.count({ where: { organizationId: user.organizationId, departmentId, status: "DONE", updatedAt: { gte: since } } }),
    ]),
    prisma.process.count({ where: { organizationId: user.organizationId, departmentId, status: "ACTIVE" } }),
    prisma.employee.count({ where: { departmentId, status: "ACTIVE" } }),
  ]);

  const [openTasks, lateTasks, doneTasks] = tasks;

  const isCommercial = department?.name === "Comercial";
  const isMarketing = department?.name === "Marketing";

  let commercial = null;
  if (isCommercial) {
    const owners = await prisma.user.findMany({ where: { departmentId }, select: { id: true } });
    const ownerIds = owners.map((o) => o.id);
    const [totalLeads, wonAgg, pendingFollowUps, pipelineGroups] = await Promise.all([
      prisma.lead.count({ where: { organizationId: user.organizationId, ownerId: { in: ownerIds }, deletedAt: null } }),
      prisma.lead.aggregate({
        where: { organizationId: user.organizationId, ownerId: { in: ownerIds }, stage: "FECHADO_GANHO" },
        _sum: { closedValue: true },
        _count: { _all: true },
      }),
      prisma.followUp.count({ where: { status: "PENDENTE", ownerId: { in: ownerIds } } }),
      prisma.lead.groupBy({
        by: ["stage"],
        where: { organizationId: user.organizationId, ownerId: { in: ownerIds }, deletedAt: null },
        _count: { _all: true },
      }),
    ]);
    commercial = {
      totalLeads,
      revenue: currency(Number(wonAgg._sum.closedValue ?? 0)),
      wonCount: wonAgg._count._all,
      pendingFollowUps,
      pipeline: pipelineGroups.map((g) => ({ label: STAGE_LABELS[g.stage], value: g._count._all })),
    };
  }

  let marketing = null;
  if (isMarketing) {
    const demandsByStatus = await prisma.marketingTask.groupBy({
      by: ["status"],
      where: { assignee: { departmentId } },
      _count: { _all: true },
    });
    marketing = {
      demands: demandsByStatus.map((d) => ({ label: d.status, value: d._count._all })),
    };
  }

  return {
    departmentName: department?.name ?? "Sem setor",
    tasks: { openTasks, lateTasks, doneTasks },
    processes,
    employees,
    commercial,
    marketing,
  };
}

export async function getPersonalDashboardData(user: { id: string; organizationId: string }, since: Date) {
  const [leadsCount, pendingFollowUps, pipeline, openTasks, lateTasks, doneTasksInPeriod, employee] =
    await Promise.all([
      prisma.lead.count({ where: { organizationId: user.organizationId, ownerId: user.id, deletedAt: null } }),
      prisma.followUp.count({ where: { ownerId: user.id, status: "PENDENTE" } }),
      getPipelineByStage({ organizationId: user.organizationId, ownerId: user.id }),
      prisma.task.count({ where: { organizationId: user.organizationId, assigneeId: user.id, status: { in: ["TODO", "IN_PROGRESS"] } } }),
      prisma.task.count({ where: { organizationId: user.organizationId, assigneeId: user.id, status: "LATE" } }),
      prisma.task.count({
        where: { organizationId: user.organizationId, assigneeId: user.id, status: "DONE", updatedAt: { gte: since } },
      }),
      prisma.employee.findUnique({ where: { userId: user.id } }),
    ]);

  const [goals, trainings] = await Promise.all([
    employee
      ? prisma.goal.findMany({
          where: { organizationId: user.organizationId, employeeId: employee.id, endDate: { gte: since } },
          include: { progress: { orderBy: { recordedAt: "desc" }, take: 1 } },
        })
      : [],
    prisma.trainingProgress.findMany({ where: { userId: user.id }, include: { training: { select: { name: true } } } }),
  ]);

  return {
    leadsCount,
    pendingFollowUps,
    pipeline,
    tasks: { openTasks, lateTasks, doneTasksInPeriod },
    goals: goals.map((g) => ({
      name: g.name,
      target: Number(g.targetValue),
      achieved: g.progress[0] ? Number(g.progress[0].achievedValue) : 0,
    })),
    trainings: trainings.map((t) => ({ name: t.training.name, status: t.status, progress: t.progressPercent })),
  };
}
