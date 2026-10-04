import { checkSecuritySetup, getCurrentSession } from "@/app/actions/auth";
import { AutoLockSettingsForm } from "@/components/AutoLockSettingsForm";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const securityInfo = await checkSecuritySetup();
  const session = await getCurrentSession();

  const displayName = session?.name || "Account User";
  const userEmail = session?.email || "Signed in with Google";
  const initials = (session?.name || session?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="pb-16 max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <header className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Security
        </h1>
      </header>

      {/* Account Info & Sign Out */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {session?.avatarUrl ? (
              <img
                src={session.avatarUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {initials}
              </div>
            )}
            <div>
              <p className="text-base font-bold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500 font-medium">{userEmail}</p>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              const { logout } = await import("@/app/actions/auth");
              await logout();
            }}
          >
            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Auto-Lock Settings */}
      <AutoLockSettingsForm initialMinutes={securityInfo.autoLockMinutes ?? 15} />

      {/* Data Backups */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Data Backups</h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Export your sales data or download a full database snapshot.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href="/api/export"
            download="gst_invoices_export.csv"
            className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300 transition-all group"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Export Invoices (CSV)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Spreadsheet-ready summary for accounts
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 group-hover:text-indigo-600 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </span>
          </a>

          <a
            href="/api/backup"
            download="invoixy-database.db"
            className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300 transition-all group"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Database Backup (.db)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete SQLite archive
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 group-hover:text-indigo-600 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
