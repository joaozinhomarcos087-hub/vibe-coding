"use client";

import { useActionState } from "react";
import { updateAlertThresholds } from "./actions";

export function ThresholdForm({ yellow, red }: { yellow: number; red: number }) {
  const [state, formAction, pending] = useActionState(updateAlertThresholds, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500">Alerta amarelo (horas)</label>
        <input
          name="yellow"
          type="number"
          min={1}
          defaultValue={yellow}
          className="mt-1 w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Alerta vermelho (horas)</label>
        <input
          name="red"
          type="number"
          min={1}
          defaultValue={red}
          className="mt-1 w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">Salvo.</p>}
    </form>
  );
}
