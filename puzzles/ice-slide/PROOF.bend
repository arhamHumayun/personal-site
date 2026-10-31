import Base
import ./ice.bend as Ice
import ./gen.bend as Gen
import ./LAWS.bend as Laws

# Bool
# ----

def lie(b: Bool) -> Type:
  match b:
    case False{}:
      Unit
    case True{}:
      Empty

def truth(b: Bool) -> Type:
  match b:
    case False{}:
      Empty
    case True{}:
      Unit

law false_true:
  for -A: Type
  for h: {False{} == True{} : Bool}
  A

def false_true(A, h):
  Empty.absurd(A, (%h : lie(_); Unit{}))

law true_false:
  for -A: Type
  for h: {True{} == False{} : Bool}
  A

def true_false(A, h):
  Empty.absurd(A, (%h : truth(_); Unit{}))

law and_l:
  for +a: Bool
  for +b: Bool
  for h: {Bool.and(a, b) == True{} : Bool}
  {a == True{} : Bool}

def and_l(a, b, h):
  match a:
    case False{}:
      false_true({False{} == True{} : Bool}, h)
    case True{}:
      {==}

law and_r:
  for +a: Bool
  for +b: Bool
  for h: {Bool.and(a, b) == True{} : Bool}
  {b == True{} : Bool}

def and_r(a, b, h):
  match a:
    case False{}:
      false_true({b == True{} : Bool}, h)
    case True{}:
      h

law not_true:
  for +a: Bool
  for h: {Bool.not(a) == True{} : Bool}
  {a == False{} : Bool}

def not_true(a, h):
  match a:
    case False{}:
      {==}
    case True{}:
      false_true({True{} == False{} : Bool}, h)

# Movement
# --------

law slide_go_free:
  for fuel: Nat
  for +g: Ice.Grid()
  for +d: Ice.Dir
  for +p: Ice.Pos
  for stop: Bool
  for q: Maybe<&2, Ice.Pos>
  for hp: {Ice.blocked(g, p) == False{} : Bool}
  for hq: {Ice.hits(g, q) == stop : Bool}
  {Ice.blocked(g, Ice.slide.go(fuel, g, d, p, stop, q)) == False{} : Bool}

def slide_go_free(fuel, g, d, p, stop, q, hp, hq):
  match fuel:
    case 0n:
      hp
    case 1n+f:
      match stop:
        case True{}:
          hp
        case False{}:
          match q:
            case None{}:
              hp
            case Some{+n}:
              slide_go_free(f, g, d, n, Ice.hits(g, Ice.next(d, n)), Ice.next(d, n), hq, {==})

def Laws.slide_deterministic(g, d, p, fuel):
  {==}

def Laws.slide_stays_on_ice(g, d, p, fuel, free):
  slide_go_free(fuel, g, d, p, Ice.hits(g, Ice.next(d, p)), Ice.next(d, p), free, {==})

def Laws.replay_stays_on_ice(ms, g, fuel, p, free):
  match ms:
    case Nil{}:
      free
    case Con{d, rest}:
      Laws.replay_stays_on_ice(rest, g, fuel, Ice.slide(g, d, p, fuel),
        Laws.slide_stays_on_ice(g, d, p, fuel, free))

# Nat
# ---

law add_zero:
  for +a: Nat
  {Nat.add(a, 0n) == a : Nat}

def add_zero(a):
  match a:
    case 0n:
      {==}
    case 1n+p:
      %add_zero(p) : {1n+Nat.add(p, 0n) == 1n+_ : Nat}
      {==}

law add_succ:
  for +a: Nat
  for +b: Nat
  {Nat.add(a, 1n+b) == 1n+Nat.add(a, b) : Nat}

def add_succ(a, b):
  match a:
    case 0n:
      {==}
    case 1n+p:
      %add_succ(p, b) : {1n+Nat.add(p, 1n+b) == 1n+_ : Nat}
      {==}

law eq_sound:
  for +a: Nat
  for +b: Nat
  for h: {Nat.is_eq(a, b) == True{} : Bool}
  {a == b : Nat}

