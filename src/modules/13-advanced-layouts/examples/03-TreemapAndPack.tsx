/**
 * Example 13.03: treemap and circle packing from the same hierarchy.
 * Both layouts need .sum() so every node knows its total value.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { fileTree, type TreeNode } from "../../../shared/data";
import { palette } from "../../../shared/theme";

const tilings = {
  squarify: d3.treemapSquarify,
  binary: d3.treemapBinary,
  slice: d3.treemapSlice,
  dice: d3.treemapDice,
  sliceDice: d3.treemapSliceDice,
} as const;

// Build and sum the hierarchy once. Layouts get a .copy(), because they mutate nodes.
const root = d3
  .hierarchy(fileTree)
  .sum((d) => d.value ?? 0)
  .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

const topLevel = root.children!.map((c) => c.data.name);
const color = d3.scaleOrdinal<string, string>().domain(topLevel).range(palette);
/** Color by the top-level folder the node belongs to */
const colorOf = (n: d3.HierarchyNode<TreeNode>) => color(n.ancestors().at(-2)?.data.name ?? n.data.name);

export default function TreemapAndPack() {
  const [ref, dms] = useChartDimensions({ height: 420, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const [mode, setMode] = useState<"treemap" | "pack">("treemap");
  const [tiling, setTiling] = useState<keyof typeof tilings>("squarify");
  const [hovered, setHovered] = useState<string | null>(null);

  // Skip the layouts until the container is measured. d3.pack() throws
  // on a 0×0 size with padding (and the first render always has width 0).
  const ready = dms.width > 0;
  const treemapLeaves = useMemo(
    () =>
      ready
        ? d3.treemap<TreeNode>().size([dms.width, dms.height]).paddingInner(2).paddingOuter(3).paddingTop(18).tile(tilings[tiling])(root.copy())
        : null,
    [ready, dms.width, dms.height, tiling],
  );
  const packRoot = useMemo(() => (ready ? d3.pack<TreeNode>().size([dms.width, dms.height]).padding(4)(root.copy()) : null), [ready, dms.width, dms.height]);

  const total = root.value ?? 0;

  return (
    <div className="stack">
      <div className="row">
        {(["treemap", "pack"] as const).map((m) => (
          <button key={m} className={`btn ${mode === m ? "primary" : ""}`} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
        {mode === "treemap" && (
          <select value={tiling} onChange={(e) => setTiling(e.target.value as keyof typeof tilings)}>
            {Object.keys(tilings).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
        <span className="muted">{hovered ?? `project: ${total} KB total`}</span>
      </div>
      <div ref={ref}>
        {treemapLeaves && packRoot && (
          <svg width={dms.width} height={dms.height} className="chart">
            {mode === "treemap"
              ? treemapLeaves.descendants().map((n) => {
                  const w = n.x1 - n.x0;
                  const h = n.y1 - n.y0;
                  const isLeaf = !n.children;
                  const label = `${n.data.name} · ${n.value} KB · ${d3.format(".1%")((n.value ?? 0) / total)}`;
                  return (
                    <g key={n.ancestors().map((a) => a.data.name).join("/")} transform={`translate(${n.x0},${n.y0})`} onPointerEnter={() => setHovered(label)} onPointerLeave={() => setHovered(null)}>
                      <rect width={w} height={h} fill={isLeaf ? colorOf(n) : "none"} fillOpacity={0.8} stroke={isLeaf ? "none" : colorOf(n)} strokeOpacity={n.depth === 0 ? 0 : 0.6} rx={2} />
                      {/* Labels only where they fit */}
                      {!isLeaf && n.depth > 0 && w > 40 && (
                        <text x={4} y={13} fontSize={11} style={{ fontWeight: 600 }}>
                          {n.data.name}/
                        </text>
                      )}
                      {isLeaf && w > 50 && h > 16 && (
                        <text x={4} y={14} fontSize={10} style={{ fill: "white" }}>
                          {n.data.name}
                        </text>
                      )}
                    </g>
                  );
                })
              : packRoot.descendants().map((n) => {
                  const label = `${n.data.name} · ${n.value} KB`;
                  return (
                    <g key={n.ancestors().map((a) => a.data.name).join("/")} transform={`translate(${n.x},${n.y})`} onPointerEnter={() => setHovered(label)} onPointerLeave={() => setHovered(null)}>
                      <circle r={n.r} fill={n.children ? "none" : colorOf(n)} fillOpacity={0.8} stroke={n.children ? colorOf(n) : "none"} strokeOpacity={n.depth === 0 ? 0.2 : 0.6} />
                      {!n.children && n.r > 22 && (
                        <text textAnchor="middle" dy="0.35em" fontSize={10} style={{ fill: "white" }}>
                          {n.data.name}
                        </text>
                      )}
                    </g>
                  );
                })}
          </svg>
        )}
      </div>
    </div>
  );
}
