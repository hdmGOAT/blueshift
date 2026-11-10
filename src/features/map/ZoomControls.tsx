import { MinusIcon, PlusIcon, ResetIcon } from "@/components/ui/icons";

type Props = {
  canZoomIn: boolean;
  canZoomOut: boolean;
  canReset: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

const BUTTON = "grid h-8 w-8 place-items-center hover:bg-hi hover:text-ink disabled:opacity-30";

export function ZoomControls({ canZoomIn, canZoomOut, canReset, onZoomIn, onZoomOut, onReset }: Props) {
  return (
    <div className="glass flex overflow-hidden rounded-full text-ink-2">
      <button onClick={onZoomOut} aria-label="Zoom out" disabled={!canZoomOut} className={BUTTON}>
        <MinusIcon />
      </button>
      <button onClick={onZoomIn} aria-label="Zoom in" disabled={!canZoomIn} className={`${BUTTON} border-x border-line`}>
        <PlusIcon />
      </button>
      <button onClick={onReset} aria-label="Reset view" disabled={!canReset} className={BUTTON}>
        <ResetIcon />
      </button>
    </div>
  );
}
