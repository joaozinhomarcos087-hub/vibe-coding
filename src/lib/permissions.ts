// Central permission catalog (section 8/34).
// Every permission is a "module.action.scope" code. Scope is either
// "own" (records the user owns/is assigned to) or "all" (whole org / whole
// department depending on module). The catalog is seeded into the
// `permissions` table and attached to roles via `role_permissions`, so an
// administrator can reconfigure access per role without a code change.

export const PERMISSIONS = {
  DASHBOARD_VIEW_EXECUTIVE: "dashboard.view.executive",
  DASHBOARD_VIEW_DEPARTMENT: "dashboard.view.department",
  DASHBOARD_VIEW_OWN: "dashboard.view.own",

  CRM_VIEW_ALL: "crm.view.all",
  CRM_VIEW_OWN: "crm.view.own",
  CRM_MANAGE_ALL: "crm.manage.all",
  CRM_MANAGE_OWN: "crm.manage.own",

  TASKS_VIEW_ALL: "tasks.view.all",
  TASKS_VIEW_OWN: "tasks.view.own",
  TASKS_MANAGE_ALL: "tasks.manage.all",
  TASKS_MANAGE_OWN: "tasks.manage.own",

  PROCESSES_VIEW: "processes.view",
  PROCESSES_MANAGE: "processes.manage",

  MARKETING_VIEW_ALL: "marketing.view.all",
  MARKETING_VIEW_OWN: "marketing.view.own",
  MARKETING_MANAGE_ALL: "marketing.manage.all",
  MARKETING_MANAGE_OWN: "marketing.manage.own",

  KPIS_VIEW: "kpis.view",
  KPIS_MANAGE: "kpis.manage",

  GOALS_VIEW: "goals.view",
  GOALS_MANAGE: "goals.manage",

  EMPLOYEES_VIEW: "employees.view",
  EMPLOYEES_MANAGE: "employees.manage",

  TRAININGS_VIEW: "trainings.view",
  TRAININGS_MANAGE: "trainings.manage",

  REPORTS_VIEW: "reports.view",

  AUDIT_VIEW: "audit.view",

  SETTINGS_MANAGE: "settings.manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CATALOG: {
  code: PermissionCode;
  module: string;
  description: string;
}[] = [
  { code: PERMISSIONS.DASHBOARD_VIEW_EXECUTIVE, module: "dashboard", description: "Ver dashboard executivo (visao macro da empresa)" },
  { code: PERMISSIONS.DASHBOARD_VIEW_DEPARTMENT, module: "dashboard", description: "Ver dashboard do proprio setor" },
  { code: PERMISSIONS.DASHBOARD_VIEW_OWN, module: "dashboard", description: "Ver o proprio desempenho" },

  { code: PERMISSIONS.CRM_VIEW_ALL, module: "crm", description: "Ver todos os leads da empresa" },
  { code: PERMISSIONS.CRM_VIEW_OWN, module: "crm", description: "Ver apenas os proprios leads" },
  { code: PERMISSIONS.CRM_MANAGE_ALL, module: "crm", description: "Editar qualquer lead" },
  { code: PERMISSIONS.CRM_MANAGE_OWN, module: "crm", description: "Editar apenas os proprios leads" },

  { code: PERMISSIONS.TASKS_VIEW_ALL, module: "tasks", description: "Ver todas as tarefas" },
  { code: PERMISSIONS.TASKS_VIEW_OWN, module: "tasks", description: "Ver apenas as proprias tarefas" },
  { code: PERMISSIONS.TASKS_MANAGE_ALL, module: "tasks", description: "Editar qualquer tarefa" },
  { code: PERMISSIONS.TASKS_MANAGE_OWN, module: "tasks", description: "Editar apenas as proprias tarefas" },

  { code: PERMISSIONS.PROCESSES_VIEW, module: "processes", description: "Ver processos" },
  { code: PERMISSIONS.PROCESSES_MANAGE, module: "processes", description: "Criar/editar processos" },

  { code: PERMISSIONS.MARKETING_VIEW_ALL, module: "marketing", description: "Ver todas as demandas de marketing" },
  { code: PERMISSIONS.MARKETING_VIEW_OWN, module: "marketing", description: "Ver apenas as proprias demandas" },
  { code: PERMISSIONS.MARKETING_MANAGE_ALL, module: "marketing", description: "Editar qualquer demanda de marketing" },
  { code: PERMISSIONS.MARKETING_MANAGE_OWN, module: "marketing", description: "Editar apenas as proprias demandas" },

  { code: PERMISSIONS.KPIS_VIEW, module: "kpis", description: "Ver KPIs" },
  { code: PERMISSIONS.KPIS_MANAGE, module: "kpis", description: "Criar/editar KPIs" },

  { code: PERMISSIONS.GOALS_VIEW, module: "goals", description: "Ver metas" },
  { code: PERMISSIONS.GOALS_MANAGE, module: "goals", description: "Criar/editar metas" },

  { code: PERMISSIONS.EMPLOYEES_VIEW, module: "employees", description: "Ver funcionarios" },
  { code: PERMISSIONS.EMPLOYEES_MANAGE, module: "employees", description: "Criar/editar funcionarios" },

  { code: PERMISSIONS.TRAININGS_VIEW, module: "trainings", description: "Ver treinamentos" },
  { code: PERMISSIONS.TRAININGS_MANAGE, module: "trainings", description: "Criar/editar treinamentos" },

  { code: PERMISSIONS.REPORTS_VIEW, module: "reports", description: "Ver relatorios" },

  { code: PERMISSIONS.AUDIT_VIEW, module: "audit", description: "Ver logs de auditoria" },

  { code: PERMISSIONS.SETTINGS_MANAGE, module: "settings", description: "Gerenciar configuracoes administrativas" },
];

