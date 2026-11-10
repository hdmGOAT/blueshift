"use client";

import { memo } from "react";
import { Block } from "@/components/ui/Block";
import { CorrelationCard } from "@/features/species/CorrelationCard";
import { SpeciesFilter, type FilterMode } from "@/features/species/SpeciesFilter";
import type { Scope, Species } from "@/lib/data";

type Props = {
  scope: Scope;
  selected: Species;
  mode: FilterMode;
  setMode: (m: FilterMode) => void;
  checked: Set<string>;
  toggle: (id: string) => void;
  onSelect: (id: string) => void;
};

/** Right panel: species checklist and correlation scores. Does not depend on the quarter. */
export const SpeciesPanel = memo(function SpeciesPanel({ scope, selected, mode, setMode, checked, toggle, onSelect }: Props) {
  return (
    <>
      <Block title="Species">
        <SpeciesFilter mode={mode} setMode={setMode} checked={checked} toggle={toggle} selectedId={selected.id} onSelect={onSelect} />
      </Block>
      <Block title={`Correlation · ${selected.local}`}>
        <CorrelationCard species={selected} scope={scope} />
      </Block>
    </>
  );
});