def eq_sound(a, b, h):
  match a b:
    case 0n 0n:
      {==}
    case 0n 1n+bp:
      false_true({0n == 1n+bp : Nat}, h)
    case 1n+ap 0n:
      false_true({1n+ap == 0n : Nat}, h)
    case 1n+ap 1n+bp:
      %eq_sound(ap, bp, h) : {1n+ap == 1n+_ : Nat}
      {==}

law le_refl:
  for +a: Nat
  {Nat.is_le(a, a) == True{} : Bool}

def le_refl(a):
  match a:
    case 0n:
      {==}
    case 1n+p:
      le_refl(p)

law le_trans:
  for +a: Nat
  for +b: Nat
  for +c: Nat
  for ab: {Nat.is_le(a, b) == True{} : Bool}
  for bc: {Nat.is_le(b, c) == True{} : Bool}
  {Nat.is_le(a, c) == True{} : Bool}

def le_trans(a, b, c, ab, bc):
  match a b c:
    case 0n _ 0n:
      {==}
    case 0n _ 1n+cp:
      {==}
    case 1n+ap 0n _:
      false_true({Nat.is_le(1n+ap, c) == True{} : Bool}, ab)
    case 1n+ap 1n+bp 0n:
      false_true({Nat.is_le(1n+ap, 0n) == True{} : Bool}, bc)
    case 1n+ap 1n+bp 1n+cp:
      le_trans(ap, bp, cp, ab, bc)

law le_mono:
  for +c: Nat
  for +a: Nat
  for +b: Nat
  for h: {Nat.is_le(a, b) == True{} : Bool}
  {Nat.is_le(Nat.add(c, a), Nat.add(c, b)) == True{} : Bool}

def le_mono(c, a, b, h):
  match c:
    case 0n:
      h
    case 1n+p:
      le_mono(p, a, b, h)

# Certificate
# -----------

law row_ok:
  for +cells: List<&2, Bool>
  for +g: Ice.Grid()
  for +ds: Ice.Dists()
  for +fuel: Nat
  for +x: Nat
  for +y: Nat
  for +j: Nat
  for hc: {Ice.check.row(cells, g, ds, fuel, x, y) == True{} : Bool}
  for hj: {Ice.cell(List.get(&2, Bool, cells, j)) == False{} : Bool}
  {Ice.ok(g, ds, fuel, Ice.Pos{Nat.add(x, j), y}) == True{} : Bool}

def row_ok(cells, g, ds, fuel, x, y, j, hc, hj):
  match cells j:
    case Nil{} _:
      true_false({Ice.ok(g, ds, fuel, Ice.Pos{Nat.add(x, j), y}) == True{} : Bool}, hj)
    case Con{True{}, cs} 0n:
      true_false({Ice.ok(g, ds, fuel, Ice.Pos{Nat.add(x, 0n), y}) == True{} : Bool}, hj)
    case Con{False{}, cs} 0n:
      %Equal.sym(Nat, Nat.add(x, 0n), x, add_zero(x)) :
        {Ice.ok(g, ds, fuel, Ice.Pos{_, y}) == True{} : Bool}
      and_l(Ice.ok(g, ds, fuel, Ice.Pos{x, y}),
        Ice.check.row(cs, g, ds, fuel, 1n+x, y), hc)
    case Con{c, cs} 1n+jp:
      %Equal.sym(Nat, Nat.add(x, 1n+jp), 1n+Nat.add(x, jp), add_succ(x, jp)) :
        {Ice.ok(g, ds, fuel, Ice.Pos{_, y}) == True{} : Bool}
      row_ok(cs, g, ds, fuel, 1n+x, y, jp,
        and_r(Ice.check.cell(c, g, ds, fuel, Ice.Pos{x, y}),
          Ice.check.row(cs, g, ds, fuel, 1n+x, y), hc), hj)

law rows_ok:
  for +rows: Ice.Grid()
  for +g: Ice.Grid()
  for +ds: Ice.Dists()
  for +fuel: Nat
  for +y: Nat
  for +k: Nat
  for +x: Nat
  for hc: {Ice.check.rows(rows, g, ds, fuel, y) == True{} : Bool}
  for hk: {Ice.row(List.get(&2, List<&2, Bool>, rows, k), x) == False{} : Bool}
  {Ice.ok(g, ds, fuel, Ice.Pos{x, Nat.add(y, k)}) == True{} : Bool}

