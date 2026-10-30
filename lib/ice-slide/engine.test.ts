import { describe, expect, test } from "vitest";
import config from "../../puzzles/ice-slide/config.json";
import { dailyPuzzle } from "./daily";
import { isBlocked, localDate, replay, samePoint, slide, type Dir, type Point, type Puzzle } from "./engine";

const YEARS = 100;

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

function* days(from: string, count: number) {
  const d = new Date(`${from}T12:00:00`);
  for (let i = 0; i < count; i++, d.setDate(d.getDate() + 1)) yield localDate(d);
}

describe("ice slide", () => {
  test(`every day for ${YEARS} years replays the Bend solution in par moves`, () => {
    const failures: string[] = [];
    for (const date of days(config.epoch, Math.round(YEARS * 365.25))) {
      const daily = dailyPuzzle(date);
      if (!daily) {
        failures.push(`${date}: no puzzle`);
        continue;
      }
      const { puzzle, solution } = daily;
      const checks = {
        "start on ice": !isBlocked(puzzle.tiles, puzzle.start),
        "solution reaches exit": samePoint(replay(puzzle, solution), puzzle.exit),
        "solution is par long": solution.length === puzzle.par,
        "par is shortest": shortest(puzzle) === puzzle.par,
        "par in range": puzzle.par >= config.min && puzzle.par <= config.max,
      };
      for (const [name, ok] of Object.entries(checks)) if (!ok) failures.push(`${date}: ${name}`);
    }
    expect(failures).toEqual([]);
  }, 120_000);
});
