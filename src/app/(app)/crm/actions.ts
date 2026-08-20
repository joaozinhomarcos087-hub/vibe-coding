"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission, can } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { canManageLead, STAGE_ORDER } from "@/lib/crm";
import type { LeadStage, FollowUpType } from "@/generated/prisma/enums";

const STAGES = STAGE_ORDER as [LeadStage, ...LeadStage[]];
const FOLLOW_UP_TYPES: [FollowUpType, ...FollowUpType[]] = ["WHATSAPP", "LIGACAO", "EMAIL", "REUNIAO", "OUTRO"];

type FormActionState = { error?: string; success?: boolean; leadId?: string };

const createLeadSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string().optional(),
  ownerId: z.string().min(1, "Responsavel obrigatorio"),
  temperature: z.enum(["QUENTE", "MORNO", "FRIO"]),
  potentialValue: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
  nextContactAt: z.string().min(1, "Proxima acao obrigatoria"),
  nextContactType: z.enum(FOLLOW_UP_TYPES),
});

export async function createLead(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requirePermission([PERMISSIONS.CRM_MANAGE_ALL, PERMISSIONS.CRM_MANAGE_OWN]);

  const parsed = createLeadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }
  const data = parsed.data;

  // Rule (section 11): a lead can never be left without an owner. Only
  // managers may assign someone other than themselves.
  if (!can(user, PERMISSIONS.CRM_MANAGE_ALL) && data.ownerId !== user.id) {
    return { error: "Voce so pode criar leads atribuidos a si mesmo." };
  }

  let companyId: string | undefined;
  if (data.companyName?.trim()) {
    const existing = await prisma.company.findFirst({
      where: { organizationId: user.organizationId, name: data.companyName.trim() },
    });
    companyId = existing?.id ?? (await prisma.company.create({
      data: { organizationId: user.organizationId, name: data.companyName.trim() },
    })).id;
  }

  const lead = await prisma.lead.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      companyId,
      phone: data.phone || undefined,
      email: data.email || undefined,
      source: data.source || undefined,
      ownerId: data.ownerId,
      temperature: data.temperature,
      potentialValue: data.potentialValue,
      notes: data.notes || undefined,
      nextContactAt: new Date(data.nextContactAt),
      stage: "NOVO_LEAD",
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: lead.id,
      ownerId: data.ownerId,
      scheduledAt: new Date(data.nextContactAt),
      type: data.nextContactType,
      status: "PENDENTE",
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "Lead",
    entityId: lead.id,
    newData: { name: lead.name, ownerId: lead.ownerId, stage: lead.stage },
  });

  revalidatePath("/crm");
  return { success: true, leadId: lead.id };
}

export async function updateLeadStage(leadId: string, newStage: LeadStage) {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: user.organizationId } });
  if (!lead) throw new Error("Lead nao encontrado.");
  if (!canManageLead(user, lead)) throw new Error("Sem permissao para mover este lead.");
  if (!STAGES.includes(newStage)) throw new Error("Etapa invalida.");
  if (newStage === lead.stage) return;

  const isClosing = newStage === "FECHADO_GANHO" || newStage === "FECHADO_PERDIDO";

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: {
        stage: newStage,
        closedAt: isClosing ? new Date() : lead.closedAt,
        closedValue: newStage === "FECHADO_GANHO" ? (lead.potentialValue ?? undefined) : lead.closedValue,
      },
    });

    if (newStage === "FECHADO_GANHO") {
      const existingDeal = await tx.deal.findFirst({ where: { leadId } });
      if (existingDeal) {
        await tx.deal.update({ where: { id: existingDeal.id }, data: { stage: "WON", wonAt: new Date() } });
      } else {
        await tx.deal.create({
          data: {
            leadId,
            ownerId: lead.ownerId,
            value: lead.potentialValue ?? 0,
            stage: "WON",
            wonAt: new Date(),
          },
        });
      }
    } else if (newStage === "FECHADO_PERDIDO") {
      const existingDeal = await tx.deal.findFirst({ where: { leadId } });
      if (existingDeal) {
        await tx.deal.update({ where: { id: existingDeal.id }, data: { stage: "LOST", lostAt: new Date() } });
      }
    }

    await tx.activity.create({
      data: {
        leadId,
        type: "STATUS_CHANGE",
        description: `Etapa alterada de ${lead.stage} para ${newStage}`,
        authorId: user.id,
      },
    });
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "STATUS_CHANGE",
    entityType: "Lead",
    entityId: leadId,
    oldData: { stage: lead.stage },
    newData: { stage: newStage },
  });

  revalidatePath("/crm");
  revalidatePath(`/crm/${leadId}`);
}

const updateLeadSchema = z.object({
  temperature: z.enum(["QUENTE", "MORNO", "FRIO"]),
  potentialValue: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
  ownerId: z.string().min(1),
});

