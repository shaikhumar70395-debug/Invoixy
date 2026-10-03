import { InvoiceWorkspace } from "@/components/InvoiceWorkspace";
import { createDuplicateDraft, createNewInvoiceDraft } from "@/lib/invoices";
import { loadDraftFromDb } from "@/lib/draft-db";
import { listCustomers, listProducts } from "@/lib/presets";
import { getOrCreateSellerSettings } from "@/lib/seller";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ duplicate?: string }>;
};

export default async function NewInvoicePage({ searchParams }: Props) {
  const params = await searchParams;
  const duplicateId = params?.duplicate ? Number(params.duplicate) : null;

  const [seller, freshDraft, savedDbDraft, customers, products] =
    await Promise.all([
      getOrCreateSellerSettings(),
      duplicateId ? createDuplicateDraft(duplicateId) : createNewInvoiceDraft(),
      // Only load the DB draft when NOT duplicating — duplicate always starts fresh
      duplicateId ? Promise.resolve(null) : loadDraftFromDb(),
      listCustomers(),
      listProducts(),
    ]);

  if (!freshDraft) notFound();

  // If a DB draft exists, merge in the current invoice number from the fresh draft
  // (so the number stays correct even if the draft is old) then use it as initial state.
  const initialDraft = savedDbDraft
    ? {
        ...savedDbDraft,
        meta: {
          ...savedDbDraft.meta,
          invoiceNumber: freshDraft.meta.invoiceNumber,
        },
      }
    : freshDraft;

  return (
    <div className="space-y-5">
      <header className="page-heading flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          New Invoice
        </h1>
        {savedDbDraft && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Draft restored
          </span>
        )}
      </header>
      <InvoiceWorkspace
        seller={seller}
        initialDraft={initialDraft}
        customers={customers}
        products={products}
      />
    </div>
  );
}
