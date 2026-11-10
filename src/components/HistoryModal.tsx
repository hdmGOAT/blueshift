"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { scaleBand, scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line, stack } from "d3-shape";
import {
  CORRELATION,
  FORECAST_INDEX,
  LAST_OBSERVED,
  OCEAN,
  QUARTERS,
  REGIONS,
  SPECIES,
  YEARS,
  YIELDS,
  annualTotal,
  quarterLabel,
  regionName,
  type RegionId,
  type Scope,
  type Species,
} from "@/lib/data";
import { anomalyColor } from "@/lib/colors";
import { Segmented, fmt, signed } from "./Panels";
import { DitheredFish, fishCredit } from "./DitheredFish";

type Grain = "q" | "y";
type Row = {
  key: string;
  label: string;
  total: number;
  byRegion: Record<RegionId, number>;
  sst: number;
  sstAnom: number;
  chl: number;
  chlAnom: number;
  projected: boolean;
  yoy: number | null;
};

function buildRows(species: Species, scope: Scope, grain: Grain): Row[] {
  const regions = scope === "all" ? REGIONS.map((r) => r.id) : [scope];
  const oc = OCEAN[scope];
  if (grain === "q") {
    return QUARTERS.map((q, i) => {
      const byRegion = Object.fromEntries(regions.map((r) => [r, YIELDS[r][species.id][i].value])) as Record<RegionId, number>;
      const total = YIELDS[scope][species.id][i].value;
      const prev = i >= 4 ? YIELDS[scope][species.id][i - 4].value : null;
      return {
        key: `q${i}`,
        label: quarterLabel(i),
        total,
        byRegion,
        sst: oc[i].sst,
        sstAnom: oc[i].sstAnom,
        chl: oc[i].chl,
        chlAnom: oc[i].chlAnom,
        projected: i === FORECAST_INDEX,
        yoy: prev ? ((total - prev) / prev) * 100 : null,
      };
    });
  }
  return YEARS.map((yr, yi) => {
    const idx = QUARTERS.filter((q) => q.year === yr).map((q) => q.index);
    const avg = (k: "sst" | "sstAnom" | "chl" | "chlAnom") => idx.reduce((a, i) => a + oc[i][k], 0) / idx.length;
    const byRegion = Object.fromEntries(regions.map((r) => [r, annualTotal(r, species.id, yr)])) as Record<RegionId, number>;
    const total = annualTotal(scope, species.id, yr);
    const prev = yi > 0 ? annualTotal(scope, species.id, yr - 1) : null;
    return {
      key: `y${yr}`,
      label: String(yr),
      total,
      byRegion,
      sst: avg("sst"),
      sstAnom: avg("sstAnom"),
      chl: avg("chl"),
      chlAnom: avg("chlAnom"),
      projected: yr === 2026,
      yoy: prev ? ((total - prev) / prev) * 100 : null,
    };
  });
}

