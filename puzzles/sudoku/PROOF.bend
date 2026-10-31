import Base
import ./sudoku.bend as S
import ./gen.bend as Gen
import ./LAWS.bend as Laws
import ../lemmas.bend as L

# Maybe
# -----

def mlie(-A: Data, m: Maybe<&2, A>) -> Type:
  match m:
    case None{}:
      Unit
    case Some{x}:
      Empty

law none_some:
  for -A: Data
  for -B: Type
  for -x: A
  for h: {None{} == Some{x} : Maybe<&2, A>}
  B

def none_some(A, B, x, h):
  Empty.absurd(B, (%h : mlie(A, _); Unit{}))

law some_inj:
  for -A: Data
  for +x: A
  for -y: A
  for h: {Some{x} == Some{y} : Maybe<&2, A>}
  {x == y : A}

def some_inj(A, x, y, h):
  Equal.cong(Maybe<&2, A>, A, m => Maybe.default(&2, A, m, x), Some{x}, Some{y}, h)

law is_at_sound:
  for +m: Maybe<&2, Nat>
  for +x: Nat
  for h: {S.is_at(m, x) == True{} : Bool}
  {m == Some{x} : Maybe<&2, Nat>}

def is_at_sound(m, x, h):
  match m:
    case None{}:
      L.false_true({None{} == Some{x} : Maybe<&2, Nat>}, h)
    case Some{y}:
      %L.eq_sound(y, x, h) : {Some{y} == Some{_} : Maybe<&2, Nat>}
      {==}

# Bool and Nat
# ------------

law eq_refl:
  for a: Nat
  {Nat.is_eq(a, a) == True{} : Bool}

def eq_refl(a):
  match a:
    case 0n:
      {==}
    case 1n+p:
      eq_refl(p)

law or_r:
  for a: Bool
  for b: Bool
  for h: {Bool.or(a, b) == True{} : Bool}
  for ha: {a == False{} : Bool}
  {b == True{} : Bool}

def or_r(a, b, h, ha):
  match a:
    case False{}:
      h
    case True{}:
      L.true_false({b == True{} : Bool}, ha)

law or_true:
  for a: Bool
  for b: Bool
  for hb: {b == True{} : Bool}
  {Bool.or(a, b) == True{} : Bool}

def or_true(a, b, hb):
  match a:
    case False{}:
      hb
    case True{}:
      {==}

law and_intro:
  for a: Bool
  for b: Bool
  for ha: {a == True{} : Bool}
  for hb: {b == True{} : Bool}
  {Bool.and(a, b) == True{} : Bool}

def and_intro(a, b, ha, hb):
  match a:
    case False{}:
      L.false_true({Bool.and(False{}, b) == True{} : Bool}, ha)
    case True{}:
      hb

law contra:
  for -A: Type
  for -b: Bool
  for yes: {b == True{} : Bool}
  for no: {b == False{} : Bool}
  A

def contra(A, b, yes, no):
  L.true_false(A, Equal.trans(Bool, True{}, b, False{}, Equal.sym(Bool, b, True{}, yes), no))

law digit_nonzero:
  for +v: Nat
  for h: {S.mem(v, S.digits()) == True{} : Bool}
  {Nat.is_eq(v, 0n) == False{} : Bool}

def digit_nonzero(v, h):
  match v:
    case 0n:
      L.false_true({Nat.is_eq(0n, 0n) == False{} : Bool}, h)
    case 1n+p:
      {==}

# Membership
# ----------

def head_is(xs: List<&2, Nat>, +x: Nat) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{y, rest}:
      Nat.is_eq(y, x)

law find_shift:
  for +y: Nat
  for +rest: List<&2, Nat>
  for +x: Nat
  for r: &p: Nat -> {List.get(&2, Nat, rest, p) == Some{x} : Maybe<&2, Nat>}
  exs p: Nat
  {List.get(&2, Nat, y <> rest, p) == Some{x} : Maybe<&2, Nat>}

def find_shift(y, rest, x, r):
  (p, e) = r
  (1n+p, e)

law find.go:
  for +xs: List<&2, Nat>
  for +x: Nat
  for b: Bool
  for hb: {head_is(xs, x) == b : Bool}
  for h: {S.mem(x, xs) == True{} : Bool}
  exs p: Nat
  {List.get(&2, Nat, xs, p) == Some{x} : Maybe<&2, Nat>}

def find.go(xs, x, b, hb, h):
  match xs:
    case Nil{}:
      L.false_true(&p: Nat -> {List.get(&2, Nat, Nil{}, p) == Some{x} : Maybe<&2, Nat>}, h)
    case Con{y, rest}:
      match b:
        case True{}:
          (0n, (%Equal.sym(Nat, y, x, L.eq_sound(y, x, hb)) :
            {Some{_} == Some{x} : Maybe<&2, Nat>}; {==}))
        case False{}:
          find_shift(y, rest, x, find.go(rest, x, head_is(rest, x), {==},
            (%hb : {Bool.or(_, S.mem(x, rest)) == True{} : Bool}; h)))

law find:
  for +x: Nat
  for +xs: List<&2, Nat>
  for h: {S.mem(x, xs) == True{} : Bool}
  exs p: Nat
  {List.get(&2, Nat, xs, p) == Some{x} : Maybe<&2, Nat>}

def find(x, xs, h):
  find.go(xs, x, head_is(xs, x), {==}, h)

# Unit values
# -----------

law values_get:
  for +g: S.Grid()
  for +u: List<&2, Nat>
  for +q: Nat
  for +j: Nat
  for h: {List.get(&2, Nat, u, q) == Some{j} : Maybe<&2, Nat>}
  {List.get(&2, Nat, S.values(g, u), q) == Some{S.at(g, j)} : Maybe<&2, Nat>}

def values_get(g, u, q, j, h):
  match u q:
    case Nil{} _:
      none_some(Nat, {None{} == Some{S.at(g, j)} : Maybe<&2, Nat>}, j, h)
    case Con{y, rest} 0n:
      %some_inj(Nat, y, j, h) : {Some{S.at(g, y)} == Some{S.at(g, _)} : Maybe<&2, Nat>}
      {==}
    case Con{y, rest} 1n+qp:
      values_get(g, rest, qp, j, h)

