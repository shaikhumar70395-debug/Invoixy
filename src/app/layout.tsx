import { AppShell } from "@/components/AppShell";
import { AutoLockProvider } from "@/components/AutoLockProvider";
import { checkSecuritySetup, getCurrentSession } from "@/app/actions/auth";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoixy",
  description: "A modern, open-source invoice generator for your business",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const securityInfo = await checkSecuritySetup();
  const session = await getCurrentSession();

  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full bg-[#f4f7fe] text-slate-900 antialiased font-sans">
        <AutoLockProvider timeoutMinutes={securityInfo.autoLockMinutes ?? 15}>
          <AppShell session={session}>
            {children}
          </AppShell>
          <Toaster position="bottom-center" richColors theme="light" />
        </AutoLockProvider>
      </body>
    </html>
  );
}
