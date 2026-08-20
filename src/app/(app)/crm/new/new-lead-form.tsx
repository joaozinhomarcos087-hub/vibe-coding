"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createLead } from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";
const labelClass = "block text-sm font-medium text-slate-700";

export function NewLeadForm({
  owners,
  defaultOwnerId,
}: {
  owners: { id: string; name: string; role: { name: string } }[];
  defaultOwnerId: string;
}) {
  const [state, formAction, pending] = useActionState(createLead, {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state.leadId) {
      router.push(`/crm/${state.leadId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome do lead *</label>
          <input name="name" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Empresa</label>
          <input name="companyName" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Telefone</label>
          <input name="phone" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>E-mail</label>
          <input name="email" type="email" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Origem</label>
          <input name="source" placeholder="Meta Ads, indicacao..." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Temperatura *</label>
          <select name="temperature" required defaultValue="MORNO" className={inputClass}>
            <option value="QUENTE">Quente</option>
            <option value="MORNO">Morno</option>
            <option value="FRIO">Frio</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Valor potencial (R$)</label>
          <input name="potentialValue" type="number" min={0} step="0.01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Responsavel *</label>
          <select name="ownerId" required defaultValue={defaultOwnerId} className={inputClass}>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} — {o.role.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Proxima acao (obrigatoria)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data e hora *</label>
            <input name="nextContactAt" type="datetime-local" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tipo *</label>
            <select name="nextContactType" required defaultValue="WHATSAPP" className={inputClass}>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="LIGACAO">Ligacao</option>
              <option value="EMAIL">E-mail</option>
              <option value="REUNIAO">Reuniao</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Observacoes</label>
        <textarea name="notes" rows={3} className={inputClass} />
      </div>

      {state?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar lead"}
      </button>
    </form>
  );
}
