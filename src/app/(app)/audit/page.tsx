import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/generated/prisma/enums";

const ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  CREATE: "Criacao",
  UPDATE: "Edicao",
  DELETE: "Exclusao",
  STATUS_CHANGE: "Mudanca de status",
  ASSIGNEE_CHANGE: "Mudanca de responsavel",
  PERMISSION_CHANGE: "Mudanca de permissao",
};

const ACTION_CLASS: Record<AuditAction, string> = {
  LOGIN: "bg-slate-100 text-slate-600",
  LOGOUT: "bg-slate-100 text-slate-600",
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-sky-100 text-sky-700",
  DELETE: "bg-red-100 text-red-700",
  STATUS_CHANGE: "bg-amber-100 text-amber-700",
  ASSIGNEE_CHANGE: "bg-violet-100 text-violet-700",
  PERMISSION_CHANGE: "bg-red-100 text-red-700",
};

function formatDate(d: Date) {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

const PAGE_SIZE = 50;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string; page?: string }>;
}) {
  const user = await requirePermission([PERMISSIONS.AUDIT_VIEW]);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const where = {
    organizationId: user.organizationId,
    ...(params.entityType ? { entityType: params.entityType } : {}),
    ...(params.action ? { action: params.action as AuditAction } : {}),
  };

  const [logs, total, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where: { organizationId: user.organizationId },
      distinct: ["entityType"],
      select: { entityType: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Auditoria</h1>
        <p className="text-sm text-slate-500">{total} registro(s) de auditoria</p>
      </div>

      <form className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <select
          name="entityType"
          defaultValue={params.entityType ?? ""}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        >
          <option value="">Todas as entidades</option>
          {entityTypes.map((e) => (
            <option key={e.entityType} value={e.entityType}>
              {e.entityType}
            </option>
          ))}
        </select>
        <select
          name="action"
          defaultValue={params.action ?? ""}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        >
          <option value="">Todas as acoes</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Data/hora</th>
              <th className="px-4 py-2.5">Usuario</th>
              <th className="px-4 py-2.5">Acao</th>
              <th className="px-4 py-2.5">Entidade</th>
              <th className="px-4 py-2.5">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-2.5 text-slate-700">{log.user?.name ?? "Sistema"}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_CLASS[log.action]}`}>
                    {ACTION_LABELS[log.action]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-700">
                  {log.entityType} <span className="text-slate-400">#{log.entityId.slice(0, 8)}</span>
                </td>
                <td className="max-w-md px-4 py-2.5">
                  {log.oldData !== null && log.oldData !== undefined && (
                    <p className="truncate text-xs text-slate-400">
                      antes: {JSON.stringify(log.oldData)}
                    </p>
                  )}
                  {log.newData !== null && log.newData !== undefined && (
                    <p className="truncate text-xs text-slate-600">
                      depois: {JSON.stringify(log.newData)}
                    </p>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>
            Pagina {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}`} className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-50">
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}`} className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-50">
                Proxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
