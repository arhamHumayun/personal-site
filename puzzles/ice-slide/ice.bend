import Base

# Rows of cells, True for rock. Anything off the grid is blocked too.
def Grid() -> Data:
  List<&2, List<&2, Bool>>

def Dists() -> Data:
  List<&2, List<&2, Nat>>

type Pos is Data:
  Pos{x: Nat, y: Nat}

type Dir is Data:
  Up{}
  Down{}
  Left{}
  Right{}

type Game is Data:
  Game{w: Nat, h: Nat, grid: Grid(), start: Pos, exit: Pos, par: Nat,
    sol: List<&2, Dir>, dists: Dists()}

type Puzzle is Data:
  Puzzle{seed: U32, game: Game}

def Puzzle.seed(p: Puzzle) -> U32:
  match p:
    case Puzzle{s, g}:
      s

def Puzzle.game(p: Puzzle) -> Game:
  match p:
    case Puzzle{s, g}:
      g

def Game.grid(g: Game) -> Grid():
  match g:
    case Game{w, h, grid, s, e, par, sol, ds}:
      grid

def Game.start(g: Game) -> Pos:
  match g:
    case Game{w, h, grid, s, e, par, sol, ds}:
      s

def Game.exit(g: Game) -> Pos:
  match g:
    case Game{w, h, grid, s, e, par, sol, ds}:
      e

def Game.par(g: Game) -> Nat:
  match g:
    case Game{w, h, grid, s, e, par, sol, ds}:
      par

def Game.sol(g: Game) -> List<&2, Dir>:
  match g:
    case Game{w, h, grid, s, e, par, sol, ds}:
      sol

def Game.dists(g: Game) -> Dists():
  match g:
    case Game{w, h, grid, s, e, par, sol, ds}:
      ds

# A slide never needs more steps than the board is wide plus tall.
def Game.fuel(g: Game) -> Nat:
  match g:
    case Game{w, h, grid, s, e, par, sol, ds}:
      Nat.add(w, h)

# Board
# -----

def cell(c: Maybe<&2, Bool>) -> Bool:
  match c:
    case None{}:
      True{}
    case Some{b}:
      b

def row(r: Maybe<&2, List<&2, Bool>>, x: Nat) -> Bool:
  match r:
    case None{}:
      True{}
    case Some{cells}:
      cell(List.get(&2, Bool, cells, x))

def blocked(+g: Grid(), p: Pos) -> Bool:
  match p:
    case Pos{x, y}:
      row(List.get(&2, List<&2, Bool>, g, y), x)

def hits(+g: Grid(), q: Maybe<&2, Pos>) -> Bool:
  match q:
    case None{}:
      True{}
    case Some{p}:
      blocked(g, p)

def next(d: Dir, p: Pos) -> Maybe<&2, Pos>:
  match d p:
    case Up{} Pos{x, 0n}:
      None{}
    case Up{} Pos{x, 1n+y}:
      Some{Pos{x, y}}
    case Down{} Pos{x, y}:
      Some{Pos{x, 1n+y}}
    case Left{} Pos{0n, y}:
      None{}
    case Left{} Pos{1n+x, y}:
      Some{Pos{x, y}}
    case Right{} Pos{x, y}:
      Some{Pos{1n+x, y}}

# Movement
# --------

# stop says whether q, the cell ahead, is blocked.
def slide.go(fuel: Nat, +g: Grid(), +d: Dir, p: Pos, stop: Bool,
  q: Maybe<&2, Pos>) -> Pos:
  match fuel:
    case 0n:
      p
    case 1n+f:
      match stop:
        case True{}:
          p
        case False{}:
          match q:
            case None{}:
              p
            case Some{+n}:
              slide.go(f, g, d, n, hits(g, next(d, n)), next(d, n))

def slide(+g: Grid(), +d: Dir, +p: Pos, fuel: Nat) -> Pos:
  slide.go(fuel, g, d, p, hits(g, next(d, p)), next(d, p))

