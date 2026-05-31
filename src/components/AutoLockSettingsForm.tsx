"use client";

import { useState } from "react";
import { updateAutoLock } from "@/app/actions/auth";
import { toast } from "sonner";

export function AutoLockSettingsForm({ initialMinutes }: { initialMinutes: number }) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [isPending, setIsPending] = useState(false);

  const handleUpdate = async (newMinutes: number) => {
    setMinutes(newMinutes);
    setIsPending(true);
    const res = await updateAutoLock(newMinutes);
    setIsPending(false);
    
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Auto-lock settings updated!");
    }
  };

  const options = [
    { value: 5, label: "5 minutes" },
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 0, label: "Never" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/50 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-violet-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="font-semibold text-zinc-900">Auto-Lock Settings</h3>
      </div>
      <p className="mb-4 text-sm text-zinc-600">Automatically lock the dashboard after a period of inactivity.</p>
      
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.value} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${minutes === opt.value ? "border-violet-500 bg-violet-50/50" : "border-zinc-200 hover:border-zinc-300"}`}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="autolock"
                value={opt.value}
                checked={minutes === opt.value}
                onChange={() => handleUpdate(opt.value)}
                disabled={isPending}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-zinc-300"
              />
              <span className={`text-sm font-medium ${minutes === opt.value ? "text-violet-900" : "text-zinc-700"}`}>
                {opt.label}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
