"use client";

import { Block } from "@/components/ui/Block";
import { ExpandIcon } from "@/components/ui/icons";
import { CatchMix } from "@/features/species/CatchMix";
import { KeyFinding } from "@/features/species/KeyFinding";
import { Outlook } from "@/features/species/Outlook";
import { SpeciesIdentity } from "@/features/species/SpeciesIdentity";
import { TrendChart } from "@/features/species/TrendChart";
import { regionName, type Layer, type Scope, type Species } from "@/lib/data";

type Props = {
  scope: Scope;
  index: number;
  layer: Layer;
  selected: Species;
  onSelect: (id: string) => void;
  onOpenHistory: () => void;
};

/** Left panel: key finding, the selected species, and the regional catch mix. */
export function InsightsPanel({ scope, index, layer, selected, onSelect, onOpenHistory }: Props) {
  return (
    <>
      <KeyFinding scope={scope} onSelect={onSelect} />
      <Block
        title="Selected species"
        action={
          <button onClick={onOpenHistory} className="flex items-center gap-1.5 text-[12px] text-accent-text hover:text-ink">
            History <ExpandIcon />
          </button>
        }
      >
        <SpeciesIdentity species={selected} />
        <div className="label mb-1 mt-3">Landings, t</div>
        <TrendChart species={selected} scope={scope} index={index} layer={layer} />
        <Outlook species={selected} scope={scope} index={index} />
      </Block>
      <Block title={`Catch mix · ${regionName(scope)}`}>
        <CatchMix scope={scope} index={index} selectedId={selected.id} onSelect={onSelect} />
      </Block>
    </>
  );
}
