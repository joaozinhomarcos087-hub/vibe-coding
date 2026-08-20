"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createGoal } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900";
const labelClass = "block text-xs font-medium text-slate-500";

export function NewGoalForm({
  departments,
  roles,
  employees,
}: {
  departments: { id: string; name: string }[];
  roles: { id: string; name: string }[];
  employees: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createGoal, {});
  const [scope, setScope] = useState("COMPANY");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className={labelClass}>Nome *</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Escopo *</label>
        <select name="scope" required value={scope} onChange={(e) => setScope(e.target.value)} className={inputClass}>
          <option value="COMPANY">Empresa</option>
          <option value="DEPARTMENT">Setor</option>
          <option value="ROLE">Cargo</option>
          <option value="EMPLOYEE">Funcionario</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Periodo *</label>
        <select name="period" required defaultValue="MONTHLY" className={inputClass}>
          <option value="DAILY">Diaria</option>
          <option value="WEEKLY">Semanal</option>
          <option value="MONTHLY">Mensal</option>
          <option value="QUARTERLY">Trimestral</option>
        </select>
      </div>
      {scope === "DEPARTMENT" && (
        <div className="col-span-2">
          <label className={labelClass}>Setor *</label>
          <select name="departmentId" required className={inputClass}>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {scope === "ROLE" && (
        <div className="col-span-2">
          <label className={labelClass}>Cargo *</label>
          <select name="roleId" required className={inputClass}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {scope === "EMPLOYEE" && (
        <div className="col-span-2">
          <label className={labelClass}>Funcionario *</label>
          <select name="employeeId" required className={inputClass}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className={labelClass}>Meta (valor) *</label>
        <input name="targetValue" type="number" step="0.01" required className={inputClass} />
      </div>
      <div />
      <div>
        <label className={labelClass}>Inicio *</label>
        <input name="startDate" type="date" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Fim *</label>
        <input name="endDate" type="date" required className={inputClass} />
      </div>
      {state?.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="col-span-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar meta"}
      </button>
    </form>
  );
}
