"use client";

import { useState } from "react";
import { IconWhatsApp } from "@/components/ui/icons";
import { formatMoney, formatDateDisplay } from "@/lib/format";

type Props = {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  grandTotal: number;
  outstanding: number;
  dueDate?: string;
  sellerName?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  triggerButtonText?: string;
  variant?: "primary" | "compact";
  className?: string;
};

export function WhatsAppShareModal({
  invoiceNumber,
  invoiceDate,
  customerName,
  grandTotal,
  outstanding,
  dueDate,
  sellerName = "Store",
  bankName,
  bankAccountNo,
  bankIfsc,
  triggerButtonText = "Share on WhatsApp",
  variant = "primary",
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);

  // Compose clean, universally compatible WhatsApp message (no broken symbols or question marks)
  let messageText = `*INVOICE: ${invoiceNumber}*\n`;
  messageText += `----------------------------------------\n`;
  messageText += `*From:* ${sellerName}\n`;
  messageText += `*Date:* ${formatDateDisplay(invoiceDate)}\n`;
  messageText += `*Billed To:* ${customerName}\n`;
  messageText += `*Total Amount:* ${formatMoney(grandTotal)}\n`;

  if (outstanding > 0) {
    messageText += `*Amount Due:* ${formatMoney(outstanding)}\n`;
  } else {
    messageText += `*Payment Status:* Paid in Full\n`;
  }

  if (dueDate) {
    messageText += `*Due Date:* ${formatDateDisplay(dueDate)}\n`;
  }

  if (outstanding > 0 && bankAccountNo) {
    messageText += `----------------------------------------\n`;
    messageText += `*Bank Details for Payment:*\n`;
    if (bankName) messageText += `Bank: ${bankName}\n`;
    messageText += `A/C: ${bankAccountNo}\n`;
    if (bankIfsc) messageText += `IFSC: ${bankIfsc}\n`;
  }

  messageText += `----------------------------------------\n`;
  messageText += `Thank you for your business!\n`;

  function handleSendWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    // If exactly 10 digits (standard Indian mobile), automatically prepend country code 91
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(messageText);

    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {variant === "compact" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={`Share ${invoiceNumber} on WhatsApp`}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 sm:px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs whitespace-nowrap shrink-0 ${className}`}
        >
          <IconWhatsApp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="whitespace-nowrap">{triggerButtonText}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 text-sm font-bold shadow-sm transition-all duration-150 active:scale-[0.98] ${className}`}
        >
          <IconWhatsApp className="h-4 w-4 text-white" />
          <span>{triggerButtonText}</span>
        </button>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#25D366] border border-emerald-100 shadow-2xs">
                  <IconWhatsApp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Send Bill via WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    Invoice {invoiceNumber} · {customerName}
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

            {/* Form */}
            <form onSubmit={handleSendWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Customer WhatsApp Number (Optional)
                </label>
                <div className="flex rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <span className="flex items-center px-3.5 text-xs font-bold text-slate-500 bg-slate-100/80 border-r border-slate-200">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number..."
                    className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none"
                    maxLength={15}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank to choose any contact or group directly inside WhatsApp.
                </p>
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Message Preview
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {copied ? "✓ Copied!" : "Copy Text"}
                  </button>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                  {messageText}
                </div>
              </div>

              {/* PDF Tip */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">📎</span>
                <span>
                  <strong>Sending the PDF file?</strong> Click "Download PDF" first, then click "Open in WhatsApp" and attach the file using the paperclip icon in your chat.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 text-xs font-extrabold shadow-sm transition-all duration-150 active:scale-[0.98]"
                >
                  <IconWhatsApp className="h-4 w-4" />
                  <span>Open in WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
