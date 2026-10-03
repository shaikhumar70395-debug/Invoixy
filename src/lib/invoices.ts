import { createEmptyInvoiceDraft } from "@/lib/defaults";
import { roundMoney } from "@/lib/format";
import { calculateInvoiceTotals } from "@/lib/gst";
import {
  formatInvoiceNumber,
  getFinancialYear,
  getNextInvoiceNumber,
} from "@/lib/invoice-number";
import { prisma } from "@/lib/prisma";
import { getOrCreateSellerSettings } from "@/lib/seller";
import { getCurrentSession } from "@/app/actions/auth";
import type { Prisma } from "@/generated/prisma/client";
import type {
  InvoiceDraft,
  InvoiceLineComputed,
  InvoiceTaxBreakup,
  InvoiceTotals,
  PaymentStatus,
  SellerProfile,
  TaxMode,
} from "@/lib/types";

type StoredInvoice = Awaited<ReturnType<typeof getInvoiceRecordById>>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeTaxMode(value: string): TaxMode {
  return value === "inter" ? "inter" : "intra";
}

function normalizePaymentStatus(value: string): PaymentStatus {
  if (value === "paid" || value === "part-paid") return value;
  return "unpaid";
}

function invoiceToDraft(invoice: NonNullable<StoredInvoice>): InvoiceDraft {
  return {
    meta: {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      modeOfPayment: invoice.modeOfPayment,
      buyersOrderNo: invoice.buyersOrderNo,
      dispatchDocNo: invoice.dispatchDocNo,
      deliveryNoteDate: invoice.deliveryNoteDate,
      dispatchedThrough: invoice.dispatchedThrough,
      destination: invoice.destination,
      deliveryAddress: invoice.deliveryAddress,
    },
    buyer: {
      name: invoice.buyerName,
      address: invoice.buyerAddress,
      gstin: invoice.buyerGstin,
      stateName: invoice.buyerStateName,
      stateCode: invoice.buyerStateCode,
    },
    lines: invoice.lines.map((line) => ({
      id: `saved-line-${line.id}`,
      description: line.description,
      hsnSac: line.hsnSac,
      quantity: line.quantity,
      rate: line.rate,
      unit: line.unit,
      discountPercent: line.discountPercent,
      gstRatePercent: line.gstRatePercent,
    })),
    taxMode: normalizeTaxMode(invoice.taxMode),
    gstRatePercent: invoice.gstRatePercent,
    roundOffEnabled: invoice.roundOffEnabled,
  };
}

function buildTaxBreakup(
  invoice: NonNullable<StoredInvoice>,
  lines: InvoiceLineComputed[],
): InvoiceTaxBreakup[] {
  const breakupMap = new Map<number, InvoiceTaxBreakup>();
  for (const line of lines) {
    const existing =
      breakupMap.get(line.gstRatePercent) ??
      ({
        gstRatePercent: line.gstRatePercent,
        taxableAmount: 0,
        cgstRate: invoice.taxMode === "intra" ? line.gstRatePercent / 2 : 0,
        sgstRate: invoice.taxMode === "intra" ? line.gstRatePercent / 2 : 0,
        igstRate: invoice.taxMode === "inter" ? line.gstRatePercent : 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
      } satisfies InvoiceTaxBreakup);
    existing.taxableAmount = roundMoney(existing.taxableAmount + line.amount);
    existing.cgstAmount = roundMoney(existing.cgstAmount + line.cgstAmount);
    existing.sgstAmount = roundMoney(existing.sgstAmount + line.sgstAmount);
    existing.igstAmount = roundMoney(existing.igstAmount + line.igstAmount);
    breakupMap.set(line.gstRatePercent, existing);
  }
  return Array.from(breakupMap.values()).sort(
    (a, b) => a.gstRatePercent - b.gstRatePercent,
  );
}

function invoiceToTotals(invoice: NonNullable<StoredInvoice>): InvoiceTotals {
  const lines: InvoiceLineComputed[] = invoice.lines.map((line) => ({
    id: `saved-line-${line.id}`,
    description: line.description,
    hsnSac: line.hsnSac,
    quantity: line.quantity,
    rate: line.rate,
    unit: line.unit,
    discountPercent: line.discountPercent,
    gstRatePercent: line.gstRatePercent,
    slNo: line.lineOrder,
    amount: line.amount,
    cgstAmount: line.cgstAmount,
    sgstAmount: line.sgstAmount,
    igstAmount: line.igstAmount,
  }));

  return {
    lines,
    totalQuantity: invoice.totalQuantity,
    subtotal: invoice.subtotal,
    cgstRate: invoice.cgstRate,
    sgstRate: invoice.sgstRate,
    igstRate: invoice.igstRate,
    cgstAmount: invoice.cgstAmount,
    sgstAmount: invoice.sgstAmount,
    igstAmount: invoice.igstAmount,
    roundOff: invoice.roundOff,
    grandTotal: invoice.grandTotal,
    amountInWords: invoice.amountInWords,
    taxBreakup: buildTaxBreakup(invoice, lines),
  };
}

