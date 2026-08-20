import type { GoalScope, Period } from "@/generated/prisma/enums";

export const GOAL_SCOPE_LABELS: Record<GoalScope, string> = {
  COMPANY: "Empresa",
  DEPARTMENT: "Setor",
  ROLE: "Cargo",
  EMPLOYEE: "Funcionario",
};

export const GOAL_PERIOD_LABELS: Record<Period, string> = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
};
