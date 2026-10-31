export type Status = "ready" | "playing" | "won" | "lost";

export interface Board {
  width: number;
  height: number;
  mines: number;
  mine: boolean[];
  open: boolean[];
  flag: boolean[];
  status: Status;
  exploded: number | null;
}

export function emptyBoard(width: number, height: number, mines: number): Board {
  const n = width * height;
  return {
    width,
    height,
    mines,
    mine: Array(n).fill(false),
    open: Array(n).fill(false),
    flag: Array(n).fill(false),
    status: "ready",
    exploded: null,
  };
}

export function neighbors(board: Pick<Board, "width" | "height">, i: number): number[] {
  const x = i % board.width;
  const y = Math.floor(i / board.width);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < board.width && ny < board.height) out.push(ny * board.width + nx);
    }
  }
  return out;
}

export function count(board: Board, i: number): number {
  return neighbors(board, i).filter((j) => board.mine[j]).length;
}

// The first click and its neighbours are always clear, so it opens an area.
function layMines(board: Board, first: number, random: () => number): boolean[] {
  const keep = new Set([first, ...neighbors(board, first)]);
  const spots = board.mine.map((_, i) => i).filter((i) => !keep.has(i));
  const pool = spots.length >= board.mines ? spots : board.mine.map((_, i) => i).filter((i) => i !== first);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const mine = Array(board.mine.length).fill(false);
  for (const i of pool.slice(0, board.mines)) mine[i] = true;
  return mine;
}

function settle(board: Board): Board {
  if (board.status !== "playing") return board;
  const cleared = board.open.every((open, i) => open || board.mine[i]);
  return cleared ? { ...board, status: "won", flag: board.mine.slice() } : board;
}

function openFrom(board: Board, start: number[]): Board {
  const open = board.open.slice();
  const stack = start.filter((i) => !board.flag[i] && !open[i]);
  let hit: number | null = null;
  while (stack.length) {
    const i = stack.pop()!;
    if (open[i] || board.flag[i]) continue;
    open[i] = true;
    if (board.mine[i]) hit ??= i;
    else if (count(board, i) === 0) stack.push(...neighbors(board, i));
  }
  if (hit !== null) return { ...board, open: board.mine.map((m, i) => m || open[i]), status: "lost", exploded: hit };
  return settle({ ...board, open });
}

export function reveal(board: Board, i: number, random: () => number = Math.random): Board {
  if (board.status === "won" || board.status === "lost" || board.flag[i]) return board;
  if (board.status === "ready") board = { ...board, mine: layMines(board, i, random), status: "playing" };
  if (board.open[i]) return chord(board, i);
  return openFrom(board, [i]);
}

export function chord(board: Board, i: number): Board {
  if (board.status !== "playing" || !board.open[i]) return board;
  const around = neighbors(board, i);
  const flags = around.filter((j) => board.flag[j]).length;
  if (flags !== count(board, i)) return board;
  return openFrom(board, around);
}

export function toggleFlag(board: Board, i: number): Board {
  if (board.status !== "playing" || board.open[i]) return board;
  const flag = board.flag.slice();
  flag[i] = !flag[i];
  return { ...board, flag };
}

export function flagsLeft(board: Board): number {
  return board.mines - board.flag.filter(Boolean).length;
}