async function getInvoiceRecordById(id: number) {
  return prisma.invoice.findUnique({
    where: { id },
    include: { lines: { orderBy: { lineOrder: "asc" } } },
  });
}

async function getNextSequenceNumber(financialYear: string): Promise<number> {
  const sequence = await prisma.invoiceSequence.findUnique({
    where: { financialYear },
  });
  return (sequence?.lastNumber ?? 0) + 1;
}

export async function getPreviewInvoiceNumber(date = new Date()): Promise<string> {
  const seller = await getOrCreateSellerSettings();
  const financialYear = getFinancialYear(date);
  const nextNumber = await getNextSequenceNumber(financialYear);
  return getNextInvoiceNumber(seller.invoicePrefix, financialYear, nextNumber - 1);
}

export async function createNewInvoiceDraft(): Promise<InvoiceDraft> {
  const draft = createEmptyInvoiceDraft();
  return {
    ...draft,
    meta: {
      ...draft.meta,
      invoiceNumber: await getPreviewInvoiceNumber(),
    },
  };
}

export async function createInvoice(draft: InvoiceDraft): Promise<number> {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;
  const seller = await getOrCreateSellerSettings();
  const totals = calculateInvoiceTotals(draft);
  const financialYear = getFinancialYear(new Date(`${draft.meta.invoiceDate}T00:00:00`));

  const invoice = await prisma.$transaction(async (tx) => {
    const sequence = await tx.invoiceSequence.upsert({
      where: { financialYear },
      create: { financialYear, lastNumber: 1, shopId },
      update: { lastNumber: { increment: 1 } },
    });
    const invoiceNumber = formatInvoiceNumber(
      seller.invoicePrefix,
      financialYear,
      sequence.lastNumber,
    );

    return tx.invoice.create({
      data: {
        invoiceNumber,
        financialYear,
        sequenceNumber: sequence.lastNumber,
        shopId,
        invoiceDate: draft.meta.invoiceDate,
        dueDate: draft.meta.dueDate,
        modeOfPayment: draft.meta.modeOfPayment,
        buyersOrderNo: draft.meta.buyersOrderNo,
        dispatchDocNo: draft.meta.dispatchDocNo,
        deliveryNoteDate: draft.meta.deliveryNoteDate,
        dispatchedThrough: draft.meta.dispatchedThrough,
        destination: draft.meta.destination,
        deliveryAddress: draft.meta.deliveryAddress,
        buyerName: draft.buyer.name,
        buyerAddress: draft.buyer.address,
        buyerGstin: draft.buyer.gstin,
        buyerStateName: draft.buyer.stateName,
        buyerStateCode: draft.buyer.stateCode,
        taxMode: draft.taxMode,
        gstRatePercent: draft.gstRatePercent,
        roundOffEnabled: draft.roundOffEnabled,
        totalQuantity: totals.totalQuantity,
        subtotal: totals.subtotal,
        cgstRate: totals.cgstRate,
        sgstRate: totals.sgstRate,
        igstRate: totals.igstRate,
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        amountInWords: totals.amountInWords,
        paymentStatus: "unpaid",
        paidAmount: 0,
        lines: {
          create: totals.lines.map((line) => ({
            lineOrder: line.slNo,
            description: line.description,
            hsnSac: line.hsnSac,
            quantity: line.quantity,
            rate: roundMoney(line.rate),
            unit: line.unit,
            discountPercent: line.discountPercent,
            gstRatePercent: line.gstRatePercent,
            cgstAmount: line.cgstAmount,
            sgstAmount: line.sgstAmount,
            igstAmount: line.igstAmount,
            amount: line.amount,
          })),
        },
      },
      select: { id: true },
    });
  });

  return invoice.id;
}

