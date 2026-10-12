"use client";

import {
  useCallback,
  useRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { useAmbientPause } from "@/lib/hooks";

type Tag = "div" | "section" | "footer" | "header" | "aside" | "article" | "span" | "ul" | "li";

type Props = HTMLAttributes<HTMLElement> & {
  /** Elemento a renderizar (`div` por defecto). */
  as?: Tag;
  /** Margen del IntersectionObserver: el ambiente arranca un poco antes de entrar y se frena un poco después de salir. */
  rootMargin?: string;
  /** Ref al elemento (React 19: `ref` es una prop). Útil para usar la zona como `trigger` de GSAP. */
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
};

/**
 * Zona de ambiente (PLAN §2.5, regla 3): toda sección con animaciones `infinite` (`[data-ambient]`) vive adentro de
 * una. Fuera de vista la zona lleva `data-offscreen` y la capa de `globals.css` pausa sus `[data-ambient]`, así el
 * compositor no trabaja en lo que nadie ve. No toca nada más: sin atributo, todo corre.
 *
 * Acepta cualquier atributo HTML (`id`, `data-surface`, `aria-*`), así reemplaza al `<section>`/`<footer>` sin
 * wrappers de más.
 */
export function AmbientZone({ as = "div", rootMargin = "200px", ref, children, ...rest }: Props) {
  const inner = useRef<HTMLElement | null>(null);
  useAmbientPause(inner, rootMargin);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      inner.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLElement | null }).current = node;
    },
    [ref],
  );

  const Comp = as as ElementType;
  return (
    <Comp ref={setRef} {...rest}>
      {children}
    </Comp>
  );
}
