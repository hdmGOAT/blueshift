"use client";

type Props<T extends string> = {
  value: T;
  /** [value, label] pairs */
  options: [T, string][];
  onChange: (v: T) => void;
  size?: "sm" | "md";
};

/** Pill-shaped switch between a few options. */
export function Segmented<T extends string>({ value, options, onChange, size = "md" }: Props<T>) {
  return (
    <div className={`inline-flex rounded-full bg-hi p-0.5 ${size === "sm" ? "text-[11.5px]" : "text-[12.5px]"}`}>
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={`rounded-full font-medium transition-colors ${size === "sm" ? "px-2.5 py-[3px]" : "px-3.5 py-1"} ${value === k ? "bg-white text-prussian" : "text-ink-2 hover:text-ink"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
