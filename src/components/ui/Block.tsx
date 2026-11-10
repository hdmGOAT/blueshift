import type { ReactNode } from "react";

/** A titled section inside a side panel. */
export function Block({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
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
