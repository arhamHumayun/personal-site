// Mirrors puzzles/ice-slide/ice.bend. engine.test.ts replays every Bend
// solution through this file, so the two rule sets can't drift apart.

import config from "../../puzzles/ice-slide/config.json";

export const ICE_SLIDE_EPOCH = config.epoch;

export type Dir = "U" | "D" | "L" | "R";
export type Point = readonly [number, number];

export interface Puzzle {
  date: string;
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

export function puzzleNumber(date: string): number {
  return Math.round((Date.parse(date) - Date.parse(ICE_SLIDE_EPOCH)) / 86_400_000) + 1;
}

export function localDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function previousDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return localDate(d);
}
