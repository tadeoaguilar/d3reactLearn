/**
 * Example 13.01: force-directed graph with React rendering and dragging.
 *
 *   - The simulation lives in a ref, is created in an effect and stopped in cleanup
 *   - Each "tick" triggers a React re-render (fine for ~hundreds of nodes)
 *   - Drag uses React pointer events + fx/fy pinning
 *   - Hovering a node highlights its neighbors
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { socialGraph } from "../../../shared/data";
import { palette } from "../../../shared/theme";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}
interface Link extends d3.SimulationLinkDatum<Node> {
  weight: number;
}

export default function ForceGraph() {
  const [ref, dms] = useChartDimensions({ height: 460, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const gRef = useRef<SVGGElement>(null);
  const simRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const [, setTick] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState<Node | null>(null);
  const [charge, setCharge] = useState(-160);
  // The creation effect reads the latest charge without depending on it,
  // so changing the slider doesn't rebuild the whole simulation.
  const chargeRef = useRef(charge);

  // Copies the simulation is allowed to mutate
  const { nodes, links } = useMemo(
    () => ({
      nodes: socialGraph.nodes.map((n) => ({ ...n })) as Node[],
      links: socialGraph.links.map((l) => ({ ...l })) as Link[],
    }),
    [],
  );

  // Neighbor lookup for highlighting
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of socialGraph.links) {
      if (!map.has(l.source)) map.set(l.source, new Set());
      if (!map.has(l.target)) map.set(l.target, new Set());
      map.get(l.source)!.add(l.target);
      map.get(l.target)!.add(l.source);
    }
    return map;
  }, []);

  // Create the simulation once we know the size.
  useEffect(() => {
    if (dms.width === 0) return;
    const sim = d3
      .forceSimulation<Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(45)
          .strength((l) => 0.2 + l.weight * 0.1),
      )
      .force("charge", d3.forceManyBody().strength(chargeRef.current))
      .force("center", d3.forceCenter(dms.width / 2, dms.height / 2))
      .force("collide", d3.forceCollide(14))
      .force("x", d3.forceX(dms.width / 2).strength(0.04))
      .force("y", d3.forceY(dms.height / 2).strength(0.06))
      .on("tick", () => setTick((t) => t + 1));
    simRef.current = sim;
    return () => {
      sim.stop(); // no ticking after unmount (and no second simulation in StrictMode)
    };
  }, [nodes, links, dms.width, dms.height]);

  // Update a force without re-creating the simulation: change it, then reheat.
  useEffect(() => {
    chargeRef.current = charge;
    const sim = simRef.current;
    if (!sim) return;
    (sim.force("charge") as d3.ForceManyBody<Node>).strength(charge);
    sim.alpha(0.6).restart();
  }, [charge]);

  // ---- drag ---------------------------------------------------------------
  function onPointerDown(e: PointerEvent<SVGCircleElement>, node: Node) {
    e.currentTarget.setPointerCapture(e.pointerId);
    node.fx = node.x;
    node.fy = node.y;
    simRef.current?.alphaTarget(0.3).restart();
    setDragging(node);
  }
  function onPointerMove(e: PointerEvent<SVGCircleElement>) {
    if (!dragging) return;
    const [x, y] = d3.pointer(e, gRef.current);
    dragging.fx = x;
    dragging.fy = y;
  }
  function onPointerUp() {
    if (!dragging) return;
    dragging.fx = null; // release the pin (keep it to "stick" the node instead)
    dragging.fy = null;
    simRef.current?.alphaTarget(0);
    setDragging(null);
  }

  const active = dragging?.id ?? hovered;
  const isLit = (id: string) => !active || id === active || neighbors.get(active)?.has(id);

  return (
    <div className="stack">
      <div className="row">
        <label>
          charge {charge} <input type="range" min={-400} max={-20} value={charge} onChange={(e) => setCharge(e.target.valueAsNumber)} />
        </label>
        <button className="btn" onClick={() => simRef.current?.alpha(1).restart()}>
          Reheat
        </button>
        <span className="muted">Drag nodes · hover to highlight friends</span>
      </div>
      <div ref={ref} style={{ border: "1px solid var(--border)", borderRadius: 8 }}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} style={{ touchAction: "none" }}>
            <g ref={gRef}>
              {links.map((l, i) => {
                const s = l.source as Node;
                const t = l.target as Node;
                const lit = active && (s.id === active || t.id === active);
                return (
                  <line
                    key={i}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={lit ? "#e0803a" : "var(--chart-axis)"}
                    strokeOpacity={active && !lit ? 0.12 : 0.6}
                    strokeWidth={l.weight}
                  />
                );
              })}
              {nodes.map((n) => (
                <g key={n.id} transform={`translate(${n.x ?? 0},${n.y ?? 0})`} opacity={isLit(n.id) ? 1 : 0.25}>
                  <circle
                    r={10}
                    fill={palette[n.group]}
                    stroke="var(--surface)"
                    strokeWidth={2}
                    style={{ cursor: dragging ? "grabbing" : "grab" }}
                    onPointerEnter={() => setHovered(n.id)}
                    onPointerLeave={() => setHovered(null)}
                    onPointerDown={(e) => onPointerDown(e, n)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                  <text y={-14} textAnchor="middle" fontSize={10} pointerEvents="none">
                    {n.id}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
