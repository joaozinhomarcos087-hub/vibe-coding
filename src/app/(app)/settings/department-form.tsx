"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createDepartment } from "./actions";

export function DepartmentForm() {
  const [state, formAction, pending] = useActionState(createDepartment, {});
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
      <div>
        <label className="block text-xs font-medium text-slate-500">Novo setor</label>
        <input name="name" required placeholder="Nome" className="mt-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" />
      </div>
      <input
        name="description"
        placeholder="Descricao (opcional)"
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Adicionar setor"}
      </button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
