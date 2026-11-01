import Base

# A grid is its 81 cells in row-major order, 0 for an empty cell.
def Grid() -> Data:
  List<&2, Nat>

def cell(c: Maybe<&2, Nat>) -> Nat:
  match c:
    case None{}:
      0n
    case Some{v}:
      v

def at(g: Grid(), i: Nat) -> Nat:
  cell(List.get(&2, Nat, g, i))

def digits() -> List<&2, Nat>:
  [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n]

# The nine rows, nine columns and nine boxes, as cell indices.
def units() -> List<&2, List<&2, Nat>>:
  [ [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n],
    [9n, 10n, 11n, 12n, 13n, 14n, 15n, 16n, 17n],
    [18n, 19n, 20n, 21n, 22n, 23n, 24n, 25n, 26n],
    [27n, 28n, 29n, 30n, 31n, 32n, 33n, 34n, 35n],
    [36n, 37n, 38n, 39n, 40n, 41n, 42n, 43n, 44n],
    [45n, 46n, 47n, 48n, 49n, 50n, 51n, 52n, 53n],
    [54n, 55n, 56n, 57n, 58n, 59n, 60n, 61n, 62n],
    [63n, 64n, 65n, 66n, 67n, 68n, 69n, 70n, 71n],
    [72n, 73n, 74n, 75n, 76n, 77n, 78n, 79n, 80n],
    [0n, 9n, 18n, 27n, 36n, 45n, 54n, 63n, 72n],
    [1n, 10n, 19n, 28n, 37n, 46n, 55n, 64n, 73n],
    [2n, 11n, 20n, 29n, 38n, 47n, 56n, 65n, 74n],
    [3n, 12n, 21n, 30n, 39n, 48n, 57n, 66n, 75n],
    [4n, 13n, 22n, 31n, 40n, 49n, 58n, 67n, 76n],
    [5n, 14n, 23n, 32n, 41n, 50n, 59n, 68n, 77n],
    [6n, 15n, 24n, 33n, 42n, 51n, 60n, 69n, 78n],
    [7n, 16n, 25n, 34n, 43n, 52n, 61n, 70n, 79n],
    [8n, 17n, 26n, 35n, 44n, 53n, 62n, 71n, 80n],
    [0n, 1n, 2n, 9n, 10n, 11n, 18n, 19n, 20n],
    [3n, 4n, 5n, 12n, 13n, 14n, 21n, 22n, 23n],
    [6n, 7n, 8n, 15n, 16n, 17n, 24n, 25n, 26n],
    [27n, 28n, 29n, 36n, 37n, 38n, 45n, 46n, 47n],
    [30n, 31n, 32n, 39n, 40n, 41n, 48n, 49n, 50n],
    [33n, 34n, 35n, 42n, 43n, 44n, 51n, 52n, 53n],
    [54n, 55n, 56n, 63n, 64n, 65n, 72n, 73n, 74n],
    [57n, 58n, 59n, 66n, 67n, 68n, 75n, 76n, 77n],
    [60n, 61n, 62n, 69n, 70n, 71n, 78n, 79n, 80n]
  ]

