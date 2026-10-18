"use client";

import { useState } from "react";
import { formatCm, parseCmToMm } from "@/lib/format";
import { cn } from "@/lib/format";
import { inputClass } from "@/components/ui/Field";

/**
 * Campo de ancho en cm ("1,5" o "1.5"). Guarda su propio texto para poder escribir "1," sin que se borre, y avisa
 * el valor en mm (0 si todavía no es un número).
 */
export function CmInput({
  mm,
  onChange,
  className,
  ...rest
}: {
  mm: number;
  onChange: (mm: number) => void;
  className?: string;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(mm ? formatCm(mm) : "");
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const v = e.target.value.replace(/[^\d.,]/g, "").slice(0, 4);
        setText(v);
        onChange(parseCmToMm(v));
      }}
      className={cn(inputClass, className)}
    />
  );
}
