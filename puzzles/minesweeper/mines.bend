import Base

# A board is its cells in row-major order, True for a mine.
def Cells() -> Data:
  List<&2, Bool>

def cell(c: Maybe<&2, Bool>) -> Bool:
  match c:
    case None{}:
      False{}
    case Some{b}:
      b

def at(cells: Cells(), i: Nat) -> Bool:
  cell(List.get(&2, Bool, cells, i))

def count(cells: Cells()) -> Nat:
  match cells:
    case Nil{}:
      0n
    case Con{True{}, rest}:
      1n+count(rest)
    case Con{False{}, rest}:
      count(rest)

def close(+a: Nat, +b: Nat) -> Bool:
  Bool.and(Nat.is_le(a, 1n+b), Nat.is_le(b, 1n+a))

# Cell i touches cell j, or is j, on a board w wide.
def near(+w: Nat, +i: Nat, +j: Nat) -> Bool:
  Bool.and(close(Nat.mod(i, w), Nat.mod(j, w)), close(Nat.div(i, w), Nat.div(j, w)))

def clear(cells: Cells(), +w: Nat, +first: Nat, +i: Nat) -> Bool:
  match cells:
    case Nil{}:
      True{}
    case Con{c, rest}:
      Bool.and(Bool.or(Bool.not(c), Bool.not(near(w, first, i))), clear(rest, w, first, 1n+i))

def valid(+w: Nat, +h: Nat, +mines: Nat, +first: Nat, +cells: Cells()) -> Bool:
  Bool.and(Nat.is_eq(List.length(&2, Bool, cells), Nat.mul(w, h)),
    Bool.and(Nat.is_eq(count(cells), mines), clear(cells, w, first, 0n)))
