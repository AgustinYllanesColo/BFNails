"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icons";
import { toast } from "@/lib/store/toast";

/**
 * Copiar al portapapeles (PLAN W1-F2.5): alias, CBU, número de pedido.
 * Las etiquetas se apilan en la misma celda y se cruzan (opacidad + 6 px en 180 ms): el ancho no salta, ni siquiera
 * cuando falla. El éxito es bordó con tilde dibujada (1,6 s), vibración corta y aviso para lectores de pantalla.
 * Si el navegador no deja escribir en el portapapeles (iOS viejo, contexto inseguro), marca el texto de
 * `selectTargetId` (el botón dice "Marcado" 2,5 s) y la instrucción va en un toast, fuera del botón: así una fila con
 * un CBU de 22 dígitos no se desarma a 390 px.
 */
type Props = {
  value?: string;
  /** @deprecated usar `value` (compatibilidad con los usos actuales). */
  text?: string;
  label?: string;
  copiedLabel?: string;
  /** Nombre accesible si la etiqueta visible no alcanza ("Copiar alias"). */
  ariaLabel?: string;
  /** Nodo cuyo texto se selecciona si falla el portapapeles. */
  selectTargetId?: string;
  /** `inverse` sobre bordó: crema en reposo y amarillo al copiar. */
  tone?: "light" | "inverse";
  className?: string;
};

type Status = "idle" | "copied" | "manual";

const MANUAL_HINT = "Mantené apretado el texto para copiarlo";

export function CopyButton({
  value,
  text,
  label = "Copiar",
  copiedLabel = "Copiado",
  ariaLabel,
  selectTargetId,
  tone = "light",
  className,
}: Props) {
  const content = value ?? text ?? "";
  const [status, setStatus] = useState<Status>("idle");
  /** ¿Quedó marcado el texto del destino? Solo entonces el botón dice "Marcado". */
  const [marked, setMarked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hintToast = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const settle = (next: Status, ms: number) => {
    clearTimeout(timer.current);
    setStatus(next);
    timer.current = setTimeout(() => setStatus("idle"), ms);
  };

  const onCopy = async () => {
    if (await writeClipboard(content)) {
      navigator.vibrate?.(10);
      settle("copied", 1600);
      return;
    }
    const target = selectTargetId ? document.getElementById(selectTargetId) : null;
    if (target) {
      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setMarked(Boolean(target));
    settle("manual", 2500);
    // un toque repetido reemplaza el aviso en lugar de apilarlo
    if (hintToast.current !== undefined) toast.dismiss(hintToast.current);
    hintToast.current = toast.show({ message: MANUAL_HINT, icon: "copy", duration: 4000 });
  };

  const copied = status === "copied";
  const showMarked = status === "manual" && marked;
  return (
    <>
      <button
        type="button"
        onClick={onCopy}
        aria-label={ariaLabel}
        data-status={status}
        className={cn(
          "rounded-pill inline-grid min-h-11 min-w-[104px] shrink-0 place-items-center px-4 text-sm font-semibold transition-[background-color,color,scale] duration-200 ease-[var(--ease-ui)] select-none active:scale-[0.97]",
          tone === "inverse"
            ? copied
              ? "bg-yellow text-bordo"
              : "bg-cream text-bordo"
            : copied
              ? "bg-bordo text-cream"
              : "bg-cream-deep text-bordo [@media(hover:hover)]:hover:bg-cream-ink",
          className,
        )}
      >
        <Face active={!copied && !showMarked}>
          <Icon name="copy" size={16} />
          {label}
        </Face>
        <Face active={copied}>
          <CheckGlyph drawn={copied} />
          {copiedLabel}
        </Face>
        {/* Siempre montada (como las otras dos): "Marcado" es más corto que "Copiado" + tilde, no ensancha nada */}
        <Face active={showMarked}>Marcado</Face>
      </button>
      {/* El aviso manual lo lee la región del Toaster; acá solo el éxito */}
      <span className="sr-only" aria-live="polite">
        {copied ? `${copiedLabel}: ${content}` : ""}
      </span>
    </>
  );
}

function Face({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden={!active || undefined}
      className={cn(
        "inline-flex items-center gap-1.5 transition-[opacity,translate] duration-[180ms] ease-[var(--ease-ui)] [grid-area:1/1]",
        active ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
      )}
    >
      {children}
    </span>
  );
}

const checkGlyph = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "shrink-0",
};

/** Tilde que se dibuja (stroke-dashoffset 16 → 0 en 220 ms) cada vez que se copia. */
function CheckGlyph({ drawn }: { drawn: boolean }) {
  return (
    <svg {...checkGlyph}>
      <path
        d="m4.8 12.6 4.4 4.4 10-10"
        pathLength={16}
        strokeDasharray={16}
        style={{
          strokeDashoffset: drawn ? 0 : 16,
          transition: drawn ? "stroke-dashoffset 220ms var(--ease-ui) 60ms" : "none",
        }}
      />
    </svg>
  );
}

async function writeClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // permiso denegado o contexto inseguro: probamos el camino viejo
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
