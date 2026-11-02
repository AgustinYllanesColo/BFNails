"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhotoUploader } from "./PhotoUploader";

/**
 * Fotos y videos de un producto de maquillaje, dentro del formulario del admin (que es del servidor). Mientras algo
 * se está subiendo, los botones del formulario quedan deshabilitados: así no se guarda sin la foto nueva.
 */
export function MakeupMediaField({ initial, max }: { initial: string[]; max: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // el formulario de "nuevo producto" se vacía al guardar: las fotos también
  const [round, setRound] = useState(0);
  const isNew = initial.length === 0;
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form || !isNew) return;
    const onReset = () => setRound((r) => r + 1);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [isNew]);

  const onBusyChange = useCallback((busy: boolean) => {
    const form = ref.current?.closest("form");
    form?.querySelectorAll<HTMLButtonElement>("button:not([type=button])").forEach((b) => {
      b.disabled = busy;
      b.title = busy ? "Esperá a que terminen de subir las fotos" : "";
    });
  }, []);

  return (
    <div ref={ref}>
      <PhotoUploader key={round} name="media" initial={initial} folder="maquillaje" allowVideo max={max} onBusyChange={onBusyChange} />
    </div>
  );
}
