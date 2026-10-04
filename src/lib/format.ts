/** Round to 2 decimal places (paise). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number): string {
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format currency with ASCII 'Rs.' prefix, e.g. "Rs. 1,299.00" or "Rs. -0.08" (safe for standard PDF fonts and clean UI) */
export function formatRs(value: number): string {
  const isNeg = value < 0;
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNeg ? `Rs. -${formatted}` : `Rs. ${formatted}`;
}

/** Format numeric quantity without currency symbol */
export function formatQuantity(value: number): string {
  if (value % 1 === 0) {
    return String(value);
  }
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}
