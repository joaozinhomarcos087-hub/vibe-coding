import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NewLeadForm } from "./new-lead-form";

export default async function NewLeadPage() {
  const user = await requirePermission([PERMISSIONS.CRM_MANAGE_ALL, PERMISSIONS.CRM_MANAGE_OWN]);

  const owners = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      status: "ACTIVE",
      role: { key: { in: ["SDR", "CLOSER", "GESTOR_COMERCIAL", "DIRETOR"] } },
    },
    select: { id: true, name: true, role: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Novo lead</h1>
      <p className="mb-6 text-sm text-slate-500">
        Todo lead precisa de um responsavel e de uma proxima acao agendada.
      </p>
      <NewLeadForm owners={owners} defaultOwnerId={user.id} />
    </div>
  );
}
