"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/format";

type Photo = { id: string; url?: string; preview: string; progress: number; error?: string };

const MAX_SIDE = 1600;

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

/**
 * Fotos de un diseño: elegís o arrastrás varias de una, se suben todas en paralelo y quedan en orden (la primera es
 * la portada). Las URLs viajan al server action en un input oculto `name`, una por línea.
 */
export function PhotoUploader({ name, initial, folder, onBusyChange }: { name: string; initial: string[]; folder: string; onBusyChange?: (busy: boolean) => void }) {
  const [photos, setPhotos] = useState<Photo[]>(() => initial.map((url) => ({ id: url, url, preview: url, progress: 100 })));
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = photos.some((p) => !p.url && !p.error);

  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  const patch = (id: string, p: Partial<Photo>) => setPhotos((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    const added = list.map((f) => ({ file: f, photo: { id: crypto.randomUUID(), preview: URL.createObjectURL(f), progress: 0 } as Photo }));
    setPhotos((cur) => [...cur, ...added.map((a) => a.photo)]);
    // todas a la vez
    for (const { file, photo } of added) {
      (async () => {
        try {
          const blob = await shrink(file);
          const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg").toLowerCase();
          const res = await upload(`${folder}/${Date.now()}.${ext}`, blob, {
            access: "public",
            handleUploadUrl: "/api/admin/upload",
            contentType: blob.type || file.type || "image/jpeg",
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
  function move(id: string, dir: -1 | 1) {
    setPhotos((list) => {
      const i = list.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div>
      <input type="hidden" name={name} value={photos.flatMap((p) => (p.url ? [p.url] : [])).join("\n")} />
      {photos.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-md bg-cream-deep">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) mientras sube */}
              <img src={p.preview} alt="" className={cn("size-full object-cover", !p.url && "opacity-60")} />
              {i === 0 && p.url && <span className="absolute top-1 left-1 rounded bg-bordo px-1.5 py-0.5 text-[10px] font-bold text-cream">Portada</span>}
              {!p.url && !p.error && (
                <div className="absolute inset-x-1 bottom-1 h-1.5 overflow-hidden rounded bg-white/70">
                  <div className="h-full bg-bordo transition-[width]" style={{ width: `${Math.max(5, p.progress)}%` }} />
                </div>
              )}
              {p.error && <div className="absolute inset-0 grid place-items-center bg-red/80 p-1 text-center text-[10px] font-semibold text-white">{p.error}</div>}
              <div className="absolute top-1 right-1 flex gap-1">
                <button type="button" onClick={() => remove(p.id)} className="grid size-6 place-items-center rounded-full bg-white/90 text-xs font-bold text-red shadow" aria-label="Quitar foto">
                  ✕
                </button>
              </div>
              {p.url && photos.length > 1 && (
                <div className="absolute right-1 bottom-1 left-1 flex justify-between">
                  <button type="button" disabled={i === 0} onClick={() => move(p.id, -1)} className="grid size-6 place-items-center rounded-full bg-white/90 text-xs shadow disabled:opacity-0" aria-label="Mover antes">
                    ←
                  </button>
                  <button type="button" disabled={i === photos.length - 1} onClick={() => move(p.id, 1)} className="grid size-6 place-items-center rounded-full bg-white/90 text-xs shadow disabled:opacity-0" aria-label="Mover después">
                    →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setDragging(true))}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn("w-full rounded-md border-2 border-dashed border-bordo/30 px-3 py-5 text-sm font-semibold text-bordo transition-colors hover:bg-bordo/5", dragging && "bg-bordo/10")}
      >
        + Agregar fotos <span className="block text-xs font-normal text-ink-soft">Podés elegir varias de una (o arrastrarlas acá)</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
