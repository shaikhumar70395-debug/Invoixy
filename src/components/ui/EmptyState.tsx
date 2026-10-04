import React from "react";
import { IconPlus } from "./icons";
import { Button } from "./Button";
import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  hint?: React.ReactNode;
  hintHref?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  hint,
  hintHref,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center transition-all ${className}`}
    >
      {/* Icon Badge */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50/80 text-[#4318ff] shadow-sm ring-4 ring-indigo-50/50">
        {icon ? (
          icon
        ) : (
          <svg
            className="h-7 w-7 text-[#4318ff]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-500">
        {description}
      </p>

      {/* Helpful Hint (e.g. for side-by-side or stacked forms) */}
      {hint && (
        hintHref ? (
          <a
            href={hintHref}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/70 px-4 py-1.5 text-xs font-semibold text-[#4318ff] hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <span>👉</span>
            <span>{hint}</span>
          </a>
        ) : (
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/60 px-3.5 py-1.5 text-xs font-semibold text-[#4318ff]">
            <span>👉</span>
            <span>{hint}</span>
          </div>
        )
      )}

      {/* Action Button */}
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref}>
              <Button
                variant="primary"
                className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <IconPlus className="h-4 w-4 mr-1.5" />
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              onClick={onAction}
              className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <IconPlus className="h-4 w-4 mr-1.5" />
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
