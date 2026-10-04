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
    label: "💻 Laptops & IT Gear",
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
      toast.error("Please enter an invoice instruction or click a sample.");
      return;
    }

    startTransition(async () => {
      const res = await generateInvoiceFromPromptAction(prompt.trim());
      if (res.success && res.data) {
        onApply(res.data);
        toast.success(res.data.summaryMessage || "Invoice generated with AI!");
        setIsOpen(false);
      } else {
        toast.error(res.error || "Could not generate invoice. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 p-3.5 sm:p-4 shadow-xs transition-all mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4318ff] to-indigo-500 text-white shadow-sm shrink-0 text-sm">
            ✨
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                AI Prompt Invoice Generator
              </h3>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 uppercase tracking-wide shrink-0">
                AI Beta
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden min-[400px]:block">
              Type or speak any instruction to auto-fill items and taxes in 1 second.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-2xs hover:bg-indigo-50 hover:border-indigo-300 transition-colors shrink-0"
        >
          <span>{isOpen ? "Close AI" : "✨ Try AI"}</span>
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="mt-3.5 space-y-3 pt-3 border-t border-indigo-100/80 animate-fade-in">
          {/* Quick Click Samples */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Quick 1-Click Demonstration Prompts:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(sample.text)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/60 hover:text-indigo-700 transition-colors shadow-2xs text-left"
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
              placeholder='e.g. "Bill Rahul Sharma for 5 hours of web consulting at ₹2,000/hr, GST 18%"'
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#4318ff] focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-medium">
              💡 Auto-extracts customer, quantities, rates & GST rates.
            </span>

            <div className="flex items-center gap-2">
              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending || !prompt.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4318ff] to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-[#3512cc] hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                {isPending ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generate Invoice</span>
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
