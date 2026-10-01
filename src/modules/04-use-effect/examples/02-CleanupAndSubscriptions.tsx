/**
 * Example 04.02: effects that subscribe to things, and their cleanups.
 *
 * Toggle "include cleanup" off and then unmount/remount a few times.
 * The broken version leaks intervals and listeners (watch the counters).
 */
import { useEffect, useState } from "react";

// Global counters so we can SEE leaks.
let activeIntervals = 0;
let activeListeners = 0;

function Clock({ withCleanup }: { withCleanup: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    activeIntervals++;
    const id = setInterval(() => setNow(new Date()), 1000);
    if (!withCleanup) return; // ❌ leak: the interval keeps running forever
    return () => {
      clearInterval(id);
      activeIntervals--;
    };
  }, [withCleanup]);

  return <div style={{ fontSize: 28, fontVariantNumeric: "tabular-nums" }}>{now.toLocaleTimeString()}</div>;
}

function MouseTracker({ withCleanup }: { withCleanup: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // The handler must be the SAME function reference in add and remove.
    function onMove(e: PointerEvent) {
      setPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener("pointermove", onMove);
    activeListeners++;
    if (!withCleanup) return;
    return () => {
      window.removeEventListener("pointermove", onMove);
      activeListeners--;
    };
  }, [withCleanup]);

  return (
    <div>
      Pointer: {pos.x}, {pos.y}
    </div>
  );
}

function DocumentTitle({ count }: { count: number }) {
  // Syncing with a browser API: the tab title follows the state.
  useEffect(() => {
    const previous = document.title;
    document.title = `(${count}) clicks`;
    return () => {
      document.title = previous; // restore on unmount
    };
  }, [count]);
  return null; // components don't have to render anything
}

export default function CleanupAndSubscriptions() {
  const [mounted, setMounted] = useState(true);
  const [withCleanup, setWithCleanup] = useState(true);
  const [clicks, setClicks] = useState(0);
  const [, forceRender] = useState(0);

  // Refresh the leak counters twice a second.
  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => setMounted((m) => !m)}>
          {mounted ? "Unmount" : "Mount"} widgets
        </button>
        <label>
          <input type="checkbox" checked={withCleanup} onChange={(e) => setWithCleanup(e.target.checked)} /> include
          cleanup
        </label>
        <button className="btn" onClick={() => setClicks((c) => c + 1)}>
          Click me (see the tab title)
        </button>
      </div>

      {mounted && (
        <div className="card">
          <Clock withCleanup={withCleanup} />
          <MouseTracker withCleanup={withCleanup} />
          <DocumentTitle count={clicks} />
        </div>
      )}

      <div className="card">
        Active intervals: <strong style={{ color: activeIntervals > 1 ? "var(--danger)" : undefined }}>{activeIntervals}</strong>
        {" · "}
        Active pointer listeners:{" "}
        <strong style={{ color: activeListeners > 1 ? "var(--danger)" : undefined }}>{activeListeners}</strong>
        <div className="muted" style={{ fontSize: 13 }}>
          With cleanup, these stay at 1 (or 0 when unmounted). Without it, they grow with every remount. That's a
          memory leak.
        </div>
      </div>
    </div>
  );
}
