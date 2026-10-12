import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icons";

/**
 * Campo de formulario (PLAN W1-F2.4): etiqueta, control, error y ayuda conectados.
 * El hijo (un `input`, `select` o `textarea`) recibe `id`, `aria-invalid` y `aria-describedby` (error + ayuda); el
 * error no lleva `role="alert"` (sería un anuncio por campo): el formulario muestra un único `<ErrorSummary>`.
 */
type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** id del control; si falta se toma el del hijo o se genera uno. */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

type ControlProps = {
  id?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
};

export function Field({ label, hint, error, htmlFor, children, className }: FieldProps) {
  const autoId = useId();
  const control = isValidElement<ControlProps>(children) ? children : null;
  const id = htmlFor ?? control?.props.id ?? autoId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null, control?.props["aria-describedby"]]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-ink text-sm font-semibold">
        {label}
      </label>
      {control
        ? cloneElement(control as ReactElement<ControlProps>, {
            id,
            "aria-invalid": error ? true : control.props["aria-invalid"],
            "aria-describedby": describedBy,
          })
        : children}
      {error ? (
        <p id={errorId} className="text-meta text-red flex items-start gap-1.5 font-medium">
          <Icon name="alert" size={14} className="mt-[0.15em]" />
          <span className="min-w-0">{error}</span>
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-meta text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Resumen único de errores al enviar (`role="alert"`): se anuncia una vez y el formulario le pasa el foco
 * (`ref` + `tabIndex={-1}`) o lo lleva al primer campo inválido.
 */
export function ErrorSummary({
  count,
  className,
  id,
  ref,
}: {
  count: number;
  className?: string;
  id?: string;
  ref?: Ref<HTMLParagraphElement>;
}) {
  if (count <= 0) return null;
  return (
    <p
      ref={ref}
      id={id}
      role="alert"
      tabIndex={-1}
      className={cn(
        "bg-danger-surface text-red flex items-center gap-2 rounded-md px-4 py-3 text-sm font-semibold outline-none",
        className,
      )}
    >
      <Icon name="alert" size={16} />
      Revisá {count} {count === 1 ? "campo" : "campos"}
    </p>
  );
}

/** Clase de los inputs: 16 px en el celular (sin zoom de iOS), borde arena pleno, rojo con halo si es inválido. */
export const inputClass =
  "h-12 w-full min-w-0 rounded-md border border-sand bg-surface px-4 text-base text-ink placeholder:text-ink-faint transition-[border-color,box-shadow] duration-150 ease-[var(--ease-ui)] hover:border-ink-soft focus:border-bordo disabled:bg-cream-deep disabled:text-ink-faint aria-[invalid=true]:border-red aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red/15 md:text-[15px]";

export const textareaClass = cn(inputClass, "h-auto min-h-28 resize-y py-3 leading-relaxed");
