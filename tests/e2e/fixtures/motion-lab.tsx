/**
 * Laboratorio de W1-F3 para el e2e (tests/e2e/fundaciones-f3.spec.ts): monta `WordReveal`, `Brush` y `starBurst` con
 * los titulares reales de PLAN §2.6 en una página aparte, sin depender de que una ruta los use (los adopta la ola 2).
 * El spec lo empaqueta con esbuild y lo sirve con `page.route` sobre el servidor de la app, con el CSS real de la
 * app (tokens, fuentes, utilidades de Tailwind): lo que se mide es el componente de verdad en Chromium.
 *
 * Solo usa clases que la app ya genera (Tailwind escanea también este archivo).
 */
import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WordReveal } from "@/components/motion/WordReveal";
import { Brush } from "@/components/motion/Brush";
import { starBurst } from "@/components/motion/burst";

const H1 = "font-display text-balance text-h1 text-ink";
const H2 = "font-display text-balance text-h2 text-ink";

function Lab() {
  const stamp = useRef<HTMLButtonElement>(null);
  return (
    <main>
      <section className="container-x" id="lab-top" style={{ paddingTop: 72, paddingBottom: 48 }}>
        <h1 className={H1}>
          Elegí tu <Brush mode="load">próximo set</Brush>
        </h1>
        <WordReveal as="h2" className={H2} id="lab-first" style={{ marginTop: 24 }}>
          Sets que <Brush>vuelan</Brush>
        </WordReveal>
        <button
          ref={stamp}
          id="lab-burst"
          type="button"
          onClick={() => starBurst(stamp.current)}
          style={{
            marginTop: 28,
            minHeight: 48,
            padding: "0 24px",
            borderRadius: 999,
            border: "2px solid var(--bordo-900)",
            color: "var(--bordo-900)",
            fontWeight: 600,
          }}
        >
          Sellar
        </button>
      </section>
      <div style={{ height: 1100 }} />
      <section className="container-x" id="lab-teaser" style={{ paddingBlock: 48 }}>
        <WordReveal as="h2" className={H2}>
          Tu idea, con precio <Brush>al instante</Brush>.
        </WordReveal>
      </section>
      <section data-surface="inverse" className="bg-bordo" id="lab-how" style={{ paddingBlock: 64 }}>
        <div className="container-x">
          <h2 className="font-display text-balance text-h2 text-cream">
            De tu idea <Brush tone="inverse">a tus manos</Brush>
          </h2>
        </div>
      </section>
      <section className="container-x" id="lab-faq" style={{ paddingBlock: 64 }}>
        <h2 className={H2}>
          Lo que todas <Brush mode="view">preguntan</Brush>
        </h2>
      </section>
      <section className="container-x" id="lab-outro" style={{ paddingBlock: 64 }}>
        <WordReveal as="h2" className={H2} style={{ maxWidth: "14ch" }}>
          Tus próximas uñas, hechas <Brush>por Bren</Brush>.
        </WordReveal>
      </section>
      <div style={{ height: 1000 }} />
    </main>
  );
}

createRoot(document.getElementById("lab")!).render(<Lab />);

/*
 * Lo mismo que hace SmoothScroll en la app: con la fuente final cambian los altos de los titulares y ScrollTrigger
 * se refresca. Se espera a que el laboratorio esté pintado (dos frames: recién ahí el navegador pidió las fuentes;
 * antes, `fonts.ready` resuelve en el acto). El spec espera `__labReady`.
 */
(window as unknown as { __labReady: Promise<void> }).__labReady = new Promise<void>((resolve) => {
  const twoFrames = () => requestAnimationFrame(() => requestAnimationFrame(after));
  const after = () =>
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
      resolve();
    });
  twoFrames();
});
