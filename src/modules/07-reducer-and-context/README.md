# Module 07 — useReducer & Context

As a dashboard grows, you hit two problems:

1. **Complex state logic**: many related values that change together (filters, selection, zoom, sort) and many event handlers updating them. → `useReducer`
2. **Prop drilling**: passing the same props through five layers of components that don't use them. → **Context**

Together they make a lightweight app-wide store, with no library needed.

## 1. `useReducer`

A **reducer** is a pure function: `(currentState, action) => nextState`.

```tsx
interface State { count: number; step: number }

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "setStep"; step: number }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment": return { ...state, count: state.count + state.step };
    case "decrement": return { ...state, count: state.count - state.step };
    case "setStep":   return { ...state, step: action.step };   // TS knows `step` exists here
    case "reset":     return initialState;
  }
}

const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: "setStep", step: 5 });
```

### Why use a reducer?

| `useState` | `useReducer` |
| --- | --- |
| Update logic scattered across event handlers | All transitions in **one place** |
| Handlers say *how* to change state | Handlers say *what happened* (`{ type: "pointSelected", id }`) |
| Hard to test without rendering | The reducer is a plain function, so testing is easy |
| Great for independent values | Great when **several values change together** |

`dispatch` is **stable** (the same function every render), so it's safe to pass down and to use in effects.

### Reducer rules

- **Pure**: no fetch, no timers, no `Math.random()`, no mutations. Same input, same output.
- **Return new objects** for anything that changed, the same as with `useState`.
- **Discriminated union actions**: TypeScript narrows the payload per `type`, and warns you if a `case` is missing (add `default: { const _exhaustive: never = action; return state; }`).

## 2. Context

Context lets a parent provide a value that **any** descendant can read, without passing props through every layer.

```tsx
// 1. Create it (with a type and a default value)
type Units = "metric" | "imperial";
const UnitsContext = createContext<Units>("metric");

// 2. Provide it (React 19: <Context> works as the provider; older code uses <Context.Provider>)
<UnitsContext value={units}>
  <Dashboard />
</UnitsContext>

// 3. Read it anywhere below
function Temperature({ celsius }: { celsius: number }) {
  const units = useContext(UnitsContext);
  return <span>{units === "metric" ? `${celsius}°C` : `${celsius * 9 / 5 + 32}°F`}</span>;
}
```

### The "no default" pattern

Often there's no sensible default. Use `null` and a custom hook that throws a helpful error:

```tsx
const DashboardContext = createContext<DashboardValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}
```

### Context and re-renders

**Every component that reads a context re-renders when its value changes.** Two consequences:

1. Don't write `value={{ state, dispatch }}` inline without memoizing it. That's a new object every render, so every consumer re-renders every time.
2. Split contexts that change at different rates. `dispatch` never changes but `state` often does, so put them in **two contexts**. Components that only dispatch then never re-render because of state changes.

## 3. Reducer + Context = a mini store

```
<DashboardProvider>               useReducer lives here
 ├── StateContext  = state        (changes often)
 └── DispatchContext = dispatch   (never changes)
      ├── <Filters/>      → useDashboardDispatch()
      ├── <BarChart/>     → useDashboardState().selectedCategory
      └── <LineChart/>    → useDashboardState().dateRange
```

This is how linked charts work (Module 14): a brush in one chart dispatches `{ type: "rangeChanged" }`, and every other chart reads the new range.

## 4. When to reach for a library

Reducer + context is fine for small and medium apps. Consider **Zustand**, **Jotai** or **Redux Toolkit** when:

- many components subscribe to small slices of large state (context re-renders all consumers)
- you need devtools, middleware or persistence
- high-frequency updates (a live brush, streaming data) cause too many re-renders

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Mutating state in a reducer (`state.items.push`) | Return a new object/array |
| Side effects in a reducer | Do them in an event handler or effect, then dispatch the result |
| Putting everything in one giant context | Split by concern and by update frequency |
| Using context for rapidly changing values like the mouse position | Keep those local, or use a store with selectors |
| `useContext` outside the provider → silently gets the default | Use a `null` default and the throwing custom hook |

## ✅ Checklist

- [ ] I can write a typed reducer with a discriminated-union `Action`
- [ ] I can create, provide and consume a context
- [ ] I can write a `useX()` hook that throws outside its provider
- [ ] I can combine reducer + context and explain why state and dispatch go in separate contexts
