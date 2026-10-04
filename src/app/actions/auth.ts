"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, signToken, verifyToken, type UserSession } from "@/lib/auth";
import { getOrCreateDefaultShop, getUserShops, createShopForUser } from "@/lib/shops";
import { SetupSecuritySchema, LoginSchema, UpdateSecuritySchema } from "@/lib/schema";

const COOKIE_NAME = "auth-token";

export async function checkSecuritySetup() {
  try {
    const settings = await prisma.securitySettings.findFirst();
    if (!settings) {
      return { isSetup: false, authEnabled: true, authType: "PIN", hasRecoveryCode: false, autoLockMinutes: 15 };
    }
    return {
      isSetup: !!settings.authHash,
      authEnabled: settings.authEnabled,
      authType: settings.authType,
      hasRecoveryCode: !!settings.recoveryHash,
      autoLockMinutes: settings.autoLockMinutes,
    };
  } catch (error) {
    console.error("Failed to check security setup:", error);
    return { isSetup: false, authEnabled: true, authType: "PIN", hasRecoveryCode: false, autoLockMinutes: 15 };
  }
}

export async function setupSecurity(formData: FormData) {
  const parsed = SetupSecuritySchema.safeParse({
    credential: formData.get("credential"),
    authType: formData.get("authType"),
  });

  if (!parsed.success) {
    console.error("Validation failed for setupSecurity:", parsed.error);
    return { error: "Valid credential and authType are required." };
  }
  
  const { credential, authType } = parsed.data;

  try {
    const settings = await prisma.securitySettings.findFirst();
    if (settings?.authHash) {
      return { error: "Security is already set up." };
    }

    const hashedCredential = await hashPassword(credential);

    if (settings) {
      await prisma.securitySettings.update({
        where: { id: settings.id },
        data: { authHash: hashedCredential, authType },
      });
    } else {
      await prisma.securitySettings.create({
        data: { authHash: hashedCredential, authType },
      });
    }

    // Set cookie and login with default shop
    const def = await getOrCreateDefaultShop();
    const session: UserSession = {
      activeShopId: def.id,
      activeShopName: def.name,
      role: "OWNER",
    };
    const token = await signToken(session);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

  } catch (error) {
    console.error("Setup failed:", error);
    return { error: "Failed to set up security." };
  }

  redirect("/");
}

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    credential: formData.get("credential"),
  });
  
  if (!parsed.success) {
    console.error("Validation failed for login:", parsed.error);
    return { error: "Credential is required." };
  }
  
  const { credential } = parsed.data;

  try {
    const settings = await prisma.securitySettings.findFirst();
    if (!settings || !settings.authHash) {
      return { error: "App not set up yet." };
    }

    const isValid = await verifyPassword(credential, settings.authHash);
    
    if (!isValid) {
      return { error: "Invalid credential." };
    }

    const def = await getOrCreateDefaultShop();
    const session: UserSession = {
      activeShopId: def.id,
      activeShopName: def.name,
      role: "OWNER",
    };
    const token = await signToken(session);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

  } catch (error) {
    console.error("Login failed:", error);
    return { error: "An error occurred during login." };
  }

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}

export async function updateSecurity(formData: FormData) {
  const parsed = UpdateSecuritySchema.safeParse({
    currentCredential: formData.get("currentCredential"),
    newCredential: formData.get("newCredential"),
    newAuthType: formData.get("newAuthType"),
  });

  if (!parsed.success) {
    console.error("Validation failed for updateSecurity:", parsed.error);
    return { error: "All fields are required and must be valid." };
  }
  
  const { currentCredential, newCredential, newAuthType } = parsed.data;

  try {
    const settings = await prisma.securitySettings.findFirst();
    if (!settings || !settings.authHash) {
      return { error: "App not set up yet." };
    }

    const isValid = await verifyPassword(currentCredential, settings.authHash);
    if (!isValid) {
      return { error: "Current credential is incorrect." };
    }

    const hashedNewCredential = await hashPassword(newCredential);

    await prisma.securitySettings.update({
      where: { id: settings.id },
      data: { authHash: hashedNewCredential, authType: newAuthType },
    });

    return { success: "Security settings updated successfully." };
  } catch (error) {
    console.error("Update failed:", error);
    return { error: "Failed to update security settings." };
  }
}

