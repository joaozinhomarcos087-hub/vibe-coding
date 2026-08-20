import type { ProcessStatus, StepStatus, RaciRole } from "@/generated/prisma/enums";

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  ARCHIVED: "Arquivado",
};

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluida",
  LATE: "Atrasada",
};

export const RACI_LABELS: Record<RaciRole, string> = {
  RESPONSIBLE: "Responsavel (R)",
  ACCOUNTABLE: "Aprovador (A)",
  CONSULTED: "Consultado (C)",
  INFORMED: "Informado (I)",
};
