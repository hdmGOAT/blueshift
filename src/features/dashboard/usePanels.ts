"use client";

import { useCallback, useEffect, useState } from "react";

/** Open/closed state of the two side panels, with [ and ] as shortcuts. */
export function usePanels(shortcutsEnabled: boolean) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const toggleLeft = useCallback(() => setLeftOpen((v) => !v), []);
  const toggleRight = useCallback(() => setRightOpen((v) => !v), []);

  useEffect(() => {
    if (!shortcutsEnabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, select, textarea")) return;
      if (e.key === "[") toggleLeft();
      if (e.key === "]") toggleRight();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcutsEnabled, toggleLeft, toggleRight]);

  return { leftOpen, rightOpen, toggleLeft, toggleRight };
}
