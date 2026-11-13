/** Loading / error line shown above a view's content while its API request runs or fails. */
export function Status({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) return <p className="rounded-xl border border-warm/40 bg-warm/10 px-3 py-2 text-[12.5px] text-warm" role="alert">Could not load data: {error}</p>;
  if (loading) return <p className="text-[12px] text-ink-3" aria-live="polite">Loading…</p>;
  return null;
}
