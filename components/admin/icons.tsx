/** Íconos del panel: trazo de 1,8 px, 24×24, sin relleno. Uno por sección, siempre el mismo. */
type P = { className?: string };
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconHome = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 10.5 12 4l8.5 6.5" />
    <path d="M5.5 9v10.5h13V9" />
    <path d="M10 19.5v-5h4v5" />
  </svg>
);
export const IconOrders = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 3.5h9l3 3v14H6z" />
    <path d="M9 10h6M9 13.5h6M9 17h3.5" />
  </svg>
);
export const IconNails = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 21v-9a4 4 0 0 1 8 0v9" />
    <path d="M10 12.5a2 2 0 0 1 4 0V16h-4z" />
  </svg>
);
export const IconMakeup = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 21h6V12H9z" />
    <path d="M10 12V7.5L14 5v7" />
  </svg>
);
export const IconCharm = (p: P) => (
  <svg {...base} {...p}>
    <path d="m12 4 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.8z" />
  </svg>
);
export const IconPromo = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 12.5 11 5h8v8l-7.5 7.5z" />
    <circle cx="15.5" cy="8.5" r="1.3" />
  </svg>
);
export const IconKit = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 8h16v11.5H4z" />
    <path d="M9 8V5.5h6V8M4 12.5h16" />
  </svg>
);
export const IconBuilder = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 19 15.5 8.5M14 5l1 2.5L17.5 8.5 15 9.5 14 12l-1-2.5L10.5 8.5 13 7.5z" />
    <path d="M18.5 14v3M17 15.5h3" />
  </svg>
);
export const IconSupplies = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" />
    <path d="m4 8 8 4.5L20 8M12 12.5v8" />
  </svg>
);
export const IconCosts = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 19.5h16" />
    <path d="M7 16v-5M12 16V7M17 16v-8" />
  </svg>
);
export const IconSettings = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
export const IconChevron = (p: P) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const IconExternal = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14 4.5h5.5V10M19.5 4.5 11 13M17 14v5.5H4.5V7H10" />
  </svg>
);