function buildInvoiceUpdateData(
  draft: InvoiceDraft,
  totals: InvoiceTotals,
): Parameters<typeof prisma.invoice.update>[0]["data"] {
  return {
    invoiceDate: draft.meta.invoiceDate,
    dueDate: draft.meta.dueDate,
    modeOfPayment: draft.meta.modeOfPayment,
    buyersOrderNo: draft.meta.buyersOrderNo,
    dispatchDocNo: draft.meta.dispatchDocNo,
    deliveryNoteDate: draft.meta.deliveryNoteDate,
    dispatchedThrough: draft.meta.dispatchedThrough,
    destination: draft.meta.destination,
    deliveryAddress: draft.meta.deliveryAddress,
    buyerName: draft.buyer.name,
    buyerAddress: draft.buyer.address,
    buyerGstin: draft.buyer.gstin,
    buyerStateName: draft.buyer.stateName,
    buyerStateCode: draft.buyer.stateCode,
    taxMode: draft.taxMode,
    gstRatePercent: draft.gstRatePercent,
    roundOffEnabled: draft.roundOffEnabled,
    totalQuantity: totals.totalQuantity,
    subtotal: totals.subtotal,
    cgstRate: totals.cgstRate,
    sgstRate: totals.sgstRate,
    igstRate: totals.igstRate,
    cgstAmount: totals.cgstAmount,
    sgstAmount: totals.sgstAmount,
    igstAmount: totals.igstAmount,
    roundOff: totals.roundOff,
    grandTotal: totals.grandTotal,
    amountInWords: totals.amountInWords,
  };
}

function buildLineCreateData(totals: InvoiceTotals) {
  return totals.lines.map((line) => ({
    lineOrder: line.slNo,
    description: line.description,
    hsnSac: line.hsnSac,
    quantity: line.quantity,
    rate: roundMoney(line.rate),
    unit: line.unit,
    discountPercent: line.discountPercent,
    gstRatePercent: line.gstRatePercent,
    cgstAmount: line.cgstAmount,
    sgstAmount: line.sgstAmount,
    igstAmount: line.igstAmount,
    amount: line.amount,
  }));
}

export async function updateInvoice(
  id: number,
  draft: InvoiceDraft,
): Promise<number> {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, paymentStatus: true, paidAmount: true },
  });
  if (!existing) {
    throw new Error("Invoice not found");
  }

  const totals = calculateInvoiceTotals(draft);
  const paymentStatus = normalizePaymentStatus(existing.paymentStatus);
  const paidAmount =
    paymentStatus === "paid"
      ? totals.grandTotal
      : paymentStatus === "unpaid"
        ? 0
        : Math.min(totals.grandTotal, Math.max(0, existing.paidAmount));

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.update({
      where: { id },
      data: {
        ...buildInvoiceUpdateData(draft, totals),
        paidAmount,
        lines: {
          create: buildLineCreateData(totals),
        },
      },
    });
  });

  return id;
}

export async function deleteInvoice(id: number): Promise<void> {
  await prisma.invoice.delete({ where: { id } });
}

export async function getInvoiceForPreview(id: number): Promise<{
  draft: InvoiceDraft;
  totals: InvoiceTotals;
  seller: SellerProfile;
  payment: {
    paymentStatus: PaymentStatus;
    paidAmount: number;
    paymentDate: string;
    paymentMethod: string;
    paymentNotes: string;
  };
} | null> {
  const [invoice, seller] = await Promise.all([
    getInvoiceRecordById(id),
    getOrCreateSellerSettings(),
  ]);
  if (!invoice) return null;
  return {
    draft: invoiceToDraft(invoice),
    totals: invoiceToTotals(invoice),
    seller,
    payment: {
      paymentStatus: normalizePaymentStatus(invoice.paymentStatus),
      paidAmount: invoice.paidAmount,
      paymentDate: invoice.paymentDate,
      paymentMethod: invoice.paymentMethod,
      paymentNotes: invoice.paymentNotes,
    },
  };
}

export async function createDuplicateDraft(id: number): Promise<InvoiceDraft | null> {
  const invoice = await getInvoiceRecordById(id);
  if (!invoice) return null;
  const draft = invoiceToDraft(invoice);
  return {
    ...draft,
    meta: {
      ...draft.meta,
      invoiceNumber: await getPreviewInvoiceNumber(),
      invoiceDate: todayIso(),
    },
  };
}

export type InvoiceFilters = {
  q?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  buyerName?: string;
  buyerStateName?: string;
};

