import Base
import ./dots.bend as Dots

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

def nat.if(c: Bool, t: Nat, f: Nat) -> Nat:
  match c:
    case True{}:
      t
    case False{}:
      f

# One line through every cell
# ---------------------------
# A puzzle starts as a single line that visits every cell once. It begins as
# a snake, row by row, and is shuffled by backbites: an end of the line steps
# onto a neighbor, which sits somewhere along the line, and the stretch
# between the two is reversed. The result still visits every cell once.

def snake.cell(+w: Nat, +i: Nat) -> Dots.Pos:
  +y = Nat.div(i, w)
  +c = Nat.mod(i, w)
  Dots.Pos{nat.if(Nat.is_eq(Nat.mod(y, 2n), 0n), c, Nat.sub(Nat.sub(w, 1n), c)), y}

def snake(n: Nat, +w: Nat, +i: Nat) -> Dots.Path():
  match n:
    case 0n:
      Nil{}
    case 1n+k:
      snake.cell(w, i) <> snake(k, w, 1n+i)

def some.if(ok: Bool, p: Dots.Pos) -> Maybe<&2, Dots.Pos>:
  match ok:
    case True{}:
      Some{p}
    case False{}:
      None{}

# The neighbor of p in direction d (up, left, down, right), if on the board.
def near.go(d: Nat, +w: Nat, +h: Nat, +x: Nat, +y: Nat) -> Maybe<&2, Dots.Pos>:
  match d:
    case 0n:
      some.if(Nat.is_lt(0n, y), Dots.Pos{x, Nat.sub(y, 1n)})
    case 1n:
      some.if(Nat.is_lt(0n, x), Dots.Pos{Nat.sub(x, 1n), y})
    case 2n:
      some.if(Nat.is_lt(1n+y, h), Dots.Pos{x, 1n+y})
    case _:
      some.if(Nat.is_lt(1n+x, w), Dots.Pos{1n+x, y})

def near(+w: Nat, +h: Nat, p: Dots.Pos, d: Nat) -> Maybe<&2, Dots.Pos>:
  match p:
    case Dots.Pos{+x, +y}:
      near.go(d, w, h, x, y)

def index.if(hit: Bool, n: Nat) -> Nat:
  match hit:
    case True{}:
      0n
    case False{}:
      1n+n

def index(path: Dots.Path(), +q: Dots.Pos) -> Nat:
  match path:
    case Nil{}:
      0n
    case Con{p, rest}:
      index.if(Dots.Pos.eq(p, q), index(rest, q))

def bite.cut(+i: Nat, +path: Dots.Path()) -> Dots.Path():
  List.append(&2, Dots.Pos, List.reverse(&2, Dots.Pos, List.take(&2, Dots.Pos, path, i)),
    List.drop(&2, Dots.Pos, path, i))

def bite.at(q: Maybe<&2, Dots.Pos>, +path: Dots.Path()) -> Dots.Path():
  match q:
    case None{}:
      path
    case Some{+n}:
      bite.cut(index(path, n), path)

def bite(path: Dots.Path(), +w: Nat, +h: Nat, +d: Nat) -> Dots.Path():
  match path:
    case Nil{}:
      Nil{}
    case Con{+p, +rest}:
      bite.at(near(w, h, p, d), p <> rest)

def orient(flip: Bool, path: Dots.Path()) -> Dots.Path():
  match flip:
    case True{}:
      List.reverse(&2, Dots.Pos, path)
    case False{}:
      path

def shuffle(n: Nat, +w: Nat, +h: Nat, +s: U32, +k: U32, path: Dots.Path()) -> Dots.Path():
  match n:
    case 0n:
      path
    case 1n+f:
      +r = draw(s, k)
      shuffle(f, w, h, s, (k + 1 : U32),
        bite(orient(U32.is_eq((r .&. 1 : U32), 1), path), w, h, U32.to_nat(((r >> 1n) % 4 : U32))))

# Cutting it into lines
# ---------------------
# Walking the long line, a piece ends just before it would touch itself, so
# no line can cut a corner of its own. Each piece becomes a color, its two
# ends the dots. Every piece is at least 3 cells, but the last: one shorter
# joins the piece before it.

def touches(cells: Dots.Path(), +p: Dots.Pos) -> Bool:
  match cells:
    case Nil{}:
      False{}
    case Con{c, rest}:
      Bool.or(Dots.touch(c, p), touches(rest, p))

# cur holds the piece being cut, newest cell first; out the finished pieces,
# newest first.
type Cut is Data:
  Cut{cur: Dots.Path(), out: List<&2, Dots.Path()>}

def carve.cut(hit: Bool, +p: Dots.Pos, cur: Dots.Path(), out: List<&2, Dots.Path()>) -> Cut:
  match hit:
    case True{}:
      Cut{[p], List.reverse(&2, Dots.Pos, cur) <> out}
    case False{}:
      Cut{p <> cur, out}

