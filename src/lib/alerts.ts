import { prisma } from "@/lib/prisma";
import { CLOSED_STAGES } from "@/lib/crm";
import type { AlertLevel } from "@/generated/prisma/enums";

const DEFAULT_THRESHOLDS = { yellow: 48, red: 72 };

export async function getAlertThresholds(organizationId: string) {
  const setting = await prisma.systemSetting.findUnique({
    where: { organizationId_key: { organizationId, key: "lead_alert_thresholds_hours" } },
  });
  const value = setting?.value as { yellow?: number; red?: number } | undefined;
  return {
    yellow: value?.yellow ?? DEFAULT_THRESHOLDS.yellow,
    red: value?.red ?? DEFAULT_THRESHOLDS.red,
  };
}

export function computeAlertLevel(
  referenceDate: Date,
  thresholds: { yellow: number; red: number },
  now: Date = new Date()
): AlertLevel {
  const hoursSince = (now.getTime() - referenceDate.getTime()) / 3_600_000;
  if (hoursSince >= thresholds.red) return "RED";
  if (hoursSince >= thresholds.yellow) return "YELLOW";
  return "NONE";
}

/**
 * Section 11/23: a lead without follow-up for too long must alert its owner
 * (48h, configurable) and escalate to the manager/operations (72h,
 * configurable). This recomputes every open lead's alert level and, on a
 * level increase, writes the corresponding notifications. Idempotent:
 * re-running with no state change writes nothing. In production this should
 * run on a schedule (cron/queue); here it is invoked opportunistically from
 * the CRM and dashboard pages so alerts never depend on an external worker
 * being configured for the demo to function.
 */
export async function syncOrgLeadAlerts(organizationId: string) {
  const thresholds = await getAlertThresholds(organizationId);
  const now = new Date();

  const openLeads = await prisma.lead.findMany({
    where: { organizationId, deletedAt: null, stage: { notIn: CLOSED_STAGES } },
    select: {
      id: true,
      name: true,
      ownerId: true,
      lastContactAt: true,
      enteredAt: true,
      alertLevel: true,
      owner: { select: { id: true, departmentId: true, employee: { select: { managerId: true, manager: { select: { userId: true } } } } } },
    },
  });

  const operationsUsers = await prisma.user.findMany({
    where: { organizationId, status: "ACTIVE", role: { key: "OPERACOES" } },
    select: { id: true },
  });

  for (const lead of openLeads) {
    const reference = lead.lastContactAt ?? lead.enteredAt;
    const newLevel = computeAlertLevel(reference, thresholds, now);
    if (newLevel === lead.alertLevel) continue;

    await prisma.lead.update({ where: { id: lead.id }, data: { alertLevel: newLevel } });

    const escalated = rank(newLevel) > rank(lead.alertLevel);
    if (!escalated || newLevel === "NONE") continue;

    if (newLevel === "YELLOW") {
      await prisma.notification.create({
        data: {
          userId: lead.ownerId,
          type: "LEAD_NO_CONTACT",
          title: "Lead sem follow-up",
          body: `${lead.name} esta ha mais de ${thresholds.yellow}h sem follow-up.`,
          link: `/crm/${lead.id}`,
        },
      });
    } else if (newLevel === "RED") {
      const managerUserId = lead.owner.employee?.manager?.userId;
      const notifyUserIds = new Set<string>([lead.ownerId]);
      if (managerUserId) notifyUserIds.add(managerUserId);
      for (const op of operationsUsers) notifyUserIds.add(op.id);

      for (const userId of notifyUserIds) {
        await prisma.notification.create({
          data: {
            userId,
            type: "LEAD_NO_CONTACT",
            title: "Lead critico sem follow-up",
            body: `${lead.name} esta ha mais de ${thresholds.red}h sem follow-up. Acao urgente necessaria.`,
            link: `/crm/${lead.id}`,
          },
        });
      }
    }
  }
}

function rank(level: AlertLevel) {
  return level === "RED" ? 2 : level === "YELLOW" ? 1 : 0;
}
