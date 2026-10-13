/**
 * Uñas press-on flotando de fondo: movimiento constante (CSS), distintas formas,
 * colores de marca y profundidades. Decorativo, no interactivo.
 */
const SHAPES: Record<string, string> = {
  almendra: "M30 0 C44 20 56 60 56 100 L56 160 L4 160 L4 100 C4 60 16 20 30 0 Z",
  coffin: "M16 0 L44 0 L56 110 L56 160 L4 160 L4 110 Z",
  ovalada: "M30 0 C50 0 56 40 56 90 L56 160 L4 160 L4 90 C4 40 10 0 30 0 Z",
  stiletto: "M30 0 L56 120 L56 160 L4 160 L4 120 Z",
};

type Spec = { x: string; y: string; size: number; shape: keyof typeof SHAPES; color: string; tip?: string; dur: number; delay: number; r: number; dx: number; dy: number; mobile?: boolean; blur?: boolean };

const NAILS: Spec[] = [
  { x: "4%", y: "22%", size: 110, shape: "almendra", color: "#4a0e0e", dur: 11, delay: 0, r: -18, dx: 24, dy: -40 },
  { x: "10%", y: "70%", size: 70, shape: "coffin", color: "#f2a7c3", dur: 13, delay: -4, r: 14, dx: -18, dy: -28, blur: true, mobile: false },
  { x: "88%", y: "20%", size: 90, shape: "ovalada", color: "#e8c4b0", tip: "#ffffff", dur: 12, delay: -2, r: 20, dx: -26, dy: -34 },
  { x: "90%", y: "64%", size: 120, shape: "stiletto", color: "#b51c1c", dur: 14, delay: -7, r: -12, dx: 20, dy: -44, mobile: false },
  { x: "72%", y: "84%", size: 64, shape: "almendra", color: "#c9a063", dur: 10, delay: -1, r: 30, dx: -14, dy: -24, blur: true },
  { x: "22%", y: "14%", size: 56, shape: "ovalada", color: "#f6efe6", dur: 9, delay: -5, r: -28, dx: 16, dy: -20, blur: true, mobile: false },
  { x: "66%", y: "12%", size: 76, shape: "coffin", color: "#4a0e0e", tip: "#f2a7c3", dur: 12.5, delay: -3, r: 10, dx: -22, dy: -30, mobile: false },
];

export function FloatingNails({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {NAILS.map((n, i) => (
        <div
          key={i}
          className={`absolute ${n.mobile === false ? "hidden md:block" : ""} ${n.blur ? "blur-[1.5px] opacity-70" : ""}`}
          style={{
            left: n.x,
            top: n.y,
            width: n.size * 0.375,
            height: n.size,
            animation: `drift ${n.dur}s ease-in-out ${n.delay}s infinite`,
            ["--r" as string]: `${n.r}deg`,
            ["--dx" as string]: `${n.dx}px`,
            ["--dy" as string]: `${n.dy}px`,
            willChange: "transform",
          }}
        >
          <svg viewBox="0 0 60 160" className="h-full w-full drop-shadow-[0_12px_18px_rgba(74,14,14,0.18)]">
            <defs>
              <linearGradient id={`fn-g-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.12" />
              </linearGradient>
              <clipPath id={`fn-c-${i}`}>
                <path d={SHAPES[n.shape]} />
              </clipPath>
            </defs>
            <path d={SHAPES[n.shape]} fill={n.color} />
            {n.tip && (
              <g clipPath={`url(#fn-c-${i})`}>
                <path d="M30 0 C44 20 52 45 54 70 C40 60 20 60 6 70 C8 45 16 20 30 0 Z" fill={n.tip} opacity="0.95" />
              </g>
            )}
            <path d={SHAPES[n.shape]} fill={`url(#fn-g-${i})`} />
            <ellipse cx="18" cy="30" rx="6" ry="18" fill="white" opacity="0.45" transform="rotate(-12 18 30)" />
          </svg>
        </div>
      ))}
    </div>
  );
}
