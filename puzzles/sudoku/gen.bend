import Base
import ./sudoku.bend as S

# Nothing here is trusted: keep() hands out a game only when S.Game.valid
# accepts it, and LAWS.bend proves what that guarantees.

def mix(+x: U32) -> U32:
  +a = ((x .^. (x >> 16n)) * 2146121005 : U32)
  +b = ((a .^. (a >> 15n)) * 2221713035 : U32)
  (b .^. (b >> 16n) : U32)

# The seed goes in first, so the proof checker never grinds through mix
# on constant inputs bit by bit.
def hash(+seed: U32, +a: Nat, +b: Nat) -> U32:
  mix((seed .^. U32.from_nat(Nat.add(Nat.mul(a, 16n), b)) : U32))

type Rank is Data:
  Rank{rank: U32, value: Nat}

def rank_le(a: Rank, b: Rank) -> Bool:
  match a b:
    case Rank{ra, va} Rank{rb, vb}:
      U32.is_le(ra, rb)

def ranked(xs: List<&2, Nat>, +seed: U32, +slot: Nat) -> List<&2, Rank>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+x, rest}:
      Rank{hash(seed, slot, x), x} <> ranked(rest, seed, slot)

def unranked(rs: List<&2, Rank>) -> List<&2, Nat>:
  match rs:
    case Nil{}:
      Nil{}
    case Con{Rank{r, v}, rest}:
      v <> unranked(rest)

def shuffle(xs: List<&2, Nat>, +seed: U32, +slot: Nat) -> List<&2, Nat>:
  unranked(List.sort(~Rank, ~rank_le, ranked(xs, seed, slot)))

# Geometry
# --------

def row(+i: Nat) -> Nat:
  Nat.div(i, 9n)

def col(+i: Nat) -> Nat:
  Nat.mod(i, 9n)

def box(+i: Nat) -> Nat:
  Nat.add(Nat.mul(Nat.div(row(i), 3n), 3n), Nat.div(col(i), 3n))

def unit(+u: Nat) -> List<&2, Nat>:
  Maybe.default(&2, List<&2, Nat>, List.get(&2, List<&2, Nat>, S.units(), u), Nil{})

def homes(+i: Nat) -> List<&2, Nat>:
  [row(i), Nat.add(9n, col(i)), Nat.add(18n, box(i))]

def index_of(xs: List<&2, Nat>, +x: Nat, +k: Nat) -> Nat:
  match xs:
    case Nil{}:
      0n
    case Con{y, rest}:
      Bool.pick(Nat, Nat.is_eq(y, x), k, index_of(rest, x, 1n+k))

def range(n: Nat, +k: Nat) -> List<&2, Nat>:
  match n:
    case 0n:
      Nil{}
    case 1n+m:
      k <> range(m, 1n+k)

# Candidates
# ----------

def bit(+v: Nat) -> U32:
  (1 << v : U32)

def mask_of(vs: List<&2, Nat>) -> U32:
  match vs:
    case Nil{}:
      0
    case Con{+v, rest}:
      (bit(v) .|. mask_of(rest) : U32)

def masks(+p: S.Grid(), us: List<&2, List<&2, Nat>>) -> List<&2, U32>:
  match us:
    case Nil{}:
      Nil{}
    case Con{u, rest}:
      mask_of(S.values(p, u)) <> masks(p, rest)

def mask(+ms: List<&2, U32>, +u: Nat) -> U32:
  Maybe.default(&2, U32, List.get(&2, U32, ms, u), 0)

def cand(+p: S.Grid(), +ms: List<&2, U32>, +i: Nat) -> U32:
  +seen = (mask(ms, row(i)) .|. mask(ms, Nat.add(9n, col(i))) .|. mask(ms, Nat.add(18n, box(i))) : U32)
  Bool.pick(U32, Nat.is_eq(S.at(p, i), 0n), (1022 .&. U32.not(seen) : U32), 0)

def single(+m: U32) -> Bool:
  Bool.and(U32.is_ne(m, 0), U32.is_zero((m .&. (m - 1) : U32)))

# Singles
# -------
# One pass finds every naked and hidden single of p at once.

type Found is Data:
  NakedF{i: Nat, d: Nat}
  HiddenF{i: Nat, d: Nat, u: Nat}

def naked.if(hit: Bool, +i: Nat, +m: U32, rest: List<&2, Found>) -> List<&2, Found>:
  match hit:
    case True{}:
      NakedF{i, U32.log2(m)} <> rest
    case False{}:
      rest

def naked.scan(cells: List<&2, Nat>, +p: S.Grid(), +ms: List<&2, U32>) -> List<&2, Found>:
  match cells:
    case Nil{}:
      Nil{}
    case Con{+i, rest}:
      +m = cand(p, ms, i)
      naked.if(single(m), i, m, naked.scan(rest, p, ms))