law values_get_inv:
  for +g: S.Grid()
  for +u: List<&2, Nat>
  for +q: Nat
  for +v: Nat
  for h: {List.get(&2, Nat, S.values(g, u), q) == Some{v} : Maybe<&2, Nat>}
  exs j: Nat
  {List.get(&2, Nat, u, q) == Some{j} : Maybe<&2, Nat>} & {S.at(g, j) == v : Nat}

def values_get_inv(g, u, q, v, h):
  match u q:
    case Nil{} _:
      none_some(Nat, &j: Nat -> {None{} == Some{j} : Maybe<&2, Nat>} & {S.at(g, j) == v : Nat}, v, h)
    case Con{y, rest} 0n:
      (y, {==}, some_inj(Nat, S.at(g, y), v, h))
    case Con{y, rest} 1n+qp:
      values_get_inv(g, rest, qp, v, h)

# What a solved grid guarantees
# -----------------------------

law in_range_at:
  for +vs: List<&2, Nat>
  for +q: Nat
  for +v: Nat
  for +h: {S.in_range(vs) == True{} : Bool}
  for hq: {List.get(&2, Nat, vs, q) == Some{v} : Maybe<&2, Nat>}
  {S.mem(v, S.digits()) == True{} : Bool}

def in_range_at(vs, q, v, h, hq):
  match vs q:
    case Nil{} _:
      none_some(Nat, {S.mem(v, S.digits()) == True{} : Bool}, v, hq)
    case Con{w, rest} 0n:
      %some_inj(Nat, w, v, hq) : {S.mem(_, S.digits()) == True{} : Bool}
      L.and_l(S.mem(w, S.digits()), S.in_range(rest), h)
    case Con{w, rest} 1n+qp:
      in_range_at(rest, qp, v, L.and_r(S.mem(w, S.digits()), S.in_range(rest), h), hq)

law distinct.row_at:
  for +vs: List<&2, Nat>
  for +a: Nat
  for +p: Nat
  for +q: Nat
  for +j: Nat
  for +b: Nat
  for +h: {S.distinct.row(vs, a, p, q) == True{} : Bool}
  for hj: {List.get(&2, Nat, vs, j) == Some{b} : Maybe<&2, Nat>}
  for hne: {Nat.is_eq(p, Nat.add(q, j)) == False{} : Bool}
  {Bool.not(Nat.is_eq(a, b)) == True{} : Bool}

def distinct.row_at(vs, a, p, q, j, b, h, hj, hne):
  match vs j:
    case Nil{} _:
      none_some(Nat, {Bool.not(Nat.is_eq(a, b)) == True{} : Bool}, b, hj)
    case Con{c, rest} 0n:
      %some_inj(Nat, c, b, hj) : {Bool.not(Nat.is_eq(a, _)) == True{} : Bool}
      or_r(Nat.is_eq(p, q), Bool.not(Nat.is_eq(a, c)),
        L.and_l(Bool.or(Nat.is_eq(p, q), Bool.not(Nat.is_eq(a, c))),
          S.distinct.row(rest, a, p, 1n+q), h),
        (%L.add_zero(q) : {Nat.is_eq(p, _) == False{} : Bool}; hne))
    case Con{c, rest} 1n+jp:
      distinct.row_at(rest, a, p, 1n+q, jp, b,
        L.and_r(Bool.or(Nat.is_eq(p, q), Bool.not(Nat.is_eq(a, c))),
          S.distinct.row(rest, a, p, 1n+q), h),
        hj, (%L.add_succ(q, jp) : {Nat.is_eq(p, _) == False{} : Bool}; hne))

law distinct.go_at:
  for +vs: List<&2, Nat>
  for +all: List<&2, Nat>
  for +p: Nat
  for +i: Nat
  for +a: Nat
  for +h: {S.distinct.go(vs, all, p) == True{} : Bool}
  for hi: {List.get(&2, Nat, vs, i) == Some{a} : Maybe<&2, Nat>}
  {S.distinct.row(all, a, Nat.add(p, i), 0n) == True{} : Bool}

def distinct.go_at(vs, all, p, i, a, h, hi):
  match vs i:
    case Nil{} _:
      none_some(Nat, {S.distinct.row(all, a, Nat.add(p, i), 0n) == True{} : Bool}, a, hi)
    case Con{c, rest} 0n:
      %Equal.sym(Nat, Nat.add(p, 0n), p, L.add_zero(p)) :
        {S.distinct.row(all, a, _, 0n) == True{} : Bool}
      %some_inj(Nat, c, a, hi) : {S.distinct.row(all, _, p, 0n) == True{} : Bool}
      L.and_l(S.distinct.row(all, c, p, 0n), S.distinct.go(rest, all, 1n+p), h)
    case Con{c, rest} 1n+ip:
      %Equal.sym(Nat, Nat.add(p, 1n+ip), 1n+Nat.add(p, ip), L.add_succ(p, ip)) :
        {S.distinct.row(all, a, _, 0n) == True{} : Bool}
      distinct.go_at(rest, all, 1n+p, ip, a,
        L.and_r(S.distinct.row(all, c, p, 0n), S.distinct.go(rest, all, 1n+p), h), hi)

law distinct_at:
  for +vs: List<&2, Nat>
  for +p: Nat
  for +q: Nat
  for +a: Nat
  for +b: Nat
  for h: {S.distinct(vs) == True{} : Bool}
  for hp: {List.get(&2, Nat, vs, p) == Some{a} : Maybe<&2, Nat>}
  for hq: {List.get(&2, Nat, vs, q) == Some{b} : Maybe<&2, Nat>}
  for hne: {Nat.is_eq(p, q) == False{} : Bool}
  {Nat.is_eq(a, b) == False{} : Bool}

def distinct_at(vs, p, q, a, b, h, hp, hq, hne):
  L.not_true(Nat.is_eq(a, b),
    distinct.row_at(vs, a, p, 0n, q, b, distinct.go_at(vs, vs, 0n, p, a, h, hp), hq, hne))

