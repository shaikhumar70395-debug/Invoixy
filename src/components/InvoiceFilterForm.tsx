"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  states: string[];
};

export function InvoiceFilterForm({ states }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Load initial states from URL params
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [buyer, setBuyer] = useState(searchParams.get("buyer") || "");
  const [state, setState] = useState(searchParams.get("state") || "all");

  const [isOpen, setIsOpen] = useState(
    !!startDate || !!endDate || status !== "all" || !!buyer || state !== "all"
  );

  function applyFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({
      q,
      startDate,
      endDate,
      status,
      buyer,
      state,
    });
  }

  function handleClear() {
    setQ("");
    setStartDate("");
    setEndDate("");
    setStatus("all");
    setBuyer("");
    setState("all");
    
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters =
    !!searchParams.get("q") ||
    !!searchParams.get("startDate") ||
    !!searchParams.get("endDate") ||
    (searchParams.get("status") || "all") !== "all" ||
    !!searchParams.get("buyer") ||
    (searchParams.get("state") || "all") !== "all";

  return (
    <div className="space-y-3">
      <form
        onSubmit={handleSearchSubmit}
        className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-zinc-300"
      >
        {/* Main Search Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search invoice number, buyer, GSTIN..."
              className="min-h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 pl-10 pr-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-zinc-500 focus:bg-white focus:ring-2 focus:ring-zinc-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`flex min-h-11 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 ${
                isOpen ? "bg-zinc-50 font-semibold border-zinc-300 text-zinc-900" : "bg-white"
              }`}
            >
              <svg
                className={`h-4.5 w-4.5 text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <span>Advanced Filters</span>
              {hasActiveFilters && (
                <span className="flex h-5 items-center justify-center rounded-full bg-zinc-900 px-2 text-[10px] font-bold text-white uppercase tracking-wider">
                  Active
                </span>
              )}
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="min-h-11 rounded-lg border border-zinc-800 bg-zinc-900 px-5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Searching...</span>
                </>
              ) : (
                <span>Search</span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="min-h-11 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50/50 hover:text-rose-700 active:bg-rose-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Grid */}
        <div
          className={`grid gap-4 overflow-hidden transition-all duration-300 ${
            isOpen ? "mt-4 pt-4 border-t border-zinc-100 opacity-100 max-h-[800px]" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-10 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 bg-zinc-50/30"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-10 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 bg-zinc-50/30"
              />
            </div>

            {/* Payment Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full min-h-10 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 bg-zinc-50/30"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="part-paid">Part Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Buyer State */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Buyer State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full min-h-10 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 bg-zinc-50/30"
              >
                <option value="all">All States</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Specific Buyer Name search */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Buyer Name
              </label>
              <input
                type="text"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="Filter by customer/buyer name..."
                className="w-full min-h-10 rounded-md border border-zinc-200 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 bg-zinc-50/30"
              />
            </div>
            
            {/* Dynamic visual tag filters or helper info */}
            <div className="flex items-end justify-end pb-0.5">
              <button
                type="button"
                onClick={() => {
                  applyFilters({
                    q,
                    startDate,
                    endDate,
                    status,
                    buyer,
                    state,
                  });
                }}
                className="min-h-10 w-full sm:w-auto rounded-md bg-zinc-100 hover:bg-zinc-200/80 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider transition-all duration-200"
              >
                Apply Advanced Filters
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* active filters chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-400">Active Filters:</span>
          {searchParams.get("q") && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-zinc-700">
              Query: <strong className="text-zinc-950">{searchParams.get("q")}</strong>
            </span>
          )}
          {searchParams.get("startDate") && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-zinc-700">
              From: <strong className="text-zinc-950">{searchParams.get("startDate")}</strong>
            </span>
          )}
          {searchParams.get("endDate") && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-zinc-700">
              To: <strong className="text-zinc-950">{searchParams.get("endDate")}</strong>
            </span>
          )}
          {searchParams.get("status") && searchParams.get("status") !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-zinc-700 capitalize">
              Status: <strong className="text-zinc-950">{searchParams.get("status")}</strong>
            </span>
          )}
          {searchParams.get("buyer") && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-zinc-700">
              Buyer: <strong className="text-zinc-950">{searchParams.get("buyer")}</strong>
            </span>
          )}
          {searchParams.get("state") && searchParams.get("state") !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-zinc-700">
              State: <strong className="text-zinc-950">{searchParams.get("state")}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
