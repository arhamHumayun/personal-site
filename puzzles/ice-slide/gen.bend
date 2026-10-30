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

def days.seq(n: Nat, +lo: Nat, +hi: Nat, +base: U32, +i: Nat) ->
  List<&2, Maybe<&2, Ice.Puzzle>>:
  match n:
    case 0n:
      Nil{}
    case 1n+k:
      day(lo, hi, base, i) <> days.seq(k, lo, hi, base, 1n+i)

# Halves the range at each level, each half on its own core.
def days(+depth: Nat, +lo: Nat, +hi: Nat, +base: U32, +i: Nat, +n: Nat) ->
  List<&2, Maybe<&2, Ice.Puzzle>>:
  match depth:
    case 0n:
      days.seq(n, lo, hi, base, i)
    case 1n+e:
      +half = Nat.div(n, 2n)
      a b = days(e, lo, hi, base, i, half)
        days(e, lo, hi, base, Nat.add(i, half), Nat.sub(n, half))
      List.append(&2, Maybe<&2, Ice.Puzzle>, a, b)

# Dates
# -----

type Date is Data:
  Date{y: U32, m: U32, d: U32}

def leap(+y: U32) -> Bool:
  Bool.and(U32.is_zero((y % 4 : U32)),
    Bool.or(Bool.not(U32.is_zero((y % 100 : U32))), U32.is_zero((y % 400 : U32))))

def month_len.go(feb: Bool, short: Bool, leap: Bool) -> U32:
  match feb short leap:
    case True{} _ True{}:
      29
    case True{} _ False{}:
      28
    case False{} True{} _:
      30
    case False{} False{} _:
      31

def month_len(+y: U32, +m: U32) -> U32:
  month_len.go(U32.is_eq(m, 2),
    Bool.or(Bool.or(U32.is_eq(m, 4), U32.is_eq(m, 6)), Bool.or(U32.is_eq(m, 9), U32.is_eq(m, 11))),
    leap(y))

def next.go(more_days: Bool, more_months: Bool, +y: U32, +m: U32, +d: U32) -> Date:
  match more_days more_months:
    case True{} _:
      Date{y, m, (d + 1 : U32)}
    case False{} True{}:
      Date{y, (m + 1 : U32), 1}
    case False{} False{}:
      Date{(y + 1 : U32), 1, 1}

def next(date: Date) -> Date:
  match date:
    case Date{+y, +m, +d}:
      next.go(U32.is_lt(d, month_len(y, m)), U32.is_lt(m, 12), y, m, d)

def dates(n: Nat, +date: Date) -> List<&2, Date>:
  match n:
    case 0n:
      Nil{}
    case 1n+k:
      date <> dates(k, next(date))

# Days since 1970-01-01, after Howard Hinnant's days_from_civil.
def Date.days(date: Date) -> Nat:
  match date:
    case Date{+y, +m, d}:
      +early = Bool.to_u32(U32.is_le(m, 2))
      +yy = (y - early : U32)
      +era = (yy / 400 : U32)
      +yoe = (yy - era * 400 : U32)
      +mp = ((m + 9 : U32) % 12 : U32)
      +doy = ((153 * mp + 2) / 5 + d - 1 : U32)
      +doe = (yoe * 365 + yoe / 4 - yoe / 100 + doy : U32)
      U32.to_nat((era * 146097 + doe - 719468 : U32))

def pad2.if(short: Bool, s: String) -> String:
  match short:
    case True{}:
      "0" ++ s
    case False{}:
      s

def pad2(+n: U32) -> String:
  pad2.if(U32.is_lt(n, 10), U32.show(n))

def Date.show(date: Date) -> String:
  match date:
    case Date{y, m, d}:
      U32.show(y) ++ "-" ++ pad2(m) ++ "-" ++ pad2(d)

def Date.of(parts: List<&2, String>) -> Maybe<&2, Date>:
  match parts:
    case Con{ys, Con{ms, Con{ds, Nil{}}}}:
      do Maybe<&2, Date>:
        y : U32 <- U32.read(ys)
        m : U32 <- U32.read(ms)
        d : U32 <- U32.read(ds)
        return Date{y, m, d}
    case other:
      None{}

def Date.read(s: String) -> Maybe<&2, Date>:
  Date.of(String.split(s, '-'))

# JSON
# ----

def json.cells(cells: List<&2, Bool>) -> String:
  match cells:
    case Nil{}:
      ""
    case Con{True{}, cs}:
      "#" ++ json.cells(cs)
    case Con{False{}, cs}:
      "." ++ json.cells(cs)

def json.rows(rows: Ice.Grid()) -> List<&2, String>:
  match rows:
    case Nil{}:
      Nil{}
    case Con{r, rs}:
      ("\"" ++ json.cells(r) ++ "\"") <> json.rows(rs)

def json.pos(p: Ice.Pos) -> String:
  match p:
    case Ice.Pos{x, y}:
      "[" ++ Nat.show(x) ++ "," ++ Nat.show(y) ++ "]"

