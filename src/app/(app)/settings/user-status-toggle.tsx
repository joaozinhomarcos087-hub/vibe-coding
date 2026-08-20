"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUserStatus } from "./actions";

export function UserStatusToggle({ userId, active, isSelf }: { userId: string; active: boolean; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (isSelf) return null;

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleUserStatus(userId, !active);
          router.refresh();
        })
      }
      className="text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50"
    >
      {active ? "Desativar" : "Ativar"}
    </button>
  );
}
