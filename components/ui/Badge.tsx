import { cn } from "@/lib/format";

export function Badge({
  children,
  className,
  tone = "bordo",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "bordo" | "cream" | "yellow" | "ink" | "red" | "green";
}) {
  const tones = {
    bordo: "bg-bordo text-cream",
    cream: "bg-cream-deep text-bordo",
    yellow: "bg-yellow text-ink",
    ink: "bg-ink text-cream",
    red: "bg-red text-cream",
    green: "bg-emerald-700 text-cream",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
