"use client";

import { YEARS, yearCoverage } from "@/lib/data";
import { Field, SELECT } from "./Field";

/** Year range filter: two selects, inclusive. Partial years show which quarters they have. */
export function YearRange({ years, onYears }: { years: [number, number]; onYears: (y: [number, number]) => void }) {
  const opts = (min: number, max: number) =>
    YEARS.filter((y) => y >= min && y <= max).map((y) => (
      <option key={y} value={y}>
        {y}
        {yearCoverage(y) && ` (${yearCoverage(y)})`}
      </option>
    ));
  return (
    <Field label="Years" htmlFor="f-from">
      <select id="f-from" aria-label="From year" value={years[0]} onChange={(e) => onYears([Number(e.target.value), years[1]])} className={SELECT}>
        {opts(YEARS[0], years[1])}
      </select>
      <span className="text-ink-3">–</span>
      <select aria-label="To year" value={years[1]} onChange={(e) => onYears([years[0], Number(e.target.value)])} className={SELECT}>
        {opts(years[0], YEARS[YEARS.length - 1])}
      </select>
    </Field>
  );
}
