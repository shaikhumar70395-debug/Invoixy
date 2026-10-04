"use client";

import { useState, useTransition } from "react";
import { deleteShopAction } from "@/app/actions/auth";

type Props = {
  shopId: string;
  shopName: string;
  canDelete: boolean;
};

export function DeleteShopCard({ shopId, shopName, canDelete }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMatched = confirmInput.trim() === shopName.trim();

  const handleDelete = () => {
    if (!isMatched) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteShopAction(shopId, confirmInput.trim());
      if (result.success) {
        window.location.href = "/";
      } else {
        setError(result.error || "Failed to delete business.");
      }
    });
  };

  return (
    <>
      <div className="rounded-2xl border border-rose-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-base font-bold text-slate-900">Delete Business</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xl">
              Permanently remove <strong className="text-slate-800">{shopName}</strong> along with all of its issued invoices, customer contacts, and product inventory.
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={!canDelete}
              onClick={() => {
                setConfirmInput("");
                setError(null);
                setIsOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-2xs"
            >
              Delete this Business
            </button>
          </div>
        </div>

        {!canDelete && (
          <p className="mt-3 text-[11px] font-medium text-slate-400 border-t border-slate-100 pt-3">
            ℹ️ You cannot delete your only business. Create or switch to another business before deleting this one.
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Delete Business
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                    {shopName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Warning Text */}
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-800 leading-relaxed">
              <p className="font-bold mb-1">Warning: This cannot be undone.</p>
              <p>
                All invoices, customer records, and products associated with <strong className="underline">{shopName}</strong> will be permanently wiped.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Please type <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{shopName}</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={shopName}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isMatched || isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isPending ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Deleting Business...</span>
                  </>
                ) : (
                  <span>I understand the consequences, delete this business</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
