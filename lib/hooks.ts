"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true después de hidratar; evita desajustes con estado persistido en localStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
