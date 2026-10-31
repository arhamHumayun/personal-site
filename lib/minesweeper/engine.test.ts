import { describe, expect, test } from "vitest";
import { chord, count, emptyBoard, flagsLeft, neighbors, reveal, toggleFlag, type Board } from "./engine";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function withMines(width: number, height: number, mines: number[]): Board {
  const board = emptyBoard(width, height, mines.length);
  for (const i of mines) board.mine[i] = true;
  return { ...board, status: "playing" };
}

describe("minesweeper", () => {
  test("the first click and its neighbours are never mines, and the count is exact", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const first = seed % (16 * 16);
      const board = reveal(emptyBoard(16, 16, 40), first, seeded(seed));
      expect(board.mine.filter(Boolean)).toHaveLength(40);
      expect([first, ...neighbors(board, first)].some((i) => board.mine[i])).toBe(false);
      expect(board.status).toBe("playing");
      expect(count(board, first)).toBe(0);
    }
  });

  test("opening a zero floods to the numbered edge and nothing past it", () => {
    // . . . . .
    // . . . . .
    // . . . . *
    const board = reveal(withMines(5, 3, [14]), 0);
    expect(board.open).toEqual([
      true, true, true, true, true,
      true, true, true, true, true,
      true, true, true, true, false,
    ]);
    expect(board.status).toBe("won");
  });

  test("hitting a mine loses and shows every mine", () => {
    const board = reveal(withMines(3, 3, [0, 8]), 0);
    expect(board.status).toBe("lost");
    expect(board.exploded).toBe(0);
    expect(board.open[8]).toBe(true);
  });

  test("chording opens the neighbours once the flags match the number", () => {
    // * 1 .
    // 1 1 .
    // . . .
    let board = withMines(3, 3, [0]);
    board = { ...board, open: board.open.map((_, i) => i === 4) };
    expect(chord(board, 4).open).toEqual(board.open);
    board = toggleFlag(board, 0);
    expect(flagsLeft(board)).toBe(0);
    const opened = chord(board, 4);
    expect(opened.status).toBe("won");
    expect(opened.open[0]).toBe(false);
  });

  test("a wrong flag makes chording hit the mine", () => {
    let board = withMines(3, 3, [0]);
    board = { ...board, open: board.open.map((_, i) => i === 4) };
    board = toggleFlag(board, 1);
    expect(chord(board, 4).status).toBe("lost");
  });

  test("flags block reveals and can't go on open cells", () => {
    let board = withMines(3, 1, [2]);
    board = toggleFlag(board, 0);
    expect(reveal(board, 0)).toBe(board);
    board = reveal(toggleFlag(board, 0), 0);
    expect(toggleFlag(board, 0)).toBe(board);
  });
});
