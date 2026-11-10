"use client";

// All dashboard state in one place. Components receive values and the stable
// action functions returned here; they do not own shared state themselves.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FilterMode } from "@/features/species/SpeciesFilter";
import { LAST_OBSERVED, QUARTERS, SPECIES, SPECIES_BY_ID, topSpecies, type Layer, type Scope } from "@/lib/data";

const DEFAULT_SPECIES = "galunggong";
const PLAYBACK_MS = 550; // time per quarter while playing

export function useDashboardState() {
  /** Ocean variable shown on the map. */
  const [layer, setLayer] = useState<Layer>("sst");
  /** Quarter index shown everywhere. */
  const [index, setIndex] = useState(LAST_OBSERVED);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(DEFAULT_SPECIES);
  /** "all" or a region id. */
  const [scope, setScopeRaw] = useState<Scope>("all");
  const [mode, setModeRaw] = useState<FilterMode>("top");
  /** Species shown as bubbles on the map. */
  const [checked, setChecked] = useState(() => new Set(topSpecies("all")));

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % QUARTERS.length), PLAYBACK_MS);
    return () => clearInterval(timer);
  }, [playing]);

  /** Select a species; it is also made visible on the map. */
  const select = useCallback((id: string) => {
    setSelectedId(id);
    setChecked((c) => (c.has(id) ? c : new Set([...c, id])));
  }, []);

  /** Show/hide a species bubble. The last visible one cannot be hidden. */
  const toggle = useCallback((id: string) => {
    setChecked((c) => {
      const next = new Set(c);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next.size ? next : c;
    });
  }, []);

  const setMode = useCallback(
    (m: FilterMode) => {
      setModeRaw(m);
      setChecked(new Set(m === "top" ? topSpecies(scope) : SPECIES.map((s) => s.id)));
    },
    [scope],
  );

  /** Each region has its own species mix, so "Top 10" follows the region. */
  const setScope = useCallback(
    (s: Scope) => {
      setScopeRaw(s);
      if (mode === "top") setChecked(new Set([...topSpecies(s), selectedId]));
    },
    [mode, selectedId],
  );

  const visible = useMemo(() => SPECIES.filter((s) => checked.has(s.id)), [checked]);

  return {
    layer, setLayer,
    index, setIndex,
    playing, setPlaying,
    scope, setScope,
    mode, setMode,
    checked, toggle,
    visible,
    selectedId,
    selected: SPECIES_BY_ID[selectedId],
    select,
  };
}
