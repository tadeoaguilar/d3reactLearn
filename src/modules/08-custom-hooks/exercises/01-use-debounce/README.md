# Exercise 08.1: `useDebounce` and `useThrottle`

In exercise 04.2 you debounced a value inside a component. Now pull that into a **reusable, generic hook**, and write its sibling, `useThrottle`.

## Part A: `useDebounce<T>(value: T, delayMs: number): T`

Returns `value`, but only after it has stopped changing for `delayMs`.

```tsx
const debouncedQuery = useDebounce(query, 300);
```

## Part B: `useThrottle<T>(value: T, intervalMs: number): T`

Returns `value` at most **once per `intervalMs`**. Unlike debounce, it keeps updating *during* continuous changes. That makes it good for things like mouse position → expensive tooltip math.

Tips:

- Keep the time of the last update in a **ref**.
- If enough time has passed, update right away. Otherwise schedule a trailing update for the remaining time, so the final value is never lost.

## Part C: the demo

The starter has an SVG pad that tracks the mouse. Show three dots:

- 🔵 the raw pointer position
- 🟠 the **throttled** position (100ms)
- 🟢 the **debounced** position (300ms)

Plus a counter for how many times each value changed.

## Done when

- [ ] Both hooks are generic and work with any value type (the demo uses `{ x, y }` objects)
- [ ] Timers are cleaned up on unmount and when the delay changes
- [ ] The dots behave as described: orange steps along, green waits until you stop
