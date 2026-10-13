import { cn } from "@/lib/format";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, hint, error, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "h-12 w-full rounded-md border border-cream-ink bg-white/70 px-4 text-[15px] text-ink placeholder:text-ink-soft/70 transition-colors focus:border-bordo focus:bg-white focus:outline-none focus:ring-4 focus:ring-bordo/10 aria-[invalid=true]:border-red";

export const textareaClass = cn(inputClass, "h-auto min-h-28 resize-y py-3");
