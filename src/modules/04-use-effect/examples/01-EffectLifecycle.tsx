/**
 * Example 04.01: when effects run, and when their cleanups run.
 *
 * Watch the log as you:
 *   - click "re-render parent" (changes unrelated state)
 *   - change A or B
 *   - unmount / remount the child
 * Note the StrictMode double-run (setup → cleanup → setup) on first mount.
 *
 * Implementation note: the log is written straight into a DOM node, NOT
 * into React state. If logging called setState, every log line would cause
 * a re-render, which would log again: an infinite loop.
 */
import { useEffect, useRef, useState } from "react";

// A tiny imperative logger: collects lines and writes them to a <div>.
const buffer: string[] = [];
let target: HTMLDivElement | null = null;
let scheduled = false;
function log(msg: string) {
  buffer.push(msg);
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    if (!target) return;
    target.textContent += buffer.splice(0).join("\n") + "\n─────\n";
    target.scrollTop = target.scrollHeight;
  }, 0);
}

function Child({ a, b }: { a: number; b: number }) {
  log(`render Child (a=${a}, b=${b})`);

  // 1. No dependency array: after EVERY render
  useEffect(() => {
    log("  effect[no deps] setup");
    return () => log("  effect[no deps] cleanup");
  });

  // 2. Empty array: on mount; cleanup on unmount
  useEffect(() => {
    log("  effect[] setup (mount)");
    return () => log("  effect[] cleanup (unmount)");
  }, []);

  // 3. Specific dependency: when `a` changes. Cleanup sees the OLD a.
  useEffect(() => {
    log(`  effect[a] setup, a=${a}`);
    return () => log(`  effect[a] cleanup, old a=${a}`);
  }, [a]);

  return (
    <div className="card">
      Child sees a={a}, b={b}
    </div>
  );
}

export default function EffectLifecycle() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  // Connect the logger to our <div> (an effect syncing with a non-React thing!)
  useEffect(() => {
    target = logRef.current;
    return () => {
      target = null;
    };
  }, []);

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => setA((x) => x + 1)}>
          A + 1
        </button>
        <button className="btn" onClick={() => setB((x) => x + 1)}>
          B + 1
        </button>
        <button className="btn" onClick={() => setTick((t) => t + 1)}>
          re-render parent ({tick})
        </button>
        <button className="btn" onClick={() => setMounted((m) => !m)}>
          {mounted ? "unmount child" : "mount child"}
        </button>
        <button className="btn" onClick={() => logRef.current && (logRef.current.textContent = "")}>
          clear log
        </button>
      </div>
      {mounted && <Child a={a} b={b} />}
      <div className="log" ref={logRef} style={{ maxHeight: 320 }} />
      <ul className="muted">
        <li>
          <strong>B + 1</strong>: the child re-renders. Only the no-deps effect re-runs.
        </li>
        <li>
          <strong>A + 1</strong>: the no-deps effect and the [a] effect re-run. Cleanup runs first, with the old
          value.
        </li>
        <li>
          <strong>re-render parent</strong>: the child re-renders too (parents re-render their children).
        </li>
        <li>
          <strong>unmount</strong>: every cleanup runs.
        </li>
      </ul>
    </div>
  );
}
