import type { Dir, Puzzle } from "./engine";
import gen, { type List } from "./gen.mjs";

const SEED = 20261030;
const DIRS = { Up: "U", Down: "D", Left: "L", Right: "R" } as const satisfies Record<string, Dir>;

// Max par climbs by one every five levels and tops out at 15 from level 56.
export function parRange(level: number): [min: number, max: number] {
  const max = Math.min(4 + Math.floor((level - 1) / 5), 15);
  return [max - 2, max];
}

function toArray<T>(list: List<T>): T[] {
  const out: T[] = [];
  for (let l = list; l.$ === "Con"; l = l.tail) out.push(l.head);
  return out;
}

export function levelPuzzle(level: number): { puzzle: Puzzle; solution: string } | null {
  const [min, max] = parRange(level);
  const found = gen.level(min, max, SEED, level);
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
