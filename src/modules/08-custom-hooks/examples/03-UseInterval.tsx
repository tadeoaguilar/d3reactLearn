/**
 * Example 08.03: useInterval and the "latest callback ref" pattern.
 *
 * The naive version (a setInterval in an effect with [] deps) closes over
 * the FIRST render's `speed`, so changing the speed has no effect. The
 * useInterval version always calls the newest callback.
 */
import { useEffect, useRef, useState } from "react";

export function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback);

  // After every render, remember the latest callback.
  useEffect(() => {
    saved.current = callback;
  });

  // Set up the interval. Only re-subscribes when the delay changes.
  useEffect(() => {
    if (delay === null) return; // paused
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function NaiveTicker({ speed }: { speed: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    // ❌ `speed` is frozen at its first value (stale closure)
    const id = setInterval(() => setValue((v) => (v + speed) % 100), 50);
    return () => clearInterval(id);
    // A linter (react-hooks/exhaustive-deps) would warn: missing dependency 'speed'
  }, []);
  return <Progress label="❌ naive setInterval" value={value} />;
}

function HookTicker({ speed, running }: { speed: number; running: boolean }) {
  const [value, setValue] = useState(0);
  useInterval(() => setValue((v) => (v + speed) % 100), running ? 50 : null);
  return <Progress label="✅ useInterval" value={value} />;
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="muted">{label}</div>
      <svg width={300} height={16}>
        <rect width={300} height={16} rx={8} fill="var(--surface-2)" />
        <rect width={value * 3} height={16} rx={8} fill="#7b5cd6" />
      </svg>
    </div>
  );
}

/** Bonus: a live sparkline that shows why this hook matters for streaming charts. */
function LiveSparkline({ running }: { running: boolean }) {
  const [points, setPoints] = useState<number[]>(() => Array.from({ length: 60 }, () => 50));
  useInterval(() => {
    setPoints((ps) => [...ps.slice(1), Math.max(5, Math.min(95, ps[ps.length - 1] + (Math.random() - 0.5) * 20))]);
  }, running ? 200 : null);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"}${i * 5},${100 - v}`).join("");
  return (
    <svg width={300} height={100} style={{ border: "1px solid var(--border)", borderRadius: 6 }}>
      <path d={path} fill="none" stroke="#2f6fdf" strokeWidth={2} />
    </svg>
  );
}

export default function UseIntervalExample() {
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  return (
    <div className="stack">
      <div className="row">
        <label>
          Speed: {speed}{" "}
          <input type="range" min={1} max={5} value={speed} onChange={(e) => setSpeed(e.target.valueAsNumber)} />
        </label>
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Resume"}
        </button>
      </div>
      <NaiveTicker speed={speed} />
      <HookTicker speed={speed} running={running} />
      <LiveSparkline running={running} />
    </div>
  );
}
