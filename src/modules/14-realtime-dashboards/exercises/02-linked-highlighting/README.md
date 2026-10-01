# Exercise 14.2: Linked highlighting across three views

Build three linked views of the penguins that share **hover** and **selection** through an external store with **selectors**.

```
┌── Scatter (bill length × depth) ──┐ ┌── Species bars ──┐
│  hover a point → highlight it    │ │ click a species   │
│  everywhere                       │ │ → select          │
└───────────────────────────────────┘ └───────────────────┘
┌── Table: the 10 heaviest of the current selection ────────┐
│  hovering a row highlights that point in the scatter      │
└───────────────────────────────────────────────────────────┘
```

## Requirements

1. **Store**: `createStore<State>()` with `get / set / subscribe`, and a `useStore(selector)` hook built on `useSyncExternalStore`.
   ```ts
   interface State { hoveredId: number | null; selectedSpecies: Species | null }
   ```
2. **SpeciesBars**: a count per species. Clicking toggles `selectedSpecies`. It must select **only** `selectedSpecies`, so hovering elsewhere doesn't re-render it.
3. **Scatter**: points colored by species, dimmed when they're not in the selected species. Hover uses **Delaunay** nearest-point lookup and writes `hoveredId`. The hovered point gets a ring.
4. **Table**: the 10 heaviest penguins in the current selection. Hovering a row writes `hoveredId`, and the hovered row is highlighted.
5. **Render counters** in each view prove that:
   - hover changes re-render only the Scatter and the Table
   - selection changes re-render all three
6. Don't use context for this state. The point is selector-level subscriptions.

## Done when

- [ ] Hover is linked both ways (scatter ↔ table)
- [ ] Clicking a species filters the table and dims the scatter
- [ ] The SpeciesBars render counter doesn't change while you hover
