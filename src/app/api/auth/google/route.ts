import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    // If Google OAuth credentials aren't set in .env, redirect back with helpful message
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", req.url)
    );
  }

  const origin = `${process.env.NODE_ENV === "production" ? "https" : "http"}://${req.headers.get("host")}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(googleAuthUrl.toString());
}
