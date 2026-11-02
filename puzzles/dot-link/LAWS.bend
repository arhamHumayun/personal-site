import Base
import ./dots.bend as Dots
import ./gen.bend as Gen

# The win
# -------
# Dots.solved decides when a board is won, for the player's lines as for the
# stored ones. A won board has

# every pair joined by its own line,
law solved_connects:
  for +w: Nat
  for +h: Nat
  for +pairs: List<&2, Dots.Dots>
  for +sol: List<&2, Dots.Path()>
  for won: {Dots.solved(w, h, pairs, sol) == True{} : Bool}
  {Dots.connects(w, h, pairs, sol) == True{} : Bool}

# and every cell covered, once.
law solved_fills:
  for +w: Nat
  for +h: Nat
  for +pairs: List<&2, Dots.Dots>
  for +sol: List<&2, Dots.Path()>
  for won: {Dots.solved(w, h, pairs, sol) == True{} : Bool}
  {Dots.fills(w, h, sol) == True{} : Bool}

# Emitted puzzles
# ---------------
# Gen.level is the puzzle the site shows for level i. Whatever it emits:

# the stored lines win it,
law emitted_solvable:
  for +base: U32
  for +i: Nat
  for +p: Dots.Puzzle
  for h: {Gen.level(base, i) == Some{p} : Maybe<&2, Dots.Puzzle>}
  {Dots.solved(Dots.Game.w(Dots.Puzzle.game(p)), Dots.Game.h(Dots.Puzzle.game(p)),
    Dots.Game.pairs(Dots.Puzzle.game(p)), Dots.Game.sol(Dots.Puzzle.game(p))) == True{} : Bool}

# and none of them runs beside itself,
law emitted_lines_thin:
  for +base: U32
  for +i: Nat
  for +p: Dots.Puzzle
  for h: {Gen.level(base, i) == Some{p} : Maybe<&2, Dots.Puzzle>}
  {Dots.thin(Dots.Game.sol(Dots.Puzzle.game(p))) == True{} : Bool}

# no pair's dots touch,
law emitted_dots_apart:
  for +base: U32
  for +i: Nat
  for +p: Dots.Puzzle
  for h: {Gen.level(base, i) == Some{p} : Maybe<&2, Dots.Puzzle>}
  {Dots.apart(Dots.Game.pairs(Dots.Puzzle.game(p))) == True{} : Bool}

# the board is Gen.size(i) wide
law emitted_width:
  for +base: U32
  for +i: Nat
  for +p: Dots.Puzzle
  for h: {Gen.level(base, i) == Some{p} : Maybe<&2, Dots.Puzzle>}
  {Dots.Game.w(Dots.Puzzle.game(p)) == Gen.size(i) : Nat}

# and as tall,
law emitted_height:
  for +base: U32
  for +i: Nat
  for +p: Dots.Puzzle
  for h: {Gen.level(base, i) == Some{p} : Maybe<&2, Dots.Puzzle>}
  {Dots.Game.h(Dots.Puzzle.game(p)) == Gen.size(i) : Nat}

# with the number of colors inside the level's range.
law emitted_pairs_in_range:
  for +base: U32
  for +i: Nat
  for +p: Dots.Puzzle
  for h: {Gen.level(base, i) == Some{p} : Maybe<&2, Dots.Puzzle>}
  {Bool.and(Nat.is_le(Gen.min_pairs(i), List.length(&2, Dots.Dots, Dots.Game.pairs(Dots.Puzzle.game(p)))),
    Nat.is_le(List.length(&2, Dots.Dots, Dots.Game.pairs(Dots.Puzzle.game(p))), Gen.max_pairs(i)))
    == True{} : Bool}

# Seeds
# -----

# A puzzle is a pure function of its size and seed: no clock, no IO, no
# hidden state.
law same_seed_same_puzzle:
  for +n: Nat
  for +seed: U32
  {Gen.puzzle(n, seed) == Gen.puzzle(n, seed) : Dots.Puzzle}

# An emitted puzzle's seed, at the level's size, regenerates exactly it.
law emitted_seed_regenerates:
  for +base: U32
  for +i: Nat
  for +p: Dots.Puzzle
  for h: {Gen.level(base, i) == Some{p} : Maybe<&2, Dots.Puzzle>}
  {Gen.puzzle(Gen.size(i), Dots.Puzzle.seed(p)) == p : Dots.Puzzle}
