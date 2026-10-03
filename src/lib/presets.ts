import { roundMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { CustomerPreset, ProductPreset } from "@/lib/types";
import { getCurrentSession } from "@/app/actions/auth";

export async function listCustomers(query = ""): Promise<CustomerPreset[]> {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;
  const q = query.trim();

  const whereConditions: any[] = [];
  if (shopId) whereConditions.push({ shopId });
  if (q) {
    whereConditions.push({
      OR: [
        { name: { contains: q } },
        { gstin: { contains: q } },
        { stateName: { contains: q } },
      ],
    });
  }

  return prisma.customer.findMany({
    where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 200,
  });
}

export async function listProducts(query = ""): Promise<ProductPreset[]> {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;
  const q = query.trim();

  const whereConditions: any[] = [];
  if (shopId) whereConditions.push({ shopId });
  if (q) {
    whereConditions.push({
      OR: [
        { description: { contains: q } },
        { hsnSac: { contains: q } },
        { unit: { contains: q } },
      ],
    });
  }

  return prisma.product.findMany({
    where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
    orderBy: [{ description: "asc" }, { id: "asc" }],
    take: 200,
  });
}

export async function saveCustomerPreset(
  customer: Omit<CustomerPreset, "id"> & { id?: number },
) {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;

  const data = {
    name: customer.name.trim(),
    address: customer.address.trim(),
    gstin: customer.gstin.trim().toUpperCase(),
    stateName: customer.stateName.trim(),
    stateCode: customer.stateCode.trim(),
    shopId,
  };
  if (customer.id) {
    return prisma.customer.update({ where: { id: customer.id }, data });
  }

  const existing = data.gstin
    ? await prisma.customer.findFirst({
        where: { gstin: data.gstin, ...(shopId ? { shopId } : {}) },
      })
    : await prisma.customer.findFirst({
        where: { name: data.name, address: data.address, ...(shopId ? { shopId } : {}) },
      });
  if (existing) return prisma.customer.update({ where: { id: existing.id }, data });
  return prisma.customer.create({ data });
}

export async function saveProductPreset(
  product: Omit<ProductPreset, "id"> & { id?: number },
) {
  const session = await getCurrentSession();
  const shopId = session?.activeShopId;

  const data = {
    description: product.description.trim(),
    hsnSac: product.hsnSac.trim(),
    unit: product.unit.trim() || "Nos",
    defaultRate: roundMoney(product.defaultRate),
    defaultGstRatePercent: Number(product.defaultGstRatePercent) || 0,
    shopId,
  };
  if (product.id) {
    return prisma.product.update({ where: { id: product.id }, data });
  }

  const existing = await prisma.product.findFirst({
    where: { description: data.description, hsnSac: data.hsnSac, ...(shopId ? { shopId } : {}) },
  });
  if (existing) return prisma.product.update({ where: { id: existing.id }, data });
  return prisma.product.create({ data });
}

export async function deleteCustomerPreset(id: number) {
  return prisma.customer.delete({ where: { id } });
}

export async function deleteProductPreset(id: number) {
  return prisma.product.delete({ where: { id } });
}

