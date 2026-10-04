"use client";

import { saveInvoiceAction, updateInvoiceAction } from "@/app/actions/invoice";
import { saveDraftAction, clearDraftAction } from "@/app/actions/draft";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoicePreview } from "@/components/InvoicePreview";
import { AiInvoicePrompt } from "@/components/AiInvoicePrompt";
import { Button } from "@/components/ui/Button";
import { IconDocument, IconPrinter, IconRefresh } from "@/components/ui/icons";
import { createSampleInvoiceDraft, createEmptyInvoiceDraft } from "@/lib/defaults";
import { applyTaxModeFromStates, calculateInvoiceTotals } from "@/lib/gst";
import { formatMoney } from "@/lib/format";
import type {
  CustomerPreset,
  InvoiceDraft,
  ProductPreset,
  SellerProfile,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  seller: SellerProfile;
  initialDraft: InvoiceDraft;
  customers: CustomerPreset[];
  products: ProductPreset[];
  mode?: "create" | "edit";
  invoiceId?: number;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 1200;

export function InvoiceWorkspace({
  seller,
  initialDraft,
  customers,
  products,
  mode = "create",
  invoiceId,
}: Props) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [draft, setDraft] = useState<InvoiceDraft>(() =>
    applyTaxModeFromStates(initialDraft, seller),
  );
  const [isSaving, startSaving] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [previewMode, setPreviewMode] = useState<"fit" | "actual">("fit");

  const totals = useMemo(() => calculateInvoiceTotals(draft), [draft]);

  // ── Debounced auto-save to DB (create mode only) ─────────────────────────
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    // Skip the very first render (initial load)
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (isEditMode) return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      const result = await saveDraftAction(draft);
      setSaveStatus(result.ok ? "saved" : "error");
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function onLoadSample() {
    const sample = createSampleInvoiceDraft();
    setDraft(
      applyTaxModeFromStates(
        {
          ...sample,
          meta: {
            ...sample.meta,
            invoiceNumber: draft.meta.invoiceNumber,
          },
        },
        seller,
      ),
    );
    toast.info("Sample invoice loaded");
  }

  function onResetForm() {
    if (isEditMode) {
      setDraft(applyTaxModeFromStates(initialDraft, seller));
      toast.success("Invoice changes reset.");
    } else {
      setDraft(applyTaxModeFromStates(createEmptyInvoiceDraft(), seller));
      clearDraftAction().catch(() => null);
      setSaveStatus("idle");
      toast.success("Form reset and draft cleared.");
    }
  }

  function onPrintPreview() {
    window.setTimeout(() => window.print(), 50);
  }

  function onSaveInvoice() {
    startSaving(async () => {
      const result =
        isEditMode && invoiceId
          ? await updateInvoiceAction(invoiceId, draft)
          : await saveInvoiceAction(draft);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // Clear the DB draft after a successful save in create mode
      if (!isEditMode) {
        await clearDraftAction();
        setSaveStatus("idle");
      }
      toast.success(isEditMode ? "Invoice updated!" : "Invoice created successfully!");
      router.push(`/invoices/${result.id}`);
    });
  }

  // Save status label
  const statusLabel: Record<SaveStatus, string | null> = {
    idle: null,
    saving: "Saving draft…",
    saved: "Draft saved",
    error: "Draft save failed",
  };
  const statusColor: Record<SaveStatus, string> = {
    idle: "",
    saving: "text-zinc-400",
    saved: "text-emerald-600",
    error: "text-rose-500",
  };

  return (
    <div className="space-y-4">
      {/* Mobile Tab Switcher */}
      <div className="no-print xl:hidden flex rounded-xl bg-slate-200/60 p-1 shadow-xs border border-slate-200">
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-center text-sm font-semibold transition-all ${
            activeTab === "edit"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("edit")}
        >
          Edit Details
        </button>
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-center text-sm font-semibold transition-all ${
            activeTab === "preview"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("preview")}
        >
          Live Preview
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] xl:gap-8 2xl:grid-cols-[minmax(0,0.9fr)_minmax(620px,1.1fr)]">
        <div className={`no-print min-w-0 space-y-4 ${activeTab === "edit" ? "block" : "hidden xl:block"}`}>
          <div className="no-print sticky top-0 z-20 -mx-4 flex items-center gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 xl:static xl:mx-0 xl:bg-transparent xl:px-0 xl:pb-4 xl:pt-0 xl:backdrop-blur-none">
            <Button
              variant="primary"
              onClick={onSaveInvoice}
              disabled={isSaving}
              className="flex-1 sm:flex-none justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap"
            >
              <IconDocument className="h-4 w-4 shrink-0" />
              <span>
                {isSaving
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                    ? "Update invoice"
                    : "Save invoice"}
              </span>
            </Button>

            <Button
              variant="secondary"
              onClick={onPrintPreview}
              className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              <IconPrinter className="h-4 w-4 shrink-0" />
              <span>Print / PDF</span>
            </Button>

            <Button
              variant="ghost"
              onClick={onResetForm}
              className="shrink-0 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-500 hover:text-slate-900 border border-slate-200/80 sm:border-transparent rounded-xl"
              title="Reset form"
              aria-label="Reset form"
            >
              <IconRefresh className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Reset</span>
            </Button>

            {/* Draft auto-save status (create mode only) */}
            {!isEditMode && saveStatus !== "idle" && (
              <span
                className={`hidden md:flex ml-auto items-center gap-1.5 text-xs font-medium ${statusColor[saveStatus]}`}
                role="status"
                aria-live="polite"
              >
                {saveStatus === "saving" && (
                  <svg
                    className="h-3 w-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                )}
                {saveStatus === "saved" && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {statusLabel[saveStatus]}
              </span>
            )}
          </div>
 
          {!isEditMode && (
            <AiInvoicePrompt
              onApply={(aiData) => {
                setDraft((prev) =>
                  applyTaxModeFromStates(
                    {
                      ...prev,
                      buyer: {
                        ...prev.buyer,
                        ...aiData.buyer,
                      },
                      lines: aiData.lines.length > 0 ? aiData.lines : prev.lines,
                    },
                    seller,
                  ),
                );
              }}
            />
          )}

          <InvoiceForm
            seller={seller}
            draft={draft}
            onChange={setDraft}
            onLoadSample={onLoadSample}
            showSampleAction={!isEditMode}
            invoiceNumberReadOnly
            customers={customers}
            products={products}
          />

          <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live invoice totals
            </p>
            <dl className="mt-3.5 grid gap-2.5 text-xs sm:grid-cols-2">
              <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
                <dt className="font-medium text-slate-500">Subtotal</dt>
                <dd className="font-bold tabular-nums text-slate-800">
                  {formatMoney(totals.subtotal)}
                </dd>
              </div>
              {draft.taxMode === "intra" ? (
                <>
                  <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
                    <dt className="font-medium text-slate-500">CGST ({totals.cgstRate}%)</dt>
                    <dd className="font-bold tabular-nums text-slate-800">
                      {formatMoney(totals.cgstAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
                    <dt className="font-medium text-slate-500">SGST ({totals.sgstRate}%)</dt>
                    <dd className="font-bold tabular-nums text-slate-800">
                      {formatMoney(totals.sgstAmount)}
                    </dd>
                  </div>
                </>
              ) : (
                <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
                  <dt className="font-medium text-slate-500">IGST ({totals.igstRate}%)</dt>
                  <dd className="font-bold tabular-nums text-slate-800">
                    {formatMoney(totals.igstAmount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
                <dt className="font-medium text-slate-500">Round off</dt>
                <dd className="font-bold tabular-nums text-slate-800">
                  {formatMoney(totals.roundOff)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between sm:border-t sm:pt-3">
                <dt className="text-sm font-extrabold text-slate-900">Grand Total</dt>
                <dd className="text-xl font-black tabular-nums text-slate-950">
                  {formatMoney(totals.grandTotal)}
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className={`min-w-0 xl:sticky xl:top-20 xl:self-start ${activeTab === "preview" ? "block" : "hidden xl:block"}`}>
          <div className="no-print mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Invoice preview</h2>
              <p className="text-xs text-slate-500">A4 print surface, updates live</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700 shadow-2xs">
                {formatMoney(totals.grandTotal)}
              </span>
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                {(["fit", "actual"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPreviewMode(option)}
                    className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                      previewMode === option
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {option === "fit" ? "Fit" : "100%"}
                  </button>
                ))}
              </div>
              <Button
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                onClick={onPrintPreview}
              >
                <IconPrinter className="h-3.5 w-3.5" />
                Print
              </Button>
            </div>
          </div>
          <div
            id="invoice-print-surface"
            className="max-h-[calc(100vh-6rem)] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner sm:p-5"
          >
            <InvoicePreview
              seller={seller}
              draft={draft}
              totals={totals}
              logoUrl={seller.logoDataUrl}
              previewMode={previewMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
