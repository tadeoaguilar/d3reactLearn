/**
 * Example 02.02: state is a snapshot, and functional updates.
 */
import { useState } from "react";

export default function StateIsASnapshot() {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) => setLog((l) => [line, ...l].slice(0, 8));

  function plusThreeWrong() {
    // All three read the same `count` from this render's snapshot.
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    addLog(`wrong: count was ${count}, three times "count + 1" → ${count + 1}`);
  }

  function plusThreeRight() {
    // Each updater gets the latest queued value.
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    addLog(`right: count was ${count}, three updaters → ${count + 3}`);
  }

  function delayedAlert() {
    // The closure keeps the value from the render in which you clicked.
    setTimeout(() => addLog(`timeout fired: count captured at click time = ${count}`), 2000);
  }

  return (
    <div className="stack">
      <div style={{ fontSize: 32, fontWeight: 700 }}>{count}</div>
      <div className="row">
        <button className="btn" onClick={plusThreeWrong}>
          +3 (wrong way)
        </button>
        <button className="btn primary" onClick={plusThreeRight}>
          +3 (functional updates)
        </button>
        <button className="btn" onClick={delayedAlert}>
          log count in 2s (then click +3 quickly)
        </button>
        <button className="btn" onClick={() => setCount(0)}>
          reset
        </button>
      </div>
      <div className="log">{log.join("\n") || "Click a button…"}</div>
    </div>
  );
}
