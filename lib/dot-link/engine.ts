// Drawing lines on the board. The win itself is not decided here: isWon hands
// the lines to Dots.solved in puzzles/dot-link/dots.bend, the def the laws
// are proven about.

import gen, { type List } from "./gen.mjs";

export type Point = readonly [number, number];
export type Lines = Point[][];

export interface Puzzle {
  level: number;
  seed: number;
  size: number;
  pairs: (readonly [Point, Point])[];
}

// A line being drawn. base is every line as it was when the drag began; the
// lines the drag crosses are cut from it, and come back if the drag retreats.
export interface Drag {
  color: number;
  line: Point[];
  base: Lines;
}

export function samePoint(a: Point, b: Point): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function adjacent(a: Point, b: Point): boolean {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

export function inside(puzzle: Puzzle, [x, y]: Point): boolean {
  return x >= 0 && y >= 0 && x < puzzle.size && y < puzzle.size;
}

export function dotAt(puzzle: Puzzle, p: Point): number {
  return puzzle.pairs.findIndex(([a, b]) => samePoint(a, p) || samePoint(b, p));
}

export function emptyLines(puzzle: Puzzle): Lines {
  return puzzle.pairs.map(() => []);
}

// A line is complete once it has left one dot and reached the other.
export function complete(puzzle: Puzzle, color: number, line: readonly Point[]): boolean {
  return line.length > 1 && dotAt(puzzle, line[line.length - 1]) === color;
}

function owner(lines: Lines, p: Point): [color: number, index: number] | null {
  for (let c = 0; c < lines.length; c++) {
    const i = lines[c].findIndex((q) => samePoint(q, p));
    if (i >= 0) return [c, i];
  }
  return null;
}

// Pressing a dot starts its line afresh; pressing a line picks it up there.
export function begin(puzzle: Puzzle, lines: Lines, p: Point): Drag | null {
  const dot = dotAt(puzzle, p);
  const held = dot >= 0 ? ([dot, -1] as const) : owner(lines, p);
  if (!held) return null;
  const [color, i] = held;
  const line = i >= 0 ? lines[color].slice(0, i + 1) : [p];
  return { color, line, base: lines.map((l, c) => (c === color ? [] : l)) };
}

export function extend(puzzle: Puzzle, drag: Drag, p: Point): Drag {
  const { color, line } = drag;
  const last = line[line.length - 1];
  if (!inside(puzzle, p) || !adjacent(last, p)) return drag;
  const back = line.findIndex((q) => samePoint(q, p));
  if (back >= 0) return { ...drag, line: line.slice(0, back + 1) };
  if (complete(puzzle, color, line)) return drag;
  const dot = dotAt(puzzle, p);
  if (dot >= 0 && dot !== color) return drag;
  return { ...drag, line: [...line, p] };
}

// Steps the drag toward p one cell at a time, so a fast pointer that skips
// cells still draws through them. Stops where the line is blocked.
export function reach(puzzle: Puzzle, drag: Drag, p: Point): Drag {
  for (;;) {
    const [x, y] = drag.line[drag.line.length - 1];
    if (x === p[0] && y === p[1]) return drag;
    const next: Point =
      Math.abs(p[0] - x) >= Math.abs(p[1] - y) ? [x + Math.sign(p[0] - x), y] : [x, y + Math.sign(p[1] - y)];
    const moved = extend(puzzle, drag, next);
    if (moved === drag) return drag;
    drag = moved;
  }
}

export function linesOf(drag: Drag): Lines {
  return drag.base.map((l, c) => {
    if (c === drag.color) return drag.line;
    const cut = l.findIndex((q) => drag.line.some((p) => samePoint(p, q)));
    return cut < 0 ? l : l.slice(0, cut);
  });
}

// Replays saved lines through the drawing rules, so whatever comes back from
// storage is a board the player could have drawn.
export function restore(puzzle: Puzzle, saved: unknown): Lines {
  let lines = emptyLines(puzzle);
  if (!Array.isArray(saved) || saved.length !== puzzle.pairs.length) return lines;
  saved.forEach((line, color) => {
    if (!Array.isArray(line) || line.length === 0) return;
    const points = line.filter(
      (p): p is Point => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger),
    );
    if (points.length !== line.length || dotAt(puzzle, points[0]) !== color) return;
    let drag = begin(puzzle, lines, points[0])!;
    for (const p of points.slice(1)) drag = extend(puzzle, drag, p);
    lines = linesOf(drag);
  });
  return lines;
}

function list<T>(items: readonly T[]): List<T> {
  return items.reduceRight<List<T>>((tail, head) => ({ $: "Con", head, tail }), { $: "Nil" });
}

const pos = ([x, y]: Point) => ({ $: "Pos" as const, x, y });

export function isWon(puzzle: Puzzle, lines: Lines): boolean {
  const sol = lines.map((line, c) =>
    line.length > 0 && samePoint(line[0], puzzle.pairs[c][1]) ? [...line].reverse() : line,
  );
  return gen["dots:solved"](
    puzzle.size,
    puzzle.size,
    list(puzzle.pairs.map(([a, b]) => ({ $: "Dots" as const, a: pos(a), b: pos(b) }))),
    list(sol.map((line) => list(line.map(pos)))),
  );
}
