import Base

type Pos is Data:
  Pos{x: Nat, y: Nat}

# The two dots of one color.
type Dots is Data:
  Dots{a: Pos, b: Pos}

# The cells one line covers, from dot a to dot b.
def Path() -> Data:
  List<&2, Pos>

# A w by h board. The colors are the indexes of pairs; sol holds one line
# per color, in the same order.
type Game is Data:
  Game{w: Nat, h: Nat, pairs: List<&2, Dots>, sol: List<&2, Path()>}

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

def Game.w(g: Game) -> Nat:
  match g:
    case Game{w, h, pairs, sol}:
      w

def Game.h(g: Game) -> Nat:
  match g:
    case Game{w, h, pairs, sol}:
      h

def Game.pairs(g: Game) -> List<&2, Dots>:
  match g:
    case Game{w, h, pairs, sol}:
      pairs

def Game.sol(g: Game) -> List<&2, Path()>:
  match g:
    case Game{w, h, pairs, sol}:
      sol

# Cells
# -----

def Pos.eq(a: Pos, b: Pos) -> Bool:
  match a b:
    case Pos{ax, ay} Pos{bx, by}:
      Bool.and(Nat.is_eq(ax, bx), Nat.is_eq(ay, by))

def inside(+w: Nat, +h: Nat, p: Pos) -> Bool:
  match p:
    case Pos{x, y}:
      Bool.and(Nat.is_lt(x, w), Nat.is_lt(y, h))

def gap(+a: Nat, +b: Nat) -> Nat:
  Nat.add(Nat.sub(a, b), Nat.sub(b, a))

# Side by side: one step up, down, left or right.
def touch(a: Pos, b: Pos) -> Bool:
  match a b:
    case Pos{+ax, +ay} Pos{+bx, +by}:
      Nat.is_eq(Nat.add(gap(ax, bx), gap(ay, by)), 1n)

# Lines
# -----

# Every cell is on the board and touches the one before it.
def walk(path: Path(), +w: Nat, +h: Nat, +prev: Pos) -> Bool:
  match path:
    case Nil{}:
      True{}
    case Con{+p, rest}:
      Bool.and(inside(w, h, p), Bool.and(touch(prev, p), walk(rest, w, h, p)))

def ends_at(path: Path(), +b: Pos) -> Bool:
  match path:
    case Nil{}:
      False{}
    case Con{p, rest}:
      Pos.eq(List.last.go(&2, Pos, rest, p), b)

# A line joins its pair when it runs from dot a to dot b, one step at a time.
def joins(+w: Nat, +h: Nat, pair: Dots, path: Path()) -> Bool:
  match pair path:
    case Dots{+a, +b} Nil{}:
      False{}
    case Dots{+a, +b} Con{+p, +rest}:
      Bool.and(Pos.eq(p, a), Bool.and(inside(w, h, p),
        Bool.and(walk(rest, w, h, p), ends_at(p <> rest, b))))

# Every pair is joined by its own line, and there is no line without a pair.
def connects(+w: Nat, +h: Nat, pairs: List<&2, Dots>, sol: List<&2, Path()>) -> Bool:
  match pairs sol:
    case Nil{} Nil{}:
      True{}
    case Con{pr, prs} Con{pa, pas}:
      Bool.and(joins(w, h, pr, pa), connects(w, h, prs, pas))
    case _ _:
      False{}

# Board
# -----

def fresh(cells: Path(), +p: Pos) -> Bool:
  match cells:
    case Nil{}:
      True{}
    case Con{c, rest}:
      Bool.and(Bool.not(Pos.eq(c, p)), fresh(rest, p))

def distinct(cells: Path()) -> Bool:
  match cells:
    case Nil{}:
      True{}
    case Con{+p, +rest}:
      Bool.and(fresh(rest, p), distinct(rest))

def all_inside(cells: Path(), +w: Nat, +h: Nat) -> Bool:
  match cells:
    case Nil{}:
      True{}
    case Con{p, rest}:
      Bool.and(inside(w, h, p), all_inside(rest, w, h))

# The lines fill the board: w * h distinct cells, all on the board, so each
# cell is covered by exactly one line.
def fills(+w: Nat, +h: Nat, sol: List<&2, Path()>) -> Bool:
  +cells = List.concat(&2, Pos, sol)
  Bool.and(all_inside(cells, w, h), Bool.and(
    Nat.is_eq(List.length(&2, Pos, cells), Nat.mul(w, h)), distinct(cells)))

# The win: every pair connected, and the board full. The site checks the
# player's lines with this same def.
def solved(+w: Nat, +h: Nat, +pairs: List<&2, Dots>, +sol: List<&2, Path()>) -> Bool:
  Bool.and(connects(w, h, pairs, sol), fills(w, h, sol))

# No pair's two dots touch, so no pair is joined by a single step.
def apart(pairs: List<&2, Dots>) -> Bool:
  match pairs:
    case Nil{}:
      True{}
    case Con{Dots{a, b}, rest}:
      Bool.and(Bool.not(touch(a, b)), apart(rest))

# A line is thin when each cell touches only the cells just before and after
# it: it never runs beside itself, so it has no corner of its own to cut.
def clear(cells: Path(), +p: Pos) -> Bool:
  match cells:
    case Nil{}:
      True{}
    case Con{c, rest}:
      Bool.and(Bool.not(touch(c, p)), clear(rest, p))

def thin.line(path: Path()) -> Bool:
  match path:
    case Nil{}:
      True{}
    case Con{+p, +rest}:
      Bool.and(clear(List.tail(&2, Pos, rest), p), thin.line(rest))

def thin(sol: List<&2, Path()>) -> Bool:
  match sol:
    case Nil{}:
      True{}
    case Con{line, rest}:
      Bool.and(thin.line(line), thin(rest))
