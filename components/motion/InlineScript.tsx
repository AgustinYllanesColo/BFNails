"use client";

/**
 * Script en línea que corre una sola vez, mientras el navegador parsea el HTML del servidor (antes del primer paint).
 * En el cliente se renderiza como text/plain: React no avisa por <script> en dev y nunca lo re-ejecuta en una
 * navegación. Ver node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
