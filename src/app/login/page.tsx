import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold text-lg">
            O
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Operacional SaaS</h1>
          <p className="mt-1 text-sm text-slate-500">Gestao operacional, comercial e marketing</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Demo: diretor@empresademo.com / Demo@1234
        </p>
      </div>
    </div>
  );
}
