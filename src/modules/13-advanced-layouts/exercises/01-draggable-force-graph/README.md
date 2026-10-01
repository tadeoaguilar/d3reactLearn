# Exercise 13.1: Draggable force graph with sticky nodes

Build a force-directed network of `socialGraph` from scratch. The starter only gives you the data and an empty, measured SVG.

## Requirements

1. **Copy the data** for the simulation (`useMemo`). Never pass `socialGraph.nodes` directly, because the simulation mutates it.
2. **Simulation** in an effect, stored in a ref, **stopped in the cleanup**. Forces: link, charge, center, collide. Re-render on each tick.
3. **Node size by degree**: the radius depends on how many links a node has (`scaleSqrt`, 6–16 px). The collide radius must match.
4. **Colors** by `group`, plus a small legend ("Group 1…4").
5. **Drag** with pointer events (`setPointerCapture`, `d3.pointer`, `fx`/`fy`, `alphaTarget`).
6. **Sticky nodes**: after a drag, the node **stays pinned** where you dropped it and shows a 📌 marker (a thicker stroke is fine). **Double-click** a pinned node to release it.
7. **"Release all"** button: unpins everything and reheats the simulation.
8. **Stats** under the graph: node count, link count, number of pinned nodes, and the current `alpha` (update it on each tick, formatted to 3 decimals).

## Done when

- [ ] Toggling the example on and off (switch to another tab and back) leaves no running simulations. Log in the tick handler to confirm.
- [ ] Drag, pin, double-click to release, and "Release all" all work
- [ ] Bigger nodes don't overlap
