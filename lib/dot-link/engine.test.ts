import { describe, expect, test } from "vitest";
import {
  begin,
  dotAt,
  emptyLines,
  extend,
  isWon,
  linesOf,
  reach,
  restore,
  type Drag,
  type Lines,
  type Point,
  type Puzzle,
} from "./engine";
import gen from "./gen.mjs";
import { levelPuzzle } from "./levels";

const LEVELS = 1000;

function draw(puzzle: Puzzle, lines: Lines, path: Point[]): Lines {
  let drag = begin(puzzle, lines, path[0])!;
  for (const p of path.slice(1)) drag = extend(puzzle, drag, p);
  return linesOf(drag);
}

// R . R
// B . .
// . . B
const tiny: Puzzle = {
  level: 0,
  seed: 0,
  size: 3,
  pairs: [
    [[0, 0], [2, 0]],
    [[0, 1], [2, 2]],
  ],
};
const red: Point[] = [[0, 0], [1, 0], [2, 0]];
const blue: Point[] = [[0, 1], [0, 2], [1, 2], [1, 1], [2, 1], [2, 2]];

describe("dot link", () => {
  test(`levels 1–${LEVELS} are won by drawing the Bend solution`, () => {
    const failures: string[] = [];
    for (let level = 1; level <= LEVELS; level++) {
      const found = levelPuzzle(level);
      if (!found) {
        failures.push(`level ${level}: no puzzle`);
        continue;
      }
      const { puzzle, solution } = found;
      const n = puzzle.size;
      const lines = solution.reduce((lines, line) => draw(puzzle, lines, line), emptyLines(puzzle));
      const covered = new Set(lines.flat().map(([x, y]) => y * n + x));
      const dots = new Set(puzzle.pairs.flat().map(([x, y]) => y * n + x));
      const checks = {
        "size for level": n === gen.size(level),
        "colors in range": puzzle.pairs.length >= gen.min_pairs(level) && puzzle.pairs.length <= gen.max_pairs(level),
        "dots distinct": dots.size === puzzle.pairs.length * 2,
        "drawing keeps every line": lines.every((line, c) => line.length === solution[c].length),
        "board full": covered.size === n * n,
        "won": isWon(puzzle, lines),
      };
      for (const [name, ok] of Object.entries(checks)) if (!ok) failures.push(`level ${level}: ${name}`);
    }
    expect(failures).toEqual([]);
  }, 120_000);

  test("won only when every pair is joined and the board is full", () => {
    const full = draw(tiny, draw(tiny, emptyLines(tiny), red), blue);
    expect(isWon(tiny, full)).toBe(true);

    const gaps = draw(tiny, draw(tiny, emptyLines(tiny), red), [[0, 1], [0, 2], [1, 2], [2, 2]]);
    expect(gaps[1]).toHaveLength(4);
    expect(isWon(tiny, gaps)).toBe(false);

    const open = draw(tiny, emptyLines(tiny), blue);
    expect(isWon(tiny, open)).toBe(false);

    expect(isWon(tiny, emptyLines(tiny))).toBe(false);
  });

  test("a line drawn from either dot wins", () => {
    const lines = draw(tiny, draw(tiny, emptyLines(tiny), [...red].reverse()), [...blue].reverse());
    expect(isWon(tiny, lines)).toBe(true);
  });

  test("lines stop at other colors' dots and once they reach their own", () => {
    let drag = begin(tiny, emptyLines(tiny), [0, 0])!;
    expect(extend(tiny, drag, [0, 1])).toBe(drag);
    drag = reach(tiny, drag, [2, 0]);
    expect(drag.line).toEqual(red);
    expect(extend(tiny, drag, [2, 1])).toBe(drag);
    expect(extend(tiny, drag, [1, 0]).line).toEqual(red.slice(0, 2));
  });

  test("crossing a line cuts it, and backing off restores it", () => {
    const lines = draw(tiny, emptyLines(tiny), blue);
    let drag: Drag = begin(tiny, lines, [0, 0])!;
    drag = extend(tiny, drag, [1, 0]);
    drag = extend(tiny, drag, [1, 1]);
    expect(linesOf(drag)[1]).toEqual(blue.slice(0, 3));
    drag = extend(tiny, drag, [1, 0]);
    expect(linesOf(drag)[1]).toEqual(blue);
  });

  test("pressing a line picks it up where it was pressed", () => {
    const lines = draw(tiny, emptyLines(tiny), blue);
    const drag = begin(tiny, lines, [1, 2])!;
    expect(drag.color).toBe(1);
    expect(drag.line).toEqual(blue.slice(0, 3));
    expect(begin(tiny, lines, [1, 0])).toBeNull();
    expect(dotAt(tiny, [2, 2])).toBe(1);
  });

  test("restore replays saved lines and drops anything undrawable", () => {
    const lines = draw(tiny, draw(tiny, emptyLines(tiny), red), blue);
    expect(restore(tiny, JSON.parse(JSON.stringify(lines)))).toEqual(lines);
    expect(restore(tiny, "junk")).toEqual(emptyLines(tiny));
    expect(restore(tiny, [[[1, 1], [1, 0]], []])).toEqual(emptyLines(tiny));
    expect(restore(tiny, [[[0, 0], [2, 2]], []])).toEqual([[[0, 0]], []]);
  });
});
