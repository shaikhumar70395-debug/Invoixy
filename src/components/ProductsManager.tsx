"use client";

import { deleteProductPresetAction, saveProductPresetAction } from "@/app/actions/presets";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { formatMoney } from "@/lib/format";
import type { ProductPreset } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  initialProducts: ProductPreset[];
  initialQuery: string;
};

const emptyProduct = {
  description: "",
  hsnSac: "",
  unit: "Nos",
  defaultRate: 0,
  defaultGstRatePercent: 5,
};

const GST_RATES = [0, 5, 12, 18, 28];

export function ProductsManager({ initialProducts, initialQuery }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProductPreset | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  function updateForm<K extends keyof typeof emptyProduct>(key: K, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const query = String(formData.get("q") ?? "").trim();
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(params.size ? `/products?${params.toString()}` : "/products");
  }

  function handleClearSearch() {
    router.push("/products");
  }

  function handleSelect(product: ProductPreset) {
    setSelected(product);
    setForm({
      description: product.description,
      hsnSac: product.hsnSac,
      unit: product.unit,
      defaultRate: product.defaultRate,
      defaultGstRatePercent: product.defaultGstRatePercent,
    });
    setMessage(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById("product-form-section")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  function handleAddNew() {
    setSelected(null);
    setForm(emptyProduct);
    setMessage(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById("product-form-section")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) {
      setMessage("Description is required.");
      return;
    }
    if (!form.hsnSac.trim()) {
      setMessage("HSN/SAC code is required.");
      return;
    }

    setMessage("Saving preset...");
    startTransition(async () => {
      const payload = {
        ...form,
        id: selected ? selected.id : undefined,
      };
      const result = await saveProductPresetAction(payload);
      if (result.ok) {
        setMessage(selected ? "Product preset updated." : "New product preset saved.");
        if (!selected) {
          setForm(emptyProduct);
        }
        router.refresh();
      } else {
        setMessage("Could not save preset.");
      }
    });
  }

  function handleDelete() {
    if (!selected) return;
    if (!confirm("Are you sure you want to delete this preset? Saved invoices will not be affected.")) {
      return;
    }
    setMessage("Deleting preset...");
    startDeleting(async () => {
      const result = await deleteProductPresetAction(selected.id);
      if (result.ok) {
        setSelected(null);
        setForm(emptyProduct);
        setMessage("Product preset deleted.");
        router.refresh();
      } else {
        setMessage(result.error ?? "Could not delete product preset.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(340px,400px)] lg:gap-8 pb-16">
      {/* Products List Section */}
      <div className="space-y-4 min-w-0">
        {/* Search Header - only show when there are records or active query */}
        {(initialProducts.length > 0 || initialQuery) && (
          <form onSubmit={handleSearch} className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <input
              name="q"
              defaultValue={initialQuery}
              placeholder="Search products by description or HSN..."
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
            <h3 className="font-bold text-slate-900 text-lg">Product Inventory</h3>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
              {initialProducts.length} {initialProducts.length === 1 ? "item" : "items"}
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
          {initialProducts.length > 0 ? (
            initialProducts.map((prod) => {
              const active = selected?.id === prod.id;
              
              return (
                <div
                  key={prod.id}
                  onClick={() => handleSelect(prod)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    active ? "border-[#4318ff] bg-indigo-50/40 shadow-xs ring-1 ring-[#4318ff]" : "border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {/* Avatar Icon */}
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-xl shadow-inner">
                    📦
                  </div>
                  
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {prod.description}
                    </p>
                    <p className="text-[10px] font-mono tracking-wide text-slate-500">
                      HSN: {prod.hsnSac}
                    </p>
                    <div className="mt-1 font-extrabold text-sm text-slate-900 tabular-nums">
                      {formatMoney(prod.defaultRate)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                      Active
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-2">
                      {prod.defaultGstRatePercent}% GST
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={<span className="text-2xl">📦</span>}
                title="No product presets yet"
                description={
                  initialQuery
                    ? "No products matched your search query. Try clearing the search filter."
                    : "Save your frequently billed products or service catalog with default rates and HSN codes to generate invoices in seconds."
                }
                hint="Fill out the form on the right to add your first product"
                className="min-h-[360px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Side Form Card */}
      <div id="product-form-section" className="lg:sticky lg:top-20 lg:self-start min-w-0">
        <form onSubmit={handleSave} className="space-y-4">
          <SectionCard
            title={selected ? "Edit Product" : "Add Product"}
            description={selected ? `Editing record: ${selected.description}` : "Create a reusable product preset"}
          >
            <div className="space-y-4">
              <Field label="Description">
                <TextArea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Complete goods or services description"
                  required
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="HSN / SAC">
                  <TextInput
                    value={form.hsnSac}
                    onChange={(e) => updateForm("hsnSac", e.target.value)}
                    placeholder="e.g. 998311"
                    required
                  />
                </Field>
                <Field label="Unit of Measure">
                  <TextInput
                    value={form.unit}
                    onChange={(e) => updateForm("unit", e.target.value)}
                    placeholder="e.g. Nos, Pcs, Kgs"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Default Rate">
                  <TextInput
                    type="number"
                    min={0}
                    step="any"
                    value={form.defaultRate || ""}
                    onChange={(e) => updateForm("defaultRate", parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 250"
                  />
                </Field>
                <Field label="Default GST rate">
                  <SelectInput
                    value={form.defaultGstRatePercent}
                    onChange={(e) => updateForm("defaultGstRatePercent", parseFloat(e.target.value))}
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Button type="submit" variant="primary" disabled={pending} className="w-full rounded-xl py-2.5 shadow-xs">
                  {pending ? "Saving..." : selected ? "Update Product" : "Save Product"}
                </Button>

                {selected ? (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="w-full rounded-xl py-2.5"
                  >
                    <IconTrash className="h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete Product"}
                  </Button>
                ) : null}

                {message ? (
                  <p className="text-center text-xs text-slate-600 font-medium mt-1" role="status">
                    {message}
                  </p>
                ) : null}
              </div>
            </div>
          </SectionCard>
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
            Add New Product
          </button>
        </div>
      )}
    </div>
  );
}
