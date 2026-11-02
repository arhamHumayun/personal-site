import type { Dir, Puzzle } from "./engine";
import gen, { type List } from "./gen.mjs";

const SEED = 20261030;
const DIRS = { Up: "U", Down: "D", Left: "L", Right: "R" } as const satisfies Record<string, Dir>;

function toArray<T>(list: List<T>): T[] {
  const out: T[] = [];
  for (let l = list; l.$ === "Con"; l = l.tail) out.push(l.head);
  return out;
}

export function levelPuzzle(level: number): { puzzle: Puzzle; solution: string } | null {
  const found = gen.level(SEED, level);
  if (found.$ === "None") return null;
  const { seed, game } = found.value;
  return {
    puzzle: {
      level,
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
