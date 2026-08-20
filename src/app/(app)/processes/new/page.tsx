import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NewProcessForm } from "./new-process-form";

export default async function NewProcessPage() {
  const user = await requirePermission([PERMISSIONS.PROCESSES_MANAGE]);

  const [departments, users] = await Promise.all([
    prisma.department.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Novo processo</h1>
      <NewProcessForm departments={departments} users={users} defaultOwnerId={user.id} />
    </div>
  );
}
