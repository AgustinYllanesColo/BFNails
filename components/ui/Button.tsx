import Link from "next/link";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "leopard";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-pill font-semibold tracking-tight transition-[transform,background-color,color,box-shadow] duration-300 ease-[var(--ease-out-expo)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bordo/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary: "bg-bordo text-cream hover:bg-bordo-soft shadow-[0_10px_30px_-12px_rgba(74,14,14,0.6)] hover:shadow-[0_18px_40px_-14px_rgba(74,14,14,0.7)] hover:-translate-y-0.5",
  secondary: "bg-transparent text-bordo ring-2 ring-inset ring-bordo hover:bg-bordo hover:text-cream",
  ghost: "bg-transparent text-ink hover:bg-cream-deep",
  leopard: "btn-leopard text-cream hover:-translate-y-0.5 shadow-[0_10px_30px_-12px_rgba(74,14,14,0.6)]",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };
type ButtonProps = Common & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = Common & { href: string; target?: string; rel?: string; "data-cursor"?: string };

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const cls = cn(base, variants[variant], sizes[size], className);
  if ("href" in props && props.href) {
    const { href, target, rel, ...rest } = props;
    return (
      <Link href={href} target={target} rel={rel} className={cls} data-cursor={rest["data-cursor"]}>
        {children}
      </Link>
    );
  }
  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as ButtonProps;
  void _v; void _s; void _c; void _ch;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
