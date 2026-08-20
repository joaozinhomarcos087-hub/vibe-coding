"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeFollowUp, createFollowUp, cancelFollowUp } from "../actions";

type FollowUp = {
  id: string;
  scheduledAt: Date;
  type: string;
  status: string;
  notes: string | null;
  completedAt: Date | null;
};

const TYPE_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  LIGACAO: "Ligacao",
  EMAIL: "E-mail",
  REUNIAO: "Reuniao",
  OUTRO: "Outro",
};

const STATUS_CLASS: Record<string, string> = {
  PENDENTE: "bg-sky-100 text-sky-700",
  CONCLUIDO: "bg-emerald-100 text-emerald-700",
  ATRASADO: "bg-red-100 text-red-700",
  CANCELADO: "bg-slate-100 text-slate-500",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";
const labelClass = "block text-xs font-medium text-slate-500";

function CompleteForm({ followUpId, onDone }: { followUpId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(completeFollowUp.bind(null, followUpId), {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      onDone();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
      <div>
        <label className={labelClass}>Notas da conclusao</label>
        <textarea name="completionNotes" rows={2} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Proxima acao *</label>
          <input name="nextScheduledAt" type="datetime-local" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tipo *</label>
          <select name="nextType" required defaultValue="WHATSAPP" className={inputClass}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Concluir e agendar proxima"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function NewFollowUpForm({ leadId, onDone }: { leadId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createFollowUp.bind(null, leadId), {});
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      onDone();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Data e hora *</label>
          <input name="scheduledAt" type="datetime-local" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tipo *</label>
          <select name="type" required defaultValue="WHATSAPP" className={inputClass}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Notas</label>
        <textarea name="notes" rows={2} className={inputClass} />
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Agendar follow-up"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function FollowUpPanel({
  leadId,
  pending,
  past,
  editable,
}: {
  leadId: string;
  pending: FollowUp[];
  past: FollowUp[];
  editable: boolean;
}) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Follow-ups</h2>
        {editable && !showNew && (
          <button
            onClick={() => setShowNew(true)}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + Agendar follow-up
          </button>
        )}
      </div>

      {showNew && <NewFollowUpForm leadId={leadId} onDone={() => setShowNew(false)} />}

      <div className="mt-3 space-y-2">
        {pending.length === 0 && !showNew && (
          <p className="text-sm text-red-600">Nenhuma proxima acao agendada — isso viola a regra do CRM.</p>
        )}
        {pending.map((f) => (
          <div key={f.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[f.status]}`}>
                  {f.status}
                </span>
                <span className="text-sm font-medium text-slate-800">{TYPE_LABEL[f.type]}</span>
                <span className="ml-2 text-xs text-slate-500">{formatDate(f.scheduledAt)}</span>
              </div>
              {editable && completingId !== f.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCompletingId(f.id)}
                    className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Concluir
                  </button>
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await cancelFollowUp(f.id);
                        router.refresh();
                      })
                    }
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            {f.notes && <p className="mt-1 text-xs text-slate-500">{f.notes}</p>}
            {completingId === f.id && <CompleteForm followUpId={f.id} onDone={() => setCompletingId(null)} />}
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-slate-500">
            Historico ({past.length})
          </summary>
          <div className="mt-2 space-y-2">
            {past.map((f) => (
              <div key={f.id} className="rounded-lg border border-slate-100 p-2.5 text-xs">
                <span className={`mr-2 rounded-full px-2 py-0.5 font-medium ${STATUS_CLASS[f.status]}`}>{f.status}</span>
                {TYPE_LABEL[f.type]} · {formatDate(f.scheduledAt)}
                {f.notes && <p className="mt-1 text-slate-500">{f.notes}</p>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
