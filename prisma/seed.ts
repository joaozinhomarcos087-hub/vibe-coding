/**
 * Seeds one demo organization with the org structure described in the
 * spec: Diretoria, Comercial, Marketing, Operacoes departments; the eleven
 * system roles with their default permissions; one user per role; and a
 * handful of CRM/task/process/marketing/KPI/goal/training records so every
 * module has real data to render against instead of an empty screen.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS } from "../src/lib/permissions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Demo@1234";

async function main() {
  console.log("Seeding organization...");
  const org = await prisma.organization.upsert({
    where: { slug: "empresa-demo" },
    update: {},
    create: { name: "Empresa Demo", slug: "empresa-demo" },
  });

  console.log("Seeding permissions catalog...");
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { module: p.module, description: p.description },
      create: { code: p.code, module: p.module, description: p.description },
    });
  }

  console.log("Seeding departments...");
  const depts = {
    diretoria: await prisma.department.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "Diretoria" } },
      update: {},
      create: { organizationId: org.id, name: "Diretoria", description: "Estrategia e gestao executiva" },
    }),
    comercial: await prisma.department.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "Comercial" } },
      update: {},
      create: { organizationId: org.id, name: "Comercial", description: "SDRs, closers e gestao comercial" },
    }),
    marketing: await prisma.department.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "Marketing" } },
      update: {},
      create: { organizationId: org.id, name: "Marketing", description: "Social media, design, filmmaker, trafego" },
    }),
    operacoes: await prisma.department.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "Operacoes" } },
      update: {},
      create: { organizationId: org.id, name: "Operacoes", description: "Processos, CRM, auditoria, produtividade" },
    }),
  };

  console.log("Seeding roles...");
  const roleDefs: { key: keyof typeof DEFAULT_ROLE_PERMISSIONS; name: string }[] = [
    { key: "DIRETOR", name: "Diretor" },
    { key: "GESTOR_COMERCIAL", name: "Gestor Comercial" },
    { key: "GESTOR_MARKETING", name: "Gestor de Marketing" },
    { key: "OPERACOES", name: "Analista de Operacoes" },
    { key: "SDR", name: "SDR" },
    { key: "CLOSER", name: "Closer / Vendedor" },
    { key: "MARKETING", name: "Marketing" },
    { key: "DESIGNER", name: "Designer" },
    { key: "FILMMAKER", name: "Filmmaker" },
    { key: "SOCIAL_MEDIA", name: "Social Media" },
    { key: "TRAFEGO", name: "Gestor de Trafego Pago" },
  ];

  const roles: Record<string, Awaited<ReturnType<typeof prisma.role.upsert>>> = {};
  for (const def of roleDefs) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: org.id, key: def.key as any } },
      update: { name: def.name },
      create: { organizationId: org.id, key: def.key as any, name: def.name, isSystem: true },
    });
    roles[def.key] = role;

    const codes = DEFAULT_ROLE_PERMISSIONS[def.key] ?? [];
    const permissionRows = await prisma.permission.findMany({ where: { code: { in: codes } } });
    for (const perm of permissionRows) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  async function upsertUser(email: string, name: string, roleKey: string, departmentId: string | null, jobTitle: string, managerUserId?: string) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        organizationId: org.id,
        email,
        name,
        passwordHash,
        roleId: roles[roleKey].id,
        departmentId,
        status: "ACTIVE",
      },
    });

    const existingEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!existingEmployee) {
      const manager = managerUserId ? await prisma.employee.findUnique({ where: { userId: managerUserId } }) : null;
      await prisma.employee.create({
        data: {
          userId: user.id,
          jobTitle,
          departmentId,
          managerId: manager?.id,
          hireDate: new Date("2025-01-06"),
          status: "ACTIVE",
        },
      });
    }
    return user;
  }

  const diretor = await upsertUser("diretor@empresademo.com", "Ana Diretora", "DIRETOR", depts.diretoria.id, "Diretora Executiva");
  const gestorComercial = await upsertUser("gestor.comercial@empresademo.com", "Bruno Gestor", "GESTOR_COMERCIAL", depts.comercial.id, "Gestor Comercial", diretor.id);
  const gestorMarketing = await upsertUser("gestor.marketing@empresademo.com", "Carla Gestora", "GESTOR_MARKETING", depts.marketing.id, "Gestora de Marketing", diretor.id);
  const operacoes = await upsertUser("operacoes@empresademo.com", "Diego Operacoes", "OPERACOES", depts.operacoes.id, "Analista de Operacoes", diretor.id);
  const sdr = await upsertUser("sdr@empresademo.com", "Elisa SDR", "SDR", depts.comercial.id, "SDR", gestorComercial.id);
  const closer = await upsertUser("closer@empresademo.com", "Fabio Closer", "CLOSER", depts.comercial.id, "Closer / Vendedor", gestorComercial.id);
  const marketing = await upsertUser("marketing@empresademo.com", "Gisele Marketing", "MARKETING", depts.marketing.id, "Analista de Marketing", gestorMarketing.id);
  const designer = await upsertUser("designer@empresademo.com", "Hugo Designer", "DESIGNER", depts.marketing.id, "Designer", gestorMarketing.id);
  const filmmaker = await upsertUser("filmmaker@empresademo.com", "Iara Filmmaker", "FILMMAKER", depts.marketing.id, "Filmmaker", gestorMarketing.id);
  const socialMedia = await upsertUser("social@empresademo.com", "Joao Social", "SOCIAL_MEDIA", depts.marketing.id, "Social Media", gestorMarketing.id);
  const trafego = await upsertUser("trafego@empresademo.com", "Karina Trafego", "TRAFEGO", depts.marketing.id, "Gestora de Trafego Pago", gestorMarketing.id);

  console.log("Seeding companies & contacts...");
  const companyA = await prisma.company.upsert({
    where: { id: "seed-company-a" },
    update: {},
    create: { id: "seed-company-a", organizationId: org.id, name: "Alfa Industria Ltda", industry: "Industria", phone: "11999990001" },
  });
  const companyB = await prisma.company.upsert({
    where: { id: "seed-company-b" },
    update: {},
    create: { id: "seed-company-b", organizationId: org.id, name: "Beta Comercio SA", industry: "Varejo", phone: "11999990002", isClient: true },
  });

  const contactA = await prisma.contact.upsert({
    where: { id: "seed-contact-a" },
    update: {},
    create: { id: "seed-contact-a", name: "Marcos Alfa", email: "marcos@alfa.com", phone: "11988880001", companyId: companyA.id, position: "Comprador" },
  });

  console.log("Seeding campaign...");
  const campaign = await prisma.campaign.upsert({
    where: { id: "seed-campaign-1" },
    update: {},
    create: {
      id: "seed-campaign-1",
      organizationId: org.id,
      name: "Meta Ads - Lancamento Q1",
      channel: "META_ADS",
      budget: 8000,
      startDate: new Date("2026-07-01"),
      status: "ACTIVE",
      ownerId: trafego.id,
    },
  });
  await prisma.campaignMetric.upsert({
    where: { id: "seed-campaign-metric-1" },
    update: {},
    create: {
      id: "seed-campaign-metric-1",
      campaignId: campaign.id,
      periodStart: new Date("2026-08-01"),
      periodEnd: new Date("2026-08-19"),
      impressions: 152000,
      clicks: 4100,
      leadsCount: 63,
      spend: 3200,
      revenue: 18500,
    },
  });

  console.log("Seeding leads / follow-ups / activities...");
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);

  const leadNovo = await prisma.lead.upsert({
    where: { id: "seed-lead-1" },
    update: {},
    create: {
      id: "seed-lead-1",
      organizationId: org.id,
      name: "Lead Alfa Industria",
      companyId: companyA.id,
      contactId: contactA.id,
      phone: "11988880001",
      email: "marcos@alfa.com",
      source: "Meta Ads",
      campaignId: campaign.id,
      ownerId: sdr.id,
      stage: "QUALIFICACAO",
      temperature: "QUENTE",
      potentialValue: 15000,
      lastContactAt: hoursAgo(80),
      nextContactAt: hoursAgo(-4),
      alertLevel: "RED",
      notes: "Interessado no plano anual",
    },
  });

  const leadNegociacao = await prisma.lead.upsert({
    where: { id: "seed-lead-2" },
    update: {},
    create: {
      id: "seed-lead-2",
      organizationId: org.id,
      name: "Lead Beta Comercio - Expansao",
      companyId: companyB.id,
      phone: "11988880002",
      email: "compras@beta.com",
      source: "Indicacao",
      ownerId: closer.id,
      stage: "NEGOCIACAO",
      temperature: "QUENTE",
      potentialValue: 42000,
      lastContactAt: hoursAgo(20),
      nextContactAt: hoursAgo(-24),
      alertLevel: "NONE",
      notes: "Aguardando aprovacao interna do cliente",
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-3" },
    update: {},
    create: {
      id: "seed-lead-3",
      organizationId: org.id,
      name: "Lead Gama Servicos",
      phone: "11988880003",
      email: "contato@gama.com",
      source: "Google Ads",
      ownerId: sdr.id,
      stage: "NOVO_LEAD",
      temperature: "MORNO",
      potentialValue: 9000,
      lastContactAt: hoursAgo(50),
      nextContactAt: hoursAgo(2),
      alertLevel: "YELLOW",
    },
  });

  await prisma.followUp.upsert({
    where: { id: "seed-followup-1" },
    update: {},
    create: {
      id: "seed-followup-1",
      leadId: leadNovo.id,
      ownerId: sdr.id,
      scheduledAt: hoursAgo(-4),
      type: "WHATSAPP",
      status: "PENDENTE",
      notes: "Enviar catalogo atualizado",
    },
  });

  await prisma.deal.upsert({
    where: { id: "seed-deal-1" },
    update: {},
    create: {
      id: "seed-deal-1",
      leadId: leadNegociacao.id,
      ownerId: closer.id,
      value: 42000,
      stage: "OPEN",
    },
  });

  await prisma.proposal.upsert({
    where: { id: "seed-proposal-1" },
    update: {},
    create: {
      id: "seed-proposal-1",
      leadId: leadNegociacao.id,
      title: "Proposta - Plano Expansao Beta",
      value: 42000,
      status: "SENT",
      sentAt: hoursAgo(48),
      validUntil: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
    },
  });

  console.log("Seeding tasks...");
  await prisma.task.upsert({
    where: { id: "seed-task-1" },
    update: {},
    create: {
      id: "seed-task-1",
      organizationId: org.id,
      title: "Ligar para Lead Alfa Industria",
      description: "Confirmar reuniao de qualificacao",
      assigneeId: sdr.id,
      creatorId: gestorComercial.id,
      departmentId: depts.comercial.id,
      priority: "HIGH",
      dueDate: hoursAgo(-6),
      status: "TODO",
      leadId: leadNovo.id,
    },
  });
  await prisma.task.upsert({
    where: { id: "seed-task-2" },
    update: {},
    create: {
      id: "seed-task-2",
      organizationId: org.id,
      title: "Auditar follow-ups da semana",
      assigneeId: operacoes.id,
      creatorId: operacoes.id,
      departmentId: depts.operacoes.id,
      priority: "MEDIUM",
      dueDate: hoursAgo(-72),
      status: "IN_PROGRESS",
      recurrence: "WEEKLY",
    },
  });

  console.log("Seeding process...");
  const process1 = await prisma.process.upsert({
    where: { id: "seed-process-1" },
    update: {},
    create: {
      id: "seed-process-1",
      organizationId: org.id,
      name: "Novo Lead",
      description: "Fluxo padrao de recebimento e qualificacao de um novo lead",
      departmentId: depts.comercial.id,
      ownerId: gestorComercial.id,
      status: "ACTIVE",
    },
  });
  const step1 = await prisma.processStep.upsert({
    where: { id: "seed-step-1" },
    update: {},
    create: { id: "seed-step-1", processId: process1.id, name: "Registrar lead no CRM", order: 1, ownerId: sdr.id, status: "DONE" },
  });
  await prisma.checklistItem.upsert({
    where: { id: "seed-check-1" },
    update: {},
    create: { id: "seed-check-1", processStepId: step1.id, label: "Dados de contato completos", done: true, order: 1 },
  });
  await prisma.processStep.upsert({
    where: { id: "seed-step-2" },
    update: {},
    create: { id: "seed-step-2", processId: process1.id, name: "Qualificar lead", order: 2, ownerId: sdr.id, status: "IN_PROGRESS" },
  });
  await prisma.raciEntry.upsert({
    where: { id: "seed-raci-1" },
    update: {},
    create: { id: "seed-raci-1", processId: process1.id, roleLabel: "SDR", raciRole: "RESPONSIBLE" },
  });
  await prisma.raciEntry.upsert({
    where: { id: "seed-raci-2" },
    update: {},
    create: { id: "seed-raci-2", processId: process1.id, roleLabel: "Gestor Comercial", raciRole: "ACCOUNTABLE" },
  });
  await prisma.raciEntry.upsert({
    where: { id: "seed-raci-3" },
    update: {},
    create: { id: "seed-raci-3", processId: process1.id, roleLabel: "Operacoes", raciRole: "CONSULTED" },
  });
  await prisma.raciEntry.upsert({
    where: { id: "seed-raci-4" },
    update: {},
    create: { id: "seed-raci-4", processId: process1.id, roleLabel: "Diretor", raciRole: "INFORMED" },
  });

  console.log("Seeding marketing demand...");
  await prisma.marketingTask.upsert({
    where: { id: "seed-mkt-task-1" },
    update: {},
    create: {
      id: "seed-mkt-task-1",
      title: "Reels lancamento Q1",
      description: "Video de 30s para Instagram Reels",
      clientCompanyId: companyB.id,
      type: "REELS",
      assigneeId: filmmaker.id,
      requesterId: gestorMarketing.id,
      priority: "HIGH",
      dueDate: hoursAgo(-48),
      status: "EM_PRODUCAO",
    },
  });
  await prisma.marketingTask.upsert({
    where: { id: "seed-mkt-task-2" },
    update: {},
    create: {
      id: "seed-mkt-task-2",
      title: "Arte para carrossel institucional",
      type: "ARTE",
      assigneeId: designer.id,
      requesterId: socialMedia.id,
      priority: "MEDIUM",
      dueDate: hoursAgo(-96),
      status: "BRIEFING",
    },
  });

  console.log("Seeding KPIs & goals...");
  const kpiConversao = await prisma.kpi.upsert({
    where: { id: "seed-kpi-1" },
    update: {},
    create: {
      id: "seed-kpi-1",
      organizationId: org.id,
      name: "Taxa de conversao de leads",
      description: "Percentual de leads que fecham negocio",
      formula: "(fechados / leads_total) * 100",
      departmentId: depts.comercial.id,
      ownerId: gestorComercial.id,
      targetValue: 20,
      unit: "%",
      period: "MONTHLY",
    },
  });
  await prisma.kpiResult.upsert({
    where: { id: "seed-kpi-result-1" },
    update: {},
    create: {
      id: "seed-kpi-result-1",
      kpiId: kpiConversao.id,
      periodStart: new Date("2026-08-01"),
      periodEnd: new Date("2026-08-19"),
      resultValue: 17.5,
      status: "WARNING",
    },
  });

  await prisma.goal.upsert({
    where: { id: "seed-goal-1" },
    update: {},
    create: {
      id: "seed-goal-1",
      organizationId: org.id,
      name: "Faturamento Comercial Agosto",
      scope: "DEPARTMENT",
      departmentId: depts.comercial.id,
      targetValue: 150000,
      period: "MONTHLY",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-08-31"),
    },
  });

  console.log("Seeding training...");
  const training1 = await prisma.training.upsert({
    where: { id: "seed-training-1" },
    update: {},
    create: {
      id: "seed-training-1",
      organizationId: org.id,
      name: "Onboarding CRM",
      description: "Como usar o CRM corretamente",
      roleId: roles.SDR.id,
      deadline: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
    },
  });
  await prisma.trainingProgress.upsert({
    where: { trainingId_userId: { trainingId: training1.id, userId: sdr.id } },
    update: {},
    create: { trainingId: training1.id, userId: sdr.id, status: "IN_PROGRESS", progressPercent: 40 },
  });

  console.log("Seeding automation rules & settings...");
  await prisma.systemSetting.upsert({
    where: { organizationId_key: { organizationId: org.id, key: "lead_alert_thresholds_hours" } },
    update: {},
    create: {
      organizationId: org.id,
      key: "lead_alert_thresholds_hours",
      value: { yellow: 48, red: 72 },
      description: "Horas sem follow-up para gerar alerta amarelo/vermelho em um lead",
    },
  });

  await prisma.automationRule.upsert({
    where: { id: "seed-rule-1" },
    update: {},
    create: {
      id: "seed-rule-1",
      organizationId: org.id,
      name: "Lead sem contato 48h -> notificar SDR",
      trigger: { entity: "lead", event: "no_contact_hours", threshold: 48 },
      action: { type: "notify", target: "owner" },
    },
  });
  await prisma.automationRule.upsert({
    where: { id: "seed-rule-2" },
    update: {},
    create: {
      id: "seed-rule-2",
      organizationId: org.id,
      name: "Lead sem contato 72h -> notificar gestor",
      trigger: { entity: "lead", event: "no_contact_hours", threshold: 72 },
      action: { type: "notify", target: "manager" },
    },
  });

  console.log("Seeding notifications...");
  await prisma.notification.create({
    data: {
      userId: sdr.id,
      type: "LEAD_NO_CONTACT",
      title: "Lead sem contato ha 80h",
      body: `${leadNovo.name} esta ha mais de 72h sem follow-up.`,
      link: `/crm/${leadNovo.id}`,
    },
  });
  await prisma.notification.create({
    data: {
      userId: operacoes.id,
      type: "TASK_LATE",
      title: "Tarefa atrasada",
      body: "Auditar follow-ups da semana esta atrasada.",
      link: "/tasks",
    },
  });

  console.log("Done.");
  console.log("\nDemo logins (password for all: Demo@1234):");
  for (const email of [
    diretor.email,
    gestorComercial.email,
    gestorMarketing.email,
    operacoes.email,
    sdr.email,
    closer.email,
    marketing.email,
    designer.email,
    filmmaker.email,
    socialMedia.email,
    trafego.email,
  ]) {
    console.log(` - ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