law covers_at:
  for +vs: List<&2, Nat>
  for +ds: List<&2, Nat>
  for +p: Nat
  for +d: Nat
  for +h: {S.covers(vs, ds) == True{} : Bool}
  for hd: {List.get(&2, Nat, ds, p) == Some{d} : Maybe<&2, Nat>}
  {S.mem(d, vs) == True{} : Bool}

def covers_at(vs, ds, p, d, h, hd):
  match ds p:
    case Nil{} _:
      none_some(Nat, {S.mem(d, vs) == True{} : Bool}, d, hd)
    case Con{e, rest} 0n:
      %some_inj(Nat, e, d, hd) : {S.mem(_, vs) == True{} : Bool}
      L.and_l(S.mem(e, vs), S.covers(vs, rest), h)
    case Con{e, rest} 1n+pp:
      covers_at(vs, rest, pp, d, L.and_r(S.mem(e, vs), S.covers(vs, rest), h), hd)

law units_at:
  for +g: S.Grid()
  for +us: List<&2, List<&2, Nat>>
  for +k: Nat
  for +u: List<&2, Nat>
  for +h: {S.all_units(g, us) == True{} : Bool}
  for hk: {List.get(&2, List<&2, Nat>, us, k) == Some{u} : Maybe<&2, List<&2, Nat>>}
  {S.unit_ok(S.values(g, u)) == True{} : Bool}

def units_at(g, us, k, u, h, hk):
  match us k:
    case Nil{} _:
      none_some(List<&2, Nat>, {S.unit_ok(S.values(g, u)) == True{} : Bool}, u, hk)
    case Con{w, rest} 0n:
      %some_inj(List<&2, Nat>, w, u, hk) : {S.unit_ok(S.values(g, _)) == True{} : Bool}
      L.and_l(S.unit_ok(S.values(g, w)), S.all_units(g, rest), h)
    case Con{w, rest} 1n+kp:
      units_at(g, rest, kp, u, L.and_r(S.unit_ok(S.values(g, w)), S.all_units(g, rest), h), hk)

law solved_unit:
  for +g: S.Grid()
  for +k: Nat
  for +u: List<&2, Nat>
  for +hv: {S.solved(g) == True{} : Bool}
  for hk: {List.get(&2, List<&2, Nat>, S.units(), k) == Some{u} : Maybe<&2, List<&2, Nat>>}
  {S.unit_ok(S.values(g, u)) == True{} : Bool}

def solved_unit(g, k, u, hv, hk):
  units_at(g, S.units(), k, u,
    L.and_r(Nat.is_eq(List.length(&2, Nat, g), 81n), S.all_units(g, S.units()), hv), hk)

# Agreeing with a partial grid
# ----------------------------

law agree_at:
  for +g: S.Grid()
  for +p: S.Grid()
  for +k: Nat
  for +h: {S.agrees(g, p) == True{} : Bool}
  for hz: {Nat.is_eq(S.at(p, k), 0n) == False{} : Bool}
  {S.at(g, k) == S.at(p, k) : Nat}

def agree_at(g, p, k, h, hz):
  match g p k:
    case Nil{} Nil{} _:
      L.true_false({S.at(Nil{}, k) == S.at(Nil{}, k) : Nat}, hz)
    case Nil{} Con{y, ps} _:
      L.false_true({S.at(Nil{}, k) == S.at(y <> ps, k) : Nat}, h)
    case Con{x, gs} Nil{} _:
      L.false_true({S.at(x <> gs, k) == S.at(Nil{}, k) : Nat}, h)
    case Con{x, gs} Con{y, ps} 0n:
      Equal.sym(Nat, y, x, L.eq_sound(y, x,
        or_r(Nat.is_eq(y, 0n), Nat.is_eq(y, x),
          L.and_l(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), S.agrees(gs, ps), h), hz)))
    case Con{x, gs} Con{y, ps} 1n+kp:
      agree_at(gs, ps, kp,
        L.and_r(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), S.agrees(gs, ps), h), hz)

law agree_set:
  for +g: S.Grid()
  for +p: S.Grid()
  for +i: Nat
  for +d: Nat
  for +h: {S.agrees(g, p) == True{} : Bool}
  for hd: {S.at(g, i) == d : Nat}
  {S.agrees(g, List.set(&2, Nat, p, i, d)) == True{} : Bool}

def agree_set(g, p, i, d, h, hd):
  match g p i:
    case Nil{} Nil{} _:
      {==}
    case Nil{} Con{y, ps} _:
      L.false_true({S.agrees(Nil{}, List.set(&2, Nat, y <> ps, i, d)) == True{} : Bool}, h)
    case Con{x, gs} Nil{} _:
      L.false_true({S.agrees(x <> gs, Nil{}) == True{} : Bool}, h)
    case Con{x, gs} Con{y, ps} 0n:
      %hd : {Bool.and(Bool.or(Nat.is_eq(_, 0n), Nat.is_eq(_, x)), S.agrees(gs, ps)) == True{} : Bool}
      and_intro(Bool.or(Nat.is_eq(x, 0n), Nat.is_eq(x, x)), S.agrees(gs, ps),
        or_true(Nat.is_eq(x, 0n), Nat.is_eq(x, x), eq_refl(x)),
        L.and_r(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), S.agrees(gs, ps), h))
    case Con{x, gs} Con{y, ps} 1n+ip:
      and_intro(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), S.agrees(gs, List.set(&2, Nat, ps, ip, d)),
        L.and_l(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), S.agrees(gs, ps), h),
        agree_set(gs, ps, ip, d,
          L.and_r(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), S.agrees(gs, ps), h), hd))

law agree_full:
  for +g: S.Grid()
  for +s: S.Grid()
  for +h: {S.agrees(g, s) == True{} : Bool}
  for +hf: {S.full(s) == True{} : Bool}
  {g == s : S.Grid()}