export async function listInvoices(queryOrFilters: string | InvoiceFilters = "") {
  let filters: InvoiceFilters = {};
  if (typeof queryOrFilters === "string") {
    filters = { q: queryOrFilters };
  } else {
    filters = queryOrFilters;
  }

  const { q, startDate, endDate, paymentStatus, buyerName, buyerStateName } = filters;
  const andConditions: Prisma.InvoiceWhereInput[] = [];

  const session = await getCurrentSession();
  const shopId = session?.activeShopId;
  if (shopId) {
    andConditions.push({ shopId });
  }

  if (q && q.trim()) {
    const term = q.trim();
    andConditions.push({
      OR: [
        { invoiceNumber: { contains: term } },
        { buyerName: { contains: term } },
        { buyerGstin: { contains: term } },
        { invoiceDate: { contains: term } },
      ],
    });
  }

  if (startDate) {
    andConditions.push({
      invoiceDate: { gte: startDate },
    });
  }
  if (endDate) {
    andConditions.push({
      invoiceDate: { lte: endDate },
    });
  }

  if (paymentStatus && paymentStatus !== "all") {
    andConditions.push({
      paymentStatus: paymentStatus,
    });
  }
  if (buyerName && buyerName.trim()) {
    andConditions.push({
      buyerName: { contains: buyerName.trim() },
    });
  }
  if (buyerStateName && buyerStateName !== "all") {
    andConditions.push({
      buyerStateName: buyerStateName,
    });
  }

  return prisma.invoice.findMany({
    where: andConditions.length > 0 ? { AND: andConditions } : undefined,
    orderBy: [{ invoiceDate: "desc" }, { id: "desc" }],
    take: 100,
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      dueDate: true,
      buyerName: true,
      buyerGstin: true,
      paymentStatus: true,
      paidAmount: true,
      grandTotal: true,
      createdAt: true,
    },
  });
}

export async function updateInvoicePayment(
  id: number,
  payment: {
    paymentStatus: PaymentStatus;
    paidAmount: number;
    paymentDate: string;
    paymentMethod: string;
    paymentNotes: string;
  },
) {
  return prisma.invoice.update({
    where: { id },
    data: {
      paymentStatus: payment.paymentStatus,
      paidAmount: roundMoney(payment.paidAmount),
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      paymentNotes: payment.paymentNotes,
    },
  });
}

