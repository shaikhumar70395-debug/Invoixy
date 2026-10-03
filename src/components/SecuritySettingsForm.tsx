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
      } else {
        setMessage({ type: "success", text: "Security settings updated successfully." });
        (event.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-xl p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-900">
            Authentication Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                authType === "PIN"
                  ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-600/20"
                  : "border-zinc-200 hover:border-zinc-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="authTypeSelection"
                  value="PIN"
                  checked={authType === "PIN"}
                  onChange={() => setAuthType("PIN")}
                  className="h-4 w-4 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-900">6-Digit PIN</div>
                  <div className="text-xs text-zinc-500">Quick numeric keypad login</div>
                </div>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                authType === "PASSWORD"
                  ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-600/20"
                  : "border-zinc-200 hover:border-zinc-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="authTypeSelection"
                  value="PASSWORD"
                  checked={authType === "PASSWORD"}
                  onChange={() => setAuthType("PASSWORD")}
                  className="h-4 w-4 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Password</div>
                  <div className="text-xs text-zinc-500">Alphanumeric text password</div>
                </div>
              </div>
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
