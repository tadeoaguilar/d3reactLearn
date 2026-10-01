/**
 * Exercise 05.1: reference solution.
 */
import { useEffect, useRef, useState } from "react";

function format(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
}

const CHART_H = 100;
const BAR_W = 18;

export default function Stopwatch() {
  // On-screen values → state
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Bookkeeping → refs
  const intervalRef = useRef<number | null>(null);
  const startRef = useRef(0); // performance.now() when the current run started
  const accumulatedRef = useRef(0); // ms from previous runs
  const lastLapAtRef = useRef(0); // elapsed time at the previous lap
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const now = () => accumulatedRef.current + (performance.now() - startRef.current);

  function start() {
    if (intervalRef.current !== null) return;
    startRef.current = performance.now();
    intervalRef.current = window.setInterval(() => setElapsed(now()), 30);
    setRunning(true);
  }

  function stop() {
    if (intervalRef.current === null) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    accumulatedRef.current = now();
    setElapsed(accumulatedRef.current);
    setRunning(false);
  }

  function reset() {
    stop();
    accumulatedRef.current = 0;
    lastLapAtRef.current = 0;
    setElapsed(0);
    setLaps([]);
    startButtonRef.current?.focus();
  }

  function lap() {
    if (intervalRef.current === null) return;
    const t = now();
    setLaps((ls) => [...ls, t - lastLapAtRef.current]);
    lastLapAtRef.current = t;
  }

  // Keyboard shortcuts. The handler calls start/stop/lap, which are new
  // functions every render. Keeping the latest handler in a ref lets the
  // effect subscribe ONCE and still see the current `running` value.
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandlerRef.current = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (running) stop();
        else start();
      } else if (e.key.toLowerCase() === "l") {
        lap();
      }
    };
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Unmount cleanup
  useEffect(
    () => () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    },
    [],
  );

  const fastest = laps.length > 1 ? Math.min(...laps) : null;
  const slowest = laps.length > 1 ? Math.max(...laps) : null;
  const maxLap = Math.max(1, ...laps);

  return (
    <div className="stack">
      <div style={{ fontSize: 44, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{format(elapsed)}</div>
      <div className="row">
        <button ref={startButtonRef} className="btn primary" onClick={running ? stop : start}>
          {running ? "Stop" : elapsed > 0 ? "Resume" : "Start"}
        </button>
        <button className="btn" onClick={lap} disabled={!running}>
          Lap
        </button>
        <button className="btn" onClick={reset}>
          Reset
        </button>
        <span className="muted">Space = start/stop · L = lap</span>
      </div>

      {laps.length > 0 && (
        <div className="row" style={{ alignItems: "flex-end" }}>
          <ol reversed style={{ margin: 0, fontVariantNumeric: "tabular-nums" }}>
            {laps
              .map((ms, i) => ({ ms, i }))
              .reverse()
              .map(({ ms, i }) => (
                <li
                  key={i}
                  style={{
                    color: ms === fastest ? "var(--ok)" : ms === slowest ? "var(--danger)" : undefined,
                  }}
                >
                  {format(ms)}
                </li>
              ))}
          </ol>
          <svg width={laps.length * (BAR_W + 4)} height={CHART_H} role="img" aria-label="Lap durations">
            {laps.map((ms, i) => {
              const h = (ms / maxLap) * CHART_H;
              const fill = ms === fastest ? "#2c8a4b" : ms === slowest ? "#c43d3d" : "#2f6fdf";
              return <rect key={i} x={i * (BAR_W + 4)} y={CHART_H - h} width={BAR_W} height={h} fill={fill} rx={2} />;
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
