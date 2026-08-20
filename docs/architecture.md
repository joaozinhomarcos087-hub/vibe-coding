# Arquitetura — Mini SaaS de Gestao Operacional, Comercial e Marketing

## Stack

- **Next.js 16 (App Router)** + TypeScript — frontend e backend (server actions / route handlers) no mesmo projeto.
- **PostgreSQL** via **Prisma ORM 7** (`@prisma/adapter-pg`) — banco relacional unico, com FKs, indices, timestamps e soft delete onde aplicavel.
- **Auth.js / NextAuth v5** (Credentials provider, JWT session) — autenticacao com senha com hash bcrypt.
- **RBAC configuravel via banco** — tabelas `roles`, `permissions`, `role_permissions`; nao ha permissao hardcoded no frontend sem checagem equivalente no backend.
- **Tailwind CSS v4** para UI.

## Multi-tenant (preparacao)

Toda tabela relevante carrega `organizationId`. Hoje existe uma unica `Organization` semeada (`empresa-demo`), mas todo o modelo de dados e as queries ja isolam por organizacao, permitindo evoluir para multiplos tenants sem reescrever o schema.

## RBAC

- Catalogo de permissoes central em `src/lib/permissions.ts` (`PERMISSION_CATALOG`), no formato `modulo.acao.escopo` (ex.: `crm.view.own`, `crm.manage.all`).
- `DEFAULT_ROLE_PERMISSIONS` define a configuracao inicial de cada um dos 11 papeis do organograma (Diretor, Gestor Comercial, Gestor de Marketing, Operacoes, SDR, Closer, Marketing, Designer, Filmmaker, Social Media, Trafego). Um administrador pode reconfigurar isso depois via `role_permissions` (modulo de Configuracoes).
- `src/lib/authz.ts` expoe `requireUser`, `requirePermission` e `can`/`canAny`, usados tanto para esconder itens de menu quanto para bloquear paginas e server actions (a UI nunca e a unica camada de protecao).
- `src/proxy.ts` (middleware) protege todas as rotas exceto `/api` e assets estaticos, redirecionando usuarios nao autenticados para `/login`.

## Modulos e tabelas (visao geral)

| Modulo | Tabelas principais |
|---|---|
| Identidade/Org | `organizations`, `departments`, `users`, `employees`, `roles`, `permissions`, `role_permissions` |
| CRM | `companies`, `contacts`, `leads`, `deals`, `proposals`, `activities`, `follow_ups` |
| Processos | `processes`, `process_steps`, `checklist_items`, `raci_entries` |
| Tarefas | `tasks`, `comments`, `attachments` |
| Marketing | `campaigns`, `campaign_metrics`, `content`, `marketing_tasks` |
| KPIs/Metas | `kpis`, `kpi_results`, `goals`, `goal_progress` |
| Pessoas | `trainings`, `training_progress` |
| Sistema | `notifications`, `audit_logs`, `automation_rules`, `system_settings` |

Ver `prisma/schema.prisma` para o detalhamento de campos, enums e relacoes.

## Auditoria

`src/lib/audit.ts` centraliza a escrita em `audit_logs` (quem, o que, quando, dados antigos/novos). Toda mutacao relevante (leads, tarefas, propostas, processos, permissoes, metas) deve chamar esse helper — nao existe mutacao "silenciosa" nos modulos criticos.

## Seed

`prisma/seed.ts` cria a organizacao demo, os 4 departamentos, os 11 papeis com permissoes padrao, um usuario por papel (`Demo@1234`), e dados de exemplo (leads, follow-ups, tarefas, processo com RACI, demandas de marketing, KPI, meta, treinamento) para que cada modulo tenha dados reais para renderizar.

## Ordem de implementacao

Seguindo a secao 39 do prompt mestre: arquitetura -> banco -> autenticacao -> RBAC -> layout -> CRM -> processos/tarefas -> marketing -> KPIs/metas -> dashboards -> notificacoes -> logs -> relatorios -> automacoes -> seguranca. Cada modulo so avanca depois do anterior estar funcional (banco + backend + frontend + permissoes + validacao + log).
