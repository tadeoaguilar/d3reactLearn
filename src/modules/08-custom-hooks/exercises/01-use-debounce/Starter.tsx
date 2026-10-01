/**
 * Exercise 08.1: useDebounce and useThrottle. See README.md.
 */
import { useEffect, useRef, useState } from "react";

// TODO A
function useDebounce<T>(value: T, delayMs: number): T {
  return value;
}

// TODO B
function useThrottle<T>(value: T, intervalMs: number): T {
  return value;
}

/** Counts how many times `value` changed identity. */
function useChangeCount(value: unknown) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount((c) => c + 1);
  }, [value]);
  return count;
}

type Point = { x: number; y: number };

export default function UseDebounceExercise() {
  const [pointer, setPointer] = useState<Point>({ x: 200, y: 120 });
  const throttled = useThrottle(pointer, 100);
  const debounced = useDebounce(pointer, 300);

  const rawCount = useChangeCount(pointer);
  const throttledCount = useChangeCount(throttled);
  const debouncedCount = useChangeCount(debounced);

  return (
    <div className="stack">
      <svg
        width={400}
        height={240}
        style={{ border: "1px solid var(--border)", borderRadius: 8, cursor: "crosshair" }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPointer({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
      >
        <circle cx={pointer.x} cy={pointer.y} r={6} fill="#2f6fdf" />
        <circle cx={throttled.x} cy={throttled.y} r={10} fill="none" stroke="#e0803a" strokeWidth={3} />
        <circle cx={debounced.x} cy={debounced.y} r={14} fill="none" stroke="#2c9a6a" strokeWidth={3} />
      </svg>
      <div className="row">
        <span>🔵 raw: {rawCount}</span>
        <span>🟠 throttled: {throttledCount}</span>
        <span>🟢 debounced: {debouncedCount}</span>
      </div>
    </div>
  );
}
