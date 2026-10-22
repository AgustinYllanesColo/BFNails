"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { CHARM_CATEGORIES, type Charm, type CharmCategory } from "@/lib/data/content";

/** Filtro por familia de dijes: devuelve los chips y la lista ya filtrada. Solo muestra familias con dijes. */
export function useCharmFilter(charms: Charm[]) {
  const [category, setCategory] = useState<CharmCategory | null>(null);
  const present = CHARM_CATEGORIES.filter((c) => charms.some((ch) => ch.category === c.id));
  const visible = category ? charms.filter((c) => c.category === category) : charms;

  const chips =
    present.length > 1 ? (
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar dijes">
        <Chip
          selected={category === null}
          onClick={() => setCategory(null)}
          hint={String(charms.length)}
        >
          Todos
        </Chip>
        {present.map((c) => (
          <Chip
            key={c.id}
            selected={category === c.id}
            onClick={() => setCategory(category === c.id ? null : c.id)}
            hint={String(charms.filter((ch) => ch.category === c.id).length)}
          >
            {c.label}
          </Chip>
        ))}
      </div>
    ) : null;

  return { chips, visible };
}
