"use client";

import {
  deleteInvoiceAction,
  updateInvoicePaymentAction,
} from "@/app/actions/invoice";
import { InvoicePreview } from "@/components/InvoicePreview";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { IconDocument, IconPrinter, IconTrash } from "@/components/ui/icons";
import { formatMoney, formatDateDisplay } from "@/lib/format";
import type { InvoiceDraft, InvoiceTotals, SellerProfile, PaymentStatus } from "@/lib/types";
import { WhatsAppShareModal } from "@/components/WhatsAppShareModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  id: number;
  seller: SellerProfile;
  draft: InvoiceDraft;
  totals: InvoiceTotals;
  initialPayment: {
    paymentStatus: PaymentStatus;
    paidAmount: number;
    paymentDate: string;
    paymentMethod: string;
    paymentNotes: string;
  };
};

const statusColors: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "part-paid": "bg-amber-50 text-amber-700 border-amber-200",
  unpaid: "bg-rose-50 text-rose-700 border-rose-200",
};

const paymentOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: "unpaid", label: "Unpaid" },
  { value: "part-paid", label: "Part-paid" },
  { value: "paid", label: "Paid" },
];

export function SavedInvoiceView({ id, seller, draft, totals, initialPayment }: Props) {
  const router = useRouter();
  const [payment, setPayment] = useState(initialPayment);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialPayment);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  function onPrint() {
    window.setTimeout(() => window.print(), 50);
  }

  function handleFormChange<K extends keyof typeof initialPayment>(
    key: K,
    value: typeof initialPayment[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-set paid amount if paid
      if (key === "paymentStatus" && value === "paid") {
        next.paidAmount = totals.grandTotal;
      } else if (key === "paymentStatus" && value === "unpaid") {
        next.paidAmount = 0;
      }
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Updating payment tracking...");
    startTransition(async () => {
      const result = await updateInvoicePaymentAction(id, form);
      if (result.ok) {
        setPayment(form);
        setIsEditing(false);
        setMessage("Payment details successfully updated.");
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });
  }

  function onDeleteInvoice() {
    const ok = window.confirm(
      "Delete this invoice permanently? This cannot be undone.",
    );
    if (!ok) return;
    setMessage("Deleting invoice...");
    startDeleting(async () => {
      const result = await deleteInvoiceAction(id);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      router.push("/invoices");
      router.refresh();
    });
  }

  const outstanding = Math.max(0, totals.grandTotal - payment.paidAmount);
  const todayIso = new Date().toISOString().slice(0, 10);
  const isOverdue =
    payment.paymentStatus !== "paid" &&
    !!draft.meta.dueDate &&
    draft.meta.dueDate < todayIso;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and invoice action buttons */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl tabular-nums">
              {draft.meta.invoiceNumber}
            </h1>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-rose-700 animate-pulse">
                Overdue
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
            <span>{draft.buyer.name || "Saved invoice"} · <strong className="text-slate-900 font-bold tabular-nums">{formatMoney(totals.grandTotal)}</strong></span>
            {draft.meta.dueDate && (
              <span className={`text-xs font-semibold ${
                isOverdue ? "text-rose-600" : "text-slate-400"
              }`}>
                Due {formatDateDisplay(draft.meta.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          <WhatsAppShareModal
            invoiceNumber={draft.meta.invoiceNumber}
            invoiceDate={draft.meta.invoiceDate}
            customerName={draft.buyer.name}
            grandTotal={totals.grandTotal}
            outstanding={outstanding}
            dueDate={draft.meta.dueDate}
            sellerName={seller.companyName}
            bankName={seller.bankName}
            bankAccountNo={seller.bankAccountNo}
            bankIfsc={seller.bankIfsc}
            className="col-span-2 sm:col-span-1"
          />
          <a
            href={`/api/invoices/${id}/pdf`}
            download
            className="col-span-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition-all duration-150 hover:bg-slate-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
          >
            <IconDocument />
            Download PDF
          </a>
          <Button type="button" variant="secondary" onClick={onPrint} className="col-span-1">
            <IconPrinter />
            Print / PDF
          </Button>
          <Link
            href={`/invoices/${id}/edit`}
            className="col-span-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <IconDocument />
            Edit
          </Link>
          <Link
            href={`/invoices/new?duplicate=${id}`}
            className="col-span-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <IconDocument />
            Duplicate
          </Link>
          <Button
            type="button"
            variant="danger"
            onClick={onDeleteInvoice}
            disabled={isDeleting}
            className="col-span-2 mt-1 sm:col-span-1 sm:ml-2 sm:mt-0"
          >
            <IconTrash />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Payment Tracker Section */}
      <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">Payment Tracker</h3>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[payment.paymentStatus]}`}>
              {payment.paymentStatus}
            </span>
          </div>
          <Button
            variant="secondary"
            className="px-3 py-1 text-xs"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Update Details"}
          </Button>
        </div>

        {!isEditing ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Grand Total
              </p>
              <p className="mt-1 text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                {formatMoney(totals.grandTotal)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Amount Paid
              </p>
              <p className="mt-1 text-lg sm:text-xl font-black text-emerald-600 tabular-nums">
                {formatMoney(payment.paidAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Outstanding Balance
              </p>
              <p className={`mt-1 text-lg sm:text-xl font-black tabular-nums ${outstanding > 0 ? "text-rose-600" : "text-slate-500"}`}>
                {formatMoney(outstanding)}
              </p>
            </div>

            {payment.paymentDate || payment.paymentMethod || payment.paymentNotes ? (
              <div className="sm:col-span-3 text-xs text-slate-600 space-y-1.5 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 font-medium">
                {payment.paymentDate ? (
                  <p>
                    <span className="font-semibold text-slate-400">Payment Date:</span> {payment.paymentDate}
                  </p>
                ) : null}
                {payment.paymentMethod ? (
                  <p>
                    <span className="font-semibold text-slate-400">Payment Method:</span> {payment.paymentMethod}
                  </p>
                ) : null}
                {payment.paymentNotes ? (
                  <p>
                    <span className="font-semibold text-slate-400">Payment Notes:</span> {payment.paymentNotes}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Payment Status
              </p>
              <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                {paymentOptions.map((option) => {
                  const active = form.paymentStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFormChange("paymentStatus", option.value)}
                      className={`min-h-10 rounded-lg px-2 text-sm font-semibold transition-all ${
                        active
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Paid Amount">
              <TextInput
                type="number"
                min={0}
                max={totals.grandTotal}
                step="any"
                value={form.paidAmount || ""}
                onChange={(e) => handleFormChange("paidAmount", parseFloat(e.target.value) || 0)}
                disabled={form.paymentStatus === "unpaid" || form.paymentStatus === "paid"}
                className={form.paymentStatus !== "part-paid" ? "bg-slate-50 cursor-not-allowed" : ""}
              />
            </Field>

            <Field label="Payment Date">
              <TextInput
                type="date"
                value={form.paymentDate}
                onChange={(e) => handleFormChange("paymentDate", e.target.value)}
              />
            </Field>

            <Field label="Payment Method">
              <TextInput
                value={form.paymentMethod}
                onChange={(e) => handleFormChange("paymentMethod", e.target.value)}
                placeholder="e.g. Bank Transfer, Cash, GPay"
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Payment Notes">
                <TextInput
                  value={form.paymentNotes}
                  onChange={(e) => handleFormChange("paymentNotes", e.target.value)}
                  placeholder="e.g. Transaction Reference, check clearance notes"
                />
              </Field>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Saving..." : "Save Details"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {message ? (
          <p className="text-xs font-semibold text-slate-600" role="status">
            {message}
          </p>
        ) : null}
      </div>

      {/* Invoice Print Canvas */}
      <div
        id="invoice-print-surface"
        className="overflow-x-hidden rounded-2xl border border-slate-200/80 bg-slate-100/60 p-3 shadow-inner sm:p-5"
      >
        <InvoicePreview
          seller={seller}
          draft={draft}
          totals={totals}
          logoUrl={seller.logoDataUrl}
        />
      </div>
    </div>
  );
}
