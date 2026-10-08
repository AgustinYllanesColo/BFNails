"use client";

import { motion } from "motion/react";
import type { BuilderSelection } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";

const SHAPES: Record<BuilderSelection["shape"], string> = {
  almendra: "M30 0 C44 20 56 60 56 100 L56 160 L4 160 L4 100 C4 60 16 20 30 0 Z",
  ovalada: "M30 0 C50 0 56 40 56 90 L56 160 L4 160 L4 90 C4 40 10 0 30 0 Z",
  cuadrada: "M6 0 L54 0 L56 160 L4 160 Z",
  coffin: "M16 0 L44 0 L56 110 L56 160 L4 160 L4 110 Z",
  stiletto: "M30 0 L56 120 L56 160 L4 160 L4 120 Z",
};

const TIP: Record<BuilderSelection["shape"], string> = {
  almendra: "M30 0 C44 20 52 45 54 70 C40 60 20 60 6 70 C8 45 16 20 30 0 Z",
  ovalada: "M30 0 C50 0 55 30 55 60 C40 52 20 52 5 60 C5 30 10 0 30 0 Z",
  cuadrada: "M6 0 L54 0 L54.5 40 L5.5 40 Z",
  coffin: "M16 0 L44 0 L50 60 C40 52 20 52 10 60 Z",
  stiletto: "M30 0 L50 90 C40 80 20 80 10 90 Z",
};

const LENGTH_SCALE: Record<BuilderSelection["length"], number> = { corto: 0.78, medio: 0.9, largo: 1.02, xl: 1.16 };

function Pattern({ sel, i, id }: { sel: BuilderSelection; i: number; id: string }) {
  const has = (x: string) => sel.extras.includes(x);
  const seed = i * 37;
  return (
    <>
      {has("animal-print") && (
        <g opacity="0.9">
          {[...Array(7)].map((_, k) => {
            const x = 10 + ((seed + k * 53) % 40);
            const y = 15 + ((seed + k * 29) % 120);
            return (
              <g key={k}>
                <ellipse cx={x} cy={y} rx="6" ry="4.5" fill="#8a5a2b" />
                <ellipse cx={x - 1} cy={y - 0.5} rx="3.6" ry="2.6" fill="#4a0e0e" />
              </g>
            );
          })}
        </g>
      )}
      {has("glitter") && (
        <g>
          {[...Array(16)].map((_, k) => (
            <circle key={k} cx={6 + ((seed + k * 23) % 48)} cy={6 + ((seed + k * 41) % 150)} r={0.9 + (k % 3) * 0.5} fill="#fff6c8" opacity="0.9" />
          ))}
        </g>
      )}
      {(has("strass") || has("strass-full")) && (
        <g>
          {[...Array(has("strass-full") ? 9 : i % 2 === 1 ? 3 : 1)].map((_, k) => (
            <g key={k} transform={`translate(${14 + ((seed + k * 31) % 32)} ${20 + ((seed + k * 47) % 110)})`}>
              <circle r="3.2" fill="#fff" stroke="#c9c9c9" strokeWidth="0.6" />
              <path d="M-1.6 -0.2 L0 -2 L1.6 -0.2 L0 1.8 Z" fill="#d9f1ff" />
            </g>
          ))}
        </g>
      )}
      {has("flores") && i % 2 === 0 && (
        <g transform="translate(30 85)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-7" rx="4" ry="6.5" fill="#f2a7c3" transform={`rotate(${a})`} />
          ))}
          <circle r="3" fill="#f5c400" />
        </g>
      )}
      {has("3d") && i === 3 && (
        <g transform="translate(30 70)">
          <path d="M-14 0 C-14 -9 -4 -9 0 0 C4 -9 14 -9 14 0 C14 9 4 9 0 0 C-4 9 -14 9 -14 0 Z" fill="#b51c1c" />
          <circle r="3" fill="#7a0e0e" />
        </g>
      )}
      {has("personajes") && i === 3 && (
        <g transform="translate(30 88)">
          <ellipse rx="13" ry="11" fill="#fff" stroke="#3c3c3c" strokeWidth="1.2" />
          <path d="M-12 -4 L-9 -13 L-3 -7 Z M12 -4 L9 -13 L3 -7 Z" fill="#fff" stroke="#3c3c3c" strokeWidth="1.2" />
          <circle cx="-5" cy="0" r="1.4" fill="#3c3c3c" />
          <circle cx="5" cy="0" r="1.4" fill="#3c3c3c" />
          <ellipse cy="4" rx="1.8" ry="1.2" fill="#f5c400" />
          <path d="M3 -10 C7 -14 12 -12 10 -8 C12 -5 7 -4 4 -7 Z" fill="#b51c1c" />
        </g>
      )}
      {has("charms") && i === 1 && (
        <g transform="translate(30 60)">
          <path d="M0 -6 C3 -11 10 -9 9 -3 C9 2 2 7 0 9 C-2 7 -9 2 -9 -3 C-10 -9 -3 -11 0 -6 Z" fill="#f5c400" stroke="#8a5a2b" strokeWidth="0.8" />
        </g>
      )}
      <clipPath id={id}>
        <path d={SHAPES[sel.shape]} />
      </clipPath>
    </>
  );
}

