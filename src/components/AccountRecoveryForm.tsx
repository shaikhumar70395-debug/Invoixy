"use client";

import { useState } from "react";
import { generateRecoveryCode } from "@/app/actions/auth";
import { toast } from "sonner";

export function AccountRecoveryForm({ hasRecoveryCode }: { hasRecoveryCode: boolean }) {
  const [isPending, setIsPending] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (hasRecoveryCode && !confirm("Generating a new code will invalidate your existing one. Are you sure?")) {
      return;
    }
    
    setIsPending(true);
    const res = await generateRecoveryCode();
    setIsPending(false);
    
    if (res?.error) {
      toast.error(res.error);
    } else if (res?.code) {
      setNewCode(res.code);
      toast.success("New recovery code generated!");
    }
  };

  const copyToClipboard = () => {
    if (newCode) {
      navigator.clipboard.writeText(newCode);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/50 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-zinc-900">
        <svg className="h-5 w-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <h3 className="font-semibold text-zinc-900">Account Recovery</h3>
      </div>
      
      {!newCode ? (
        <>
          <p className="mb-4 text-sm text-zinc-600">
            {hasRecoveryCode 
              ? "You have a recovery code set up. If you forgot it, you can generate a new one." 
              : "Generate a one-time recovery code in case you forget your PIN or Password."}
          </p>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-50"
          >
            {isPending ? "Generating..." : hasRecoveryCode ? "Regenerate Code" : "Generate Recovery Code"}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-amber-900">Save this code now</h4>
            <p className="text-xs text-amber-800">
              This code will only be shown once. Please copy it and save it in a secure location.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-4 py-3 font-mono text-lg font-bold tracking-widest text-zinc-900 shadow-sm border border-amber-100">
              <span>{newCode}</span>
              <button 
                onClick={copyToClipboard}
                className="rounded p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
                title="Copy to clipboard"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          <button
            onClick={() => setNewCode(null)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50"
          >
            I have saved it
          </button>
        </div>
      )}
    </div>
  );
}
