"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { recordKpiResult } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-slate-900";
const labelClass = "block text-[11px] font-medium text-slate-500";

export function RecordResultForm({ kpiId }: { kpiId: string }) {
  const [state, formAction, pending] = useActionState(recordKpiResult.bind(null, kpiId), {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2 rounded-lg bg-slate-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Inicio *</label>
          <input name="periodStart" type="date" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fim *</label>
          <input name="periodEnd" type="date" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Resultado *</label>
          <input name="resultValue" type="number" step="0.01" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Status *</label>
          <select name="status" required defaultValue="ON_TARGET" className={inputClass}>
            <option value="ON_TARGET">🟢 Meta atingida</option>
            <option value="WARNING">🟡 Atencao</option>
            <option value="OFF_TARGET">🔴 Meta nao atingida</option>
          </select>
        </div>
      </div>
      {state?.error && <p className="text-[11px] text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Registrar"}
      </button>
    </form>
  );
}
