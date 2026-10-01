# Module 08 — Custom Hooks

A **custom hook** is a function whose name starts with `use` and that calls other hooks. It lets you pull **stateful logic** out of a component and reuse it, the same way a regular function lets you reuse calculations.

```tsx
// Before: logic tangled inside the component
function Chart() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => { /* ResizeObserver… */ }, []);
  …
}

// After: one line, reusable in every chart
function Chart() {
  const [ref, { width, height }] = useChartDimensions();
  …
}
```

## 1. The rules

1. The name **must** start with `use`. React tooling relies on it to apply the Rules of Hooks.
2. Call hooks inside them at the top level only, like in components.
3. **Each call gets its own state.** Two components calling `useWindowSize()` don't share state. Each has its own `useState` and its own listener. (To share state, use context or an external store.)

## 2. Designing the API

| Return shape | When | Example |
| --- | --- | --- |
| A single value | one output | `const width = useWindowWidth()` |
| A tuple `[a, b] as const` | like `useState`, so callers can rename | `const [value, setValue] = useLocalStorage("k", 0)` |
| An object | many outputs, callers pick what they need | `const { data, error, isLoading } = useFetch(url)` |

Use `as const` on tuples, or TypeScript infers `(A | B)[]` instead of `[A, B]`.

### Generic hooks

```tsx
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : initial;
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
```

## 3. Hooks you'll build in this module

| Hook | Concepts it uses |
| --- | --- |
| `useLocalStorage` | lazy init, a syncing effect, generics, `try/catch` (storage can throw) |
| `useFetch` | discriminated-union state, abort cleanup, refetch |
| `useInterval` | the **latest callback ref** pattern, which avoids stale closures |
| `useResizeObserver` / `useChartDimensions` | refs, `useLayoutEffect`, observer cleanup, the margin convention |
| `useMediaQuery` / `useOnlineStatus` | `useSyncExternalStore` |
| `useDebounce` (exercise) | a timer + cleanup |

## 4. The "latest ref" pattern

Problem: an interval or event listener is set up once, but the callback it calls changes every render (it closes over new state).

```tsx
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Always point at the newest callback.
  useEffect(() => { savedCallback.current = callback; });

  useEffect(() => {
    if (delay === null) return;                    // null = paused
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);                                     // re-subscribe only when the delay changes
}
```

The interval is created once per delay, but it always calls the **latest** callback, so there are no stale closures and no resetting the timer on every render. You'll use this pattern for streaming charts in Module 14.

> React is adding a built-in `useEffectEvent` for exactly this. Depending on your React version it may be available as a stable API. The ref pattern works everywhere.

## 5. `useSyncExternalStore`: subscribing to outside data

For data that lives **outside React** (browser APIs, a global store, a WebSocket cache), `useSyncExternalStore` is safer than `useState` + `useEffect`. It avoids "tearing", where different components see different values during a concurrent render.

```tsx
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => { window.removeEventListener("online", callback); window.removeEventListener("offline", callback); };
}

function useOnlineStatus() {
  return useSyncExternalStore(subscribe, () => navigator.onLine);
}
```

- `subscribe(cb)`: start listening, call `cb` on change, and return an unsubscribe function.
- `getSnapshot()`: return the current value. It **must return the same value (by `Object.is`)** if nothing changed. Returning a new object each time causes an infinite loop.

This app's router (`src/app/useHashRoute.ts`) uses this hook.

## 6. Testing and composing hooks

Hooks can call other hooks:

```tsx
function useChartData(url: string) {
  const { data, ...rest } = useFetch<Row[]>(url);
  const parsed = useMemo(() => data?.map(parseRow) ?? [], [data]);
  return { rows: parsed, ...rest };
}
```

To unit-test a hook, use `renderHook` from `@testing-library/react`.

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Expecting two components calling the same hook to share state | Each call is independent. Use context or a store to share |
| Returning a new object/array every render and using it as an effect dependency | `useMemo` the return value, or return primitives |
| A hook that doesn't call any hooks | Then it's just a function. Drop the `use` prefix |
| `getSnapshot` returns a new object each call | Return primitives or cached objects |

## ✅ Checklist

- [ ] I can extract logic from a component into a `useX` hook
- [ ] I can type a generic hook and return a typed tuple with `as const`
- [ ] I understand the latest-callback-ref pattern and why `useInterval` needs it
- [ ] I can use `useSyncExternalStore` for a browser API