def rows_ok(rows, g, ds, fuel, y, k, x, hc, hk):
  match rows k:
    case Nil{} _:
      true_false({Ice.ok(g, ds, fuel, Ice.Pos{x, Nat.add(y, k)}) == True{} : Bool}, hk)
    case Con{r, rs} 0n:
      %Equal.sym(Nat, Nat.add(y, 0n), y, add_zero(y)) :
        {Ice.ok(g, ds, fuel, Ice.Pos{x, _}) == True{} : Bool}
      row_ok(r, g, ds, fuel, 0n, y, x,
        and_l(Ice.check.row(r, g, ds, fuel, 0n, y),
          Ice.check.rows(rs, g, ds, fuel, 1n+y), hc), hk)
    case Con{r, rs} 1n+kp:
      %Equal.sym(Nat, Nat.add(y, 1n+kp), 1n+Nat.add(y, kp), add_succ(y, kp)) :
        {Ice.ok(g, ds, fuel, Ice.Pos{x, _}) == True{} : Bool}
      rows_ok(rs, g, ds, fuel, 1n+y, kp, x,
        and_r(Ice.check.row(r, g, ds, fuel, 0n, y),
          Ice.check.rows(rs, g, ds, fuel, 1n+y), hc), hk)

law check_at:
  for +g: Ice.Grid()
  for +ds: Ice.Dists()
  for +fuel: Nat
  for +p: Ice.Pos
  for hc: {Ice.check(g, ds, fuel) == True{} : Bool}
  for hp: {Ice.blocked(g, p) == False{} : Bool}
  {Ice.ok(g, ds, fuel, p) == True{} : Bool}

def check_at(g, ds, fuel, p, hc, hp):
  match p:
    case Ice.Pos{x, y}:
      rows_ok(g, g, ds, fuel, 0n, y, x, hc, hp)

law ok_dir:
  for +g: Ice.Grid()
  for +ds: Ice.Dists()
  for +fuel: Nat
  for +p: Ice.Pos
  for +d: Ice.Dir
  for h: {Ice.ok(g, ds, fuel, p) == True{} : Bool}
  {Ice.step_ok(g, ds, fuel, p, d) == True{} : Bool}

def ok_dir(g, ds, fuel, p, d, h):
  match d:
    case Ice.Up{}:
      and_l(Ice.step_ok(g, ds, fuel, p, Ice.Up{}), Ice.ok.rest1(g, ds, fuel, p), h)
    case Ice.Down{}:
      and_l(Ice.step_ok(g, ds, fuel, p, Ice.Down{}), Ice.ok.rest2(g, ds, fuel, p),
        and_r(Ice.step_ok(g, ds, fuel, p, Ice.Up{}), Ice.ok.rest1(g, ds, fuel, p), h))
    case Ice.Left{}:
      and_l(Ice.step_ok(g, ds, fuel, p, Ice.Left{}), Ice.step_ok(g, ds, fuel, p, Ice.Right{}),
        and_r(Ice.step_ok(g, ds, fuel, p, Ice.Down{}), Ice.ok.rest2(g, ds, fuel, p),
          and_r(Ice.step_ok(g, ds, fuel, p, Ice.Up{}), Ice.ok.rest1(g, ds, fuel, p), h)))
    case Ice.Right{}:
      and_r(Ice.step_ok(g, ds, fuel, p, Ice.Left{}), Ice.step_ok(g, ds, fuel, p, Ice.Right{}),
        and_r(Ice.step_ok(g, ds, fuel, p, Ice.Down{}), Ice.ok.rest2(g, ds, fuel, p),
          and_r(Ice.step_ok(g, ds, fuel, p, Ice.Up{}), Ice.ok.rest1(g, ds, fuel, p), h)))

# Along any route the distance grows by at most one per move.
law potential:
  for +ms: List<&2, Ice.Dir>
  for +g: Ice.Grid()
  for +ds: Ice.Dists()
  for +fuel: Nat
  for +s: Ice.Pos
  for +hs: {Ice.blocked(g, s) == False{} : Bool}
  for +hc: {Ice.check(g, ds, fuel) == True{} : Bool}
  {Nat.is_le(Ice.dist(ds, Ice.replay(ms, g, fuel, s)),
    Nat.add(List.length(&2, Ice.Dir, ms), Ice.dist(ds, s))) == True{} : Bool}

