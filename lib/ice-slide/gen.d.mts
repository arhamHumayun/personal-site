// Types for gen.mjs, the JS build of puzzles/ice-slide/gen.bend.

type List<T> = { $: "Nil" } | { $: "Con"; head: T; tail: List<T> };
type Pos = { $: "Pos"; x: number; y: number };
type Dir = { $: "Up" | "Down" | "Left" | "Right" };

export type BendPuzzle = {
  $: "Puzzle";
  seed: number;
  game: {
    $: "Game";
    w: number;
    h: number;
    grid: List<List<boolean>>;
    start: Pos;
    exit: Pos;
    par: number;
    sol: List<Dir>;
  };
};

export type { List };

declare const gen: {
  level(lo: number, hi: number, base: number, level: number): { $: "None" } | { $: "Some"; value: BendPuzzle };
};

export default gen;
