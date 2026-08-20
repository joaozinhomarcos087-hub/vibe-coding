import { requirePermission, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { GOAL_SCOPE_LABELS, GOAL_PERIOD_LABELS } from "@/lib/goals";
import { NewGoalForm } from "./new-goal-form";
import { RecordProgressForm } from "./record-progress-form";

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

export default async function GoalsPage() {
  const user = await requirePermission([PERMISSIONS.GOALS_VIEW]);
  const manage = can(user, PERMISSIONS.GOALS_MANAGE);

  const [goals, departments, roles, employees] = await Promise.all([
    prisma.goal.findMany({
      where: { organizationId: user.organizationId },
      include: {
        department: { select: { name: true } },
        role: { select: { name: true } },
        progress: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
      orderBy: { startDate: "desc" },
    }),
    prisma.department.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
    prisma.role.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { user: { organizationId: user.organizationId } }, include: { user: { select: { name: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Metas</h1>
        <p className="text-sm text-slate-500">{goals.length} meta(s) cadastrada(s)</p>
      </div>

      {manage && (
        <details className="rounded-2xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">+ Nova meta</summary>
          <div className="mt-4">
            <NewGoalForm departments={departments} roles={roles} employees={employees.map((e) => ({ id: e.id, name: e.user.name }))} />
          </div>
        </details>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const achieved = goal.progress[0] ? Number(goal.progress[0].achievedValue) : 0;
          const target = Number(goal.targetValue);
          const pct = target > 0 ? Math.min(100, (achieved / target) * 100) : 0;
          const scopeLabel =
            goal.scope === "DEPARTMENT"
              ? goal.department?.name
              : goal.scope === "ROLE"
                ? goal.role?.name
                : GOAL_SCOPE_LABELS[goal.scope];

          return (
            <div key={goal.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-medium text-slate-900">{goal.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {scopeLabel} · {GOAL_PERIOD_LABELS[goal.period]} · {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
              </p>
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-800">
                  {achieved.toLocaleString("pt-BR")} / {target.toLocaleString("pt-BR")}
                </span>
                <span className="text-slate-500">{pct.toFixed(0)}%</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
              </div>
              {manage && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-slate-500">Registrar progresso</summary>
                  <div className="mt-2">
                    <RecordProgressForm goalId={goal.id} />
                  </div>
                </details>
              )}
            </div>
          );
        })}
        {goals.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Nenhuma meta cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}
