// Photo credits for the fish images in public/fish/.
// The data lives in src/data/fish-credits.json, one entry per species id.
import credits from "@/data/fish-credits.json";

export type FishCredit = {
  /** File name inside public/fish/. */
  file: string;
  /** Wikimedia Commons page (shown in the app; required by the licences). */
  source: string;
  license: string;
  artist: string;
  /** Set true when the photo faces right, so every fish ends up facing left. */
  flip?: boolean;
};

const CREDITS = credits as Record<string, FishCredit>;

export const fishCredit = (id: string): FishCredit | undefined => CREDITS[id];

const hash = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

/** Image URL, versioned by source so a replaced photo is never served stale. */
export const fishUrl = (c: FishCredit) => `/fish/${c.file}?v=${hash(c.source)}`;
