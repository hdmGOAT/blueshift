"use client";

// All dashboard state in one place. Components receive values and the stable
// action functions returned here; they do not own shared state themselves.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FilterMode } from "@/features/species/SpeciesFilter";
import { MAX_LAG, type Highlight, type Resolution } from "@/lib/analysis";
import { COMPLETE_YEARS, LAST_OBSERVED, QUARTERS, SPECIES, SPECIES_BY_ID, YEARS, areaScope, topSpecies, type AreaId, type Layer, type Scope } from "@/lib/data";
import { VIEWS, type ViewId } from "./views";

const DEFAULT_SPECIES = "galunggong";
const PLAYBACK_MS = 550; // time per quarter while playing

const viewFromHash = (): ViewId => {
  const h = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  return VIEWS.some((v) => v.id === h) ? (h as ViewId) : "overview";
};

/**
 * `start` is the strongest relationship in the data (computed on the server,
 * see app/page.tsx): the app opens on it. Without it, Galunggong in all Mindanao.
 */
export function useDashboardState(start?: Highlight | null) {
  const init = start?.params;
  /** Which page is showing; mirrored in the URL hash so it can be linked. */
  const [view, setViewRaw] = useState<ViewId>(viewFromHash);
  /** Ocean variable (SST or chlorophyll-a), shared by the map and every view. */
  const [layer, setLayer] = useState<Layer>(init?.variable ?? "sst");
  /** Quarter index shown on the Overview map. */
  const [index, setIndex] = useState(LAST_OBSERVED);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(init?.species ?? DEFAULT_SPECIES);
  /** Geographic filter: "all", a region id or a province id. */
  const [area, setArea] = useState<AreaId>(init?.area ?? "all");
  /** Year range filter, inclusive. */
  const [years, setYearsRaw] = useState<[number, number]>([YEARS[0], YEARS[YEARS.length - 1]]);
  const [resolution, setResolutionRaw] = useState<Resolution>("quarterly");
  /** Species filter for views that take several (empty = all species). */
  const [tracked, setTracked] = useState<string[]>([]);
  /** Relationship Explorer options. */
  const [lag, setLag] = useState(init?.lag ?? 0);
  const [deseason, setDeseason] = useState(true);
  const [detrend, setDetrend] = useState(false);
  /** Overview: species shown as bubbles on the map. */
  const [mode, setModeRaw] = useState<FilterMode>("top");
  const [checked, setChecked] = useState(() => new Set([...topSpecies(areaScope(init?.area ?? "all")), init?.species ?? DEFAULT_SPECIES]));

  /** The region-level scope the Overview map shows for the current area. */
  const scope = areaScope(area);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % QUARTERS.length), PLAYBACK_MS);
    return () => clearInterval(timer);
  }, [playing]);

  const setView = useCallback((v: ViewId) => {
    setViewRaw(v);
    setPlaying(false);
    history.replaceState(null, "", v === "overview" ? location.pathname : `#${v}`);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => setViewRaw(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

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

  /** Each region has its own species mix, so the map's "Top 10" follows the area. */
  const changeArea = useCallback(
    (a: AreaId) => {
      setArea(a);
      if (mode === "top") setChecked(new Set([...topSpecies(areaScope(a)), selectedId]));
    },
    [mode, selectedId],
  );
  /** The Overview map picks regions. */
  const setScope = useCallback((s: Scope) => changeArea(s), [changeArea]);

  /** Keep the range valid; annual resolution needs one complete year in it. */
  const setYears = useCallback(
    ([from, to]: [number, number]) => {
      const range: [number, number] = from <= to ? [from, to] : [to, from];
      setYearsRaw(range);
      if (resolution === "annual" && !COMPLETE_YEARS.some((y) => y >= range[0] && y <= range[1])) setResolutionRaw("quarterly");
    },
    [resolution],
  );

  const setResolution = useCallback(
    (r: Resolution) => {
      setResolutionRaw(r);
      setLag((l) => Math.min(l, MAX_LAG[r]));
      if (r === "annual" && !COMPLETE_YEARS.some((y) => y >= years[0] && y <= years[1])) setYearsRaw([COMPLETE_YEARS[0], COMPLETE_YEARS[COMPLETE_YEARS.length - 1]]);
    },
    [years],
  );

  /** Load a highlighted relationship into the Explorer (keeps the year range). */
  const applyHighlight = useCallback(
    (h: Highlight) => {
      select(h.params.species);
      changeArea(h.params.area);
      setLayer(h.params.variable);
      setResolutionRaw("quarterly");
      setLag(h.params.lag);
      setDeseason(h.params.deseason);
      setDetrend(h.params.detrend);
    },
    [select, changeArea],
  );

  const visible = useMemo(() => SPECIES.filter((s) => checked.has(s.id)), [checked]);

  return {
    view, setView,
    layer, setLayer,
    index, setIndex,
    playing, setPlaying,
    area, setArea: changeArea,
    scope, setScope,
    years, setYears,
    resolution, setResolution,
    tracked, setTracked,
    lag, setLag,
    deseason, setDeseason,
    detrend, setDetrend,
    mode, setMode,
    checked, toggle,
    visible,
    selectedId,
    selected: SPECIES_BY_ID[selectedId],
    select,
    applyHighlight,
  };
}

export type DashboardState = ReturnType<typeof useDashboardState>;
