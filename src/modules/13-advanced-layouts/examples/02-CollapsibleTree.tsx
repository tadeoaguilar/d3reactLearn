/**
 * Example 13.02: a collapsible tidy tree (d3.tree + d3.linkHorizontal).
 *
 * Collapsed node paths are React state. Every render builds a fresh
 * hierarchy, prunes the collapsed branches, and runs the layout.
 * Click a folder to collapse or expand it.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { fileTree, type TreeNode } from "../../../shared/data";

/** A stable unique id for a node: its path from the root. */
const pathOf = (n: d3.HierarchyNode<TreeNode>) =>
  n
    .ancestors()
    .map((a) => a.data.name)
    .reverse()
    .join("/");

export default function CollapsibleTree() {
  const [ref, dms] = useChartDimensions({ height: 460, margin: { top: 20, right: 120, bottom: 20, left: 70 } });
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(["project/docs/guides"]));
  const [layoutKind, setLayoutKind] = useState<"tree" | "cluster">("tree");

  const { nodes, links } = useMemo(() => {
    const root = d3.hierarchy(fileTree);
    // Prune: hide the children of collapsed nodes, but remember that they had some
    root.each((n) => {
      if (n.children && collapsed.has(pathOf(n))) n.children = undefined;
    });
    // Horizontal tree: size is [height, width], and we swap x/y when drawing
    const layout = (layoutKind === "tree" ? d3.tree<TreeNode>() : d3.cluster<TreeNode>()).size([dms.innerHeight, dms.innerWidth]);
    const laidOut = layout(root);
    return { nodes: laidOut.descendants(), links: laidOut.links() };
  }, [collapsed, layoutKind, dms.innerWidth, dms.innerHeight]);

  const link = d3
    .linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
    .x((d) => d.y)
    .y((d) => d.x);

  function toggle(n: d3.HierarchyNode<TreeNode>) {
    if (!n.data.children) return; // a file, not a folder
    const id = pathOf(n);
    setCollapsed((c) => {
      const next = new Set(c);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="stack">
      <div className="row">
        {(["tree", "cluster"] as const).map((k) => (
          <button key={k} className={`btn ${layoutKind === k ? "primary" : ""}`} onClick={() => setLayoutKind(k)}>
            d3.{k}()
          </button>
        ))}
        <button className="btn" onClick={() => setCollapsed(new Set())}>
          Expand all
        </button>
        <span className="muted">Click a folder (●) to toggle it. Hollow nodes are collapsed.</span>
      </div>
      <div ref={ref}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} className="chart">
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              {links.map((l) => (
                <path key={pathOf(l.target)} d={link(l)!} fill="none" stroke="var(--chart-axis)" strokeOpacity={0.6} />
              ))}
              {nodes.map((n) => {
                const isFolder = !!n.data.children;
                const isCollapsed = collapsed.has(pathOf(n));
                return (
                  <g
                    key={pathOf(n)}
                    onClick={() => toggle(n)}
                    // A CSS transform (not the SVG attribute) so the move animates in every browser
                    style={{
                      transform: `translate(${n.y}px, ${n.x}px)`,
                      transition: "transform 400ms ease",
                      cursor: isFolder ? "pointer" : "default",
                    }}
                  >
                    <circle r={isFolder ? 6 : 3.5} fill={isFolder ? (isCollapsed ? "var(--surface)" : "#2f6fdf") : "#2c9a6a"} stroke="#2f6fdf" strokeWidth={isFolder ? 2 : 0} />
                    <text x={isFolder && n.children ? -10 : 10} dy="0.32em" textAnchor={isFolder && n.children ? "end" : "start"}>
                      {n.data.name}
                      {n.data.value !== undefined && <tspan className="muted"> {n.data.value}KB</tspan>}
                      {isCollapsed && <tspan className="muted"> (+{n.data.children!.length})</tspan>}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