def agree_full(g, s, h, hf):
  match g s:
    case Nil{} Nil{}:
      {==}
    case Nil{} Con{y, ss}:
      L.false_true({Nil{} == y <> ss : S.Grid()}, h)
    case Con{x, gs} Nil{}:
      L.false_true({x <> gs == Nil{} : S.Grid()}, h)
    case Con{x, gs} Con{y, ss}:
      %agree_full(gs, ss,
        L.and_r(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), S.agrees(gs, ss), h),
        L.and_r(Bool.not(Nat.is_eq(y, 0n)), S.full(ss), hf)) :
        {x <> gs == y <> _ : S.Grid()}
      %Equal.sym(Nat, y, x, L.eq_sound(y, x, or_r(Nat.is_eq(y, 0n), Nat.is_eq(y, x),
        L.and_l(Bool.or(Nat.is_eq(y, 0n), Nat.is_eq(y, x)), S.agrees(gs, ss), h),
        L.not_true(Nat.is_eq(y, 0n), L.and_l(Bool.not(Nat.is_eq(y, 0n)), S.full(ss), hf))))) :
        {x <> gs == _ <> gs : S.Grid()}
      {==}

law same_sound:
  for +a: S.Grid()
  for +b: S.Grid()
  for +h: {S.same(a, b) == True{} : Bool}
  {a == b : S.Grid()}

def same_sound(a, b, h):
  match a b:
    case Nil{} Nil{}:
      {==}
    case Nil{} Con{y, ys}:
      L.false_true({Nil{} == y <> ys : S.Grid()}, h)
    case Con{x, xs} Nil{}:
      L.false_true({x <> xs == Nil{} : S.Grid()}, h)
    case Con{x, xs} Con{y, ys}:
      %same_sound(xs, ys, L.and_r(Nat.is_eq(x, y), S.same(xs, ys), h)) :
        {x <> xs == y <> _ : S.Grid()}
      %L.eq_sound(x, y, L.and_l(Nat.is_eq(x, y), S.same(xs, ys), h)) :
        {x <> xs == _ <> xs : S.Grid()}
      {==}

# Why each step is forced
# -----------------------

