import type { InvoiceDraft, SellerProfile } from "@/lib/types";

export const DEFAULT_SELLER: SellerProfile = {
  companyName: "Apex Electronics & Appliances",
  address: "Shop No. 12-14, Phoenix Galleria Mall, LBS Marg, Kurla West, Mumbai, Maharashtra 400070",
  pan: "AAEPA4829G",
  gstin: "27AAEPA4829G1Z4",
  stateName: "MAHARASHTRA",
  stateCode: "27",
  phone: "9820477319",
  bankName: "HDFC BANK",
  bankAccountNo: "50200084920194",
  bankIfsc: "HDFC0000128",
  bankBranch: "KURLA WEST",
  declaration:
    "We declare that this invoice shows the actual price of the electronic goods described and that all particulars are true and correct. Goods once sold are covered under respective manufacturer warranty.",
  invoicePrefix: "APEX",
  logoDataUrl: "",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createEmptyLine(id?: string) {
  return {
    id: id ?? crypto.randomUUID(),
    description: "",
    hsnSac: "",
    quantity: 0,
    rate: 0,
    unit: "Nos",
    discountPercent: 0,
    gstRatePercent: 18,
  };
}

export function createSampleInvoiceDraft(): InvoiceDraft {
  return {
    meta: {
      invoiceNumber: "APEX/26-27/001",
      invoiceDate: "2026-05-15",
      dueDate: "2026-06-14",
      modeOfPayment: "UPI / Card",
      buyersOrderNo: "ORD-2026-089",
      dispatchDocNo: "",
      deliveryNoteDate: "",
      dispatchedThrough: "In-Store Pickup",
      destination: "Mumbai",
      deliveryAddress: "",
    },
    buyer: {
      name: "Rahul Sharma",
      address: "Flat 402, Building 3, Greenfield Heights, Andheri West, Mumbai, Maharashtra 400053",
      gstin: "27AAEPS8912P1ZV",
      stateName: "MAHARASHTRA",
      stateCode: "27",
    },
    lines: [
      {
        id: "sample-line-1",
        description: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        hsnSac: "85183000",
        quantity: 1,
        rate: 26990,
        unit: "Nos",
        discountPercent: 0,
        gstRatePercent: 18,
      },
      {
        id: "sample-line-2",
        description: "Boat Airdopes 141 Bluetooth True Wireless Earbuds",
        hsnSac: "85183000",
        quantity: 2,
        rate: 1299,
        unit: "Nos",
        discountPercent: 5,
        gstRatePercent: 18,
      }
    ],
    taxMode: "intra",
    gstRatePercent: 18,
    roundOffEnabled: true,
  };
}

export function createEmptyInvoiceDraft(): InvoiceDraft {
  return {
    meta: {
      invoiceNumber: "",
      invoiceDate: todayIso(),
      dueDate: plusDaysIso(30),
      modeOfPayment: "",
      buyersOrderNo: "",
      dispatchDocNo: "",
      deliveryNoteDate: "",
      dispatchedThrough: "",
      destination: "",
      deliveryAddress: "",
    },
    buyer: {
      name: "",
      address: "",
      gstin: "",
      stateName: "",
      stateCode: "",
    },
    lines: [createEmptyLine("line-1")],
    taxMode: "intra",
    gstRatePercent: 5,
    roundOffEnabled: true,
  };
}
