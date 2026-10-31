import Base
import ./mines.bend as Mines
import ./gen.bend as Gen
import ./LAWS.bend as Laws
import ../lemmas.bend as L

# A board the generator keeps passed Mines.valid.

def ok(+w: Nat, +h: Nat, +mines: Nat, +first: Nat, m: Maybe<&2, Mines.Cells()>) -> Type:
  match m:
    case None{}:
      Unit
    case Some{+cells}:
      {Mines.valid(w, h, mines, first, cells) == True{} : Bool}

law keep_ok:
  for +w: Nat
  for +h: Nat
  for +mines: Nat
  for +first: Nat
  for +cells: Mines.Cells()
  for b: Bool
  for hb: {Mines.valid(w, h, mines, first, cells) == b : Bool}
  ok(w, h, mines, first, Gen.keep.if(cells, b))

def keep_ok(w, h, mines, first, cells, b, hb):
  match b:
    case True{}:
      hb
    case False{}:
      Unit{}

law board_valid:
  for +w: Nat
  for +h: Nat
  for +mines: Nat
  for +first: Nat
  for +seed: U32
  for +cells: Mines.Cells()
  for hb: {Gen.board(w, h, mines, first, seed) == Some{cells} : Maybe<&2, Mines.Cells()>}
  {Mines.valid(w, h, mines, first, cells) == True{} : Bool}

def board_valid(w, h, mines, first, seed, cells, hb):
  %hb : ok(w, h, mines, first, _)
  keep_ok(w, h, mines, first, Gen.layout(w, h, mines, first, seed),
    Mines.valid(w, h, mines, first, Gen.layout(w, h, mines, first, seed)), {==})

# Mines.clear walks the cells with their index; a cell near the first click
# that it passed holds no mine.
law clear_at:
  for +cells: Mines.Cells()
  for +w: Nat
  for +first: Nat
  for +i: Nat
  for +j: Nat
  for +hc: {Mines.clear(cells, w, first, i) == True{} : Bool}
  for +hn: {Mines.near(w, first, Nat.add(i, j)) == True{} : Bool}
  {Mines.cell(List.get(&2, Bool, cells, j)) == False{} : Bool}

def clear_at(cells, w, first, i, j, hc, hn):
  match cells j:
    case Nil{} _:
      {==}
    case Con{False{}, rest} 0n:
      {==}
    case Con{True{}, rest} 0n:
      L.false_true({True{} == False{} : Bool},
        Equal.trans(Bool, False{}, Mines.near(w, first, i), True{},
          Equal.sym(Bool, Mines.near(w, first, i), False{},
            L.not_true(Mines.near(w, first, i),
              L.and_l(Bool.or(Bool.not(True{}), Bool.not(Mines.near(w, first, i))),
                Mines.clear(rest, w, first, 1n+i), hc))),
          (%L.add_zero(i) : {Mines.near(w, first, _) == True{} : Bool}; hn)))
    case Con{c, rest} 1n+jp:
      clear_at(rest, w, first, 1n+i, jp,
        L.and_r(Bool.or(Bool.not(c), Bool.not(Mines.near(w, first, i))),
          Mines.clear(rest, w, first, 1n+i), hc),
        (%L.add_succ(i, jp) : {Mines.near(w, first, _) == True{} : Bool}; hn))

# Laws
# ----

def Laws.board_size(w, h, mines, first, seed, cells, hb):
  L.eq_sound(List.length(&2, Bool, cells), Nat.mul(w, h),
    L.and_l(Nat.is_eq(List.length(&2, Bool, cells), Nat.mul(w, h)),
      Bool.and(Nat.is_eq(Mines.count(cells), mines), Mines.clear(cells, w, first, 0n)),
      board_valid(w, h, mines, first, seed, cells, hb)))

def Laws.exact_mines(w, h, mines, first, seed, cells, hb):
  L.eq_sound(Mines.count(cells), mines,
    L.and_l(Nat.is_eq(Mines.count(cells), mines), Mines.clear(cells, w, first, 0n),
      L.and_r(Nat.is_eq(List.length(&2, Bool, cells), Nat.mul(w, h)),
        Bool.and(Nat.is_eq(Mines.count(cells), mines), Mines.clear(cells, w, first, 0n)),
        board_valid(w, h, mines, first, seed, cells, hb))))

def Laws.first_click_clear(w, h, mines, first, seed, cells, hb, i, touch):
  clear_at(cells, w, first, 0n, i,
    L.and_r(Nat.is_eq(Mines.count(cells), mines), Mines.clear(cells, w, first, 0n),
      L.and_r(Nat.is_eq(List.length(&2, Bool, cells), Nat.mul(w, h)),
        Bool.and(Nat.is_eq(Mines.count(cells), mines), Mines.clear(cells, w, first, 0n)),
        board_valid(w, h, mines, first, seed, cells, hb))),
    touch)

def Laws.same_seed_same_board(w, h, mines, first, seed):
  {==}
