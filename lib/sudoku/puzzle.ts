import type { Difficulty, Grid } from "./engine";
import gen from "./gen.mjs";

const CLUES: Record<Difficulty, number> = { easy: 38, medium: 30, hard: 0 };

function toArray(list: { $: string; head?: number; tail?: unknown }): number[] {
  const out: number[] = [];
  for (let l = list; l.$ === "Con"; l = l.tail as typeof l) out.push(l.head!);
  return out;
}

export function makePuzzle(difficulty: Difficulty, seed: number): { puzzle: Grid; solution: Grid } {
  const found = gen.keep(gen.game(CLUES[difficulty], seed >>> 0));
  if (found.$ === "None") throw new Error(`no ${difficulty} sudoku for seed ${seed}`);
  return { puzzle: toArray(found.value.puzzle), solution: toArray(found.value.solution) };
}