def potential(ms, g, ds, fuel, s, hs, hc):
  match ms:
    case Nil{}:
      le_refl(Ice.dist(ds, s))
    case Con{d, rest}:
      %add_succ(List.length(&2, Ice.Dir, rest), Ice.dist(ds, s)) :
        {Nat.is_le(Ice.dist(ds, Ice.replay(rest, g, fuel, Ice.slide(g, d, s, fuel))), _)
          == True{} : Bool}
      le_trans(
        Ice.dist(ds, Ice.replay(rest, g, fuel, Ice.slide(g, d, s, fuel))),
        Nat.add(List.length(&2, Ice.Dir, rest), Ice.dist(ds, Ice.slide(g, d, s, fuel))),
        Nat.add(List.length(&2, Ice.Dir, rest), 1n+Ice.dist(ds, s)),
        potential(rest, g, ds, fuel, Ice.slide(g, d, s, fuel),
          Laws.slide_stays_on_ice(g, d, s, fuel, hs), hc),
        le_mono(List.length(&2, Ice.Dir, rest), Ice.dist(ds, Ice.slide(g, d, s, fuel)),
          1n+Ice.dist(ds, s), ok_dir(g, ds, fuel, s, d, check_at(g, ds, fuel, s, hc, hs))))

law pos_eq_sound:
  for +a: Ice.Pos
  for +b: Ice.Pos
  for +h: {Ice.Pos.eq(a, b) == True{} : Bool}
  {a == b : Ice.Pos}

def pos_eq_sound(a, b, h):
  match a b:
    case Ice.Pos{ax, ay} Ice.Pos{bx, by}:
      %eq_sound(ax, bx, and_l(Nat.is_eq(ax, bx), Nat.is_eq(ay, by), h)) :
        {Ice.Pos{ax, ay} == Ice.Pos{_, by} : Ice.Pos}
      %eq_sound(ay, by, and_r(Nat.is_eq(ax, bx), Nat.is_eq(ay, by), h)) :
        {Ice.Pos{ax, ay} == Ice.Pos{ax, _} : Ice.Pos}
      {==}

law add_zero_at:
  for +n: Nat
  for +z: Nat
  for hz: {z == 0n : Nat}
  {Nat.add(n, z) == n : Nat}

def add_zero_at(n, z, hz):
  %Equal.sym(Nat, z, 0n, hz) : {Nat.add(n, _) == n : Nat}
  add_zero(n)

# Game.valid, one conjunct at a time
# ----------------------------------

def v6(+ds: Ice.Dists(), +e: Ice.Pos, +par: Nat) -> Bool:
  Nat.is_le(par, Ice.dist(ds, e))

def v5(+ds: Ice.Dists(), +e: Ice.Pos, +par: Nat, +sol: List<&2, Ice.Dir>) -> Bool:
  Bool.and(Nat.is_eq(List.length(&2, Ice.Dir, sol), par), v6(ds, e, par))

def v4(+g: Ice.Grid(), +ds: Ice.Dists(), +fuel: Nat, +s: Ice.Pos, +e: Ice.Pos, +par: Nat,
  +sol: List<&2, Ice.Dir>) -> Bool:
  Bool.and(Ice.Pos.eq(Ice.replay(sol, g, fuel, s), e), v5(ds, e, par, sol))

def v3(+g: Ice.Grid(), +ds: Ice.Dists(), +fuel: Nat, +s: Ice.Pos, +e: Ice.Pos, +par: Nat,
  +sol: List<&2, Ice.Dir>) -> Bool:
  Bool.and(Ice.check(g, ds, fuel), v4(g, ds, fuel, s, e, par, sol))

def v2(+g: Ice.Grid(), +ds: Ice.Dists(), +fuel: Nat, +s: Ice.Pos, +e: Ice.Pos, +par: Nat,
  +sol: List<&2, Ice.Dir>) -> Bool:
  Bool.and(Nat.is_eq(Ice.dist(ds, s), 0n), v3(g, ds, fuel, s, e, par, sol))

