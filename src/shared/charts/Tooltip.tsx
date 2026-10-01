/**
 * An HTML tooltip placed over a chart. Put it in the chart's relatively
 * positioned wrapper (ChartFrame's `overlay`, or any `position: relative` div).
 * It flips to the left/top when it would overflow the container.
 * Built in Module 12.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface TooltipProps {
  /** position in px, relative to the wrapper */
  x: number;
  y: number;
  containerWidth: number;
  containerHeight?: number;
  children: ReactNode;
}

export function Tooltip({ x, y, containerWidth, containerHeight = Infinity, children }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Measure before paint so the flip never flickers (see Module 05).
  useLayoutEffect(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
  });

  const offset = 12;
  const left = x + offset + size.w > containerWidth ? x - offset - size.w : x + offset;
  const top = y + offset + size.h > containerHeight ? y - offset - size.h : y + offset;

  return (
    <div ref={ref} className="tooltip" style={{ left, top }} role="tooltip">
      {children}
    </div>
  );
}
