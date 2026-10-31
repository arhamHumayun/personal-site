import Base
import ./sudoku.bend as S
import ./gen.bend as Gen

# Gen.game builds a puzzle from a seed, clearing cells down to the given
# clue count, and Gen.keep hands it out only if it checks. Whatever comes out:

# its solution is a solved grid,
law solution_solved:
  for +clues: Nat
  for +seed: U32
  for +gm: S.Game
  for h: {Gen.keep(Gen.game(clues, seed)) == Some{gm} : Maybe<&2, S.Game>}
  {S.solved(S.Game.solution(gm)) == True{} : Bool}

# that keeps every clue,
law solution_keeps_clues:
  for +clues: Nat
  for +seed: U32
  for +gm: S.Game
  for h: {Gen.keep(Gen.game(clues, seed)) == Some{gm} : Maybe<&2, S.Game>}
  {S.agrees(S.Game.solution(gm), S.Game.puzzle(gm)) == True{} : Bool}

# and is the only one: any solved grid that keeps every clue is that solution.
law unique_solution:
  for +clues: Nat
  for +seed: U32
  for +gm: S.Game
  for h: {Gen.keep(Gen.game(clues, seed)) == Some{gm} : Maybe<&2, S.Game>}
  for +g: S.Grid()
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, S.Game.puzzle(gm)) == True{} : Bool}
  {g == S.Game.solution(gm) : S.Grid()}

# The same seed and clue count always give the same puzzle.
law same_seed_same_puzzle:
  for +clues: Nat
  for +seed: U32
  {Gen.keep(Gen.game(clues, seed)) == Gen.keep(Gen.game(clues, seed)) : Maybe<&2, S.Game>}
