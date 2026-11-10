import { fishCredit } from "./credits";

/** Photo attribution. The image licences require this wherever a fish is shown large. */
export function FishCreditLine({ id, className = "" }: { id: string; className?: string }) {
  const credit = fishCredit(id);
  if (!credit) return null;
  return (
    <p className={`text-[10.5px] leading-snug text-ink-3 ${className}`}>
      Image:{" "}
      <a href={credit.source} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-ink-2">
        {credit.artist && credit.artist !== "?" ? credit.artist : "Wikimedia Commons"}
      </a>{" "}
      · {credit.license} · dithered
    </p>
  );
}
