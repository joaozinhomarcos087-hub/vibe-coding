"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addLeadNote } from "../actions";

export function NoteForm({ leadId }: { leadId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      ref={ref}
      action={(formData) => {
        const note = String(formData.get("note") ?? "");
        startTransition(async () => {
          await addLeadNote(leadId, note);
          ref.current?.reset();
          router.refresh();
        });
      }}
      className="flex gap-2"
    >
      <input
        name="note"
        placeholder="Adicionar uma nota..."
        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        Adicionar
      </button>
    </form>
  );
}
