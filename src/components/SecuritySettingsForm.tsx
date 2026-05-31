"use client";

import { useState, useTransition } from "react";
import { updateSecurity } from "@/app/actions/auth";

export function SecuritySettingsForm({ currentAuthType }: { currentAuthType: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [authType, setAuthType] = useState(currentAuthType || "PIN");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    formData.set("newAuthType", authType);

    startTransition(async () => {
      const res = await updateSecurity(formData);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else if (res?.success) {
        setMessage({ type: "success", text: res.success });
        (event.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 sm:p-8 shadow-xl shadow-zinc-200/40 backdrop-blur-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Access Credentials</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div className={`rounded-md p-4 text-sm border ${message.type === "error" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-700 border-green-100"}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <label className="text-sm font-semibold text-zinc-900">Authentication Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:border-violet-300 ${authType === "PIN" ? "border-violet-600 bg-violet-50/50 ring-1 ring-violet-600" : "border-zinc-200 bg-white"}`}>
              <input type="radio" name="authTypeToggle" value="PIN" checked={authType === "PIN"} onChange={() => setAuthType("PIN")} className="sr-only" />
              <div className="flex flex-col">
                <span className={`block text-sm font-semibold ${authType === "PIN" ? "text-violet-900" : "text-zinc-900"}`}>Numeric PIN</span>
                <span className={`block text-xs mt-1 ${authType === "PIN" ? "text-violet-700" : "text-zinc-500"}`}>6-digit code for quick access</span>
              </div>
              {authType === "PIN" && (
                <div className="absolute right-4 top-4 text-violet-600">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
            <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:border-violet-300 ${authType === "PASSWORD" ? "border-violet-600 bg-violet-50/50 ring-1 ring-violet-600" : "border-zinc-200 bg-white"}`}>
              <input type="radio" name="authTypeToggle" value="PASSWORD" checked={authType === "PASSWORD"} onChange={() => setAuthType("PASSWORD")} className="sr-only" />
              <div className="flex flex-col">
                <span className={`block text-sm font-semibold ${authType === "PASSWORD" ? "text-violet-900" : "text-zinc-900"}`}>Text Password</span>
                <span className={`block text-xs mt-1 ${authType === "PASSWORD" ? "text-violet-700" : "text-zinc-500"}`}>Strong alphanumeric password</span>
              </div>
              {authType === "PASSWORD" && (
                <div className="absolute right-4 top-4 text-violet-600">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="currentCredential" className="text-sm font-semibold text-zinc-900">
            Confirm Existing {currentAuthType === "PIN" ? "6-Digit PIN" : "Password"}
          </label>
          <input
            id="currentCredential"
            name="currentCredential"
            type="password"
            inputMode={currentAuthType === "PIN" ? "numeric" : "text"}
            maxLength={currentAuthType === "PIN" ? 6 : undefined}
            pattern={currentAuthType === "PIN" ? "\\d{6}" : undefined}
            title={currentAuthType === "PIN" ? "PIN must be exactly 6 digits" : undefined}
            required
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-4 py-3 tracking-widest text-zinc-900 shadow-sm transition-all focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="newCredential" className="text-sm font-semibold text-zinc-900">
            Set New {authType === "PIN" ? "6-Digit PIN" : "Password"}
          </label>
          <input
            id="newCredential"
            name="newCredential"
            type="password"
            inputMode={authType === "PIN" ? "numeric" : "text"}
            maxLength={authType === "PIN" ? 6 : undefined}
            pattern={authType === "PIN" ? "\\d{6}" : undefined}
            title={authType === "PIN" ? "PIN must be exactly 6 digits" : undefined}
            required
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-4 py-3 tracking-widest text-zinc-900 shadow-sm transition-all focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-70 transition-all active:scale-[0.98] mt-2"
        >
          {isPending ? "Updating Security..." : "Update Security Settings"}
        </button>
      </form>
    </div>
  );
}