# A witness rules e out for x: x shares a unit with a cell that already
# shows e, and a solution never repeats a digit inside a unit.
law wit.k:
  for +g: S.Grid()
  for +p: S.Grid()
  for +x: Nat
  for +e: Nat
  for +px: Nat
  for +pk: Nat
  for +unit: List<&2, Nat>
  for +hunit: {S.unit_ok(S.values(g, unit)) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +he: {S.mem(e, S.digits()) == True{} : Bool}
  for hx: {List.get(&2, Nat, unit, px) == Some{x} : Maybe<&2, Nat>}
  for hne: {Nat.is_eq(px, pk) == False{} : Bool}
  for r: &k: Nat -> {List.get(&2, Nat, unit, pk) == Some{k} : Maybe<&2, Nat>} & {S.at(p, k) == e : Nat}
  {Nat.is_eq(S.at(g, x), e) == False{} : Bool}

def wit.k(g, p, x, e, px, pk, unit, hunit, ha, he, hx, hne, r):
  (+k, hk, +hpk) = r
  +vals = S.values(g, unit)
  %Equal.trans(Nat, S.at(g, k), S.at(p, k), e,
    agree_at(g, p, k, ha,
      (%Equal.sym(Nat, S.at(p, k), e, hpk) : {Nat.is_eq(_, 0n) == False{} : Bool};
        digit_nonzero(e, he))),
    hpk) : {Nat.is_eq(S.at(g, x), _) == False{} : Bool}
  distinct_at(vals, px, pk, S.at(g, x), S.at(g, k),
    L.and_l(S.distinct(vals), S.covers(vals, S.digits()),
      L.and_r(S.in_range(vals), Bool.and(S.distinct(vals), S.covers(vals, S.digits())), hunit)),
    values_get(g, unit, px, x, hx), values_get(g, unit, pk, k, hk), hne)

law wit.on_sound:
  for +g: S.Grid()
  for +p: S.Grid()
  for +x: Nat
  for +e: Nat
  for +u: Nat
  for +px: Nat
  for +pk: Nat
  for +m: Maybe<&2, List<&2, Nat>>
  for hm: {List.get(&2, List<&2, Nat>, S.units(), u) == m : Maybe<&2, List<&2, Nat>>}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +he: {S.mem(e, S.digits()) == True{} : Bool}
  for +h: {S.wit.on(m, p, x, e, px, pk) == True{} : Bool}
  {Nat.is_eq(S.at(g, x), e) == False{} : Bool}

def wit.on_sound(g, p, x, e, u, px, pk, m, hm, hv, ha, he, h):
  match m:
    case None{}:
      L.false_true({Nat.is_eq(S.at(g, x), e) == False{} : Bool}, h)
    case Some{unit}:
      +tail = {Bool.and(Bool.not(Nat.is_eq(px, pk)),
        S.is_at(List.get(&2, Nat, S.values(p, unit), pk), e)) : Bool}
      +rest = L.and_r(S.is_at(List.get(&2, Nat, unit, px), x), tail, h)
      wit.k(g, p, x, e, px, pk, unit, solved_unit(g, u, unit, hv, hm), ha, he,
        is_at_sound(List.get(&2, Nat, unit, px), x,
          L.and_l(S.is_at(List.get(&2, Nat, unit, px), x), tail, h)),
        L.not_true(Nat.is_eq(px, pk),
          L.and_l(Bool.not(Nat.is_eq(px, pk)),
            S.is_at(List.get(&2, Nat, S.values(p, unit), pk), e), rest)),
        values_get_inv(p, unit, pk, e,
          is_at_sound(List.get(&2, Nat, S.values(p, unit), pk), e,
            L.and_r(Bool.not(Nat.is_eq(px, pk)),
              S.is_at(List.get(&2, Nat, S.values(p, unit), pk), e), rest))))

law wit_sound:
  for +g: S.Grid()
  for +p: S.Grid()
  for +x: Nat
  for +e: Nat
  for +w: S.Wit
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +he: {S.mem(e, S.digits()) == True{} : Bool}
  for +h: {S.wit.ok(w, p, x, e) == True{} : Bool}
  {Nat.is_eq(S.at(g, x), e) == False{} : Bool}

def wit_sound(g, p, x, e, w, hv, ha, he, h):
  match w:
    case S.Wit{u, px, pk}:
      wit.on_sound(g, p, x, e, u, px, pk, List.get(&2, List<&2, Nat>, S.units(), u), {==},
        hv, ha, he, h)

# Naked single
# ------------

def wdef(m: Maybe<&2, S.Wit>) -> S.Wit:
  Maybe.default(&2, S.Wit, m, S.Wit{0n, 0n, 0n})

law naked.wits_at:
  for +ds: List<&2, Nat>
  for +ws: List<&2, S.Wit>
  for +p: S.Grid()
  for +i: Nat
  for +d: Nat
  for +q: Nat
  for +e: Nat
  for +h: {S.naked.wits(ds, ws, p, i, d) == True{} : Bool}
  for hq: {List.get(&2, Nat, ds, q) == Some{e} : Maybe<&2, Nat>}
  {Bool.or(Nat.is_eq(e, d), S.wit.ok(wdef(List.get(&2, S.Wit, ws, q)), p, i, e)) == True{} : Bool}

def naked.wits_at(ds, ws, p, i, d, q, e, h, hq):
  match ds ws q:
    case Nil{} Nil{} _:
      none_some(Nat, {Bool.or(Nat.is_eq(e, d), S.wit.ok(wdef(None{}), p, i, e)) == True{} : Bool}, e, hq)
    case Nil{} Con{w, wrest} _:
      L.false_true({Bool.or(Nat.is_eq(e, d), S.wit.ok(wdef(List.get(&2, S.Wit, w <> wrest, q)), p, i, e))
        == True{} : Bool}, h)
    case Con{f, drest} Nil{} _:
      L.false_true({Bool.or(Nat.is_eq(e, d), S.wit.ok(wdef(None{}), p, i, e)) == True{} : Bool}, h)
    case Con{f, drest} Con{w, wrest} 0n:
      %some_inj(Nat, f, e, hq) :
        {Bool.or(Nat.is_eq(_, d), S.wit.ok(w, p, i, _)) == True{} : Bool}
      L.and_l(Bool.or(Nat.is_eq(f, d), S.wit.ok(w, p, i, f)), S.naked.wits(drest, wrest, p, i, d), h)
    case Con{f, drest} Con{w, wrest} 1n+qp:
      naked.wits_at(drest, wrest, p, i, d, qp, e,
        L.and_r(Bool.or(Nat.is_eq(f, d), S.wit.ok(w, p, i, f)), S.naked.wits(drest, wrest, p, i, d), h),
        hq)

law naked.case:
  for +g: S.Grid()
  for +p: S.Grid()
  for +i: Nat
  for +d: Nat
  for +w: S.Wit
  for b: Bool
  for hb: {Nat.is_eq(S.at(g, i), d) == b : Bool}
  for +h: {Bool.or(b, S.wit.ok(w, p, i, S.at(g, i))) == True{} : Bool}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +hm: {S.mem(S.at(g, i), S.digits()) == True{} : Bool}
  {S.at(g, i) == d : Nat}

def naked.case(g, p, i, d, w, b, hb, h, hv, ha, hm):
  match b:
    case True{}:
      L.eq_sound(S.at(g, i), d, hb)
    case False{}:
      contra({S.at(g, i) == d : Nat}, Nat.is_eq(S.at(g, i), S.at(g, i)), eq_refl(S.at(g, i)),
        wit_sound(g, p, i, S.at(g, i), w, hv, ha, hm, h))

law naked.k:
  for +g: S.Grid()
  for +p: S.Grid()
  for +i: Nat
  for +d: Nat
  for +wits: List<&2, S.Wit>
  for +hw: {S.naked.wits(S.digits(), wits, p, i, d) == True{} : Bool}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +hm: {S.mem(S.at(g, i), S.digits()) == True{} : Bool}
  for r: &q: Nat -> {List.get(&2, Nat, S.digits(), q) == Some{S.at(g, i)} : Maybe<&2, Nat>}
  {S.at(g, i) == d : Nat}

def naked.k(g, p, i, d, wits, hw, hv, ha, hm, r):
  (+q, hq) = r
  +w = wdef(List.get(&2, S.Wit, wits, q))
  naked.case(g, p, i, d, w, Nat.is_eq(S.at(g, i), d), {==},
    naked.wits_at(S.digits(), wits, p, i, d, q, S.at(g, i), hw, hq), hv, ha, hm)

law naked.on_sound:
  for +g: S.Grid()
  for +p: S.Grid()
  for +i: Nat
  for +d: Nat
  for +hp: Nat
  for +wits: List<&2, S.Wit>
  for +home: Nat
  for +m: Maybe<&2, List<&2, Nat>>
  for hm: {List.get(&2, List<&2, Nat>, S.units(), home) == m : Maybe<&2, List<&2, Nat>>}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +h: {S.naked.on(m, p, i, d, hp, wits) == True{} : Bool}
  {S.at(g, i) == d : Nat}

def naked.on_sound(g, p, i, d, hp, wits, home, m, hm, hv, ha, h):
  match m:
    case None{}:
      L.false_true({S.at(g, i) == d : Nat}, h)
    case Some{unit}:
      +vals = S.values(g, unit)
      +hw = L.and_r(S.is_at(List.get(&2, Nat, unit, hp), i), S.naked.wits(S.digits(), wits, p, i, d), h)
      +mv = in_range_at(vals, hp, S.at(g, i),
        L.and_l(S.in_range(vals), Bool.and(S.distinct(vals), S.covers(vals, S.digits())),
          solved_unit(g, home, unit, hv, hm)),
        values_get(g, unit, hp, i,
          is_at_sound(List.get(&2, Nat, unit, hp), i,
            L.and_l(S.is_at(List.get(&2, Nat, unit, hp), i), S.naked.wits(S.digits(), wits, p, i, d), h))))
      naked.k(g, p, i, d, wits, hw, hv, ha, mv, find(S.at(g, i), S.digits(), mv))

# Hidden single
# -------------

def xdef(m: Maybe<&2, S.Excl>) -> S.Excl:
  Maybe.default(&2, S.Excl, m, S.Filled{})

law hidden.cells_at:
  for +cells: List<&2, Nat>
  for +xs: List<&2, S.Excl>
  for +p: S.Grid()
  for +pi: Nat
  for +d: Nat
  for +q0: Nat
  for +q: Nat
  for +j: Nat
  for +h: {S.hidden.cells(cells, xs, p, pi, d, q0) == True{} : Bool}
  for hj: {List.get(&2, Nat, cells, q) == Some{j} : Maybe<&2, Nat>}
  {S.excl.ok(xdef(List.get(&2, S.Excl, xs, q)), p, Nat.add(q0, q), pi, j, d) == True{} : Bool}

def hidden.cells_at(cells, xs, p, pi, d, q0, q, j, h, hj):
  match cells xs q:
    case Nil{} Nil{} _:
      none_some(Nat, {S.excl.ok(xdef(None{}), p, Nat.add(q0, q), pi, j, d) == True{} : Bool}, j, hj)
    case Nil{} Con{x, rest} _:
      L.false_true({S.excl.ok(xdef(List.get(&2, S.Excl, x <> rest, q)), p, Nat.add(q0, q), pi, j, d)
        == True{} : Bool}, h)
    case Con{c, cs} Nil{} _:
      L.false_true({S.excl.ok(xdef(None{}), p, Nat.add(q0, q), pi, j, d) == True{} : Bool}, h)
    case Con{c, cs} Con{x, rest} 0n:
      %Equal.sym(Nat, Nat.add(q0, 0n), q0, L.add_zero(q0)) :
        {S.excl.ok(x, p, _, pi, j, d) == True{} : Bool}
      %some_inj(Nat, c, j, hj) : {S.excl.ok(x, p, q0, pi, _, d) == True{} : Bool}
      L.and_l(S.excl.ok(x, p, q0, pi, c, d), S.hidden.cells(cs, rest, p, pi, d, 1n+q0), h)
    case Con{c, cs} Con{x, rest} 1n+qp:
      %Equal.sym(Nat, Nat.add(q0, 1n+qp), 1n+Nat.add(q0, qp), L.add_succ(q0, qp)) :
        {S.excl.ok(xdef(List.get(&2, S.Excl, rest, qp)), p, _, pi, j, d) == True{} : Bool}
      hidden.cells_at(cs, rest, p, pi, d, 1n+q0, qp, j,
        L.and_r(S.excl.ok(x, p, q0, pi, c, d), S.hidden.cells(cs, rest, p, pi, d, 1n+q0), h), hj)

# The cell j that holds d in the solution is either i itself, or was ruled
# out, which can't be.
law excl_sound:
  for +g: S.Grid()
  for +p: S.Grid()
  for +unit: List<&2, Nat>
  for +i: Nat
  for +d: Nat
  for +q: Nat
  for +pi: Nat
  for +j: Nat
  for +x: S.Excl
  for +hx: {S.excl.ok(x, p, q, pi, j, d) == True{} : Bool}
  for +hqj: {List.get(&2, Nat, unit, q) == Some{j} : Maybe<&2, Nat>}
  for +hpi: {List.get(&2, Nat, unit, pi) == Some{i} : Maybe<&2, Nat>}
  for +hgj: {S.at(g, j) == d : Nat}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +hd: {S.mem(d, S.digits()) == True{} : Bool}
  {S.at(g, i) == d : Nat}

def excl_sound(g, p, unit, i, d, q, pi, j, x, hx, hqj, hpi, hgj, hv, ha, hd):
  match x:
    case S.Itself{}:
      %some_inj(Nat, j, i,
        Equal.trans(Maybe<&2, Nat>, Some{j}, List.get(&2, Nat, unit, q), Some{i},
          Equal.sym(Maybe<&2, Nat>, List.get(&2, Nat, unit, q), Some{j}, hqj),
          (%Equal.sym(Nat, q, pi, L.eq_sound(q, pi, hx)) :
            {List.get(&2, Nat, unit, _) == Some{i} : Maybe<&2, Nat>}; hpi))) :
        {S.at(g, _) == d : Nat}
      hgj
    case S.Filled{}:
      +shows = {Equal.trans(Nat, S.at(p, j), S.at(g, j), d,
        Equal.sym(Nat, S.at(g, j), S.at(p, j),
          agree_at(g, p, j, ha, L.not_true(Nat.is_eq(S.at(p, j), 0n),
            L.and_l(Bool.not(Nat.is_eq(S.at(p, j), 0n)), Bool.not(Nat.is_eq(S.at(p, j), d)), hx)))),
        hgj) : {S.at(p, j) == d : Nat}}
      contra({S.at(g, i) == d : Nat}, Nat.is_eq(S.at(p, j), d),
        (%Equal.sym(Nat, S.at(p, j), d, shows) : {Nat.is_eq(_, d) == True{} : Bool}; eq_refl(d)),
        L.not_true(Nat.is_eq(S.at(p, j), d),
          L.and_r(Bool.not(Nat.is_eq(S.at(p, j), 0n)), Bool.not(Nat.is_eq(S.at(p, j), d)), hx)))
    case S.Peer{w}:
      contra({S.at(g, i) == d : Nat}, Nat.is_eq(S.at(g, j), d),
        (%Equal.sym(Nat, S.at(g, j), d, hgj) : {Nat.is_eq(_, d) == True{} : Bool}; eq_refl(d)),
        wit_sound(g, p, j, d, w, hv, ha, hd, hx))

law hidden.k3:
  for +g: S.Grid()
  for +p: S.Grid()
  for +unit: List<&2, Nat>
  for +i: Nat
  for +d: Nat
  for +pi: Nat
  for +excl: List<&2, S.Excl>
  for +hc: {S.hidden.cells(unit, excl, p, pi, d, 0n) == True{} : Bool}
  for +hpi: {List.get(&2, Nat, unit, pi) == Some{i} : Maybe<&2, Nat>}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +hd: {S.mem(d, S.digits()) == True{} : Bool}
  for +q: Nat
  for r: &j: Nat -> {List.get(&2, Nat, unit, q) == Some{j} : Maybe<&2, Nat>} & {S.at(g, j) == d : Nat}
  {S.at(g, i) == d : Nat}

def hidden.k3(g, p, unit, i, d, pi, excl, hc, hpi, hv, ha, hd, q, r):
  (+j, +hqj, hgj) = r
  excl_sound(g, p, unit, i, d, q, pi, j, xdef(List.get(&2, S.Excl, excl, q)),
    hidden.cells_at(unit, excl, p, pi, d, 0n, q, j, hc, hqj), hqj, hpi, hgj, hv, ha, hd)

law hidden.k2:
  for +g: S.Grid()
  for +p: S.Grid()
  for +unit: List<&2, Nat>
  for +i: Nat
  for +d: Nat
  for +pi: Nat
  for +excl: List<&2, S.Excl>
  for +hc: {S.hidden.cells(unit, excl, p, pi, d, 0n) == True{} : Bool}
  for +hpi: {List.get(&2, Nat, unit, pi) == Some{i} : Maybe<&2, Nat>}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +hd: {S.mem(d, S.digits()) == True{} : Bool}
  for r: &q: Nat -> {List.get(&2, Nat, S.values(g, unit), q) == Some{d} : Maybe<&2, Nat>}
  {S.at(g, i) == d : Nat}

def hidden.k2(g, p, unit, i, d, pi, excl, hc, hpi, hv, ha, hd, r):
  (+q, hq) = r
  hidden.k3(g, p, unit, i, d, pi, excl, hc, hpi, hv, ha, hd, q, values_get_inv(g, unit, q, d, hq))

law hidden.k1:
  for +g: S.Grid()
  for +p: S.Grid()
  for +unit: List<&2, Nat>
  for +i: Nat
  for +d: Nat
  for +pi: Nat
  for +excl: List<&2, S.Excl>
  for +hc: {S.hidden.cells(unit, excl, p, pi, d, 0n) == True{} : Bool}
  for +hpi: {List.get(&2, Nat, unit, pi) == Some{i} : Maybe<&2, Nat>}
  for +hcov: {S.covers(S.values(g, unit), S.digits()) == True{} : Bool}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +hd: {S.mem(d, S.digits()) == True{} : Bool}
  for r: &pd: Nat -> {List.get(&2, Nat, S.digits(), pd) == Some{d} : Maybe<&2, Nat>}
  {S.at(g, i) == d : Nat}

def hidden.k1(g, p, unit, i, d, pi, excl, hc, hpi, hcov, hv, ha, hd, r):
  (+pd, hpd) = r
  +hin = covers_at(S.values(g, unit), S.digits(), pd, d, hcov, hpd)
  hidden.k2(g, p, unit, i, d, pi, excl, hc, hpi, hv, ha, hd, find(d, S.values(g, unit), hin))

law hidden.on_sound:
  for +g: S.Grid()
  for +p: S.Grid()
  for +i: Nat
  for +d: Nat
  for +pi: Nat
  for +excl: List<&2, S.Excl>
  for +u: Nat
  for +m: Maybe<&2, List<&2, Nat>>
  for hm: {List.get(&2, List<&2, Nat>, S.units(), u) == m : Maybe<&2, List<&2, Nat>>}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +hd: {S.mem(d, S.digits()) == True{} : Bool}
  for +h: {S.hidden.on(m, p, i, d, pi, excl) == True{} : Bool}
  {S.at(g, i) == d : Nat}

def hidden.on_sound(g, p, i, d, pi, excl, u, m, hm, hv, ha, hd, h):
  match m:
    case None{}:
      L.false_true({S.at(g, i) == d : Nat}, h)
    case Some{unit}:
      +vals = S.values(g, unit)
      +hcov = L.and_r(S.distinct(vals), S.covers(vals, S.digits()),
        L.and_r(S.in_range(vals), Bool.and(S.distinct(vals), S.covers(vals, S.digits())),
          solved_unit(g, u, unit, hv, hm)))
      hidden.k1(g, p, unit, i, d, pi, excl,
        L.and_r(S.is_at(List.get(&2, Nat, unit, pi), i), S.hidden.cells(unit, excl, p, pi, d, 0n), h),
        is_at_sound(List.get(&2, Nat, unit, pi), i,
          L.and_l(S.is_at(List.get(&2, Nat, unit, pi), i), S.hidden.cells(unit, excl, p, pi, d, 0n), h)),
        hcov, hv, ha, hd, find(d, S.digits(), hd))

# The whole certificate
# ---------------------

law step_sound:
  for +g: S.Grid()
  for +p: S.Grid()
  for +s: S.Step
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +h: {S.step.ok(s, p) == True{} : Bool}
  {S.at(g, S.step.cell(s)) == S.step.digit(s) : Nat}

def step_sound(g, p, s, hv, ha, h):
  match s:
    case S.Naked{i, d, home, hp, wits}:
      +m = List.get(&2, List<&2, Nat>, S.units(), home)
      naked.on_sound(g, p, i, d, hp, wits, home, m, {==}, hv, ha,
        L.and_r(S.mem(d, S.digits()), S.naked.on(m, p, i, d, hp, wits), h))
    case S.Hidden{i, d, u, pi, excl}:
      +m = List.get(&2, List<&2, Nat>, S.units(), u)
      hidden.on_sound(g, p, i, d, pi, excl, u, m, {==}, hv, ha,
        L.and_l(S.mem(d, S.digits()), S.hidden.on(m, p, i, d, pi, excl), h),
        L.and_r(S.mem(d, S.digits()), S.hidden.on(m, p, i, d, pi, excl), h))

law replay_ok:
  for +steps: List<&2, S.Step>
  for ok: Bool
  for +p: S.Grid()
  for +f: S.Grid()
  for h: {S.replay(steps, ok, p) == Some{f} : Maybe<&2, S.Grid()>}
  {ok == True{} : Bool}

def replay_ok(steps, ok, p, f, h):
  match steps:
    case Nil{}:
      match ok:
        case True{}:
          {==}
        case False{}:
          none_some(S.Grid(), {False{} == True{} : Bool}, f, h)
    case Con{s, rest}:
      match ok:
        case True{}:
          {==}
        case False{}:
          none_some(S.Grid(), {False{} == True{} : Bool}, f, h)

# Each forced step keeps any solution in agreement with the partial grid.
law replay_sound:
  for +g: S.Grid()
  for +steps: List<&2, S.Step>
  for +p: S.Grid()
  for +f: S.Grid()
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  for +h: {S.replay(steps, True{}, p) == Some{f} : Maybe<&2, S.Grid()>}
  {S.agrees(g, f) == True{} : Bool}

def replay_sound(g, steps, p, f, hv, ha, h):
  match steps:
    case Nil{}:
      %some_inj(S.Grid(), p, f, h) : {S.agrees(g, _) == True{} : Bool}
      ha
    case Con{+s, rest}:
      +stepped = replay_ok(rest, S.step.ok(s, p), S.place(p, s), f, h)
      replay_sound(g, rest, S.place(p, s), f, hv,
        agree_set(g, p, S.step.cell(s), S.step.digit(s), ha, step_sound(g, p, s, hv, ha, stepped)),
        (%stepped : {S.replay(rest, _, S.place(p, s)) == Some{f} : Maybe<&2, S.Grid()>}; h))

law unique.k:
  for +g: S.Grid()
  for +p: S.Grid()
  for +s: S.Grid()
  for +steps: List<&2, S.Step>
  for +m: Maybe<&2, S.Grid()>
  for hm: {S.replay(steps, True{}, p) == m : Maybe<&2, S.Grid()>}
  for +hr: {S.reaches(m, s) == True{} : Bool}
  for +hf: {S.full(s) == True{} : Bool}
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, p) == True{} : Bool}
  {g == s : S.Grid()}

