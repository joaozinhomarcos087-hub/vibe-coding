import { requirePermission, can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { EmployeeRow } from "./employee-row";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "Ativo", ON_LEAVE: "Afastado", TERMINATED: "Desligado" };

export default async function EmployeesPage() {
  const user = await requirePermission([PERMISSIONS.EMPLOYEES_VIEW]);
  const manage = can(user, PERMISSIONS.EMPLOYEES_MANAGE);

  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where: { user: { organizationId: user.organizationId } },
      include: {
        user: { select: { name: true, email: true, role: { select: { name: true } } } },
        department: { select: { name: true } },
        manager: { select: { user: { select: { name: true } } } },
      },
      orderBy: { hireDate: "asc" },
    }),
    prisma.department.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  const managerOptions = employees.map((e) => ({ id: e.id, name: e.user.name }));

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">Funcionarios</h1>
        <p className="text-sm text-slate-500">{employees.length} funcionario(s)</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Nome</th>
              <th className="px-4 py-2.5">Cargo</th>
              <th className="px-4 py-2.5">Setor</th>
              <th className="px-4 py-2.5">Gestor</th>
              <th className="px-4 py-2.5">Admissao</th>
              <th className="px-4 py-2.5">Status</th>
              {manage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <EmployeeRow
                key={e.id}
                id={e.id}
                name={e.user.name}
                email={e.user.email}
                jobTitle={e.jobTitle}
                departmentName={e.department?.name ?? null}
                departmentId={e.departmentId}
                managerName={e.manager?.user.name ?? null}
                managerId={e.managerId}
                hireDate={e.hireDate.toISOString()}
                status={e.status}
                statusLabel={STATUS_LABELS[e.status]}
                departments={departments}
                managerOptions={managerOptions.filter((m) => m.id !== e.id)}
                manage={manage}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
