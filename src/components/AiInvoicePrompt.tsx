"use client";

import { useState, useTransition } from "react";
import { generateInvoiceFromPromptAction } from "@/app/actions/ai";
import type { AiInvoiceResult } from "@/lib/ai-invoice";
import { toast } from "sonner";

type Props = {
  onApply: (data: AiInvoiceResult) => void;
};

const SAMPLE_PROMPTS = [
  {
    label: "📱 Smartphones & Audio",
    text: "Bill Amit Patel for 2 Apple iPhone 15 Pro at ₹1,19,900 each and 1 MagSafe Charger at ₹4,500 with 18% GST",
  },
  {
    label: "💻 Laptops & IT Hardware",
    text: "Create invoice for Priya Enterprises for 5 Lenovo ThinkPad Laptops at ₹55,000 each and 5 Wireless Mice at ₹850 with 18% GST",
  },
  {
    label: "📺 Smart TVs & Audio",
    text: "Invoice Rajesh Kumar for 1 Samsung 65-inch 4K OLED TV at ₹1,45,000 and 1 Sony Soundbar at ₹18,500 with 28% GST",
  },
];

export function AiInvoicePrompt({ onApply }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter invoice details or pick a quick template.");
      return;
    }

    startTransition(async () => {
      const res = await generateInvoiceFromPromptAction(prompt.trim());
      if (res.success && res.data) {
        onApply(res.data);
        toast.success(res.data.summaryMessage || "Invoice draft updated!");
        setIsOpen(false);
      } else {
        toast.error(res.error || "Could not generate invoice. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all mb-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4318ff]/10 text-[#4318ff] shrink-0">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Smart Invoice Assistant
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal truncate hidden sm:block">
              Type order details in plain English to auto-fill customer, items, and GST taxes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-colors shrink-0"
        >
          <span>{isOpen ? "Close" : "Smart Fill"}</span>
          <svg
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-100">
          {/* Quick Click Samples */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
              Quick templates:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(sample.text)}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-[#4318ff] hover:bg-white hover:text-[#4318ff] transition-all shadow-2xs text-left"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "Invoice Rajesh Kumar for 1 Samsung 65-inch 4K OLED TV at ₹1,45,000 and 1 Soundbar at ₹18,500 with 18% GST"'
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#4318ff] focus:outline-none focus:ring-2 focus:ring-[#4318ff]/15 transition-all resize-none"
            />
          </div>

          {/* Responsive Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <span className="text-[11px] text-slate-500 font-medium">
              Auto-detects customer, line items, quantities, rates and GST.
            </span>

            <div className="flex items-center gap-2 justify-end">
              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending || !prompt.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4318ff] hover:bg-[#3713d3] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 transition-all whitespace-nowrap shrink-0"
              >
                {isPending ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    <span>Filling draft...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Fill Invoice Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
