import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken, type UserSession } from "@/lib/auth";
import { getUserShops, createShopForUser } from "@/lib/shops";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL(`/login?error=${error || "access_denied"}`, req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const origin = `${process.env.NODE_ENV === "production" ? "https" : "http"}://${req.headers.get("host")}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData);
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", req.url));
    }

    // 2. Fetch user profile from Google
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();

    if (!profileResponse.ok || !profile.email) {
      console.error("Google profile fetch error:", profile);
      return NextResponse.redirect(new URL("/login?error=profile_fetch_failed", req.url));
    }

    // 3. Upsert User in database
    const user = await prisma.user.upsert({
      where: { email: profile.email },
      create: {
        email: profile.email,
        name: profile.name || profile.email.split("@")[0],
        avatarUrl: profile.picture || "",
        googleId: profile.id,
      },
      update: {
        name: profile.name || undefined,
        avatarUrl: profile.picture || undefined,
        googleId: profile.id,
      },
    });

    // 4. Ensure user has a shop
    let shops = await getUserShops(user.id);
    if (!shops || shops.length === 0) {
      const shopName = `${user.name || "My"} Business`;
      const newShop = await createShopForUser(shopName, user.id);
      shops = [newShop];
    }

    const activeShop = shops[0];

    // 5. Generate authenticated session
    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name || "User",
      avatarUrl: user.avatarUrl || undefined,
      activeShopId: activeShop.id,
      activeShopName: activeShop.name,
      role: activeShop.role || "OWNER",
    };

    const token = await signToken(session);
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=oauth_error", req.url));
  }
}
