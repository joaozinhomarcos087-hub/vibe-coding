"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleChecklistItem } from "../actions";

export function ChecklistItemRow({
  id,
  label,
  done,
  disabled,
}: {
  id: string;
  label: string;
  done: boolean;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <li className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        defaultChecked={done}
        disabled={disabled || pending}
        onChange={(e) => {
          const checked = e.target.checked;
          startTransition(async () => {
            await toggleChecklistItem(id, checked);
            router.refresh();
          });
        }}
        className="h-4 w-4 rounded border-slate-300"
      />
      <span className={done ? "text-slate-400 line-through" : "text-slate-700"}>{label}</span>
    </li>
  );
}
