"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLead } from "../actions";
import type { LeadTemperature } from "@/generated/prisma/enums";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";
const labelClass = "block text-xs font-medium text-slate-500";

export function LeadEditForm({
  leadId,
  temperature,
  potentialValue,
  notes,
  ownerId,
  owners,
  canReassign,
}: {
  leadId: string;
  temperature: LeadTemperature;
  potentialValue: number | null;
  notes: string | null;
  ownerId: string;
  owners: { id: string; name: string }[];
  canReassign: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await updateLead(leadId, formData);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Erro ao salvar.");
          }
        });
      }}
      className="space-y-3"
    >
      <div>
        <label className={labelClass}>Temperatura</label>
        <select name="temperature" defaultValue={temperature} className={inputClass}>
          <option value="QUENTE">Quente</option>
          <option value="MORNO">Morno</option>
          <option value="FRIO">Frio</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Valor potencial (R$)</label>
        <input name="potentialValue" type="number" min={0} step="0.01" defaultValue={potentialValue ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Responsavel</label>
        <select name="ownerId" defaultValue={ownerId} disabled={!canReassign} className={inputClass}>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Observacoes</label>
        <textarea name="notes" rows={3} defaultValue={notes ?? ""} className={inputClass} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar alteracoes"}
      </button>
    </form>
  );
}
