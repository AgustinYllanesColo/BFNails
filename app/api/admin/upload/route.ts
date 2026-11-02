import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdminSession } from "@/lib/admin/auth";

/**
 * Firma las subidas de fotos del admin directo del navegador a Vercel Blob. Las fotos no pasan por el servidor
 * (ahí el límite es ~4 MB por request), así que se pueden subir varias a la vez y en paralelo.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await getAdminSession())) throw new Error("Tenés que entrar al panel para subir fotos.");
        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
