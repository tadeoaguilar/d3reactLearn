# Module 13 — Advanced Layouts

D3's **layout** modules turn data into positions: where each node, rectangle or country goes. You then draw them however you like. This module covers the three big families:

| Family | Modules | Charts |
| --- | --- | --- |
| **Networks** | `d3-force` | force-directed graphs, bubble clusters, beeswarms |
| **Hierarchies** | `d3-hierarchy` | trees, dendrograms, treemaps, circle packing, sunbursts |
| **Geography** | `d3-geo` + `topojson-client` | choropleths, symbol maps, globes |

Hierarchy and geo layouts are **pure** (data in, positions out), so they fit React perfectly. The force layout is a **simulation that runs over time**, so it needs more care.

---

## 1. Force-directed graphs

A force simulation is a small physics engine. Each "tick" nudges the nodes according to the forces, and it slowly cools down (`alpha` decays toward 0).

```ts
const simulation = d3.forceSimulation<Node>(nodes)
  .force("link", d3.forceLink<Node, Link>(links).id((d) => d.id).distance(50))  // springs
  .force("charge", d3.forceManyBody().strength(-120))                          // repulsion
  .force("center", d3.forceCenter(width / 2, height / 2))                       // gravity to the middle
  .force("collide", d3.forceCollide(12))                                        // no overlap
  .on("tick", () => { /* positions changed: redraw */ });
```

⚠️ **The simulation mutates your objects.** It adds `x, y, vx, vy` to each node and replaces `link.source` / `link.target` strings with node objects. Always give it **copies**: `nodes.map(n => ({ ...n }))`.

### Force simulation + React: the pattern

```tsx
function ForceGraph({ data }: { data: Graph }) {
  const [, setTick] = useState(0);                          // just a re-render trigger
  const simRef = useRef<d3.Simulation<Node, Link> | null>(null);

  // Copies that the simulation can mutate. New copies only when the data changes.
  const { nodes, links } = useMemo(() => ({
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.links.map((l) => ({ ...l })),
  }), [data]);

  useEffect(() => {
    const sim = d3.forceSimulation(nodes)
      .force(…)
      .on("tick", () => setTick((t) => t + 1));             // re-render on every tick
    simRef.current = sim;
    return () => { sim.stop(); };                            // ❗ cleanup
  }, [nodes, links]);

  return <svg>{links.map(…)}{nodes.map((n) => <circle cx={n.x} cy={n.y} … />)}</svg>;
}
```

- The simulation lives in a **ref**: it's mutable, long-lived, and never shown directly.
- Each tick triggers a React render. That's fine up to a few hundred nodes. For thousands, let D3 update the DOM directly (Strategy A) or draw on canvas.
- `sim.stop()` in the cleanup is essential. Without it, timers keep running after unmount (and StrictMode starts two simulations).

### Dragging

With React pointer events:

```tsx
onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); node.fx = node.x; node.fy = node.y; sim.alphaTarget(0.3).restart(); }}
onPointerMove={(e) => { if (dragging) { const [x, y] = d3.pointer(e, gRef.current); node.fx = x; node.fy = y; } }}
onPointerUp={() => { node.fx = null; node.fy = null; sim.alphaTarget(0); }}
```

`fx`/`fy` **pin** a node. Setting them back to `null` releases it. `d3.drag()` does the same thing if you let D3 own the nodes.

---

## 2. Hierarchies

Every hierarchy layout starts with `d3.hierarchy`, which wraps nested data into nodes with `depth`, `height`, `parent`, `children`, `descendants()`, `leaves()` and `links()`:

```ts
const root = d3.hierarchy(fileTree)
  .sum((d) => d.value ?? 0)                    // value of each node = sum of its leaves (needed by treemap/pack/partition)
  .sort((a, b) => b.value! - a.value!);        // biggest first
```

Flat data (rows with `id` and `parentId`)? Use `d3.stratify()` first.

Then apply a layout, which **adds coordinates** to each node:

| Layout | Adds | Draw with |
| --- | --- | --- |
| `d3.tree().size([h, w])` | `x, y` | `<circle>` + `d3.linkHorizontal()` paths |
| `d3.cluster()` | `x, y` (leaves aligned) | same (a dendrogram) |
| `d3.treemap().size([w, h]).padding(2)` | `x0, y0, x1, y1` | `<rect>` |
| `d3.pack().size([w, h]).padding(3)` | `x, y, r` | `<circle>` |
| `d3.partition().size([2π, r])` | `x0, x1, y0, y1` | `d3.arc()` → sunburst |

```tsx
const layout = d3.treemap<TreeNode>().size([innerWidth, innerHeight]).paddingInner(2).tile(d3.treemapSquarify);
const leaves = layout(root.copy()).leaves();     // copy(): layouts mutate the nodes
leaves.map((n) => <rect key={n.data.name} x={n.x0} y={n.y0} width={n.x1 - n.x0} height={n.y1 - n.y0} />);
```

Put the layout in `useMemo` keyed on the data and size, since it's the expensive part.

### Collapsible trees

Keep `collapsed: Set<string>` in state. Before running the layout, **prune** the children of collapsed nodes (`root.each(n => { if (collapsed.has(id(n))) n.children = undefined })`) on a fresh `d3.hierarchy(...)`. Example 02 does this.

---

## 3. Maps

### Data formats

- **GeoJSON**: `FeatureCollection` of `Feature`s with `geometry` (polygons in `[longitude, latitude]`) and `properties`.
- **TopoJSON**: a compressed format that shares borders between shapes. It's roughly 80% smaller. Convert it with `topojson.feature(topology, topology.objects.countries)`.

This repo imports `world-atlas/countries-110m.json` (TopoJSON, from npm).

### Projections and paths

A **projection** maps the sphere to the plane. A **path generator** turns GeoJSON into SVG `d` strings:

```ts
const projection = d3.geoNaturalEarth1().fitSize([innerWidth, innerHeight], countries);  // auto-scale to fit
const path = d3.geoPath(projection);

countries.features.map((f) => <path key={f.id} d={path(f)!} fill={color(valueById.get(f.id))} />);

const [px, py] = projection([lon, lat])!;   // place a city
```

| Projection | Good for |
| --- | --- |
| `geoNaturalEarth1`, `geoEqualEarth` | world maps (a good compromise / equal-area) |
| `geoMercator` | web tiles, navigation (it heavily distorts area near the poles) |
| `geoAlbersUsa` | US maps with Alaska and Hawaii insets |
| `geoOrthographic` | globes (rotate it with `projection.rotate([λ, φ])`) |

`d3.geoGraticule10()` draws the latitude/longitude grid. `{ type: "Sphere" }` gives the outline.

### Choropleths

- Use a **sequential** color scale for magnitudes (`scaleSequential(d3.interpolateBlues)`), and **diverging** around a meaningful midpoint.
- Consider **classed** scales (`scaleQuantize`, `scaleQuantile`, `scaleThreshold`). People can't tell apart more than about 7 shades.
- **Always include a legend.** Color alone isn't readable without one.
- Normalize: map **rates** (per capita), not raw counts, or you just end up drawing population.

## ✅ Checklist

- [ ] I can run a force simulation in an effect, keep it in a ref, re-render on tick, and stop it in cleanup
- [ ] I copy data before giving it to the simulation or a hierarchy layout
- [ ] I can build tree, treemap and pack layouts from `d3.hierarchy`
- [ ] I can draw a world map with a projection and `geoPath`, and color it with a legend
