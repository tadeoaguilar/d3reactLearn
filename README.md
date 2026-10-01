# React + D3 Learning Lab

A hands-on course that takes you from **"I know JavaScript"** to **building interactive, real-time D3 dashboards in React**, all in TypeScript.

Every module has three parts:

| Part | What it is | Where it lives |
| --- | --- | --- |
| 📖 **Lesson** | A detailed explanation with diagrams, code snippets and common mistakes | `src/modules/NN-name/README.md` |
| ▶ **Examples** | Small, runnable, heavily commented components you can read and change | `src/modules/NN-name/examples/*.tsx` |
| ✎ **Exercises** | A task with a `Starter.tsx` (your work) and a `Solution.tsx` (the reference answer) | `src/modules/NN-name/exercises/*/` |

The app in this repo shows all of this in the browser: the lesson on the left, live demos, and a **My work / Reference solution** switch for each exercise.

---

## Getting started

```bash
npm install
npm run dev        # open the URL it prints (usually http://localhost:5173)
```

Other scripts:

```bash
npm run typecheck  # TypeScript check across the whole repo
npm run build      # production build (also type-checks)
```

**How to do an exercise**

1. Open the exercise in the app and read the instructions.
2. Open `Starter.tsx` in your editor. Look for the `TODO` comments.
3. Save the file. Vite hot-reloads it, so the **My work** view updates right away.
4. Stuck? Switch to **Reference solution**, or open `Solution.tsx`. Try for at least 15 minutes first. Struggling a little is how the ideas stick.

> 💡 Want to start over? `git checkout -- path/to/Starter.tsx` restores the original starter.

---

## Curriculum

### Part 1: React foundations

| # | Module | You will learn |
| --- | --- | --- |
| 00 | **TypeScript Essentials for React** | Types, interfaces, unions, generics: just enough TS to read and write React code |
| 01 | **JSX & Components** | What JSX compiles to, components, props, typing props, `children`, composition |
| 02 | **State & Events** | `useState`, event handlers, re-rendering, functional updates, immutable updates |
| 03 | **Lists, Conditionals & Forms** | `map` + `key`, conditional rendering, controlled inputs, lifting state up |

### Part 2: Hooks in depth

| # | Module | You will learn |
| --- | --- | --- |
| 04 | **useEffect** | Synchronizing with the outside world, dependency arrays, cleanup, data fetching, race conditions, when *not* to use an effect |
| 05 | **Refs & Layout Effects** | `useRef` for DOM nodes and mutable values, `useLayoutEffect`, measuring, refs as props (React 19) |
| 06 | **Memoization & Performance** | `useMemo`, `useCallback`, `memo`, `useTransition`, `useDeferredValue` |
| 07 | **useReducer & Context** | Reducers, typed actions, Context, reducer + context for app-wide state |
| 08 | **Custom Hooks** | Pulling logic out into reusable hooks: `useLocalStorage`, `useFetch`, `useInterval`, `useResizeObserver`, `useSyncExternalStore` |

### Part 3: D3 with React

| # | Module | You will learn |
| --- | --- | --- |
| 09 | **D3 Fundamentals** | Selections, the data join, scales, axes, shape generators (the D3 mental model) |
| 10 | **Integrating D3 with React** | The three integration strategies, the margin convention, responsive charts |
| 11 | **Core Charts** | Bar, line, stacked area, scatter, donut, histogram |
| 12 | **Interactivity** | Tooltips, transitions, legends, brushing, zoom & pan |
| 13 | **Advanced Layouts** | Force-directed graphs, trees, treemaps, geographic maps |
| 14 | **Real-time Dashboards** | Streaming data, linked charts, canvas rendering for big data |
| 15 | **Capstone Project** | Build a full interactive dashboard from a spec |

**Suggested pace:** about one module per 1 to 3 study sessions. Modules 04, 10 and 12 are the most important. Take your time there.

---

## Repository layout

```
d3reactLearn/
├── README.md                 ← you are here (also the app's home page)
├── public/data/              ← JSON files the "data fetching" examples load
├── src/
│   ├── app/                  ← the learning-lab shell (sidebar, router, markdown viewer)
│   ├── shared/
│   │   ├── data.ts           ← sample datasets (seeded, so they're the same on every run)
│   │   ├── theme.ts          ← chart palette + margin type
│   │   └── hooks/            ← finished hooks reused by later modules
│   └── modules/
│       └── NN-topic/
│           ├── README.md     ← the lesson
│           ├── examples/     ← runnable examples
│           └── exercises/
│               └── NN-task/
│                   ├── README.md
│                   ├── Starter.tsx
│                   └── Solution.tsx
```

The app finds new files on its own (see `src/app/registry.ts`). To add your own experiment, create `src/modules/NN-x/examples/99-MyExperiment.tsx` with a default export and it shows up in the sidebar.

### Shared building blocks

You build these yourself during the course. The finished versions live in `src/shared` so later modules can reuse them:

| File | What it is | Built in |
| --- | --- | --- |
| `hooks/useChartDimensions.ts` | measures a container with ResizeObserver and applies the margin convention | 08, 10 |
| `charts/Axis.tsx` | a React `<g>` whose inside is drawn by `d3-axis` (hybrid strategy), with a grid mode | 10 |
| `charts/ChartFrame.tsx` | a responsive SVG that shares its dimensions through a render prop and context | 10 |
| `charts/Tooltip.tsx` | an HTML tooltip that flips at the edges (measured with `useLayoutEffect`) | 12 |
| `data.ts` | seeded sample datasets: finance, time series, penguins, file tree, social graph, products | — |
| `geo.ts` | world countries (TopoJSON → GeoJSON), borders mesh, a synthetic per-country index | 13 |
| `stream.ts` | a fake real-time metrics feed (subscribe/unsubscribe) + a sliding-window helper | 14 |

📄 **Quick reference:** [`CHEATSHEET.md`](CHEATSHEET.md) has every hook, the effect-cleanup table, the D3 ownership table, scales, formats and performance tips on one page.

## Tech stack

- **React 19** with function components and hooks only
- **TypeScript** in strict mode
- **D3 v7** (installed as the full `d3` bundle, with `@types/d3`)
- **Vite** for the dev server and hot reload
- `topojson-client` + `world-atlas` for the map examples (the data ships with npm, so it works offline)

## Further reading

- React docs: https://react.dev/learn (especially *"You Might Not Need an Effect"*)
- D3 docs: https://d3js.org
- Observable D3 gallery: https://observablehq.com/@d3/gallery
- Amelia Wattenberger, *Fullstack D3 and Data Visualization*
