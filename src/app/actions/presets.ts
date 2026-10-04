"use server";

import {
  deleteCustomerPreset,
  deleteProductPreset,
  saveCustomerPreset,
  saveProductPreset,
} from "@/lib/presets";
import type { CustomerPreset, ProductPreset } from "@/lib/types";
import { CustomerPresetSchema, ProductPresetSchema } from "@/lib/schema";
import { revalidatePath } from "next/cache";

function formString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function formNumber(formData: FormData, key: string): number {
  return Number(formData.get(key) ?? 0) || 0;
}

export async function saveCustomerPresetAction(
  customer: Omit<CustomerPreset, "id"> & { id?: number },
) {
  try {
    const parsed = CustomerPresetSchema.safeParse(customer);
    if (!parsed.success) {
      console.error("Validation failed for saveCustomerPreset:", parsed.error);
      return { ok: false, error: "Invalid customer data." };
    }
    await saveCustomerPreset(parsed.data);
    revalidatePath("/customers");
    revalidatePath("/invoices/new");
    return { ok: true };
  } catch (error) {
    console.error("saveCustomerPresetAction crashed:", error);
    return { ok: false, error: "Failed to save customer." };
  }
}

export async function saveProductPresetAction(
  product: Omit<ProductPreset, "id"> & { id?: number },
) {
  try {
    const parsed = ProductPresetSchema.safeParse(product);
    if (!parsed.success) {
      console.error("Validation failed for saveProductPreset:", parsed.error);
      return { ok: false, error: "Invalid product data." };
    }
    await saveProductPreset(parsed.data);
    revalidatePath("/products");
    revalidatePath("/invoices/new");
    return { ok: true };
  } catch (error) {
    console.error("saveProductPresetAction crashed:", error);
    return { ok: false, error: "Failed to save product." };
  }
}

export async function saveCustomerFormAction(formData: FormData) {
  try {
    const data = {
      id: formData.get("id") ? formNumber(formData, "id") : undefined,
      name: formString(formData, "name"),
      address: formString(formData, "address"),
      gstin: formString(formData, "gstin"),
      stateName: formString(formData, "stateName"),
      stateCode: formString(formData, "stateCode"),
    };
    const parsed = CustomerPresetSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Validation failed for saveCustomerForm:", parsed.error);
      throw new Error("Invalid customer data");
    }
    await saveCustomerPreset(parsed.data);
    revalidatePath("/customers");
    revalidatePath("/invoices/new");
  } catch (error) {
    console.error("saveCustomerFormAction crashed:", error);
    throw error;
  }
}

export async function saveProductFormAction(formData: FormData) {
  try {
    const data = {
      id: formData.get("id") ? formNumber(formData, "id") : undefined,
      description: formString(formData, "description"),
      hsnSac: formString(formData, "hsnSac"),
      unit: formString(formData, "unit"),
      defaultRate: formNumber(formData, "defaultRate"),
      defaultGstRatePercent: formNumber(formData, "defaultGstRatePercent"),
    };
    const parsed = ProductPresetSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Validation failed for saveProductForm:", parsed.error);
      throw new Error("Invalid product data");
    }
    await saveProductPreset(parsed.data);
    revalidatePath("/products");
    revalidatePath("/invoices/new");
  } catch (error) {
    console.error("saveProductFormAction crashed:", error);
    throw error;
  }
}

export async function deleteCustomerPresetAction(id: number) {
  try {
    await deleteCustomerPreset(id);
    revalidatePath("/customers");
    revalidatePath("/invoices/new");
    return { ok: true };
  } catch (error) {
    console.error("deleteCustomerPresetAction crashed:", error);
    return { ok: false, error: "Failed to delete customer preset." };
  }
}

export async function deleteProductPresetAction(id: number) {
  try {
    await deleteProductPreset(id);
    revalidatePath("/products");
    revalidatePath("/invoices/new");
    return { ok: true };
  } catch (error) {
    console.error("deleteProductPresetAction crashed:", error);
    return { ok: false, error: "Failed to delete product preset." };
  }
}

export async function deleteCustomerFormAction(formData: FormData) {
  try {
    await deleteCustomerPreset(formNumber(formData, "id"));
    revalidatePath("/customers");
    revalidatePath("/invoices/new");
  } catch (error) {
    console.error("deleteCustomerFormAction crashed:", error);
    throw error;
  }
}

export async function deleteProductFormAction(formData: FormData) {
  try {
    await deleteProductPreset(formNumber(formData, "id"));
    revalidatePath("/products");
    revalidatePath("/invoices/new");
  } catch (error) {
    console.error("deleteProductFormAction crashed:", error);
    throw error;
  }
}
