import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * Set de íconos BF (PLAN §2.3, DESIGN §5): grilla 24, área viva 20, trazo 1,75 con puntas y uniones redondeadas y
 * un único acento relleno en `var(--icon-accent)` (rojo moño sobre crema, amarillo nariz dentro de
 * `[data-surface="inverse"]`). Tamaños: 16 · 20 (UI densa) · 24 (default) · 28 (dentro de círculos de 56).
 * Cero glifos unicode como íconos: si falta uno, se dibuja acá.
 *
 * WhatsApp y TikTok: Simple Icons (CC0 1.0), relleno, escalados al área viva de 20.
 */
type IconDef = {
  /** Trazos: `fill="none" stroke="currentColor"`. */
  stroke?: ReactNode;
  /** Rellenos en el color del texto. */
  fill?: ReactNode;
  /** Un detalle relleno en `var(--icon-accent)`. */
  accent?: ReactNode;
};

const BRAND_FIT = "translate(2 2) scale(0.8333)";

export const ICONS = {
  star: {
    fill: (
      <path d="M12 1.8 14.53 9.12 22.27 9.26 16.09 13.93 18.35 21.34 12 16.9 5.65 21.34 7.91 13.93 1.73 9.26 9.47 9.12Z" />
    ),
  },
  sparkle: {
    fill: (
      <path d="M12 1.5c.9 6.4 4.1 9.6 10.5 10.5-6.4.9-9.6 4.1-10.5 10.5C11.1 16.1 7.9 12.9 1.5 12 7.9 11.1 11.1 7.9 12 1.5Z" />
    ),
  },
  bow: {
    stroke: (
      <>
        <path d="M10 11.2C8.6 7.4 5.2 5.2 3.4 6.8 1.9 8.1 2 13.4 3.4 15.6c1.5 2.3 4.8 1.4 6.6-1.4" />
        <path d="M14 11.2c1.4-3.8 4.8-6 6.6-4.4 1.5 1.3 1.4 6.6 0 8.8-1.5 2.3-4.8 1.4-6.6-1.4" />
        <path d="M5.6 9.6c.3 1.4 1.4 2.5 2.8 2.7M18.4 9.6c-.3 1.4-1.4 2.5-2.8 2.7" />
      </>
    ),
    accent: <circle cx="12" cy="12.6" r="2.5" />,
  },
  nail: {
    stroke: (
      <>
        <path d="M12 2.6c3.4 0 5.4 4.4 5.4 9.6v9.2H6.6v-9.2C6.6 7 8.6 2.6 12 2.6Z" />
        <path d="M6.6 17.4c3.2-1.3 7.6-1.3 10.8 0" />
        <path d="M9.6 7.4c-.4 1.5-.5 3-.3 4.6" />
      </>
    ),
  },
  bag: {
    stroke: (
      <>
        <path d="M5.2 8.6h13.6l-.9 10.9a2 2 0 0 1-2 1.8H8.1a2 2 0 0 1-2-1.8Z" />
        <path d="M9 8.6V7.2a3 3 0 0 1 6 0v1.4" />
      </>
    ),
  },
  ruler: {
    stroke: (
      <>
        <rect x="2.6" y="8" width="18.8" height="8" rx="2" />
        <path d="M6.6 8v2.8M10 8v4.2M13.4 8v2.8M16.8 8v4.2" />
      </>
    ),
  },
  moto: {
    stroke: (
      <>
        <circle cx="6" cy="17.6" r="2.6" />
        <circle cx="18.4" cy="17.6" r="2.6" />
        <path d="M2.8 16.4c.2-3.2 2.5-5 5.6-5h2.8l1.6 5H8.4" />
        <path d="M12.8 16.4h3.6" />
        <path d="M17.6 15.2 15 6.6h-2.6" />
        <path d="M12.4 6.6h4.2" />
        <path d="M4.6 11.6h3.6" />
      </>
    ),
  },
  mail: {
    stroke: (
      <>
        <rect x="3" y="5.4" width="18" height="13.2" rx="2.6" />
        <path d="m3.8 7.2 8.2 6 8.2-6" />
      </>
    ),
  },
  train: {
    stroke: (
      <>
        <rect x="6" y="3" width="12" height="13.6" rx="3.2" />
        <path d="M6 10h12" />
        <path d="m8.6 16.6-2 4.4M15.4 16.6l2 4.4" />
      </>
    ),
    accent: (
      <>
        <circle cx="9.2" cy="13.3" r="1" />
        <circle cx="14.8" cy="13.3" r="1" />
      </>
    ),
  },
  card: {
    stroke: (
      <>
        <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="2.6" />
        <path d="M2.6 10h18.8M6.2 14.8h4" />
      </>
    ),
  },
  gift: {
    stroke: (
      <>
        <rect x="4" y="9.6" width="16" height="11" rx="2" />
        <path d="M3 9.6h18M12 9.6v11" />
        <path d="M12 9.4C10.4 6.2 7.4 5.4 7.2 7.2c-.2 1.5 2.4 2.2 4.8 2.2M12 9.4c1.6-3.2 4.6-4 4.8-2.2.2 1.5-2.4 2.2-4.8 2.2" />
      </>
    ),
  },
  clock: {
    stroke: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.4V12l3.1 2" />
      </>
    ),
  },
  drop: {
    stroke: (
      <>
        <path d="M12 3.4c3 4.4 5.6 7.6 5.6 11a5.6 5.6 0 0 1-11.2 0c0-3.4 2.6-6.6 5.6-11Z" />
        <path d="M9.6 14.6a2.6 2.6 0 0 0 2 2.4" />
      </>
    ),
  },
  file: {
    stroke: (
      <rect x="9.4" y="1.6" width="5.2" height="20.8" rx="2.6" transform="rotate(35 12 12)" />
    ),
    accent: (
      <>
        <circle cx="10.6" cy="9.2" r=".7" />
        <circle cx="12.4" cy="11.6" r=".7" />
        <circle cx="14.2" cy="14" r=".7" />
      </>
    ),
  },
  brush: {
    stroke: (
      <>
        <path d="M14.2 4.2l5.6 5.6-7.4 7.4-5.6-5.6Z" />
        <path d="M6.8 11.6c-2 .6-3.4 2.4-3.4 4.6 0 2.4-.6 3.6-1.4 4.4 3.8.6 7.6-.4 9.6-4.2" />
      </>
    ),
  },
  heart: {
    stroke: (
      <path d="M12 20.2S3.4 15.2 3.4 9.2a4.4 4.4 0 0 1 8.6-1.4 4.4 4.4 0 0 1 8.6 1.4c0 6-8.6 11-8.6 11Z" />
    ),
  },
  chat: {
    stroke: (
      <>
        <path d="M3.6 20.4 5 16.3A8.4 8.4 0 1 1 8.2 19.4Z" />
        <path d="M9 10.2c.4 2.2 2.2 4 4.6 4.6" />
      </>
    ),
  },
  instagram: {
    stroke: (
      <>
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
        <circle cx="12" cy="12" r="4.1" />
      </>
    ),
    accent: <circle cx="17.2" cy="6.8" r="1.1" />,
  },
  plus: { stroke: <path d="M12 5v14M5 12h14" /> },
  minus: { stroke: <path d="M5 12h14" /> },
  close: { stroke: <path d="m6.2 6.2 11.6 11.6M17.8 6.2 6.2 17.8" /> },
  check: { stroke: <path d="m4.8 12.6 4.4 4.4 10-10" /> },
  arrow: { stroke: <path d="M4.5 12h15M13.5 6l6 6-6 6" /> },
  chevron: { stroke: <path d="m6 9.2 6 6 6-6" /> },
  menu: { stroke: <path d="M4 8.6h16M4 15.4h16" /> },
  trash: {
    stroke: (
      <>
        <path d="M4.5 7h15" />
        <path d="M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7" />
        <path d="M6.5 7l.9 12.2c.1 1 .9 1.8 1.9 1.8h5.4c1 0 1.8-.8 1.9-1.8L17.5 7" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
  },
  copy: {
    stroke: (
      <>
        <rect x="8.5" y="8.5" width="12" height="12" rx="2.6" />
        <path d="M15.5 8.5V6.1c0-1.4-1.1-2.6-2.6-2.6H6.1c-1.4 0-2.6 1.1-2.6 2.6v6.8c0 1.4 1.1 2.6 2.6 2.6h2.4" />
      </>
    ),
  },
  alert: {
    stroke: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.2" />
      </>
    ),
    accent: <circle cx="12" cy="16.3" r="1.1" />,
  },
  pause: { stroke: <path d="M9 6v12M15 6v12" /> },
  play: { stroke: <path d="M8 5.5v13l10.5-6.5Z" /> },
  zoom: {
    stroke: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5M10.5 8v5M8 10.5h5" />
      </>
    ),
  },
  /** Se gira el `<svg>` entero (no el path): `className="animate-[spin-slow_0.8s_linear_infinite]"`. */
  spinner: { stroke: <path d="M12 3a9 9 0 1 0 9 9" /> },
  whatsapp: {
    fill: (
      <path
        transform={BRAND_FIT}
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    ),
  },
  tiktok: {
    fill: (
      <path
        transform={BRAND_FIT}
        d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
      />
    ),
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

type IconProps = {
  name: IconName;
  /** 16 · 20 · 24 · 28 (px). */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Sin `title` el ícono es decorativo (`aria-hidden`); con `title` se anuncia como imagen. */
  title?: string;
};

export function Icon({ name, size = 24, className, style, title }: IconProps) {
  const def: IconDef = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      data-icon={name}
      className={cn("inline-block shrink-0", className)}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {def.stroke ? (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {def.stroke}
        </g>
      ) : null}
      {def.fill ? <g fill="currentColor">{def.fill}</g> : null}
      {def.accent ? (
        <g stroke="none" style={{ fill: "var(--icon-accent, currentColor)" }}>
          {def.accent}
        </g>
      ) : null}
    </svg>
  );
}
