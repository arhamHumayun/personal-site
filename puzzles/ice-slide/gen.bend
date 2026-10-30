import Base
import ./ice.bend as Ice

# Randomness
# ----------
# Counter-based: every draw is a hash of the seed and a slot, so nothing
# threads generator state and the same seed always draws the same numbers.

def mix(+x: U32) -> U32:
  +a = ((x .^. (x >> 16n)) * 2146121005 : U32)
  +b = ((a .^. (a >> 15n)) * 2221713035 : U32)
  (b .^. (b >> 16n) : U32)

def draw(+s: U32, slot: U32) -> U32:
  mix((s .^. mix(slot) : U32))

def below(+s: U32, slot: U32, n: U32) -> Nat:
  U32.to_nat((draw(s, slot) % n : U32))

def cell_slot(+base: U32, +x: Nat, +y: Nat) -> U32:
  (base + U32.from_nat(Nat.add(Nat.mul(y, 16n), x)) : U32)

# Board
# -----

def rock(+s: U32, +dens: Nat, +x: Nat, +y: Nat, +start: Ice.Pos) -> Bool:
  Bool.and(Bool.not(Ice.Pos.eq(Ice.Pos{x, y}, start)),
    Nat.is_lt(below(s, cell_slot(64, x, y), 100), dens))

def board.row(n: Nat, +s: U32, +dens: Nat, +x: Nat, +y: Nat, +start: Ice.Pos) ->
  List<&2, Bool>:
  match n:
    case 0n:
      Nil{}
    case 1n+k:
      rock(s, dens, x, y, start) <> board.row(k, s, dens, 1n+x, y, start)

def board(n: Nat, +s: U32, +dens: Nat, +w: Nat, +y: Nat, +start: Ice.Pos) -> Ice.Grid():
  match n:
    case 0n:
      Nil{}
    case 1n+k:
      board.row(w, s, dens, 0n, y, start) <> board(k, s, dens, w, 1n+y, start)

# Search
# ------
# Level-synchronous BFS from the start. Each level slides the whole frontier
# in the four directions at once, as four parallel calls. The solver is not
# trusted: Ice.Game.valid re-checks what it finds before a puzzle is kept.

def inf() -> Nat:
  255n

type Seen is Data:
  Seen{pos: Ice.Pos, path: List<&2, Ice.Dir>}

type Bfs is Data:
  Bfs{dists: Ice.Dists(), front: List<&2, Seen>, seen: List<&2, Seen>}

def dset.row(ds: Ice.Dists(), y: Nat, +x: Nat, +v: Nat) -> Ice.Dists():
  match ds y:
    case Nil{} _:
      Nil{}
    case Con{r, rs} 0n:
      List.set(&2, Nat, r, x, v) <> rs
    case Con{r, rs} 1n+k:
      r <> dset.row(rs, k, x, v)

def dset(ds: Ice.Dists(), p: Ice.Pos, +v: Nat) -> Ice.Dists():
  match p:
    case Ice.Pos{x, y}:
      dset.row(ds, y, x, v)

def expand(front: List<&2, Seen>, +g: Ice.Grid(), +d: Ice.Dir, +fuel: Nat) ->
  List<&2, Seen>:
  match front:
    case Nil{}:
      Nil{}
    case Con{Seen{+p, path}, rest}:
      Seen{Ice.slide(g, d, p, fuel), d <> path} <> expand(rest, g, d, fuel)

def visit.if(fresh: Bool, +p: Ice.Pos, +path: List<&2, Ice.Dir>, +k: Nat, ds: Ice.Dists(),
  front: List<&2, Seen>, seen: List<&2, Seen>) -> Bfs:
  match fresh:
    case False{}:
      Bfs{ds, front, seen}
    case True{}:
      Bfs{dset(ds, p, k), Seen{p, path} <> front, Seen{p, path} <> seen}

def visit(c: Seen, +k: Nat, st: Bfs) -> Bfs:
  match c st:
    case Seen{+p, path} Bfs{+ds, front, seen}:
      visit.if(Nat.is_eq(Ice.dist(ds, p), inf()), p, path, k, ds, front, seen)

def absorb(cands: List<&2, Seen>, +k: Nat, st: Bfs) -> Bfs:
  match cands:
    case Nil{}:
      st
    case Con{c, cs}:
      absorb(cs, k, visit(c, k, st))

def bfs(levels: Nat, +g: Ice.Grid(), +fuel: Nat, +k: Nat, st: Bfs) -> Bfs:
  match levels:
    case 0n:
      st
    case 1n+l:
      match st:
        case Bfs{ds, +front, seen}:
          u d e r = expand(front, g, Ice.Up{}, fuel) expand(front, g, Ice.Down{}, fuel)
            expand(front, g, Ice.Left{}, fuel) expand(front, g, Ice.Right{}, fuel)
          +cands = List.append(&2, Seen, u,
            List.append(&2, Seen, d, List.append(&2, Seen, e, r)))
          bfs(l, g, fuel, 1n+k, absorb(cands, 1n+k, Bfs{ds, Nil{}, seen}))

