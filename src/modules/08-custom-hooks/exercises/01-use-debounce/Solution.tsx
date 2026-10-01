/**
 * Exercise 08.1: reference solution.
 */
import { useEffect, useRef, useState } from "react";

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t); // every change cancels the previous timer
  }, [value, delayMs]);
  return debounced;
}

function useThrottle<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastRun = useRef(0);

  useEffect(() => {
    const elapsed = Date.now() - lastRun.current;
    if (elapsed >= intervalMs) {
      // Enough time has passed: update right away (leading edge)
      lastRun.current = Date.now();
      setThrottled(value);
      return;
    }
    // Otherwise schedule a trailing update so the last value isn't lost.
    const t = setTimeout(() => {
      lastRun.current = Date.now();
      setThrottled(value);
    }, intervalMs - elapsed);
    return () => clearTimeout(t);
  }, [value, intervalMs]);

  return throttled;
}

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
