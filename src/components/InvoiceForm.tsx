"use client";

import {
  saveCustomerPresetAction,
  saveProductPresetAction,
} from "@/app/actions/presets";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { createEmptyLine } from "@/lib/defaults";
import { inferTaxMode } from "@/lib/gst";
import type {
  CustomerPreset,
  InvoiceDraft,
  ProductPreset,
  SellerProfile,
  TaxMode,
} from "@/lib/types";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  seller: SellerProfile;
  draft: InvoiceDraft;
  onChange: (draft: InvoiceDraft) => void;
  onLoadSample: () => void;
  showSampleAction?: boolean;
  invoiceNumberReadOnly?: boolean;
  customers: CustomerPreset[];
  products: ProductPreset[];
};

const GST_RATES = [0, 5, 12, 18, 28];

export function InvoiceForm({
  seller,
  draft,
  onChange,
  onLoadSample,
  showSampleAction = true,
  invoiceNumberReadOnly = false,
  customers,
  products,
}: Props) {
  const [isPresetPending, startPresetTransition] = useTransition();

  function patch(partial: Partial<InvoiceDraft>) {
    onChange({ ...draft, ...partial });
  }

  function patchMeta(partial: Partial<InvoiceDraft["meta"]>) {
    onChange({ ...draft, meta: { ...draft.meta, ...partial } });
  }

  function patchBuyer(partial: Partial<InvoiceDraft["buyer"]>) {
    const buyer = { ...draft.buyer, ...partial };
    const taxMode = inferTaxMode(seller.stateCode, buyer.stateCode);
    onChange({ ...draft, buyer, taxMode });
  }

  function setTaxMode(taxMode: TaxMode) {
    onChange({ ...draft, taxMode });
  }

  function updateLine(
    id: string,
    partial: Partial<InvoiceDraft["lines"][number]>,
  ) {
    onChange({
      ...draft,
      lines: draft.lines.map((line) =>
        line.id === id ? { ...line, ...partial } : line,
      ),
    });
  }

  function addLine() {
    onChange({
      ...draft,
      lines: [
        ...draft.lines,
        { ...createEmptyLine(), gstRatePercent: draft.gstRatePercent },
      ],
    });
  }

  function removeLine(id: string) {
    if (draft.lines.length <= 1) return;
    onChange({ ...draft, lines: draft.lines.filter((line) => line.id !== id) });
  }

  function applyCustomer(id: string) {
    const customer = customers.find((item) => item.id === Number(id));
    if (!customer) return;
    patchBuyer({
      name: customer.name,
      address: customer.address,
      gstin: customer.gstin,
      stateName: customer.stateName,
      stateCode: customer.stateCode,
    });
  }

  function applyProduct(lineId: string, productId: string) {
    const product = products.find((item) => item.id === Number(productId));
    if (!product) return;
    updateLine(lineId, {
      description: product.description,
      hsnSac: product.hsnSac,
      unit: product.unit,
      rate: product.defaultRate,
      gstRatePercent: product.defaultGstRatePercent,
    });
  }

  function saveCurrentCustomer() {
    if (!draft.buyer.name.trim()) {
      toast.error("Enter a buyer name before saving as customer.");
      return;
    }
    startPresetTransition(async () => {
      await saveCustomerPresetAction(draft.buyer);
      toast.success("Customer saved successfully!");
    });
  }

  function saveCurrentProduct(line: InvoiceDraft["lines"][number]) {
    if (!line.description.trim()) {
      toast.error("Enter a product description before saving.");
      return;
    }
    startPresetTransition(async () => {
      await saveProductPresetAction({
        description: line.description,
        hsnSac: line.hsnSac,
        unit: line.unit,
        defaultRate: line.rate,
        defaultGstRatePercent: line.gstRatePercent,
      });
      toast.success("Product saved successfully!");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900">Invoice details</h2>
        {showSampleAction ? (
          <Button variant="ghost" onClick={onLoadSample} className="text-zinc-600">
            Load sample invoice
          </Button>
        ) : null}
      </div>

      <SectionCard title="Header" description="Invoice number, date, and references">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Invoice number"
            hint={invoiceNumberReadOnly ? "Generated automatically on save." : undefined}
          >
            <TextInput
              value={draft.meta.invoiceNumber}
              onChange={(e) => patchMeta({ invoiceNumber: e.target.value })}
              placeholder="ECMUM/26-27/105"
              readOnly={invoiceNumberReadOnly}
              className={
                invoiceNumberReadOnly
                  ? "cursor-not-allowed bg-zinc-100 text-zinc-700"
                  : undefined
              }
            />
          </Field>
          <Field label="Date">
            <TextInput
              type="date"
              value={draft.meta.invoiceDate}
              onChange={(e) => patchMeta({ invoiceDate: e.target.value })}
            />
          </Field>
          <Field label="Due date">
            <TextInput
              type="date"
              value={draft.meta.dueDate}
              onChange={(e) => patchMeta({ dueDate: e.target.value })}
            />
          </Field>
          <Field label="Mode / terms of payment">
            <TextInput
              value={draft.meta.modeOfPayment}
              onChange={(e) => patchMeta({ modeOfPayment: e.target.value })}
            />
          </Field>
          <Field label="Buyer's order no.">
            <TextInput
              value={draft.meta.buyersOrderNo}
              onChange={(e) => patchMeta({ buyersOrderNo: e.target.value })}
            />
          </Field>
          <Field label="Dispatch doc no.">
            <TextInput
              value={draft.meta.dispatchDocNo}
              onChange={(e) => patchMeta({ dispatchDocNo: e.target.value })}
            />
          </Field>
          <Field label="Dispatched through">
            <TextInput
              value={draft.meta.dispatchedThrough}
              onChange={(e) => patchMeta({ dispatchedThrough: e.target.value })}
            />
          </Field>
          <Field label="Destination">
            <TextInput
              value={draft.meta.destination}
              onChange={(e) => patchMeta({ destination: e.target.value })}
            />
          </Field>
          <Field label="Delivery note date">
            <TextInput
              type="date"
              value={draft.meta.deliveryNoteDate}
              onChange={(e) => patchMeta({ deliveryNoteDate: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Buyer" description="Bill-to party and delivery details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Saved customer">
            <SelectInput defaultValue="" onChange={(e) => applyCustomer(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.gstin ? ` (${customer.gstin})` : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={saveCurrentCustomer}
              disabled={isPresetPending}
              className="w-full"
            >
              Save buyer as customer
            </Button>
          </div>
          <Field label="Name">
            <TextInput
              value={draft.buyer.name}
              onChange={(e) => patchBuyer({ name: e.target.value })}
            />
          </Field>
          <Field label="GSTIN">
            <TextInput
              value={draft.buyer.gstin}
              onChange={(e) => patchBuyer({ gstin: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Billing address">
              <TextArea
                value={draft.buyer.address}
                onChange={(e) => patchBuyer({ address: e.target.value })}
              />
            </Field>
          </div>
          <Field label="State name">
            <TextInput
              value={draft.buyer.stateName}
              onChange={(e) => patchBuyer({ stateName: e.target.value })}
            />
          </Field>
          <Field label="State code">
            <TextInput
              value={draft.buyer.stateCode}
              onChange={(e) => patchBuyer({ stateCode: e.target.value })}
              maxLength={2}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Delivery address (optional)">
              <TextArea
                value={draft.meta.deliveryAddress}
                onChange={(e) => patchMeta({ deliveryAddress: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Line items"
        description="Goods or services on this invoice"
        action={
          <Button variant="secondary" onClick={addLine} className="py-1.5 text-xs">
            <IconPlus className="h-3.5 w-3.5" />
            Add row
          </Button>
        }
      >
        <div className="space-y-4">
          {draft.lines.map((line, index) => (
            <div
              key={line.id}
              className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Item {index + 1}
                </span>
                {draft.lines.length > 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() => removeLine(line.id)}
                    className="h-8 px-2 text-xs text-red-700 hover:bg-red-50"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Saved product">
                  <SelectInput
                    defaultValue=""
                    onChange={(e) => applyProduct(line.id, e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.description}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => saveCurrentProduct(line)}
                    disabled={isPresetPending}
                    className="w-full"
                  >
                    Save as product
                  </Button>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <TextArea
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.id, { description: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field label="HSN / SAC">
                  <TextInput
                    value={line.hsnSac}
                    onChange={(e) =>
                      updateLine(line.id, { hsnSac: e.target.value })
                    }
                  />
                </Field>
                <Field label="Unit">
                  <TextInput
                    value={line.unit}
                    onChange={(e) =>
                      updateLine(line.id, { unit: e.target.value })
                    }
                  />
                </Field>
                <Field label="Quantity">
                  <TextInput
                    type="number"
                    min={0}
                    step="any"
                    value={line.quantity || ""}
                    onChange={(e) =>
                      updateLine(line.id, {
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label="Rate">
                  <TextInput
                    type="number"
                    min={0}
                    step="any"
                    value={line.rate || ""}
                    onChange={(e) =>
                      updateLine(line.id, {
                        rate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label="Discount %">
                  <TextInput
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={line.discountPercent || ""}
                    onChange={(e) =>
                      updateLine(line.id, {
                        discountPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Field>
                <Field label="GST rate (%)">
                  <SelectInput
                    value={line.gstRatePercent}
                    onChange={(e) =>
                      updateLine(line.id, {
                        gstRatePercent: parseFloat(e.target.value),
                      })
                    }
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Tax" description="GST supply type and rates">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Supply type">
            <SelectInput
              value={draft.taxMode}
              onChange={(e) => setTaxMode(e.target.value as TaxMode)}
            >
              <option value="intra">Intra-state (CGST + SGST)</option>
              <option value="inter">Inter-state (IGST)</option>
            </SelectInput>
          </Field>
          <Field label="Default GST rate (%)">
            <SelectInput
              value={draft.gstRatePercent}
              onChange={(e) =>
                patch({ gstRatePercent: parseFloat(e.target.value) })
              }
            >
              {GST_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </SelectInput>
          </Field>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.roundOffEnabled}
              onChange={(e) => patch({ roundOffEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Round total to nearest rupee
            </span>
          </label>
        </div>
        <p className="text-xs leading-relaxed text-zinc-500">
          Tax mode auto-updates when buyer state code matches seller (
          {seller.stateCode}).
        </p>
      </SectionCard>
    </div>
  );
}
