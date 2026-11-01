import { describe, expect, test } from "vitest";
import { conflicts, PEERS, type Difficulty, type Grid } from "./engine";
import { makePuzzle } from "./puzzle";

// An independent backtracking count, so the test doesn't lean on Bend.
function countSolutions(grid: Grid, limit = 2): number {
  const i = grid.indexOf(0);
  if (i === -1) return 1;
  let total = 0;
  for (let d = 1; d <= 9 && total < limit; d++) {
    if (PEERS[i].some((j) => grid[j] === d)) continue;
    grid[i] = d;
    total += countSolutions(grid, limit - total);
    grid[i] = 0;
  }
  return total;
}

const CLUES: Record<Difficulty, (n: number) => boolean> = {
  easy: (n) => n === 38,
  medium: (n) => n === 30,
  hard: (n) => n < 30,
};

describe("sudoku", () => {
  test.each(["easy", "medium", "hard"] as Difficulty[])("%s Bend puzzles have exactly one solution", (difficulty) => {
    for (let seed = 1; seed <= 20; seed++) {
      const { puzzle, solution } = makePuzzle(difficulty, seed);
      expect(solution.every((d, i) => d >= 1 && d <= 9 && PEERS[i].every((j) => solution[j] !== d))).toBe(true);
      expect(puzzle.every((d, i) => d === 0 || d === solution[i])).toBe(true);
      expect(countSolutions(puzzle.slice())).toBe(1);
      expect(CLUES[difficulty](puzzle.filter(Boolean).length)).toBe(true);
    }
  }, 60_000);

  test("the same seed gives the same puzzle", () => {
    expect(makePuzzle("medium", 7)).toEqual(makePuzzle("medium", 7));
  });

  test("conflicts flag every repeated digit in a row, column or box", () => {
    const grid = Array(81).fill(0);
    grid[0] = 5;
    grid[8] = 5;
    grid[40] = 3;
    expect([...conflicts(grid)].sort((a, b) => a - b)).toEqual([0, 8]);
    grid[10] = 5;
    expect(conflicts(grid).has(10)).toBe(true);
  });
});