export async function generateRecoveryCode() {
  try {
    const settings = await prisma.securitySettings.findFirst();
    if (!settings || !settings.authHash) {
      return { error: "App not set up yet." };
    }
    
    // Generate a secure readable code like INV-A8B9-C3D4
    const randomHex = () => Math.random().toString(16).substring(2, 6).toUpperCase();
    const rawCode = `INV-${randomHex()}-${randomHex()}`;
    const hashedCode = await hashPassword(rawCode);
    
    await prisma.securitySettings.update({
      where: { id: settings.id },
      data: { recoveryHash: hashedCode },
    });
    
    return { success: true, code: rawCode };
  } catch (error) {
    console.error("Failed to generate recovery code:", error);
    return { error: "Failed to generate recovery code." };
  }
}

export async function verifyRecoveryCode(formData: FormData) {
  const code = formData.get("code") as string;
  if (!code) return { error: "Recovery code is required." };
  
  try {
    const settings = await prisma.securitySettings.findFirst();
    if (!settings || !settings.recoveryHash) {
      return { error: "No recovery code is set up." };
    }
    
    const isValid = await verifyPassword(code.trim(), settings.recoveryHash);
    if (!isValid) return { error: "Invalid recovery code." };
    
    const def = await getOrCreateDefaultShop();
    const session: UserSession = {
      activeShopId: def.id,
      activeShopName: def.name,
      role: "OWNER",
    };
    const token = await signToken(session);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    // Invalidate the one-time code after successful login
    await prisma.securitySettings.update({
      where: { id: settings.id },
      data: { recoveryHash: null },
    });
    
  } catch (error) {
    console.error("Recovery failed:", error);
    return { error: "An error occurred during recovery." };
  }
  
  redirect("/");
}

export async function updateAutoLock(minutes: number) {
  try {
    const settings = await prisma.securitySettings.findFirst();
    if (!settings) return { error: "App not set up yet." };
    
    await prisma.securitySettings.update({
      where: { id: settings.id },
      data: { autoLockMinutes: minutes },
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update auto lock:", error);
    return { error: "Failed to update auto lock setting." };
  }
}

export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payloadStr = await verifyToken(token);
    if (!payloadStr) return null;
    try {
      const parsed = JSON.parse(payloadStr) as UserSession;
      if (parsed.activeShopId) return parsed;
    } catch {
      // Legacy string token
    }
    const def = await getOrCreateDefaultShop();
    return {
      activeShopId: def.id,
      activeShopName: def.name,
      role: "OWNER",
    };
  } catch {
    return null;
  }
}

export async function getUserShopsAction() {
  try {
    const session = await getCurrentSession();
    return await getUserShops(session?.userId);
  } catch (error) {
    console.error("Failed to get user shops:", error);
    return [];
  }
}

export async function switchActiveShopAction(shopId: string) {
  try {
    const current = await getCurrentSession();
    if (!current) return { error: "Not authenticated" };

    const targetShop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
    if (!targetShop) return { error: "Shop not found" };

    const newSession: UserSession = {
      ...current,
      activeShopId: targetShop.id,
      activeShopName: targetShop.name,
    };

    const token = await signToken(newSession);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to switch shop:", error);
    return { error: "Failed to switch shop" };
  }
}

export async function createNewShopAction(name: string) {
  try {
    const current = await getCurrentSession();
    if (!current) return { error: "Not authenticated" };

    const newShop = await createShopForUser(name, current.userId || "admin-user");

    const newSession: UserSession = {
      ...current,
      activeShopId: newShop.id,
      activeShopName: newShop.name,
    };

    const token = await signToken(newSession);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return { success: true, shop: newShop };
  } catch (error) {
    console.error("Failed to create shop:", error);
    return { error: "Failed to create shop" };
  }
}

