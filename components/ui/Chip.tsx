"use client";

import { cn } from "@/lib/format";

type Props = {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  hint?: string;
  swatch?: string;
  disabled?: boolean;
};

export function Chip({ selected, onClick, children, className, hint, swatch, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium transition-all duration-300 ease-[var(--ease-out-expo)] active:scale-95 disabled:opacity-40",
        selected
          ? "border-bordo bg-bordo text-cream shadow-[0_8px_20px_-10px_rgba(74,14,14,0.7)]"
          : "border-cream-ink bg-white/60 text-ink hover:border-bordo/60 hover:bg-white",
        className,
      )}
    >
      {swatch && (
        <span
          className="size-4 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ background: swatch }}
          aria-hidden
        />
      )}
      <span>{children}</span>
      {hint && (
        <span className={cn("text-xs", selected ? "text-cream/80" : "text-ink-soft")}>{hint}</span>
      )}
    </button>
  );
}
