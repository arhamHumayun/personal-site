import Base

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

law add_zero_at:
  for +n: Nat
  for +z: Nat
  for hz: {z == 0n : Nat}
  {Nat.add(n, z) == n : Nat}

def add_zero_at(n, z, hz):
  %Equal.sym(Nat, z, 0n, hz) : {Nat.add(n, _) == n : Nat}
  add_zero(n)
