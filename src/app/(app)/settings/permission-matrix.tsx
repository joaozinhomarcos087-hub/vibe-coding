"use client";

import { useState, useTransition } from "react";
import { toggleRolePermission } from "./actions";
import { cn } from "@/lib/utils";

type Role = { id: string; name: string };
type Permission = { id: string; code: string; module: string; description: string | null };

export function PermissionMatrix({
  roles,
  permissionsCatalog,
  grantedPairs,
}: {
  roles: Role[];
  permissionsCatalog: Permission[];
  grantedPairs: string[];
}) {
  const [granted, setGranted] = useState(new Set(grantedPairs));
  const [, startTransition] = useTransition();

  const modules = Array.from(new Set(permissionsCatalog.map((p) => p.module)));

  function toggle(roleId: string, permissionId: string) {
    const key = `${roleId}:${permissionId}`;
    const nextGranted = !granted.has(key);
    setGranted((prev) => {
      const next = new Set(prev);
      if (nextGranted) next.add(key);
      else next.delete(key);
      return next;
    });
    startTransition(() => {
      toggleRolePermission(roleId, permissionId, nextGranted).catch(() => {
        setGranted((prev) => {
          const next = new Set(prev);
          if (nextGranted) next.delete(key);
          else next.add(key);
          return next;
        });
      });
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white px-2 py-2 text-slate-500">Permissao</th>
            {roles.map((r) => (
              <th key={r.id} className="px-2 py-2 text-center font-medium text-slate-600" style={{ minWidth: 90 }}>
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((mod) => (
            <FragmentModule key={mod} module={mod}>
              {permissionsCatalog
                .filter((p) => p.module === mod)
                .map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="sticky left-0 bg-white px-2 py-1.5 text-slate-600">{p.code}</td>
                    {roles.map((r) => {
                      const key = `${r.id}:${p.id}`;
                      const checked = granted.has(key);
                      return (
                        <td key={r.id} className="px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(r.id, p.id)}
                            className={cn("h-3.5 w-3.5 rounded border-slate-300")}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </FragmentModule>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FragmentModule({ module, children }: { module: string; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={100} className="bg-slate-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {module}
        </td>
      </tr>
      {children}
    </>
  );
}
