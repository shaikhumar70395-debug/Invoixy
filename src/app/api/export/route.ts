import { listInvoicesForExport } from "@/lib/invoices";

export const dynamic = "force-dynamic";

function escapeCSV(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyer = searchParams.get("buyer")?.trim() || undefined;
    const q = searchParams.get("q")?.trim() || undefined;
    const startDate = searchParams.get("startDate")?.trim() || undefined;
    const endDate = searchParams.get("endDate")?.trim() || undefined;
    const status = searchParams.get("status")?.trim() || undefined;

    const invoices = await listInvoicesForExport({
      buyerName: buyer,
      q,
      startDate,
      endDate,
      paymentStatus: status,
    });

    const headers = [
      "Invoice Number",
      "Invoice Date",
      "Buyer Name",
      "Buyer GSTIN",
      "Buyer State",
      "Tax Mode",
      "Default GST Rate (%)",
      "Total Quantity",
      "Subtotal",
      "CGST Amount",
      "SGST Amount",
      "IGST Amount",
      "Round Off",
      "Grand Total",
      "Payment Status",
      "Paid Amount",
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.invoiceDate,
      inv.buyerName,
      inv.buyerGstin,
      `${inv.buyerStateName} (${inv.buyerStateCode})`,
      inv.taxMode,
      inv.gstRatePercent,
      inv.totalQuantity,
      inv.subtotal,
      inv.cgstAmount,
      inv.sgstAmount,
      inv.igstAmount,
      inv.roundOff,
      inv.grandTotal,
      inv.paymentStatus,
      inv.paidAmount,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join(
        "\r\n",
      );

    const sanitizedBuyer = buyer ? buyer.replace(/[^a-zA-Z0-9_-]/g, "_") : "";
    const filename = sanitizedBuyer
      ? `invoices_${sanitizedBuyer}.csv`
      : "gst_invoices_export.csv";

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch {
    return new Response("Could not generate CSV report.", { status: 500 });
  }
}
