"use client";

import { useState, useEffect, useRef } from "react";
import { getCurrentSession, getUserShopsAction, switchActiveShopAction, createNewShopAction } from "@/app/actions/auth";
import type { UserSession } from "@/lib/auth";
import type { ShopInfo } from "@/lib/shops";

export function ShopSwitcher() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [shops, setShops] = useState<ShopInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const sess = await getCurrentSession();
      setSession(sess);
      const userShops = await getUserShopsAction();
      setShops(userShops);
    } catch (err) {
      console.error("Failed to load shop switcher data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchShop = async (shopId: string) => {
    if (shopId === session?.activeShopId) {
      setIsOpen(false);
      return;
    }
    const res = await switchActiveShopAction(shopId);
    if (res.success) {
      window.location.reload();
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;
    const res = await createNewShopAction(newShopName.trim());
    if (res.success) {
      window.location.reload();
    }
  };

  if (!session) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs">
          🏪
        </span>
        <span className="max-w-[140px] sm:max-w-[180px] truncate">
          {session.activeShopName || "My Store"}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 origin-top-left rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.16)] z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Business</p>
            <p className="text-sm font-bold text-slate-800 truncate">{session.activeShopName}</p>
            {session.email && (
              <p className="text-xs text-slate-500 truncate">{session.name || session.email}</p>
            )}
          </div>

          <div className="py-1">
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Switch Business ({shops.length})
            </p>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {shops.map((s) => {
                const isActive = s.id === session.activeShopId;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSwitchShop(s.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {isActive && (
                      <span className="text-[10px] bg-indigo-200/60 text-indigo-800 px-1.5 py-0.5 rounded-md font-bold">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {!isCreating ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Shop</span>
              </button>
            ) : (
              <form onSubmit={handleCreateShop} className="p-1 space-y-2">
                <input
                  type="text"
                  placeholder="e.g. New Outlet..."
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  autoFocus
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
                <div className="flex gap-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
