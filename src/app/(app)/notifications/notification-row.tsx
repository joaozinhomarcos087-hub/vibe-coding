"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationRead } from "./actions";
import { cn } from "@/lib/utils";

export function NotificationRow({
  id,
  title,
  body,
  link,
  read,
  createdAt,
}: {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!read) {
      startTransition(async () => {
        await markNotificationRead(id);
        router.refresh();
      });
    }
    if (link) router.push(link);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full flex-col items-start gap-0.5 rounded-xl border p-4 text-left transition-colors",
        read ? "border-slate-200 bg-white" : "border-sky-200 bg-sky-50"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <p className={cn("text-sm font-medium", read ? "text-slate-700" : "text-slate-900")}>{title}</p>
        {!read && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
      </div>
      <p className="text-sm text-slate-500">{body}</p>
      <p className="mt-1 text-xs text-slate-400">{new Date(createdAt).toLocaleString("pt-BR")}</p>
    </button>
  );
}
