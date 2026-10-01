/**
 * Exercise 04.1: Window size & document title. See README.md.
 */
import { useEffect, useState } from "react";

function WindowSize() {
  // TODO A: state initialized lazily with the current window size
  // TODO A: effect that listens to "resize" and cleans up
  // TODO A: derived breakpoint label + SVG rectangle
  return <div className="todo-hint">Window size goes here</div>;
}

function TitleUpdater() {
  // TODO B: input whose value becomes document.title; restore on unmount
  return <div className="todo-hint">Title updater goes here</div>;
}

function IdleDetector() {
  // TODO C: "Active" / "Idle" after 3s of no pointermove / keydown
  return <div className="todo-hint">Idle detector goes here</div>;
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
