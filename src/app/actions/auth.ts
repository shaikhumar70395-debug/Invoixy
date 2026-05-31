"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPrismaClient } from "@/lib/db";
import { hashPassword, verifyPassword, signToken } from "@/lib/auth";
import { SetupSecuritySchema, LoginSchema, UpdateSecuritySchema } from "@/lib/schema";

const prisma = createPrismaClient();
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

    // Set cookie and login
    const token = await signToken("authenticated");
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

    const token = await signToken("authenticated");
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
    
    const token = await signToken("authenticated");
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

