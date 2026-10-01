/**
 * Exercise 13.1: Draggable force graph with sticky nodes. See README.md.
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

  // TODO 1: copies of nodes and links (useMemo)
  // TODO 3: degree per node + radius scale
  // TODO 2: simulation effect (ref + cleanup), tick → re-render
  // TODO 5 + 6: drag handlers and sticky pinning
  // TODO 7: release all
  // TODO 8: stats

  return (
    <div className="stack">
      <div ref={ref} style={{ border: "1px solid var(--border)", borderRadius: 8 }}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} style={{ touchAction: "none" }}>
            <text x={dms.width / 2} y={dms.height / 2} textAnchor="middle">
              {socialGraph.nodes.length} nodes, {socialGraph.links.length} links. Draw the graph here.
            </text>
          </svg>
        )}
      </div>
    </div>
  );
}
