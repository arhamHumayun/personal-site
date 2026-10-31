export type Grid = number[];
export type Difficulty = "easy" | "medium" | "hard";

const ALL = 0x3fe;

export const ROW = (i: number) => Math.floor(i / 9);
export const COL = (i: number) => i % 9;
export const BOX = (i: number) => Math.floor(ROW(i) / 3) * 3 + Math.floor(COL(i) / 3);

export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) =>
  Array.from({ length: 81 }, (_, j) => j).filter(
    (j) => j !== i && (ROW(j) === ROW(i) || COL(j) === COL(i) || BOX(j) === BOX(i)),
  ),
);

const UNITS: number[][] = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, b) =>
    Array.from({ length: 9 }, (_, k) => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)),
  ),
];

function candidates(grid: Grid, i: number): number {
  let used = 0;
  for (const j of PEERS[i]) used |= 1 << grid[j];
  return ALL & ~used;
}

function bits(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << d)) out.push(d);
  return out;
}

function shuffle<T>(xs: T[], random: () => number): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

// Backtracking on the cell with the fewest candidates; stops after `limit` solutions.
export function countSolutions(grid: Grid, limit = 2, random?: () => number, found: Grid[] = []): number {
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (grid[i]) continue;
    const mask = candidates(grid, i);
    const n = bits(mask).length;
    if (n === 0) return 0;
    if (n < bestCount) [best, bestMask, bestCount] = [i, mask, n];
  }
  if (best === -1) {
    found.push(grid.slice());
    return 1;
  }
  let total = 0;
  const digits = random ? shuffle(bits(bestMask), random) : bits(bestMask);
  for (const d of digits) {
    grid[best] = d;
    total += countSolutions(grid, limit - total, random, found);
    grid[best] = 0;
    if (total >= limit) break;
  }
  return total;
}

export function solve(grid: Grid): Grid | null {
  const found: Grid[] = [];
  return countSolutions(grid.slice(), 1, undefined, found) ? found[0] : null;
}

// Naked and hidden singles only: what a player can do without guessing.
export function solvableBySingles(puzzle: Grid): boolean {
  const grid = puzzle.slice();
  for (let progress = true; progress; ) {
    progress = false;
    for (let i = 0; i < 81; i++) {
      if (grid[i]) continue;
      const only = bits(candidates(grid, i));
      if (only.length === 1) [grid[i], progress] = [only[0], true];
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        if (unit.some((i) => grid[i] === d)) continue;
        const spots = unit.filter((i) => !grid[i] && candidates(grid, i) & (1 << d));
        if (spots.length === 1) [grid[spots[0]], progress] = [d, true];
      }
    }
  }
  return grid.every(Boolean);
}

const GIVENS: Record<Difficulty, number> = { easy: 38, medium: 30, hard: 0 };

export function generate(difficulty: Difficulty, random: () => number = Math.random): { puzzle: Grid; solution: Grid } {
  const solution: Grid[] = [];
  countSolutions(Array(81).fill(0), 1, random, solution);
  const puzzle = solution[0].slice();
  let givens = 81;
  for (const i of shuffle(Array.from({ length: 81 }, (_, i) => i), random)) {
    if (givens <= GIVENS[difficulty]) break;
    const d = puzzle[i];
    puzzle[i] = 0;
    const unique = countSolutions(puzzle.slice()) === 1;
    if (unique && (difficulty === "hard" || solvableBySingles(puzzle))) givens--;
    else puzzle[i] = d;
  }
  return { puzzle, solution: solution[0] };
}

export function conflicts(grid: Grid): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < 81; i++) {
    if (grid[i] && PEERS[i].some((j) => grid[j] === grid[i])) out.add(i);
  }
  return out;
}
