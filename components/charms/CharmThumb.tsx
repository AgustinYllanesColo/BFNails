import Image from "next/image";
import type { Charm } from "@/lib/data/content";
import { cn } from "@/lib/format";

/** Foto del dije, o un dibujito con su color mientras no haya foto. */
export function CharmThumb({ charm, className }: { charm: Charm; className?: string }) {
  return (
    <span className={cn("bg-cream-deep relative block aspect-square overflow-hidden rounded-lg", className)}>
      {charm.image ? (
        <Image src={charm.image} alt={charm.name} fill sizes="160px" className="object-cover" />
      ) : (
        <svg viewBox="0 0 100 100" role="img" aria-label={charm.name} className="absolute inset-0 size-full">
          <circle cx="50" cy="52" r="24" fill={charm.hex ?? "#d9b25b"} stroke="#4a0e0e" strokeOpacity=".18" strokeWidth="2" />
          <ellipse cx="42" cy="42" rx="8" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 42 42)" />
          <path d="M50 20 v8" stroke="#4a0e0e" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}
