import { requirePermission, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NewTrainingForm } from "./new-training-form";
import { MyProgressForm } from "./my-progress-form";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluido",
  LATE: "Atrasado",
};

export default async function TrainingsPage() {
  const user = await requirePermission([PERMISSIONS.TRAININGS_VIEW]);
  const manage = can(user, PERMISSIONS.TRAININGS_MANAGE);

  const [trainings, departments, roles] = await Promise.all([
    prisma.training.findMany({
      where: { organizationId: user.organizationId },
      include: {
        department: { select: { name: true } },
        role: { select: { name: true } },
        progress: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
    prisma.role.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Treinamentos</h1>
        <p className="text-sm text-slate-500">{trainings.length} treinamento(s)</p>
      </div>

      {manage && (
        <details className="rounded-2xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">+ Novo treinamento</summary>
          <div className="mt-4">
            <NewTrainingForm departments={departments} roles={roles} />
          </div>
        </details>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {trainings.map((t) => {
          const done = t.progress.filter((p) => p.status === "DONE").length;
          const total = t.progress.length;
          const mine = t.progress.find((p) => p.userId === user.id);

          return (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="font-medium text-slate-900">{t.name}</p>
              {t.description && <p className="mt-1 text-xs text-slate-500">{t.description}</p>}
              <p className="mt-2 text-xs text-slate-400">
                {t.department?.name ?? t.role?.name ?? "Todos"} · {done}/{total} concluido(s)
                {t.deadline && ` · prazo ${t.deadline.toLocaleDateString("pt-BR")}`}
              </p>
              {(t.materialUrl || t.videoUrl) && (
                <div className="mt-2 flex gap-3 text-xs">
                  {t.materialUrl && (
                    <a href={t.materialUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                      Material
                    </a>
                  )}
                  {t.videoUrl && (
                    <a href={t.videoUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                      Video
                    </a>
                  )}
                </div>
              )}

              {mine && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-1.5 text-xs font-medium text-slate-500">
                    Meu progresso: {STATUS_LABELS[mine.status]} ({mine.progressPercent}%)
                  </p>
                  <MyProgressForm trainingId={t.id} status={mine.status} progressPercent={mine.progressPercent} />
                </div>
              )}
            </div>
          );
        })}
        {trainings.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Nenhum treinamento cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