export function NailPreview({ sel, config }: { sel: BuilderSelection; config: BuilderConfig }) {
  const base = config.bases.find((b) => b.id === sel.base)?.hex ?? "#e8c4b0";
  const has = (x: string) => sel.extras.includes(x);
  const scaleY = LENGTH_SCALE[sel.length];
  const chrome = sel.finish === "cromado";
  const mate = sel.finish === "mate";
  const tipColor = has("francesita-color") ? "#4a0e0e" : "#ffffff";
  const degrade = has("degrade");
  const catEye = has("cat-eye");
  const aurora = has("aurora");

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-cream-deep ring-1 ring-bordo/10">
      <svg viewBox="0 0 800 600" className="h-full w-full" role="img" aria-label="Vista previa de tu set">
        <defs>
          <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="white" stopOpacity={mate ? 0.08 : 0.45} />
            <stop offset="0.45" stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="black" stopOpacity={mate ? 0.04 : 0.14} />
          </linearGradient>
          <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.7" />
            <stop offset="0.3" stopColor="white" stopOpacity="0.05" />
            <stop offset="0.55" stopColor="white" stopOpacity="0.55" />
            <stop offset="1" stopColor="black" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="degrade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cateye" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.35" stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" stopOpacity="0.55" />
            <stop offset="0.65" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd1f0" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#c7f9ff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff2b3" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="#f5e8c8" />
        {[0, 1, 2, 3, 4].map((n) => {
          const widthScale = [0.9, 0.96, 1, 0.96, 0.86][n];
          const x = 110 + n * 140;
          const y = 330 + [40, 10, 0, 10, 48][n];
          const rot = (n - 2) * 3;
          const id = `clip-${n}`;
          return (
            <motion.g
              key={n}
              animate={{ x, y, rotate: rot, scaleX: widthScale * 2.1, scaleY: scaleY * 2.1 }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
              style={{ transformOrigin: "30px 160px" }}
            >
              <g transform="translate(-30 -160)">
                <motion.path d={SHAPES[sel.shape]} animate={{ fill: base }} transition={{ duration: 0.5 }} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                <g clipPath={`url(#${id})`}>
                  {degrade && <rect x="0" y="0" width="60" height="160" fill="url(#degrade)" />}
                  {(has("francesita") || has("francesita-color")) && <path d={TIP[sel.shape]} fill={tipColor} opacity="0.95" />}
                  <Pattern sel={sel} i={n} id={id} />
                  {catEye && <rect x="-20" y="0" width="100" height="160" fill="url(#cateye)" />}
                  {aurora && <rect x="0" y="0" width="60" height="160" fill="url(#aurora)" />}
                  <path d={SHAPES[sel.shape]} fill={chrome ? "url(#chrome)" : "url(#gloss)"} />
                  {!mate && <ellipse cx="18" cy="30" rx="6" ry="18" fill="white" opacity={chrome ? 0.8 : 0.4} transform="rotate(-12 18 30)" />}
                </g>
              </g>
            </motion.g>
          );
        })}
      </svg>
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-pill bg-cream/80 px-3 py-1 text-[11px] font-semibold text-ink-soft backdrop-blur">
        Vista previa ilustrativa, el set real lo pinta Bren a mano
      </p>
    </div>
  );
}
