/**
 * Exercise 14.2: reference solution.
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

// 1. Store + selector hook
function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(partial: Partial<T>) {
      const next = { ...state, ...partial };
      // Skip notifications when nothing changed (cheap shallow check)
      if ((Object.keys(partial) as (keyof T)[]).every((k) => Object.is(state[k], next[k]))) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

const store = createStore<State>({ hoveredId: null, selectedSpecies: null });

function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

function useRenderCount() {
  const r = useRef(0);
  r.current++;
  return r.current;
}

// 2. Species bars: subscribes to selectedSpecies ONLY
const counts = d3.rollup(penguins, (v) => v.length, (p) => p.species);
const SpeciesBars = memo(function SpeciesBars() {
  const selected = useStore((s) => s.selectedSpecies);
  const renders = useRenderCount();
  const max = Math.max(...counts.values());
  return (
    <div className="card" style={{ height: "100%" }}>
      <strong>Species</strong> <span className="muted">(renders {renders})</span>
      {SPECIES.map((s) => (
        <div
          key={s}
          onClick={() => store.set({ selectedSpecies: selected === s ? null : s })}
          style={{ marginTop: 10, cursor: "pointer", opacity: selected && selected !== s ? 0.35 : 1 }}
        >
          <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
            <span>{s}</span>
            <span>{counts.get(s)}</span>
          </div>
          <div style={{ height: 12, borderRadius: 4, background: color(s), width: `${((counts.get(s) ?? 0) / max) * 100}%` }} />
        </div>
      ))}
      <p className="muted" style={{ fontSize: 12 }}>
        click to select / deselect
      </p>
    </div>
  );
});

// 3. Scatter: subscribes to both
const Scatter = memo(function Scatter() {
  const hoveredId = useStore((s) => s.hoveredId);
  const selected = useStore((s) => s.selectedSpecies);
  const renders = useRenderCount();
  const [ref, dms] = useChartDimensions({ aspectRatio: 1.5 });

  const x = useMemo(() => d3.scaleLinear().domain(d3.extent(penguins, (p) => p.billLength) as [number, number]).nice().range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain(d3.extent(penguins, (p) => p.billDepth) as [number, number]).nice().range([dms.innerHeight, 0]), [dms.innerHeight]);
  const delaunay = useMemo(() => d3.Delaunay.from(penguins, (p) => x(p.billLength), (p) => y(p.billDepth)), [x, y]);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const [mx, my] = d3.pointer(e, e.currentTarget);
    const p = penguins[delaunay.find(mx, my)];
    const close = Math.hypot(x(p.billLength) - mx, y(p.billDepth) - my) < 30;
    store.set({ hoveredId: close ? p.id : null });
  }

  const hovered = hoveredId !== null ? penguins[hoveredId] : null;

  return (
    <div className="card">
      <strong>Bill length × depth</strong> <span className="muted">(renders {renders})</span>
      <div ref={ref}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} className="chart">
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} />
              <Axis orientation="left" scale={y} />
              {penguins.map((p) => (
                <circle key={p.id} cx={x(p.billLength)} cy={y(p.billDepth)} r={3.5} fill={color(p.species)} opacity={selected && p.species !== selected ? 0.12 : 0.75} />
              ))}
              {hovered && <circle cx={x(hovered.billLength)} cy={y(hovered.billDepth)} r={8} fill="none" stroke="currentColor" strokeWidth={2} />}
              <rect width={dms.innerWidth} height={dms.innerHeight} fill="transparent" onPointerMove={onMove} onPointerLeave={() => store.set({ hoveredId: null })} />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
});

// 4. Table: subscribes to both
const HeaviestTable = memo(function HeaviestTable() {
  const hoveredId = useStore((s) => s.hoveredId);
  const selected = useStore((s) => s.selectedSpecies);
  const renders = useRenderCount();
  const rows = useMemo(
    () =>
      penguins
        .filter((p) => !selected || p.species === selected)
        .toSorted((a, b) => b.bodyMass - a.bodyMass)
        .slice(0, 10),
    [selected],
  );
  return (
    <div className="card">
      <strong>10 heaviest {selected ?? "penguins"}</strong> <span className="muted">(renders {renders})</span>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 13 }} onPointerLeave={() => store.set({ hoveredId: null })}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th>#</th>
            <th>species</th>
            <th>mass (g)</th>
            <th>bill (mm)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} onPointerEnter={() => store.set({ hoveredId: p.id })} style={{ background: p.id === hoveredId ? "var(--accent-soft)" : undefined }}>
              <td>{p.id}</td>
              <td style={{ color: color(p.species) }}>{p.species}</td>
              <td>{p.bodyMass}</td>
              <td>
                {p.billLength} × {p.billDepth}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

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
