/**
 * Achicado de videos en el navegador (lo usan el uploader de video y la galería de fotos y videos del maquillaje).
 * Solo corre en el cliente: usa <video>, canvas y MediaRecorder.
 */

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
export async function shrinkVideo(file: File, onProgress: (p: number) => void): Promise<{ video: Blob; poster: Blob | null; ext: string }> {
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
