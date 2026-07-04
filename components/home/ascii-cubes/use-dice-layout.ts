export type DiceLayoutMode = "column" | "grid";

/** xl: 1 column · 2xl: 2×3 grid · below xl: hidden */
export const DICE_LAYOUT_BREAKPOINTS = {
  show: 1280,
  grid: 1536,
} as const;

export type DiceLayoutState = "hidden" | DiceLayoutMode;

export function getDiceLayoutMode(width: number): DiceLayoutState {
  if (width < DICE_LAYOUT_BREAKPOINTS.show) return "hidden";
  if (width < DICE_LAYOUT_BREAKPOINTS.grid) return "column";
  return "grid";
}