def carve.end(short: Bool, cur: Dots.Path(), out: List<&2, Dots.Path()>) ->
  List<&2, Dots.Path()>:
  match short:
    case False{}:
      List.reverse(&2, Dots.Path(), List.reverse(&2, Dots.Pos, cur) <> out)
    case True{}:
      match out:
        case Nil{}:
          [List.reverse(&2, Dots.Pos, cur)]
        case Con{last, rest}:
          List.reverse(&2, Dots.Path(),
            List.append(&2, Dots.Pos, last, List.reverse(&2, Dots.Pos, cur)) <> rest)

def carve(path: Dots.Path(), st: Cut) -> List<&2, Dots.Path()>:
  match path st:
    case Nil{} Cut{+cur, out}:
      carve.end(Nat.is_lt(List.length(&2, Dots.Pos, cur), 3n), cur, out)
    case Con{+p, rest} Cut{+cur, out}:
      carve(rest, carve.cut(touches(List.tail(&2, Dots.Pos, cur), p), p, cur, out))

def ends(sol: List<&2, Dots.Path()>) -> List<&2, Dots.Dots>:
  match sol:
    case Nil{}:
      Nil{}
    case Con{+line, rest}:
      +o = {Dots.Pos{0n, 0n} : Dots.Pos}
      Dots.Dots{Maybe.default(&2, Dots.Pos, List.head(&2, Dots.Pos, line), o),
        Maybe.default(&2, Dots.Pos, List.last(&2, Dots.Pos, line), o)} <> ends(rest)

# Puzzle
# ------

def game(+n: Nat, +s: U32) -> Dots.Game:
  +cells = Nat.mul(n, n)
  +sol = carve(shuffle(Nat.mul(cells, 12n), n, n, s, 16, snake(cells, n, 0n)), Cut{Nil{}, Nil{}})
  Dots.Game{n, n, ends(sol), sol}

def puzzle(+n: Nat, +s: U32) -> Dots.Puzzle:
  Dots.Puzzle{s, game(n, s)}

# Levels
# ------
# The board grows by one every five levels, from 5 by 5 up to 9 by 9, with
# n - 1 to n + 3 colors.

def size(+i: Nat) -> Nat:
  Nat.min(Nat.add(5n, Nat.div(Nat.sub(i, 1n), 5n)), 9n)

def min_pairs(+i: Nat) -> Nat:
  Nat.sub(size(i), 1n)

def max_pairs(+i: Nat) -> Nat:
  Nat.add(size(i), 3n)

# What a level keeps, one condition at a time.
def accept.lines(+g: Dots.Game) -> Bool:
  Bool.and(Dots.thin(Dots.Game.sol(g)),
    Dots.solved(Dots.Game.w(g), Dots.Game.h(g), Dots.Game.pairs(g), Dots.Game.sol(g)))

def accept.dots(+i: Nat, +g: Dots.Game) -> Bool:
  +count = List.length(&2, Dots.Dots, Dots.Game.pairs(g))
  Bool.and(Bool.and(Nat.is_le(min_pairs(i), count), Nat.is_le(count, max_pairs(i))),
    Bool.and(Dots.apart(Dots.Game.pairs(g)), accept.lines(g)))

def accept.size(+i: Nat, +g: Dots.Game) -> Bool:
  Bool.and(Nat.is_eq(Dots.Game.h(g), size(i)), accept.dots(i, g))

def accept(+i: Nat, +p: Dots.Puzzle) -> Bool:
  Bool.and(Nat.is_eq(Dots.Game.w(Dots.Puzzle.game(p)), size(i)),
    accept.size(i, Dots.Puzzle.game(p)))

def keep.if(p: Dots.Puzzle, ok: Bool) -> Maybe<&2, Dots.Puzzle>:
  match ok:
    case True{}:
      Some{p}
    case False{}:
      None{}

def keep(+i: Nat, +p: Dots.Puzzle) -> Maybe<&2, Dots.Puzzle>:
  keep.if(p, accept(i, p))

def seed(+base: U32, +i: Nat, +a: U32) -> U32:
  mix((mix((base .^. U32.from_nat(i) : U32)) + a * 2654435769 : U32))

def tries(k: Nat, +base: U32, +i: Nat, +a: U32, m: Maybe<&2, Dots.Puzzle>) ->
  Maybe<&2, Dots.Puzzle>:
  match k:
    case 0n:
      m
    case 1n+f:
      match m:
        case Some{p}:
          Some{p}
        case None{}:
          tries(f, base, i, (a + 1 : U32), keep(i, puzzle(size(i), seed(base, i, a))))

# The site calls level() from the JS build, one call per level.
def level(+base: U32, +i: Nat) -> Maybe<&2, Dots.Puzzle>:
  tries(1000n, base, i, 0, None{})
