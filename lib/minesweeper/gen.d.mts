// Types for gen.mjs, the JS build of puzzles/minesweeper/gen.bend.

type List<T> = { $: "Nil" } | { $: "Con"; head: T; tail: List<T> };

declare const gen: {
  board(
    width: number,
    height: number,
    mines: number,
    first: number,
    seed: number,
  ): { $: "None" } | { $: "Some"; value: List<boolean> };
};

export default gen;