def json.dir(d: Ice.Dir) -> String:
  match d:
    case Ice.Up{}:
      "U"
    case Ice.Down{}:
      "D"
    case Ice.Left{}:
      "L"
    case Ice.Right{}:
      "R"

def json.moves(ms: List<&2, Ice.Dir>) -> String:
  match ms:
    case Nil{}:
      ""
    case Con{d, rest}:
      json.dir(d) ++ json.moves(rest)

def json.puzzle(date: String, p: Ice.Puzzle) -> String:
  match p:
    case Ice.Puzzle{s, Ice.Game{w, h, g, start, exit, par, sol, ds}}:
      "{\"date\":\"" ++ date ++ "\",\"seed\":" ++ U32.show(s) ++ ",\"width\":" ++ Nat.show(w)
        ++ ",\"height\":" ++ Nat.show(h) ++ ",\"tiles\":["
        ++ String.join(json.rows(g), ",") ++ "],\"start\":" ++ json.pos(start)
        ++ ",\"exit\":" ++ json.pos(exit) ++ ",\"par\":" ++ Nat.show(par) ++ "}"

def json.solution(date: String, p: Ice.Puzzle) -> String:
  match p:
    case Ice.Puzzle{s, Ice.Game{w, h, g, start, exit, par, sol, ds}}:
      "{\"date\":\"" ++ date ++ "\",\"seed\":" ++ U32.show(s) ++ ",\"solution\":\""
        ++ json.moves(sol) ++ "\"}"

def json.list(items: List<&2, String>) -> String:
  "[\n" ++ String.join(items, ",\n") ++ "\n]\n"

def missing(ps: List<&2, Maybe<&2, Ice.Puzzle>>) -> Bool:
  match ps:
    case Nil{}:
      False{}
    case Con{None{}, rest}:
      True{}
    case Con{Some{p}, rest}:
      missing(rest)

def render(~f: String -> Ice.Puzzle -> String, ds: List<&2, Date>,
  ps: List<&2, Maybe<&2, Ice.Puzzle>>) -> List<&2, String>:
  match ds ps:
    case Con{d, drest} Con{Some{p}, prest}:
      f(Date.show(d), p) <> render(~f, drest, prest)
    case _ _:
      Nil{}

# Main
# ----

def write_file.fin(r: File & Result<&1, &1, U32 & String, Unit>) -> IO(Unit):
  (f, res) = r
  do IO<Unit>:
    File.close(f)
    IO.pass(Unit, res)

def write_file(path: String, text: String) -> IO(Unit):
  do IO<Unit>:
    f : File <- IO.try(File, File.open(path, "w"))
    r : File & Result<&1, &1, U32 & String, Unit> <- File.write(f, text)
    write_file.fin(r)

type Opts is Data:
  Opts{start: Date, n: Nat, seed: U32, lo: Nat, hi: Nat}

def opts(start: String, n: String, seed: String, lo: String, hi: String) -> Maybe<&2, Opts>:
  do Maybe<&2, Opts>:
    d : Date <- Date.read(start)
    k : U32 <- U32.read(n)
    s : U32 <- U32.read(seed)
    a : U32 <- U32.read(lo)
    b : U32 <- U32.read(hi)
    return Opts{d, U32.to_nat(k), s, U32.to_nat(a), U32.to_nat(b)}

def emit(gap: Bool, +ds: List<&2, Date>, +ps: List<&2, Maybe<&2, Ice.Puzzle>>, out: String,
  sols: String) -> IO(Unit):
  match gap:
    case True{}:
      IO.die(Unit, 1, "no puzzle in range for some day: widen min/max")
    case False{}:
      do IO<Unit>:
        write_file(out, json.list(render(~json.puzzle, ds, ps)))
        write_file(sols, json.list(render(~json.solution, ds, ps)))
        IO.print("wrote " ++ Nat.show(List.length(&2, Date, ds)) ++ " puzzles")

def run.go(o: Maybe<&2, Opts>, out: String, sols: String) -> IO(Unit):
  match o:
    case None{}:
      IO.die(Unit, 2, "bad arguments")
    case Some{Opts{+start, +n, seed, lo, hi}}:
      +ps = days(9n, lo, hi, seed, Date.days(start), n)
      emit(missing(ps), dates(n, start), ps, out, sols)

def run(args: List<String>) -> IO(Unit):
  match args:
    case Con{prog, Con{start, Con{n, Con{seed, Con{lo, Con{hi, Con{out, Con{sols, Nil{}}}}}}}}}:
      run.go(opts(start, n, seed, lo, hi), out, sols)
    case other:
      IO.die(Unit, 2, "usage: gen <start YYYY-MM-DD> <days> <seed> <min> <max> <puzzles.json> <solutions.json>")

def main() -> IO(Unit):
  do IO<Unit>:
    args : List<String> <- IO.args()
    run(args)
