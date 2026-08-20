"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { recordGoalProgress } from "./actions";

export function RecordProgressForm({ goalId }: { goalId: string }) {
  const [state, formAction, pending] = useActionState(recordGoalProgress.bind(null, goalId), {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2 rounded-lg bg-slate-50 p-3">
      <div className="flex-1">
        <label className="block text-[11px] font-medium text-slate-500">Valor alcancado</label>
        <input
          name="achievedValue"
          type="number"
          step="0.01"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-slate-900"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Registrar"}
      </button>
      {state?.error && <p className="text-[11px] text-red-600">{state.error}</p>}
    </form>
  );
}
