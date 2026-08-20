import type { KpiStatus, Period } from "@/generated/prisma/enums";

export const KPI_STATUS_LABELS: Record<KpiStatus, string> = {
  ON_TARGET: "Meta atingida",
  WARNING: "Atencao",
  OFF_TARGET: "Meta nao atingida",
};

export const KPI_STATUS_ICON: Record<KpiStatus, string> = {
  ON_TARGET: "🟢",
  WARNING: "🟡",
  OFF_TARGET: "🔴",
};

export const KPI_STATUS_CLASS: Record<KpiStatus, string> = {
  ON_TARGET: "bg-emerald-100 text-emerald-700",
  WARNING: "bg-amber-100 text-amber-700",
  OFF_TARGET: "bg-red-100 text-red-700",
};

export const PERIOD_LABELS: Record<Period, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
};
