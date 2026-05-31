"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { toast } from "sonner";

export function AutoLockProvider({ 
  children, 
  timeoutMinutes 
}: { 
  children: React.ReactNode; 
  timeoutMinutes: number; 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Disable auto-lock if timeout is 0 (Never) or user is already on login page
    if (timeoutMinutes === 0 || pathname === "/login") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(async () => {
        // Trigger auto-lock
        toast.error("Session expired due to inactivity.", { duration: 5000 });
        await logout();
      }, timeoutMinutes * 60 * 1000);
    };

    // Events to track activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart"
    ];

    const handleActivity = () => resetTimer();

    // Setup listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMinutes, pathname, router]);

  return <>{children}</>;
}
