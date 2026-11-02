"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/format";
import { adminBtn, adminBtnGhost } from "./ui";
import { IconCheck } from "./icons";

/**
 * Botón de guardar que avisa: "Guardando…" mientras trabaja y "Guardado" un par de segundos al terminar. Antes no
 * pasaba nada visible y no se sabía si había guardado.
 */
export function SubmitButton({ children, ghost, className, formAction, confirmText }: { children: React.ReactNode; ghost?: boolean; className?: string; formAction?: (fd: FormData) => void | Promise<void>; confirmText?: string }) {
  const { pending, action } = useFormStatus();
  const mine = pending && (!formAction || action === formAction);
  const [saved, setSaved] = useState(false);
  const was = useRef(false);

  useEffect(() => {
    if (was.current && !pending && !formAction) {
      setSaved(true); // aviso de una vez al terminar de guardar
      const t = setTimeout(() => setSaved(false), 2200);
      return () => clearTimeout(t);
    }
    was.current = pending;
  }, [pending, formAction]);

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      onClick={confirmText ? (e) => !confirm(confirmText) && e.preventDefault() : undefined}
      className={cn(ghost ? adminBtnGhost : adminBtn, className)}
    >
      {mine ? "Guardando…" : saved ? (
        <>
          <IconCheck className="size-4" /> Guardado
        </>
      ) : (
        children
      )}
    </button>
  );
}