const ALL = PERMISSION_CATALOG.map((p) => p.code);

// Default permission set granted to each system role on seed. An admin can
// change this afterwards through the settings module (role_permissions
// rows), this is only the initial configuration.
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  DIRETOR: ALL,

  GESTOR_COMERCIAL: [
    PERMISSIONS.DASHBOARD_VIEW_DEPARTMENT,
    PERMISSIONS.CRM_VIEW_ALL,
    PERMISSIONS.CRM_MANAGE_ALL,
    PERMISSIONS.TASKS_VIEW_ALL,
    PERMISSIONS.TASKS_MANAGE_ALL,
    PERMISSIONS.PROCESSES_VIEW,
    PERMISSIONS.KPIS_VIEW,
    PERMISSIONS.GOALS_VIEW,
    PERMISSIONS.GOALS_MANAGE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.TRAININGS_VIEW,
    PERMISSIONS.TRAININGS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],

  GESTOR_MARKETING: [
    PERMISSIONS.DASHBOARD_VIEW_DEPARTMENT,
    PERMISSIONS.MARKETING_VIEW_ALL,
    PERMISSIONS.MARKETING_MANAGE_ALL,
    PERMISSIONS.TASKS_VIEW_ALL,
    PERMISSIONS.TASKS_MANAGE_ALL,
    PERMISSIONS.PROCESSES_VIEW,
    PERMISSIONS.KPIS_VIEW,
    PERMISSIONS.GOALS_VIEW,
    PERMISSIONS.GOALS_MANAGE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.TRAININGS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],

  OPERACOES: [
    PERMISSIONS.DASHBOARD_VIEW_DEPARTMENT,
    PERMISSIONS.CRM_VIEW_ALL,
    PERMISSIONS.PROCESSES_VIEW,
    PERMISSIONS.PROCESSES_MANAGE,
    PERMISSIONS.TASKS_VIEW_ALL,
    PERMISSIONS.TASKS_MANAGE_ALL,
    PERMISSIONS.KPIS_VIEW,
    PERMISSIONS.KPIS_MANAGE,
    PERMISSIONS.GOALS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.TRAININGS_VIEW,
  ],

  SDR: [
    PERMISSIONS.DASHBOARD_VIEW_OWN,
    PERMISSIONS.CRM_VIEW_OWN,
    PERMISSIONS.CRM_MANAGE_OWN,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_MANAGE_OWN,
    PERMISSIONS.TRAININGS_VIEW,
  ],

  CLOSER: [
    PERMISSIONS.DASHBOARD_VIEW_OWN,
    PERMISSIONS.CRM_VIEW_OWN,
    PERMISSIONS.CRM_MANAGE_OWN,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_MANAGE_OWN,
    PERMISSIONS.TRAININGS_VIEW,
  ],

  MARKETING: [
    PERMISSIONS.DASHBOARD_VIEW_OWN,
    PERMISSIONS.MARKETING_VIEW_OWN,
    PERMISSIONS.MARKETING_MANAGE_OWN,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_MANAGE_OWN,
    PERMISSIONS.TRAININGS_VIEW,
  ],

  DESIGNER: [
    PERMISSIONS.DASHBOARD_VIEW_OWN,
    PERMISSIONS.MARKETING_VIEW_OWN,
    PERMISSIONS.MARKETING_MANAGE_OWN,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_MANAGE_OWN,
    PERMISSIONS.TRAININGS_VIEW,
  ],

  FILMMAKER: [
    PERMISSIONS.DASHBOARD_VIEW_OWN,
    PERMISSIONS.MARKETING_VIEW_OWN,
    PERMISSIONS.MARKETING_MANAGE_OWN,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_MANAGE_OWN,
    PERMISSIONS.TRAININGS_VIEW,
  ],

  SOCIAL_MEDIA: [
    PERMISSIONS.DASHBOARD_VIEW_OWN,
    PERMISSIONS.MARKETING_VIEW_OWN,
    PERMISSIONS.MARKETING_MANAGE_OWN,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_MANAGE_OWN,
    PERMISSIONS.TRAININGS_VIEW,
  ],

  TRAFEGO: [
    PERMISSIONS.DASHBOARD_VIEW_OWN,
    PERMISSIONS.MARKETING_VIEW_OWN,
    PERMISSIONS.MARKETING_MANAGE_OWN,
    PERMISSIONS.TASKS_VIEW_OWN,
    PERMISSIONS.TASKS_MANAGE_OWN,
    PERMISSIONS.TRAININGS_VIEW,
  ],
};

