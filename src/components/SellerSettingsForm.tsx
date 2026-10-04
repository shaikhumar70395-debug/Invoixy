"use client";

import { restoreDatabaseAction } from "@/app/actions/backup";
import { saveSellerSettingsAction } from "@/app/actions/seller";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { IconImage } from "@/components/ui/icons";
import type { SellerProfile } from "@/lib/types";
import { useRef, useState, useTransition } from "react";

type Props = {
  initial: SellerProfile;
  isLocal?: boolean;
};

const MAX_LOGO_BYTES = 512 * 1024;

export function SellerSettingsForm({ initial, isLocal = true }: Props) {
  const [form, setForm] = useState<SellerProfile>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [restorePending, startRestoreTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof SellerProfile>(key: K, value: SellerProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file (PNG, JPG, etc.).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setMessage("Logo must be under 512 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      update("logoDataUrl", dataUrl);
      setMessage("Logo ready. Save settings to store it in the database.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function onRemoveLogo() {
    update("logoDataUrl", "");
    setMessage("Logo removed. Save settings to update the database.");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await saveSellerSettingsAction(form);
      setMessage(
        result.ok ? "Settings saved." : result.error ?? "Save failed.",
      );
    });
  }

  function onRestore() {
    const file = restoreInputRef.current?.files?.[0];
    const formData = new FormData();
    if (file) formData.set("backup", file);
    const ok = window.confirm(
      "Restore this backup over the current database? A safety copy of the current database will be created first.",
    );
    if (!ok) return;
    setRestoreMessage("Restoring database...");
    startRestoreTransition(async () => {
      const result = await restoreDatabaseAction(formData);
      if (result.ok) {
        setRestoreMessage(
          `Database restored. Previous database saved at ${result.backupPath}. Refreshing page...`,
        );
        window.setTimeout(() => window.location.reload(), 800);
      } else {
        setRestoreMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Company Details */}
        <SectionCard title="Company Details" description="Details printed on every invoice">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <TextInput
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                required
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <TextArea
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field label="PAN">
              <TextInput
                value={form.pan}
                onChange={(e) => update("pan", e.target.value)}
              />
            </Field>
            <Field label="GSTIN / UIN">
              <TextInput
                value={form.gstin}
                onChange={(e) => update("gstin", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <Field label="State name">
                <TextInput
                  value={form.stateName}
                  onChange={(e) => update("stateName", e.target.value)}
                />
              </Field>
              <Field label="State code" hint="e.g. 27">
                <TextInput
                  value={form.stateCode}
                  onChange={(e) => update("stateCode", e.target.value)}
                  maxLength={2}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Invoice prefix" hint="e.g. APEX">
                <TextInput
                  value={form.invoicePrefix}
                  onChange={(e) => update("invoicePrefix", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Right Column: Branding & Bank Account */}
        <div className="space-y-6">
          <SectionCard
            title="Branding"
            description="Logo printed on invoice headers and preview"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                {form.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoDataUrl}
                    alt="Company logo preview"
                    className="h-full w-full rounded-md object-contain p-1"
                  />
                ) : (
                  <IconImage className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onLogoChange}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconImage />
                    Upload logo
                  </Button>
                  {form.logoDataUrl ? (
                    <Button type="button" variant="ghost" onClick={onRemoveLogo}>
                      Remove logo
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  PNG or JPG recommended. Max 512 KB. Saved securely with your seller settings.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Bank Account"
            description="Payment details on the invoice footer"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bank name">
                <TextInput
                  value={form.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                />
              </Field>
              <Field label="Branch">
                <TextInput
                  value={form.bankBranch}
                  onChange={(e) => update("bankBranch", e.target.value)}
                />
              </Field>
              <Field label="Account number">
                <TextInput
                  value={form.bankAccountNo}
                  onChange={(e) => update("bankAccountNo", e.target.value)}
                />
              </Field>
              <Field label="IFSC">
                <TextInput
                  value={form.bankIfsc}
                  onChange={(e) => update("bankIfsc", e.target.value)}
                />
              </Field>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Full-Width Section: Declaration & Terms */}
      <SectionCard title="Declaration & Terms" description="Default declaration printed on invoice footer">
        <Field label="Declaration text">
          <TextArea
            value={form.declaration}
            onChange={(e) => update("declaration", e.target.value)}
            rows={3}
          />
        </Field>
      </SectionCard>

      {/* Local-only: Database backup */}
      {isLocal ? (
        <SectionCard
          title="Database backup"
          description="Download or restore the local SQLite database"
        >
          <div className="space-y-4">
            <a
              href="/api/backup"
              download
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Download backup
            </a>
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <input
                ref={restoreInputRef}
                type="file"
                name="backup"
                accept=".db,application/vnd.sqlite3,application/octet-stream"
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="danger"
                  disabled={restorePending}
                  onClick={onRestore}
                >
                  {restorePending ? "Restoring..." : "Restore from backup"}
                </Button>
                <p className="max-w-xl text-xs leading-relaxed text-slate-500">
                  Restore replaces current database after creating a safety copy.
                </p>
              </div>
              {restoreMessage ? (
                <p className="text-xs text-slate-600" role="status">
                  {restoreMessage}
                </p>
              ) : null}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Save Configuration</h4>
          <p className="text-xs text-slate-500 font-medium">Apply all company, bank, and branding changes to issued invoices</p>
        </div>
        <div className="flex items-center gap-3">
          {message ? (
            <p className="text-xs font-semibold text-slate-700" role="status">
              {message}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={pending} className="px-6 py-2.5 rounded-xl font-bold shadow-xs">
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}
