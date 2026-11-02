"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/format";

type Photo = { id: string; url?: string; preview: string; progress: number; error?: string; video: boolean };

const MAX_SIDE = 1600;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const VIDEO_RE = /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i;

/** Achica la foto en el navegador (las del celu pesan 3–8 MB) para que suba rápido. Si no puede, sube la original. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
    return out && out.type === "image/webp" && out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

/** Extensión del video según su tipo (la URL la necesita para saber que es un video). */
function videoExt(file: File): string {
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime" || /\.mov$/i.test(file.name)) return "mov";
  return "mp4";
}

/**
 * Fotos (y, con `allowVideo`, videos) de una publicación: elegís o arrastrás varias de una, se suben todas en paralelo
 * y quedan en orden. El orden se cambia arrastrando una miniatura sobre otra o con las flechas; la primera foto es la
 * portada. Las URLs viajan al server action en un input oculto `name`, una por línea.
 */
export function PhotoUploader({
  name,
  initial,
  folder,
  onBusyChange,
  allowVideo = false,
  max,
}: {
  name: string;
  initial: string[];
  folder: string;
  onBusyChange?: (busy: boolean) => void;
  allowVideo?: boolean;
  max?: number;
}) {
  const [photos, setPhotos] = useState<Photo[]>(() =>
    initial.map((url) => ({ id: url, url, preview: url, progress: 100, video: VIDEO_RE.test(url) })),
  );
  const [dragging, setDragging] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = photos.some((p) => !p.url && !p.error);
  const cover = photos.find((p) => !p.video && p.url)?.id;
  const full = max != null && photos.length >= max;

  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  const patch = (id: string, p: Partial<Photo>) => setPhotos((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  function addFiles(files: FileList | File[]) {
    let list = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name) || (allowVideo && (f.type.startsWith("video/") || VIDEO_RE.test(f.name))),
    );
    if (max != null) list = list.slice(0, Math.max(0, max - photos.length));
    const added = list.map((f) => {
      const video = f.type.startsWith("video/") || VIDEO_RE.test(f.name);
      return { file: f, photo: { id: crypto.randomUUID(), preview: URL.createObjectURL(f), progress: 0, video } as Photo };
    });
    setPhotos((cur) => [...cur, ...added.map((a) => a.photo)]);
    // todas a la vez
    for (const { file, photo } of added) {
      (async () => {
        try {
          if (photo.video && file.size > VIDEO_MAX_BYTES) {
            patch(photo.id, { error: "El video pesa más de 100 MB. Recortalo y probá de nuevo." });
            return;
          }
          const blob = photo.video ? file : await shrink(file);
          const ext = photo.video ? videoExt(file) : blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg").toLowerCase();
          const res = await upload(`${folder}/${Date.now()}.${ext}`, blob, {
            access: "public",
            handleUploadUrl: "/api/admin/upload",
            contentType: photo.video ? file.type || "video/mp4" : blob.type || file.type || "image/jpeg",
            onUploadProgress: ({ percentage }) => patch(photo.id, { progress: percentage }),
          });
          patch(photo.id, { url: res.url, progress: 100 });
        } catch (e) {
          console.error("[fotos]", e);
          patch(photo.id, { error: "No se pudo subir. Quitala y probá de nuevo." });
        }
      })();
    }
  }

  function remove(id: string) {
    setPhotos((list) => list.filter((p) => p.id !== id));
  }
  function moveTo(id: string, to: number) {
    setPhotos((list) => {
      const i = list.findIndex((p) => p.id === id);
      if (i < 0 || to < 0 || to >= list.length || i === to) return list;
      const next = [...list];
      const [item] = next.splice(i, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  const what = allowVideo ? "fotos o videos" : "fotos";

  return (
    <div>
      <input type="hidden" name={name} value={photos.flatMap((p) => (p.url ? [p.url] : [])).join("\n")} />
      {photos.length > 0 && (
        <ol className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p, i) => (
            <li
              key={p.id}
              draggable={!!p.url}
              onDragStart={(e) => {
                setDragId(p.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.stopPropagation();
                if (dragId !== p.id) moveTo(dragId, i);
              }}
              onDrop={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.stopPropagation();
                setDragId(null);
              }}
              className={cn(
                "group bg-cream-deep relative aspect-square overflow-hidden rounded-md",
                p.url && "cursor-grab active:cursor-grabbing",
                dragId === p.id && "ring-bordo opacity-50 ring-2",
              )}
            >
              {p.video ? (
                <video src={p.preview} muted playsInline preload="metadata" className={cn("pointer-events-none size-full object-cover", !p.url && "opacity-60")} />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) mientras sube */
                <img src={p.preview} alt="" draggable={false} className={cn("size-full object-cover", !p.url && "opacity-60")} />
              )}
              <span className="absolute top-1 left-1 flex gap-1">
                <span className="text-ink rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">{i + 1}</span>
                {p.id === cover && <span className="bg-bordo text-cream rounded px-1.5 py-0.5 text-[10px] font-bold">Portada</span>}
                {p.video && <span className="bg-ink text-cream rounded px-1.5 py-0.5 text-[10px] font-bold">▶ Video</span>}
              </span>
              {!p.url && !p.error && (
                <div className="absolute inset-x-1 bottom-1 h-1.5 overflow-hidden rounded bg-white/70">
                  <div className="bg-bordo h-full transition-[width]" style={{ width: `${Math.max(5, p.progress)}%` }} />
                </div>
              )}
              {p.error && <div className="bg-red/80 absolute inset-0 grid place-items-center p-1 text-center text-[10px] font-semibold text-white">{p.error}</div>}
              <div className="absolute top-1 right-1 flex gap-1">
                <button type="button" onClick={() => remove(p.id)} className="text-red grid size-6 place-items-center rounded-full bg-white/90 text-xs font-bold shadow" aria-label={`Quitar ${p.video ? "video" : "foto"} ${i + 1}`}>
                  ✕
                </button>
              </div>
              {p.url && photos.length > 1 && (
                <div className="absolute right-1 bottom-1 left-1 flex justify-between">
                  <button type="button" disabled={i === 0} onClick={() => moveTo(p.id, i - 1)} className="grid size-7 place-items-center rounded-full bg-white/90 text-xs shadow disabled:opacity-0" aria-label={`Mover ${i + 1} antes`}>
                    ←
                  </button>
                  <button type="button" disabled={i === photos.length - 1} onClick={() => moveTo(p.id, i + 1)} className="grid size-7 place-items-center rounded-full bg-white/90 text-xs shadow disabled:opacity-0" aria-label={`Mover ${i + 1} después`}>
                    →
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {photos.length > 1 && <p className="text-ink-soft -mt-1 mb-3 text-xs">Para cambiar el orden, arrastrá una miniatura o usá las flechas. La primera foto es la portada.</p>}
      {!full && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            if (dragId) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (dragId) return;
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn("border-bordo/30 text-bordo hover:bg-bordo/5 w-full rounded-md border-2 border-dashed px-3 py-5 text-sm font-semibold transition-colors", dragging && "bg-bordo/10")}
        >
          + Agregar {what} <span className="text-ink-soft block text-xs font-normal">Podés elegir varias de una (o arrastrarlas acá){max != null ? ` · hasta ${max}` : ""}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={allowVideo ? "image/*,video/mp4,video/webm,video/quicktime" : "image/*"}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
