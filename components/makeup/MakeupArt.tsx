import { useId } from "react";
import Image from "next/image";
import type { MakeupForm, MakeupProduct } from "@/lib/data/makeup";
import { cn } from "@/lib/format";

/**
 * Dibujo del producto mientras no haya foto: una "calcomanía" del envase según su forma, pintada con el color
 * del producto (`hex`), con contorno bordó, borde blanco de sticker y sombra suave, sobre fondo rosa.
 * Todas las formas comparten trazo (2 px bordó), brillo blanco y paleta de envases, para que se lean como una serie.
 */

const OUTLINE = "#4a0e0e";
const CASE = "#3a1420"; // envase oscuro (labiales, compactos)
const CASE_DARK = "#24090f";
const GOLD = "#e2b65c";
const GOLD_DARK = "#b98a35";
const PAPER = "#fffdf8";

/** Mezcla un color con otro (t = 0 → a, t = 1 → b). */
function mix(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function parse(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [217, 70, 111];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const darker = (c: string, t = 0.28) => mix(c, "#000000", t);
const lighter = (c: string, t = 0.45) => mix(c, "#ffffff", t);

const line = { stroke: OUTLINE, strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const shine = { stroke: "#ffffff", strokeWidth: 2.4, strokeLinecap: "round" as const, fill: "none", opacity: 0.7 };

type Palette = { c: string; cd: string; cl: string; uid: string };

function Lipstick({ c, cd }: Palette) {
  return (
    <g transform="rotate(-10 50 54)">
      {/* tapa, apoyada al lado */}
      <g transform="rotate(16 76 66)">
        <rect x="66" y="46" width="21" height="38" rx="3" fill={CASE} {...line} />
        <rect x="66" y="46" width="21" height="6" rx="2" fill={GOLD} {...line} />
        <path d="M71 57 V77" {...shine} opacity={0.35} />
      </g>
      <path d="M41 46 V25 Q41 19 47 17 L59 12 V46 Z" fill={c} {...line} />
      <path d="M59 12 L47 17 Q41 19 41 25" fill="none" stroke={cd} strokeWidth="3" opacity=".5" />
      <path d="M45 42 V27" {...shine} />
      <rect x="38" y="45" width="24" height="14" rx="2" fill={GOLD} {...line} />
      <path d="M38 52 H62" stroke={GOLD_DARK} strokeWidth="1.5" />
      <rect x="36" y="58" width="28" height="30" rx="3" fill={CASE} {...line} />
      <path d="M41 63 V83" {...shine} opacity={0.35} />
    </g>
  );
}

function Gloss({ c, cd, cl }: Palette) {
  return (
    <g>
      {/* frasco transparente con el gloss adentro */}
      <g transform="rotate(-8 38 60)">
        <rect x="34" y="27" width="12" height="9" rx="1.5" fill={GOLD} {...line} />
        <rect x="27" y="35" width="26" height="54" rx="9" fill={PAPER} fillOpacity=".55" {...line} />
        <rect x="31" y="46" width="18" height="39" rx="6" fill={c} />
        <path d="M31 52 Q40 48 49 52" fill="none" stroke={cl} strokeWidth="2" opacity=".8" />
        <circle cx="44" cy="60" r="1.4" fill="#fff" opacity=".9" />
        <circle cx="38" cy="70" r="1" fill="#fff" opacity=".9" />
        <circle cx="45" cy="76" r="1.2" fill="#fff" opacity=".9" />
        <path d="M31.5 42 V78" {...shine} />
      </g>
      {/* aplicador: tapa + varilla + pie de ciervo */}
      <g transform="rotate(14 66 50)">
        <rect x="59" y="10" width="14" height="32" rx="4" fill={CASE} {...line} />
        <path d="M63 15 V36" {...shine} opacity={0.35} />
        <path d="M66 42 V68" stroke={OUTLINE} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M66 42 V68" stroke={PAPER} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M62 67 Q66 64 70 67 L70 80 Q66 88 62 80 Z" fill={cd} {...line} />
        <path d="M64 70 V78" stroke={cl} strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Mascara({ c, cd }: Palette) {
  return (
    <g>
      <g transform="rotate(-8 36 60)">
        <rect x="31" y="26" width="10" height="8" rx="1.5" fill={GOLD} {...line} />
        <rect x="24" y="33" width="24" height="57" rx="11" fill={c} {...line} />
        <rect x="24" y="52" width="24" height="12" fill={cd} opacity=".55" />
        <path d="M24 52 H48 M24 64 H48" stroke={OUTLINE} strokeWidth="1.2" opacity=".5" />
        <path d="M29 40 V82" {...shine} />
      </g>
      <g transform="rotate(14 66 50)">
        <rect x="58" y="8" width="16" height="36" rx="7" fill={c} {...line} />
        <path d="M62 14 V38" {...shine} />
        <path d="M66 44 V64" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        {/* cepillo: espiral de cerdas */}
        {Array.from({ length: 8 }, (_, i) => {
          const y = 64 + i * 2.8;
          const w = 6.5 - Math.abs(i - 3.5) * 0.55;
          return <path key={i} d={`M${66 - w} ${y} L${66 + w} ${y + 1.2}`} stroke="#1d1a1a" strokeWidth="1.8" strokeLinecap="round" />;
        })}
        <path d="M66 63 V86" stroke="#1d1a1a" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Pencil({ c, cd, cl }: Palette) {
  return (
    <g transform="rotate(-38 50 52)">
      {/* lápiz de fondo (otro tono del mismo color) */}
      <g transform="translate(-4 16)" opacity=".95">
        <rect x="14" y="44" width="54" height="12" rx="2" fill={cl} {...line} />
        <path d="M68 44 L81 50 L68 56 Z" fill="#f1d3a8" {...line} />
        <path d="M76.5 47.8 L82 50 L76.5 52.2 Z" fill={c} />
      </g>
      <rect x="12" y="42" width="9" height="14" rx="2.5" fill={cd} {...line} />
      <rect x="20" y="42" width="50" height="14" rx="1.5" fill={c} {...line} />
      <path d="M21 49 H69" stroke={cd} strokeWidth="1.4" opacity=".6" />
      <path d="M24 45.5 H62" {...shine} opacity={0.55} />
      <path d="M70 42 L86 49 L70 56 Z" fill="#f1d3a8" {...line} />
      <path d="M80.4 46.6 L88 49 L80.4 51.4 Z" fill={c} {...line} strokeWidth={1.4} />
      <rect x="20" y="42" width="5" height="14" fill={GOLD} {...line} strokeWidth={1.4} />
    </g>
  );
}

function Liner({ c, cd }: Palette) {
  return (
    <g>
      {/* el trazo con rabito que deja */}
      <path d="M14 30 Q40 40 70 27 Q78 23 86 15" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
      <g transform="rotate(-24 50 62)">
        <rect x="12" y="56" width="50" height="13" rx="6.5" fill={c} {...line} />
        <rect x="46" y="56" width="5" height="13" fill={GOLD} {...line} strokeWidth={1.4} />
        <path d="M18 60 H42" {...shine} opacity={0.5} />
        <path d="M62 57.5 L80 62.5 L62 67.5 Z" fill={cd} {...line} />
        <path d="M76 61.4 L84 62.5 L76 63.6 Z" fill={c} />
        {/* tapa */}
        <rect x="40" y="76" width="34" height="13" rx="6.5" fill={c} {...line} />
        <path d="M46 80 H66" {...shine} opacity={0.5} />
        <rect x="40" y="76" width="6" height="13" rx="3" fill={GOLD} {...line} strokeWidth={1.4} />
      </g>
    </g>
  );
}

function Lashes({ c }: Palette) {
  // banda curva y pestañas que salen hacia arriba, más largas hacia el costado de afuera
  const n = 19;
  const p0 = [20, 66];
  const p1 = [50, 48];
  const p2 = [82, 60];
  const lashes = Array.from({ length: n }, (_, i) => {
    const t = 0.03 + (i / (n - 1)) * 0.94;
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy);
    const nx = dy / len;
    const ny = -dx / len;
    const L = 9 + t * 13;
    const ex = x + nx * L + 3 + t * 4;
    const ey = y + ny * L;
    const qx = x + nx * L * 0.6;
    const qy = y + ny * L * 0.6;
    return `M${x.toFixed(1)} ${y.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  });
  return (
    <g>
      {/* bandeja */}
      <rect x="10" y="26" width="80" height="54" rx="12" fill={PAPER} {...line} />
      <rect x="16" y="32" width="68" height="42" rx="8" fill="#fbe3ec" />
      <g transform="translate(0 8)">
        {lashes.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <path d={`M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`} fill="none" stroke={c} strokeWidth="3.6" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Compact({ c, cd, cl }: Palette) {
  return (
    <g>
      {/* tapa abierta con espejo */}
      <ellipse cx="50" cy="34" rx="31" ry="20" fill={CASE} {...line} />
      <ellipse cx="50" cy="34" rx="25" ry="15" fill="#fbeef3" stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M36 32 Q40 24 50 22" {...shine} opacity={0.9} stroke="#ffffff" />
      <path d="M58 42 L64 37" {...shine} opacity={0.9} />
      <rect x="43" y="51" width="14" height="5" rx="1.5" fill={GOLD} {...line} strokeWidth={1.4} />
      {/* base */}
      <path d="M19 66 V72 A31 18 0 0 0 81 72 V66 Z" fill={CASE_DARK} {...line} />
      <ellipse cx="50" cy="66" rx="31" ry="18" fill={CASE} {...line} />
      <ellipse cx="50" cy="66" rx="24" ry="13" fill={c} stroke={cd} strokeWidth="1.6" />
      {/* polvo prensado: relieve en ondas */}
      <path d="M33 66 Q41 60 50 66 T67 66" fill="none" stroke={cl} strokeWidth="1.6" opacity=".8" />
      <path d="M37 71 Q44 66 51 71 T63 71" fill="none" stroke={cd} strokeWidth="1.2" opacity=".35" />
      <ellipse cx="42" cy="61" rx="7" ry="2.6" fill="#fff" opacity=".35" />
    </g>
  );
}

function Pot({ c, cd, cl }: Palette) {
  return (
    <g>
      {/* tapa apoyada atrás, inclinada */}
      <g transform="rotate(-14 64 34)">
        <path d="M40 30 V39 A24 7 0 0 0 88 39 V30 Z" fill={CASE_DARK} {...line} />
        <ellipse cx="64" cy="30" rx="24" ry="7" fill={CASE} {...line} />
        <ellipse cx="58" cy="28.5" rx="10" ry="2" fill="#fff" opacity=".18" />
      </g>
      {/* frasco */}
      <path d="M22 58 V77 A28 10 0 0 0 78 77 V58 Z" fill={PAPER} {...line} />
      <path d="M22 66 A28 10 0 0 0 78 66" fill="none" stroke={OUTLINE} strokeWidth="1.2" opacity=".35" />
      <path d="M27 63 V77" {...shine} stroke={cl} opacity={0.9} />
      <ellipse cx="50" cy="58" rx="28" ry="10" fill={GOLD} {...line} />
      <ellipse cx="50" cy="58" rx="23" ry="7.5" fill={c} stroke={cd} strokeWidth="1.4" />
      {/* marca del dedo en la crema */}
      <path d="M38 58 Q46 53 56 57 Q61 59 64 56" fill="none" stroke={cl} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 61 Q48 58 58 61" fill="none" stroke={cd} strokeWidth="1.2" opacity=".45" />
    </g>
  );
}

function Stick({ c, cd }: Palette) {
  return (
    <g transform="rotate(-8 46 56)">
      {/* tapa, al costado */}
      <g transform="rotate(18 78 70)">
        <rect x="66" y="50" width="26" height="36" rx="6" fill={CASE} {...line} />
        <path d="M71 56 V80" {...shine} opacity={0.35} />
      </g>
      <path d="M33 42 V24 Q33 13 47 13 Q61 13 61 24 V42 Z" fill={c} {...line} />
      <path d="M33 30 Q47 34 61 30" fill="none" stroke={cd} strokeWidth="1.4" opacity=".55" />
      <path d="M38 38 V24 Q38 19 43 17.5" {...shine} />
      <rect x="30" y="40" width="34" height="8" rx="2" fill={GOLD} {...line} />
      <rect x="30" y="47" width="34" height="42" rx="7" fill={CASE} {...line} />
      <path d="M36 53 V83" {...shine} opacity={0.35} />
      <rect x="40" y="62" width="14" height="10" rx="2" fill={c} opacity=".9" stroke={OUTLINE} strokeWidth="1.2" />
    </g>
  );
}

function Pump({ c, cd, cl }: Palette) {
  return (
    <g>
      {/* bomba */}
      <rect x="47" y="16" width="6" height="12" fill={GOLD_DARK} {...line} strokeWidth={1.4} />
      <rect x="38" y="10" width="22" height="9" rx="3" fill={CASE} {...line} />
      <path d="M60 12.5 H72 Q75 12.5 75 15.5 V16.5 H60" fill={CASE} {...line} />
      <rect x="40" y="27" width="20" height="10" rx="2" fill={GOLD} {...line} />
      <path d="M40 32 H60" stroke={GOLD_DARK} strokeWidth="1.4" />
      {/* frasco de vidrio con la base adentro */}
      <rect x="27" y="36" width="46" height="54" rx="10" fill={PAPER} fillOpacity=".6" {...line} />
      <rect x="31" y="40" width="38" height="46" rx="7" fill={c} />
      <path d="M31 50 Q50 46 69 50" fill="none" stroke={cl} strokeWidth="1.6" opacity=".8" />
      {/* etiqueta */}
      <rect x="37" y="58" width="26" height="16" rx="2.5" fill={PAPER} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M42 64 H58 M45 68.5 H55" stroke={cd} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M33 44 V82" {...shine} />
    </g>
  );
}

function BrowGel({ c, cd }: Palette) {
  return (
    <g>
      <g transform="rotate(-6 38 64)">
        <rect x="31" y="38" width="10" height="7" rx="1.5" fill={GOLD} {...line} />
        <rect x="26" y="44" width="20" height="46" rx="10" fill={PAPER} fillOpacity=".6" {...line} />
        <rect x="29.5" y="56" width="13" height="30" rx="6.5" fill={c} />
        <path d="M30 51 V82" {...shine} />
      </g>
      <g transform="rotate(16 66 46)">
        <rect x="59" y="10" width="14" height="30" rx="5" fill={cd} {...line} />
        <path d="M63 15 V34" {...shine} opacity={0.5} />
        <path d="M66 40 V62" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
        {/* cepillito de cejas */}
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M${62} ${62 + i * 2.6} L${70} ${63 + i * 2.6}`} stroke={darker(c, 0.35)} strokeWidth="1.8" strokeLinecap="round" />
        ))}
        <path d="M66 61 V77" stroke={darker(c, 0.45)} strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Una brocha vertical (punta arriba) con la base del mango en (50, 94). `head` define la forma del pelo. */
function OneBrush({ handle, head, rot, tip }: { handle: string; head: "dome" | "fan" | "angled" | "pointed" | "flat"; rot: number; tip: string }) {
  const heads: Record<typeof head, string> = {
    dome: "M43 40 Q41 22 50 16 Q59 22 57 40 Z",
    fan: "M46 40 L35 22 Q50 14 65 22 L54 40 Z",
    angled: "M44 40 L44 24 Q46 20 56 16 L56 40 Z",
    pointed: "M45 40 Q44 28 50 14 Q56 28 55 40 Z",
    flat: "M45 40 L45 22 Q50 19 55 22 L55 40 Z",
  };
  return (
    <g transform={`rotate(${rot} 50 94)`}>
      <path d="M47 52 L46.5 92 Q50 95 53.5 92 L53 52 Z" fill={handle} {...line} />
      <rect x="45" y="39" width="10" height="14" rx="1.5" fill="#e8c1a8" {...line} />
      <path d="M47.5 41 V51" stroke="#fff" strokeWidth="1.6" opacity=".7" strokeLinecap="round" />
      <path d={heads[head]} fill={`url(#${tip})`} {...line} />
    </g>
  );
}

function BrushSet({ c, cd, uid }: Palette) {
  const tip = `tip-${uid}`;
  return (
    <g transform="translate(9 12) scale(0.82)">
      <defs>
        <linearGradient id={tip} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.34" stopColor={OUTLINE} />
          <stop offset="0.34" stopColor="#fbeee6" />
        </linearGradient>
      </defs>
      <OneBrush handle={cd} head="fan" rot={-32} tip={tip} />
      <OneBrush handle={c} head="angled" rot={-16} tip={tip} />
      <OneBrush handle={cd} head="dome" rot={0} tip={tip} />
      <OneBrush handle={c} head="pointed" rot={16} tip={tip} />
      <OneBrush handle={cd} head="flat" rot={32} tip={tip} />
    </g>
  );
}

function Brush({ c, cd, cl }: Palette) {
  return (
    <g transform="rotate(-36 50 52)">
      <path d="M8 49 Q8 46 11 46 L50 44.5 L50 55.5 L11 54 Q8 54 8 51 Z" fill={c} {...line} />
      <path d="M14 48.5 H44" stroke={cl} strokeWidth="2" strokeLinecap="round" opacity=".6" />
      <rect x="50" y="42.5" width="15" height="15" rx="2" fill="#e8c1a8" {...line} />
      <path d="M52 45 H63" stroke="#fff" strokeWidth="1.6" opacity=".7" strokeLinecap="round" />
      <path d="M65 43 Q76 34 88 41 Q95 50 88 59 Q76 66 65 57 Z" fill="#fbeee6" {...line} />
      <path d="M81 37.5 Q86 39 88 41 Q95 50 88 59 Q86 61 81 62.5 Q86 50 81 37.5 Z" fill={cd} opacity=".9" />
      <path d="M68 48 Q76 46 84 47 M68 52 Q76 54 84 53" stroke="#e7cdbd" strokeWidth="1.2" fill="none" />
    </g>
  );
}

const FORMS: Record<MakeupForm, (p: Palette) => React.ReactElement> = {
  labial: Lipstick,
  gloss: Gloss,
  mascara: Mascara,
  lapiz: Pencil,
  delineador: Liner,
  pestanas: Lashes,
  polvo: Compact,
  rubor: Pot,
  barra: Stick,
  base: Pump,
  gel: BrowGel,
  brochas: BrushSet,
  brocha: Brush,
};

/** Destellos de cuatro puntas: posición según el id, así las tarjetas no son todas iguales. */
function Sparkles({ seed }: { seed: string }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const spots = [
    [14, 16],
    [86, 22],
    [12, 104],
    [88, 108],
    [80, 12],
    [20, 112],
  ];
  const pick = [spots[h % 2], spots[2 + ((h >> 3) % 2)], spots[4 + ((h >> 5) % 2)]];
  const colors = ["#d9466f", "#4a0e0e", "#fffdf8"];
  return (
    <g aria-hidden>
      {pick.map(([x, y], i) => {
        const s = i === 0 ? 6 : i === 1 ? 4.5 : 3.5;
        return (
          <path
            key={i}
            d={`M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`}
            fill={colors[i]}
            opacity={i === 1 ? 0.8 : 1}
          />
        );
      })}
    </g>
  );
}

/** Dibujo del producto (4:5). Ocupa todo el contenedor. */
export function MakeupArt({ product, className }: { product: MakeupProduct; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = product.hex ?? "#d9466f";
  const palette: Palette = { c, cd: darker(c), cl: lighter(c), uid };
  const Form = FORMS[product.form] ?? Lipstick;
  return (
    <svg viewBox="0 0 100 125" role="img" aria-label={product.name} className={cn("absolute inset-0 size-full", className)}>
      <defs>
        {/* borde blanco de sticker + sombra corta con desenfoque */}
        <filter id={`st-${uid}`} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="grow" />
          <feFlood floodColor={PAPER} />
          <feComposite in2="grow" operator="in" result="outline" />
          <feGaussianBlur in="grow" stdDeviation="2.4" result="blur" />
          <feOffset in="blur" dy="3.5" result="drop" />
          <feFlood floodColor="#8e1f3d" floodOpacity=".28" />
          <feComposite in2="drop" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="62.5" r="40" fill="#fbe3ec" />
      <Sparkles seed={product.id} />
      <g filter={`url(#st-${uid})`} transform="translate(5 18) scale(0.9)">
        <Form {...palette} />
      </g>
    </svg>
  );
}

/** Foto del producto si la hay; si no, el dibujo. Fondo rosa, proporción 4:5. */
export function MakeupVisual({
  product,
  sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  priority,
  className,
}: {
  product: MakeupProduct;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("bg-blush ring-lip/5 relative aspect-[4/5] overflow-hidden rounded-lg ring-1", className)}>
      {product.image ? (
        <div className="bg-blush-soft absolute inset-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={sizes}
            preload={priority}
            loading={priority ? "eager" : undefined}
            quality={90}
            className="object-contain p-[8%]"
          />
        </div>
      ) : (
        <MakeupArt product={product} />
      )}
    </div>
  );
}