def mem(+x: Nat, xs: List<&2, Nat>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{y, rest}:
      Bool.or(Nat.is_eq(y, x), mem(x, rest))

# Solutions
# ---------
# A solved grid has 81 cells, and every row, column and box holds only
# digits, never one twice, and every digit somewhere.

def values(+g: Grid(), u: List<&2, Nat>) -> List<&2, Nat>:
  match u:
    case Nil{}:
      Nil{}
    case Con{j, rest}:
      at(g, j) <> values(g, rest)

def in_range(vs: List<&2, Nat>) -> Bool:
  match vs:
    case Nil{}:
      True{}
    case Con{v, rest}:
      Bool.and(mem(v, digits()), in_range(rest))

def distinct.row(vs: List<&2, Nat>, +a: Nat, +p: Nat, +q: Nat) -> Bool:
  match vs:
    case Nil{}:
      True{}
    case Con{b, rest}:
      Bool.and(Bool.or(Nat.is_eq(p, q), Bool.not(Nat.is_eq(a, b))), distinct.row(rest, a, p, 1n+q))

def distinct.go(vs: List<&2, Nat>, +all: List<&2, Nat>, +p: Nat) -> Bool:
  match vs:
    case Nil{}:
      True{}
    case Con{a, rest}:
      Bool.and(distinct.row(all, a, p, 0n), distinct.go(rest, all, 1n+p))

def distinct(+vs: List<&2, Nat>) -> Bool:
  distinct.go(vs, vs, 0n)

def covers(+vs: List<&2, Nat>, ds: List<&2, Nat>) -> Bool:
  match ds:
    case Nil{}:
      True{}
    case Con{d, rest}:
      Bool.and(mem(d, vs), covers(vs, rest))

def unit_ok(+vs: List<&2, Nat>) -> Bool:
  Bool.and(in_range(vs), Bool.and(distinct(vs), covers(vs, digits())))

def all_units(+g: Grid(), us: List<&2, List<&2, Nat>>) -> Bool:
  match us:
    case Nil{}:
      True{}
    case Con{u, rest}:
      Bool.and(unit_ok(values(g, u)), all_units(g, rest))

def solved(+g: Grid()) -> Bool:
  Bool.and(Nat.is_eq(List.length(&2, Nat, g), 81n), all_units(g, units()))

# g fills in every clue of p: wherever p has a digit, g has the same one.
def agrees(g: Grid(), p: Grid()) -> Bool:
  match g p:
    case Nil{} Nil{}:
      True{}
    case Con{+x, gs} Con{+y, ps}:
      Bool.and(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), agrees(gs, ps))
    case _ _:
      False{}

def full(g: Grid()) -> Bool:
  match g:
    case Nil{}:
      True{}
    case Con{v, rest}:
      Bool.and(Bool.not(Nat.is_eq(v, 0n)), full(rest))

def same(a: Grid(), b: Grid()) -> Bool:
  match a b:
    case Nil{} Nil{}:
      True{}
    case Con{x, xs} Con{y, ys}:
      Bool.and(Nat.is_eq(x, y), same(xs, ys))
    case _ _:
      False{}

# Certificate
# -----------
# A solve that only ever places forced digits. Each step names why its
# digit is the only one possible, so any solution must agree with it.

# Unit u holds cell x at position px and, at position pk, a cell that
# already shows e: so x can't be e.
type Wit is Data:
  Wit{u: Nat, px: Nat, pk: Nat}

# Why a cell of a unit can't take the hidden digit.
type Excl is Data:
  Itself{}
  Filled{}
  Peer{wit: Wit}

type Step is Data:
  Naked{i: Nat, d: Nat, home: Nat, hp: Nat, wits: List<&2, Wit>}
  Hidden{i: Nat, d: Nat, u: Nat, pi: Nat, excl: List<&2, Excl>}

def is_at(m: Maybe<&2, Nat>, +x: Nat) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{y}:
      Nat.is_eq(y, x)

def wit.on(m: Maybe<&2, List<&2, Nat>>, +p: Grid(), +x: Nat, +e: Nat, +px: Nat, +pk: Nat) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+unit}:
      Bool.and(is_at(List.get(&2, Nat, unit, px), x),
        Bool.and(Bool.not(Nat.is_eq(px, pk)), is_at(List.get(&2, Nat, values(p, unit), pk), e)))

def wit.ok(w: Wit, +p: Grid(), +x: Nat, +e: Nat) -> Bool:
  match w:
    case Wit{u, px, pk}:
      wit.on(List.get(&2, List<&2, Nat>, units(), u), p, x, e, px, pk)

# A naked single: every other digit already shows in one of i's units.
def naked.wits(ds: List<&2, Nat>, ws: List<&2, Wit>, +p: Grid(), +i: Nat, +d: Nat) -> Bool:
  match ds ws:
    case Nil{} Nil{}:
      True{}
    case Con{+e, drest} Con{w, wrest}:
      Bool.and(Bool.or(Nat.is_eq(e, d), wit.ok(w, p, i, e)), naked.wits(drest, wrest, p, i, d))
    case _ _:
      False{}

