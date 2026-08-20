"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMarketingTask } from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";
const labelClass = "block text-sm font-medium text-slate-700";

export function NewMarketingTaskForm({
  assignees,
}: {
  assignees: { id: string; name: string; role: { name: string } }[];
}) {
  const [state, formAction, pending] = useActionState(createMarketingTask, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push("/marketing");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <label className={labelClass}>Titulo *</label>
        <input name="title" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Descricao</label>
        <textarea name="description" rows={3} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tipo *</label>
          <select name="type" required defaultValue="ARTE" className={inputClass}>
            <option value="ARTE">Arte</option>
            <option value="VIDEO">Video</option>
            <option value="REELS">Reels</option>
            <option value="COPY">Copy</option>
            <option value="CAMPANHA">Campanha</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="TRAFEGO">Trafego</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Prioridade *</label>
          <select name="priority" required defaultValue="MEDIUM" className={inputClass}>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Responsavel *</label>
          <select name="assigneeId" required className={inputClass}>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.role.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Prazo</label>
          <input name="dueDate" type="datetime-local" className={inputClass} />
        </div>
      </div>

      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar demanda"}
      </button>
    </form>
  );
}