# The exit is the farthest stop from the start, ties broken by the seed.
def tie(+s: U32, p: Ice.Pos) -> U32:
  match p:
    case Ice.Pos{+x, +y}:
      draw(s, cell_slot(4096, x, y))

def farther(+s: U32, a: Seen, b: Seen) -> Bool:
  match a b:
    case Seen{ap, +apath} Seen{bp, +bpath}:
      +la = List.length(&2, Ice.Dir, apath)
      +lb = List.length(&2, Ice.Dir, bpath)
      Bool.or(Nat.is_gt(la, lb),
        Bool.and(Nat.is_eq(la, lb), U32.is_gt(tie(s, ap), tie(s, bp))))

def pick.if(better: Bool, c: Seen, cur: Seen) -> Seen:
  match better:
    case True{}:
      c
    case False{}:
      cur

def pick(seen: List<&2, Seen>, +s: U32, +cur: Seen) -> Seen:
  match seen:
    case Nil{}:
      cur
    case Con{+c, rest}:
      pick(rest, s, pick.if(farther(s, c, cur), c, cur))

# Puzzle
# ------

def game.fin(w: Nat, h: Nat, g: Ice.Grid(), start: Ice.Pos, ds: Ice.Dists(), exit: Seen) ->
  Ice.Game:
  match exit:
    case Seen{e, +path}:
      Ice.Game{w, h, g, start, e, List.length(&2, Ice.Dir, path),
        List.reverse(&2, Ice.Dir, path), ds}

def game.bfs(+s: U32, w: Nat, h: Nat, g: Ice.Grid(), +start: Ice.Pos, st: Bfs) -> Ice.Game:
  match st:
    case Bfs{ds, front, seen}:
      game.fin(w, h, g, start, ds, pick(seen, s, Seen{start, Nil{}}))

def game(+s: U32) -> Ice.Game:
  +w = Nat.add(8n, below(s, 1, 5))
  +h = Nat.add(8n, below(s, 2, 5))
  +dens = Nat.add(12n, below(s, 3, 10))
  +start = {Ice.Pos{below(s, 4, U32.from_nat(w)), below(s, 5, U32.from_nat(h))} : Ice.Pos}
  +g = board(h, s, dens, w, 0n, start)
  +ds = dset(List.replicate(List<&2, Nat>, h, List.replicate(Nat, w, inf())), start, 0n)
  +seen = {[Seen{start, Nil{}}] : List<&2, Seen>}
  game.bfs(s, w, h, g, start,
    bfs(Nat.mul(w, h), g, Nat.add(w, h), 0n, Bfs{ds, seen, seen}))

def puzzle(+s: U32) -> Ice.Puzzle:
  Ice.Puzzle{s, game(s)}

def accept(+lo: Nat, +hi: Nat, +p: Ice.Puzzle) -> Bool:
  +par = Ice.Game.par(Ice.Puzzle.game(p))
  Bool.and(Bool.and(Nat.is_le(lo, par), Nat.is_le(par, hi)),
    Ice.Game.valid(Ice.Puzzle.game(p)))

def keep.if(p: Ice.Puzzle, ok: Bool) -> Maybe<&2, Ice.Puzzle>:
  match ok:
    case True{}:
      Some{p}
    case False{}:
      None{}

def keep(+lo: Nat, +hi: Nat, +p: Ice.Puzzle) -> Maybe<&2, Ice.Puzzle>:
  keep.if(p, accept(lo, hi, p))

# Days
# ----
# Day i is days since 1970-01-01. The site calls day() from the JS build.

def seed(+base: U32, +i: Nat, +a: U32) -> U32:
  mix((mix((base .^. U32.from_nat(i) : U32)) + a * 2654435769 : U32))

def tries(k: Nat, +lo: Nat, +hi: Nat, +base: U32, +i: Nat, +a: U32,
  m: Maybe<&2, Ice.Puzzle>) -> Maybe<&2, Ice.Puzzle>:
  match k:
    case 0n:
      m
    case 1n+f:
      match m:
        case Some{p}:
          Some{p}
        case None{}:
          tries(f, lo, hi, base, i, (a + 1 : U32), keep(lo, hi, puzzle(seed(base, i, a))))

def day(+lo: Nat, +hi: Nat, +base: U32, +i: Nat) -> Maybe<&2, Ice.Puzzle>:
  tries(200n, lo, hi, base, i, 0, None{})