export async function getDashboardStats() {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;
  const shopCondition: Prisma.InvoiceWhereInput = shopId ? { shopId } : {};

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const monthPrefix = todayIso.slice(0, 7);

  // Build trailing 6 month prefixes (YYYY-MM)
  const monthPrefixes: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthPrefixes.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const [totals, monthTotals, recentInvoices, topCustomersRaw, allUnpaid, monthlyRaw] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: shopCondition,
        _count: true,
        _sum: { grandTotal: true, paidAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...shopCondition, invoiceDate: { startsWith: monthPrefix } },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.findMany({
        where: shopCondition,
        orderBy: [{ invoiceDate: "desc" }, { id: "desc" }],
        take: 8,
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          dueDate: true,
          buyerName: true,
          grandTotal: true,
          paidAmount: true,
          paymentStatus: true,
        },
      }),
      prisma.invoice.groupBy({
        where: shopCondition,
        by: ["buyerName"],
        _sum: { grandTotal: true },
        orderBy: { _sum: { grandTotal: "desc" } },
        take: 5,
      }),
      // All unpaid/part-paid invoices with a dueDate set (for aging)
      // All unpaid/part-paid invoices with a dueDate set (for aging)
      prisma.invoice.findMany({
        where: {
          ...shopCondition,
          paymentStatus: { in: ["unpaid", "part-paid"] },
          NOT: { dueDate: "" },
        },
        select: { dueDate: true, grandTotal: true, paidAmount: true },
      }),
      // Invoices for all chart periods (fetched in one query, filtered in JS)
      prisma.invoice.findMany({
        where: shopCondition,
        select: { invoiceDate: true, grandTotal: true, paidAmount: true },
        orderBy: { invoiceDate: "asc" },
      }),
    ]);

  const totalBilled = roundMoney(totals._sum.grandTotal ?? 0);
  const totalCollected = roundMoney(totals._sum.paidAmount ?? 0);

  // ── Multi-period revenue chart computation (Daily, Weekly, Monthly, Yearly) ──
  const latestDateStr = monthlyRaw.length ? monthlyRaw[monthlyRaw.length - 1].invoiceDate : todayIso;
  const baseDate = latestDateStr > todayIso ? new Date(latestDateStr) : today;

  // Daily (Last 14 days)
  const daily: Array<{ label: string; billed: number; collected: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const rows = monthlyRaw.filter((r) => r.invoiceDate === dateStr);
    daily.push({
      label,
      billed: roundMoney(rows.reduce((s, r) => s + r.grandTotal, 0)),
      collected: roundMoney(rows.reduce((s, r) => s + r.paidAmount, 0)),
    });
  }

  // Weekly (Last 8 weeks)
  const weekly: Array<{ label: string; billed: number; collected: number }> = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (i * 7 + 6));
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - i * 7);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    const label = `${start.getDate()} ${start.toLocaleDateString("en-IN", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("en-IN", { month: "short" })}`;
    const rows = monthlyRaw.filter((r) => r.invoiceDate >= startStr && r.invoiceDate <= endStr);
    weekly.push({
      label,
      billed: roundMoney(rows.reduce((s, r) => s + r.grandTotal, 0)),
      collected: roundMoney(rows.reduce((s, r) => s + r.paidAmount, 0)),
    });
  }

  // Monthly (Trailing 12 months)
  const monthly: Array<{ label: string; billed: number; collected: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    const rows = monthlyRaw.filter((r) => r.invoiceDate.startsWith(prefix));
    monthly.push({
      label,
      billed: roundMoney(rows.reduce((s, r) => s + r.grandTotal, 0)),
      collected: roundMoney(rows.reduce((s, r) => s + r.paidAmount, 0)),
    });
  }

  // Yearly (Trailing 4 years)
  const yearly: Array<{ label: string; billed: number; collected: number }> = [];
  const curYear = baseDate.getFullYear();
  for (let y = curYear - 3; y <= curYear; y++) {
    const prefix = String(y);
    const label = `FY ${String(y).slice(-2)}-${String(y + 1).slice(-2)}`;
    const rows = monthlyRaw.filter((r) => r.invoiceDate.startsWith(prefix));
    yearly.push({
      label,
      billed: roundMoney(rows.reduce((s, r) => s + r.grandTotal, 0)),
      collected: roundMoney(rows.reduce((s, r) => s + r.paidAmount, 0)),
    });
  }

  const chartData = { daily, weekly, monthly, yearly };

  // ── Payment aging buckets ────────────────────────────────────────────
  const agingBuckets = [
    { label: "0–30d", minDays: 0, maxDays: 30, amount: 0, count: 0 },
    { label: "31–60d", minDays: 31, maxDays: 60, amount: 0, count: 0 },
    { label: "61–90d", minDays: 61, maxDays: 90, amount: 0, count: 0 },
    { label: ">90d", minDays: 91, maxDays: Infinity, amount: 0, count: 0 },
  ];
  let overdueCount = 0;
  for (const inv of allUnpaid) {
    if (!inv.dueDate || inv.dueDate > todayIso) continue; // not yet due
    overdueCount++;
    const dueMs = new Date(inv.dueDate).getTime();
    const nowMs = today.getTime();
    const daysOverdue = Math.floor((nowMs - dueMs) / 86_400_000);
    const outstanding = roundMoney(inv.grandTotal - inv.paidAmount);
    const bucket = agingBuckets.find(
      (b) => daysOverdue >= b.minDays && daysOverdue <= b.maxDays,
    );
    if (bucket) {
      bucket.amount = roundMoney(bucket.amount + outstanding);
      bucket.count++;
    }
  }

  return {
    invoiceCount: totals._count,
    totalBilled,
    totalCollected,
    outstanding: roundMoney(totalBilled - totalCollected),
    monthBilled: roundMoney(monthTotals._sum.grandTotal ?? 0),
    overdueCount,
    recentInvoices,
    topCustomers: topCustomersRaw.map((row) => ({
      name: row.buyerName || "Unknown buyer",
      total: roundMoney(row._sum.grandTotal ?? 0),
    })),
    monthlyRevenue: monthly.slice(-6),
    chartData,
    agingBuckets,
  };
}

export async function listInvoicesForExport(filters?: {
  buyerName?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  q?: string;
}) {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;
  const andConditions: Prisma.InvoiceWhereInput[] = [];

  if (shopId) {
    andConditions.push({ shopId });
  }

  if (filters?.buyerName && filters.buyerName.trim()) {
    andConditions.push({
      buyerName: { contains: filters.buyerName.trim() },
    });
  }

  if (filters?.q && filters.q.trim()) {
    const term = filters.q.trim();
    andConditions.push({
      OR: [
        { invoiceNumber: { contains: term } },
        { buyerName: { contains: term } },
        { buyerGstin: { contains: term } },
      ],
    });
  }

  if (filters?.startDate) {
    andConditions.push({ invoiceDate: { gte: filters.startDate } });
  }

  if (filters?.endDate) {
    andConditions.push({ invoiceDate: { lte: filters.endDate } });
  }

  if (filters?.paymentStatus && filters.paymentStatus !== "all") {
    andConditions.push({ paymentStatus: filters.paymentStatus });
  }

  return prisma.invoice.findMany({
    where: andConditions.length > 0 ? { AND: andConditions } : undefined,
    orderBy: [{ invoiceDate: "desc" }, { id: "desc" }],
    include: { lines: { orderBy: { lineOrder: "asc" } } },
  });
}
