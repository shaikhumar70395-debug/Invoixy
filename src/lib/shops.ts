import { prisma } from "@/lib/prisma";
import { DEFAULT_SELLER } from "@/lib/defaults";
import { sellerProfileToDb } from "@/lib/seller-map";

export interface ShopInfo {
  id: string;
  name: string;
  slug: string;
  role?: string;
  isCurrent?: boolean;
}

/**
 * Ensures at least one default shop exists and existing unassigned records belong to it.
 */
export async function getOrCreateDefaultShop(): Promise<ShopInfo> {
  let shop = await prisma.shop.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!shop) {
    const defaultName = DEFAULT_SELLER.companyName || "Main Store";
    const slug = "main-store";

    shop = await prisma.shop.create({
      data: {
        name: defaultName,
        slug,
      },
    });

    // Link existing seller settings if present
    const existingSeller = await prisma.sellerSettings.findFirst({ where: { id: 1 } });
    if (existingSeller && !existingSeller.shopId) {
      await prisma.sellerSettings.update({
        where: { id: 1 },
        data: { shopId: shop.id },
      });
    } else if (!existingSeller) {
      await prisma.sellerSettings.create({
        data: {
          id: 1,
          ...sellerProfileToDb(DEFAULT_SELLER),
          shopId: shop.id,
        },
      });
    }

    // Attach any existing invoices, customers, products to this shop
    await prisma.invoice.updateMany({
      where: { shopId: null },
      data: { shopId: shop.id },
    });

    await prisma.customer.updateMany({
      where: { shopId: null },
      data: { shopId: shop.id },
    });

    await prisma.product.updateMany({
      where: { shopId: null },
      data: { shopId: shop.id },
    });
  }

  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
  };
}

/**
 * Gets all shops associated with a user, or returns all shops if single-tenant fallback.
 */
export async function getUserShops(userId?: string): Promise<ShopInfo[]> {
  if (!userId) {
    const all = await prisma.shop.findMany({ orderBy: { createdAt: "asc" } });
    if (all.length === 0) {
      const def = await getOrCreateDefaultShop();
      return [def];
    }
    return all.map((s) => ({ id: s.id, name: s.name, slug: s.slug }));
  }

  const memberships = await prisma.shopMember.findMany({
    where: { userId },
    include: { shop: true },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    id: m.shop.id,
    name: m.shop.name,
    slug: m.shop.slug,
    role: m.role,
  }));
}

/**
 * Creates a new shop for a user with clean seller profile and isolated data.
 */
export async function createShopForUser(name: string, userId: string): Promise<ShopInfo> {
  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).slice(2, 6);
  const prefix = cleanName.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "INV";

  const shop = await prisma.shop.create({
    data: {
      name: cleanName,
      slug,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      sellerProfile: {
        create: {
          companyName: cleanName,
          address: "",
          pan: "",
          gstin: "",
          stateName: "",
          stateCode: "",
          phone: "",
          bankName: "",
          bankAccountNo: "",
          bankIfsc: "",
          bankBranch: "",
          declaration:
            "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
          invoicePrefix: prefix,
          logoDataUrl: "",
        },
      },
    },
  });

  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    role: "OWNER",
  };
}
