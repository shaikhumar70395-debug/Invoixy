import { InvoicePreviewScaler } from "@/components/InvoicePreviewScaler";
import { formatDateDisplay, formatRs, formatQuantity } from "@/lib/format";
import type { InvoiceDraft, InvoiceTotals, SellerProfile } from "@/lib/types";

type Props = {
  seller: SellerProfile;
  draft: InvoiceDraft;
  totals: InvoiceTotals;
  logoUrl?: string | null;
  previewMode?: "fit" | "actual";
};

function Cell({
  children,
  className = "",
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border border-zinc-300 p-2 align-top text-[11px] leading-snug text-zinc-900 ${className}`}
    >
      {children ?? "\u00a0"}
    </td>
  );
}

function MetaCell({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <>
      <td className="w-[42%] border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-[10px] font-semibold leading-tight text-zinc-600">
        {label}
      </td>
      <td className="border border-zinc-300 px-2 py-1.5 text-[10px] font-medium leading-tight text-zinc-900">
        {value || "\u00a0"}
      </td>
    </>
  );
}

export function InvoicePreview({
  seller,
  draft,
  totals,
  logoUrl,
  previewMode = "fit",
}: Props) {
  const { meta, buyer } = draft;
  const isIntra = draft.taxMode === "intra";
  const blankRows = Math.max(0, 5 - totals.lines.length);

  return (
    <InvoicePreviewScaler mode={previewMode}>
      <div
        className="invoice-paper min-h-[1123px] bg-white p-8 text-black shadow-sm ring-1 ring-zinc-200"
        style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}
      >
        <table className="h-full w-full border-collapse overflow-hidden rounded-sm border border-zinc-400 text-[11px]">
          <tbody>
            <tr>
              <Cell
                colSpan={9}
                className="border-zinc-900 bg-zinc-900 py-3 text-center text-base font-bold tracking-[0.18em] text-white"
              >
                TAX INVOICE
              </Cell>
            </tr>
            <tr>
              <Cell colSpan={5} className="h-[138px] border-r border-zinc-400 align-middle">
                <div className="flex gap-4">
                  {logoUrl ? (
                    <div className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt=""
                        className="h-20 w-20 rounded-sm border border-zinc-200 object-contain p-1"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-extrabold uppercase leading-tight tracking-wide text-zinc-950">
                      {seller.companyName}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[10px] leading-relaxed text-zinc-700">
                      {seller.address}
                    </p>
                    <p className="mt-2 text-[10px] font-medium text-zinc-800">PAN NO.: {seller.pan}</p>
                    <p className="text-[10px] font-medium text-zinc-800">GSTIN/UIN: {seller.gstin}</p>
                    <p className="text-[10px] text-zinc-700">
                      State Name: {seller.stateName}, Code: {seller.stateCode}
                    </p>
                    <p className="text-[10px] text-zinc-700">TEL: {seller.phone}</p>
                  </div>
                </div>
              </Cell>
              <Cell colSpan={4} className="p-0">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <MetaCell
                        label="Invoice No."
                        value={
                          <span className="font-semibold">
                            {meta.invoiceNumber || "-"}
                          </span>
                        }
                      />
                    </tr>
                    <tr>
                      <MetaCell
                        label="Dated"
                        value={formatDateDisplay(meta.invoiceDate)}
                      />
                    </tr>
                    <tr>
                      <MetaCell
                        label="Mode/Terms of Payment"
                        value={meta.modeOfPayment}
                      />
                    </tr>
                    <tr>
                      <MetaCell label="Buyer's Order No." value={meta.buyersOrderNo} />
                    </tr>
                    <tr>
                      <MetaCell label="Dispatch Doc No." value={meta.dispatchDocNo} />
                    </tr>
                    <tr>
                      <MetaCell
                        label="Dispatched Through"
                        value={meta.dispatchedThrough}
                      />
                    </tr>
                    <tr>
                      <MetaCell label="Destination" value={meta.destination} />
                    </tr>
                  </tbody>
                </table>
              </Cell>
            </tr>
            <tr>
              <Cell colSpan={5} className="h-[118px] border-r border-zinc-400">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Buyer (Bill to)
                </p>
                <p className="mt-1.5 text-sm font-bold text-zinc-950">{buyer.name || "-"}</p>
                <p className="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-zinc-700">
                  {buyer.address}
                </p>
                {buyer.gstin ? (
                  <p className="mt-1 text-[10px]">GSTIN/UIN: {buyer.gstin}</p>
                ) : null}
                {buyer.stateName ? (
                  <p className="text-[10px]">
                    State: {buyer.stateName}
                    {buyer.stateCode ? `, Code: ${buyer.stateCode}` : ""}
                  </p>
                ) : null}
              </Cell>
              <Cell colSpan={4} className="h-[118px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Delivery address
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-relaxed text-zinc-700">
                  {meta.deliveryAddress || "-"}
                </p>
              </Cell>
            </tr>
            <tr className="bg-zinc-800">
              <Cell className="w-8 border-zinc-700 text-center text-[10px] font-bold text-white">Sl</Cell>
              <Cell className="border-zinc-700 text-[10px] font-bold text-white">Description of Goods</Cell>
              <Cell className="w-16 border-zinc-700 text-[10px] font-bold text-white">HSN/SAC</Cell>
              <Cell className="w-12 border-zinc-700 text-right text-[10px] font-bold text-white">Qty</Cell>
              <Cell className="w-24 border-zinc-700 text-right text-[10px] font-bold text-white whitespace-nowrap">Rate</Cell>
              <Cell className="w-10 border-zinc-700 text-center text-[10px] font-bold text-white">per</Cell>
              <Cell className="w-12 border-zinc-700 text-right text-[10px] font-bold text-white">Disc.%</Cell>
              <Cell className="w-12 border-zinc-700 text-right text-[10px] font-bold text-white">GST%</Cell>
              <Cell className="w-28 border-zinc-700 text-right text-[10px] font-bold text-white whitespace-nowrap">Amount</Cell>
            </tr>
            {totals.lines.map((line) => (
              <tr key={line.id}>
                <Cell className="text-center tabular-nums">{line.slNo}</Cell>
                <Cell className="leading-relaxed">{line.description}</Cell>
                <Cell className="tabular-nums">{line.hsnSac}</Cell>
                <Cell className="text-right tabular-nums whitespace-nowrap">
                  {line.quantity || ""}
                </Cell>
                <Cell className="text-right tabular-nums whitespace-nowrap font-medium">
                  {line.rate ? formatRs(line.rate) : ""}
                </Cell>
                <Cell className="text-center">{line.unit}</Cell>
                <Cell className="text-right tabular-nums whitespace-nowrap">
                  {line.discountPercent ? line.discountPercent : ""}
                </Cell>
                <Cell className="text-right tabular-nums whitespace-nowrap">
                  {line.gstRatePercent || ""}
                </Cell>
                <Cell className="text-right tabular-nums font-semibold whitespace-nowrap">
                  {line.amount ? formatRs(line.amount) : ""}
                </Cell>
              </tr>
            ))}
            {Array.from({ length: blankRows }).map((_, i) => (
              <tr key={`empty-${i}`}>
                {Array.from({ length: 9 }).map((__, j) => (
                  <Cell key={j} className="h-7">
                    &nbsp;
                  </Cell>
                ))}
              </tr>
            ))}
            <tr>
              <Cell colSpan={3} className="bg-zinc-50 text-right text-[10px] font-bold">
                Total
              </Cell>
              <Cell className="bg-zinc-50 text-right text-[10px] font-bold tabular-nums whitespace-nowrap">
                {formatQuantity(totals.totalQuantity)}
              </Cell>
              <Cell colSpan={4} className="bg-zinc-50" />
              <Cell className="bg-zinc-50 text-right text-[10px] font-bold tabular-nums whitespace-nowrap">
                {formatRs(totals.subtotal)}
              </Cell>
            </tr>
            <tr className="bg-zinc-100">
              <Cell
                colSpan={9}
                className="py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600"
              >
                Tax summary
              </Cell>
            </tr>
            {isIntra
              ? totals.taxBreakup.flatMap((row) => [
                  <tr key={`cgst-${row.gstRatePercent}`}>
                    <Cell colSpan={8} className="text-right text-[10px]">
                      Output CGST @ {row.cgstRate}%
                    </Cell>
                    <Cell className="text-right text-[10px] tabular-nums whitespace-nowrap">
                      {formatRs(row.cgstAmount)}
                    </Cell>
                  </tr>,
                  <tr key={`sgst-${row.gstRatePercent}`}>
                    <Cell colSpan={8} className="text-right text-[10px]">
                      Output SGST @ {row.sgstRate}%
                    </Cell>
                    <Cell className="text-right text-[10px] tabular-nums whitespace-nowrap">
                      {formatRs(row.sgstAmount)}
                    </Cell>
                  </tr>,
                ])
              : totals.taxBreakup.map((row) => (
                  <tr key={`igst-${row.gstRatePercent}`}>
                    <Cell colSpan={8} className="text-right text-[10px]">
                      Output IGST @ {row.igstRate}%
                    </Cell>
                    <Cell className="text-right text-[10px] tabular-nums whitespace-nowrap">
                      {formatRs(row.igstAmount)}
                    </Cell>
                  </tr>
                ))}
            <tr>
              <Cell colSpan={8} className="text-right text-[10px]">
                Round Off
              </Cell>
              <Cell className="text-right text-[10px] tabular-nums whitespace-nowrap">
                {formatRs(totals.roundOff)}
              </Cell>
            </tr>
            <tr className="bg-zinc-900">
              <Cell colSpan={8} className="border-zinc-900 text-right text-sm font-bold text-white">
                Grand Total
              </Cell>
              <Cell className="border-zinc-900 text-right text-sm font-bold tabular-nums text-white whitespace-nowrap">
                {formatRs(totals.grandTotal)}
              </Cell>
            </tr>
            <tr>
              <Cell colSpan={9} className="bg-zinc-50 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Amount Chargeable (in words)
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-950">
                  In Indian Rupees - {totals.amountInWords}
                </p>
              </Cell>
            </tr>
            <tr>
              <Cell colSpan={5} className="h-[132px] border-r border-zinc-400 align-top">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Company&apos;s Bank Details
                </p>
                <div className="mt-2 space-y-0.5 text-[10px]">
                  <p>
                    <span className="font-medium">BANK NAME:</span>{" "}
                    {seller.bankName}
                  </p>
                  <p>
                    <span className="font-medium">A/C NO:</span>{" "}
                    {seller.bankAccountNo}
                  </p>
                  <p>
                    <span className="font-medium">IFSC CODE:</span>{" "}
                    {seller.bankIfsc}
                  </p>
                  <p>
                    <span className="font-medium">BRANCH:</span>{" "}
                    {seller.bankBranch}
                  </p>
                </div>
              </Cell>
              <Cell colSpan={4} className="h-[132px] align-top">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Declaration
                </p>
                <p className="mt-2 text-[10px] leading-relaxed">
                  {seller.declaration}
                </p>
                <div className="mt-10 flex flex-col items-end text-right">
                  <p className="text-[10px]">for {seller.companyName}</p>
                  <p className="mt-8 border-t border-zinc-400 pt-1 text-[10px] text-zinc-600">
                    Authorised Signatory
                  </p>
                </div>
              </Cell>
            </tr>
          </tbody>
        </table>
      </div>
    </InvoicePreviewScaler>
  );
}