export async function updateLead(leadId: string, formData: FormData) {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: user.organizationId } });
  if (!lead) throw new Error("Lead nao encontrado.");
  if (!canManageLead(user, lead)) throw new Error("Sem permissao para editar este lead.");

  const parsed = updateLeadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos.");
  const data = parsed.data;

  if (data.ownerId !== lead.ownerId && !can(user, PERMISSIONS.CRM_MANAGE_ALL)) {
    throw new Error("Somente gestores podem reatribuir o responsavel.");
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      temperature: data.temperature,
      potentialValue: data.potentialValue,
      notes: data.notes || undefined,
      ownerId: data.ownerId,
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: data.ownerId !== lead.ownerId ? "ASSIGNEE_CHANGE" : "UPDATE",
    entityType: "Lead",
    entityId: leadId,
    oldData: { ownerId: lead.ownerId, temperature: lead.temperature },
    newData: { ownerId: data.ownerId, temperature: data.temperature },
  });

  revalidatePath(`/crm/${leadId}`);
}

const followUpSchema = z.object({
  scheduledAt: z.string().min(1, "Data obrigatoria"),
  type: z.enum(FOLLOW_UP_TYPES),
  notes: z.string().optional(),
});

export async function createFollowUp(leadId: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: user.organizationId } });
  if (!lead) return { error: "Lead nao encontrado." };
  if (!canManageLead(user, lead)) return { error: "Sem permissao." };

  const parsed = followUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  await prisma.followUp.create({
    data: {
      leadId,
      ownerId: lead.ownerId,
      scheduledAt: new Date(data.scheduledAt),
      type: data.type,
      notes: data.notes || undefined,
      status: "PENDENTE",
    },
  });

  await prisma.lead.update({ where: { id: leadId }, data: { nextContactAt: new Date(data.scheduledAt) } });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE",
    entityType: "FollowUp",
    entityId: leadId,
    newData: data,
  });

  revalidatePath(`/crm/${leadId}`);
  return { success: true };
}

const completeFollowUpSchema = z.object({
  completionNotes: z.string().optional(),
  nextScheduledAt: z.string().min(1, "Proxima acao obrigatoria"),
  nextType: z.enum(FOLLOW_UP_TYPES),
});

export async function completeFollowUp(
  followUpId: string,
  _prev: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const user = await requireUser();
  const followUp = await prisma.followUp.findUnique({ where: { id: followUpId }, include: { lead: true } });
  if (!followUp || followUp.lead.organizationId !== user.organizationId) return { error: "Follow-up nao encontrado." };
  if (!canManageLead(user, followUp.lead)) return { error: "Sem permissao." };

  const parsed = completeFollowUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.followUp.update({
      where: { id: followUpId },
      data: { status: "CONCLUIDO", completedAt: new Date(), notes: data.completionNotes || followUp.notes },
    });

    // Rule (section 11): a lead can never be left without a next action, so
    // completing one always schedules the next.
    await tx.followUp.create({
      data: {
        leadId: followUp.leadId,
        ownerId: followUp.ownerId,
        scheduledAt: new Date(data.nextScheduledAt),
        type: data.nextType,
        status: "PENDENTE",
      },
    });

    await tx.lead.update({
      where: { id: followUp.leadId },
      data: { lastContactAt: new Date(), nextContactAt: new Date(data.nextScheduledAt), alertLevel: "NONE" },
    });

    await tx.activity.create({
      data: {
        leadId: followUp.leadId,
        type: "NOTE",
        description: `Follow-up concluido (${followUp.type}).${data.completionNotes ? " " + data.completionNotes : ""}`,
        authorId: user.id,
      },
    });
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "UPDATE",
    entityType: "FollowUp",
    entityId: followUpId,
    newData: { status: "CONCLUIDO" },
  });

  revalidatePath(`/crm/${followUp.leadId}`);
  return { success: true };
}

export async function cancelFollowUp(followUpId: string) {
  const user = await requireUser();
  const followUp = await prisma.followUp.findUnique({ where: { id: followUpId }, include: { lead: true } });
  if (!followUp || followUp.lead.organizationId !== user.organizationId) throw new Error("Follow-up nao encontrado.");
  if (!canManageLead(user, followUp.lead)) throw new Error("Sem permissao.");

  await prisma.followUp.update({ where: { id: followUpId }, data: { status: "CANCELADO" } });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "UPDATE",
    entityType: "FollowUp",
    entityId: followUpId,
    newData: { status: "CANCELADO" },
  });

  revalidatePath(`/crm/${followUp.leadId}`);
}

export async function addLeadNote(leadId: string, note: string) {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: user.organizationId } });
  if (!lead) throw new Error("Lead nao encontrado.");
  if (!canManageLead(user, lead)) throw new Error("Sem permissao.");
  if (!note.trim()) return;

  await prisma.activity.create({
    data: { leadId, type: "NOTE", description: note.trim(), authorId: user.id },
  });

  revalidatePath(`/crm/${leadId}`);
}