export async function deleteShopAction(shopId: string, confirmationName: string) {
  try {
    const current = await getCurrentSession();
    if (!current) return { error: "Not authenticated" };

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
    if (!shop) return { error: "Business not found." };

    if (confirmationName.trim() !== shop.name.trim()) {
      return { error: `Confirmation text must match "${shop.name}".` };
    }

    const allShops = await getUserShops(current.userId);
    if (allShops.length <= 1) {
      return { error: "You cannot delete your only remaining business." };
    }

    // Cascade delete all child items inside transaction for complete cleanup
    await prisma.$transaction(async (tx) => {
      await tx.invoiceLine.deleteMany({
        where: { invoice: { shopId } },
      });
      await tx.invoice.deleteMany({ where: { shopId } });
      await tx.customer.deleteMany({ where: { shopId } });
      await tx.product.deleteMany({ where: { shopId } });
      await tx.invoiceSequence.deleteMany({ where: { shopId } });
      await tx.invoiceDraftRecord.deleteMany({ where: { shopId } });
      await tx.sellerSettings.deleteMany({ where: { shopId } });
      await tx.shopMember.deleteMany({ where: { shopId } });
      await tx.shop.delete({ where: { id: shopId } });
    });

    // Pick a remaining shop to switch to
    const remainingShops = allShops.filter((s) => s.id !== shopId);
    const nextShop = remainingShops[0];

    const newSession: UserSession = {
      ...current,
      activeShopId: nextShop.id,
      activeShopName: nextShop.name,
    };

    const token = await signToken(newSession);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return { success: true, nextShopName: nextShop.name };
  } catch (error) {
    console.error("Failed to delete shop:", error);
    return { error: "Failed to delete business." };
  }
}

export async function emailLoginAction({
  email,
  name,
  shopName,
}: {
  email: string;
  name?: string;
  shopName?: string;
}) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { error: "Please enter a valid business email." };
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split("@")[0],
      },
      update: {
        name: name?.trim() || undefined,
      },
    });

    // Ensure shop
    let shops = await getUserShops(user.id);
    if (!shops || shops.length === 0) {
      if (shopName?.trim()) {
        const newShop = await createShopForUser(shopName.trim(), user.id);
        shops = [newShop];
      } else {
        const defaultShop = await getOrCreateDefaultShop();
        const existingMember = await prisma.shopMember.findUnique({
          where: { userId_shopId: { userId: user.id, shopId: defaultShop.id } },
        });
        if (!existingMember) {
          await prisma.shopMember.create({
            data: {
              userId: user.id,
              shopId: defaultShop.id,
              role: "OWNER",
            },
          });
        }
        shops = [{ id: defaultShop.id, name: defaultShop.name, slug: defaultShop.slug, role: "OWNER" }];
      }
    }

    const activeShop = shops[0];
    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      avatarUrl: user.avatarUrl || undefined,
      activeShopId: activeShop.id,
      activeShopName: activeShop.name,
      role: activeShop.role || "OWNER",
    };

    const token = await signToken(session);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  } catch (error) {
    console.error("Email login failed:", error);
    return { error: "Unable to sign in. Please try again." };
  }
}

export async function demoLoginAction() {
  try {
    const defaultShop = await getOrCreateDefaultShop();
    const demoEmail = "demo@invoixy.com";

    const user = await prisma.user.upsert({
      where: { email: demoEmail },
      create: {
        email: demoEmail,
        name: "Demo Store Owner",
      },
      update: {},
    });

    const existingMember = await prisma.shopMember.findUnique({
      where: { userId_shopId: { userId: user.id, shopId: defaultShop.id } },
    });
    if (!existingMember) {
      await prisma.shopMember.create({
        data: {
          userId: user.id,
          shopId: defaultShop.id,
          role: "OWNER",
        },
      });
    }

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name || "Demo Store Owner",
      activeShopId: defaultShop.id,
      activeShopName: defaultShop.name,
      role: "OWNER",
    };

    const token = await signToken(session);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  } catch (error) {
    console.error("Demo login failed:", error);
    return { error: "Demo sign-in failed. Please try again." };
  }
}
