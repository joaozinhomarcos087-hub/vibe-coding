"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStepStatus } from "../actions";
import { STEP_STATUS_LABELS } from "@/lib/processes";
import type { StepStatus } from "@/generated/prisma/enums";

export function StepStatusSelect({
  stepId,
  currentStatus,
  disabled,
}: {
  stepId: string;
  currentStatus: StepStatus;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={currentStatus}
      disabled={disabled || pending}
      onChange={(e) => {
        const status = e.target.value as StepStatus;
        startTransition(async () => {
          await updateStepStatus(stepId, status);
          router.refresh();
        });
      }}
      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-slate-900 disabled:bg-slate-50"
    >
      {Object.entries(STEP_STATUS_LABELS).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}
