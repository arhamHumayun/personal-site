import { describe, expect, test } from "vitest";
import { conflicts, countSolutions, generate, PEERS, solvableBySingles, solve, type Difficulty } from "./engine";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function isValidSolution(grid: number[]) {
  return grid.every((d, i) => d >= 1 && d <= 9 && PEERS[i].every((j) => grid[j] !== d));
}

describe("sudoku", () => {
  test.each(["easy", "medium", "hard"] as Difficulty[])("%s puzzles have exactly one solution", (difficulty) => {
    for (let seed = 1; seed <= 15; seed++) {
      const { puzzle, solution } = generate(difficulty, seeded(seed));
      expect(isValidSolution(solution)).toBe(true);
      expect(puzzle.every((d, i) => d === 0 || d === solution[i])).toBe(true);
      expect(countSolutions(puzzle.slice())).toBe(1);
      expect(solve(puzzle)).toEqual(solution);
      if (difficulty !== "hard") expect(solvableBySingles(puzzle)).toBe(true);
    }
  });

  test("difficulty sets how many clues are left", () => {
    const givens = (d: Difficulty) => generate(d, seeded(7)).puzzle.filter(Boolean).length;
    expect(givens("easy")).toBe(38);
    expect(givens("medium")).toBe(30);
    expect(givens("hard")).toBeLessThan(30);
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
