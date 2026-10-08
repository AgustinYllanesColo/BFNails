import type { NextRequest } from "next/server";

/**
 * Placeholder de diseño: SVG con un set de 5 uñas en la forma pedida y los colores
 * del diseño. Se usa hasta tener las fotos reales. Cacheable.
 */
export const runtime = "edge";

const SHAPE_PATHS: Record<string, string> = {
  // viewBox 0 0 60 160, base en y=160
  almendra: "M30 0 C44 20 56 60 56 100 L56 160 L4 160 L4 100 C4 60 16 20 30 0 Z",
  ovalada: "M30 0 C50 0 56 40 56 90 L56 160 L4 160 L4 90 C4 40 10 0 30 0 Z",
  cuadrada: "M6 0 L54 0 L56 160 L4 160 Z",
  coffin: "M16 0 L44 0 L56 110 L56 160 L4 160 L4 110 Z",
  stiletto: "M30 0 L56 120 L56 160 L4 160 L4 120 Z",
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const seed = p.get("seed") ?? "bf";
  const shape = SHAPE_PATHS[p.get("shape") ?? "almendra"] ? (p.get("shape") as string) : "almendra";
  const colors = (p.get("colors") ?? "e8c4b0").split(",").map((c) => `#${c.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "e8c4b0"}`);
  const i = Number(p.get("i") ?? 0);
  const h = hash(seed + i);
  const bg = i % 2 === 0 ? "#f5e8c8" : "#fef7e7";
  const [c1, c2 = c1, c3 = c2] = colors;
  const path = SHAPE_PATHS[shape];

  const nails = [0, 1, 2, 3, 4]
    .map((n) => {
      const scale = [0.86, 0.95, 1, 0.95, 0.84][n];
      const x = 90 + n * 128;
      const y = 150 + [40, 10, 0, 10, 48][n];
      const rot = (n - 2) * 3 + ((h >> (n * 3)) % 3) - 1;
      const fill = n === 3 && colors.length > 2 ? c3 : n % 2 ? c2 : c1;
      return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale * 1.9})">
        <path d="${path}" fill="${fill}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>
        <path d="${path}" fill="url(#gloss)" opacity="0.9"/>
        <ellipse cx="18" cy="28" rx="7" ry="18" fill="white" opacity="0.45" transform="rotate(-12 18 28)"/>
      </g>`;
    })
    .join("");

  const stars = [0, 1, 2, 3]
    .map((n) => {
      const x = 40 + ((h >> (n * 5)) % 700);
      const y = 40 + ((h >> (n * 7 + 2)) % 620);
      const s = 10 + ((h >> (n * 2)) % 18);
      return `<path transform="translate(${x} ${y}) scale(${s / 24})" d="M12 1.5l2.9 7.1 7.6.5-5.9 4.9 1.9 7.4L12 17.3 5.5 21.4l1.9-7.4L1.5 9.1l7.6-.5z" fill="#4a0e0e" opacity="0.9"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="white" stop-opacity="0.35"/>
      <stop offset="0.5" stop-color="white" stop-opacity="0"/>
      <stop offset="1" stop-color="black" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="${bg}"/>
  ${stars}
  ${nails}
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
