import { getCurrentSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { InvoixyLogo } from "@/components/InvoixyLogo";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Clean Logo */}
        <div className="mb-6">
          <InvoixyLogo iconSize={36} />
        </div>

        {/* Centered Auth Card */}
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <LoginForm />
        </div>

        {/* Simple Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Invoixy &bull; GST Invoicing System
        </p>
      </div>
    </div>
  );
}
