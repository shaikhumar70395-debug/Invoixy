import { AppNav } from "@/components/AppNav";
import { AutoLockProvider } from "@/components/AutoLockProvider";
import { checkSecuritySetup } from "@/app/actions/auth";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

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

  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full bg-[#f4f7fe] text-slate-900 antialiased font-sans">
        <AutoLockProvider timeoutMinutes={securityInfo.autoLockMinutes ?? 15}>
          <AppNav />
          <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 relative z-10">
            {children}
          </main>
          <Toaster position="bottom-center" richColors theme="light" />
        </AutoLockProvider>
      </body>
    </html>
  );
}
