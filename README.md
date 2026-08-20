# Mini SaaS — Gestao Operacional, Comercial e Marketing

Plataforma unica para Diretoria, Comercial, Marketing e Operacoes: CRM, processos, tarefas, marketing, KPIs, metas, treinamentos, notificacoes e auditoria, com controle de acesso por papel (RBAC).

Ver `docs/architecture.md` para a arquitetura completa.

## Stack

Next.js 16 (App Router) + TypeScript, PostgreSQL + Prisma 7, Auth.js (NextAuth v5), Tailwind CSS v4.

## Rodando localmente

1. Suba um PostgreSQL e configure `DATABASE_URL` em `.env` (copie de `.env.example`).
2. Instale as dependencias: `npm install`
3. Aplique as migracoes: `npm run db:migrate`
4. Popule dados de demonstracao: `npm run db:seed`
5. Rode o servidor: `npm run dev`

## Logins de demonstracao

Senha para todos: `Demo@1234`

| Papel | E-mail |
|---|---|
| Diretor | diretor@empresademo.com |
| Gestor Comercial | gestor.comercial@empresademo.com |
| Gestor de Marketing | gestor.marketing@empresademo.com |
| Operacoes | operacoes@empresademo.com |
| SDR | sdr@empresademo.com |
| Closer | closer@empresademo.com |
| Marketing | marketing@empresademo.com |
| Designer | designer@empresademo.com |
| Filmmaker | filmmaker@empresademo.com |
| Social Media | social@empresademo.com |
| Trafego Pago | trafego@empresademo.com |

## Status dos modulos

Todos os modulos abaixo estao implementados: banco de dados real, regras de negocio no servidor, RBAC (visao e edicao), auditoria e testados de ponta a ponta.

- [x] Arquitetura, banco de dados (schema completo), autenticacao, RBAC, seed, layout base com menu por permissao
- [x] CRM (pipeline Kanban, follow-ups, motor de alertas configuravel 48h/72h)
- [x] Tarefas (Kanban, recorrencia, escalonamento automatico ao gestor)
- [x] Processos (etapas, checklist, matriz RACI)
- [x] Marketing (demandas em Kanban por status)
- [x] KPIs (com historico de resultados e status 🟢🟡🔴)
- [x] Metas (por empresa/setor/cargo/funcionario, com progresso)
- [x] Funcionarios (diretorio, setor, gestor, status)
- [x] Treinamentos (publico-alvo automatico por setor/cargo, progresso individual)
- [x] Relatorios (comercial, marketing, operacoes, pessoas — com exportacao CSV)
- [x] Auditoria (log completo com filtro e diff antes/depois)
- [x] Dashboard executivo adaptativo (visao da empresa, do setor, ou "Meu desempenho", conforme o papel)
- [x] Notificacoes (central real, marcar como lida)
- [x] Configuracoes (setores, usuarios, matriz de permissoes por cargo, limiares de alerta do CRM)
