"use client";

import { useState, useTransition } from "react";
import { deleteShopAction } from "@/app/actions/auth";
import { SectionCard } from "@/components/ui/SectionCard";

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
        setError(result.error || "Failed to delete store.");
      }
    });
  };

  return (
    <>
      <SectionCard
        title="Delete Store"
        description={`Permanently remove ${shopName} and all associated records`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-medium">
            Once deleted, this store and all of its invoices, customer presets, and products cannot be recovered.
          </p>

          <button
            type="button"
            disabled={!canDelete}
            onClick={() => {
              setConfirmInput("");
              setError(null);
              setIsOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Delete Store
          </button>
        </div>

        {!canDelete && (
          <p className="text-[11px] font-medium text-slate-400 border-t border-slate-100 pt-3">
            You cannot delete your only store. Add another store before removing this one.
          </p>
        )}
      </SectionCard>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Store
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {shopName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Warning Text */}
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete <strong className="text-slate-900">{shopName}</strong> and all of its invoices, customers, and products. This cannot be undone.
            </p>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            {/* Confirmation Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Type <strong className="text-slate-900">{shopName}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={shopName}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300 transition-all font-medium"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isMatched || isPending}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  isMatched && !isPending
                    ? "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98]"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                {isPending ? "Deleting..." : "Delete Store"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
