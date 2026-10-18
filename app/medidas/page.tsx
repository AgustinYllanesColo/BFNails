import type { Metadata } from "next";
import { Heading } from "@/components/ui/Section";
import { FINGERS, SIZE_ORDER, STANDARD_SIZES } from "@/lib/data/sizes";
import { SizeFinder } from "@/components/catalog/SizeFinder";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Medidas",
  description: "Medidas universales S, M y L o medida personalizada: cómo medir tus uñas.",
};

const STEPS = [
  { t: "Cinta sobre la uña", d: "Una tirita de papel o cinta, en la parte más ancha.", art: <StepTape /> },
  { t: "Marcá los bordes", d: "Un punto de cada lado, donde termina la uña.", art: <StepMark /> },
  { t: "Medí en mm", d: "Estirá la tira sobre una regla. Repetí en las 10.", art: <StepRuler /> },
];

export default function MedidasPage() {
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <Heading as="h1">Medidas</Heading>
        <p className="text-ink-soft mt-3 max-w-[44ch] text-lg">Elegí cómo querés pedir las tuyas.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a href="#universal" className="bg-bordo text-cream group rounded-xl p-5 shadow-sm">
            <span className="font-display block text-3xl">Universales</span>
            <span className="text-cream/80 mt-1 block">S, M o L. Sets en stock, entrega inmediata.</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
              Ver tabla →
            </span>
          </a>
          <a href="#personalizada" className="rounded-xl bg-white/80 p-5 shadow-sm ring-1 ring-bordo/10">
            <span className="font-display text-bordo block text-3xl">Personalizada</span>
            <span className="text-ink-soft mt-1 block">Tus 10 medidas exactas. Las hago a tu mano.</span>
            <span className="text-bordo mt-3 inline-flex items-center gap-1 text-sm font-semibold">
              Cómo medir →
            </span>
          </a>
        </div>
      </div>

      <section id="universal" className="bg-cream-deep mt-14 scroll-mt-24 py-16">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 className="font-display text-4xl">Medidas universales</h2>
            <p className="text-ink-soft mt-2">
              Ancho de cada uña en mm. Si estás entre dos, elegí la más chica.
            </p>
            <div className="mt-6 overflow-x-auto rounded-lg bg-white/80 ring-1 ring-bordo/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bordo text-cream text-left">
                    <th className="p-3 font-semibold">Medida</th>
                    {FINGERS.map((f) => (
                      <th key={f} className="p-3 font-semibold">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZE_ORDER.map((s) => (
                    <tr key={s} className="border-t border-bordo/10">
                      <td className="font-display text-bordo p-3 text-xl">{s}</td>
                      {STANDARD_SIZES[s].widthMm.map((w, i) => (
                        <td key={i} className="p-3 whitespace-nowrap">
                          {w} mm
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl">¿Cuál sos?</h2>
            <p className="text-ink-soft mt-2">Poné el ancho del pulgar y del anular.</p>
            <SizeFinder />
          </div>
        </div>
      </section>

      <section id="personalizada" className="container-x scroll-mt-24 pt-16">
        <h2 className="font-display text-4xl">Medida personalizada</h2>
        <p className="text-ink-soft mt-2">Medí las 10 uñas, cada mano por separado.</p>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-xl bg-white/80 p-4 ring-1 ring-bordo/10">
              <div className="bg-cream-deep aspect-[4/3] overflow-hidden rounded-lg">{s.art}</div>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-bordo text-2xl">{i + 1}</span>
                <span className="font-semibold">{s.t}</span>
              </p>
              <p className="text-ink-soft mt-1 text-sm">{s.d}</p>
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

/* ---------- Dibujos de los pasos (dedo visto de arriba) ---------- */

const SKIN = "#e9c2a6";
const SKIN_LINE = "#b98b70";
const NAIL = "#f6d9cf";

function Finger() {
  return (
    <>
      <path d="M95 240 V90 C95 40 205 40 205 90 V240 Z" fill={SKIN} stroke={SKIN_LINE} strokeWidth="2" />
      <path d="M112 150 V100 C112 62 188 62 188 100 V150 C188 160 112 160 112 150 Z" fill={NAIL} stroke={SKIN_LINE} strokeWidth="2" />
    </>
  );
}

function StepTape() {
  return (
    <svg viewBox="0 0 300 225" className="size-full" aria-hidden>
      <Finger />
      <rect x="40" y="108" width="220" height="22" rx="3" fill="#fffdf8" stroke="#4a0e0e" strokeOpacity=".35" strokeWidth="2" transform="rotate(-2 150 119)" />
    </svg>
  );
}

function StepMark() {
  return (
    <svg viewBox="0 0 300 225" className="size-full" aria-hidden>
      <Finger />
      <rect x="40" y="108" width="220" height="22" rx="3" fill="#fffdf8" stroke="#4a0e0e" strokeOpacity=".35" strokeWidth="2" />
      <circle cx="112" cy="119" r="5" fill="#b51c1c" />
      <circle cx="188" cy="119" r="5" fill="#b51c1c" />
      <path d="M112 92 V84 M188 92 V84 M112 88 H188" stroke="#4a0e0e" strokeWidth="2" />
    </svg>
  );
}

function StepRuler() {
  const ticks = Array.from({ length: 21 }, (_, i) => i);
  return (
    <svg viewBox="0 0 300 225" className="size-full" aria-hidden>
      <rect x="20" y="70" width="260" height="22" rx="3" fill="#fffdf8" stroke="#4a0e0e" strokeOpacity=".35" strokeWidth="2" />
      <circle cx="80" cy="81" r="5" fill="#b51c1c" />
      <circle cx="220" cy="81" r="5" fill="#b51c1c" />
      <rect x="20" y="110" width="260" height="56" rx="4" fill="#e2c29b" stroke="#8a5a2b" strokeWidth="2" />
      {ticks.map((i) => (
        <path key={i} d={`M${30 + i * 12} 110 v${i % 5 === 0 ? 18 : 10}`} stroke="#4a0e0e" strokeWidth="1.5" />
      ))}
      <path d="M80 98 V104 M220 98 V104" stroke="#b51c1c" strokeWidth="2" strokeDasharray="2 2" />
      <text x="150" y="196" textAnchor="middle" fontFamily="system-ui" fontWeight="700" fontSize="18" fill="#4a0e0e">
        14 mm
      </text>
    </svg>
  );
}
