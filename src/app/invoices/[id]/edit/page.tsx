import { InvoiceWorkspace } from "@/components/InvoiceWorkspace";
import { getInvoiceForPreview } from "@/lib/invoices";
import { listCustomers, listProducts } from "@/lib/presets";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isInteger(invoiceId)) notFound();

  const [invoice, customers, products] = await Promise.all([
    getInvoiceForPreview(invoiceId),
    listCustomers(),
    listProducts(),
  ]);

  if (!invoice) notFound();

  return (
    <div className="space-y-5">
      <header className="page-heading flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Edit Invoice
        </h1>
        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600">
          #{invoice.draft.meta.invoiceNumber}
        </span>
      </header>
      <InvoiceWorkspace
        seller={invoice.seller}
        initialDraft={invoice.draft}
        customers={customers}
        products={products}
        mode="edit"
        invoiceId={invoiceId}
      />
    </div>
  );
}
