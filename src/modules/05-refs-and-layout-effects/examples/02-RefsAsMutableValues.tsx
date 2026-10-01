/**
 * Example 05.02: refs as "instance variables" that don't cause renders.
 */
import { useEffect, useRef, useState } from "react";

/** Keeps the value from the previous render. */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value; // runs AFTER render, so during render ref still holds the old value
  }, [value]);
  // Reading a ref during render is normally discouraged, but this is the
  // well-known usePrevious pattern and fine for learning.
  return ref.current;
}

export default function RefsAsMutableValues() {
  const [count, setCount] = useState(0);
  const previous = usePrevious(count);

  // Ref vs state side by side
  const clickRef = useRef(0);
  const [clickState, setClickState] = useState(0);

  // The interval ID lives in a ref: we need it later, but never show it.
  // `running` IS shown (it disables buttons), so it is state.
  const intervalRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState(0);

  const start = () => {
    if (intervalRef.current !== null) return;
    intervalRef.current = window.setInterval(() => setTicks((t) => t + 1), 200);
    setRunning(true);
  };
  const stop = () => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  };
  // Always clean up on unmount.
  useEffect(() => stop, []);

  return (
    <div className="stack">
      <div className="card">
        <strong>usePrevious</strong>
        <div className="row">
          <button className="btn" onClick={() => setCount((c) => c + 1)}>
            +1
          </button>
          <button className="btn" onClick={() => setCount((c) => c - 1)}>
            −1
          </button>
          <span>
            now: <strong>{count}</strong>, previous: <strong>{previous ?? "—"}</strong>
          </span>
        </div>
      </div>

      <div className="card">
        <strong>Ref vs state</strong>
        <div className="row">
          <button className="btn" onClick={() => (clickRef.current += 1)}>
            ref += 1
          </button>
          <button className="btn" onClick={() => setClickState((c) => c + 1)}>
            state += 1
          </button>
        </div>
        <p>
          {/* Reading a ref in render on purpose, to show that it is stale */}
          ref: {clickRef.current} · state: {clickState}
          <br />
          <span className="muted">
            Clicking "ref" changes the value but doesn't re-render. Click "state" and the ref's real value shows up.
          </span>
        </p>
      </div>

      <div className="card">
        <strong>Interval ID in a ref</strong>
        <div className="row">
          <button className="btn" onClick={start} disabled={running}>
            Start
          </button>
          <button className="btn" onClick={stop} disabled={!running}>
            Stop
          </button>
          <span>ticks: {ticks}</span>
        </div>
      </div>
    </div>
  );
}
