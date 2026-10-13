"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/hooks";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/lib/store/cart";

export function CartButton() {
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const mounted = useHydrated();
  const n = mounted ? count : 0;

  return (
    <Link
      href="/carrito"
      className="relative grid size-11 place-items-center rounded-pill bg-cream-deep text-bordo ring-1 ring-bordo/10 transition-colors hover:bg-bordo hover:text-cream"
      aria-label={`Carrito, ${n} ${n === 1 ? "set" : "sets"}`}
      data-cursor="carrito"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 7h12l1 13H5z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <AnimatePresence>
        {n > 0 && (
          <motion.span
            key={n}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-pill bg-red text-[11px] font-bold text-cream"
          >
            {n}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