def spots(cells: List<&2, Nat>, +p: S.Grid(), +ms: List<&2, U32>, +b: U32) -> List<&2, Nat>:
  match cells:
    case Nil{}:
      Nil{}
    case Con{+j, rest}:
      List.filter.put(Nat, j, spots(rest, p, ms, b), U32.is_ne((cand(p, ms, j) .&. b : U32), 0))

def hidden.one(at: List<&2, Nat>, +d: Nat, +u: Nat) -> List<&2, Found>:
  match at:
    case Con{i, Nil{}}:
      [HiddenF{i, d, u}]
    case other:
      Nil{}

def hidden.digits(ds: List<&2, Nat>, +p: S.Grid(), +ms: List<&2, U32>, +u: Nat, +cells: List<&2, Nat>) ->
  List<&2, Found>:
  match ds:
    case Nil{}:
      Nil{}
    case Con{+d, rest}:
      +present = U32.is_ne((mask(ms, u) .&. bit(d) : U32), 0)
      List.append(&2, Found,
        Bool.pick(List<&2, Found>, present, Nil{}, hidden.one(spots(cells, p, ms, bit(d)), d, u)),
        hidden.digits(rest, p, ms, u, cells))

def hidden.scan(us: List<&2, Nat>, +p: S.Grid(), +ms: List<&2, U32>) -> List<&2, Found>:
  match us:
    case Nil{}:
      Nil{}
    case Con{+u, rest}:
      List.append(&2, Found, hidden.digits(S.digits(), p, ms, u, unit(u)), hidden.scan(rest, p, ms))

def pass(+p: S.Grid()) -> List<&2, Found>:
  +ms = masks(p, S.units())
  List.append(&2, Found, naked.scan(range(81n, 0n), p, ms), hidden.scan(range(27n, 0n), p, ms))

def found.cell(f: Found) -> Nat:
  match f:
    case NakedF{i, d}:
      i
    case HiddenF{i, d, u}:
      i

def found.digit(f: Found) -> Nat:
  match f:
    case NakedF{i, d}:
      d
    case HiddenF{i, d, u}:
      d

def apply(fs: List<&2, Found>, p: S.Grid()) -> S.Grid():
  match fs:
    case Nil{}:
      p
    case Con{+f, rest}:
      apply(rest, List.set(&2, Nat, p, found.cell(f), found.digit(f)))

def solves.next(done: Bool, fs: List<&2, Found>, more: List<&2, Found> -> Bool) -> Bool:
  match done:
    case True{}:
      True{}
    case False{}:
      match fs:
        case Nil{}:
          False{}
        case Con{f, rest}:
          more(f <> rest)

# Singles alone fill p in.
def solves(fuel: Nat, +p: S.Grid()) -> Bool:
  match fuel:
    case 0n:
      S.full(p)
    case 1n+f:
      solves.next(S.full(p), pass(p), fs => solves(f, apply(fs, p)))

# Certificate
# -----------

def first_at(vs: List<&2, Nat>, +e: Nat, +k: Nat) -> Maybe<&2, Nat>:
  match vs:
    case Nil{}:
      None{}
    case Con{v, rest}:
      Bool.pick(Maybe<&2, Nat>, Nat.is_eq(v, e), Some{k}, first_at(rest, e, 1n+k))

def wit.pick(m: Maybe<&2, Nat>, +u: Nat, +px: Nat, other: S.Wit) -> S.Wit:
  match m:
    case Some{pk}:
      S.Wit{u, px, pk}
    case None{}:
      other

def wit.in(us: List<&2, Nat>, +p: S.Grid(), +x: Nat, +e: Nat) -> S.Wit:
  match us:
    case Nil{}:
      S.Wit{0n, 0n, 0n}
    case Con{+u, rest}:
      +cells = unit(u)
      wit.pick(first_at(S.values(p, cells), e, 0n), u, index_of(cells, x, 0n), wit.in(rest, p, x, e))

def wits(ds: List<&2, Nat>, +p: S.Grid(), +i: Nat, +d: Nat) -> List<&2, S.Wit>:
  match ds:
    case Nil{}:
      Nil{}
    case Con{+e, rest}:
      Bool.pick(S.Wit, Nat.is_eq(e, d), S.Wit{0n, 0n, 0n}, wit.in(homes(i), p, i, e))
        <> wits(rest, p, i, d)

def excls(cells: List<&2, Nat>, +p: S.Grid(), +i: Nat, +d: Nat) -> List<&2, S.Excl>:
  match cells:
    case Nil{}:
      Nil{}
    case Con{+j, rest}:
      +why = Bool.pick(S.Excl, Nat.is_eq(j, i), S.Itself{},
        Bool.pick(S.Excl, Nat.is_eq(S.at(p, j), 0n), S.Peer{wit.in(homes(j), p, j, d)}, S.Filled{}))
      why <> excls(rest, p, i, d)