def unique.k(g, p, s, steps, m, hm, hr, hf, hv, ha):
  match m:
    case None{}:
      L.false_true({g == s : S.Grid()}, hr)
    case Some{f}:
      agree_full(g, s,
        (%same_sound(f, s, hr) : {S.agrees(g, _) == True{} : Bool};
          replay_sound(g, steps, p, f, hv, ha, hm)),
        hf)

law game_unique:
  for +gm: S.Game
  for +v: {S.Game.valid(gm) == True{} : Bool}
  for +g: S.Grid()
  for +hv: {S.solved(g) == True{} : Bool}
  for +ha: {S.agrees(g, S.Game.puzzle(gm)) == True{} : Bool}
  {g == S.Game.solution(gm) : S.Grid()}

def game_unique(gm, v, g, hv, ha):
  match gm:
    case S.Game{p, s, steps}:
      +reach = S.reaches(S.replay(steps, True{}, p), s)
      +rest = L.and_r(S.solved(s), Bool.and(S.full(s), Bool.and(S.agrees(s, p), reach)), v)
      +rest2 = L.and_r(S.full(s), Bool.and(S.agrees(s, p), reach), rest)
      unique.k(g, p, s, steps, S.replay(steps, True{}, p), {==},
        L.and_r(S.agrees(s, p), reach, rest2),
        L.and_l(S.full(s), Bool.and(S.agrees(s, p), reach), rest),
        hv, ha)

