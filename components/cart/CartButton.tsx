"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "motion/react";
import { useHydrated, useReducedMotion } from "@/lib/hooks";
import { EASE, SPRING_POP } from "@/lib/motion-core";
import { useCart } from "@/lib/store/cart";
import { CART_BUMP_EVENT, FLY_EVENT } from "@/components/motion/FlyToCart";
import { Icon } from "@/components/ui/icons";

/** Respaldo: si la ficha nunca aterriza (se desmontó, se cortó), el contador sube igual a los 700 ms. */
const FALLBACK_MS = 700;

const setsLabel = (n: number) => `${n} ${n === 1 ? "set" : "sets"}`;

type Direction = 1 | -1;

/**
 * La bolsita del nav (PLAN W2-A.6). El contador es de lo que le gusta al dueño: solo se sincroniza con el vuelo.
 *
 * - `[data-cart-target]` va en el wrapper del ícono: ahí aterriza la ficha de `flyToCart` y ahí se aplasta (el link
 *   conserva su hover y su press sin pelear por el `transform`).
 * - Si hay una ficha en el aire (`bf:fly`), el número visible espera a que aterrice (`bf:cart-bump`, ~560 ms después
 *   del click); de respaldo sube a los 700 ms. Sin vuelo (el + del carrito) o con reduced-motion sube en el acto, y
 *   bajar nunca espera.
 * - El badge entra y sale solo entre 0 y n (resorte `SPRING_POP`); entre números el dígito rueda hacia arriba (o
 *   hacia abajo si baja) y, si ya había sets, el badge late una vez.
 * - `aria-label` "Carrito, n set(s)" con el valor real de la store, en el acto (lo leen los tests y los lectores);
 *   un `role="status"` anuncia "Sumaste un set" cuando sube después de hidratar.
 */
export function CartButton() {
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const n = hydrated ? count : 0;

  /** Fichas volando hacia la bolsita. */
  const [inAir, setInAir] = useState(0);
  /** Sets sumados a la store que todavía no "llegaron" a la bolsita. */
  const [pending, setPending] = useState(0);
  const [prev, setPrev] = useState({ n, hydrated });
  const [message, setMessage] = useState("");

  // Estado derivado de un cambio (se ajusta durante el render, sin efectos): la hidratación no cuenta como "sumar".
  if (prev.n !== n || prev.hydrated !== hydrated) {
    setPrev({ n, hydrated });
    if (hydrated && prev.hydrated) {
      if (n > prev.n) {
        if (!reduced && inAir > 0) setPending((p) => p + (n - prev.n));
        setMessage(`Sumaste un set. Tenés ${setsLabel(n)}.`);
      } else {
        setPending(0);
      }
    }
  }

  const shown = Math.max(0, n - pending);

  // Sentido del rodillo del dígito: sube → entra desde abajo; baja → desde arriba.
  const [roll, setRoll] = useState<{ shown: number; dir: Direction }>({ shown, dir: 1 });
  if (roll.shown !== shown) setRoll({ shown, dir: shown > roll.shown ? 1 : -1 });

  useEffect(() => {
    const onFly = () => setInAir((a) => a + 1);
    const onBump = () => {
      setInAir((a) => Math.max(0, a - 1));
      setPending((p) => Math.max(0, p - 1));
    };
    window.addEventListener(FLY_EVENT, onFly);
    window.addEventListener(CART_BUMP_EVENT, onBump);
    return () => {
      window.removeEventListener(FLY_EVENT, onFly);
      window.removeEventListener(CART_BUMP_EVENT, onBump);
    };
  }, []);

  // Respaldo: nada queda retenido más de 700 ms después del último cambio.
  useEffect(() => {
    if (pending === 0 && inAir === 0) return;
    const t = setTimeout(() => {
      setPending(0);
      setInAir(0);
    }, FALLBACK_MS);
    return () => clearTimeout(t);
  }, [pending, inAir]);

  // Latido del badge cuando sube un número que ya estaba (0 → 1 lo resuelve la entrada del badge).
  const bumpRef = useRef<HTMLSpanElement>(null);
  const lastShown = useRef(shown);
  useEffect(() => {
    const before = lastShown.current;
    lastShown.current = shown;
    if (shown > before && before > 0 && bumpRef.current) {
      animate(bumpRef.current, { scale: [1, 1.2, 1] }, { duration: 0.3, ease: EASE.ui });
    }
  }, [shown]);

  return (
    <>
      <Link
        href="/carrito"
        aria-label={`Carrito, ${setsLabel(n)}`}
        className="bg-cream-deep text-bordo ring-bordo/10 hover:bg-bordo hover:text-cream rounded-pill relative grid size-11 place-items-center ring-1 transition-[background-color,color,scale] duration-200 ease-[var(--ease-ui)] active:scale-[0.97] active:duration-100"
      >
        <span data-cart-target="" className="inline-grid place-items-center">
          <Icon name="bag" size={20} />
        </span>

        <AnimatePresence initial={false}>
          {shown > 0 && (
            <motion.span
              key="badge"
              aria-hidden
              data-cart-count={shown}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.15, ease: EASE.ui } }}
              transition={SPRING_POP}
              className="bg-red text-cream ring-cream rounded-pill absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center overflow-hidden px-1 text-[12px] leading-none font-bold tabular-nums ring-2"
            >
              <span ref={bumpRef} className="relative grid place-items-center">
                <AnimatePresence mode="popLayout" initial={false} custom={roll.dir}>
                  <motion.span
                    key={shown}
                    custom={roll.dir}
                    variants={{
                      enter: (d: Direction) => ({ y: 10 * d, opacity: 0 }),
                      center: { y: 0, opacity: 1 },
                      exit: (d: Direction) => ({ y: -10 * d, opacity: 0 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
                    className="block"
                  >
                    {shown}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
