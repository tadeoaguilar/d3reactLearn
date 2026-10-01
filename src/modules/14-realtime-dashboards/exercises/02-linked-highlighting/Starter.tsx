/**
 * Exercise 14.2: Linked highlighting across three views. See README.md.
 */
import { memo, useMemo, useRef, useSyncExternalStore, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../../shared/charts/Axis";
import { penguins, type Species } from "../../../../shared/data";

const SPECIES: Species[] = ["Adelie", "Chinstrap", "Gentoo"];
const color = d3.scaleOrdinal<Species, string>().domain(SPECIES).range(["#2f6fdf", "#e0803a", "#2c9a6a"]);

interface State {
  hoveredId: number | null;
  selectedSpecies: Species | null;
}

// TODO 1: createStore<T>(initial) with get / set / subscribe
// TODO 1: const store = createStore<State>({ hoveredId: null, selectedSpecies: null });
// TODO 1: function useStore<T>(selector: (s: State) => T): T

function useRenderCount() {
  const r = useRef(0);
  r.current++;
  return r.current;
}

function SpeciesBars() {
  const renders = useRenderCount();
  // TODO 2
  return <div className="card todo-hint">SpeciesBars (renders {renders})</div>;
}

function Scatter() {
  const renders = useRenderCount();
  // TODO 3
  return <div className="card todo-hint">Scatter (renders {renders})</div>;
}

function HeaviestTable() {
  const renders = useRenderCount();
  // TODO 4
  return <div className="card todo-hint">Table (renders {renders})</div>;
}

export default function LinkedHighlighting() {
  return (
    <div className="stack">
      <div className="row" style={{ alignItems: "stretch" }}>
        <div style={{ flex: "2 1 380px" }}>
          <Scatter />
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <SpeciesBars />
        </div>
      </div>
      <HeaviestTable />
    </div>
  );
}