function downloadCsv(species: Species, scope: Scope, grain: Grain, rows: Row[]) {
  const regions = scope === "all" ? REGIONS : REGIONS.filter((r) => r.id === scope);
  const head = ["period", "landings_t", ...regions.map((r) => `${r.id}_t`), "sst_c", "chl_mg_m3", "projected"];
  const body = rows.map((r) => [r.label, r.total.toFixed(0), ...regions.map((g) => r.byRegion[g.id].toFixed(0)), r.sst.toFixed(2), r.chl.toFixed(3), r.projected ? "1" : "0"]);
  const csv = [head, ...body].map((l) => l.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `blueshift_${species.id}_${scope}_${grain === "q" ? "quarterly" : "annual"}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

type ModalProps = {
  initialSpeciesId: string;
  initialScope: Scope;
  onClose: () => void;
  onSpeciesChange?: (id: string) => void;
};

export function HistoryModal({ initialSpeciesId, initialScope, onClose, onSpeciesChange }: ModalProps) {
  const [speciesId, setSpeciesId] = useState(initialSpeciesId);
  const [hover, setHover] = useState<number | null>(null);
  const pos = SPECIES.findIndex((s) => s.id === speciesId);
  const species = SPECIES[pos];
  const goTo = (id: string) => {
    setSpeciesId(id);
    setHover(null);
    onSpeciesChange?.(id);
  };
  const step = (d: number) => goTo(SPECIES[(pos + d + SPECIES.length) % SPECIES.length].id);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  const [scope, setScope] = useState<Scope>(initialScope);
  const [grain, setGrain] = useState<Grain>("q");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.target as HTMLElement).closest("select, input")) return;
      if (e.key === "ArrowRight") stepRef.current(1);
      if (e.key === "ArrowLeft") stepRef.current(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const rows = useMemo(() => buildRows(species, scope, grain), [species, scope, grain]);
  const regions = scope === "all" ? REGIONS : REGIONS.filter((r) => r.id === scope);

  // ---- chart geometry ----
  const W = 760;
  const CH = 250;
  const STRIP = 14;
  const L = 40;
  const RP = 8;
  const top = 10;
  const maxV = Math.max(...rows.map((r) => r.total)) * 1.06;
  const y = scaleLinear().domain([0, maxV]).range([top + CH, top]).nice(4);
  const band = scaleBand<number>().domain(rows.map((_, i) => i)).range([L, W - RP]).paddingInner(grain === "y" ? 0.28 : 0.12);
  const xc = (i: number) => band(i)! + band.bandwidth() / 2;

  const stacked = useMemo(() => {
    const keys = regions.map((r) => r.id);
    return stack<Row, RegionId>()
      .keys(keys)
      .value((d, k) => d.byRegion[k])(rows);
  }, [rows, regions]);

  const lastObs = grain === "q" ? LAST_OBSERVED : rows.length - 2;
  const H = top + CH + 26 + STRIP * 2 + 16;
  const hovered = hover !== null ? rows[hover] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Species history">
      <div className="absolute inset-0 bg-prussian/70 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-rise relative flex max-h-full w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-line-strong bg-[#08163a] shadow-2xl">
        {/* header */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <StepButton dir={-1} onClick={() => step(-1)} label={SPECIES[(pos - 1 + SPECIES.length) % SPECIES.length].local} />
            <DitheredFish key={species.id} id={species.id} width={128} className="animate-rise mx-1 hidden shrink-0 sm:block" />
            <div className="min-w-0">
              {/* the name doubles as a jump-to picker */}
              <label className="group relative flex cursor-pointer items-center gap-2">
                <h2 className="font-display text-[26px] font-medium leading-tight group-hover:text-accent-text">{species.local}</h2>
                <svg width="10" height="10" viewBox="0 0 10 10" className="mt-1 text-ink-3 group-hover:text-accent-text" aria-hidden>
                  <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                <span className="mono mt-1 text-[11px] text-ink-3">
                  {pos + 1} / {SPECIES.length}
                </span>
                <select
                  value={speciesId}
                  onChange={(e) => goTo(e.target.value)}
                  aria-label="Choose species"
                  className="absolute inset-0 cursor-pointer opacity-0"
                >
                  {SPECIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.local} · {s.english}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-[12.5px] text-ink-3">
                {species.english} · <i>{species.scientific}</i> · {species.habitat}
              </p>
            </div>
            <StepButton dir={1} onClick={() => step(1)} label={SPECIES[(pos + 1) % SPECIES.length].local} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Segmented value={grain} onChange={setGrain} size="sm" options={[["q", "Quarterly"], ["y", "Annual"]]} />
            <button onClick={() => downloadCsv(species, scope, grain, rows)} className="rounded-full border border-line-strong px-3 py-1 text-[12px] font-medium text-ink-2 hover:bg-hi hover:text-ink">
              Export CSV
            </button>
            <button ref={closeRef} onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-hi hover:text-ink">
              <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l10 10M11 1 1 11" /></svg>
            </button>
          </div>
        </div>

        {/* scope tabs */}
        <div className="scroll-thin flex gap-1 overflow-x-auto border-b border-line px-4 py-2">
          {(["all", ...REGIONS.map((r) => r.id)] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${scope === s ? "bg-hi text-ink" : "text-ink-3 hover:text-ink"}`}
            >
              {s !== "all" && <span className="h-2 w-2 rounded-full" style={{ background: REGIONS.find((r) => r.id === s)!.color }} />}
              {regionName(s)}
            </button>
          ))}
        </div>

        <div className="scroll-thin grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* chart */}
          <div className="min-w-0 px-5 py-4">
            <div className="mb-2 flex h-10 items-end justify-between gap-4">
              <div>
                <div className="label">{hovered ? hovered.label : `${grain === "q" ? "Quarterly" : "Annual"} landings, t`}</div>
                <div className="font-display text-[22px] font-medium leading-tight">
                  {hovered ? (
                    <>
                      {fmt(hovered.total)} t{" "}
                      {hovered.yoy !== null && (
                        <span className="text-[13px]" style={{ color: hovered.yoy < 0 ? "var(--warm)" : "var(--accent-text)" }}>
                          {signed(hovered.yoy, 1)}% YoY
                        </span>
                      )}
                      {hovered.projected && <span className="ml-2 text-[12px] text-forecast">{grain === "q" ? "projected" : "incl. Q4 projection"}</span>}
                    </>
                  ) : (
                    <span className="text-ink-2">{regionName(scope)}</span>
                  )}
                </div>
              </div>
              {hovered && (
                <div className="flex gap-4 text-right text-[12px]">
                  <div>
                    <div className="text-ink-3">SST</div>
                    <div className="font-medium">{hovered.sst.toFixed(2)}°C</div>
                  </div>
                  <div>
                    <div className="text-ink-3">Chl-a</div>
                    <div className="font-medium">{hovered.chl.toFixed(3)}</div>
                  </div>
                </div>
              )}
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
              {y.ticks(4).map((t) => (
                <g key={t}>
                  <line x1={L} x2={W - RP} y1={y(t)} y2={y(t)} stroke="rgba(254,252,251,0.07)" />
                  <text x={L - 8} y={y(t) + 3} textAnchor="end" fontSize={10} fill="var(--ink-3)">
                    {t >= 1000 ? `${t / 1000}k` : t}
                  </text>
                </g>
              ))}

              {grain === "y"
                ? stacked.map((layer, li) => (
                    <g key={layer.key}>
                      {layer.map((d, i) => (
                        <rect
                          key={i}
                          x={band(i)}
                          y={y(d[1])}
                          width={band.bandwidth()}
                          height={Math.max(0, y(d[0]) - y(d[1]))}
                          fill={regions[li].color}
                          opacity={rows[i].projected ? 0.45 : hover === null || hover === i ? 0.95 : 0.55}
                          rx={li === stacked.length - 1 ? 2 : 0}
                        />
                      ))}
                    </g>
                  ))
                : stacked.map((layer, li) => (
                    <path
                      key={layer.key}
                      d={
                        area<(typeof layer)[number]>()
                          .x((_, i) => xc(i))
                          .y0((d) => y(d[0]))
                          .y1((d) => y(d[1]))
                          .curve(curveMonotoneX)(layer.slice(0, lastObs + 1)) ?? ""
                      }
                      fill={regions[li].color}
                      opacity={0.85}
                      stroke="#08163a"
                      strokeWidth={0.6}
                    />
                  ))}

              {grain === "q" && (
                <>
                  <path
                    d={line<Row>().x((_, i) => xc(i)).y((d) => y(d.total)).curve(curveMonotoneX)(rows.slice(0, lastObs + 1)) ?? ""}
                    fill="none"
                    stroke="var(--white)"
                    strokeWidth={1.4}
                  />
                  {(() => {
                    const fcRow = YIELDS[scope][species.id][FORECAST_INDEX];
                    return (
                      <g>
                        <line x1={xc(lastObs)} y1={y(rows[lastObs].total)} x2={xc(FORECAST_INDEX)} y2={y(fcRow.value)} stroke="var(--forecast)" strokeWidth={1.4} strokeDasharray="2 3" />
                        <line x1={xc(FORECAST_INDEX)} x2={xc(FORECAST_INDEX)} y1={y(fcRow.high!)} y2={y(fcRow.low!)} stroke="var(--forecast)" strokeWidth={2} strokeLinecap="round" />
                        <circle cx={xc(FORECAST_INDEX)} cy={y(fcRow.value)} r={3.5} fill="#08163a" stroke="var(--forecast)" strokeWidth={1.6} />
                      </g>
                    );
                  })()}
                </>
              )}

              {/* ocean strips */}
              {(["sstAnom", "chlAnom"] as const).map((k, si) => {
                const sy = top + CH + 26 + si * (STRIP + 2);
                return (
                  <g key={k}>
                    <text x={L - 8} y={sy + 10} textAnchor="end" fontSize={9.5} fill="var(--ink-3)">
                      {k === "sstAnom" ? "SST" : "Chl"}
                    </text>
                    {rows.map((r, i) => (
                      <rect
                        key={i}
                        x={band(i)}
                        y={sy}
                        width={band.bandwidth()}
                        height={STRIP}
                        rx={1.5}
                        fill={k === "sstAnom" ? anomalyColor(r.sstAnom - 0.05) : anomalyColor(-(r.chlAnom + 0.03) * 9)}
                      />
                    ))}
                  </g>
                );
              })}

              {/* x labels */}
              {rows.map((r, i) =>
                grain === "y" || QUARTERS[i].q === 1 ? (
                  <text key={r.key} x={grain === "y" ? xc(i) : band(i)} y={H - 2} textAnchor={grain === "y" ? "middle" : "start"} fontSize={10} fill="var(--ink-3)">
                    {grain === "y" ? r.label : QUARTERS[i].year}
                  </text>
                ) : null,
              )}

              {hover !== null && <line x1={xc(hover)} x2={xc(hover)} y1={top} y2={top + CH} stroke="rgba(254,252,251,0.5)" />}

              {/* hover capture */}
              {rows.map((_, i) => (
                <rect key={i} x={band(i)! - (band.step() - band.bandwidth()) / 2} y={0} width={band.step()} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
              ))}
            </svg>

            {scope === "all" && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-3">
                {REGIONS.map((r) => (
                  <span key={r.id} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />
                    {r.name}
                    {hovered && <span className="text-ink-2">{fmt(hovered.byRegion[r.id])}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* region breakdown */}
          <aside className="border-t border-line px-4 py-4 lg:border-l lg:border-t-0">
            <div className="label mb-2">By region · 2025</div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[11px] text-ink-3">
                  <th className="pb-1.5 font-normal">Region</th>
                  <th className="pb-1.5 text-right font-normal">t</th>
                  <th className="pb-1.5 text-right font-normal">vs &apos;16</th>
                  <th className="pb-1.5 text-right font-normal">r SST</th>
                </tr>
              </thead>
              <tbody>
                {REGIONS.map((r) => {
                  const v = annualTotal(r.id, species.id, 2025);
                  const d = ((v - annualTotal(r.id, species.id, 2016)) / annualTotal(r.id, species.id, 2016)) * 100;
                  const c = CORRELATION[r.id][species.id].sst;
                  return (
                    <tr key={r.id} onClick={() => setScope(r.id)} className={`cursor-pointer border-t border-line ${scope === r.id ? "bg-hi" : "hover:bg-hi/60"}`}>
                      <td className="py-2 pr-2">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                          <span className="truncate">{r.name}</span>
                        </span>
                      </td>
                      <td className="py-2 text-right text-ink-2">{fmt(v)}</td>
                      <td className="py-2 text-right" style={{ color: d < 0 ? "var(--warm)" : "var(--accent-text)" }}>
                        {signed(d, 0)}%
                      </td>
                      <td className="py-2 text-right" style={{ color: c < -0.2 ? "var(--warm)" : c > 0.2 ? "var(--accent-text)" : "var(--ink-2)" }}>
                        {signed(c)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="label mb-2 mt-6">{grain === "q" ? "Quarters" : "Years"}</div>
            <div className="scroll-thin max-h-[260px] overflow-y-auto rounded-lg border border-line">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-[#0b1c46] text-[11px] text-ink-3">
                  <tr>
                    <th className="px-2.5 py-1.5 text-left font-normal">Period</th>
                    <th className="px-2.5 py-1.5 text-right font-normal">t</th>
                    <th className="px-2.5 py-1.5 text-right font-normal">YoY</th>
                    <th className="px-2.5 py-1.5 text-right font-normal">SST</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((r) => {
                    const i = rows.indexOf(r);
                    return (
                      <tr key={r.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={`border-t border-line ${hover === i ? "bg-hi" : ""}`}>
                        <td className="px-2.5 py-1.5">
                          {r.label}
                          {r.projected && <span className="ml-1.5 text-[10.5px] text-forecast">proj.</span>}
                        </td>
                        <td className="px-2.5 py-1.5 text-right text-ink-2">{fmt(r.total)}</td>
                        <td className="px-2.5 py-1.5 text-right" style={{ color: r.yoy === null ? undefined : r.yoy < 0 ? "var(--warm)" : "var(--accent-text)" }}>
                          {r.yoy === null ? "–" : `${signed(r.yoy, 1)}%`}
                        </td>
                        <td className="px-2.5 py-1.5 text-right text-ink-2">{r.sst.toFixed(2)}°</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {fishCredit(species.id) && (
              <p className="mt-4 text-[10.5px] leading-snug text-ink-3">
                Image:{" "}
                <a href={fishCredit(species.id)!.source} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-ink-2">
                  {fishCredit(species.id)!.artist && fishCredit(species.id)!.artist !== "?" ? fishCredit(species.id)!.artist : "Wikimedia Commons"}
                </a>{" "}
                · {fishCredit(species.id)!.license} · dithered
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function StepButton({ dir, onClick, label }: { dir: 1 | -1; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={`${dir < 0 ? "Previous" : "Next"} species: ${label}`}
      title={`${label} (${dir < 0 ? "←" : "→"})`}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink-2 hover:bg-hi hover:text-ink"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d={dir < 0 ? "M6.5 1.5 3 5l3.5 3.5" : "M3.5 1.5 7 5 3.5 8.5"} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
}
