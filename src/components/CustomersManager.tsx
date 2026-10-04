"use client";

import { deleteCustomerFormAction, saveCustomerPresetAction } from "@/app/actions/presets";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import type { CustomerPreset } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  initialCustomers: CustomerPreset[];
  initialQuery: string;
};

const emptyCustomer = {
  name: "",
  address: "",
  gstin: "",
  stateName: "",
  stateCode: "",
};

export function CustomersManager({ initialCustomers, initialQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialQuery);
  const [selected, setSelected] = useState<CustomerPreset | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateForm<K extends keyof typeof emptyCustomer>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("q", search.trim());
    } else {
      params.delete("q");
    }
    router.push(`?${params.toString()}`);
  }

  function handleClearSearch() {
    setSearch("");
    router.push("/customers");
  }

  function handleSelect(customer: CustomerPreset) {
    setSelected(customer);
    setForm({
      name: customer.name,
      address: customer.address,
      gstin: customer.gstin,
      stateName: customer.stateName,
      stateCode: customer.stateCode,
    });
    setMessage(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById("customer-form-section")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  function handleAddNew() {
    setSelected(null);
    setForm(emptyCustomer);
    setMessage(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById("customer-form-section")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage("Company name is required.");
      return;
    }
    if (!form.stateCode.trim() || form.stateCode.trim().length !== 2) {
      setMessage("State code must be exactly 2 digits.");
      return;
    }

    setMessage("Saving preset...");
    startTransition(async () => {
      const payload = {
        ...form,
        id: selected ? selected.id : undefined,
      };
      const result = await saveCustomerPresetAction(payload);
      if (result.ok) {
        setMessage(selected ? "Customer preset updated." : "New customer preset saved.");
        if (!selected) {
          setForm(emptyCustomer);
        }
        router.refresh();
      } else {
        setMessage("Could not save preset.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(340px,400px)] lg:gap-8 pb-16">
      {/* Customers List Section */}
      <div className="space-y-4 min-w-0">
        {/* Search Header - only show when there are records or an active search */}
        {(initialCustomers.length > 0 || initialQuery) && (
          <form onSubmit={handleSearch} className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, GSTIN, or state..."
              className="min-h-10 flex-1 min-w-0 rounded-xl border-none bg-slate-50 px-4 text-sm outline-none focus:ring-2 focus:ring-[#4318ff]/20"
            />
            <Button type="submit" variant="primary" className="rounded-xl">
              Search
            </Button>
            {initialQuery ? (
              <Button type="button" variant="ghost" onClick={handleClearSearch}>
                Clear
              </Button>
            ) : null}
          </form>
        )}

        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-lg">Customer Directory</h3>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
              {initialCustomers.length} records
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddNew}
            className="lg:hidden inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            + Add
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {initialCustomers.length > 0 ? (
            initialCustomers.map((cust) => {
              const active = selected?.id === cust.id;
              // Generate a fake avatar color based on name
              const colors = ["bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-orange-100 text-orange-700", "bg-pink-100 text-pink-700"];
              const charCode = cust.name.charCodeAt(0) || 0;
              const colorClass = colors[charCode % colors.length];
              
              return (
                <div
                  key={cust.id}
                  onClick={() => handleSelect(cust)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    active ? "border-[#4318ff] bg-indigo-50/40 shadow-xs ring-1 ring-[#4318ff]" : "border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${colorClass}`}>
                    {cust.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {cust.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {cust.address || "No address provided"}
                    </p>
                    {cust.gstin ? (
                      <p className="text-[10px] font-mono tracking-wide text-slate-400 mt-1">
                        GSTIN: {cust.gstin}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase">
                      {cust.stateCode}
                    </span>
                    <a
                      href={`/api/export?buyer=${encodeURIComponent(cust.name)}`}
                      download={`invoices_${cust.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`}
                      onClick={(e) => e.stopPropagation()}
                      title={`Export CSV statement for ${cust.name}`}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-[#4318ff] hover:bg-indigo-50 transition-colors"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      CSV
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={<span className="text-2xl">👥</span>}
                title="No customer presets yet"
                description={
                  initialQuery
                    ? "No customers matched your search query. Try clearing the search filter."
                    : "Save your frequent clients here to auto-fill billing address, state, and GSTIN when issuing new invoices."
                }
                hint="Fill out the form on the right to add your first customer"
                className="min-h-[360px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Side Form Card */}
      <div id="customer-form-section" className="lg:sticky lg:top-20 lg:self-start min-w-0">
        <form onSubmit={handleSave} className="space-y-4">
          <SectionCard
            title={selected ? "Edit Customer" : "Add Customer"}
            description={selected ? `Editing record: ${selected.name}` : "Create a reusable customer preset"}
          >
            <div className="space-y-4">
              <Field label="Company name">
                <TextInput
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  required
                />
              </Field>

              <Field label="GSTIN">
                <TextInput
                  value={form.gstin}
                  onChange={(e) => updateForm("gstin", e.target.value)}
                  placeholder="15-digit GSTIN (optional)"
                />
              </Field>

              <Field label="Billing Address">
                <TextArea
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="Complete postal address"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="State Name">
                  <TextInput
                    value={form.stateName}
                    onChange={(e) => updateForm("stateName", e.target.value)}
                    placeholder="e.g. MAHARASTRA"
                  />
                </Field>
                <Field label="State Code" hint="2-digit code">
                  <TextInput
                    value={form.stateCode}
                    onChange={(e) => updateForm("stateCode", e.target.value)}
                    placeholder="e.g. 27"
                    maxLength={2}
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* Action Row */}
          <div className="flex flex-col gap-2">
            <Button type="submit" variant="primary" disabled={pending} className="w-full rounded-xl py-3 shadow-sm">
              {pending ? "Saving..." : selected ? "Update Customer" : "Save Customer"}
            </Button>

            {selected ? (
              <form action={deleteCustomerFormAction} onSubmit={() => {
                if (confirm("Are you sure you want to delete this preset? Saved invoices will not be affected.")) {
                  setSelected(null);
                }
              }}>
                <input type="hidden" name="id" value={selected.id} />
                <Button type="submit" variant="danger" className="w-full rounded-xl py-3">
                  <IconTrash className="h-4 w-4" />
                  Delete Customer
                </Button>
              </form>
            ) : null}

            {selected ? (
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Ledger & History
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`/api/export?buyer=${encodeURIComponent(selected.name)}`}
                    download={`invoices_${selected.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#4318ff] hover:border-slate-300 transition-colors shadow-2xs"
                    title={`Download statement for ${selected.name}`}
                  >
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </a>
                  <Link
                    href={`/invoices?buyer=${encodeURIComponent(selected.name)}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <span>Invoices</span>
                    <span className="text-[10px]">↗</span>
                  </Link>
                </div>
              </div>
            ) : null}

            {message ? (
              <p className="text-center text-xs text-slate-600 font-medium mt-1" role="status">
                {message}
              </p>
            ) : null}
          </div>
        </form>
      </div>

      {/* Floating Action Button for Mobile Add New */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <button 
          type="button"
          onClick={() => {
             handleAddNew();
             window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#4318ff] to-indigo-500 text-white shadow-[0_8px_30px_rgba(67,24,255,0.4)] hover:shadow-[0_12px_40px_rgba(67,24,255,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 animate-pulse"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* Desktop Add New Button */}
      {selected && (
        <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
          <button 
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4318ff] to-indigo-500 px-5 py-3 font-bold text-white shadow-[0_8px_30px_rgba(67,24,255,0.4)] hover:shadow-[0_12px_40px_rgba(67,24,255,0.6)] transition-all hover:scale-105 active:scale-95 border border-white/20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Customer
          </button>
        </div>
      )}
    </div>
  );
}
