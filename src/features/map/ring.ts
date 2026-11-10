// Layout of the species bubbles around the lens. Pure, no React.
import { YIELDS, scopeMax, type Scope, type Species } from "@/lib/data";
import { CX, CY, RING } from "./geometry";

const MAX_RADIUS = 46;
const MIN_RADIUS = 7;
const START_ANGLE = -Math.PI * 0.78; // first bubble sits upper-left

export type Bubble = {
  species: Species;
  /** Angle on the ring, radians. */
  angle: number;
  x: number;
  y: number;
  /** Radius; area is proportional to landings. */
  r: number;
  /** Landings this quarter, tonnes. */
  value: number;
};

export function ringLayout(visible: Species[], scope: Scope, index: number): Bubble[] {
  const n = visible.length;
  return visible.map((species, i) => {
    const angle = START_ANGLE + (i * 2 * Math.PI) / n;
    const value = YIELDS[scope][species.id][index].value;
    const r = Math.max(MIN_RADIUS, MAX_RADIUS * Math.sqrt(value / scopeMax[scope]));
    return { species, angle, value, r, x: CX + RING * Math.cos(angle), y: CY + RING * Math.sin(angle) };
  });
}
