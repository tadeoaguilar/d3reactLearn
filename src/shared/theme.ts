/**
 * Categorical palette for charts. These are plain hex values (not CSS
 * variables) so they also work for <canvas>, which can't read CSS.
 */
export const palette = ["#2f6fdf", "#e0803a", "#2c9a6a", "#c2477f", "#7b5cd6", "#a08a2b"] as const;

export const colors = {
  primary: palette[0],
  secondary: palette[1],
  positive: "#2c8a4b",
  negative: "#c43d3d",
  grid: "#e7e6e1",
  axis: "#8a8a84",
} as const;

/** The standard D3 "margin convention" object. */
export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const defaultMargin: Margin = { top: 20, right: 20, bottom: 40, left: 50 };
