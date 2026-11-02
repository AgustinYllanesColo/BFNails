"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

/** Lado corto del video que se guarda: alcanza para la tarjeta (≈ 300 px en pantalla) y pesa ~1 MB cada 10 s. */
const WIDTH = 540;
/** Tope de duración: es un video de producto en bucle, no un tutorial. */
const MAX_SECONDS = 30;

/** Formato de salida: MP4 (H.264) si el navegador lo graba (Safari, Chrome nuevo), si no WebM. */
function pickType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const types = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}

const CANT_READ = "Este navegador no puede leer este video. Subilo desde el celular (en iPhone, desde Safari).";

const once = (el: HTMLVideoElement, ev: string) =>
  new Promise<void>((resolve, reject) => {
    el.addEventListener(ev, () => resolve(), { once: true });
    el.addEventListener("error", () => reject(new Error(CANT_READ)), { once: true });
  });

/**
 * Achica el video en el navegador: lo dibuja en un canvas de 540 px de ancho y lo vuelve a grabar sin sonido.
 * Así un video del celu (20 MB, formato del iPhone que Android no reproduce) queda en ~1 MB y se ve en todos lados.
 * Devuelve el video nuevo y un cuadro fijo (WebP) para usar de foto. Tarda lo que dura el video.
 */
async function shrinkVideo(file: File, onProgress: (p: number) => void): Promise<{ video: Blob; poster: Blob | null; ext: string }> {
  const type = pickType();
  if (!type) throw new Error("Este navegador no puede preparar videos. Probá desde el celular (Safari o Chrome).");
  const src = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = src;
  try {
    await once(v, "loadeddata");
    // sin cuadros: el navegador no entiende el formato (pasa con videos del iPhone en algunas computadoras)
    if (!v.videoWidth) throw new Error(CANT_READ);
    const scale = Math.min(1, WIDTH / v.videoWidth);
    const canvas = document.createElement("canvas");
    // el encoder pide medidas pares
    canvas.width = Math.round((v.videoWidth * scale) / 2) * 2;
    canvas.height = Math.round((v.videoHeight * scale) / 2) * 2;
    const ctx = canvas.getContext("2d")!;
    const length = Math.min(v.duration || MAX_SECONDS, MAX_SECONDS);

    // cuadro fijo: un poco después del arranque (los primeros cuadros suelen venir oscuros o movidos)
    v.currentTime = Math.min(1.5, length / 3);
    await once(v, "seeked");
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const poster = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));

    v.currentTime = 0;
    await once(v, "seeked");
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 1_200_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<void>((r) => (rec.onstop = () => r()));

    let running = true;
    const draw = () => {
      if (!running) return;
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      onProgress(Math.min(99, Math.round((v.currentTime / length) * 100)));
      if (v.currentTime >= length || v.ended) {
        running = false;
        v.pause();
        rec.stop();
        return;
      }
      requestAnimationFrame(draw);
    };
    rec.start(250);
    await v.play();
    requestAnimationFrame(draw);
    v.addEventListener("ended", () => running && (running = false, rec.stop()), { once: true });
    await done;
    stream.getTracks().forEach((t) => t.stop());
    const out = new Blob(chunks, { type: type.split(";")[0] });
    if (out.size === 0) throw new Error(CANT_READ);
    return { video: out, poster, ext: out.type === "video/mp4" ? "mp4" : "webm" };
  } finally {
    URL.revokeObjectURL(src);
  }
}

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
