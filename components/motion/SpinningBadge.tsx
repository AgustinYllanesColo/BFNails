import { Star } from "./Marquee";
import { cn } from "@/lib/format";

/** Texto circular que gira sin parar, con una estrella en el centro. */
export function SpinningBadge({ text, size = 140, className }: { text: string; size?: number; className?: string }) {
  const id = `badge-${text.replace(/\W/g, "").slice(0, 10)}`;
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 animate-[spin-slow_14s_linear_infinite]" style={{ width: size, height: size }}>
        <defs>
          <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-bordo font-sans text-[8.2px] font-bold tracking-[0.2em] uppercase">
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </svg>
      <Star size={size * 0.2} className="text-red animate-[float_4s_ease-in-out_infinite]" />
    </div>
  );
}
