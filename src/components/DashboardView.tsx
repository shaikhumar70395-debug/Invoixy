"use client";

import { useState, useEffect } from "react";
import { formatMoney, formatDateDisplay } from "@/lib/format";
import Link from "next/link";
import { IconDocument, IconCopy } from "@/components/ui/icons";
import { RevenueChart } from "@/components/RevenueChart";
import { AgingChart } from "@/components/AgingChart";
import { EmptyState } from "@/components/ui/EmptyState";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type Props = {
  stats: {
    invoiceCount: number;
    totalBilled: number;
    totalCollected: number;
    outstanding: number;
    monthBilled: number;
    overdueCount: number;
    recentInvoices: Array<{
      id: number;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      buyerName: string;
      grandTotal: number;
      paidAmount: number;
      paymentStatus: string;
    }>;
    topCustomers: Array<{
      name: string;
      total: number;
    }>;
    monthlyRevenue: Array<{
      prefix?: string;
      label: string;
      billed: number;
      collected: number;
    }>;
    chartData?: {
      daily: Array<{ label: string; billed: number; collected: number }>;
      weekly: Array<{ label: string; billed: number; collected: number }>;
      monthly: Array<{ label: string; billed: number; collected: number }>;
      yearly: Array<{ label: string; billed: number; collected: number }>;
    };
    agingBuckets: Array<{
      label: string;
      amount: number;
      count: number;
    }>;
  };
  isLocal?: boolean;
};

const statusColors: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-600",
  "part-paid": "bg-blue-50 text-blue-600",
  unpaid: "bg-orange-50 text-orange-500",
};

export function DashboardView({ stats, isLocal = true }: Props) {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Header Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{greeting} 👋</h1>
        <p className="text-base text-slate-600 mt-1 font-medium">Here's what's happening with your business.</p>
      </div>

      {/* Metrics Row (4 Columns on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase truncate mr-1">Total Revenue</p>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 text-base">
              <span>📈</span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tabular-nums tracking-tight mt-1 truncate">
            {formatMoney(stats.totalBilled)}
          </p>
          <p className="mt-2 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Total billed
          </p>
        </div>

        {/* Total Invoices */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase truncate mr-1">Total Invoices</p>
            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/60 shrink-0 text-base">
              <span>📄</span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tabular-nums tracking-tight mt-1 truncate">
            {stats.invoiceCount}
          </p>
          <p className="mt-2 text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Generated
          </p>
        </div>

        {/* Outstanding */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase truncate mr-1">Outstanding</p>
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0 text-base">
              <span>⏳</span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tabular-nums tracking-tight mt-1 truncate">
            {formatMoney(stats.outstanding)}
          </p>
          <p className="mt-2 text-[11px] font-bold text-amber-700 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : "Awaiting"}
          </p>
        </div>

        {/* Paid Amount */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase truncate mr-1">Paid Amount</p>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0 text-base">
              <span>💵</span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tabular-nums tracking-tight mt-1 truncate">
            {formatMoney(stats.totalCollected)}
          </p>
          <p className="mt-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
             <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Total paid
          </p>
        </div>
      </div>

      {/* Onboarding Guide for New Accounts (Zero Invoices) */}
      {stats.invoiceCount === 0 ? (
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 p-6 sm:p-8 shadow-sm">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-3 py-1 text-xs font-bold text-[#4318ff] mb-3">
              <span>🚀</span>
              <span>Quick Start Guide</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
              Welcome to your new business dashboard!
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              Complete these simple steps to start issuing compliant GST invoices for your clients.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-white bg-white/90 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-base font-bold text-[#4318ff] mb-3">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900">Configure Business Profile</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Add your company address, GSTIN, and bank account for payment transfers.
                </p>
              </div>
              <Link
                href="/settings"
                className="mt-4 inline-flex items-center text-xs font-bold text-[#4318ff] hover:text-indigo-700"
              >
                Go to Seller Settings →
              </Link>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-white bg-white/90 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-base font-bold text-emerald-600 mb-3">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900">Create First Invoice</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Generate an invoice with auto GST breakdown and instant PDF download.
                </p>
              </div>
              <Link
                href="/invoices/new"
                className="mt-4 inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Create First Invoice →
              </Link>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-white bg-white/90 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-base font-bold text-violet-600 mb-3">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add Presets (Optional)</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Save regular customers and products to speed up future billing.
                </p>
              </div>
              <Link
                href="/customers"
                className="mt-4 inline-flex items-center text-xs font-bold text-violet-600 hover:text-violet-700"
              >
                Add Customer Presets →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Revenue Chart */
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 mt-4 shadow-sm">
          <RevenueChart chartData={stats.chartData} data={stats.monthlyRevenue} />
        </div>
      )}

      {/* Recent Invoices List (Card-based) */}
      <div>
        <div className="flex items-center justify-between mb-3.5 mt-8">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Invoices</h3>
            <p className="text-xs text-slate-500 font-medium">Latest billing records and payments</p>
          </div>
          <Link
            href="/invoices"
            className="text-xs font-bold text-[#4318ff] hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            View All →
          </Link>
        </div>

        {stats.recentInvoices.length > 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
            {stats.recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 transition-all duration-150 group"
              >
                <div className="flex flex-col gap-1 mb-2.5 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#4318ff] transition-colors"
                    >
                      {inv.buyerName || "Cash Customer"}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="font-mono text-slate-400"># {inv.invoiceNumber}</span>
                    <span>&bull;</span>
                    <span>{formatDateDisplay(inv.invoiceDate)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                    {formatMoney(inv.grandTotal)}
                  </span>
                  
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ring-inset ${
                      statusColors[inv.paymentStatus] || statusColors.unpaid
                    }`}
                  >
                    {inv.paymentStatus === "part-paid" ? "Part Paid" : inv.paymentStatus}
                  </span>

                  <div className="flex items-center gap-1">
                     <Link
                        href={`/invoices/${inv.id}`}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4318ff] rounded-lg transition-colors"
                        title="View Invoice"
                      >
                        <IconDocument className="h-4 w-4" />
                     </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <EmptyState 
               title="No invoices yet" 
               description="You haven't generated any invoices. Create your first one to start tracking revenue." 
               actionLabel="Create Invoice" 
                 actionHref="/invoices/new" 
              />
            </div>
          )}
        </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link 
          href="/invoices/new" 
          aria-label="Create new invoice"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#4318ff] to-indigo-500 text-white shadow-[0_8px_30px_rgba(67,24,255,0.4)] hover:shadow-[0_12px_40px_rgba(67,24,255,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

