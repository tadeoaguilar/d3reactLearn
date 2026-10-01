/**
 * Exercise 04.1: reference solution.
 */
import { useEffect, useState } from "react";

function WindowSize() {
  // Lazy initializer: the function runs only on the first render.
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Derived, not state
  const label = size.width < 640 ? "mobile" : size.width < 1024 ? "tablet" : "desktop";

  return (
    <div className="card">
      <div>
        {size.width} × {size.height} — <strong>{label}</strong>
      </div>
      <svg width={size.width / 10} height={20} style={{ display: "block", marginTop: 8 }}>
        <rect width={size.width / 10} height={20} fill="#2f6fdf" rx={3} />
      </svg>
    </div>
  );
}

function TitleUpdater() {
  const [title, setTitle] = useState("");

  // Save the original title once (on mount), and restore it on unmount.
  useEffect(() => {
    const original = document.title;
    return () => {
      document.title = original;
    };
  }, []);

  // Keep the title in sync with the input.
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  return (
    <label className="card row">
      Tab title:
      <input type="text" value={title} placeholder="type a title" onChange={(e) => setTitle(e.target.value)} />
    </label>
  );
}

function IdleDetector({ timeoutMs = 3000 }: { timeoutMs?: number }) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), timeoutMs);

    function onActivity() {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), timeoutMs);
    }

    window.addEventListener("pointermove", onActivity);
    window.addEventListener("keydown", onActivity);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [timeoutMs]);

  return <div className="card">{idle ? "💤 Idle" : "👋 Active"}</div>;
}

export default function WindowSizeAndTitle() {
  const [show, setShow] = useState(true);
  return (
    <div className="stack">
      <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setShow((s) => !s)}>
        {show ? "Unmount" : "Mount"} widgets
      </button>
      {show && (
        <>
          <WindowSize />
          <TitleUpdater />
          <IdleDetector />
        </>
      )}
    </div>
  );
}
