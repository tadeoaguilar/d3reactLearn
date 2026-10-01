import { useLayoutEffect, useRef, useState } from "react";
import { defaultMargin, type Margin } from "../theme";

export interface ChartDimensions {
  width: number;
  height: number;
  margin: Margin;
  /** width minus left/right margins: the drawable area */
  innerWidth: number;
  /** height minus top/bottom margins: the drawable area */
  innerHeight: number;
}

/**
 * Measures a wrapper element and returns chart dimensions that follow the
 * D3 margin convention. It re-measures whenever the wrapper resizes.
 *
 * You build this hook yourself in Module 08 and Module 10. Later modules
 * import this finished copy.
 *
 *   const [ref, dims] = useChartDimensions({ height: 300 });
 *   return <div ref={ref}><svg width={dims.width} height={dims.height}>…</svg></div>;
 */
export function useChartDimensions<T extends HTMLElement = HTMLDivElement>(
  options: { height?: number; margin?: Partial<Margin>; aspectRatio?: number } = {},
) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  // useLayoutEffect measures before the browser paints, so the first frame
  // the user sees already has the right width.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const margin = { ...defaultMargin, ...options.margin };
  const height = options.aspectRatio ? Math.round(width / options.aspectRatio) : (options.height ?? 300);
  const dims: ChartDimensions = {
    width,
    height,
    margin,
    innerWidth: Math.max(0, width - margin.left - margin.right),
    innerHeight: Math.max(0, height - margin.top - margin.bottom),
  };
  return [ref, dims] as const;
}
