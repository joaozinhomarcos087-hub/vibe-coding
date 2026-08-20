"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "7", label: "Ultimos 7 dias" },
  { value: "30", label: "Ultimos 30 dias" },
  { value: "90", label: "Ultimos 90 dias" },
];

export function PeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("days") ?? "30";

  return (
    <select
      value={current}
      onChange={(e) => router.push(`/dashboard?days=${e.target.value}`)}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
