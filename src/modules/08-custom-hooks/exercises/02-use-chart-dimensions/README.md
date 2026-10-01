# Exercise 08.2: `useChartDimensions`

Every chart from Module 10 on uses this hook. Here you build it yourself. (A finished copy lives in `src/shared/hooks/useChartDimensions.ts`. Compare with it when you're done.)

## The D3 margin convention

```
┌──────────────────── width ────────────────────┐
│            margin.top                          │
│   ┌──────────── innerWidth ─────────────┐      │
│ m │                                      │  m   │
│ a │       the "bounds": where marks go   │  a   │ height
│ r │                                      │  r   │
│ g │                                      │  g   │
│ . │                                      │  .   │
│ l └──────────────────────────────────────┘  r   │
│            margin.bottom (x-axis lives here)   │
└────────────────────────────────────────────────┘
```

- `innerWidth = width - margin.left - margin.right`
- `innerHeight = height - margin.top - margin.bottom`
- All marks go inside `<g transform={`translate(${margin.left},${margin.top})`}>`, so their coordinates start at (0, 0).

## Requirements

```ts
function useChartDimensions(options?: {
  height?: number;                 // fixed height (default 300)
  aspectRatio?: number;            // OR height = width / aspectRatio
  margin?: Partial<Margin>;        // merged over the default margin
}): readonly [RefObject<HTMLDivElement | null>, ChartDimensions];
```

1. Measure the wrapper's **width** with a `ResizeObserver` (`useLayoutEffect`, with cleanup).
2. Compute height from `height` or `aspectRatio`.
3. Merge the margins with defaults `{ top: 20, right: 20, bottom: 40, left: 50 }`.
4. Return `width, height, margin, innerWidth, innerHeight`. The inner sizes should never be negative.

## Demo

Use the hook to render a responsive chart frame:

- a light rectangle for the **bounds** (inner area)
- the margin areas labeled with their sizes
- a text label with `width × height` and `innerWidth × innerHeight`
- a toggle between fixed-height and 16:9 aspect-ratio mode

Then resize the browser window (or collapse the sidebar on a narrow screen) and watch everything adapt.

## Done when

- [ ] The frame always fills the container width
- [ ] Aspect-ratio mode keeps the proportions
- [ ] No negative sizes on very narrow screens
