import { requirePermission } from "@/lib/authz";
import { PERMISSIONS, PERMISSION_CATALOG } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getAlertThresholds } from "@/lib/alerts";
import { ThresholdForm } from "./threshold-form";
import { DepartmentForm } from "./department-form";
import { UserForm } from "./user-form";
import { PermissionMatrix } from "./permission-matrix";
import { UserStatusToggle } from "./user-status-toggle";

export default async function SettingsPage() {
  const user = await requirePermission([PERMISSIONS.SETTINGS_MANAGE]);

  const [thresholds, departments, roles, users, rolePermissions] = await Promise.all([
    getAlertThresholds(user.organizationId),
    prisma.department.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
    prisma.role.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      include: { role: { select: { name: true } }, department: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.rolePermission.findMany({ where: { role: { organizationId: user.organizationId } } }),
  ]);

  const grantedPairs = new Set(rolePermissions.map((rp) => `${rp.roleId}:${rp.permissionId}`));
  const permissions = await prisma.permission.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Configuracoes</h1>
        <p className="text-sm text-slate-500">Painel administrativo</p>
      </div>

      <Section title="Alertas de CRM">
        <p className="mb-3 text-xs text-slate-500">
          Horas sem follow-up para gerar alerta amarelo e vermelho em um lead (secao 11).
        </p>
        <ThresholdForm yellow={thresholds.yellow} red={thresholds.red} />
      </Section>

      <Section title="Setores">
        <div className="mb-3 flex flex-wrap gap-2">
          {departments.map((d) => (
            <span key={d.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {d.name}
            </span>
          ))}
        </div>
        <DepartmentForm />
      </Section>

      <Section title="Usuarios">
        <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Nome</th>
                <th className="px-4 py-2.5">E-mail</th>
                <th className="px-4 py-2.5">Cargo</th>
                <th className="px-4 py-2.5">Setor</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 text-slate-800">{u.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.role.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{u.department?.name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <UserStatusToggle userId={u.id} active={u.status === "ACTIVE"} isSelf={u.id === user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-medium text-slate-700">+ Novo usuario</summary>
          <div className="mt-4">
            <UserForm roles={roles} departments={departments} />
          </div>
        </details>
      </Section>

      <Section title="Permissoes por cargo">
        <PermissionMatrix
          roles={roles}
          permissionsCatalog={PERMISSION_CATALOG.map((p) => permissions.find((db) => db.code === p.code)!).filter(Boolean)}
          grantedPairs={Array.from(grantedPairs)}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}
