// Types for gen.mjs, the JS build of puzzles/dot-link/gen.bend.

type List<T> = { $: "Nil" } | { $: "Con"; head: T; tail: List<T> };
type Pos = { $: "Pos"; x: number; y: number };
type Dots = { $: "Dots"; a: Pos; b: Pos };

export type BendPuzzle = {
  $: "Puzzle";
  seed: number;
  game: {
    $: "Game";
    w: number;
    h: number;
    pairs: List<Dots>;
    sol: List<List<Pos>>;
  };
};

export type { Dots, List, Pos };

declare const gen: {
  size(level: number): number;
  min_pairs(level: number): number;
  max_pairs(level: number): number;
  level(base: number, level: number): { $: "None" } | { $: "Some"; value: BendPuzzle };
  "dots:solved"(w: number, h: number, pairs: List<Dots>, sol: List<List<Pos>>): boolean;
  "dots:thin"(sol: List<List<Pos>>): boolean;
};

export default gen;