def replay(ms: List<&2, Dir>, +g: Grid(), +fuel: Nat, p: Pos) -> Pos:
  match ms:
    case Nil{}:
      p
    case Con{d, rest}:
      replay(rest, g, fuel, slide(g, d, p, fuel))

def Pos.eq(a: Pos, b: Pos) -> Bool:
  match a b:
    case Pos{ax, ay} Pos{bx, by}:
      Bool.and(Nat.is_eq(ax, bx), Nat.is_eq(ay, by))

# Certificate
# -----------
# A distance map is consistent when no slide from a free cell lowers the
# distance by more than one. Along any route, then, the distance grows at
# most one per move, so no route reaches the exit in fewer than dist(exit).

def dist.row(r: Maybe<&2, List<&2, Nat>>, x: Nat) -> Nat:
  match r:
    case None{}:
      0n
    case Some{cells}:
      Maybe.default(&2, Nat, List.get(&2, Nat, cells, x), 0n)

def dist(+ds: Dists(), p: Pos) -> Nat:
  match p:
    case Pos{x, y}:
      dist.row(List.get(&2, List<&2, Nat>, ds, y), x)

def step_ok(+g: Grid(), +ds: Dists(), +fuel: Nat, +p: Pos, d: Dir) -> Bool:
  Nat.is_le(dist(ds, slide(g, d, p, fuel)), 1n+dist(ds, p))

def ok.rest2(+g: Grid(), +ds: Dists(), +fuel: Nat, +p: Pos) -> Bool:
  Bool.and(step_ok(g, ds, fuel, p, Left{}), step_ok(g, ds, fuel, p, Right{}))

def ok.rest1(+g: Grid(), +ds: Dists(), +fuel: Nat, +p: Pos) -> Bool:
  Bool.and(step_ok(g, ds, fuel, p, Down{}), ok.rest2(g, ds, fuel, p))

def ok(+g: Grid(), +ds: Dists(), +fuel: Nat, +p: Pos) -> Bool:
  Bool.and(step_ok(g, ds, fuel, p, Up{}), ok.rest1(g, ds, fuel, p))

def check.cell(rock: Bool, +g: Grid(), +ds: Dists(), +fuel: Nat, +p: Pos) -> Bool:
  match rock:
    case True{}:
      True{}
    case False{}:
      ok(g, ds, fuel, p)

def check.row(cells: List<&2, Bool>, +g: Grid(), +ds: Dists(), +fuel: Nat,
  +x: Nat, +y: Nat) -> Bool:
  match cells:
    case Nil{}:
      True{}
    case Con{c, cs}:
      Bool.and(check.cell(c, g, ds, fuel, Pos{x, y}),
        check.row(cs, g, ds, fuel, 1n+x, y))

def check.rows(rows: Grid(), +g: Grid(), +ds: Dists(), +fuel: Nat, +y: Nat) -> Bool:
  match rows:
    case Nil{}:
      True{}
    case Con{r, rs}:
      Bool.and(check.row(r, g, ds, fuel, 0n, y),
        check.rows(rs, g, ds, fuel, 1n+y))

def check(+g: Grid(), +ds: Dists(), +fuel: Nat) -> Bool:
  check.rows(g, g, ds, fuel, 0n)

def Game.valid(+gm: Game) -> Bool:
  +g = Game.grid(gm)
  +ds = Game.dists(gm)
  +fuel = Game.fuel(gm)
  +s = Game.start(gm)
  +par = Game.par(gm)
  +sol = Game.sol(gm)
  Bool.and(Bool.not(blocked(g, s)),
    Bool.and(Nat.is_eq(dist(ds, s), 0n),
      Bool.and(check(g, ds, fuel),
        Bool.and(Pos.eq(replay(sol, g, fuel, s), Game.exit(gm)),
          Bool.and(Nat.is_eq(List.length(&2, Dir, sol), par),
            Nat.is_le(par, dist(ds, Game.exit(gm))))))))
