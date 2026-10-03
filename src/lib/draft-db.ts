/**
 * Server-side draft persistence.
 *
 * Stores a single in-progress invoice draft as a JSON blob in the
 * InvoiceDraftRecord table (singleton row id=1). This replaces the
 * previous browser localStorage approach, meaning the draft survives
 * browser clears, incognito tabs, and page refreshes.
 *
 * Only used for the "new invoice" flow — edit mode uses the saved invoice directly.
 */

import { prisma } from "@/lib/prisma";
import type { InvoiceDraft } from "@/lib/types";
import { getCurrentSession } from "@/app/actions/auth";

export async function loadDraftFromDb(): Promise<InvoiceDraft | null> {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;

  const record = shopId
    ? await prisma.invoiceDraftRecord.findFirst({
        where: { shopId },
        select: { draftJson: true },
      })
    : await prisma.invoiceDraftRecord.findUnique({
        where: { id: 1 },
        select: { draftJson: true },
      });

  if (!record || !record.draftJson || record.draftJson === "{}") return null;
  try {
    return JSON.parse(record.draftJson) as InvoiceDraft;
  } catch {
    return null;
  }
}

export async function saveDraftToDb(draft: InvoiceDraft): Promise<void> {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;

  if (shopId) {
    const existing = await prisma.invoiceDraftRecord.findFirst({ where: { shopId } });
    if (existing) {
      await prisma.invoiceDraftRecord.update({
        where: { id: existing.id },
        data: { draftJson: JSON.stringify(draft) },
      });
    } else {
      await prisma.invoiceDraftRecord.create({
        data: { draftJson: JSON.stringify(draft), shopId },
      });
    }
    return;
  }

  await prisma.invoiceDraftRecord.upsert({
    where: { id: 1 },
    create: { id: 1, draftJson: JSON.stringify(draft) },
    update: { draftJson: JSON.stringify(draft) },
  });
}

export async function clearDraftFromDb(): Promise<void> {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;

  if (shopId) {
    const existing = await prisma.invoiceDraftRecord.findFirst({ where: { shopId } });
    if (existing) {
      await prisma.invoiceDraftRecord.update({
        where: { id: existing.id },
        data: { draftJson: "{}" },
      });
    }
    return;
  }

  await prisma.invoiceDraftRecord.upsert({
    where: { id: 1 },
    create: { id: 1, draftJson: "{}" },
    update: { draftJson: "{}" },
  });
}

