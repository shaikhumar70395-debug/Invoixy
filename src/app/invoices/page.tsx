import { formatDateDisplay, formatMoney } from "@/lib/format";
import { listInvoices } from "@/lib/invoices";
import { prisma } from "@/lib/prisma";
import { InvoiceFilterForm } from "@/components/InvoiceFilterForm";
import Link from "next/link";
import { IconCopy } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { WhatsAppShareModal } from "@/components/WhatsAppShareModal";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    q?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    buyer?: string;
    state?: string;
  }>;
};

function paymentBadgeClass(status: string) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "part-paid") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default async function InvoicesPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params?.q ?? "";
  const startDate = params?.startDate ?? "";
  const endDate = params?.endDate ?? "";
  const status = params?.status ?? "all";
  const buyer = params?.buyer ?? "";
  const state = params?.state ?? "all";

  // Fetch distinct buyer states saved in database for dynamic dropdown filtering
  const statesResult = await prisma.invoice.findMany({
    select: { buyerStateName: true },
    distinct: ["buyerStateName"],
    where: { buyerStateName: { not: "" } },
  });
  const states = statesResult
    .map((r) => r.buyerStateName)
    .filter(Boolean)
    .sort();

  const invoices = await listInvoices({
    q,
    startDate,
    endDate,
    paymentStatus: status,
    buyerName: buyer,
    buyerStateName: state,
  });

  const exportParams = new URLSearchParams();
  if (buyer) exportParams.set("buyer", buyer);
  if (q) exportParams.set("q", q);
  if (startDate) exportParams.set("startDate", startDate);
  if (endDate) exportParams.set("endDate", endDate);
  if (status && status !== "all") exportParams.set("status", status);

  const exportUrl = exportParams.toString() ? `/api/export?${exportParams.toString()}` : "/api/export";
  const hasFilter = !!(buyer || q || startDate || endDate || (status && status !== "all"));

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <header className="page-heading flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Invoice history
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
            Search and manage issued invoices by number, buyer, GSTIN, or date.
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2.5">
          {invoices.length > 0 && (
            <a
              href={exportUrl}
              download={buyer ? `invoices_${buyer.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv` : "gst_invoices_export.csv"}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#4318ff] hover:border-slate-300 transition-colors"
              title={buyer ? `Download statements for ${buyer}` : "Download invoices as CSV / Excel"}
            >
              <svg className="h-4 w-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate max-w-[140px] sm:max-w-none">{buyer ? `Export "${buyer}"` : hasFilter ? "Export Filtered" : "Export CSV"}</span>
            </a>
          )}
          <Link
            href="/invoices/new"
            className="rounded-xl border border-indigo-600 bg-[#4318ff] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#3412cc] shrink-0"
          >
            + New invoice
          </Link>
        </div>
      </header>

      <InvoiceFilterForm states={states} />


      {invoices.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invoices.map((invoice) => {
            const todayIso = new Date().toISOString().slice(0, 10);
            const isOverdue =
              invoice.paymentStatus !== "paid" &&
              !!invoice.dueDate &&
              invoice.dueDate < todayIso;
            const outstanding = Math.max(
              0,
              invoice.grandTotal - invoice.paidAmount,
            );

            return (
              <article key={invoice.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="truncate text-base font-bold text-slate-900 group-hover:text-[#4318ff] transition-colors"
                      >
                        {invoice.buyerName || "Cash Customer"}
                      </Link>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        # {invoice.invoiceNumber}
                      </span>
                      {invoice.buyerGstin ? (
                        <span className="truncate font-mono text-[11px] text-slate-400">
                          GSTIN: {invoice.buyerGstin}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${paymentBadgeClass(invoice.paymentStatus)}`}
                  >
                    {invoice.paymentStatus === "part-paid" ? "Part Paid" : invoice.paymentStatus}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Date
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-700 truncate">
                      {formatDateDisplay(invoice.invoiceDate)}
                    </dd>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Due
                    </dt>
                    <dd
                      className={`mt-1 font-semibold truncate ${
                        isOverdue ? "text-rose-600" : "text-slate-700"
                      }`}
                    >
                      {invoice.dueDate ? formatDateDisplay(invoice.dueDate) : "-"}
                      {isOverdue ? (
                        <span className="block text-[9px] font-bold uppercase text-rose-600">
                          Overdue
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Total
                    </dt>
                    <dd className="mt-1 font-bold tabular-nums text-slate-900 truncate">
                      {formatMoney(invoice.grandTotal)}
                    </dd>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                      Outstanding
                    </dt>
                    <dd
                      className={`mt-1 font-bold tabular-nums truncate ${
                        outstanding > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {formatMoney(outstanding)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex items-center gap-2 sm:gap-3">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex min-h-[42px] flex-1 items-center justify-center rounded-xl bg-[#4318ff] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3412cc]"
                  >
                    Open Invoice
                  </Link>
                  <WhatsAppShareModal
                    invoiceNumber={invoice.invoiceNumber}
                    invoiceDate={invoice.invoiceDate}
                    customerName={invoice.buyerName}
                    grandTotal={invoice.grandTotal}
                    outstanding={outstanding}
                    dueDate={invoice.dueDate}
                    variant="compact"
                    triggerButtonText="WhatsApp"
                  />
                  <Link
                    href={`/invoices/new?duplicate=${invoice.id}`}
                    className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#4318ff]"
                  >
                    <IconCopy className="h-4 w-4" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No invoices found"
          description="We couldn't find any invoices matching your search. Try adjusting the filters or create a new invoice."
          actionLabel="Create Invoice"
          actionHref="/invoices/new"
        />
      )}
    </div>
  );
}
