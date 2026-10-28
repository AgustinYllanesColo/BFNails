import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // las fotos del catálogo suben directo a Blob; esto cubre las de promos/dijes/kit que todavía pasan por el action
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async redirects() {
    return [{ source: "/talles", destination: "/medidas", permanent: true }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // 90 para las fotos de uñas: con 75 los strass y los brillos se veían lavados
    qualities: [75, 90],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    localPatterns: [{ pathname: "/api/placeholder", search: "" }, { pathname: "/**" }],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
