export type DiceLayoutMode = "column";

/** xl and up: visible · below xl: hidden */
export const DICE_LAYOUT_BREAKPOINTS = {
  show: 1280,
} as const;

export type DiceLayoutState = "hidden" | DiceLayoutMode;

export function getDiceLayoutMode(width: number): DiceLayoutState {
  if (width < DICE_LAYOUT_BREAKPOINTS.show) return "hidden";
  return "column";
}
