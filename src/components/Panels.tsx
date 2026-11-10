"use client";

import { scaleLinear } from "d3-scale";
import { area, line, curveMonotoneX } from "d3-shape";
import {
  CORRELATION,
  FORECAST_INDEX,
  LAST_OBSERVED,
  OCEAN,
  QUARTERS,
  REGIONS,
  SPECIES,
  YIELDS,
  annualTotal,
  catchMix,
  quarterLabel,
  regionName,
  strengthLabel,
  type Layer,
  type Scope,
  type Species,
} from "@/lib/data";
import { corrColor } from "@/lib/colors";
import { CHL_DOMAIN, CHL_GRADIENT, SST_DOMAIN, SST_GRADIENT } from "@/lib/field";

export const fmt = (n: number) => Math.round(n).toLocaleString();
export const signed = (n: number, d = 2) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(d)}`;

export function Block({ title, action, children, className = "" }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-t border-line px-4 py-4 first:border-t-0 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="label">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = "md" }: { value: T; options: [T, string][]; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div className={`inline-flex rounded-full bg-hi p-0.5 ${size === "sm" ? "text-[11.5px]" : "text-[12.5px]"}`}>
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-full font-medium transition-colors ${size === "sm" ? "px-2.5 py-[3px]" : "px-3.5 py-1"} ${value === k ? "bg-white text-prussian" : "text-ink-2 hover:text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="grid h-7 w-7 place-items-center rounded-full text-ink-3 hover:bg-hi hover:text-ink">
      {children}
    </button>
  );
}

export const ExpandIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M7 1h4v4M5 11H1V7M11 1 7 5M1 11l4-4" />
  </svg>
);

// ---------------------------------------------------------------------------

export function KeyFinding({ scope, onSelect }: { scope: Scope; onSelect: (id: string) => void }) {
  const corr = CORRELATION[scope];
  const s = [...SPECIES].sort((a, b) => corr[a.id].sst - corr[b.id].sst)[0];
  const y16 = annualTotal(scope, s.id, 2016);
  const pct = ((annualTotal(scope, s.id, 2025) - y16) / y16) * 100;
  return (
    <Block title={`Key finding · ${regionName(scope)}`}>
      <button onClick={() => onSelect(s.id)} className="group flex w-full items-end justify-between gap-3 text-left">
        <div>
          <div className="text-[15px] font-medium text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{s.local}</div>
          <div className="mt-0.5 text-[12px] text-ink-3">
            Landings 2016 → 2025 · r <span className="text-warm">{signed(corr[s.id].sst)}</span> with sea temp
          </div>
        </div>
        <div className={`font-display text-[40px] font-medium leading-[0.9] ${pct < 0 ? "text-warm" : "text-accent-text"}`}>
          {pct < 0 ? "−" : "+"}
          {Math.abs(pct).toFixed(0)}
          <span className="text-[22px]">%</span>
        </div>
      </button>
    </Block>
  );
}

// ---------------------------------------------------------------------------

export function TrendChart({ species, scope, index, layer }: { species: Species; scope: Scope; index: number; layer: Layer }) {
  const W = 300;
  const Y_H = 96;
  const O_H = 36;
  const GAP = 14;
  const L = 30;
  const RP = 6;

  const data = YIELDS[scope][species.id];
  const x = scaleLinear().domain([0, FORECAST_INDEX]).range([L, W - RP]);
  const vals = data.flatMap((p) => [p.value, p.high ?? p.value, p.low ?? p.value]);
  const y = scaleLinear().domain([Math.min(...vals) * 0.94, Math.max(...vals) * 1.03]).range([Y_H, 6]).nice(3);

  const obs = data.slice(0, LAST_OBSERVED + 1);
  const linePath = line<(typeof data)[number]>().x((p) => x(p.index)).y((p) => y(p.value)).curve(curveMonotoneX)(obs)!;
  const fillPath = area<(typeof data)[number]>().x((p) => x(p.index)).y0(Y_H).y1((p) => y(p.value)).curve(curveMonotoneX)(obs)!;
  const fc = data[FORECAST_INDEX];
  const last = data[LAST_OBSERVED];

  const anomKey = layer === "sst" ? "sstAnom" : "chlAnom";
  const anoms = OCEAN[scope].map((o) => o[anomKey]);
  const ext = Math.max(...anoms.map(Math.abs));
  const oy = scaleLinear().domain([-ext, ext]).range([Y_H + GAP + O_H, Y_H + GAP]);
  const oArea = area<number>().x((_, i) => x(i)).y0(oy(0)).y1((v) => oy(v)).curve(curveMonotoneX)(anoms.slice(0, LAST_OBSERVED + 1))!;
  const H = Y_H + GAP + O_H + 18;
  const uid = `${species.id}-${scope}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${species.local} quarterly landings`}>
      <defs>
        <linearGradient id={`fill-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5cc0dc" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#5cc0dc" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`above-${uid}`}>
          <rect x={0} y={0} width={W} height={oy(0)} />
        </clipPath>
        <clipPath id={`below-${uid}`}>
          <rect x={0} y={oy(0)} width={W} height={H} />
        </clipPath>
      </defs>
      {y.ticks(3).map((t) => (
        <g key={t}>
          <line x1={L} x2={W - RP} y1={y(t)} y2={y(t)} stroke="rgba(254,252,251,0.07)" />
          <text x={L - 6} y={y(t) + 3} textAnchor="end" fontSize={9.5} fill="var(--ink-3)">
            {t >= 1000 ? `${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : t}
          </text>
        </g>
      ))}
      <path d={fillPath} fill={`url(#fill-${uid})`} />
      <path d={linePath} fill="none" stroke="#5cc0dc" strokeWidth={1.6} />
      <line x1={x(last.index)} y1={y(last.value)} x2={x(fc.index)} y2={y(fc.value)} stroke="var(--forecast)" strokeWidth={1.4} strokeDasharray="2 3" />
      <line x1={x(fc.index)} x2={x(fc.index)} y1={y(fc.high!)} y2={y(fc.low!)} stroke="var(--forecast)" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={x(fc.index)} cy={y(fc.value)} r={2.8} fill="var(--paper)" stroke="var(--forecast)" strokeWidth={1.4} />

      <line x1={L} x2={W - RP} y1={oy(0)} y2={oy(0)} stroke="rgba(254,252,251,0.12)" />
      <path d={oArea} fill={layer === "sst" ? "var(--warm)" : "#5fae5f"} opacity={0.8} clipPath={`url(#above-${uid})`} />
      <path d={oArea} fill={layer === "sst" ? "var(--cerulean)" : "#b9a477"} opacity={0.8} clipPath={`url(#below-${uid})`} />
      <text x={L} y={Y_H + GAP - 2} fontSize={9.5} fill="var(--ink-3)">
        {layer === "sst" ? "SST anomaly" : "Chl-a anomaly"}
      </text>

      <line x1={x(index)} x2={x(index)} y1={2} y2={Y_H + GAP + O_H} stroke="rgba(254,252,251,0.5)" strokeWidth={1} />
      <circle cx={x(index)} cy={y(data[index].value)} r={3.2} fill="var(--white)" />

      {[2016, 2019, 2022, 2025].map((yr) => (
        <text key={yr} x={x((yr - 2016) * 4)} y={H - 3} fontSize={9.5} fill="var(--ink-3)">
          {yr}
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------

export function SensitivityList({ scope, layer, selectedId, onSelect }: { scope: Scope; layer: Layer; selectedId: string; onSelect: (id: string) => void }) {
  const corr = CORRELATION[scope];
  const rows = [...SPECIES].sort((a, b) => corr[a.id][layer] - corr[b.id][layer]).slice(0, 5);
  return (
    <ol className="-mx-2 space-y-0.5">
      {rows.map((s) => {
        const r = corr[s.id][layer];
        const active = s.id === selectedId;
        return (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s.id)}
              className={`grid w-full grid-cols-[100px_1fr_40px] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors ${active ? "bg-hi text-ink" : "text-ink-2 hover:bg-hi"}`}
            >
              <span className={active ? "font-medium" : ""}>{s.local}</span>
              <span className="relative h-1.5 overflow-hidden rounded-full bg-hi">
                <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(Math.abs(r) * 100).toFixed(2)}%`, background: corrColor(r) }} />
              </span>
              <span className="text-right text-[12px] text-ink-2">{signed(r)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------

export function SpeciesFilter({
  mode,
  setMode,
  checked,
  toggle,
  selectedId,
  onSelect,
}: {
  mode: "top" | "all";
  setMode: (m: "top" | "all") => void;
  checked: Set<string>;
  toggle: (id: string) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <Segmented value={mode} onChange={setMode} size="sm" options={[["top", "Top 10"], ["all", `All ${SPECIES.length}`]]} />
      <ul className="-mx-2 mt-3">
        {SPECIES.map((s) => (
          <li key={s.id} className={`flex items-center gap-2.5 rounded-lg px-2 py-[5px] transition-colors ${s.id === selectedId ? "bg-hi" : "hover:bg-hi/60"}`}>
            <input type="checkbox" id={`sp-${s.id}`} checked={checked.has(s.id)} onChange={() => toggle(s.id)} className="h-3.5 w-3.5" aria-label={`Show ${s.local}`} />
            <button onClick={() => onSelect(s.id)} className="flex min-w-0 flex-1 items-baseline justify-between gap-2 text-left">
              <span className={`truncate text-[13px] ${checked.has(s.id) ? "text-ink" : "text-ink-3"} ${s.id === selectedId ? "font-medium" : ""}`}>{s.local}</span>
              <span className="truncate text-[11.5px] text-ink-3">{s.english}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Meter({ r }: { r: number }) {
  const pos = ((r + 1) / 2) * 100;
  return (
    <div className="relative mt-2 h-4">
      <div className="absolute inset-x-0 top-[6px] h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${corrColor(-0.9)}, ${corrColor(0)} 50%, ${corrColor(0.9)})` }} />
      <div className="absolute top-[4px] h-2 w-px bg-ink-3" style={{ left: "50%" }} />
      <div className="absolute top-0 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-prussian shadow" style={{ left: `${pos.toFixed(2)}%`, transition: "left 300ms" }} />
    </div>
  );
}

export function CorrelationCard({ species, scope }: { species: Species; scope: Scope }) {
  const c = CORRELATION[scope][species.id];
  return (
    <div className="space-y-5">
      {([
        ["sst", "Sea surface temp."],
        ["chl", "Chlorophyll-a"],
      ] as const).map(([key, label]) => (
        <div key={key}>
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-ink-2">{label}</span>
            <span className="font-display text-[22px] font-medium leading-none" style={{ color: Math.abs(c[key]) < 0.2 ? "var(--ink-2)" : c[key] < 0 ? "var(--warm)" : "var(--accent-text)" }}>
              {signed(c[key])}
            </span>
          </div>
          <Meter r={c[key]} />
          <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-3">
            <span>−1</span>
            <span className="text-ink-2">{strengthLabel(c[key])}</span>
            <span>+1</span>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-ink-3">{LAST_OBSERVED + 1} quarters · seasonally adjusted · {regionName(scope)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function SpeciesCard({ species, scope, index, onOpen }: { species: Species; scope: Scope; index: number; onOpen: () => void }) {
  const ys = YIELDS[scope][species.id];
  const p = ys[index];
  const same2016 = ys[QUARTERS[index].q - 1].value;
  const change = ((p.value - same2016) / same2016) * 100;
  const fc = ys[FORECAST_INDEX];
  const isForecast = index === FORECAST_INDEX;
  const regionVals = REGIONS.map((r) => ({ r, v: YIELDS[r.id][species.id][index].value }));
  const total = regionVals.reduce((a, x) => a + x.v, 0);

  return (
    <div className="glass w-[280px] overflow-hidden rounded-2xl">
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5">
        <div className="min-w-0">
          <h3 className="font-display text-[22px] font-medium leading-tight">{species.local}</h3>
          <p className="truncate text-[12px] text-ink-3">
            {species.english} · <i>{species.scientific}</i>
          </p>
        </div>
        <IconButton onClick={onOpen} label="Open history">
          <ExpandIcon />
        </IconButton>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 px-4 pt-3">
        <div>
          <dt className="text-[11px] text-ink-3">{isForecast ? "Projected" : "Landed"} · {quarterLabel(index)}</dt>
          <dd className="font-display text-[19px] font-medium">{fmt(p.value)} t</dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-3">vs Q{QUARTERS[index].q} 2016</dt>
          <dd className="font-display text-[19px] font-medium" style={{ color: change < 0 ? "var(--warm)" : "var(--accent-text)" }}>
            {change > 0 ? "+" : "−"}
            {Math.abs(change).toFixed(1)}%
          </dd>
        </div>
      </dl>
      <div className="px-4 pt-3">
        <div className="flex h-1.5 gap-px overflow-hidden rounded-full">
          {regionVals.map(({ r, v }) => (
            <span key={r.id} style={{ width: `${((v / total) * 100).toFixed(2)}%`, background: r.color, opacity: scope === "all" || scope === r.id ? 1 : 0.25 }} title={`${r.name} ${fmt(v)} t`} />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-3">
          {regionVals.map(({ r }) => (
            <span key={r.id} className={scope === r.id ? "text-ink" : ""}>
              {r.short}
            </span>
          ))}
        </div>
      </div>
      <button onClick={onOpen} className="mt-3 flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-left text-[12px] hover:bg-hi">
        <span className="text-ink-3">
          Q4 2026 <span className="ml-1 font-medium text-forecast">{fmt(fc.value)} t</span> ±{fmt(fc.high! - fc.value)}
        </span>
        <span className="text-accent-text">History →</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function FieldLegend({ layer }: { layer: Layer }) {
  const stops = layer === "sst" ? SST_GRADIENT : CHL_GRADIENT;
  const ticks = layer === "sst" ? [`${SST_DOMAIN[0]}°`, "29.2°", `${SST_DOMAIN[1]}°`] : [`${CHL_DOMAIN[0]}`, "0.25", `${CHL_DOMAIN[1]} mg/m³`];
  return (
    <div className="w-[180px]">
      <div className="h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${stops.join(",")})` }} />
      <div className="mt-1 flex justify-between text-[10.5px] text-ink-3">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export function BubbleLegend({ layer }: { layer: Layer }) {
  return (
    <div className="flex items-end gap-5 text-[11px] text-ink-3">
      <div className="flex items-end gap-1.5">
        {[5, 9, 14].map((r) => (
          <span key={r} className="rounded-full border border-ink-3" style={{ width: r * 2, height: r * 2 }} />
        ))}
        <span className="ml-1">Landings</span>
      </div>
      <div>
        <div className="mb-1">r · {layer === "sst" ? "sea temp" : "chl-a"}</div>
        <div className="flex items-center gap-1.5">
          <span>−1</span>
          <span className="h-1.5 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${corrColor(-0.9)}, ${corrColor(0)} 50%, ${corrColor(0.9)})` }} />
          <span>+1</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function CatchMix({ scope, index, selectedId, onSelect }: { scope: Scope; index: number; selectedId: string; onSelect: (id: string) => void }) {
  const mix = catchMix(scope, index);
  const total = mix.reduce((a, m) => a + m.v, 0);
  const shown = mix.slice(0, 5);
  const rest = mix.slice(5).reduce((a, m) => a + m.share, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[20px] font-medium">{fmt(total)} t</span>
        <span className="text-[11.5px] text-ink-3">{mix.length} species · {quarterLabel(index)}</span>
      </div>
      <div className="mt-2.5 flex h-2 gap-px overflow-hidden rounded-full">
        {shown.map((m, i) => (
          <button
            key={m.s.id}
            onClick={() => onSelect(m.s.id)}
            title={`${m.s.local} ${(m.share * 100).toFixed(1)}%`}
            style={{ width: `${(m.share * 100).toFixed(2)}%`, background: "#5cc0dc", opacity: m.s.id === selectedId ? 1 : 0.85 - i * 0.11 }}
          />
        ))}
        <span style={{ width: `${(rest * 100).toFixed(2)}%` }} className="bg-hi" />
      </div>
      <ol className="-mx-2 mt-2.5">
        {shown.map((m) => (
          <li key={m.s.id}>
            <button
              onClick={() => onSelect(m.s.id)}
              style={{ gridTemplateColumns: "1fr auto 44px" }}
              className={`grid w-full items-baseline gap-3 rounded-lg px-2 py-1 text-left text-[13px] transition-colors ${m.s.id === selectedId ? "bg-hi text-ink" : "text-ink-2 hover:bg-hi"}`}
            >
              <span className={m.s.id === selectedId ? "font-medium" : ""}>{m.s.local}</span>
              <span className="text-[12px] text-ink-3">{fmt(m.v)} t</span>
              <span className="text-right text-[12px]">{(m.share * 100).toFixed(1)}%</span>
            </button>
          </li>
        ))}
        <li className="px-2 pt-1 text-[11.5px] text-ink-3">+{mix.length - shown.length} more · {(rest * 100).toFixed(1)}%</li>
      </ol>
    </div>
  );
}

export function Outlook({ species, scope, index }: { species: Species; scope: Scope; index: number }) {
  const ys = YIELDS[scope][species.id];
  const p = ys[index];
  const prev = index >= 4 ? ys[index - 4].value : null;
  const yoy = prev ? ((p.value - prev) / prev) * 100 : null;
  const fc = ys[FORECAST_INDEX];
  return (
    <dl className="mt-2 grid grid-cols-2 gap-3 border-t border-line pt-3">
      <div>
        <dt className="text-[11px] text-ink-3">{quarterLabel(index)}</dt>
        <dd className="mt-0.5 text-[15px] font-medium">
          {fmt(p.value)} t
          {yoy !== null && (
            <span className="ml-1.5 text-[11.5px] font-normal" style={{ color: yoy < 0 ? "var(--warm)" : "var(--accent-text)" }}>
              {signed(yoy, 1)}% YoY
            </span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] text-ink-3">Q4 2026 outlook</dt>
        <dd className="mt-0.5 text-[15px] font-medium text-forecast">
          {fmt(fc.value)} t <span className="text-[11.5px] font-normal text-ink-3">±{fmt(fc.high! - fc.value)}</span>
        </dd>
      </div>
    </dl>
  );
}
