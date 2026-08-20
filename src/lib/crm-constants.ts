// Pure constants only (no server-only imports) so they are safe to import
// from both client and server components. Anything that needs auth/prisma
// belongs in `crm.ts` instead, which must never be imported by a "use
// client" file (it would drag bcrypt/pg into the browser bundle).
import type { LeadStage, LeadTemperature } from "@/generated/prisma/enums";

// Pipeline order (section 10).
export const STAGE_ORDER: LeadStage[] = [
  "NOVO_LEAD",
  "PRIMEIRO_CONTATO",
  "QUALIFICACAO",
  "REUNIAO_AGENDADA",
  "REUNIAO_REALIZADA",
  "PROPOSTA_ENVIADA",
  "NEGOCIACAO",
  "FECHADO_GANHO",
  "FECHADO_PERDIDO",
  "POS_VENDA",
];

export const STAGE_LABELS: Record<LeadStage, string> = {
  NOVO_LEAD: "Novo Lead",
  PRIMEIRO_CONTATO: "Primeiro Contato",
  QUALIFICACAO: "Qualificacao",
  REUNIAO_AGENDADA: "Reuniao Agendada",
  REUNIAO_REALIZADA: "Reuniao Realizada",
  PROPOSTA_ENVIADA: "Proposta Enviada",
  NEGOCIACAO: "Negociacao",
  FECHADO_GANHO: "Fechado/Ganho",
  FECHADO_PERDIDO: "Fechado/Perdido",
  POS_VENDA: "Pos-venda",
};

export const CLOSED_STAGES: LeadStage[] = ["FECHADO_GANHO", "FECHADO_PERDIDO", "POS_VENDA"];

export const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  QUENTE: "Quente",
  MORNO: "Morno",
  FRIO: "Frio",
};
