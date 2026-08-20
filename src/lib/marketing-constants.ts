import type { ContentStatus, MarketingTaskType } from "@/generated/prisma/enums";

export const MARKETING_STATUS_ORDER: ContentStatus[] = [
  "BACKLOG",
  "BRIEFING",
  "EM_PRODUCAO",
  "REVISAO",
  "AJUSTES",
  "APROVACAO",
  "APROVADO",
  "PUBLICADO",
  "FINALIZADO",
];

export const MARKETING_STATUS_LABELS: Record<ContentStatus, string> = {
  BACKLOG: "Backlog",
  BRIEFING: "Briefing",
  EM_PRODUCAO: "Em producao",
  REVISAO: "Revisao",
  AJUSTES: "Ajustes",
  APROVACAO: "Aprovacao",
  APROVADO: "Aprovado",
  PUBLICADO: "Publicado",
  FINALIZADO: "Finalizado",
};

export const MARKETING_TYPE_LABELS: Record<MarketingTaskType, string> = {
  ARTE: "Arte",
  VIDEO: "Video",
  REELS: "Reels",
  COPY: "Copy",
  CAMPANHA: "Campanha",
  SOCIAL_MEDIA: "Social Media",
  TRAFEGO: "Trafego",
  OUTRO: "Outro",
};