law valid_solved:
  for +gm: S.Game
  for +v: {S.Game.valid(gm) == True{} : Bool}
  {S.solved(S.Game.solution(gm)) == True{} : Bool}

def valid_solved(gm, v):
  match gm:
    case S.Game{p, s, steps}:
      L.and_l(S.solved(s), Bool.and(S.full(s), Bool.and(S.agrees(s, p),
        S.reaches(S.replay(steps, True{}, p), s))), v)

law valid_agrees:
  for +gm: S.Game
  for +v: {S.Game.valid(gm) == True{} : Bool}
  {S.agrees(S.Game.solution(gm), S.Game.puzzle(gm)) == True{} : Bool}

def valid_agrees(gm, v):
  match gm:
    case S.Game{p, s, steps}:
      +reach = S.reaches(S.replay(steps, True{}, p), s)
      L.and_l(S.agrees(s, p), reach,
        L.and_r(S.full(s), Bool.and(S.agrees(s, p), reach),
          L.and_r(S.solved(s), Bool.and(S.full(s), Bool.and(S.agrees(s, p), reach)), v)))

# The generator
# -------------

law keep_some:
  for +gm: S.Game
  for +out: S.Game
  for b: Bool
  for hb: {S.Game.valid(gm) == b : Bool}
  for h: {Gen.keep.if(gm, b) == Some{out} : Maybe<&2, S.Game>}
  {S.Game.valid(out) == True{} : Bool}

