import { cn } from "@/lib/format";

export function Section({
  children,
  className,
  id,
  tone = "cream",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "cream" | "deep" | "bordo" | "white";
}) {
  const tones = {
    cream: "bg-cream",
    deep: "bg-cream-deep",
    bordo: "bg-bordo text-cream",
    white: "bg-white",
  };
  return (
    <section id={id} className={cn("relative py-20 md:py-28", tones[tone], className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mb-3 text-xs font-bold tracking-[0.2em] uppercase opacity-70", className)}>
      {children}
    </p>
  );
}

export function Heading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag className={cn("font-display text-balance text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.95]", className)}>
      {children}
    </Tag>
  );
}
