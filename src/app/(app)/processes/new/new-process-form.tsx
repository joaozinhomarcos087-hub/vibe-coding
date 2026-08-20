"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProcess } from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";
const labelClass = "block text-sm font-medium text-slate-700";

export function NewProcessForm({
  departments,
  users,
  defaultOwnerId,
}: {
  departments: { id: string; name: string }[];
  users: { id: string; name: string }[];
  defaultOwnerId: string;
}) {
  const [state, formAction, pending] = useActionState(createProcess, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push("/processes");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <label className={labelClass}>Nome *</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Descricao</label>
        <textarea name="description" rows={3} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Setor</label>
          <select name="departmentId" className={inputClass}>
            <option value="">Sem setor</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Responsavel *</label>
          <select name="ownerId" required defaultValue={defaultOwnerId} className={inputClass}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Prazo</label>
          <input name="deadline" type="date" className={inputClass} />
        </div>
      </div>

      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar processo"}
      </button>
    </form>
  );
}
