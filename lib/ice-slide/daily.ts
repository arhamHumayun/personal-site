import config from "../../puzzles/ice-slide/config.json";
import type { Dir, Puzzle } from "./engine";
import gen, { type List } from "./gen.mjs";

const DIRS = { Up: "U", Down: "D", Left: "L", Right: "R" } as const satisfies Record<string, Dir>;

function toArray<T>(list: List<T>): T[] {
  const out: T[] = [];
  for (let l = list; l.$ === "Con"; l = l.tail) out.push(l.head);
  return out;
}

export function dayNumber(date: string): number {
  return Math.round(Date.parse(date) / 86_400_000);
}

export function dailyPuzzle(date: string): { puzzle: Puzzle; solution: string } | null {
  const found = gen.day(config.min, config.max, config.seed, dayNumber(date));
  if (found.$ === "None") return null;
  const { seed, game } = found.value;
  return {
    puzzle: {
      date,
      seed,
      width: game.w,
      height: game.h,
      tiles: toArray(game.grid).map((row) => toArray(row).map((rock) => (rock ? "#" : ".")).join("")),
      start: [game.start.x, game.start.y],
      exit: [game.exit.x, game.exit.y],
      par: game.par,
    },
    solution: toArray(game.sol).map((d) => DIRS[d.$]).join(""),
  };
}
