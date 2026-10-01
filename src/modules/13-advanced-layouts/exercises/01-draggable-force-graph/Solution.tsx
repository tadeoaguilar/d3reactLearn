/**
 * Exercise 13.1: reference solution.
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { socialGraph } from "../../../../shared/data";
import { palette } from "../../../../shared/theme";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}
interface Link extends d3.SimulationLinkDatum<Node> {
  weight: number;
}

export default function DraggableForceGraph() {
  const [ref, dms] = useChartDimensions({ height: 460, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const gRef = useRef<SVGGElement>(null);
  const simRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const draggingRef = useRef<Node | null>(null);
  const [, setTick] = useState(0);
  const [alpha, setAlpha] = useState(1);

  // 1. Copies for the simulation
  const { nodes, links } = useMemo(
    () => ({
      nodes: socialGraph.nodes.map((n) => ({ ...n })) as Node[],
      links: socialGraph.links.map((l) => ({ ...l })) as Link[],
    }),
    [],
  );

  // 3. Degree → radius
  const radius = useMemo(() => {
    const degree = new Map<string, number>();
    for (const l of socialGraph.links) {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
    }
    const scale = d3.scaleSqrt().domain([0, d3.max(degree.values()) ?? 1]).range([6, 16]);
    return (id: string) => scale(degree.get(id) ?? 0);
  }, []);

  // 2. Simulation
  useEffect(() => {
    if (dms.width === 0) return;
    const sim = d3
      .forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id((d) => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(dms.width / 2, dms.height / 2))
      .force("collide", d3.forceCollide<Node>((d) => radius(d.id) + 3))
      .force("x", d3.forceX(dms.width / 2).strength(0.05))
      .force("y", d3.forceY(dms.height / 2).strength(0.07))
      .on("tick", () => {
        setTick((t) => t + 1);
        setAlpha(sim.alpha());
      });
    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [nodes, links, radius, dms.width, dms.height]);

  // 5 + 6. Drag with sticky pinning
  function onPointerDown(e: PointerEvent<SVGCircleElement>, node: Node) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = node;
    node.fx = node.x;
    node.fy = node.y;
    simRef.current?.alphaTarget(0.3).restart();
  }
  function onPointerMove(e: PointerEvent<SVGCircleElement>) {
    const node = draggingRef.current;
    if (!node) return;
    const [x, y] = d3.pointer(e, gRef.current);
    node.fx = Math.max(0, Math.min(dms.width, x));
    node.fy = Math.max(0, Math.min(dms.height, y));
  }
  function onPointerUp() {
    if (!draggingRef.current) return;
    // Sticky: keep fx/fy so the node stays where it was dropped
    draggingRef.current = null;
    simRef.current?.alphaTarget(0);
  }
  function release(node: Node) {
    node.fx = null;
    node.fy = null;
    simRef.current?.alpha(0.5).restart();
  }
  // 7
  function releaseAll() {
    nodes.forEach((n) => {
      n.fx = null;
      n.fy = null;
    });
    simRef.current?.alpha(1).restart();
  }

  const pinned = nodes.filter((n) => n.fx != null).length;

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={releaseAll} disabled={pinned === 0}>
          Release all
        </button>
        <div className="legend">
          {[0, 1, 2, 3].map((g) => (
            <span key={g} className="row" style={{ gap: 4 }}>
              <span className="swatch" style={{ background: palette[g] }} /> Group {g + 1}
            </span>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ border: "1px solid var(--border)", borderRadius: 8 }}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} style={{ touchAction: "none" }}>
            <g ref={gRef}>
              {links.map((l, i) => {
                const s = l.source as Node;
                const t = l.target as Node;
                return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="var(--chart-axis)" strokeOpacity={0.5} strokeWidth={l.weight} />;
              })}
              {nodes.map((n) => {
                const isPinned = n.fx != null;
                return (
                  <g key={n.id} transform={`translate(${n.x ?? 0},${n.y ?? 0})`}>
                    <circle
                      r={radius(n.id)}
                      fill={palette[n.group]}
                      stroke={isPinned ? "currentColor" : "var(--surface)"}
                      strokeWidth={isPinned ? 3 : 1.5}
                      style={{ cursor: "grab" }}
                      onPointerDown={(e) => onPointerDown(e, n)}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onDoubleClick={() => release(n)}
                    >
                      <title>{isPinned ? `${n.id} (pinned, double-click to release)` : n.id}</title>
                    </circle>
                    <text y={-radius(n.id) - 4} textAnchor="middle" fontSize={10} pointerEvents="none">
                      {isPinned ? "📌 " : ""}
                      {n.id}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
      <p className="muted">
        {nodes.length} nodes · {links.length} links · {pinned} pinned · alpha {alpha.toFixed(3)}
      </p>
    </div>
  );
}