def naked.on(m: Maybe<&2, List<&2, Nat>>, +p: Grid(), +i: Nat, +d: Nat, +hp: Nat,
  wits: List<&2, Wit>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{unit}:
      Bool.and(is_at(List.get(&2, Nat, unit, hp), i), naked.wits(digits(), wits, p, i, d))

# A hidden single: every other cell of a unit is ruled out for d.
def excl.ok(x: Excl, +p: Grid(), +q: Nat, +pi: Nat, +j: Nat, +d: Nat) -> Bool:
  match x:
    case Itself{}:
      Nat.is_eq(q, pi)
    case Filled{}:
      Bool.and(Bool.not(Nat.is_eq(at(p, j), 0n)), Bool.not(Nat.is_eq(at(p, j), d)))
    case Peer{w}:
      wit.ok(w, p, j, d)

def hidden.cells(cells: List<&2, Nat>, xs: List<&2, Excl>, +p: Grid(), +pi: Nat, +d: Nat,
  +q: Nat) -> Bool:
  match cells xs:
    case Nil{} Nil{}:
      True{}
    case Con{j, cs} Con{x, rest}:
      Bool.and(excl.ok(x, p, q, pi, j, d), hidden.cells(cs, rest, p, pi, d, 1n+q))
    case _ _:
      False{}

def hidden.on(m: Maybe<&2, List<&2, Nat>>, +p: Grid(), +i: Nat, +d: Nat, +pi: Nat,
  excl: List<&2, Excl>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+unit}:
      Bool.and(is_at(List.get(&2, Nat, unit, pi), i), hidden.cells(unit, excl, p, pi, d, 0n))

def step.ok(s: Step, +p: Grid()) -> Bool:
  match s:
    case Naked{+i, +d, home, hp, wits}:
      Bool.and(mem(d, digits()), naked.on(List.get(&2, List<&2, Nat>, units(), home), p, i, d, hp, wits))
    case Hidden{+i, +d, u, pi, excl}:
      Bool.and(mem(d, digits()), hidden.on(List.get(&2, List<&2, Nat>, units(), u), p, i, d, pi, excl))

def step.cell(s: Step) -> Nat:
  match s:
    case Naked{i, d, home, hp, wits}:
      i
    case Hidden{i, d, u, pi, excl}:
      i

def step.digit(s: Step) -> Nat:
  match s:
    case Naked{i, d, home, hp, wits}:
      d
    case Hidden{i, d, u, pi, excl}:
      d

def place(p: Grid(), +s: Step) -> Grid():
  List.set(&2, Nat, p, step.cell(s), step.digit(s))

# Replays the steps from p; None as soon as one doesn't hold.
def replay(steps: List<&2, Step>, ok: Bool, +p: Grid()) -> Maybe<&2, Grid()>:
  match steps:
    case Nil{}:
      match ok:
        case True{}:
          Some{p}
        case False{}:
          None{}
    case Con{+s, rest}:
      match ok:
        case True{}:
          replay(rest, step.ok(s, p), place(p, s))
        case False{}:
          None{}

def reaches(m: Maybe<&2, Grid()>, +s: Grid()) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{f}:
      same(f, s)

# Games
# -----

type Game is Data:
  Game{puzzle: Grid(), solution: Grid(), steps: List<&2, Step>}

def Game.puzzle(g: Game) -> Grid():
  match g:
    case Game{p, s, steps}:
      p

def Game.solution(g: Game) -> Grid():
  match g:
    case Game{p, s, steps}:
      s

def Game.valid(g: Game) -> Bool:
  match g:
    case Game{+p, +s, steps}:
      Bool.and(solved(s), Bool.and(full(s), Bool.and(agrees(s, p),
        reaches(replay(steps, True{}, p), s))))
