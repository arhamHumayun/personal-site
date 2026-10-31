import gen from "./gen.mjs";

export function layout(width: number, height: number, mines: number, first: number, seed: number): boolean[] {
  const found = gen.board(width, height, mines, first, seed >>> 0);
  if (found.$ === "None") throw new Error(`no ${width}×${height} board fits ${mines} mines`);
  const cells: boolean[] = [];
  for (let l = found.value; l.$ === "Con"; l = l.tail) cells.push(l.head);
  return cells;
}
