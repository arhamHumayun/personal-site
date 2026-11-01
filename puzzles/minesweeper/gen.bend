import Base
import ./mines.bend as Mines

# Every cell gets a hash of the seed as its key; the mines go on the
# lowest keys outside the first click's neighbourhood. Mines.valid
# re-checks the result before it is kept.

def mix(+x: U32) -> U32:
  +a = ((x .^. (x >> 16n)) * 2146121005 : U32)
  +b = ((a .^. (a >> 15n)) * 2221713035 : U32)
  (b .^. (b >> 16n) : U32)

type Rank is Data:
  Rank{rank: U32, cell: Nat}

def rank_le(a: Rank, b: Rank) -> Bool:
  match a b:
    case Rank{ra, ca} Rank{rb, cb}:
      U32.is_le(ra, rb)

def keys.if(far: Bool, k: Rank, rest: List<&2, Rank>) -> List<&2, Rank>:
  match far:
    case True{}:
      k <> rest
    case False{}:
      rest

def keys(n: Nat, +w: Nat, +first: Nat, +seed: U32, +i: Nat) -> List<&2, Rank>:
  match n:
    case 0n:
      Nil{}
    case 1n+k:
      keys.if(Bool.not(Mines.near(w, first, i)),
        Rank{mix((seed .^. mix(U32.from_nat(i)) : U32)), i},
        keys(k, w, first, seed, 1n+i))

def chosen(ks: List<&2, Rank>) -> List<&2, Nat>:
  match ks:
    case Nil{}:
      Nil{}
    case Con{Rank{r, c}, rest}:
      c <> chosen(rest)

def has(xs: List<&2, Nat>, +i: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{x, rest}:
      Bool.or(Nat.is_eq(x, i), has(rest, i))

def lay(n: Nat, +mines: List<&2, Nat>, +i: Nat) -> Mines.Cells():
  match n:
    case 0n:
      Nil{}
    case 1n+k:
      has(mines, i) <> lay(k, mines, 1n+i)

def layout(+w: Nat, +h: Nat, +mines: Nat, +first: Nat, +seed: U32) -> Mines.Cells():
  +n = Nat.mul(w, h)
  +ks = List.sort(~Rank, ~rank_le, keys(n, w, first, seed, 0n))
  lay(n, chosen(List.take(&2, Rank, ks, mines)), 0n)

def keep.if(cells: Mines.Cells(), ok: Bool) -> Maybe<&2, Mines.Cells()>:
  match ok:
    case True{}:
      Some{cells}
    case False{}:
      None{}

def board(+w: Nat, +h: Nat, +mines: Nat, +first: Nat, +seed: U32) -> Maybe<&2, Mines.Cells()>:
  +cells = layout(w, h, mines, first, seed)
  keep.if(cells, Mines.valid(w, h, mines, first, cells))