def to_step(+p: S.Grid(), f: Found) -> S.Step:
  match f:
    case NakedF{+i, +d}:
      S.Naked{i, d, row(i), col(i), wits(S.digits(), p, i, d)}
    case HiddenF{+i, +d, +u}:
      S.Hidden{i, d, u, index_of(unit(u), i, 0n), excls(unit(u), p, i, d)}

def to_steps(fs: List<&2, Found>, +p: S.Grid()) -> List<&2, S.Step>:
  match fs:
    case Nil{}:
      Nil{}
    case Con{f, rest}:
      to_step(p, f) <> to_steps(rest, p)

def certify.next(+fs: List<&2, Found>, +p: S.Grid(), more: List<&2, Found> -> List<&2, S.Step>) ->
  List<&2, S.Step>:
  match fs:
    case Nil{}:
      Nil{}
    case Con{f, rest}:
      List.append(&2, S.Step, to_steps(fs, p), more(fs))

# The steps of a singles solve, one pass at a time.
def certify(fuel: Nat, +p: S.Grid()) -> List<&2, S.Step>:
  match fuel:
    case 0n:
      Nil{}
    case 1n+f:
      certify.next(pass(p), p, fs => certify(f, apply(fs, p)))

# Grids
# -----
# A random solved grid: fill cells in order, trying each cell's possible
# digits in a seeded order, backing up on a dead end.

def fits(+p: S.Grid(), +i: Nat, +d: Nat) -> Bool:
  Bool.not(S.mem(d, List.concat(&2, Nat,
    [S.values(p, unit(row(i))), S.values(p, unit(Nat.add(9n, col(i)))), S.values(p, unit(Nat.add(18n, box(i))))])))

def options(ds: List<&2, Nat>, +p: S.Grid(), +i: Nat) -> List<&2, Nat>:
  match ds:
    case Nil{}:
      Nil{}
    case Con{+d, rest}:
      List.filter.put(Nat, d, options(rest, p, i), fits(p, i, d))

def tries(+seed: U32, +p: S.Grid(), +i: Nat) -> List<&2, Nat>:
  shuffle(options(S.digits(), p, i), seed, i)

def fill.or(m: Maybe<&2, S.Grid()>, other: Unit -> Maybe<&2, S.Grid()>) -> Maybe<&2, S.Grid()>:
  match m:
    case Some{g}:
      Some{g}
    case None{}:
      other(Unit{})

def fill(+n: Nat, ds: List<&2, Nat>, +seed: U32, +p: S.Grid(), +i: Nat) -> Maybe<&2, S.Grid()>:
  match n:
    case 0n:
      Some{p}
    case 1n+m:
      match ds:
        case Nil{}:
          None{}
        case Con{+d, rest}:
          +q = List.set(&2, Nat, p, i, d)
          fill.or(fill(m, tries(seed, q, 1n+i), seed, q, 1n+i), u => fill(n, rest, seed, p, i))

def solution(+seed: U32) -> S.Grid():
  +empty = List.replicate(Nat, 81n, 0n)
  Maybe.default(&2, S.Grid(), fill(81n, tries(seed, empty, 0n), seed, empty, 0n), empty)

# Puzzles
# -------
# Clear cells in a seeded order, keeping each one cleared only if singles
# still solve the grid, until `clues` remain (0: as few as possible).

def dig(order: List<&2, Nat>, stop: Bool, +clues: Nat, +target: Nat, +p: S.Grid()) -> S.Grid():
  match order:
    case Nil{}:
      p
    case Con{+i, rest}:
      match stop:
        case True{}:
          p
        case False{}:
          +q = List.set(&2, Nat, p, i, 0n)
          +ok = solves(81n, q)
          +left = Bool.pick(Nat, ok, Nat.sub(clues, 1n), clues)
          dig(rest, Nat.is_le(left, target), left, target, Bool.pick(S.Grid(), ok, q, p))

def game(+clues: Nat, +seed: U32) -> S.Game:
  +sol = solution(seed)
  +puz = dig(shuffle(range(81n, 0n), seed, 99n), False{}, 81n, clues, sol)
  S.Game{puz, sol, certify(81n, puz)}

def keep.if(g: S.Game, ok: Bool) -> Maybe<&2, S.Game>:
  match ok:
    case True{}:
      Some{g}
    case False{}:
      None{}

# The site calls keep(game(clues, seed)): only a game the checker accepts
# comes back.
def keep(+g: S.Game) -> Maybe<&2, S.Game>:
  keep.if(g, S.Game.valid(g))
