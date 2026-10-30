import { describe, expect, test } from "vitest";
import puzzles from "../../public/data/ice-slide.json";
import solutions from "../../puzzles/ice-slide/solutions.json";
import { isBlocked, replay, samePoint, slide, type Dir, type Point, type Puzzle } from "./engine";

const all = puzzles as unknown as Puzzle[];

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
  test("solutions line up with puzzles", () => {
    expect(solutions.length).toBe(all.length);
    solutions.forEach((s, i) => {
      expect(s.date).toBe(all[i].date);
      expect(s.seed).toBe(all[i].seed);
    });
  });

  test.each(all.map((p, i) => [p.date, p, solutions[i].solution] as const))(
    "%s: the Bend solution reaches the exit in par moves",
    (_, puzzle, solution) => {
      expect(isBlocked(puzzle.tiles, puzzle.start)).toBe(false);
      expect(replay(puzzle, solution)).toEqual(puzzle.exit);
      expect(solution.length).toBe(puzzle.par);
      expect(shortest(puzzle)).toBe(puzzle.par);
    },
  );
});
