"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import type { UserSession } from "@/lib/auth";

type Props = {
  session?: UserSession | null;
  children: React.ReactNode;
};

export function AppShell({ session, children }: Props) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-white">
        {children}
      </div>
    );
  }

  return (
    <>
      <AppNav session={session} />
      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 relative z-10">
        {children}
      </main>
    </>
  );
}
