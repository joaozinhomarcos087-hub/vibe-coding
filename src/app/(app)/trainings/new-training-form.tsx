"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTraining } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900";
const labelClass = "block text-xs font-medium text-slate-500";

export function NewTrainingForm({
  departments,
  roles,
}: {
  departments: { id: string; name: string }[];
  roles: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createTraining, {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className={labelClass}>Nome *</label>
        <input name="name" required className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className={labelClass}>Descricao</label>
        <textarea name="description" rows={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Setor (publico-alvo)</label>
        <select name="departmentId" className={inputClass}>
          <option value="">Todos</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Cargo (publico-alvo)</label>
        <select name="roleId" className={inputClass}>
          <option value="">Todos</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Material (URL)</label>
        <input name="materialUrl" type="url" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Video (URL)</label>
        <input name="videoUrl" type="url" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Prazo</label>
        <input name="deadline" type="date" className={inputClass} />
      </div>
      {state?.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="col-span-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar treinamento"}
      </button>
    </form>
  );
}
