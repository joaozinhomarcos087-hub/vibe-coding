"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyTrainingProgress } from "./actions";

export function MyProgressForm({
  trainingId,
  status,
  progressPercent,
}: {
  trainingId: string;
  status: string;
  progressPercent: number;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateMyTrainingProgress(trainingId, formData);
          router.refresh();
        });
      }}
      className="flex items-center gap-2"
    >
      <select
        name="status"
        defaultValue={status}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-slate-900"
      >
        <option value="PENDING">Pendente</option>
        <option value="IN_PROGRESS">Em andamento</option>
        <option value="DONE">Concluido</option>
      </select>
      <input
        name="progressPercent"
        type="number"
        min={0}
        max={100}
        defaultValue={progressPercent}
        className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-slate-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        Salvar
      </button>
    </form>
  );
}
