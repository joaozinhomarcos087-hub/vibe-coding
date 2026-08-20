import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { marketingTaskWhereForUser, MARKETING_STATUS_ORDER, MARKETING_STATUS_LABELS } from "@/lib/marketing";
import { MarketingBoard } from "./marketing-board";

export default async function MarketingPage() {
  const user = await requirePermission([PERMISSIONS.MARKETING_VIEW_ALL, PERMISSIONS.MARKETING_VIEW_OWN]);

  const tasks = await prisma.marketingTask.findMany({
    where: marketingTaskWhereForUser(user),
    include: { assignee: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const cards = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    priority: t.priority,
    status: t.status,
    assigneeName: t.assignee.name,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }));

  const columns = MARKETING_STATUS_ORDER.map((status) => ({
    status,
    label: MARKETING_STATUS_LABELS[status],
    cards: cards.filter((c) => c.status === status),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Marketing</h1>
          <p className="text-sm text-slate-500">{tasks.length} demanda(s) visiveis para voce</p>
        </div>
        <Link
          href="/marketing/new"
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Nova demanda
        </Link>
      </div>
      <MarketingBoard columns={columns} />
    </div>
  );
}