// Sidebar module -> permission codes that unlock it (any one is enough).
export const MODULE_ACCESS: { key: string; label: string; href: string; anyOf: PermissionCode[] }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", anyOf: [PERMISSIONS.DASHBOARD_VIEW_EXECUTIVE, PERMISSIONS.DASHBOARD_VIEW_DEPARTMENT, PERMISSIONS.DASHBOARD_VIEW_OWN] },
  { key: "crm", label: "CRM", href: "/crm", anyOf: [PERMISSIONS.CRM_VIEW_ALL, PERMISSIONS.CRM_VIEW_OWN] },
  { key: "tasks", label: "Tarefas", href: "/tasks", anyOf: [PERMISSIONS.TASKS_VIEW_ALL, PERMISSIONS.TASKS_VIEW_OWN] },
  { key: "processes", label: "Processos", href: "/processes", anyOf: [PERMISSIONS.PROCESSES_VIEW] },
  { key: "marketing", label: "Marketing", href: "/marketing", anyOf: [PERMISSIONS.MARKETING_VIEW_ALL, PERMISSIONS.MARKETING_VIEW_OWN] },
  { key: "kpis", label: "KPIs", href: "/kpis", anyOf: [PERMISSIONS.KPIS_VIEW] },
  { key: "goals", label: "Metas", href: "/goals", anyOf: [PERMISSIONS.GOALS_VIEW] },
  { key: "employees", label: "Funcionarios", href: "/employees", anyOf: [PERMISSIONS.EMPLOYEES_VIEW] },
  { key: "trainings", label: "Treinamentos", href: "/trainings", anyOf: [PERMISSIONS.TRAININGS_VIEW] },
  { key: "reports", label: "Relatorios", href: "/reports", anyOf: [PERMISSIONS.REPORTS_VIEW] },
  { key: "notifications", label: "Notificacoes", href: "/notifications", anyOf: ALL },
  { key: "audit", label: "Auditoria", href: "/audit", anyOf: [PERMISSIONS.AUDIT_VIEW] },
  { key: "settings", label: "Configuracoes", href: "/settings", anyOf: [PERMISSIONS.SETTINGS_MANAGE] },
];
