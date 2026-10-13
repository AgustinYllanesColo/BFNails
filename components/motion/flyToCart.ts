/**
 * "Voló al carrito": al sumar un set, una miniatura sale del botón que tocaste, viaja en arco hasta el
 * ícono del carrito en la barra y, al llegar, el ícono da un salto y suelta tres estrellas.
 *
 * Propósito: consistencia espacial (ves adónde fue lo que agregaste). Herramienta: WAAPI (element.animate),
 * solo transform y opacity, fuera de React y del hilo principal. Con "reducir movimiento" solo se hace el
 * salto del ícono, sin vuelo ni estrellas.
 */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

export function flyToCart(from: HTMLElement | null, image?: string | null) {
  if (typeof document === "undefined") return;
  const target = document.querySelector<HTMLElement>("[data-cart-button]");
  if (!target) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const bump = () => {
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.22)", offset: 0.4 }, { transform: "scale(1)" }],
      { duration: 360, easing: EASE_OUT },
    );
  };

  if (reduce || !from) {
    bump();
    return;
  }

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 56;
  const x0 = a.left + a.width / 2 - size / 2;
  const y0 = a.top + a.height / 2 - size / 2;
  const x1 = b.left + b.width / 2 - size / 2;
  const y1 = b.top + b.height / 2 - size / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const lift = Math.min(160, Math.max(60, Math.abs(dx) * 0.25));

  const chip = document.createElement("div");
  chip.setAttribute("aria-hidden", "true");
  chip.style.cssText = `position:fixed;left:${x0}px;top:${y0}px;width:${size}px;height:${size}px;border-radius:16px;overflow:hidden;z-index:80;pointer-events:none;background:#4a0e0e;color:#fef7e7;display:grid;place-items:center;font-size:26px;box-shadow:0 14px 30px -12px rgba(74,14,14,.6);will-change:transform`;
  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
    chip.appendChild(img);
  } else {
    chip.textContent = "✦";
  }
  document.body.appendChild(chip);

  // Arco: sube un poco al salir y cae sobre el carrito; se achica mientras viaja.
  const flight = chip.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.35 - lift}px) scale(0.8)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.6 },
    ],
    { duration: 700, easing: EASE_IN_OUT, fill: "forwards" },
  );
  flight.onfinish = () => {
    chip.remove();
    bump();
    burst(target);
  };
}

/** Tres estrellas que salen del ícono del carrito y se apagan. Decorativo, una sola vez por "sumar". */
function burst(target: HTMLElement) {
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const colors = ["#f5c400", "#b51c1c", "#c9a063"];
  [-1, 0, 1].forEach((k, i) => {
    const s = document.createElement("span");
    s.setAttribute("aria-hidden", "true");
    s.textContent = "✦";
    s.style.cssText = `position:fixed;left:${cx - 8}px;top:${cy - 8}px;width:16px;height:16px;line-height:16px;text-align:center;font-size:14px;color:${colors[i]};z-index:81;pointer-events:none;will-change:transform`;
    document.body.appendChild(s);
    const ang = -Math.PI / 2 + k * 0.7;
    const d = 34 + i * 6;
    const anim = s.animate(
      [
        { transform: "translate(0px, 0px) scale(0.6) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d}px) scale(1.1) rotate(${k * 60}deg)`, opacity: 0 },
      ],
      { duration: 520, easing: EASE_OUT, delay: 40 * i, fill: "forwards" },
    );
    anim.onfinish = () => s.remove();
  });
}
