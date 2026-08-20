import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PROCESS_STATUS_LABELS } from "@/lib/processes";

export default async function ProcessesPage() {
  const user = await requirePermission([PERMISSIONS.PROCESSES_VIEW]);

  const processes = await prisma.process.findMany({
    where: { organizationId: user.organizationId },
    include: {
      department: { select: { name: true } },
      owner: { select: { name: true } },
      steps: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Processos</h1>
          <p className="text-sm text-slate-500">{processes.length} processo(s)</p>
        </div>
        {can(user, PERMISSIONS.PROCESSES_MANAGE) && (
          <Link
            href="/processes/new"
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Novo processo
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {processes.map((p) => {
          const done = p.steps.filter((s) => s.status === "DONE").length;
          const total = p.steps.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={p.id}
              href={`/processes/${p.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300"
            >
              <div className="flex items-start justify-between">
                <p className="font-medium text-slate-900">{p.name}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {PROCESS_STATUS_LABELS[p.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {p.department?.name ?? "Sem setor"} · {p.owner.name}
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {done}/{total} etapas concluidas
              </p>
            </Link>
          );
        })}
        {processes.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Nenhum processo cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
