"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { InvoixyLogo } from "@/components/InvoixyLogo";
import { ShopSwitcher } from "@/components/ShopSwitcher";
import type { UserSession } from "@/lib/auth";

import {
  IconHome,
  IconDocument,
  IconUsers,
  IconBox,
  IconSettings,
  IconLock,
  IconLogout,
  IconPlus,
} from "./ui/icons";

const navGroups = [
  {
    label: "Main",
    links: [
      { href: "/", label: "Dashboard", exact: true, icon: IconHome },
      { href: "/invoices/new", label: "New Invoice", exact: true, icon: IconPlus },
      { href: "/invoices", label: "History", exact: true, icon: IconDocument },
    ],
  },
  {
    label: "Management",
    links: [
      { href: "/customers", label: "Customers", exact: false, icon: IconUsers },
      { href: "/products", label: "Products", exact: false, icon: IconBox },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/settings", label: "Seller", exact: false, icon: IconSettings },
      { href: "/security", label: "Security", exact: false, icon: IconLock },
    ],
  },
];

const allLinks = navGroups.flatMap((g) => g.links);

export function AppNav({ session }: { session?: UserSession | null }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const { logout } = await import("@/app/actions/auth");
    await logout();
  };

  const displayName = session?.name || "Account";
  const firstName = session?.name ? session.name.split(" ")[0] : "Account";
  const initials = (session?.name || session?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 glass-nav shadow-[0_4px_24px_rgba(0,0,0,0.02)] no-print">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <InvoixyLogo iconSize={30} />
            </Link>
            {pathname !== "/login" && <ShopSwitcher />}
          </div>

          {/* Desktop Navigation */}
          {pathname !== "/login" && (
            <div className="hidden md:flex items-center gap-3">
              <nav className="flex gap-1" aria-label="Main">
                {allLinks.map((link) => {
                  const active =
                    pathname === link.href ||
                    (!link.exact && pathname.startsWith(`${link.href}/`));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-3.5 py-2 text-sm font-bold transition-all duration-200 ${
                        active
                          ? "bg-indigo-50 text-[#4318ff]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="h-5 w-px bg-slate-200 mx-1" aria-hidden="true" />

              {/* User Profile Pill / Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white py-1 pl-1 pr-3 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98]"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {session?.avatarUrl ? (
                    <img
                      src={session.avatarUrl}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#4318ff] to-indigo-500 text-[11px] font-bold text-white shadow-sm">
                      {initials}
                    </div>
                  )}

                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {firstName}
                  </span>

                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.16)] animate-fade-in z-50">
                    {/* User Identity Header */}
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 p-3 border border-slate-100 mb-2">
                      {session?.avatarUrl ? (
                        <img
                          src={session.avatarUrl}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/30"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#4318ff] to-indigo-500 text-sm font-bold text-white">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-slate-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 truncate">
                          {session?.email || "Signed In"}
                        </p>
                        {session?.email && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Google Connected
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick navigation */}
                    <div className="space-y-0.5 text-xs font-semibold text-slate-700">
                      <Link
                        href="/settings"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <IconSettings className="h-4 w-4 text-slate-400" />
                        <span>Seller Profile</span>
                      </Link>

                      <Link
                        href="/security"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <IconLock className="h-4 w-4 text-slate-400" />
                        <span>Security & Access</span>
                      </Link>
                    </div>

                    <div className="my-2 h-px bg-slate-100" />

                    {/* Sign out */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    >
                      <IconLogout className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {pathname !== "/login" && (
            <button
              type="button"
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 md:hidden focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {pathname !== "/login" && isOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden animate-fade-in flex flex-col bg-white">
          {/* Overlay Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center">
              <InvoixyLogo iconSize={28} />
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 flex flex-col gap-5 p-6 overflow-y-auto" aria-label="Mobile Main">
            {/* User Profile Banner in Mobile Menu */}
            {session && (
              <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/60 p-3.5 border border-indigo-100/70">
                {session.avatarUrl ? (
                  <img
                    src={session.avatarUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#4318ff] to-indigo-500 text-sm font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-slate-900 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{session.email || ""}</p>
                </div>
              </div>
            )}

            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <p className="px-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  {group.label}
                </p>
                {group.links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (!link.exact && pathname.startsWith(`${link.href}/`));

                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 rounded-xl px-4 py-2.5 text-[15px] font-bold transition-all duration-200 ${
                        active
                          ? "bg-indigo-50 text-[#4318ff]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${active ? "text-[#4318ff]" : "text-slate-400"}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}

            <div className="mt-auto pt-4 flex flex-col gap-2">
              <div className="h-px w-full bg-slate-100 mb-2" aria-hidden="true" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-4 rounded-xl px-4 py-2.5 text-[15px] font-bold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <IconLogout className="h-[18px] w-[18px]" />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
