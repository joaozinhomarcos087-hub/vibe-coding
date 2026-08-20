import type { TaskPriority, TaskStatus, TaskRecurrence } from "@/generated/prisma/enums";

export const TASK_STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "LATE", "DONE", "CANCELED"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluida",
  LATE: "Atrasada",
  CANCELED: "Cancelada",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const TASK_RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  NONE: "Nao recorrente",
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
};
