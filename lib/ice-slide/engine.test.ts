import { describe, expect, test } from "vitest";
import { isBlocked, replay, samePoint, slide, type Dir, type Point, type Puzzle } from "./engine";
import { levelPuzzle, parRange } from "./levels";

const LEVELS = 10_000;

function shortest(puzzle: Puzzle): number {
  const key = ([x, y]: Point) => y * puzzle.width + x;
  const seen = new Set([key(puzzle.start)]);
  let frontier: Point[] = [puzzle.start];
  for (let depth = 0; frontier.length > 0; depth++) {
    if (frontier.some((p) => samePoint(p, puzzle.exit))) return depth;
    frontier = frontier.flatMap((p) =>
      (["U", "D", "L", "R"] as Dir[])
        .map((d) => slide(puzzle, p, d))
        .filter((q) => !seen.has(key(q)) && seen.add(key(q))),
    );
  }
  return Infinity;
}

describe("ice slide", () => {
  test(`levels 1–${LEVELS} replay the Bend solution in par moves`, () => {
    const failures: string[] = [];
    for (let level = 1; level <= LEVELS; level++) {
      const found = levelPuzzle(level);
      if (!found) {
        failures.push(`level ${level}: no puzzle`);
        continue;
      }
      const { puzzle, solution } = found;
      const [min, max] = parRange(level);
      const checks = {
        "start on ice": !isBlocked(puzzle.tiles, puzzle.start),
        "solution reaches exit": samePoint(replay(puzzle, solution), puzzle.exit),
        "solution is par long": solution.length === puzzle.par,
        "par is shortest": shortest(puzzle) === puzzle.par,
        "par in range": puzzle.par >= min && puzzle.par <= max,
      };
      for (const [name, ok] of Object.entries(checks)) if (!ok) failures.push(`level ${level}: ${name}`);
    }
    expect(failures).toEqual([]);
  }, 120_000);
});
