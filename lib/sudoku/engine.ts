export type Grid = number[];
export type Difficulty = "easy" | "medium" | "hard";

export const ROW = (i: number) => Math.floor(i / 9);
export const COL = (i: number) => i % 9;
export const BOX = (i: number) => Math.floor(ROW(i) / 3) * 3 + Math.floor(COL(i) / 3);

export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) =>
  Array.from({ length: 81 }, (_, j) => j).filter(
    (j) => j !== i && (ROW(j) === ROW(i) || COL(j) === COL(i) || BOX(j) === BOX(i)),
  ),
);

export function conflicts(grid: Grid): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < 81; i++) {
    if (grid[i] && PEERS[i].some((j) => grid[j] === grid[i])) out.add(i);
  }
  return out;
}
