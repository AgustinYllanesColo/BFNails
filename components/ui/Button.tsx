"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/icons";

/**
 * Botón y link con forma de botón (PLAN W1-F2.1). Sin anillo de foco propio: manda el outline global
 * (`var(--focus)`, bordó sobre crema y amarillo dentro de `[data-surface="inverse"]`). Los `hover:` de Tailwind v4 ya
 * viven dentro de `@media (hover: hover)`: en el celular no quedan pegados después del tap.
 *
 * - `variant`: primary (acción principal) · secondary (anillo bordó) · ghost · leopard (un uso por página) ·
 *   inverse (sobre bordó: crema que pasa a amarillo).
 * - `size`: sm 44 px · md 48 px · lg 56 px de alto (todos ≥ 44 px de objetivo táctil).
 * - `loading`: ignora el click y anuncia `aria-busy`; el spinner aparece a los 150 ms (un click rápido no parpadea) y
 *   se queda al menos 400 ms. Mientras el spinner siga a la vista el botón sigue ocupado (`aria-busy`, click ignorado),
 *   aunque `loading` ya haya vuelto a `false`: nunca parece ocupado y acepta clicks a la vez. Etiqueta y spinner se
 *   apilan en la misma celda, así el ancho no cambia.
 */
type Variant = "primary" | "secondary" | "ghost" | "leopard" | "inverse";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-pill text-center font-sans font-semibold tracking-[-0.005em] select-none transition-[translate,scale,background-color,color,box-shadow] duration-200 ease-[var(--ease-ui)] active:scale-[0.97] active:duration-100 disabled:pointer-events-none aria-busy:cursor-progress";

const variants: Record<Variant, string> = {
  primary:
    "bg-bordo text-cream shadow-md hover:-translate-y-px hover:bg-bordo-soft hover:shadow-lg active:bg-bordo-deep active:shadow-press disabled:bg-cream-ink disabled:text-ink-faint disabled:shadow-none",
  secondary:
    "text-bordo ring-2 ring-bordo ring-inset hover:bg-bordo hover:text-cream active:bg-bordo-deep active:text-cream disabled:text-ink-faint disabled:ring-cream-ink",
  ghost: "text-ink hover:bg-cream-deep active:bg-cream-deep",
  leopard: "btn-leopard text-cream shadow-md hover:-translate-y-px hover:shadow-lg",
  inverse:
    "bg-cream text-bordo shadow-md hover:-translate-y-px hover:bg-yellow active:bg-yellow disabled:bg-surface-inverse-raised disabled:text-on-bordo-faint disabled:shadow-none",
};

const sizes: Record<Size, string> = {
  sm: "h-11 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  /** Ícono de 20 px antes de la etiqueta. */
  iconLeft?: IconName;
  /** Ícono de 20 px después de la etiqueta (las flechas se corren 2 px al hover). */
  iconRight?: IconName;
  "data-cursor"?: string;
};

type ButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
    /** Acción en curso: click ignorado, `aria-busy`, spinner apilado sobre la etiqueta. */
    loading?: boolean;
  };

type LinkProps = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href"> & {
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
    loading?: undefined;
  };

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button(props: ButtonProps | LinkProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    iconLeft,
    iconRight,
    loading,
    ...rest
  } = props;
  const cls = buttonClass({ variant, size, className });
  const spinner = useDelayedSpinner(Boolean(loading));
  // ocupado mientras carga y mientras el spinner cumple su mínimo en pantalla
  const busy = Boolean(loading) || spinner;

  const content = (
    <Label iconLeft={iconLeft} iconRight={iconRight} loading={loading} spinner={spinner}>
      {children}
    </Label>
  );

  if (typeof props.href === "string") {
    const linkRest = rest as Omit<LinkProps, keyof Common | "loading">;
    return (
      <Link {...linkRest} className={cls}>
        {content}
      </Link>
    );
  }

  const {
    onClick,
    type = "button",
    ...buttonRest
  } = rest as Omit<ButtonProps, keyof Common | "loading">;
  return (
    <button
      {...buttonRest}
      type={type}
      className={cls}
      aria-busy={busy || undefined}
      aria-disabled={busy || buttonRest["aria-disabled"] || undefined}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (busy) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {content}
    </button>
  );
}

function Label({
  children,
  iconLeft,
  iconRight,
  loading,
  spinner,
}: {
  children: ReactNode;
  iconLeft?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  /** Spinner a la vista (lo decide Button con `useDelayedSpinner`, que también marca el botón como ocupado). */
  spinner: boolean;
}) {
  const inner = (
    <>
      {iconLeft ? <Icon name={iconLeft} size={20} className="-ml-1" /> : null}
      {children}
      {iconRight ? (
        <Icon
          name={iconRight}
          size={20}
          className={cn(
            "-mr-1",
            (iconRight === "arrow" || iconRight === "chevron") &&
              "transition-[translate] duration-200 ease-[var(--ease-ui)] group-hover/btn:translate-x-0.5",
          )}
        />
      ) : null}
    </>
  );
  if (loading === undefined && !spinner) return inner;
  return (
    <span className="grid place-items-center">
      <span
        className={cn(
          "inline-flex items-center gap-2 transition-opacity duration-150 [grid-area:1/1]",
          spinner && "opacity-0",
        )}
      >
        {inner}
      </span>
      {/* Indicador de progreso: feedback esencial (WCAG 2.2.2), sin data-ambient para que la pausa no lo congele */}
      <span
        aria-hidden
        className={cn(
          "inline-flex transition-opacity duration-150 [grid-area:1/1]",
          spinner ? "opacity-100" : "opacity-0",
        )}
      >
        {spinner ? (
          <Icon name="spinner" size={20} className="animate-[spin-slow_0.8s_linear_infinite]" />
        ) : null}
      </span>
    </span>
  );
}

/** El spinner entra a los 150 ms de `loading` y, una vez visible, se sostiene ≥ 400 ms. */
function useDelayedSpinner(loading: boolean): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    if (loading) {
      if (visible) return;
      const t = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, 150);
      return () => clearTimeout(t);
    }
    if (!visible) return;
    const t = setTimeout(
      () => setVisible(false),
      Math.max(0, 400 - (Date.now() - shownAt.current)),
    );
    return () => clearTimeout(t);
  }, [loading, visible]);
  return visible;
}
