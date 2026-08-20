"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEmployee } from "./actions";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "ON_LEAVE", label: "Afastado" },
  { value: "TERMINATED", label: "Desligado" },
];

export function EmployeeRow({
  id,
  name,
  email,
  jobTitle,
  departmentName,
  departmentId,
  managerName,
  managerId,
  hireDate,
  status,
  statusLabel,
  departments,
  managerOptions,
  manage,
}: {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  departmentName: string | null;
  departmentId: string | null;
  managerName: string | null;
  managerId: string | null;
  hireDate: string;
  status: string;
  statusLabel: string;
  departments: { id: string; name: string }[];
  managerOptions: { id: string; name: string }[];
  manage: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!editing) {
    return (
      <tr className="border-b border-slate-100 last:border-0">
        <td className="px-4 py-2.5">
          <p className="font-medium text-slate-800">{name}</p>
          <p className="text-xs text-slate-400">{email}</p>
        </td>
        <td className="px-4 py-2.5 text-slate-600">{jobTitle}</td>
        <td className="px-4 py-2.5 text-slate-600">{departmentName ?? "—"}</td>
        <td className="px-4 py-2.5 text-slate-600">{managerName ?? "—"}</td>
        <td className="px-4 py-2.5 text-slate-500">{new Date(hireDate).toLocaleDateString("pt-BR")}</td>
        <td className="px-4 py-2.5">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{statusLabel}</span>
        </td>
        {manage && (
          <td className="px-4 py-2.5">
            <button onClick={() => setEditing(true)} className="text-xs font-medium text-slate-500 hover:text-slate-900">
              Editar
            </button>
          </td>
        )}
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 bg-slate-50 last:border-0">
      <td className="px-4 py-2.5" colSpan={manage ? 7 : 6}>
        <form
          action={(formData) => {
            startTransition(async () => {
              await updateEmployee(id, formData);
              setEditing(false);
              router.refresh();
            });
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <span className="text-sm font-medium text-slate-800">{name}</span>
          <select name="departmentId" defaultValue={departmentId ?? ""} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
            <option value="">Sem setor</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select name="managerId" defaultValue={managerId ?? ""} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
            <option value="">Sem gestor</option>
            {managerOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Salvar
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-800">
            Cancelar
          </button>
        </form>
      </td>
    </tr>
  );
}
