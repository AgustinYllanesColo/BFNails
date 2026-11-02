"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { shrinkVideo } from "@/lib/admin/shrink-video";

type State = { step: "idle" } | { step: "prep" | "up"; progress: number } | { step: "error"; message: string };

/**
 * Video de un producto de maquillaje en el admin: se elige el archivo del celu, se achica acá mismo y se sube. Las
 * direcciones viajan al server action en inputs ocultos (`video` y `videoPoster`); mientras trabaja, el botón Guardar
 * del formulario queda deshabilitado.
 */
export function VideoUploader({ initial, hasImage }: { initial?: string; hasImage: boolean }) {
  const [url, setUrl] = useState(initial ?? "");
  const [poster, setPoster] = useState("");
  const [state, setState] = useState<State>({ step: "idle" });
  const [remove, setRemove] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = state.step === "prep" || state.step === "up";

  // sin Guardar mientras se prepara o sube: si no, se guardaría el producto sin el video
  useEffect(() => {
    const form = box.current?.closest("form");
    form?.querySelectorAll<HTMLButtonElement>("button").forEach((b) => (b.disabled = busy));
  }, [busy]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setRemove(false);
    try {
      setState({ step: "prep", progress: 0 });
      const out = await shrinkVideo(file, (progress) => setState({ step: "prep", progress }));
      setState({ step: "up", progress: 0 });
      const stamp = Date.now();
      const res = await upload(`maquillaje/video-${stamp}.${out.ext}`, out.video, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        contentType: out.video.type,
        onUploadProgress: ({ percentage }) => setState({ step: "up", progress: Math.round(percentage) }),
      });
      // la foto fija solo hace falta si el producto todavía no tiene foto
      if (out.poster && !hasImage) {
        const p = await upload(`maquillaje/video-${stamp}.webp`, out.poster, { access: "public", handleUploadUrl: "/api/admin/upload", contentType: "image/webp" });
        setPoster(p.url);
      }
      setUrl(res.url);
      setState({ step: "idle" });
    } catch (e) {
      console.error("[video]", e);
      setState({ step: "error", message: (e as Error).message || "No se pudo subir el video. Probá de nuevo." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div ref={box} className="flex flex-wrap items-center gap-3 text-xs">
      <input type="hidden" name="video" value={remove ? "" : url} />
      <input type="hidden" name="videoPoster" value={remove ? "" : poster} />
      {url && !remove && <video src={url} muted loop playsInline autoPlay className="h-20 w-auto rounded-md bg-black" aria-label="Video del producto" />}
      <label className={"rounded-pill inline-flex cursor-pointer items-center gap-1.5 bg-white px-3 py-2 font-semibold ring-1 ring-bordo/20 " + (busy ? "pointer-events-none opacity-60" : "")}>
        <input ref={inputRef} type="file" accept="video/*" className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
        {url && !remove ? "Cambiar video" : "Subir video"}
      </label>
      {url && !busy && (
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={remove} onChange={(e) => setRemove(e.target.checked)} /> quitar video
        </label>
      )}
      <span role="status" aria-live="polite" className="text-ink-soft">
        {state.step === "prep" && `Preparando el video… ${state.progress}% (tarda lo que dura el video)`}
        {state.step === "up" && `Subiendo… ${state.progress}%`}
        {state.step === "idle" && url && !remove && url !== initial && "Video listo: tocá Guardar."}
        {remove && "Se quita al guardar."}
      </span>
      {state.step === "error" && <span className="font-semibold text-red">{state.message}</span>}
    </div>
  );
}
