import Base
import ./ice.bend as Ice
import ./gen.bend as Gen

# Movement
# --------

# A slide is a pure function of the board, direction, position and fuel: one
# answer, never a choice between several, and never an effect.
law slide_deterministic:
  for +g: Ice.Grid()
  for +d: Ice.Dir
  for +p: Ice.Pos
  for +fuel: Nat
  {Ice.slide(g, d, p, fuel) == Ice.slide(g, d, p, fuel) : Ice.Pos}

# A slide that starts on ice ends on ice: never on rock, never off the grid.
law slide_stays_on_ice:
  for +g: Ice.Grid()
  for +d: Ice.Dir
  for +p: Ice.Pos
  for +fuel: Nat
  for free: {Ice.blocked(g, p) == False{} : Bool}
  {Ice.blocked(g, Ice.slide(g, d, p, fuel)) == False{} : Bool}

# So does every sequence of moves.
law replay_stays_on_ice:
  for +ms: List<&2, Ice.Dir>
  for +g: Ice.Grid()
  for +fuel: Nat
  for +p: Ice.Pos
  for free: {Ice.blocked(g, p) == False{} : Bool}
  {Ice.blocked(g, Ice.replay(ms, g, fuel, p)) == False{} : Bool}

# Emitted puzzles
# ---------------
# Gen.day is what the generator writes out for day i. Whatever it emits:

# the stored solution walks from the start to the exit,
law emitted_solvable:
  for +lo: Nat
  for +hi: Nat
  for +base: U32
  for +i: Nat
  for +p: Ice.Puzzle
  for h: {Gen.day(lo, hi, base, i) == Some{p} : Maybe<&2, Ice.Puzzle>}
  {Ice.replay(Ice.Game.sol(Ice.Puzzle.game(p)), Ice.Game.grid(Ice.Puzzle.game(p)),
    Ice.Game.fuel(Ice.Puzzle.game(p)), Ice.Game.start(Ice.Puzzle.game(p)))
    == Ice.Game.exit(Ice.Puzzle.game(p)) : Ice.Pos}

# in exactly par moves,
law emitted_par_is_solution_length:
  for +lo: Nat
  for +hi: Nat
  for +base: U32
  for +i: Nat
  for +p: Ice.Puzzle
  for h: {Gen.day(lo, hi, base, i) == Some{p} : Maybe<&2, Ice.Puzzle>}
  {List.length(&2, Ice.Dir, Ice.Game.sol(Ice.Puzzle.game(p)))
    == Ice.Game.par(Ice.Puzzle.game(p)) : Nat}

# and no sequence of moves reaches the exit in fewer than par,
law emitted_par_is_shortest:
  for +lo: Nat
  for +hi: Nat
  for +base: U32
  for +i: Nat
  for +p: Ice.Puzzle
  for h: {Gen.day(lo, hi, base, i) == Some{p} : Maybe<&2, Ice.Puzzle>}
  for +ms: List<&2, Ice.Dir>
  for reach: {Ice.replay(ms, Ice.Game.grid(Ice.Puzzle.game(p)),
    Ice.Game.fuel(Ice.Puzzle.game(p)), Ice.Game.start(Ice.Puzzle.game(p)))
    == Ice.Game.exit(Ice.Puzzle.game(p)) : Ice.Pos}
  {Nat.is_le(Ice.Game.par(Ice.Puzzle.game(p)), List.length(&2, Ice.Dir, ms))
    == True{} : Bool}

# and par sits between the requested bounds.
law emitted_par_in_range:
  for +lo: Nat
  for +hi: Nat
  for +base: U32
  for +i: Nat
  for +p: Ice.Puzzle
  for h: {Gen.day(lo, hi, base, i) == Some{p} : Maybe<&2, Ice.Puzzle>}
  {Bool.and(Nat.is_le(lo, Ice.Game.par(Ice.Puzzle.game(p))),
    Nat.is_le(Ice.Game.par(Ice.Puzzle.game(p)), hi)) == True{} : Bool}

# Seeds
# -----

# A puzzle is a pure function of its seed: no clock, no IO, no hidden state.
law same_seed_same_puzzle:
  for +seed: U32
  {Gen.puzzle(seed) == Gen.puzzle(seed) : Ice.Puzzle}

# The seed written next to an emitted puzzle regenerates exactly that puzzle.
law emitted_seed_regenerates:
  for +lo: Nat
  for +hi: Nat
  for +base: U32
  for +i: Nat
  for +p: Ice.Puzzle
  for h: {Gen.day(lo, hi, base, i) == Some{p} : Maybe<&2, Ice.Puzzle>}
  {Gen.puzzle(Ice.Puzzle.seed(p)) == p : Ice.Puzzle}