def keep_some(gm, out, b, hb, h):
  match b:
    case True{}:
      %some_inj(S.Game, gm, out, h) : {S.Game.valid(_) == True{} : Bool}
      hb
    case False{}:
      none_some(S.Game, {S.Game.valid(out) == True{} : Bool}, out, h)

law keep_valid:
  for +g: S.Game
  for +gm: S.Game
  for h: {Gen.keep(g) == Some{gm} : Maybe<&2, S.Game>}
  {S.Game.valid(gm) == True{} : Bool}

def keep_valid(g, gm, h):
  keep_some(g, gm, S.Game.valid(g), {==}, h)

law emitted_valid:
  for +clues: Nat
  for +seed: U32
  for +gm: S.Game
  for h: {Gen.keep(Gen.game(clues, seed)) == Some{gm} : Maybe<&2, S.Game>}
  {S.Game.valid(gm) == True{} : Bool}

def emitted_valid(clues, seed, gm, h):
  keep_valid(Gen.game(clues, seed), gm, h)

# Laws
# ----

def Laws.solution_solved(clues, seed, gm, h):
  valid_solved(gm, emitted_valid(clues, seed, gm, h))

def Laws.solution_keeps_clues(clues, seed, gm, h):
  valid_agrees(gm, emitted_valid(clues, seed, gm, h))

def Laws.unique_solution(clues, seed, gm, h, g, hv, ha):
  game_unique(gm, emitted_valid(clues, seed, gm, h), g, hv, ha)

def Laws.same_seed_same_puzzle(clues, seed):
  {==}
