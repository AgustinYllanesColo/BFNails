"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="w-full max-w-sm rounded-lg bg-white/80 p-8 text-center ring-1 ring-bordo/10">
        <h1 className="font-title text-3xl">No cargó</h1>
        <p className="mt-2 text-sm text-ink-soft">La base de datos tardó en responder. Suele andar al reintentar.</p>
        <Button className="mt-5 w-full" onClick={() => retry()}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
