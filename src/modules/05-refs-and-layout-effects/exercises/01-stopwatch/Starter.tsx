/**
 * Exercise 05.1: Stopwatch with lap chart. See README.md.
 */
import { useEffect, useRef, useState } from "react";

function format(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
}

export default function Stopwatch() {
  // TODO: state for elapsed (ms), running (boolean), laps (number[])
  // TODO: refs for intervalId, startTime, accumulated, lastLapAt, startButton

  // TODO: start(), stop(), reset(), lap()

  // TODO: keyboard shortcuts effect (Space / L)

  // TODO: clear the interval on unmount

  const elapsed = 0;

  return (
    <div className="stack">
      <div style={{ fontSize: 44, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{format(elapsed)}</div>
      <div className="row">
        <button className="btn primary">Start</button>
        <button className="btn">Lap</button>
        <button className="btn">Reset</button>
      </div>
      {/* TODO: lap list with fastest/slowest highlight */}
      {/* TODO: SVG lap chart */}
    </div>
  );
}
