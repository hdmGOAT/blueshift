import type { ReactNode } from "react";

/** A titled glass panel for the full-page views. */
export function Card({ title, sub, action, children, className = "" }: { title: string; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass min-w-0 rounded-2xl p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-[13.5px] font-medium text-ink">{title}</h2>
          {sub && <p className="mt-0.5 text-[11.5px] text-ink-3">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
