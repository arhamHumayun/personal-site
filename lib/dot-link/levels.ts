import type { Lines, Point, Puzzle } from "./engine";
import gen, { type List, type Pos } from "./gen.mjs";

const SEED = 20261102;

function toArray<T>(list: List<T>): T[] {
  const out: T[] = [];
  for (let l = list; l.$ === "Con"; l = l.tail) out.push(l.head);
  return out;
}

const point = ({ x, y }: Pos): Point => [x, y];

const cache = new Map<number, { puzzle: Puzzle; solution: Lines } | null>();

export function levelPuzzle(level: number): { puzzle: Puzzle; solution: Lines } | null {
  if (cache.has(level)) return cache.get(level)!;
  const found = gen.level(SEED, level);
  const result =
    found.$ === "None"
      ? null
      : {
          puzzle: {
            level,
            seed: found.value.seed,
            size: found.value.game.w,
            pairs: toArray(found.value.game.pairs).map(({ a, b }) => [point(a), point(b)] as const),
          },
          solution: toArray(found.value.game.sol).map((line) => toArray(line).map(point)),
        };
  cache.set(level, result);
  return result;
}
