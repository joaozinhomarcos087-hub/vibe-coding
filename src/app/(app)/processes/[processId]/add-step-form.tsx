"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addProcessStep } from "../actions";

export function AddStepForm({ processId, users }: { processId: string; users: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(addProcessStep.bind(null, processId), {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-medium text-slate-500">Nova etapa</label>
        <input
          name="name"
          required
          placeholder="Nome da etapa"
          className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Responsavel</label>
        <select
          name="ownerId"
          required
          className="mt-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Prazo</label>
        <input
          name="deadline"
          type="date"
          className="mt-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Adicionando..." : "Adicionar etapa"}
      </button>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
