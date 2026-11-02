import { useId } from "react";
import Image from "next/image";
import type { MakeupForm, MakeupProduct } from "@/lib/data/makeup";
import { cn } from "@/lib/format";
import { MakeupVideo } from "./MakeupVideo";

/**
 * Dibujo del producto mientras no haya foto: una "calcomanía" del envase según su forma, pintada con el color
 * del producto (`hex`), con contorno bordó, borde blanco de sticker y sombra suave, sobre fondo rosa.
 * Todas las formas comparten trazo (2 px bordó), brillo blanco y paleta de envases, para que se lean como una serie.
 * Para que dos productos de la misma forma no se vean iguales, el color de la tapa, los destellos y una leve
 * inclinación salen del id; si el producto tiene marca (o nombre de línea real), va escrita en el envase.
 */

const OUTLINE = "#4a0e0e";
const CASE = "#3a1420"; // envase oscuro (labiales, compactos)
const GOLD = "#e2b65c";
const GOLD_DARK = "#b98a35";
const PAPER = "#fffdf8";
const WOOD = "#f1d3a8";
const INK = "#1d1a1a";
const PINK = "#ec7fa3";

/** Colores de tapa/envase: se elige uno por producto según el id. */
const CAPS = [CASE, "#1f1a1d", GOLD, "#f4b8c8", PAPER, "#7a2340", "#b9a4d8", "#e8c1a8"];

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
/** Luminancia aproximada (0–1). */
function lum(c: string): number {
  const [r, g, b] = parse(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
/** Color de letra legible sobre un fondo. */
const ink = (bg: string) => (lum(bg) > 0.58 ? OUTLINE : PAPER);

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

const line = { stroke: OUTLINE, strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const shine = { stroke: "#ffffff", strokeWidth: 2.4, strokeLinecap: "round" as const, fill: "none", opacity: 0.7 };

type Palette = {
  c: string;
  cd: string;
  cl: string;
  uid: string;
  /** Texto del envase (marca o palabra del nombre). */
  label: string;
  /** Color de tapa/envase propio del producto. */
  cap: string;
  /** Unidades del pack (×3, ×12), si el nombre lo dice. */
  count: number;
};

/**
 * Nombre de línea de los productos sin marca, tal como figura en el ticket de compra (Bella Central, 01/11).
 * Solo nombres reales: si un producto no tiene marca ni línea, el envase va sin texto (no se inventa una "marca").
 */
const PRODUCT_LINE: Record<string, string> = {
  "mascara-sky-high": "Sky High",
  "lip-glaze-super-stay-matte": "Super Stay",
  "lapiz-labial-lip-contour": "Lip Contour",
  "brocha-city": "City",
};
function labelFor(p: MakeupProduct): string {
  return p.brand?.trim() || PRODUCT_LINE[p.id] || "";
}

/**
 * Texto del envase, centrado en (x, y). Ajusta el tamaño al ancho `w`; si hay alto `h` y el texto tiene espacios,
 * lo parte en dos renglones cuando así entra más grande.
 */
function Label({ text, x, y, w, h = 7, max = 6, fill, rotate = 0 }: { text: string; x: number; y: number; w: number; h?: number; max?: number; fill: string; rotate?: number }) {
  const t = text.trim().toUpperCase();
  if (!t) return null;
  const K = 0.68; // ancho medio de una mayúscula en em
  const one = Math.min(max, w / (Math.max(t.length, 2) * K), h);
  let lines = [t];
  let fs = one;
  const sp = t.indexOf(" ");
  if (sp > 0) {
    // corte en el espacio más cercano al medio
    let best = sp;
    for (let i = 0; i < t.length; i++) if (t[i] === " " && Math.abs(i - t.length / 2) < Math.abs(best - t.length / 2)) best = i;
    const two = [t.slice(0, best), t.slice(best + 1)];
    const fs2 = Math.min(max, w / (Math.max(...two.map((s) => s.length), 2) * K), h / 2.15);
    if (fs2 > one * 1.12) {
      lines = two;
      fs = fs2;
    }
  }
  const lh = fs * 1.08;
  return (
    <text
      x={x}
      y={y}
      fontSize={fs.toFixed(2)}
      fontWeight={700}
      letterSpacing={(fs * 0.05).toFixed(2)}
      textAnchor="middle"
      fill={fill}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      {lines.map((l, i) => (
        <tspan key={i} x={x} y={(y + (i - (lines.length - 1) / 2) * lh + fs * 0.36).toFixed(2)}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function Lipstick({ c, cd, cap, label }: Palette) {
  return (
    <g transform="rotate(-10 50 54)">
      {/* tapa, apoyada al lado */}
      <g transform="rotate(16 76 66)">
        <rect x="66" y="46" width="21" height="38" rx="3" fill={cap} {...line} />
        <rect x="66" y="46" width="21" height="6" rx="2" fill={GOLD} {...line} />
        <path d="M71 57 V77" {...shine} opacity={0.35} />
      </g>
      <path d="M41 46 V25 Q41 19 47 17 L59 12 V46 Z" fill={c} {...line} />
      <path d="M59 12 L47 17 Q41 19 41 25" fill="none" stroke={cd} strokeWidth="3" opacity=".5" />
      <path d="M45 42 V27" {...shine} />
      <rect x="38" y="45" width="24" height="14" rx="2" fill={GOLD} {...line} />
      <path d="M38 52 H62" stroke={GOLD_DARK} strokeWidth="1.5" />
      <rect x="36" y="58" width="28" height="30" rx="3" fill={cap} {...line} />
      <path d="M40 62 V84" {...shine} opacity={0.35} />
      <Label text={label} x={51} y={73} w={21} h={20} fill={ink(cap)} />
    </g>
  );
}

function Gloss({ c, cd, cl, cap, label }: Palette) {
  return (
    <g>
      {/* frasco transparente con el gloss adentro */}
      <g transform="rotate(-8 38 60)">
        <rect x="34" y="27" width="12" height="9" rx="1.5" fill={GOLD} {...line} />
        <rect x="27" y="35" width="26" height="54" rx="9" fill={PAPER} fillOpacity=".55" {...line} />
        <rect x="31" y="46" width="18" height="39" rx="6" fill={c} />
        <path d="M31 52 Q40 48 49 52" fill="none" stroke={cl} strokeWidth="2" opacity=".8" />
        <circle cx="45.5" cy="57" r="1.3" fill="#fff" opacity=".9" />
        <circle cx="34.5" cy="80" r="1" fill="#fff" opacity=".9" />
        <path d="M31.5 42 V78" {...shine} />
        <Label text={label} x={41} y={67} w={32} h={13} max={6.4} fill={ink(c)} rotate={-90} />
      </g>
      {/* aplicador: tapa + varilla + pie de ciervo */}
      <g transform="rotate(14 66 50)">
        <rect x="59" y="10" width="14" height="32" rx="4" fill={cap} {...line} />
        <path d="M63 15 V36" {...shine} opacity={0.35} />
        <path d="M66 42 V68" stroke={OUTLINE} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M66 42 V68" stroke={PAPER} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M62 67 Q66 64 70 67 L70 80 Q66 88 62 80 Z" fill={cd} {...line} />
        <path d="M64 70 V78" stroke={cl} strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Mascara({ c, cd, cap, label }: Palette) {
  // la negra clásica lleva banda dorada; las de color, una banda del tono de tapa del producto
  const band = lum(c) < 0.18 ? GOLD : cap === c ? cd : cap;
  return (
    <g>
      <g transform="rotate(-8 36 60)">
        <rect x="31" y="26" width="10" height="8" rx="1.5" fill={GOLD} {...line} />
        <rect x="24" y="33" width="24" height="57" rx="11" fill={c} {...line} />
        <rect x="24" y="74" width="24" height="7" fill={band} stroke={OUTLINE} strokeWidth="1.2" />
        <path d="M28.5 40 V70" {...shine} />
        <Label text={label} x={37.5} y={56} w={34} h={14} max={7} fill={ink(c)} rotate={-90} />
      </g>
      <g transform="rotate(14 66 50)">
        <rect x="58" y="8" width="16" height="36" rx="7" fill={c} {...line} />
        <rect x="58" y="36" width="16" height="5" fill={band} stroke={OUTLINE} strokeWidth="1.2" />
        <path d="M62 14 V32" {...shine} />
        <path d="M66 44 V64" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        {/* cepillo: espiral de cerdas */}
        {Array.from({ length: 8 }, (_, i) => {
          const y = 64 + i * 2.8;
          const w = 6.5 - Math.abs(i - 3.5) * 0.55;
          return <path key={i} d={`M${66 - w} ${y} L${66 + w} ${y + 1.2}`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" />;
        })}
        <path d="M66 63 V86" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Pencil({ c, cl, cap, label }: Palette) {
  return (
    <g transform="rotate(-38 50 52)">
      {/* lápiz de fondo (otro tono del mismo color) */}
      <g transform="translate(-4 16)" opacity=".95">
        <rect x="14" y="44" width="54" height="12" rx="2" fill={cl} {...line} />
        <path d="M68 44 L81 50 L68 56 Z" fill={WOOD} {...line} />
        <path d="M76.5 47.8 L82 50 L76.5 52.2 Z" fill={c} />
      </g>
      <rect x="10" y="42" width="11" height="14" rx="3" fill={cap} {...line} />
      <rect x="20" y="42" width="50" height="14" rx="1.5" fill={c} {...line} />
      <path d="M27 44.8 H64" {...shine} opacity={0.45} />
      <path d="M70 42 L86 49 L70 56 Z" fill={WOOD} {...line} />
      <path d="M80.4 46.6 L88 49 L80.4 51.4 Z" fill={c} {...line} strokeWidth={1.4} />
      <rect x="20" y="42" width="5" height="14" fill={GOLD} {...line} strokeWidth={1.4} />
      <Label text={label} x={47} y={49.6} w={38} h={9} max={7} fill={ink(c)} />
    </g>
  );
}

function Liner({ c, cd, cap, label }: Palette) {
  return (
    <g>
      {/* el trazo con rabito que deja */}
      <path d="M14 30 Q40 40 70 27 Q78 23 86 15" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
      <g transform="rotate(-24 50 62)">
        <rect x="12" y="56" width="50" height="13" rx="6.5" fill={c} {...line} />
        <rect x="46" y="56" width="5" height="13" fill={GOLD} {...line} strokeWidth={1.4} />
        <Label text={label} x={30} y={62.5} w={28} h={9} max={6.5} fill={ink(c)} />
        <path d="M62 57.5 L80 62.5 L62 67.5 Z" fill={cd} {...line} />
        <path d="M76 61.4 L84 62.5 L76 63.6 Z" fill={c} />
        {/* tapa */}
        <rect x="40" y="76" width="34" height="13" rx="6.5" fill={cap} {...line} />
        <path d="M50 80 H68" {...shine} opacity={0.5} />
        <rect x="40" y="76" width="6" height="13" rx="3" fill={GOLD} {...line} strokeWidth={1.4} />
      </g>
    </g>
  );
}

function Lashes({ c, cap, label }: Palette) {
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
      {/* bandeja con solapa */}
      <rect x="10" y="26" width="80" height="58" rx="12" fill={PAPER} {...line} />
      <rect x="16" y="32" width="68" height="46" rx="8" fill="#fbe3ec" />
      <g transform="translate(0 8)">
        {lashes.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        ))}
        <path d={`M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`} fill="none" stroke={c} strokeWidth="3.6" strokeLinecap="round" />
      </g>
      <rect x="30" y="17" width="40" height="13" rx="4" fill={cap} {...line} />
      <Label text={label} x={50} y={23.5} w={34} h={9} max={6.5} fill={ink(cap)} />
    </g>
  );
}

/** Racimos de pestañas en filas, de cortas a largas. */
function ClusterTray({ c, cap, label }: Palette) {
  const rows = [
    { y: 48, L: 7 },
    { y: 63, L: 9 },
    { y: 79, L: 11 },
  ];
  const xs = [30, 45, 60, 75];
  return (
    <g>
      <rect x="10" y="22" width="80" height="66" rx="10" fill={PAPER} {...line} />
      <rect x="10" y="22" width="80" height="14" rx="7" fill={cap} {...line} />
      <path d="M11 33 H89" stroke={cap} strokeWidth="4" />
      <Label text={label} x={50} y={29} w={70} h={9} max={6.5} fill={ink(cap)} />
      {rows.map((r, ri) => (
        <g key={ri}>
          <rect x="15" y={r.y - r.L - 2} width="72" height={r.L + 5} rx="3" fill="#fbe3ec" />
          <text x="19.5" y={r.y - r.L / 2 + 1.6} fontSize="3.6" fill={OUTLINE} opacity=".6" textAnchor="middle" style={{ fontFamily: "var(--font-mono), monospace" }}>
            {10 + ri * 2}
          </text>
          {xs.map((x) => (
            <g key={x}>
              {Array.from({ length: 7 }, (_, j) => {
                const a = ((-48 + j * 16) * Math.PI) / 180;
                const bx = x - 3 + j;
                const L = r.L * (1 - Math.abs(j - 3) * 0.08);
                const ex = bx + Math.sin(a) * L;
                const ey = r.y - Math.cos(a) * L;
                const qx = bx + Math.sin(a) * L * 0.4;
                const qy = r.y - Math.cos(a) * L * 0.7;
                return <path key={j} d={`M${bx} ${r.y} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`} fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" />;
              })}
              <path d={`M${x - 3.6} ${r.y} H${x + 3.6}`} stroke={c} strokeWidth="2.6" strokeLinecap="round" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

function Compact({ c, cd, cl, cap, label }: Palette) {
  return (
    <g>
      {/* tapa abierta con espejo */}
      <ellipse cx="50" cy="34" rx="31" ry="20" fill={cap} {...line} />
      <ellipse cx="50" cy="34" rx="25" ry="15" fill="#fbeef3" stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M36 32 Q40 24 50 22" {...shine} opacity={0.9} stroke="#ffffff" />
      <path d="M58 42 L64 37" {...shine} opacity={0.9} />
      <rect x="43" y="51" width="14" height="5" rx="1.5" fill={GOLD} {...line} strokeWidth={1.4} />
      {/* base */}
      <path d="M19 66 V76 A31 18 0 0 0 81 76 V66 Z" fill={darker(cap, 0.22)} {...line} />
      <ellipse cx="50" cy="66" rx="31" ry="18" fill={cap} {...line} />
      <ellipse cx="50" cy="66" rx="24" ry="13" fill={c} stroke={cd} strokeWidth="1.6" />
      {/* polvo prensado: relieve en ondas */}
      <path d="M33 66 Q41 60 50 66 T67 66" fill="none" stroke={cl} strokeWidth="1.6" opacity=".8" />
      <path d="M37 71 Q44 66 51 71 T63 71" fill="none" stroke={cd} strokeWidth="1.2" opacity=".35" />
      <ellipse cx="42" cy="61" rx="7" ry="2.6" fill="#fff" opacity=".35" />
      <Label text={label} x={50} y={88.5} w={30} h={6} max={5.2} fill={ink(darker(cap, 0.22))} />
    </g>
  );
}

/** Polvo suelto: pote con tamiz agujereado, tapa atrás y una borla adelante. */
function LoosePowder({ c, cd, cl, cap, label }: Palette) {
  const holes: [number, number][] = [];
  for (const [r, n] of [
    [0, 1],
    [7, 6],
    [14, 10],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r;
      holes.push([44 + Math.cos(a) * r * 1.15, 58 + Math.sin(a) * r * 0.36]);
    }
  }
  return (
    <g>
      {/* tapa apoyada atrás */}
      <g transform="rotate(-12 54 30)">
        <path d="M28 28 V36 A26 8 0 0 0 80 36 V28 Z" fill={darker(cap, 0.22)} {...line} />
        <ellipse cx="54" cy="28" rx="26" ry="8" fill={cap} {...line} />
        <ellipse cx="48" cy="26.5" rx="11" ry="2" fill="#fff" opacity=".25" />
      </g>
      {/* pote */}
      <path d="M16 58 V80 A28 9 0 0 0 72 80 V58 Z" fill={cap} {...line} />
      <path d="M21 63 V79" {...shine} opacity={0.4} />
      <rect x="16" y="66" width="56" height="9" fill={PAPER} stroke={OUTLINE} strokeWidth="1.2" />
      <Label text={label} x={44} y={70.5} w={44} h={7} max={5.6} fill={OUTLINE} />
      <ellipse cx="44" cy="58" rx="28" ry="9" fill={GOLD} {...line} />
      <ellipse cx="44" cy="58" rx="23.5" ry="7" fill={c} stroke={cd} strokeWidth="1.2" />
      {holes.map(([x, y], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="0.9" fill={cd} />
      ))}
      {/* polvo volado */}
      <circle cx="22" cy="49" r="1.4" fill={cl} stroke={cd} strokeWidth=".6" />
      <circle cx="28" cy="45" r="1" fill={cl} stroke={cd} strokeWidth=".6" />
      <circle cx="17" cy="44" r=".9" fill={cl} stroke={cd} strokeWidth=".6" />
      {/* borla */}
      <g transform="rotate(-10 76 80)">
        <ellipse cx="76" cy="80" rx="15" ry="13" fill="#fde9ef" {...line} />
        <ellipse cx="76" cy="80" rx="11" ry="9.5" fill="none" stroke={OUTLINE} strokeWidth="1" strokeDasharray="1.6 1.8" opacity=".55" />
        <path d="M67 74 Q76 70 85 74" fill="none" stroke={GOLD} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M67 74 Q76 70 85 74" fill="none" stroke={OUTLINE} strokeWidth="0.8" strokeLinecap="round" opacity=".6" />
        <path d="M70 83 Q73 86 78 86" {...shine} stroke={c} opacity={0.9} />
      </g>
    </g>
  );
}

function Pot({ c, cd, cl, cap, label }: Palette) {
  return (
    <g>
      {/* tapa apoyada atrás, inclinada */}
      <g transform="rotate(-14 64 34)">
        <path d="M40 30 V39 A24 7 0 0 0 88 39 V30 Z" fill={darker(cap, 0.22)} {...line} />
        <ellipse cx="64" cy="30" rx="24" ry="7" fill={cap} {...line} />
        <ellipse cx="58" cy="28.5" rx="10" ry="2" fill="#fff" opacity=".18" />
      </g>
      {/* frasco */}
      <path d="M22 58 V77 A28 10 0 0 0 78 77 V58 Z" fill={PAPER} {...line} />
      <path d="M27 63 V77" {...shine} stroke={cl} opacity={0.9} />
      <Label text={label} x={52} y={74} w={38} h={10} max={6} fill={OUTLINE} />
      <ellipse cx="50" cy="58" rx="28" ry="10" fill={GOLD} {...line} />
      <ellipse cx="50" cy="58" rx="23" ry="7.5" fill={c} stroke={cd} strokeWidth="1.4" />
      {/* marca del dedo en la crema */}
      <path d="M38 58 Q46 53 56 57 Q61 59 64 56" fill="none" stroke={cl} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 61 Q48 58 58 61" fill="none" stroke={cd} strokeWidth="1.2" opacity=".45" />
    </g>
  );
}

function Stick({ c, cd, cap, label }: Palette) {
  return (
    <g transform="rotate(-8 46 56)">
      {/* tapa, al costado */}
      <g transform="rotate(18 78 70)">
        <rect x="66" y="50" width="26" height="36" rx="6" fill={cap} {...line} />
        <path d="M71 56 V80" {...shine} opacity={0.35} />
      </g>
      <path d="M33 42 V24 Q33 13 47 13 Q61 13 61 24 V42 Z" fill={c} {...line} />
      <path d="M33 30 Q47 34 61 30" fill="none" stroke={cd} strokeWidth="1.4" opacity=".55" />
      <path d="M38 38 V24 Q38 19 43 17.5" {...shine} />
      <rect x="30" y="40" width="34" height="8" rx="2" fill={GOLD} {...line} />
      <rect x="30" y="47" width="34" height="42" rx="7" fill={cap} {...line} />
      <path d="M35 53 V83" {...shine} opacity={0.35} />
      <Label text={label} x={48} y={68} w={26} h={22} max={6.5} fill={ink(cap)} />
    </g>
  );
}

/** Rubor en barra: envase ancho, producto con corte en bisel y una pincelada de color detrás. */
function BlushStick({ c, cd, cl, cap, label, uid }: Palette) {
  const g = `bl-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={cl} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      {/* pincelada de muestra */}
      <path d="M12 28 Q14 20 24 18 Q44 14 62 19 Q78 23 90 14 Q84 26 66 27 Q46 28 30 26 Q18 26 12 28 Z" fill={c} opacity=".7" />
      <path d="M22 21.5 Q40 18 56 21" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".6" />
      {/* tapa al costado */}
      <g transform="rotate(20 80 74)">
        <rect x="68" y="56" width="24" height="34" rx="10" fill={cap} {...line} />
        <path d="M73 62 V84" {...shine} opacity={0.35} />
      </g>
      <g transform="rotate(-6 46 60)">
        <path d="M30 50 V36 Q30 33 33 32.5 L60 27 Q63 26.6 63 30 V50 Z" fill={`url(#${g})`} {...line} />
        <path d="M34 46 V37" {...shine} />
        <path d="M31 36 L61 30" stroke={cd} strokeWidth="1.2" opacity=".4" />
        <rect x="27" y="48" width="39" height="8" rx="2" fill={GOLD} {...line} />
        <path d="M27 52 H66" stroke={GOLD_DARK} strokeWidth="1.2" />
        <rect x="27" y="55" width="39" height="36" rx="12" fill={cap} {...line} />
        <path d="M32 61 V85" {...shine} opacity={0.35} />
        <Label text={label} x={47.5} y={73} w={30} h={18} max={6.4} fill={ink(cap)} />
      </g>
      {/* destellos "mágicos" */}
      <path d="M72 38 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4 Z" fill={GOLD} stroke={OUTLINE} strokeWidth=".8" />
      <path d="M80 48 l.9 2.2 2.2 .9 -2.2 .9 -.9 2.2 -.9 -2.2 -2.2 -.9 2.2 -.9 Z" fill={PAPER} stroke={OUTLINE} strokeWidth=".7" />
    </g>
  );
}

function Pump({ c, cl, cap, label }: Palette) {
  return (
    <g>
      {/* bomba */}
      <rect x="47" y="16" width="6" height="12" fill={GOLD_DARK} {...line} strokeWidth={1.4} />
      <rect x="38" y="10" width="22" height="9" rx="3" fill={cap} {...line} />
      <path d="M60 12.5 H72 Q75 12.5 75 15.5 V16.5 H60" fill={cap} {...line} />
      <rect x="40" y="27" width="20" height="10" rx="2" fill={GOLD} {...line} />
      <path d="M40 32 H60" stroke={GOLD_DARK} strokeWidth="1.4" />
      {/* frasco de vidrio con la base adentro */}
      <rect x="27" y="36" width="46" height="54" rx="10" fill={PAPER} fillOpacity=".6" {...line} />
      <rect x="31" y="40" width="38" height="46" rx="7" fill={c} />
      <path d="M31 50 Q50 46 69 50" fill="none" stroke={cl} strokeWidth="1.6" opacity=".8" />
      {/* etiqueta */}
      <rect x="36" y="58" width="28" height="16" rx="2.5" fill={PAPER} stroke={OUTLINE} strokeWidth="1.4" />
      <Label text={label} x={50} y={66} w={24} h={12} max={6.5} fill={OUTLINE} />
      <path d="M33 44 V82" {...shine} />
    </g>
  );
}

function BrowGel({ c, cap, label }: Palette) {
  return (
    <g>
      <g transform="rotate(-6 38 64)">
        <rect x="31" y="38" width="10" height="7" rx="1.5" fill={GOLD} {...line} />
        <rect x="26" y="44" width="20" height="46" rx="10" fill={PAPER} fillOpacity=".6" {...line} />
        <rect x="29.5" y="56" width="13" height="30" rx="6.5" fill={c} />
        <path d="M30 51 V82" {...shine} />
        <Label text={label} x={37} y={70} w={24} h={10} max={6} fill={ink(c)} rotate={-90} />
      </g>
      <g transform="rotate(16 66 46)">
        <rect x="59" y="10" width="14" height="30" rx="5" fill={cap} {...line} />
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

/** Polvo para cejas: paletita rectangular con dos tonos, tapa transparente abierta y pincel en bisel. */
function BrowDuo({ c, cd, cl, cap, label }: Palette) {
  const light = lighter(c, 0.32);
  return (
    <g>
      {/* tapa transparente, abierta hacia atrás */}
      <path d="M16 50 L22 18 Q23 15 26 15 L78 15 Q81 15 82 18 L86 50 Z" fill={PAPER} fillOpacity=".55" {...line} />
      <path d="M27 22 L23 44" {...shine} opacity={0.85} />
      <path d="M33 22 L31 30" {...shine} opacity={0.6} />
      {/* base */}
      <path d="M14 58 V86 Q14 92 20 92 H80 Q86 92 86 86 V58 Z" fill={darker(cap, 0.2)} {...line} />
      <rect x="14" y="50" width="72" height="38" rx="6" fill={cap} {...line} />
      <rect x="19" y="54" width="29" height="22" rx="3" fill={light} stroke={OUTLINE} strokeWidth="1.4" />
      <rect x="52" y="54" width="29" height="22" rx="3" fill={c} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M22 62 Q28 58 34 62 T45 62" fill="none" stroke={c} strokeWidth="1.2" opacity=".35" />
      <path d="M55 62 Q61 58 67 62 T78 62" fill="none" stroke={cl} strokeWidth="1.2" opacity=".5" />
      <path d="M58 70 Q64 66 70 69" fill="none" stroke={cd} strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
      <Label text={label} x={50} y={82.4} w={50} h={6} max={5.4} fill={ink(cap)} />
      {/* pincel en bisel, apoyado sobre la tapa */}
      <g transform="rotate(-20 52 36)">
        <path d="M22 34.6 L58 34 V38 L22 37.4 Q20 36 22 34.6 Z" fill={INK} {...line} strokeWidth={1.6} />
        <rect x="58" y="33" width="9" height="6" rx="1" fill={GOLD} {...line} strokeWidth={1.4} />
        <path d="M67 33.2 L76 30 L76 41.2 L67 38.8 Z" fill={cd} {...line} strokeWidth={1.6} />
      </g>
    </g>
  );
}

/** Delineador doble: punta líquida de un lado, lápiz del otro. */
function DoubleLiner({ c, cd, cap, label }: Palette) {
  return (
    <g>
      {/* lo que deja cada punta: rabito líquido y trazo de lápiz */}
      <path d="M12 26 Q36 34 58 24 Q66 20 74 12" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M44 93 Q60 97 82 89" fill="none" stroke="#3b3436" strokeWidth="3.6" strokeLinecap="round" opacity=".75" />
      <g transform="rotate(-28 50 58)">
        {/* lado líquido */}
        <path d="M17 53 L5 58 L17 63 Z" fill={INK} {...line} />
        <rect x="15" y="51.5" width="7" height="13" rx="1.2" fill={GOLD} {...line} strokeWidth={1.4} />
        <rect x="22" y="51" width="28" height="14" rx="2" fill={c} {...line} />
        {/* lado lápiz */}
        <rect x="50" y="51" width="28" height="14" rx="2" fill={cd} {...line} />
        <path d="M78 51 L92 58 L78 65 Z" fill={WOOD} {...line} />
        <path d="M86.6 54.8 L93 58 L86.6 61.2 Z" fill={INK} {...line} strokeWidth={1.2} />
        <rect x="47.5" y="51" width="5" height="14" fill={cap === c ? GOLD : cap} {...line} strokeWidth={1.4} />
        <path d="M25 54 H46" {...shine} opacity={0.45} />
        <Label text={label} x={35.5} y={58} w={24} h={11} max={6} fill={ink(c)} />
        <Label text="2 en 1" x={65} y={58} w={22} h={9} max={5.6} fill={ink(cd)} />
      </g>
    </g>
  );
}

/** Pack de lápices: caja con lápices asomando (×6 o más) o un abanico atado con cinta (×2 a ×5). */
function PencilSet({ c, cd, cl, cap, label, count }: Palette) {
  if (count >= 6) {
    const alt = lum(c) < 0.25 ? PINK : lighter(c, 0.5);
    const box = cap === c ? CASE : cap;
    return (
      <g>
        {Array.from({ length: 7 }, (_, i) => {
          const x = 21 + i * 8.6;
          const top = 16 + ((i * 5) % 3) * 4;
          const body = i % 2 ? alt : c;
          return (
            <g key={i}>
              <rect x={x} y={top + 10} width="7.4" height={56 - top} fill={body} {...line} strokeWidth={1.6} />
              <path d={`M${x} ${top + 10} L${x + 3.7} ${top} L${x + 7.4} ${top + 10} Z`} fill={WOOD} {...line} strokeWidth={1.6} />
              <path d={`M${x + 2.3} ${top + 3.4} L${x + 3.7} ${top} L${x + 5.1} ${top + 3.4} Z`} fill={c} />
            </g>
          );
        })}
        <path d="M14 58 L18 92 H82 L86 58 Z" fill={darker(box, 0.15)} {...line} />
        <rect x="14" y="52" width="72" height="34" rx="4" fill={box} {...line} />
        <path d="M19 57 H81" stroke={GOLD} strokeWidth="1.6" />
        <Label text={label} x={50} y={65.5} w={56} h={9} max={7} fill={ink(box)} />
        <text x="50" y="81.5" fontSize="10" fill={GOLD} stroke={OUTLINE} strokeWidth=".6" textAnchor="middle" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
          ×{count}
        </text>
      </g>
    );
  }
  const n = Math.max(2, Math.min(5, count || 3));
  const shades = [lighter(c, 0.35), c, darker(c, 0.3), cl, cd];
  const spread = 13;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = (i - (n - 1) / 2) * spread;
        const body = shades[i % shades.length];
        return (
          <g key={i} transform={`rotate(${a} 50 92)`}>
            <rect x="44.5" y="32" width="11" height="58" rx="1.5" fill={body} {...line} />
            <path d="M47.5 36 V64" {...shine} opacity={0.45} />
            <path d="M44.5 32 L50 16 L55.5 32 Z" fill={WOOD} {...line} />
            <path d="M48 21.8 L50 16 L52 21.8 Z" fill={body} {...line} strokeWidth={1.2} />
          </g>
        );
      })}
      {/* cinta y etiqueta colgante */}
      <rect x="30" y="68" width="40" height="11" rx="3" fill={cap} {...line} />
      <Label text={label} x={50} y={73.5} w={34} h={8} max={6.4} fill={ink(cap)} />
      <path d="M68 76 Q74 82 72 88" fill="none" stroke={OUTLINE} strokeWidth="1.2" />
      <g transform="rotate(12 74 94)">
        <rect x="65" y="87" width="18" height="12" rx="3" fill={PAPER} {...line} strokeWidth={1.6} />
        <text x="74" y="96" fontSize="7.5" fill={OUTLINE} textAnchor="middle" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
          ×{n}
        </text>
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

function Brush({ c, cd, cl, label }: Palette) {
  return (
    <g transform="rotate(-36 50 52)">
      <path d="M8 49 Q8 46 11 46 L50 44.5 L50 55.5 L11 54 Q8 54 8 51 Z" fill={c} {...line} />
      <path d="M14 47.6 H44" stroke={cl} strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
      <Label text={label} x={30} y={50.3} w={28} h={8} max={6.4} fill={ink(c)} />
      <rect x="50" y="42.5" width="15" height="15" rx="2" fill="#e8c1a8" {...line} />
      <path d="M52 45 H63" stroke="#fff" strokeWidth="1.6" opacity=".7" strokeLinecap="round" />
      <path d="M65 43 Q76 34 88 41 Q95 50 88 59 Q76 66 65 57 Z" fill="#fbeee6" {...line} />
      <path d="M81 37.5 Q86 39 88 41 Q95 50 88 59 Q86 61 81 62.5 Q86 50 81 37.5 Z" fill={cd} opacity=".9" />
      <path d="M68 48 Q76 46 84 47 M68 52 Q76 54 84 53" stroke="#e7cdbd" strokeWidth="1.2" fill="none" />
    </g>
  );
}

/** Combo: caja de regalo con moño, en el color del producto, y un labial y un gloss asomando. */
function GiftBox({ c, cd, cl, cap, label }: Palette) {
  return (
    <g>
      {/* lo que asoma de la caja */}
      <g transform="rotate(-12 38 34)">
        <rect x="32" y="16" width="12" height="26" rx="3" fill={cap} {...line} />
        <path d="M33 16 L38 6 L43 16 Z" fill="#c42b3c" {...line} />
      </g>
      <g transform="rotate(10 62 32)">
        <rect x="57" y="12" width="11" height="30" rx="4" fill={PAPER} fillOpacity=".7" {...line} />
        <rect x="59" y="22" width="7" height="17" rx="3" fill="#f08fb0" />
      </g>
      {/* caja */}
      <rect x="18" y="40" width="64" height="50" rx="5" fill={c} {...line} />
      <rect x="14" y="34" width="72" height="13" rx="4" fill={cd} {...line} />
      <path d="M22 52 V84" {...shine} opacity={0.4} />
      {/* cinta */}
      <rect x="45" y="34" width="10" height="56" fill={cl} stroke={OUTLINE} strokeWidth="1.6" />
      {/* moño */}
      <path d="M50 35 C40 22 28 26 34 34 C38 39 46 37 50 35 Z" fill={cl} {...line} />
      <path d="M50 35 C60 22 72 26 66 34 C62 39 54 37 50 35 Z" fill={cl} {...line} />
      <circle cx="50" cy="35" r="4" fill={GOLD} {...line} />
      <Label text={label} x={50} y={70} w={30} h={11} max={6.4} fill={ink(c)} />
    </g>
  );
}

const FORMS: Record<MakeupForm, (p: Palette) => React.ReactElement> = {
  combo: GiftBox,
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
  suelto: LoosePowder,
  doble: DoubleLiner,
  racimo: ClusterTray,
  "set-lapices": PencilSet,
  "rubor-barra": BlushStick,
  "duo-cejas": BrowDuo,
};

/** Destellos de cuatro puntas: posición según el id, así las tarjetas no son todas iguales. */
function Sparkles({ seed }: { seed: number }) {
  const h = seed;
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

/** Dibujo de respaldo para una forma que este archivo no conoce (dato nuevo del admin): el más parecido de su categoría. */
const BY_CATEGORY: Record<MakeupProduct["category"], MakeupForm> = {
  rostro: "base",
  ojos: "delineador",
  pestanas: "mascara",
  cejas: "gel",
  labios: "labial",
  brochas: "brocha",
  combos: "combo",
};

/**
 * Dibujo del producto (4:5). Ocupa todo el contenedor. Es decorativo por defecto (el nombre ya está escrito al lado);
 * con `label` se anuncia como imagen con ese texto.
 */
export function MakeupArt({ product, className, label }: { product: MakeupProduct; className?: string; label?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  // un hex mal cargado desde el admin ("rojo", "#12") pintaría el envase de negro: se usa el rosa de la marca
  const c = product.hex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(product.hex.trim()) ? product.hex.trim() : "#d9466f";
  const h = hash(product.id);
  const count = Number(/[×x]\s?(\d{1,2})\b/i.exec(product.name)?.[1] ?? 0);
  const palette: Palette = { c, cd: darker(c), cl: lighter(c), uid, label: labelFor(product), cap: CAPS[(h >>> 4) % CAPS.length], count };
  const tilt = ((h >>> 9) % 9) - 4; // −4° a 4°, fijo por producto
  const Form = FORMS[product.form] ?? FORMS[BY_CATEGORY[product.category]] ?? Lipstick;
  return (
    <svg
      viewBox="0 0 100 125"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: false })}
      className={cn("absolute inset-0 size-full", className)}
    >
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
      <Sparkles seed={h} />
      <g filter={`url(#st-${uid})`} transform={`rotate(${tilt} 50 64) translate(5 18) scale(0.9)`}>
        <Form {...palette} />
      </g>
    </svg>
  );
}

/**
 * Foto del producto si la hay; si no, el dibujo. Fondo rosa, proporción 4:5. Decorativa por defecto: en la tarjeta,
 * el nombre ya es el título y repetirlo como alt lo hace leer dos veces. Pasá `alt` cuando la imagen va sola.
 */
export function MakeupVisual({
  product,
  sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  priority,
  className,
  alt = "",
  video,
}: {
  product: MakeupProduct;
  sizes?: string;
  priority?: boolean;
  className?: string;
  alt?: string;
  /** Si el producto tiene video, corre sobre la foto. Solo en la tarjeta del catálogo: los stickers chicos van con la foto. */
  video?: boolean;
}) {
  return (
    <div className={cn("ring-bordo/5 relative aspect-[4/5] overflow-hidden rounded-lg ring-1", product.image ? "bg-cream-deep" : "bg-blush", className)}>
      {product.image ? (
        // foto real de borde a borde, como las de uñas (antes iba achicada dentro de una placa rosa y parecía un recuadro)
        <Image
          src={product.image}
          alt={alt}
          fill
          sizes={sizes}
          preload={priority}
          loading={priority ? "eager" : undefined}
          quality={90}
          className="object-cover"
        />
      ) : (
        <MakeupArt product={product} label={alt || undefined} />
      )}
      {video && product.video && <MakeupVideo src={product.video} poster={product.image} />}
    </div>
  );
}
