import { checkSecuritySetup } from "@/app/actions/auth";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const securityInfo = await checkSecuritySetup();

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-6 sm:py-16"
      style={{
        /* Rich layered base — not flat white */
        background:
          "linear-gradient(160deg, #eef2ff 0%, #f5f3ff 30%, #ede9fe 55%, #e0e7ff 80%, #eef2ff 100%)",
      }}
    >
      {/*
       * ── AMBIENT LAYER 1 · Large top-left brand orb (much stronger) ──────
       * Previously too translucent. Now deeply saturated with a crisp center.
       */}
      <div
        className="orb-float-1 pointer-events-none absolute"
        style={{
          top: "-18%",
          left: "-14%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 40% 40%, rgba(67,24,255,0.22) 0%, rgba(99,102,241,0.14) 35%, rgba(139,92,246,0.06) 60%, transparent 75%)",
          filter: "blur(0px)",
        }}
      />

      {/*
       * ── AMBIENT LAYER 2 · Bottom-right violet orb ─────────────────────
       */}
      <div
        className="orb-float-2 pointer-events-none absolute"
        style={{
          bottom: "-20%",
          right: "-12%",
          width: "720px",
          height: "720px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 55% 55%, rgba(109,40,217,0.18) 0%, rgba(99,102,241,0.11) 40%, rgba(167,139,250,0.05) 65%, transparent 78%)",
          filter: "blur(0px)",
        }}
      />

      {/*
       * ── AMBIENT LAYER 3 · Top-right accent — sky-blue touch ───────────
       */}
      <div
        className="orb-float-3 pointer-events-none absolute"
        style={{
          top: "-5%",
          right: "-6%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(96,165,250,0.13) 0%, rgba(99,102,241,0.07) 50%, transparent 72%)",
        }}
      />

      {/*
       * ── AMBIENT LAYER 4 · Centre-bottom warm lavender uplift ──────────
       */}
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: "5%",
          left: "20%",
          width: "400px",
          height: "280px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(167,139,250,0.14) 0%, rgba(139,92,246,0.06) 55%, transparent 75%)",
          animation: "floatOrbReverse 28s ease-in-out infinite 8s",
        }}
      />

      {/*
       * ── NOISE TEXTURE · Fine dot grid at higher opacity ───────────────
       */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(67,24,255,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/*
       * ── GEOMETRIC ACCENTS · Faint diagonal lines (top-right corner) ───
       */}
      <svg
        className="pointer-events-none absolute"
        style={{ top: "6%", right: "4%", opacity: 0.07 }}
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
      >
        {[0, 28, 56, 84, 112].map((offset) => (
          <line
            key={offset}
            x1={offset}
            y1="0"
            x2="200"
            y2={200 - offset}
            stroke="#4318ff"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Bottom-left subtle arc */}
      <svg
        className="pointer-events-none absolute"
        style={{ bottom: "5%", left: "3%", opacity: 0.06 }}
        width="180"
        height="180"
        viewBox="0 0 180 180"
        fill="none"
      >
        {[20, 50, 80, 110].map((r) => (
          <circle key={r} cx="0" cy="180" r={r} stroke="#6d28d9" strokeWidth="1" />
        ))}
      </svg>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="auth-brand-enter relative z-10 flex w-full max-w-[420px] flex-col items-center">

        {/* ── Branding ─────────────────────────────────────────────────── */}
        <div className="mb-3 sm:mb-5 flex flex-col items-center gap-1.5 sm:gap-2.5">
          {/* Logo glow halo */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(67,24,255,0.35) 0%, rgba(99,102,241,0.15) 50%, transparent 70%)",
                filter: "blur(12px)",
              }}
            />
            <div
              className="relative flex h-[58px] w-[58px] items-center justify-center rounded-[16px]"
              style={{
                background:
                  "linear-gradient(145deg, #5c38ff 0%, #4318ff 40%, #3a0ff5 100%)",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.22) inset," +
                  "0 2px 0 rgba(255,255,255,0.12) inset," +
                  "0 6px 20px rgba(67,24,255,0.55)," +
                  "0 16px 48px rgba(67,24,255,0.25)",
              }}
            >
              <svg
                className="h-[28px] w-[28px] text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
                style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.25))" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>

          {/* Word-mark */}
          <div className="text-center leading-none">
            <span
              className="block text-[1.65rem] font-black tracking-[-0.045em]"
              style={{
                background:
                  "linear-gradient(135deg, #1e0a6e 0%, #4318ff 45%, #7c3aed 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Invoixy
            </span>
            <span
              className="mt-1 block text-[10.5px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "rgba(109,40,217,0.5)" }}
            >
              GST Invoice Platform
            </span>
          </div>
        </div>

        {/* ── Card glow ring (sits behind the card) ─────────────────────── */}
        <div className="relative w-full">
          <div
            className="pointer-events-none absolute -inset-[2px] rounded-[30px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(67,24,255,0.25) 0%, rgba(139,92,246,0.15) 50%, rgba(67,24,255,0.20) 100%)",
              filter: "blur(8px)",
              zIndex: 0,
            }}
          />
          <div className="auth-card-enter relative z-10 w-full">
            <LoginForm isSetup={securityInfo.isSetup} authType={securityInfo.authType} />
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-4 flex items-center gap-1.5 opacity-0 animate-fade-in-up whitespace-nowrap"
          style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
        >
          <svg
            className="h-3 w-3 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            style={{ color: "rgba(109,40,217,0.4)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <span
            className="text-[11px] font-semibold tracking-[0.04em]"
            style={{ color: "rgba(109,40,217,0.45)" }}
          >
            End-to-end encrypted · AES-256
          </span>
        </div>
      </div>
    </div>
  );
}
