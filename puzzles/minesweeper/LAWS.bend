import Base
import ./mines.bend as Mines
import ./gen.bend as Gen

# Gen.board lays the mines once the first click is known. Whatever board
# it hands out:

# it has one cell per square,
law board_size:
  for +w: Nat
  for +h: Nat
  for +mines: Nat
  for +first: Nat
  for +seed: U32
  for +cells: Mines.Cells()
  for hb: {Gen.board(w, h, mines, first, seed) == Some{cells} : Maybe<&2, Mines.Cells()>}
  {List.length(&2, Bool, cells) == Nat.mul(w, h) : Nat}

# exactly the requested number of mines,
law exact_mines:
  for +w: Nat
  for +h: Nat
  for +mines: Nat
  for +first: Nat
  for +seed: U32
  for +cells: Mines.Cells()
  for hb: {Gen.board(w, h, mines, first, seed) == Some{cells} : Maybe<&2, Mines.Cells()>}
  {Mines.count(cells) == mines : Nat}

# and no mine on the first click or any cell touching it.
law first_click_clear:
  for +w: Nat
  for +h: Nat
  for +mines: Nat
  for +first: Nat
  for +seed: U32
  for +cells: Mines.Cells()
  for hb: {Gen.board(w, h, mines, first, seed) == Some{cells} : Maybe<&2, Mines.Cells()>}
  for +i: Nat
  for touch: {Mines.near(w, first, i) == True{} : Bool}
  {Mines.at(cells, i) == False{} : Bool}

# The same seed and first click always give the same board.
law same_seed_same_board:
  for +w: Nat
  for +h: Nat
  for +mines: Nat
  for +first: Nat
  for +seed: U32
  {Gen.board(w, h, mines, first, seed) == Gen.board(w, h, mines, first, seed)
    : Maybe<&2, Mines.Cells()>}
