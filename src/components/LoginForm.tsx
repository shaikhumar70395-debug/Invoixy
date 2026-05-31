"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { setupSecurity, login } from "@/app/actions/auth";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
interface LoginFormProps {
  isSetup: boolean;
  authType: string;
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════ */

/** Animated PIN indicator dot */
function PinDot({ filled, isNext }: { filled: boolean; isNext: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
      {/* Glow ring — only on filled */}
      {filled && (
        <div
          className="absolute rounded-full"
          style={{
            inset: "-5px",
            background:
              "radial-gradient(circle, rgba(67,24,255,0.22) 0%, transparent 70%)",
            animation: "pinGlowPulse 1.8s ease-in-out infinite",
          }}
        />
      )}
      {/* Dot */}
      <div
        style={{
          width: filled ? 18 : isNext ? 14 : 12,
          height: filled ? 18 : isNext ? 14 : 12,
          borderRadius: "50%",
          background: filled
            ? "linear-gradient(135deg, #5c38ff 0%, #4318ff 50%, #7c3aed 100%)"
            : "rgba(203,213,225,0.6)",
          border: filled
            ? "1.5px solid rgba(255,255,255,0.35)"
            : isNext
            ? "1.5px solid rgba(67,24,255,0.3)"
            : "1.5px solid rgba(203,213,225,0.4)",
          boxShadow: filled
            ? "0 0 0 3px rgba(67,24,255,0.15), 0 2px 10px rgba(67,24,255,0.4)"
            : "none",
          transition:
            "all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: filled ? "scale(1)" : isNext ? "scale(1.05)" : "scale(1)",
        }}
      />
      {/* Inner shine on filled */}
      {filled && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 5,
            height: 5,
            top: 2,
            left: 4,
            background: "rgba(255,255,255,0.6)",
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
}

/** Numeric keypad key */
function PinKey({
  label,
  onClick,
  isDelete = false,
}: {
  label?: string;
  onClick: () => void;
  isDelete?: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    setPressed(true);
    onClick();
    setTimeout(() => setPressed(false), 180);
  }

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      aria-label={isDelete ? "Delete digit" : `Digit ${label}`}
      className="relative flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-1 rounded-[16px] sm:rounded-[18px] group"
      style={{
        height: 54,
        background: pressed
          ? "rgba(237,233,254,0.92)"
          : isDelete
          ? "rgba(248,250,252,0.55)"
          : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: pressed
          ? "1px solid rgba(67,24,255,0.28)"
          : isDelete
          ? "1px solid rgba(226,232,240,0.55)"
          : "1px solid rgba(255,255,255,0.85)",
        boxShadow: pressed
          ? "0 1px 4px rgba(67,24,255,0.12), inset 0 1px 0 rgba(255,255,255,0.6)"
          : isDelete
          ? "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)"
          : "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)",
        transform: pressed ? "scale(0.91) translateY(1px)" : "scale(1) translateY(0)",
        transition: pressed
          ? "transform 0.09s ease, background 0.09s ease, box-shadow 0.09s ease"
          : "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        cursor: "pointer",
      }}
    >
      {/* Hover shine */}
      <div
        className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.4) 0%, transparent 60%)",
        }}
      />

      {isDelete ? (
        <svg
          style={{
            width: 20,
            height: 20,
            color: pressed ? "#7c3aed" : "#94a3b8",
            transition: "color 0.15s",
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z"
          />
        </svg>
      ) : (
        <span
          style={{
            fontSize: 21,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            color: pressed ? "#4318ff" : "#1e293b",
            transition: "color 0.15s",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

/** Auth type segmented control tab */
function AuthTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-1 items-center justify-center gap-1 rounded-[12px] px-2 py-2 sm:px-3 sm:py-2.5 text-[12px] sm:text-[13px] font-semibold outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500/40 whitespace-nowrap"
      style={{
        color: active ? "#4318ff" : "#94a3b8",
        background: active
          ? "rgba(255,255,255,0.96)"
          : "transparent",
        boxShadow: active
          ? "0 1px 2px rgba(0,0,0,0.06), 0 3px 12px rgba(67,24,255,0.12), inset 0 1px 0 rgba(255,255,255,1)"
          : "none",
        transform: active ? "scale(1)" : "scale(0.97)",
      }}
    >
      <span style={{ opacity: active ? 1 : 0.6, transition: "opacity 0.2s" }}>
        {icon}
      </span>
      <span>{label}</span>
      {/* Active indicator pill */}
      {active && (
        <span
          className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 20,
            height: 2.5,
            background: "linear-gradient(90deg, #4318ff, #7c3aed)",
            opacity: 0.8,
          }}
        />
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function LoginForm({ isSetup, authType }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedAuthType, setSelectedAuthType] = useState(authType || "PIN");
  const [pinValue, setPinValue] = useState("");
  const [pinShaking, setPinShaking] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const isPinMode =
    (isSetup && authType === "PIN") || (!isSetup && selectedAuthType === "PIN");
  const isReady = !isPinMode || pinValue.length === 6;

  /* Sync to hidden input */
  useEffect(() => {
    if (hiddenInputRef.current) hiddenInputRef.current.value = pinValue;
  }, [pinValue]);

  /* Physical keyboard support */
  useEffect(() => {
    if (!isPinMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^\d$/.test(e.key) && pinValue.length < 6) {
        setPinValue((p) => p + e.key);
      } else if (e.key === "Backspace") {
        setPinValue((p) => p.slice(0, -1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPinMode, pinValue]);

  const addDigit = useCallback(
    (d: string) => setPinValue((p) => (p.length < 6 ? p + d : p)),
    []
  );
  const delDigit = useCallback(() => setPinValue((p) => p.slice(0, -1)), []);

  function shake() {
    setPinShaking(true);
    setTimeout(() => setPinShaking(false), 520);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (isPinMode) fd.set("credential", pinValue);

    startTransition(async () => {
      const action = isSetup ? login : setupSecurity;
      if (!isSetup) fd.set("authType", selectedAuthType);
      const res = await action(fd);
      if (res?.error) {
        setError(res.error);
        if (isPinMode) { setPinValue(""); shake(); }
      }
    });
  }

  /* ── JSX ────────────────────────────────────── */
  return (
    <div
      className="w-full rounded-[22px] sm:rounded-[26px] overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.76)",
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.75)",
        boxShadow:
          /* outer glow */        "0 0 0 1px rgba(67,24,255,0.07)," +
          /* soft lift */         "0 2px 4px rgba(0,0,0,0.03)," +
          /* mid shadow */        "0 12px 32px rgba(0,0,0,0.08)," +
          /* brand depth */       "0 32px 80px rgba(67,24,255,0.10)," +
          /* inset top shine */   "inset 0 1px 0 rgba(255,255,255,0.95)",
      }}
    >
      {/* ── Top accent bar ── */}
      <div
        style={{
          height: 3,
          background:
            "linear-gradient(90deg, #4318ff 0%, #6366f1 40%, #8b5cf6 70%, #a78bfa 100%)",
        }}
      />

      <div className="px-5 pt-6 pb-6 sm:px-8 sm:pt-7 sm:pb-8">
        {/* ── Header ── */}
        <div style={{ marginBottom: 18, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#0f172a",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {isSetup ? "Welcome back" : "Secure your account"}
          </h1>
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            {isSetup
              ? isPinMode
                ? "Enter your 6-digit PIN to continue"
                : "Enter your password to continue"
              : "Choose how you'd like to protect your data"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Error ── */}
          {error && (
            <div
              className="animate-fade-in"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(254,226,226,0.8)",
                border: "1px solid rgba(252,165,165,0.5)",
                backdropFilter: "blur(8px)",
              }}
            >
              <svg
                style={{ width: 15, height: 15, color: "#ef4444", flexShrink: 0, marginTop: 1 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#dc2626", lineHeight: 1.4 }}>
                {error}
              </span>
            </div>
          )}

          {/* ── Auth type selector (setup only) ── */}
          {!isSetup && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                Authentication method
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: 5,
                  borderRadius: 18,
                  background: "rgba(241,245,249,0.7)",
                  border: "1px solid rgba(226,232,240,0.5)",
                  backdropFilter: "blur(8px)",
                  position: "relative",
                }}
              >
                <AuthTab
                  label="Numeric PIN"
                  active={selectedAuthType === "PIN"}
                  onClick={() => { setSelectedAuthType("PIN"); setPinValue(""); }}
                  icon={
                    <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  }
                />
                <AuthTab
                  label="Password"
                  active={selectedAuthType === "PASSWORD"}
                  onClick={() => { setSelectedAuthType("PASSWORD"); setTimeout(() => passwordRef.current?.focus(), 60); }}
                  icon={
                    <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  }
                />
              </div>
            </div>
          )}

          {/* ── PIN MODE ── */}
          {isPinMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* PIN dots area */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                  }}
                >
                  {isSetup ? "Enter 6-digit PIN" : "Create a 6-digit PIN"}
                </span>

                {/* Dots row */}
                <div
                  className={pinShaking ? "pin-shake" : ""}
                  style={{ display: "flex", gap: 9, alignItems: "center", padding: "2px 0" }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PinDot
                      key={i}
                      filled={i < pinValue.length}
                      isNext={i === pinValue.length}
                    />
                  ))}
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "rgba(148,163,184,0.7)",
                    letterSpacing: "0.01em",
                  }}
                >
                  Keyboard shortcuts supported
                </span>
              </div>

              {/* Hidden input */}
              <input ref={hiddenInputRef} type="hidden" name="credential" readOnly />

              {/* Keypad grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {["1","2","3","4","5","6","7","8","9"].map((d, i) => (
                  <PinKey key={`k${i}`} label={d} onClick={() => addDigit(d)} />
                ))}
                {/* bottom row */}
                <div />
                <PinKey label="0" onClick={() => addDigit("0")} />
                <PinKey isDelete onClick={delDigit} />
              </div>

              {/* Clear micro-link */}
              {pinValue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPinValue("")}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(148,163,184,0.8)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "center",
                    padding: "2px 0",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(148,163,184,0.8)")}
                >
                  Clear PIN
                </button>
              )}
            </div>

          ) : (
            /* ── PASSWORD MODE ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label
                htmlFor="credential"
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase" as const,
                  color: "#94a3b8",
                }}
              >
                {isSetup ? "Enter your password" : "Create a password"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  ref={passwordRef}
                  id="credential"
                  name="credential"
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••••"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 16,
                    border: "1px solid rgba(226,232,240,0.7)",
                    padding: "14px 48px 14px 18px",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#1e293b",
                    background: "rgba(248,250,252,0.75)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(67,24,255,0.45)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.04), 0 0 0 3.5px rgba(67,24,255,0.10)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.92)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(226,232,240,0.7)";
                    e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.04)";
                    e.currentTarget.style.background = "rgba(248,250,252,0.75)";
                  }}
                />
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ width: 15, height: 15, color: "#cbd5e1" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
            </div>
          )}

          {/* ── SUBMIT BUTTON ── */}
          <button
            type="submit"
            disabled={isPending || !isReady}
            className="group relative overflow-hidden"
            style={{
              width: "100%",
              borderRadius: 16,
              padding: "15px 24px",
              border: "none",
              cursor: isPending || !isReady ? "not-allowed" : "pointer",
              background:
                isPending || !isReady
                  ? "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)"
                  : "linear-gradient(135deg, #4318ff 0%, #4f46e5 45%, #6d28d9 100%)",
              boxShadow:
                isPending || !isReady
                  ? "none"
                  : "0 4px 16px rgba(67,24,255,0.40), 0 8px 32px rgba(67,24,255,0.22), inset 0 1px 0 rgba(255,255,255,0.18)",
              transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              transform: "translateZ(0)",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!isPending && isReady) {
                e.currentTarget.style.boxShadow =
                  "0 6px 24px rgba(67,24,255,0.52), 0 12px 40px rgba(67,24,255,0.28), inset 0 1px 0 rgba(255,255,255,0.22)";
                e.currentTarget.style.transform = "translateY(-1px) scale(1.005)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = isPending || !isReady
                ? "none"
                : "0 4px 16px rgba(67,24,255,0.40), 0 8px 32px rgba(67,24,255,0.22), inset 0 1px 0 rgba(255,255,255,0.18)";
              e.currentTarget.style.transform = "translateZ(0)";
            }}
            onMouseDown={(e) => {
              if (!isPending && isReady) {
                e.currentTarget.style.transform = "scale(0.982) translateY(1px)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(67,24,255,0.30), inset 0 1px 0 rgba(255,255,255,0.15)";
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateZ(0)";
            }}
          >
            {/* Animated shine sweep */}
            <span
              className="pointer-events-none absolute inset-0 rounded-[16px] -translate-x-full group-hover:translate-x-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
                transition: "transform 0.65s ease",
              }}
            />

            <span
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(255,255,255,0.97)",
                letterSpacing: "-0.01em",
                textShadow: "0 1px 3px rgba(0,0,0,0.18)",
              }}
            >
              {isPending ? (
                <>
                  <svg
                    style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.85 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <span>{isSetup ? "Unlock Dashboard" : "Save & Continue"}</span>
                  <svg
                    style={{
                      width: 15,
                      height: 15,
                      transition: "transform 0.25s ease",
                    }}
                    className="group-hover:translate-x-[3px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>

        {/* ── Card footer divider ── */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(203,213,225,0.45))",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg
              style={{ width: 12, height: 12, color: "rgba(148,163,184,0.7)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "rgba(148,163,184,0.75)",
              }}
            >
              AES-256 encrypted
            </span>
          </div>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "linear-gradient(90deg, rgba(203,213,225,0.45), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
