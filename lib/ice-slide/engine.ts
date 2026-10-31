// Mirrors puzzles/ice-slide/ice.bend. engine.test.ts replays every Bend
// solution through this file, so the two rule sets can't drift apart.

export type Dir = "U" | "D" | "L" | "R";
export type Point = readonly [number, number];

export interface Puzzle {
  level: number;
  seed: number;
  width: number;
  height: number;
  tiles: string[];
  start: Point;
  exit: Point;
  par: number;
}

const STEP: Record<Dir, Point> = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

export function isBlocked(tiles: string[], [x, y]: Point): boolean {
  const row = tiles[y];
  return x < 0 || y < 0 || row === undefined || x >= row.length || row[x] === "#";
}

export function slide(puzzle: Puzzle, from: Point, dir: Dir): Point {
  const [dx, dy] = STEP[dir];
  let p = from;
  for (let fuel = puzzle.width + puzzle.height; fuel > 0; fuel--) {
    const q: Point = [p[0] + dx, p[1] + dy];
    if (isBlocked(puzzle.tiles, q)) break;
    p = q;
  }
  return p;
}

export function replay(puzzle: Puzzle, moves: string): Point {
  return [...moves].reduce<Point>((p, d) => slide(puzzle, p, d as Dir), puzzle.start);
}

export function samePoint(a: Point, b: Point): boolean {
  return a[0] === b[0] && a[1] === b[1];
}
