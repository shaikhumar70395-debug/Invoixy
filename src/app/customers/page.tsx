import { CustomersManager } from "@/components/CustomersManager";
import { listCustomers } from "@/lib/presets";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const customers = await listCustomers(query);

  return (
    <div className="space-y-5">
      <header className="page-heading border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Customer Presets
        </h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
          Manage saved customer profiles to prefill billing and tax information when creating new invoices.
        </p>
      </header>
      <CustomersManager initialCustomers={customers} initialQuery={query} />
    </div>
  );
}
