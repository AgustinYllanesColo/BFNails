import type { Metadata } from "next";
import { Heading } from "@/components/ui/Section";
import { FINGERS, SIZE_ORDER, STANDARD_SIZES } from "@/lib/data/sizes";
import { SizeFinder } from "@/components/catalog/SizeFinder";
import { Button } from "@/components/ui/Button";
import { formatCm } from "@/lib/format";

export const metadata: Metadata = {
  title: "Medidas",
  description: "Medidas universales S, M y L o medida personalizada: cómo sacar las medidas de tus uñas.",
};

/** Los pasos de la guía de Brenda, con sus palabras. */
const STEPS = [
  { t: "Poné un pedazo de cinta sobre la uña natural, que cubra bien los laterales.", art: <StepTape /> },
  { t: "Marcá los laterales con una fibra o lapicera.", art: <StepMark /> },
  { t: "Pegá la cinta en una superficie plana y medí con una regla la distancia de una línea a la otra.", art: <StepRuler /> },
  { t: "Anotalo y repetí los mismos pasos con todas las demás uñas.", art: <StepAll /> },
];

export default function MedidasPage() {
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <Heading as="h1">Medidas</Heading>
        <p className="text-ink-soft mt-3 max-w-[44ch] text-lg">Elegí cómo querés pedir las tuyas.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a href="#universal" className="bg-bordo text-cream rounded-lg p-5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
            <span className="font-display block text-2xl">Universales</span>
            <span className="text-cream/80 mt-1 block">S, M o L. Sets en stock, entrega inmediata.</span>
            <span className="mt-3 inline-block text-sm font-semibold">Ver tabla →</span>
          </a>
          <a
            href="#personalizada"
            className="rounded-lg bg-white/80 p-5 shadow-sm ring-1 ring-bordo/10 transition-transform duration-300 hover:-translate-y-0.5"
          >
            <span className="font-display text-bordo block text-2xl">Personalizada</span>
            <span className="text-ink-soft mt-1 block">Tus 10 medidas exactas. Las hago a tu mano.</span>
            <span className="text-bordo mt-3 inline-block text-sm font-semibold">Cómo medir →</span>
          </a>
        </div>
      </div>

      <section id="universal" aria-labelledby="universal-t" className="bg-cream-deep mt-14 scroll-mt-24 py-14 md:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <Heading>
              <span id="universal-t">Medidas universales</span>
            </Heading>
            <p className="text-ink-soft mt-3">Ancho de cada uña, en cm. Si estás entre dos, elegí la más chica.</p>
            <div className="mt-6 overflow-hidden rounded-lg bg-white/80 ring-1 ring-bordo/10">
              <table className="w-full text-[15px] tabular-nums">
                <thead>
                  <tr className="bg-bordo text-cream">
                    <th scope="col" className="px-4 py-3 text-left font-semibold">
                      Uña
                    </th>
                    {SIZE_ORDER.map((s) => (
                      <th key={s} scope="col" className="font-display px-4 py-3 text-center text-xl font-normal">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FINGERS.map((f, i) => (
                    <tr key={f} className="border-t border-bordo/10">
                      <th scope="row" className="px-4 py-3 text-left font-semibold">
                        {f}
                      </th>
                      {SIZE_ORDER.map((s) => (
                        <td key={s} className="px-4 py-3 text-center">
                          {formatCm(STANDARD_SIZES[s].widthMm[i])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl md:text-3xl">¿Cuál sos?</h2>
            <p className="text-ink-soft mt-2">Poné el ancho del pulgar y del anular.</p>
            <SizeFinder />
          </div>
        </div>
      </section>

      <section id="personalizada" aria-labelledby="personalizada-t" className="container-x scroll-mt-24 pt-14 md:pt-20">
        <Heading>
          <span id="personalizada-t">Medida personalizada</span>
        </Heading>
        <p className="text-ink-soft mt-3">¿Cómo saco las medidas de mis uñas?</p>
        <ol className="mt-8 max-w-3xl divide-y divide-bordo/10 rounded-lg bg-white/80 ring-1 ring-bordo/10">
          {STEPS.map((s, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr_88px] items-center gap-4 p-4 sm:grid-cols-[auto_1fr_120px] sm:gap-6 sm:p-5">
              <span className="font-display text-bordo grid size-10 place-items-center rounded-pill bg-cream-deep text-xl">
                {i + 1}
              </span>
              <p className="text-[15px] leading-snug sm:text-base">{s.t}</p>
              <div className="aspect-square overflow-hidden rounded-md bg-cream">{s.art}</div>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/catalogo" size="lg">
            Ir al catálogo
          </Button>
          <Button href="/disena" size="lg" variant="secondary">
            Diseñá tu set
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ---------- Dibujos de los pasos (dedo visto de arriba), en el estilo de la guía de Brenda ---------- */

const SKIN = "#f3c7a5";
const SKIN_LINE = "#d9a07d";
const NAIL = "#f9e3dc";
const TAPE = "#e6e6ea";
const TAPE_LINE = "#c4c4cc";
const MARK = "#d6336c";

function Finger() {
  return (
    <>
      <path d="M38 120V50c0-18 44-18 44 0v70" fill={SKIN} stroke={SKIN_LINE} strokeWidth="1.5" />
      <path d="M46 72V46c0-14 28-14 28 0v26c0 4-28 4-28 0z" fill={NAIL} stroke={SKIN_LINE} strokeWidth="1.5" />
      <path d="M52 46c1-6 6-9 9-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".8" fill="none" />
      <path d="M50 96c6 3 14 3 20 0" stroke={SKIN_LINE} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  );
}

/** Cinta con bordes cortados a mano. */
function Tape({ y = 52, h = 18 }: { y?: number; h?: number }) {
  const b = y + h;
  return (
    <path
      d={`M18 ${y + 1} L102 ${y - 1} L104 ${y + 4} L101 ${y + 8} L104 ${y + 12} L102 ${b + 1} L18 ${b - 1} L16 ${b - 5} L19 ${y + 9} L16 ${y + 5} Z`}
      fill={TAPE}
      fillOpacity=".88"
      stroke={TAPE_LINE}
      strokeWidth="1"
    />
  );
}

function StepTape() {
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      <Finger />
      <Tape />
    </svg>
  );
}

function StepMark() {
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      <Finger />
      <Tape />
      <path d="M46.5 50v22M73.5 50v22" stroke={MARK} strokeWidth="2" strokeDasharray="3 2.5" strokeLinecap="round" />
    </svg>
  );
}

function StepRuler() {
  const ticks = Array.from({ length: 19 }, (_, i) => i);
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      <Tape y={30} h={22} />
      <path d="M46.5 32v18M73.5 32v18" stroke={MARK} strokeWidth="2" strokeDasharray="3 2.5" strokeLinecap="round" />
      <path d="M46.5 56v10M73.5 56v10M49 61h22" stroke={MARK} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="10" y="70" width="100" height="22" rx="4" fill="#f6c3d6" stroke="#4a0e0e" strokeWidth="1.5" />
      {ticks.map((i) => (
        <path key={i} d={`M${15 + i * 5} 70v${i % 2 ? 5 : 9}`} stroke="#4a0e0e" strokeWidth="1.2" />
      ))}
    </svg>
  );
}

function StepAll() {
  const nails = [
    { x: 14, w: 18, h: 26 },
    { x: 36, w: 14, h: 30 },
    { x: 54, w: 15, h: 32 },
    { x: 73, w: 14, h: 30 },
    { x: 91, w: 12, h: 24 },
  ];
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      {nails.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={72 - n.h} width={n.w} height={n.h} rx={n.w / 2} fill={NAIL} stroke={SKIN_LINE} strokeWidth="1.5" />
          <path d={`M${n.x + 3} 82h${n.w - 6}`} stroke={MARK} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      <text x="60" y="104" textAnchor="middle" fontFamily="system-ui" fontWeight="700" fontSize="12" fill="#4a0e0e">
        × 10
      </text>
    </svg>
  );
}
