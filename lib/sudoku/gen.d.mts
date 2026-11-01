// Types for gen.mjs, the JS build of puzzles/sudoku/gen.bend.

type List<T> = { $: "Nil" } | { $: "Con"; head: T; tail: List<T> };
type Game = { $: "Game"; puzzle: List<number>; solution: List<number> };

declare const gen: {
  game(clues: number, seed: number): Game;
  keep(game: Game): { $: "None" } | { $: "Some"; value: Game };
};

export default gen;
