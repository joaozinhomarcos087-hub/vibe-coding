"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "./actions";

const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm";
const labelClass = "block text-xs font-medium text-slate-500";

export function UserForm({
  roles,
  departments,
}: {
  roles: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createUser, {});
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
      <div>
        <label className={labelClass}>Nome *</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>E-mail *</label>
        <input name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Senha inicial *</label>
        <input name="password" type="password" required minLength={8} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Titulo do cargo *</label>
        <input name="jobTitle" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Cargo (permissoes) *</label>
        <select name="roleId" required className={inputClass}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Setor</label>
        <select name="departmentId" className={inputClass}>
          <option value="">Sem setor</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      {state?.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="col-span-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar usuario"}
      </button>
    </form>
  );
}