law valid_v2:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {v2(Ice.Game.grid(gm), Ice.Game.dists(gm), Ice.Game.fuel(gm), Ice.Game.start(gm),
    Ice.Game.exit(gm), Ice.Game.par(gm), Ice.Game.sol(gm)) == True{} : Bool}

def valid_v2(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      and_r(Bool.not(Ice.blocked(g, s)), v2(g, ds, Nat.add(w, h), s, e, par, sol), v)

law valid_start_free:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {Ice.blocked(Ice.Game.grid(gm), Ice.Game.start(gm)) == False{} : Bool}

def valid_start_free(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      not_true(Ice.blocked(g, s),
        and_l(Bool.not(Ice.blocked(g, s)), v2(g, ds, Nat.add(w, h), s, e, par, sol), v))

law valid_start_zero:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {Ice.dist(Ice.Game.dists(gm), Ice.Game.start(gm)) == 0n : Nat}

def valid_start_zero(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      eq_sound(Ice.dist(ds, s), 0n,
        and_l(Nat.is_eq(Ice.dist(ds, s), 0n), v3(g, ds, Nat.add(w, h), s, e, par, sol),
          valid_v2(Ice.Game{w, h, g, s, e, par, sol, ds}, v)))

law valid_v3:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {v3(Ice.Game.grid(gm), Ice.Game.dists(gm), Ice.Game.fuel(gm), Ice.Game.start(gm),
    Ice.Game.exit(gm), Ice.Game.par(gm), Ice.Game.sol(gm)) == True{} : Bool}

def valid_v3(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      and_r(Nat.is_eq(Ice.dist(ds, s), 0n), v3(g, ds, Nat.add(w, h), s, e, par, sol),
        valid_v2(Ice.Game{w, h, g, s, e, par, sol, ds}, v))

law valid_check:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {Ice.check(Ice.Game.grid(gm), Ice.Game.dists(gm), Ice.Game.fuel(gm)) == True{} : Bool}

def valid_check(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      and_l(Ice.check(g, ds, Nat.add(w, h)), v4(g, ds, Nat.add(w, h), s, e, par, sol),
        valid_v3(Ice.Game{w, h, g, s, e, par, sol, ds}, v))

law valid_v4:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {v4(Ice.Game.grid(gm), Ice.Game.dists(gm), Ice.Game.fuel(gm), Ice.Game.start(gm),
    Ice.Game.exit(gm), Ice.Game.par(gm), Ice.Game.sol(gm)) == True{} : Bool}

def valid_v4(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      and_r(Ice.check(g, ds, Nat.add(w, h)), v4(g, ds, Nat.add(w, h), s, e, par, sol),
        valid_v3(Ice.Game{w, h, g, s, e, par, sol, ds}, v))

law valid_reaches:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {Ice.replay(Ice.Game.sol(gm), Ice.Game.grid(gm), Ice.Game.fuel(gm), Ice.Game.start(gm))
    == Ice.Game.exit(gm) : Ice.Pos}

def valid_reaches(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      pos_eq_sound(Ice.replay(sol, g, Nat.add(w, h), s), e,
        and_l(Ice.Pos.eq(Ice.replay(sol, g, Nat.add(w, h), s), e), v5(ds, e, par, sol),
          valid_v4(Ice.Game{w, h, g, s, e, par, sol, ds}, v)))

law valid_v5:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {v5(Ice.Game.dists(gm), Ice.Game.exit(gm), Ice.Game.par(gm), Ice.Game.sol(gm))
    == True{} : Bool}

def valid_v5(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      and_r(Ice.Pos.eq(Ice.replay(sol, g, Nat.add(w, h), s), e), v5(ds, e, par, sol),
        valid_v4(Ice.Game{w, h, g, s, e, par, sol, ds}, v))

law valid_length:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {List.length(&2, Ice.Dir, Ice.Game.sol(gm)) == Ice.Game.par(gm) : Nat}

def valid_length(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      eq_sound(List.length(&2, Ice.Dir, sol), par,
        and_l(Nat.is_eq(List.length(&2, Ice.Dir, sol), par), v6(ds, e, par),
          valid_v5(Ice.Game{w, h, g, s, e, par, sol, ds}, v)))

law valid_par_le:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  {Nat.is_le(Ice.Game.par(gm), Ice.dist(Ice.Game.dists(gm), Ice.Game.exit(gm)))
    == True{} : Bool}

def valid_par_le(gm, v):
  match gm:
    case Ice.Game{w, h, g, s, e, par, sol, ds}:
      and_r(Nat.is_eq(List.length(&2, Ice.Dir, sol), par), v6(ds, e, par),
        valid_v5(Ice.Game{w, h, g, s, e, par, sol, ds}, v))

# Valid games
# -----------

law dist_exit_le:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  for +ms: List<&2, Ice.Dir>
  for reach: {Ice.replay(ms, Ice.Game.grid(gm), Ice.Game.fuel(gm), Ice.Game.start(gm))
    == Ice.Game.exit(gm) : Ice.Pos}
  {Nat.is_le(Ice.dist(Ice.Game.dists(gm), Ice.Game.exit(gm)), List.length(&2, Ice.Dir, ms))
    == True{} : Bool}

def dist_exit_le(gm, v, ms, reach):
  %reach :
    {Nat.is_le(Ice.dist(Ice.Game.dists(gm), _), List.length(&2, Ice.Dir, ms)) == True{} : Bool}
  %add_zero_at(List.length(&2, Ice.Dir, ms), Ice.dist(Ice.Game.dists(gm), Ice.Game.start(gm)),
    valid_start_zero(gm, v)) :
    {Nat.is_le(Ice.dist(Ice.Game.dists(gm),
      Ice.replay(ms, Ice.Game.grid(gm), Ice.Game.fuel(gm), Ice.Game.start(gm))), _)
      == True{} : Bool}
  potential(ms, Ice.Game.grid(gm), Ice.Game.dists(gm), Ice.Game.fuel(gm), Ice.Game.start(gm),
    valid_start_free(gm, v), valid_check(gm, v))

law game_shortest:
  for +gm: Ice.Game
  for +v: {Ice.Game.valid(gm) == True{} : Bool}
  for +ms: List<&2, Ice.Dir>
  for reach: {Ice.replay(ms, Ice.Game.grid(gm), Ice.Game.fuel(gm), Ice.Game.start(gm))
    == Ice.Game.exit(gm) : Ice.Pos}
  {Nat.is_le(Ice.Game.par(gm), List.length(&2, Ice.Dir, ms)) == True{} : Bool}

def game_shortest(gm, v, ms, reach):
  le_trans(Ice.Game.par(gm), Ice.dist(Ice.Game.dists(gm), Ice.Game.exit(gm)),
    List.length(&2, Ice.Dir, ms), valid_par_le(gm, v), dist_exit_le(gm, v, ms, reach))

# The generator
# -------------
# Every Some the search holds was accepted and is regenerated by its seed.

def good(+lo: Nat, +hi: Nat, m: Maybe<&2, Ice.Puzzle>) -> Type:
  match m:
    case None{}:
      Unit
    case Some{+p}:
      {Gen.accept(lo, hi, p) == True{} : Bool} & {Gen.puzzle(hi, Ice.Puzzle.seed(p)) == p : Ice.Puzzle}

law keep_if_good:
  for +lo: Nat
  for +hi: Nat
  for +sd: U32
  for b: Bool
  for hb: {Gen.accept(lo, hi, Gen.puzzle(hi, sd)) == b : Bool}
  good(lo, hi, Gen.keep.if(Gen.puzzle(hi, sd), b))

def keep_if_good(lo, hi, sd, b, hb):
  match b:
    case True{}:
      (hb, {==})
    case False{}:
      Unit{}

law tries_good:
  for k: Nat
  for +lo: Nat
  for +hi: Nat
  for +base: U32
  for +i: Nat
  for +a: U32
  for +m: Maybe<&2, Ice.Puzzle>
  for hm: good(lo, hi, m)
  good(lo, hi, Gen.tries(k, lo, hi, base, i, a, m))

def tries_good(k, lo, hi, base, i, a, m, hm):
  match k:
    case 0n:
      hm
    case 1n+f:
      match m:
        case Some{p}:
          hm
        case None{}:
          tries_good(f, lo, hi, base, i, (a + 1 : U32),
            Gen.keep(lo, hi, Gen.puzzle(hi, Gen.seed(base, i, a))),
            keep_if_good(lo, hi, Gen.seed(base, i, a),
              Gen.accept(lo, hi, Gen.puzzle(hi, Gen.seed(base, i, a))), {==}))

law good_at:
  for +lo: Nat
  for +hi: Nat
  for +m: Maybe<&2, Ice.Puzzle>
  for +p: Ice.Puzzle
  for hm: good(lo, hi, m)
  for h: {m == Some{p} : Maybe<&2, Ice.Puzzle>}
  good(lo, hi, Some{p})

def good_at(lo, hi, m, p, hm, h):
  %h : good(lo, hi, _)
  hm

law emitted_good:
  for +lo: Nat
  for +hi: Nat
  for +base: U32
  for +i: Nat
  for +p: Ice.Puzzle
  for h: {Gen.level(lo, hi, base, i) == Some{p} : Maybe<&2, Ice.Puzzle>}
  good(lo, hi, Some{p})

def emitted_good(lo, hi, base, i, p, h):
  good_at(lo, hi, Gen.level(lo, hi, base, i), p,
    tries_good(1000n, lo, hi, base, i, 0, None{}, Unit{}), h)

law good_accepted:
  for +lo: Nat
  for +hi: Nat
  for +p: Ice.Puzzle
  for hg: good(lo, hi, Some{p})
  {Gen.accept(lo, hi, p) == True{} : Bool}

def good_accepted(lo, hi, p, hg):
  (acc, regen) = hg
  acc

law good_regen:
  for +lo: Nat
  for +hi: Nat
  for +p: Ice.Puzzle
  for hg: good(lo, hi, Some{p})
  {Gen.puzzle(hi, Ice.Puzzle.seed(p)) == p : Ice.Puzzle}

def good_regen(lo, hi, p, hg):
  (acc, regen) = hg
  regen

law emitted_valid:
  for +lo: Nat
  for +hi: Nat
  for +base: U32
  for +i: Nat
  for +p: Ice.Puzzle
  for h: {Gen.level(lo, hi, base, i) == Some{p} : Maybe<&2, Ice.Puzzle>}
  {Ice.Game.valid(Ice.Puzzle.game(p)) == True{} : Bool}

def emitted_valid(lo, hi, base, i, p, h):
  and_r(Bool.and(Nat.is_le(lo, Ice.Game.par(Ice.Puzzle.game(p))),
      Nat.is_le(Ice.Game.par(Ice.Puzzle.game(p)), hi)),
    Ice.Game.valid(Ice.Puzzle.game(p)),
    good_accepted(lo, hi, p, emitted_good(lo, hi, base, i, p, h)))

# Laws
# ----

def Laws.emitted_solvable(lo, hi, base, i, p, h):
  valid_reaches(Ice.Puzzle.game(p), emitted_valid(lo, hi, base, i, p, h))

def Laws.emitted_par_is_solution_length(lo, hi, base, i, p, h):
  valid_length(Ice.Puzzle.game(p), emitted_valid(lo, hi, base, i, p, h))

def Laws.emitted_par_is_shortest(lo, hi, base, i, p, h, ms, reach):
  game_shortest(Ice.Puzzle.game(p), emitted_valid(lo, hi, base, i, p, h), ms, reach)

def Laws.emitted_par_in_range(lo, hi, base, i, p, h):
  and_l(Bool.and(Nat.is_le(lo, Ice.Game.par(Ice.Puzzle.game(p))),
      Nat.is_le(Ice.Game.par(Ice.Puzzle.game(p)), hi)),
    Ice.Game.valid(Ice.Puzzle.game(p)),
    good_accepted(lo, hi, p, emitted_good(lo, hi, base, i, p, h)))

def Laws.same_seed_same_puzzle(hi, seed):
  {==}

def Laws.emitted_seed_regenerates(lo, hi, base, i, p, h):
  good_regen(lo, hi, p, emitted_good(lo, hi, base, i, p, h))
