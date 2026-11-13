import type { ReactNode } from "react";

/** A labelled control in the filter bar. */
export function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className="label whitespace-nowrap">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Shared look for the bar's <select>s. */
export const SELECT = "cursor-pointer rounded-full border border-line-strong bg-transparent py-1 pl-2.5 pr-1 text-[12.5px] font-medium text-ink outline-none hover:bg-hi";
