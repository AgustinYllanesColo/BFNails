"use client";

import {
  Fragment,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type ElementType,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MQ, isInViewportNow, registerEases } from "@/lib/motion";
import { Brush } from "./Brush";

gsap.registerPlugin(ScrollTrigger);

type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div";

type Props = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  as?: Tag;
  className?: string;
  children: ReactNode;
};

/*
 * Máscaras: recortan solo en vertical (`overflow-y: clip` admite `overflow-x: visible`), así nunca se comen las
 * colas de las letras ni las puntas redondeadas de la pincelada. El padding de arriba y de abajo (compensado con
 * margen negativo: el renglón no cambia de alto) deja lugar a tildes, ascendentes y descendentes con el interlineado
 * apretado de los titulares.
 */
const WORD_MASK =
  "inline-block overflow-y-clip align-bottom pt-[.08em] -mt-[.08em] pb-[.14em] -mb-[.14em]";
const BLOCK_MASK =
  "inline-block overflow-y-clip align-bottom pt-[.08em] -mt-[.08em] pb-[.2em] -mb-[.2em]";
const INNER = "inline-block origin-[0_100%]";

function Word({ children }: { children: ReactNode }) {
  return (
    <span data-w="" className={WORD_MASK}>
      <span data-wi="" className={INNER}>
        {children}
      </span>
    </span>
  );
}

function Block({ children }: { children: ReactNode }) {
  return (
    <span data-w="" className={BLOCK_MASK}>
      <span data-wi="" className={INNER}>
        {children}
      </span>
    </span>
  );
}

/** Aplana arrays y fragmentos; los números pasan a texto y lo vacío se descarta. */
function flatten(node: ReactNode, out: ReactNode[] = []): ReactNode[] {
  if (Array.isArray(node)) node.forEach((n) => flatten(n, out));
  else if (isValidElement(node) && node.type === Fragment)
    flatten((node.props as { children?: ReactNode }).children, out);
  else if (typeof node === "number") out.push(String(node));
  else if (node !== null && node !== undefined && typeof node !== "boolean") out.push(node);
  return out;
}

function words(text: string, key: string): ReactNode[] {
  return text
    .split(/(\s+)/)
    .filter((part) => part !== "")
    .map((part, i) => (/^\s+$/.test(part) ? part : <Word key={`${key}.${i}`}>{part}</Word>));
}

/**
 * Parte el texto en palabras en el render de React (sin reescribir el DOM): cada palabra va en su máscara y los
 * espacios quedan como texto, así el titular corta línea y se balancea como siempre y el texto se lee, se copia y se
 * busca igual. `Brush` y cualquier otro componente van enteros en una máscara más holgada, con la puntuación que los
 * sigue pegada ("al instante." no puede dejar el punto solo en otro renglón). Los elementos HTML (un
 * `<span className="text-bordo">`) se recorren por dentro conservando su elemento.
 */
function split(node: ReactNode, key: string): ReactNode[] {
  const list = flatten(node);
  const out: ReactNode[] = [];
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    const k = `${key}.${i}`;
    if (typeof n === "string") {
      out.push(...words(n, k));
      continue;
    }
    if (!isValidElement(n)) {
      out.push(n);
      continue;
    }
    const el = n as ReactElement<{ children?: ReactNode }>;
    if (el.type === Brush || typeof el.type !== "string") {
      const next = list[i + 1];
      const tail = typeof next === "string" ? (next.match(/^\S+/)?.[0] ?? "") : "";
      if (tail) list[i + 1] = (next as string).slice(tail.length);
      out.push(
        <Block key={k}>
          {el}
          {tail}
        </Block>,
      );
      continue;
    }
    if (el.type === "br") out.push(cloneElement(el, { key: k }));
    else out.push(cloneElement(el, { key: k }, split(el.props.children, k)));
  }
  return out;
}

/**
 * Titular que entra palabra por palabra (PLAN F3.2; reemplaza a SplitText): cada palabra sube desde atrás de su
 * máscara (`yPercent` 110 → 0, `rotate` 3 → 0, .9 s `bf.expo`, escalonado .04 s) cuando el titular cruza el 85 % del
 * viewport, después de `document.fonts.ready` (las palabras se miden con la fuente final).
 *
 * Nunca esconde lo que ya se ve: si el titular está en pantalla al hidratar (o cuando cargan las fuentes), queda
 * quieto. Con reduced-motion, el titular entero aparece con opacidad en 300 ms. No depende de la pausa manual.
 * Se usa a través de `Heading reveal` (Destacados, Teaser, Outro).
 */
export function WordReveal({ as = "h2", className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerEases();
    const mm = gsap.matchMedia();
    mm.add(MQ, (ctx) => {
      const { reduced } = ctx.conditions as { full: boolean; reduced: boolean };
      if (isInViewportNow(el)) return;

      if (reduced) {
        gsap.set(el, { autoAlpha: 0 });
        gsap.to(el, {
          autoAlpha: 1,
          duration: 0.3,
          ease: "power1.out",
          clearProps: "opacity,visibility",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
        return;
      }

      let live = true;
      const fonts = document.fonts?.ready ?? Promise.resolve();
      fonts.then(() => {
        // La carga de fuentes es asíncrona: si en el medio el titular entró en pantalla, ya no se esconde.
        if (!live || isInViewportNow(el)) return;
        ctx.add(() => {
          const words = el.querySelectorAll<HTMLElement>("[data-wi]");
          if (words.length === 0) return;
          gsap.set(words, { yPercent: 110, rotate: 3 });
          gsap.to(words, {
            yPercent: 0,
            rotate: 0,
            duration: 0.9,
            ease: "bf.expo",
            stagger: 0.04,
            clearProps: "transform",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
        });
      });
      return () => {
        live = false;
      };
    });
    return () => mm.revert();
  }, []);

  const Comp = as as ElementType;
  return (
    <Comp ref={ref} className={className} {...rest}>
      {split(children, "w")}
    </Comp>
  );
}
