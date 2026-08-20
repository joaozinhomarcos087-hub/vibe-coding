"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStage } from "../actions";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/crm-constants";
import type { LeadStage } from "@/generated/prisma/enums";

export function StageSelect({
  leadId,
  currentStage,
  disabled,
}: {
  leadId: string;
  currentStage: LeadStage;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={currentStage}
      disabled={disabled || pending}
      onChange={(e) => {
        const stage = e.target.value as LeadStage;
        startTransition(async () => {
          await updateLeadStage(leadId, stage);
          router.refresh();
        });
      }}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
    >
      {STAGE_ORDER.map((stage) => (
        <option key={stage} value={stage}>
          {STAGE_LABELS[stage]}
        </option>
      ))}
    </select>
  );
}
