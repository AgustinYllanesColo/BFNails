import Image from "next/image";
import type { Kit } from "@/lib/data/content";

/** Qué trae el kit de aplicación: fotos (si hay) y la lista. */
export function KitSection({ kit, id = "kit" }: { kit: Kit; id?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="bg-cream-deep py-16 md:py-24">
      <div className="container-x grid items-center gap-8 md:grid-cols-2">
        <div>
          <h2 id={`${id}-t`} className="font-display text-4xl md:text-5xl">
            Qué trae el kit
          </h2>
          <p className="mt-2 text-ink-soft">Todo lo que necesitás para ponértelas en casa.</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {kit.items.map((it) => (
              <li key={it.name} className="flex items-start gap-3 rounded-lg bg-white/80 p-3 ring-1 ring-bordo/10">
                <span aria-hidden className="text-bordo">✦</span>
                <span>
                  <span className="block font-semibold">{it.name}</span>
                  {it.detail && <span className="block text-[13px] text-ink-soft">{it.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {kit.images.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {kit.images.slice(0, 4).map((src, i) => (
              <div
                key={src}
                className={`relative overflow-hidden rounded-lg shadow-sm ${i === 0 && kit.images.length !== 2 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
              >
                <Image src={src} alt="Kit de aplicación" fill sizes="(min-width: 768px) 40vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
