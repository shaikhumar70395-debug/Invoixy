import { DEFAULT_SELLER } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import { sellerProfileToDb, toSellerProfile } from "@/lib/seller-map";
import type { SellerProfile } from "@/lib/types";
import { getCurrentSession } from "@/app/actions/auth";

export async function getOrCreateSellerSettings(): Promise<SellerProfile> {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;

  if (shopId) {
    const existingForShop = await prisma.sellerSettings.findFirst({
      where: { shopId },
    });
    if (existingForShop) {
      return toSellerProfile(existingForShop);
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    const created = await prisma.sellerSettings.create({
      data: {
        ...sellerProfileToDb({
          ...DEFAULT_SELLER,
          companyName: shop?.name || DEFAULT_SELLER.companyName,
          invoicePrefix: (shop?.slug?.slice(0, 4) || "ECM").toUpperCase(),
        }),
        shopId,
      },
    });
    return toSellerProfile(created);
  }

  const existing = await prisma.sellerSettings.findFirst({ where: { id: 1 } });
  if (existing) {
    return toSellerProfile(existing);
  }

  const created = await prisma.sellerSettings.create({
    data: { id: 1, ...sellerProfileToDb(DEFAULT_SELLER) },
  });

  return toSellerProfile(created);
}

export async function updateSellerSettings(
  profile: SellerProfile,
): Promise<SellerProfile> {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;
  const data = sellerProfileToDb(profile);

  if (shopId) {
    const existing = await prisma.sellerSettings.findFirst({
      where: { shopId },
    });
    if (existing) {
      const updated = await prisma.sellerSettings.update({
        where: { id: existing.id },
        data: { ...data, shopId },
      });
      return toSellerProfile(updated);
    } else {
      const created = await prisma.sellerSettings.create({
        data: { ...data, shopId },
      });
      return toSellerProfile(created);
    }
  }

  const updated = await prisma.sellerSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  return toSellerProfile(updated);
}

