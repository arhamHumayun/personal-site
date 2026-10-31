function word_to_u32(w) {
  let x = 0;
  for (let i = 0; w.$ === "WCon"; i++) {
    x |= Number(w.head) << i;
    w = w.tail;
  }
  return x >>> 0;
}

function u32_to_word(x) {
  let w = {$: "WNil"};
  for (let i = 31; i >= 0; i--) {
    w = {$: "WCon", head: ((x >>> i) & 1) === 1, tail: w};
  }
  return w;
}

function cmp_new(a, b) {
  return {$: a < b ? "LT" : a === b ? "EQ" : "GT"};
}

function nat_divmod(a, b) {
  return b === 0 ? {$: "Tuple", fst: 0, snd: a}
    : {$: "Tuple", fst: Math.trunc(a / b), snd: a % b};
}

function nat_chk(n) {
  if (n > 281474976710655) {
    throw "bend: a Nat past the largest immediate 2^48-1";
  }
  return n;
}

function nat_in(n) {
  if (!Number.isInteger(n) || n < 0 || n > 2 ** 53) {
    throw "bend: expected a Nat host number: an integer from 0 to 2^53";
  }
  return n;
}

function f32_show(x) {
  let s = "nan";
  for (let p = 1; x === x && p <= 9 && f32_round(s) !== x; p += 1) {
    s = String(Number(x.toExponential(p - 1)));
  }
  return (Object.is(x, -0) ? "-0" : s).replace("Infinity", "inf");
}

function f32_bits(x) {
  return new Uint32Array(new Float32Array([x]).buffer)[0];
}

function f32_from_bits(u) {
  return new Float32Array(new Uint32Array([u]).buffer)[0];
}

function f32_read(s) {
  const re = /^[\t\n\v\f\r ]*[+-]?((\d+(?:\.\d*)?|\.\d+)(e[+-]?\d+)?|inf(inity)?|nan)$/i;
  const v = f32_round(s.replace(/inf\w*/i, "Infinity"));
  return re.test(s) ? {$: "Some", value: v} : {$: "None"};
}

const f32_round = function f32_round(s) {
  const d = Number(s);
  const a = Math.abs(d);
  const f = Math.fround(a);
  const g = 2 * a - Math.min(f, 2 ** 128);
  if (g === f || Math.fround(g) !== g || g === Infinity) {
    return Math.sign(d) * f;
  }
  let k = 0;
  while (a * 2 ** k % 1 !== 0) {
    k += 1;
  }
  const [, i, r, e] = /(\d*)\.?(\d*)(?:e([+-]?\d+))?$/i.exec(s);
  const n = Number(e ?? 0) - r.length;
  const x = BigInt(i + r) * 2n ** BigInt(k) * 10n ** BigInt(Math.max(n, 0));
  const y = BigInt(a * 2 ** k) * 10n ** BigInt(Math.max(-n, 0));
  return Math.sign(d) * (x === y || x > y !== g > f ? f : g);
};

const char_new = function char_new(c) {
  return c < 55296 || c >= 57344 && c <= 1114111 ? String.fromCodePoint(c) : String.fromCharCode(56320, c >>> 22, c >>> 11 & 2047, c & 2047);
};

function char_len(s, at = 0) {
  return s[at] === "\uDC00" ? 4 : s.codePointAt(at) > 0xFFFF ? 2 : 1;
}

function char_code(s) {
  return s.length < 4 ? s.codePointAt(0)
    : (s.charCodeAt(1) << 22 | s.charCodeAt(2) << 11 | s.charCodeAt(3)) >>> 0;
}

function string_contains(s, p) {
  // A match must start at a Char boundary, not inside a packed U32 code.
  for (let at = 0; at <= s.length; at += char_len(s, at)) {
    if (s.startsWith(p, at)) {
      return true;
    }
  }
  return false;
}

function str_out(s) {
  return s.replace(/\uDC00[^]{3}/gu, "\uFFFD");
}

function str_in(s) {
  return s.replace(/\p{Cs}/gu, "\uFFFD");
}

// Array
// =====

function array_new(d, v) {
  if (d > 31) {
    throw "bend: an array past the deepest block class 31";
  }
  return Array(2 ** d).fill(v);
}

function array_node(a, b) {
  if (a.length !== b.length) {
    throw "bend: runtime fail-stop";
  }
  return a.concat(b);
}

function array_rmw(a, i, f) {
  const at = i % a.length;
  const old = a[at];
  a[at] = f(old);
  return {$: "Tuple", fst: a, snd: old};
}

// Run
// ===

function run_tail(f, x) {
  return {$: "$JMP", f: f.j?.f === f ? f.j : f, x};
}

function run_clo(j) {
  const f = (x) => run_loop(j(x));
  f.j = j;
  j.f = f;
  return f;
}

function run_loop(r) {
  while (r !== null && typeof r === "object" && r.$ === "$JMP") {
    r = r.f(r.x);
  }
  return r;
}

function run_lib(f, n) {
  return (...a) => a.length < n ? run_lib((...b) => f(...a, ...b), n - a.length)
    : run_loop(f(...a));
}

// Effect
// ======

const $0eff = Object.create(null);

function io_eff(k, run) {
  if (arguments.length > 2) {
    throw new Error("bend: " + k + " takes no need: an effect that waits parks itself");
  }
  if (k in $0eff) {
    throw new Error("bend: two effects register " + k);
  }
  $0eff[k] = run;
}
// Program
// =======

function $sudoku_Grid() {
  return null;
}

function $sudoku_cell(_c_0) {
  if (_c_0.$ === "None") {
    return 0;
  } else {
    const _v_0 = _c_0["value"];
    return _v_0;
  }
}

function $sudoku_at(_g_0, _i_0) {
  return $sudoku_cell(($List_get(_g_0, _i_0)));
}

function $sudoku_digits() {
  return {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 3, "tail": {$: "Con", "head": 4, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 9, "tail": {$: "Nil"}}}}}}}}}};
}

function $sudoku_units() {
  return {$: "Con", "head": {$: "Con", "head": 0, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 3, "tail": {$: "Con", "head": 4, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 8, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 9, "tail": {$: "Con", "head": 10, "tail": {$: "Con", "head": 11, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 13, "tail": {$: "Con", "head": 14, "tail": {$: "Con", "head": 15, "tail": {$: "Con", "head": 16, "tail": {$: "Con", "head": 17, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 18, "tail": {$: "Con", "head": 19, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 21, "tail": {$: "Con", "head": 22, "tail": {$: "Con", "head": 23, "tail": {$: "Con", "head": 24, "tail": {$: "Con", "head": 25, "tail": {$: "Con", "head": 26, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 27, "tail": {$: "Con", "head": 28, "tail": {$: "Con", "head": 29, "tail": {$: "Con", "head": 30, "tail": {$: "Con", "head": 31, "tail": {$: "Con", "head": 32, "tail": {$: "Con", "head": 33, "tail": {$: "Con", "head": 34, "tail": {$: "Con", "head": 35, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 36, "tail": {$: "Con", "head": 37, "tail": {$: "Con", "head": 38, "tail": {$: "Con", "head": 39, "tail": {$: "Con", "head": 40, "tail": {$: "Con", "head": 41, "tail": {$: "Con", "head": 42, "tail": {$: "Con", "head": 43, "tail": {$: "Con", "head": 44, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 45, "tail": {$: "Con", "head": 46, "tail": {$: "Con", "head": 47, "tail": {$: "Con", "head": 48, "tail": {$: "Con", "head": 49, "tail": {$: "Con", "head": 50, "tail": {$: "Con", "head": 51, "tail": {$: "Con", "head": 52, "tail": {$: "Con", "head": 53, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 54, "tail": {$: "Con", "head": 55, "tail": {$: "Con", "head": 56, "tail": {$: "Con", "head": 57, "tail": {$: "Con", "head": 58, "tail": {$: "Con", "head": 59, "tail": {$: "Con", "head": 60, "tail": {$: "Con", "head": 61, "tail": {$: "Con", "head": 62, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 63, "tail": {$: "Con", "head": 64, "tail": {$: "Con", "head": 65, "tail": {$: "Con", "head": 66, "tail": {$: "Con", "head": 67, "tail": {$: "Con", "head": 68, "tail": {$: "Con", "head": 69, "tail": {$: "Con", "head": 70, "tail": {$: "Con", "head": 71, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 72, "tail": {$: "Con", "head": 73, "tail": {$: "Con", "head": 74, "tail": {$: "Con", "head": 75, "tail": {$: "Con", "head": 76, "tail": {$: "Con", "head": 77, "tail": {$: "Con", "head": 78, "tail": {$: "Con", "head": 79, "tail": {$: "Con", "head": 80, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 0, "tail": {$: "Con", "head": 9, "tail": {$: "Con", "head": 18, "tail": {$: "Con", "head": 27, "tail": {$: "Con", "head": 36, "tail": {$: "Con", "head": 45, "tail": {$: "Con", "head": 54, "tail": {$: "Con", "head": 63, "tail": {$: "Con", "head": 72, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 1, "tail": {$: "Con", "head": 10, "tail": {$: "Con", "head": 19, "tail": {$: "Con", "head": 28, "tail": {$: "Con", "head": 37, "tail": {$: "Con", "head": 46, "tail": {$: "Con", "head": 55, "tail": {$: "Con", "head": 64, "tail": {$: "Con", "head": 73, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 2, "tail": {$: "Con", "head": 11, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 29, "tail": {$: "Con", "head": 38, "tail": {$: "Con", "head": 47, "tail": {$: "Con", "head": 56, "tail": {$: "Con", "head": 65, "tail": {$: "Con", "head": 74, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 3, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 21, "tail": {$: "Con", "head": 30, "tail": {$: "Con", "head": 39, "tail": {$: "Con", "head": 48, "tail": {$: "Con", "head": 57, "tail": {$: "Con", "head": 66, "tail": {$: "Con", "head": 75, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 4, "tail": {$: "Con", "head": 13, "tail": {$: "Con", "head": 22, "tail": {$: "Con", "head": 31, "tail": {$: "Con", "head": 40, "tail": {$: "Con", "head": 49, "tail": {$: "Con", "head": 58, "tail": {$: "Con", "head": 67, "tail": {$: "Con", "head": 76, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 5, "tail": {$: "Con", "head": 14, "tail": {$: "Con", "head": 23, "tail": {$: "Con", "head": 32, "tail": {$: "Con", "head": 41, "tail": {$: "Con", "head": 50, "tail": {$: "Con", "head": 59, "tail": {$: "Con", "head": 68, "tail": {$: "Con", "head": 77, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 6, "tail": {$: "Con", "head": 15, "tail": {$: "Con", "head": 24, "tail": {$: "Con", "head": 33, "tail": {$: "Con", "head": 42, "tail": {$: "Con", "head": 51, "tail": {$: "Con", "head": 60, "tail": {$: "Con", "head": 69, "tail": {$: "Con", "head": 78, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 7, "tail": {$: "Con", "head": 16, "tail": {$: "Con", "head": 25, "tail": {$: "Con", "head": 34, "tail": {$: "Con", "head": 43, "tail": {$: "Con", "head": 52, "tail": {$: "Con", "head": 61, "tail": {$: "Con", "head": 70, "tail": {$: "Con", "head": 79, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 8, "tail": {$: "Con", "head": 17, "tail": {$: "Con", "head": 26, "tail": {$: "Con", "head": 35, "tail": {$: "Con", "head": 44, "tail": {$: "Con", "head": 53, "tail": {$: "Con", "head": 62, "tail": {$: "Con", "head": 71, "tail": {$: "Con", "head": 80, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 0, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 9, "tail": {$: "Con", "head": 10, "tail": {$: "Con", "head": 11, "tail": {$: "Con", "head": 18, "tail": {$: "Con", "head": 19, "tail": {$: "Con", "head": 20, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 3, "tail": {$: "Con", "head": 4, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 13, "tail": {$: "Con", "head": 14, "tail": {$: "Con", "head": 21, "tail": {$: "Con", "head": 22, "tail": {$: "Con", "head": 23, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 6, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 15, "tail": {$: "Con", "head": 16, "tail": {$: "Con", "head": 17, "tail": {$: "Con", "head": 24, "tail": {$: "Con", "head": 25, "tail": {$: "Con", "head": 26, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 27, "tail": {$: "Con", "head": 28, "tail": {$: "Con", "head": 29, "tail": {$: "Con", "head": 36, "tail": {$: "Con", "head": 37, "tail": {$: "Con", "head": 38, "tail": {$: "Con", "head": 45, "tail": {$: "Con", "head": 46, "tail": {$: "Con", "head": 47, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 30, "tail": {$: "Con", "head": 31, "tail": {$: "Con", "head": 32, "tail": {$: "Con", "head": 39, "tail": {$: "Con", "head": 40, "tail": {$: "Con", "head": 41, "tail": {$: "Con", "head": 48, "tail": {$: "Con", "head": 49, "tail": {$: "Con", "head": 50, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 33, "tail": {$: "Con", "head": 34, "tail": {$: "Con", "head": 35, "tail": {$: "Con", "head": 42, "tail": {$: "Con", "head": 43, "tail": {$: "Con", "head": 44, "tail": {$: "Con", "head": 51, "tail": {$: "Con", "head": 52, "tail": {$: "Con", "head": 53, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 54, "tail": {$: "Con", "head": 55, "tail": {$: "Con", "head": 56, "tail": {$: "Con", "head": 63, "tail": {$: "Con", "head": 64, "tail": {$: "Con", "head": 65, "tail": {$: "Con", "head": 72, "tail": {$: "Con", "head": 73, "tail": {$: "Con", "head": 74, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 57, "tail": {$: "Con", "head": 58, "tail": {$: "Con", "head": 59, "tail": {$: "Con", "head": 66, "tail": {$: "Con", "head": 67, "tail": {$: "Con", "head": 68, "tail": {$: "Con", "head": 75, "tail": {$: "Con", "head": 76, "tail": {$: "Con", "head": 77, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 60, "tail": {$: "Con", "head": 61, "tail": {$: "Con", "head": 62, "tail": {$: "Con", "head": 69, "tail": {$: "Con", "head": 70, "tail": {$: "Con", "head": 71, "tail": {$: "Con", "head": 78, "tail": {$: "Con", "head": 79, "tail": {$: "Con", "head": 80, "tail": {$: "Nil"}}}}}}}}}}, "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}}}};
}

function $sudoku_mem(_x_0, _xs_0) {
  if (_xs_0.$ === "Nil") {
    return false;
  } else {
    const _y_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _x_1 = ($Nat_is_eq(_y_0, _x_0));
    const _x_2 = ($sudoku_mem(_x_0, _rest_0));
    return (_x_1 || _x_2);
  }
}

function $sudoku_values(_g_0, _u_0) {
  if (_u_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _j_0 = _u_0["head"];
    const _rest_0 = _u_0["tail"];
    return {$: "Con", "head": ($sudoku_at(_g_0, _j_0)), "tail": ($sudoku_values(_g_0, _rest_0))};
  }
}

function $sudoku_in_range(_vs_0) {
  if (_vs_0.$ === "Nil") {
    return true;
  } else {
    const _v_0 = _vs_0["head"];
    const _rest_0 = _vs_0["tail"];
    return $Bool_and(($sudoku_mem(_v_0, ($sudoku_digits()))), ($sudoku_in_range(_rest_0)));
  }
}

function $sudoku_distinct_row(_vs_0, _a_0, _p_0, _q_0) {
  if (_vs_0.$ === "Nil") {
    return true;
  } else {
    const _b_0 = _vs_0["head"];
    const _rest_0 = _vs_0["tail"];
    const _x_0 = ($Nat_is_eq(_p_0, _q_0));
    const _x_1 = ($Bool_not(($Nat_is_eq(_a_0, _b_0))));
    return $Bool_and((_x_0 || _x_1), ($sudoku_distinct_row(_rest_0, _a_0, _p_0, nat_chk(_q_0 + 1))));
  }
}

function $sudoku_distinct_go(_vs_0, _all_0, _p_0) {
  if (_vs_0.$ === "Nil") {
    return true;
  } else {
    const _a_0 = _vs_0["head"];
    const _rest_0 = _vs_0["tail"];
    return $Bool_and(($sudoku_distinct_row(_all_0, _a_0, _p_0, 0)), ($sudoku_distinct_go(_rest_0, _all_0, nat_chk(_p_0 + 1))));
  }
}

function $sudoku_distinct(_vs_0) {
  return $sudoku_distinct_go(_vs_0, _vs_0, 0);
}

function $sudoku_covers(_vs_0, _ds_0) {
  if (_ds_0.$ === "Nil") {
    return true;
  } else {
    const _d_0 = _ds_0["head"];
    const _rest_0 = _ds_0["tail"];
    return $Bool_and(($sudoku_mem(_d_0, _vs_0)), ($sudoku_covers(_vs_0, _rest_0)));
  }
}

function $sudoku_unit_ok(_vs_0) {
  return $Bool_and(($sudoku_in_range(_vs_0)), ($Bool_and(($sudoku_distinct(_vs_0)), ($sudoku_covers(_vs_0, ($sudoku_digits()))))));
}

function $sudoku_all_units(_g_0, _us_0) {
  if (_us_0.$ === "Nil") {
    return true;
  } else {
    const _u_0 = _us_0["head"];
    const _rest_0 = _us_0["tail"];
    return $Bool_and(($sudoku_unit_ok(($sudoku_values(_g_0, _u_0)))), ($sudoku_all_units(_g_0, _rest_0)));
  }
}

function $sudoku_solved(_g_0) {
  return $Bool_and(($Nat_is_eq(($List_length(_g_0)), 81)), ($sudoku_all_units(_g_0, ($sudoku_units()))));
}

function $sudoku_agrees(_g_0, _p_0) {
  if (_g_0.$ === "Nil") {
    if (_p_0.$ === "Nil") {
      return true;
    } else {
      return false;
    }
  } else {
    const _x_0 = _g_0["head"];
    const _gs_0 = _g_0["tail"];
    if (_p_0.$ === "Con") {
      const _y_0 = _p_0["head"];
      const _ps_0 = _p_0["tail"];
      const _x_1 = ($Nat_is_eq(_y_0, 0));
      const _x_2 = ($Nat_is_eq(_y_0, _x_0));
      return $Bool_and((_x_1 || _x_2), ($sudoku_agrees(_gs_0, _ps_0)));
    } else {
      return false;
    }
  }
}

function $sudoku_full(_g_0) {
  if (_g_0.$ === "Nil") {
    return true;
  } else {
    const _v_0 = _g_0["head"];
    const _rest_0 = _g_0["tail"];
    return $Bool_and(($Bool_not(($Nat_is_eq(_v_0, 0)))), ($sudoku_full(_rest_0)));
  }
}

function $sudoku_same(_a_0, _b_0) {
  if (_a_0.$ === "Nil") {
    if (_b_0.$ === "Nil") {
      return true;
    } else {
      return false;
    }
  } else {
    const _x_0 = _a_0["head"];
    const _xs_0 = _a_0["tail"];
    if (_b_0.$ === "Con") {
      const _y_0 = _b_0["head"];
      const _ys_0 = _b_0["tail"];
      return $Bool_and(($Nat_is_eq(_x_0, _y_0)), ($sudoku_same(_xs_0, _ys_0)));
    } else {
      return false;
    }
  }
}

function $sudoku_is_at(_m_0, _x_0) {
  if (_m_0.$ === "None") {
    return false;
  } else {
    const _y_0 = _m_0["value"];
    return $Nat_is_eq(_y_0, _x_0);
  }
}

function $sudoku_wit_on(_m_0, _p_0, _x_0, _e_0, _px_0, _pk_0) {
  if (_m_0.$ === "None") {
    return false;
  } else {
    const _unit_0 = _m_0["value"];
    return $Bool_and(($sudoku_is_at(($List_get(_unit_0, _px_0)), _x_0)), ($Bool_and(($Bool_not(($Nat_is_eq(_px_0, _pk_0)))), ($sudoku_is_at(($List_get(($sudoku_values(_p_0, _unit_0)), _pk_0)), _e_0)))));
  }
}

function $sudoku_wit_ok(_w_0, _p_0, _x_0, _e_0) {
  const _u_0 = _w_0["u"];
  const _px_0 = _w_0["px"];
  const _pk_0 = _w_0["pk"];
  return $sudoku_wit_on(($List_get(($sudoku_units()), _u_0)), _p_0, _x_0, _e_0, _px_0, _pk_0);
}

function $sudoku_naked_wits(_ds_0, _ws_0, _p_0, _i_0, _d_0) {
  if (_ds_0.$ === "Nil") {
    if (_ws_0.$ === "Nil") {
      return true;
    } else {
      return false;
    }
  } else {
    const _e_0 = _ds_0["head"];
    const _drest_0 = _ds_0["tail"];
    if (_ws_0.$ === "Con") {
      const _w_0 = _ws_0["head"];
      const _wrest_0 = _ws_0["tail"];
      const _x_0 = ($Nat_is_eq(_e_0, _d_0));
      const _x_1 = ($sudoku_wit_ok(_w_0, _p_0, _i_0, _e_0));
      return $Bool_and((_x_0 || _x_1), ($sudoku_naked_wits(_drest_0, _wrest_0, _p_0, _i_0, _d_0)));
    } else {
      return false;
    }
  }
}

function $sudoku_naked_on(_m_0, _p_0, _i_0, _d_0, _hp_0, _wits_0) {
  if (_m_0.$ === "None") {
    return false;
  } else {
    const _unit_0 = _m_0["value"];
    return $Bool_and(($sudoku_is_at(($List_get(_unit_0, _hp_0)), _i_0)), ($sudoku_naked_wits(($sudoku_digits()), _wits_0, _p_0, _i_0, _d_0)));
  }
}

function $sudoku_excl_ok(_x_0, _p_0, _q_0, _pi_0, _j_0, _d_0) {
  if (_x_0.$ === "Itself") {
    return $Nat_is_eq(_q_0, _pi_0);
  } else if (_x_0.$ === "Filled") {
    return $Bool_and(($Bool_not(($Nat_is_eq(($sudoku_at(_p_0, _j_0)), 0)))), ($Bool_not(($Nat_is_eq(($sudoku_at(_p_0, _j_0)), _d_0)))));
  } else {
    const _w_0 = _x_0["wit"];
    return $sudoku_wit_ok(_w_0, _p_0, _j_0, _d_0);
  }
}

function $sudoku_hidden_cells(_cells_0, _xs_0, _p_0, _pi_0, _d_0, _q_0) {
  if (_cells_0.$ === "Nil") {
    if (_xs_0.$ === "Nil") {
      return true;
    } else {
      return false;
    }
  } else {
    const _j_0 = _cells_0["head"];
    const _cs_0 = _cells_0["tail"];
    if (_xs_0.$ === "Con") {
      const _x_0 = _xs_0["head"];
      const _rest_0 = _xs_0["tail"];
      return $Bool_and(($sudoku_excl_ok(_x_0, _p_0, _q_0, _pi_0, _j_0, _d_0)), ($sudoku_hidden_cells(_cs_0, _rest_0, _p_0, _pi_0, _d_0, nat_chk(_q_0 + 1))));
    } else {
      return false;
    }
  }
}

function $sudoku_hidden_on(_m_0, _p_0, _i_0, _d_0, _pi_0, _excl_0) {
  if (_m_0.$ === "None") {
    return false;
  } else {
    const _unit_0 = _m_0["value"];
    return $Bool_and(($sudoku_is_at(($List_get(_unit_0, _pi_0)), _i_0)), ($sudoku_hidden_cells(_unit_0, _excl_0, _p_0, _pi_0, _d_0, 0)));
  }
}

function $sudoku_step_ok(_s_0, _p_0) {
  if (_s_0.$ === "Naked") {
    const _i_0 = _s_0["i"];
    const _d_0 = _s_0["d"];
    const _home_0 = _s_0["home"];
    const _hp_0 = _s_0["hp"];
    const _wits_0 = _s_0["wits"];
    return $Bool_and(($sudoku_mem(_d_0, ($sudoku_digits()))), ($sudoku_naked_on(($List_get(($sudoku_units()), _home_0)), _p_0, _i_0, _d_0, _hp_0, _wits_0)));
  } else {
    const _i_1 = _s_0["i"];
    const _d_1 = _s_0["d"];
    const _u_0 = _s_0["u"];
    const _pi_0 = _s_0["pi"];
    const _excl_0 = _s_0["excl"];
    return $Bool_and(($sudoku_mem(_d_1, ($sudoku_digits()))), ($sudoku_hidden_on(($List_get(($sudoku_units()), _u_0)), _p_0, _i_1, _d_1, _pi_0, _excl_0)));
  }
}

function $sudoku_step_cell(_s_0) {
  if (_s_0.$ === "Naked") {
    const _i_0 = _s_0["i"];
    return _i_0;
  } else {
    const _i_1 = _s_0["i"];
    return _i_1;
  }
}

function $sudoku_step_digit(_s_0) {
  if (_s_0.$ === "Naked") {
    const _d_0 = _s_0["d"];
    return _d_0;
  } else {
    const _d_1 = _s_0["d"];
    return _d_1;
  }
}

function $sudoku_place(_p_0, _s_0) {
  return $List_set(_p_0, ($sudoku_step_cell(_s_0)), ($sudoku_step_digit(_s_0)));
}

function $sudoku_replay($0, $1, $2) {
  for (;;) {
    {
      const _steps_0 = $0;
      const _ok_0 = $1;
      const _p_0 = $2;
      if (_steps_0.$ === "Nil") {
        if (_ok_0) {
          return {$: "Some", "value": _p_0};
        } else {
          return {$: "None"};
        }
      } else {
        const _s_0 = _steps_0["head"];
        const _rest_0 = _steps_0["tail"];
        if (_ok_0) {
          $0 = _rest_0;
          $1 = ($sudoku_step_ok(_s_0, _p_0));
          $2 = ($sudoku_place(_p_0, _s_0));
          continue;
        } else {
          return {$: "None"};
        }
      }
    }
  }
}

function $sudoku_reaches(_m_0, _s_0) {
  if (_m_0.$ === "None") {
    return false;
  } else {
    const _f_0 = _m_0["value"];
    return $sudoku_same(_f_0, _s_0);
  }
}

function $sudoku_Game_puzzle(_g_0) {
  const _p_0 = _g_0["puzzle"];
  return _p_0;
}

function $sudoku_Game_solution(_g_0) {
  const _s_0 = _g_0["solution"];
  return _s_0;
}

function $sudoku_Game_valid(_g_0) {
  const _p_0 = _g_0["puzzle"];
  const _s_0 = _g_0["solution"];
  const _steps_0 = _g_0["steps"];
  return $Bool_and(($sudoku_solved(_s_0)), ($Bool_and(($sudoku_full(_s_0)), ($Bool_and(($sudoku_agrees(_s_0, _p_0)), ($sudoku_reaches(($sudoku_replay(_steps_0, true, _p_0)), _s_0)))))));
}

function $mix(_x_0) {
  const _x_1 = (16 >= 32 ? 0 : (_x_0 >>> 16) >>> 0);
  const _x_2 = ((_x_0 ^ _x_1) >>> 0);
  const _a_0 = (Math.imul(_x_2, 2146121005) >>> 0);
  const _x_3 = (15 >= 32 ? 0 : (_a_0 >>> 15) >>> 0);
  const _x_4 = ((_a_0 ^ _x_3) >>> 0);
  const _b_0 = (Math.imul(_x_4, 2221713035) >>> 0);
  const _x_5 = (16 >= 32 ? 0 : (_b_0 >>> 16) >>> 0);
  return ((_b_0 ^ _x_5) >>> 0);
}

function $hash(_seed_0, _a_0, _b_0) {
  const _x_0 = nat_chk(_a_0 * 16);
  const _x_1 = nat_chk(_x_0 + _b_0);
  const _x_2 = (_x_1 >>> 0);
  return $mix(((_seed_0 ^ _x_2) >>> 0));
}

function $rank_le(_a_0, _b_0) {
  const _ra_0 = _a_0["rank"];
  const _rb_0 = _b_0["rank"];
  return (_ra_0 <= _rb_0);
}

function $ranked(_xs_0, _seed_0, _slot_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    return {$: "Con", "head": {$: "Rank", "rank": ($hash(_seed_0, _slot_0, _x_0)), "value": _x_0}, "tail": ($ranked(_rest_0, _seed_0, _slot_0))};
  }
}

function $unranked(_rs_0) {
  if (_rs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _t_0 = _rs_0["head"];
    const _v_0 = _t_0["value"];
    const _rest_0 = _rs_0["tail"];
    return {$: "Con", "head": _v_0, "tail": ($unranked(_rest_0))};
  }
}

function $shuffle(_xs_0, _seed_0, _slot_0) {
  return $unranked(($List_sort_0(($ranked(_xs_0, _seed_0, _slot_0)))));
}

function $row(_i_0) {
  return $Nat_div(_i_0, 9);
}

function $col(_i_0) {
  return $Nat_mod(_i_0, 9);
}

function $box(_i_0) {
  const _x_0 = ($Nat_div(($row(_i_0)), 3));
  const _x_1 = nat_chk(_x_0 * 3);
  const _x_2 = ($Nat_div(($col(_i_0)), 3));
  return nat_chk(_x_1 + _x_2);
}

function $unit(_u_0) {
  return $Maybe_default(($List_get(($sudoku_units()), _u_0)), {$: "Nil"});
}

function $homes(_i_0) {
  const _x_0 = ($col(_i_0));
  const _x_1 = ($box(_i_0));
  return {$: "Con", "head": ($row(_i_0)), "tail": {$: "Con", "head": nat_chk(9 + _x_0), "tail": {$: "Con", "head": nat_chk(18 + _x_1), "tail": {$: "Nil"}}}};
}

function $index_of(_xs_0, _x_0, _k_0) {
  if (_xs_0.$ === "Nil") {
    return 0;
  } else {
    const _y_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    return $Bool_pick(($Nat_is_eq(_y_0, _x_0)), _k_0, ($index_of(_rest_0, _x_0, nat_chk(_k_0 + 1))));
  }
}

function $range(_n_0, _k_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _m_0 = (_n_0 - 1);
    return {$: "Con", "head": _k_0, "tail": ($range(_m_0, nat_chk(_k_0 + 1)))};
  }
}

function $bit(_v_0) {
  return (_v_0 >= 32 ? 0 : (1 << _v_0) >>> 0);
}

function $mask_of(_vs_0) {
  if (_vs_0.$ === "Nil") {
    return 0;
  } else {
    const _v_0 = _vs_0["head"];
    const _rest_0 = _vs_0["tail"];
    const _x_0 = ($bit(_v_0));
    const _x_1 = ($mask_of(_rest_0));
    return ((_x_0 | _x_1) >>> 0);
  }
}

function $masks(_p_0, _us_0) {
  if (_us_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _u_0 = _us_0["head"];
    const _rest_0 = _us_0["tail"];
    return {$: "Con", "head": ($mask_of(($sudoku_values(_p_0, _u_0)))), "tail": ($masks(_p_0, _rest_0))};
  }
}

function $mask(_ms_0, _u_0) {
  return $Maybe_default(($List_get(_ms_0, _u_0)), 0);
}

function $cand(_p_0, _ms_0, _i_0) {
  const _x_0 = ($col(_i_0));
  const _x_1 = ($mask(_ms_0, ($row(_i_0))));
  const _x_2 = ($mask(_ms_0, nat_chk(9 + _x_0)));
  const _x_3 = ($box(_i_0));
  const _x_4 = ((_x_1 | _x_2) >>> 0);
  const _x_5 = ($mask(_ms_0, nat_chk(18 + _x_3)));
  const _seen_0 = ((_x_4 | _x_5) >>> 0);
  const _x_6 = (~_seen_0 >>> 0);
  return $Bool_pick(($Nat_is_eq(($sudoku_at(_p_0, _i_0)), 0)), ((1022 & _x_6) >>> 0), 0);
}

function $single(_m_0) {
  const _x_0 = ((_m_0 - 1) >>> 0);
  const _x_1 = ((_m_0 & _x_0) >>> 0);
  return $Bool_and((_m_0 !== 0), (_x_1 === 0));
}

function $naked_if(_hit_0, _i_0, _m_0, _rest_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "NakedF", "i": _i_0, "d": ($U32_log2(_m_0))}, "tail": _rest_0};
  } else {
    return _rest_0;
  }
}

function $naked_scan(_cells_0, _p_0, _ms_0) {
  if (_cells_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _i_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    const _m_0 = ($cand(_p_0, _ms_0, _i_0));
    return $naked_if(($single(_m_0)), _i_0, _m_0, ($naked_scan(_rest_0, _p_0, _ms_0)));
  }
}

function $spots(_cells_0, _p_0, _ms_0, _b_0) {
  if (_cells_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _j_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    const _x_0 = ($cand(_p_0, _ms_0, _j_0));
    const _x_1 = ((_x_0 & _b_0) >>> 0);
    return $List_filter_put(_j_0, ($spots(_rest_0, _p_0, _ms_0, _b_0)), (_x_1 !== 0));
  }
}

function $hidden_one(_at_0, _d_0, _u_0) {
  if (_at_0.$ === "Con") {
    const _i_0 = _at_0["head"];
    const _t_0 = _at_0["tail"];
    if (_t_0.$ === "Nil") {
      return {$: "Con", "head": {$: "HiddenF", "i": _i_0, "d": _d_0, "u": _u_0}, "tail": {$: "Nil"}};
    } else {
      return {$: "Nil"};
    }
  } else {
    return {$: "Nil"};
  }
}

function $hidden_digits(_ds_0, _p_0, _ms_0, _u_0, _cells_0) {
  if (_ds_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _d_0 = _ds_0["head"];
    const _rest_0 = _ds_0["tail"];
    const _x_0 = ($mask(_ms_0, _u_0));
    const _x_1 = ($bit(_d_0));
    const _x_2 = ((_x_0 & _x_1) >>> 0);
    const _present_0 = (_x_2 !== 0);
    return $List_append(($Bool_pick(_present_0, {$: "Nil"}, ($hidden_one(($spots(_cells_0, _p_0, _ms_0, ($bit(_d_0)))), _d_0, _u_0)))), ($hidden_digits(_rest_0, _p_0, _ms_0, _u_0, _cells_0)));
  }
}

function $hidden_scan(_us_0, _p_0, _ms_0) {
  if (_us_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _u_0 = _us_0["head"];
    const _rest_0 = _us_0["tail"];
    return $List_append(($hidden_digits(($sudoku_digits()), _p_0, _ms_0, _u_0, ($unit(_u_0)))), ($hidden_scan(_rest_0, _p_0, _ms_0)));
  }
}

function $pass(_p_0) {
  const _ms_0 = ($masks(_p_0, ($sudoku_units())));
  return $List_append(($naked_scan(($range(81, 0)), _p_0, _ms_0)), ($hidden_scan(($range(27, 0)), _p_0, _ms_0)));
}

function $found_cell(_f_0) {
  if (_f_0.$ === "NakedF") {
    const _i_0 = _f_0["i"];
    return _i_0;
  } else {
    const _i_1 = _f_0["i"];
    return _i_1;
  }
}

function $found_digit(_f_0) {
  if (_f_0.$ === "NakedF") {
    const _d_0 = _f_0["d"];
    return _d_0;
  } else {
    const _d_1 = _f_0["d"];
    return _d_1;
  }
}

function $apply($0, $1) {
  for (;;) {
    {
      const _fs_0 = $0;
      const _p_0 = $1;
      if (_fs_0.$ === "Nil") {
        return _p_0;
      } else {
        const _f_0 = _fs_0["head"];
        const _rest_0 = _fs_0["tail"];
        $0 = _rest_0;
        $1 = ($List_set(_p_0, ($found_cell(_f_0)), ($found_digit(_f_0))));
        continue;
      }
    }
  }
}

function $solves_next(_done_0, _fs_0, _more_0) {
  if (_done_0) {
    return true;
  } else {
    if (_fs_0.$ === "Nil") {
      return false;
    } else {
      const _f_0 = _fs_0["head"];
      const _rest_0 = _fs_0["tail"];
      return run_tail(_more_0, {$: "Con", "head": _f_0, "tail": _rest_0});
    }
  }
}

function $solves(_fuel_0, _p_0) {
  if (_fuel_0 === 0) {
    return $sudoku_full(_p_0);
  } else {
    const _f_0 = (_fuel_0 - 1);
    return $solves_next(($sudoku_full(_p_0)), ($pass(_p_0)), run_clo($solves_c1(_f_0,_p_0)));
  }
}

function $first_at(_vs_0, _e_0, _k_0) {
  if (_vs_0.$ === "Nil") {
    return {$: "None"};
  } else {
    const _v_0 = _vs_0["head"];
    const _rest_0 = _vs_0["tail"];
    return $Bool_pick(($Nat_is_eq(_v_0, _e_0)), {$: "Some", "value": _k_0}, ($first_at(_rest_0, _e_0, nat_chk(_k_0 + 1))));
  }
}

function $wit_pick(_m_0, _u_0, _px_0, _other_0) {
  if (_m_0.$ === "Some") {
    const _pk_0 = _m_0["value"];
    return {$: "Wit", "u": _u_0, "px": _px_0, "pk": _pk_0};
  } else {
    return _other_0;
  }
}

function $wit_in(_us_0, _p_0, _x_0, _e_0) {
  if (_us_0.$ === "Nil") {
    return {$: "Wit", "u": 0, "px": 0, "pk": 0};
  } else {
    const _u_0 = _us_0["head"];
    const _rest_0 = _us_0["tail"];
    const _cells_0 = ($unit(_u_0));
    return $wit_pick(($first_at(($sudoku_values(_p_0, _cells_0)), _e_0, 0)), _u_0, ($index_of(_cells_0, _x_0, 0)), ($wit_in(_rest_0, _p_0, _x_0, _e_0)));
  }
}

function $wits(_ds_0, _p_0, _i_0, _d_0) {
  if (_ds_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _e_0 = _ds_0["head"];
    const _rest_0 = _ds_0["tail"];
    return {$: "Con", "head": ($Bool_pick(($Nat_is_eq(_e_0, _d_0)), {$: "Wit", "u": 0, "px": 0, "pk": 0}, ($wit_in(($homes(_i_0)), _p_0, _i_0, _e_0)))), "tail": ($wits(_rest_0, _p_0, _i_0, _d_0))};
  }
}

function $excls(_cells_0, _p_0, _i_0, _d_0) {
  if (_cells_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _j_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    const _why_0 = ($Bool_pick(($Nat_is_eq(_j_0, _i_0)), {$: "Itself"}, ($Bool_pick(($Nat_is_eq(($sudoku_at(_p_0, _j_0)), 0)), {$: "Peer", "wit": ($wit_in(($homes(_j_0)), _p_0, _j_0, _d_0))}, {$: "Filled"}))));
    return {$: "Con", "head": _why_0, "tail": ($excls(_rest_0, _p_0, _i_0, _d_0))};
  }
}

function $to_step(_p_0, _f_0) {
  if (_f_0.$ === "NakedF") {
    const _i_0 = _f_0["i"];
    const _d_0 = _f_0["d"];
    return {$: "Naked", "i": _i_0, "d": _d_0, "home": ($row(_i_0)), "hp": ($col(_i_0)), "wits": ($wits(($sudoku_digits()), _p_0, _i_0, _d_0))};
  } else {
    const _i_1 = _f_0["i"];
    const _d_1 = _f_0["d"];
    const _u_0 = _f_0["u"];
    return {$: "Hidden", "i": _i_1, "d": _d_1, "u": _u_0, "pi": ($index_of(($unit(_u_0)), _i_1, 0)), "excl": ($excls(($unit(_u_0)), _p_0, _i_1, _d_1))};
  }
}

function $to_steps(_fs_0, _p_0) {
  if (_fs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fs_0["head"];
    const _rest_0 = _fs_0["tail"];
    return {$: "Con", "head": ($to_step(_p_0, _f_0)), "tail": ($to_steps(_rest_0, _p_0))};
  }
}

function $certify_next(_fs_0, _p_0, _more_0) {
  if (_fs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fs_0["head"];
    const _rest_0 = _fs_0["tail"];
    return $List_append(($to_steps({$: "Con", "head": _f_0, "tail": _rest_0}, _p_0)), _more_0({$: "Con", "head": _f_0, "tail": _rest_0}));
  }
}

function $certify(_fuel_0, _p_0) {
  if (_fuel_0 === 0) {
    return {$: "Nil"};
  } else {
    const _f_0 = (_fuel_0 - 1);
    return $certify_next(($pass(_p_0)), _p_0, run_clo($certify_c2(_f_0,_p_0)));
  }
}

function $fits(_p_0, _i_0, _d_0) {
  const _x_0 = ($col(_i_0));
  const _x_1 = ($box(_i_0));
  return $Bool_not(($sudoku_mem(_d_0, ($List_concat({$: "Con", "head": ($sudoku_values(_p_0, ($unit(($row(_i_0)))))), "tail": {$: "Con", "head": ($sudoku_values(_p_0, ($unit(nat_chk(9 + _x_0))))), "tail": {$: "Con", "head": ($sudoku_values(_p_0, ($unit(nat_chk(18 + _x_1))))), "tail": {$: "Nil"}}}})))));
}

function $options(_ds_0, _p_0, _i_0) {
  if (_ds_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _d_0 = _ds_0["head"];
    const _rest_0 = _ds_0["tail"];
    return $List_filter_put(_d_0, ($options(_rest_0, _p_0, _i_0)), ($fits(_p_0, _i_0, _d_0)));
  }
}

function $tries(_seed_0, _p_0, _i_0) {
  return $shuffle(($options(($sudoku_digits()), _p_0, _i_0)), _seed_0, _i_0);
}

function $fill_or(_m_0, _other_0) {
  if (_m_0.$ === "Some") {
    const _g_0 = _m_0["value"];
    return {$: "Some", "value": _g_0};
  } else {
    return run_tail(_other_0, {$: "Unit"});
  }
}

function $fill(_n_0, _ds_0, _seed_0, _p_0, _i_0) {
  if (_n_0 === 0) {
    return {$: "Some", "value": _p_0};
  } else {
    const _m_0 = (_n_0 - 1);
    if (_ds_0.$ === "Nil") {
      return {$: "None"};
    } else {
      const _d_0 = _ds_0["head"];
      const _rest_0 = _ds_0["tail"];
      const _q_0 = ($List_set(_p_0, _i_0, _d_0));
      return $fill_or(run_loop($fill(_m_0, ($tries(_seed_0, _q_0, nat_chk(_i_0 + 1))), _seed_0, _q_0, nat_chk(_i_0 + 1))), run_clo($fill_c3(_m_0,_rest_0,_seed_0,_p_0,_i_0)));
    }
  }
}

function $solution(_seed_0) {
  const _empty_0 = ($List_replicate(81, 0));
  return $Maybe_default(run_loop($fill(81, ($tries(_seed_0, _empty_0, 0)), _seed_0, _empty_0, 0)), _empty_0);
}

function $dig($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _order_0 = $0;
      const _stop_0 = $1;
      const _clues_0 = $2;
      const _target_0 = $3;
      const _p_0 = $4;
      if (_order_0.$ === "Nil") {
        return _p_0;
      } else {
        const _i_0 = _order_0["head"];
        const _rest_0 = _order_0["tail"];
        if (_stop_0) {
          return _p_0;
        } else {
          const _q_0 = ($List_set(_p_0, _i_0, 0));
          const _ok_0 = run_loop($solves(81, _q_0));
          const _left_0 = ($Bool_pick(_ok_0, (_clues_0 < 1 ? 0 : _clues_0 - 1), _clues_0));
          $0 = _rest_0;
          $1 = ($Nat_is_le(_left_0, _target_0));
          $2 = _left_0;
          $3 = _target_0;
          $4 = ($Bool_pick(_ok_0, _q_0, _p_0));
          continue;
        }
      }
    }
  }
}

function $game(_clues_0, _seed_0) {
  const _sol_0 = ($solution(_seed_0));
  const _puz_0 = ($dig(($shuffle(($range(81, 0)), _seed_0, 99)), false, 81, _clues_0, _sol_0));
  return {$: "Game", "puzzle": _puz_0, "solution": _sol_0, "steps": ($certify(81, _puz_0))};
}

function $keep_if(_g_0, _ok_0) {
  if (_ok_0) {
    return {$: "Some", "value": _g_0};
  } else {
    return {$: "None"};
  }
}

function $keep(_g_0) {
  return $keep_if(_g_0, ($sudoku_Game_valid(_g_0)));
}

function $List_get($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _n_0 = $1;
      if (_xs_0.$ === "Nil") {
        return {$: "None"};
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        if (_n_0 === 0) {
          return {$: "Some", "value": _h_0};
        } else {
          const _p_0 = (_n_0 - 1);
          $0 = _t_0;
          $1 = _p_0;
          continue;
        }
      }
    }
  }
}

function $Nat_is_eq(_a_0, _b_0) {
  return $Cmp_is_eq(cmp_new(_a_0, _b_0));
}

function $Bool_and(_a_0, _b_0) {
  if (!_a_0) {
    return false;
  } else {
    return _b_0;
  }
}

function $Bool_not(_b_0) {
  if (!_b_0) {
    return true;
  } else {
    return false;
  }
}

function $List_length(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return 0;
  } else {
    const _t_0 = _xs_0["tail"];
    return nat_chk(($List_length(_t_0)) + 1);
  }
}

function $List_set(_xs_0, _n_0, _x_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    if (_n_0 === 0) {
      return {$: "Con", "head": _x_0, "tail": _t_0};
    } else {
      const _p_0 = (_n_0 - 1);
      return {$: "Con", "head": _h_0, "tail": ($List_set(_t_0, _p_0, _x_0))};
    }
  }
}

function $List_sort_0(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    const _ys_0 = {$: "Con", "head": _h_0, "tail": _t_0};
    const _n_0 = ($List_length(_ys_0));
    return $List_sort_go_0(_n_0, _n_0, ($List_sort_runs(_ys_0)));
  }
}

function $Nat_div(_a_0, _b_0) {
  return $Pair_fst(nat_divmod(_a_0, _b_0));
}

function $Nat_mod(_a_0, _b_0) {
  return $Pair_snd(nat_divmod(_a_0, _b_0));
}

function $Maybe_default(_m_0, _d_0) {
  if (_m_0.$ === "None") {
    return _d_0;
  } else {
    const _x_0 = _m_0["value"];
    return _x_0;
  }
}

function $Bool_pick(_c_0, _a_0, _b_0) {
  if (!_c_0) {
    return _b_0;
  } else {
    return _a_0;
  }
}

function $U32_log2(_n_0) {
  return $U32_log2_go(5, _n_0, 0);
}

function $List_filter_put(_h_0, _r_0, _keep_0) {
  if (!_keep_0) {
    return _r_0;
  } else {
    return {$: "Con", "head": _h_0, "tail": _r_0};
  }
}

function $List_append(_xs_0, _ys_0) {
  if (_xs_0.$ === "Nil") {
    return _ys_0;
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Con", "head": _h_0, "tail": ($List_append(_t_0, _ys_0))};
  }
}

function $List_concat(_xss_0) {
  if (_xss_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xss_0["head"];
    const _t_0 = _xss_0["tail"];
    return $List_append(_h_0, ($List_concat(_t_0)));
  }
}

function $List_replicate(_n_0, _x_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": _x_0, "tail": ($List_replicate(_p_0, _x_0))};
  }
}

function $Nat_is_le(_a_0, _b_0) {
  return $Cmp_is_le(cmp_new(_a_0, _b_0));
}

function $Cmp_is_eq(_c_0) {
  if (_c_0.$ === "EQ") {
    return true;
  } else {
    return false;
  }
}

function $List_sort_go_0($0, $1, $2) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _n_0 = $1;
      const _runs_0 = $2;
      if (_fuel_0 === 0) {
        return $List_concat(_runs_0);
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (_runs_0.$ === "Nil") {
          return {$: "Nil"};
        } else {
          const _r_0 = _runs_0["head"];
          const _t_0 = _runs_0["tail"];
          if (_t_0.$ === "Nil") {
            return _r_0;
          } else {
            const _r2_0 = _t_0["head"];
            const _rest_0 = _t_0["tail"];
            $0 = _f_0;
            $1 = _n_0;
            $2 = ($List_sort_pass_0(_n_0, {$: "Con", "head": _r_0, "tail": {$: "Con", "head": _r2_0, "tail": _rest_0}}));
            continue;
          }
        }
      }
    }
  }
}

function $List_sort_runs(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Con", "head": {$: "Con", "head": _h_0, "tail": {$: "Nil"}}, "tail": ($List_sort_runs(_t_0))};
  }
}

function $Pair_fst(_p_0) {
  const _a_0 = _p_0["fst"];
  return _a_0;
}

function $Pair_snd(_p_0) {
  const _b_0 = _p_0["snd"];
  return _b_0;
}

function $U32_log2_go($0, $1, $2) {
  for (;;) {
    {
      const _k_0 = $0;
      const _n_0 = $1;
      const _b_0 = $2;
      if (_k_0 === 0) {
        return _b_0;
      } else {
        const _p_0 = (_k_0 - 1);
        const _x_0 = (_p_0 >= 32 ? 0 : (1 << _p_0) >>> 0);
        const _s_0 = _x_0;
        const _x_1 = (_s_0 >= 32 ? 0 : (_n_0 >>> _s_0) >>> 0);
        const _x_2 = ($Bool_to_u32((_x_1 !== 0)));
        const _t_0 = nat_chk(_s_0 * _x_2);
        $0 = _p_0;
        $1 = (_t_0 >= 32 ? 0 : (_n_0 >>> _t_0) >>> 0);
        $2 = nat_chk(_b_0 + _t_0);
        continue;
      }
    }
  }
}

function $Cmp_is_le(_c_0) {
  if (_c_0.$ === "GT") {
    return false;
  } else {
    return true;
  }
}

function $List_sort_pass_0(_n_0, _runs_0) {
  if (_runs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _r_0 = _runs_0["head"];
    const _t_0 = _runs_0["tail"];
    if (_t_0.$ === "Nil") {
      return {$: "Con", "head": _r_0, "tail": {$: "Nil"}};
    } else {
      const _r2_0 = _t_0["head"];
      const _rest_0 = _t_0["tail"];
      return {$: "Con", "head": ($List_merge_go_0(_n_0, {$: "Tuple", "fst": {$: "Nil"}, "snd": {$: "Tuple", "fst": _r_0, "snd": _r2_0}})), "tail": ($List_sort_pass_0(_n_0, _rest_0))};
    }
  }
}

function $Bool_to_u32(_b_0) {
  if (!_b_0) {
    return 0;
  } else {
    return 1;
  }
}

function $List_merge_go_0($0, $1) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _st_0 = $1;
      if (_fuel_0 === 0) {
        const _acc_0 = _st_0["fst"];
        const _t_0 = _st_0["snd"];
        const _xs_0 = _t_0["fst"];
        const _ys_0 = _t_0["snd"];
        return $List_reverse_go(_acc_0, ($List_append(_xs_0, _ys_0)));
      } else {
        const _f_0 = (_fuel_0 - 1);
        const _acc_1 = _st_0["fst"];
        const _t_1 = _st_0["snd"];
        const _t_2 = _t_1["fst"];
        if (_t_2.$ === "Nil") {
          const _t_3 = _t_1["snd"];
          if (_t_3.$ === "Nil") {
            return $List_reverse_go(_acc_1, {$: "Nil"});
          } else {
            const _y_0 = _t_3["head"];
            const _yt_0 = _t_3["tail"];
            return $List_reverse_go(_acc_1, {$: "Con", "head": _y_0, "tail": _yt_0});
          }
        } else {
          const _x_0 = _t_2["head"];
          const _xt_0 = _t_2["tail"];
          const _t_4 = _t_1["snd"];
          if (_t_4.$ === "Nil") {
            return $List_reverse_go(_acc_1, {$: "Con", "head": _x_0, "tail": _xt_0});
          } else {
            const _y_1 = _t_4["head"];
            const _yt_1 = _t_4["tail"];
            $0 = _f_0;
            $1 = ($List_merge_step(_acc_1, _x_0, _xt_0, _y_1, _yt_1, ($rank_le(_x_0, _y_1))));
            continue;
          }
        }
      }
    }
  }
}

function $List_reverse_go($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _acc_0 = $1;
      if (_xs_0.$ === "Nil") {
        return _acc_0;
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        $0 = _t_0;
        $1 = {$: "Con", "head": _h_0, "tail": _acc_0};
        continue;
      }
    }
  }
}

function $List_merge_step(_acc_0, _x_0, _xt_0, _y_0, _yt_0, _le_0) {
  if (!_le_0) {
    return {$: "Tuple", "fst": {$: "Con", "head": _y_0, "tail": _acc_0}, "snd": {$: "Tuple", "fst": {$: "Con", "head": _x_0, "tail": _xt_0}, "snd": _yt_0}};
  } else {
    return {$: "Tuple", "fst": {$: "Con", "head": _x_0, "tail": _acc_0}, "snd": {$: "Tuple", "fst": _xt_0, "snd": {$: "Con", "head": _y_0, "tail": _yt_0}}};
  }
}

function $solves_c1(_f_0,_p_0) {
  return (_x_0) => {
    return $solves(_f_0, ($apply(_x_0, _p_0)));
  }
}
function $certify_c2(_f_0,_p_0) {
  return (_x_0) => {
    return $certify(_f_0, ($apply(_x_0, _p_0)));
  }
}
function $fill_c3(_m_0,_rest_0,_seed_0,_p_0,_i_0) {
  return (_x_0) => {
    return $fill(nat_chk(_m_0 + 1), _rest_0, _seed_0, _p_0, _i_0);
  }
}export default {
  "sudoku:Grid": run_lib(() => run_loop($sudoku_Grid()), 0),
  "sudoku:cell": run_lib((a0) => run_loop($sudoku_cell(a0)), 1),
  "sudoku:at": run_lib((a0,a1) => run_loop($sudoku_at(a0,nat_in(a1))), 2),
  "sudoku:digits": run_lib(() => run_loop($sudoku_digits()), 0),
  "sudoku:units": run_lib(() => run_loop($sudoku_units()), 0),
  "sudoku:mem": run_lib((a0,a1) => run_loop($sudoku_mem(nat_in(a0),a1)), 2),
  "sudoku:values": run_lib((a0,a1) => run_loop($sudoku_values(a0,a1)), 2),
  "sudoku:in_range": run_lib((a0) => run_loop($sudoku_in_range(a0)), 1),
  "sudoku:distinct.row": run_lib((a0,a1,a2,a3) => run_loop($sudoku_distinct_row(a0,nat_in(a1),nat_in(a2),nat_in(a3))), 4),
  "sudoku:distinct.go": run_lib((a0,a1,a2) => run_loop($sudoku_distinct_go(a0,a1,nat_in(a2))), 3),
  "sudoku:distinct": run_lib((a0) => run_loop($sudoku_distinct(a0)), 1),
  "sudoku:covers": run_lib((a0,a1) => run_loop($sudoku_covers(a0,a1)), 2),
  "sudoku:unit_ok": run_lib((a0) => run_loop($sudoku_unit_ok(a0)), 1),
  "sudoku:all_units": run_lib((a0,a1) => run_loop($sudoku_all_units(a0,a1)), 2),
  "sudoku:solved": run_lib((a0) => run_loop($sudoku_solved(a0)), 1),
  "sudoku:agrees": run_lib((a0,a1) => run_loop($sudoku_agrees(a0,a1)), 2),
  "sudoku:full": run_lib((a0) => run_loop($sudoku_full(a0)), 1),
  "sudoku:same": run_lib((a0,a1) => run_loop($sudoku_same(a0,a1)), 2),
  "sudoku:is_at": run_lib((a0,a1) => run_loop($sudoku_is_at(a0,nat_in(a1))), 2),
  "sudoku:wit.on": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($sudoku_wit_on(a0,a1,nat_in(a2),nat_in(a3),nat_in(a4),nat_in(a5))), 6),
  "sudoku:wit.ok": run_lib((a0,a1,a2,a3) => run_loop($sudoku_wit_ok(a0,a1,nat_in(a2),nat_in(a3))), 4),
  "sudoku:naked.wits": run_lib((a0,a1,a2,a3,a4) => run_loop($sudoku_naked_wits(a0,a1,a2,nat_in(a3),nat_in(a4))), 5),
  "sudoku:naked.on": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($sudoku_naked_on(a0,a1,nat_in(a2),nat_in(a3),nat_in(a4),a5)), 6),
  "sudoku:excl.ok": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($sudoku_excl_ok(a0,a1,nat_in(a2),nat_in(a3),nat_in(a4),nat_in(a5))), 6),
  "sudoku:hidden.cells": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($sudoku_hidden_cells(a0,a1,a2,nat_in(a3),nat_in(a4),nat_in(a5))), 6),
  "sudoku:hidden.on": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($sudoku_hidden_on(a0,a1,nat_in(a2),nat_in(a3),nat_in(a4),a5)), 6),
  "sudoku:step.ok": run_lib((a0,a1) => run_loop($sudoku_step_ok(a0,a1)), 2),
  "sudoku:step.cell": run_lib((a0) => run_loop($sudoku_step_cell(a0)), 1),
  "sudoku:step.digit": run_lib((a0) => run_loop($sudoku_step_digit(a0)), 1),
  "sudoku:place": run_lib((a0,a1) => run_loop($sudoku_place(a0,a1)), 2),
  "sudoku:replay": run_lib((a0,a1,a2) => run_loop($sudoku_replay(a0,a1,a2)), 3),
  "sudoku:reaches": run_lib((a0,a1) => run_loop($sudoku_reaches(a0,a1)), 2),
  "sudoku:Game.puzzle": run_lib((a0) => run_loop($sudoku_Game_puzzle(a0)), 1),
  "sudoku:Game.solution": run_lib((a0) => run_loop($sudoku_Game_solution(a0)), 1),
  "sudoku:Game.valid": run_lib((a0) => run_loop($sudoku_Game_valid(a0)), 1),
  "mix": run_lib((a0) => run_loop($mix(a0)), 1),
  "hash": run_lib((a0,a1,a2) => run_loop($hash(a0,nat_in(a1),nat_in(a2))), 3),
  "rank_le": run_lib((a0,a1) => run_loop($rank_le(a0,a1)), 2),
  "ranked": run_lib((a0,a1,a2) => run_loop($ranked(a0,a1,nat_in(a2))), 3),
  "unranked": run_lib((a0) => run_loop($unranked(a0)), 1),
  "shuffle": run_lib((a0,a1,a2) => run_loop($shuffle(a0,a1,nat_in(a2))), 3),
  "row": run_lib((a0) => run_loop($row(nat_in(a0))), 1),
  "col": run_lib((a0) => run_loop($col(nat_in(a0))), 1),
  "box": run_lib((a0) => run_loop($box(nat_in(a0))), 1),
  "unit": run_lib((a0) => run_loop($unit(nat_in(a0))), 1),
  "homes": run_lib((a0) => run_loop($homes(nat_in(a0))), 1),
  "index_of": run_lib((a0,a1,a2) => run_loop($index_of(a0,nat_in(a1),nat_in(a2))), 3),
  "range": run_lib((a0,a1) => run_loop($range(nat_in(a0),nat_in(a1))), 2),
  "bit": run_lib((a0) => run_loop($bit(nat_in(a0))), 1),
  "mask_of": run_lib((a0) => run_loop($mask_of(a0)), 1),
  "masks": run_lib((a0,a1) => run_loop($masks(a0,a1)), 2),
  "mask": run_lib((a0,a1) => run_loop($mask(a0,nat_in(a1))), 2),
  "cand": run_lib((a0,a1,a2) => run_loop($cand(a0,a1,nat_in(a2))), 3),
  "single": run_lib((a0) => run_loop($single(a0)), 1),
  "naked.if": run_lib((a0,a1,a2,a3) => run_loop($naked_if(a0,nat_in(a1),a2,a3)), 4),
  "naked.scan": run_lib((a0,a1,a2) => run_loop($naked_scan(a0,a1,a2)), 3),
  "spots": run_lib((a0,a1,a2,a3) => run_loop($spots(a0,a1,a2,a3)), 4),
  "hidden.one": run_lib((a0,a1,a2) => run_loop($hidden_one(a0,nat_in(a1),nat_in(a2))), 3),
  "hidden.digits": run_lib((a0,a1,a2,a3,a4) => run_loop($hidden_digits(a0,a1,a2,nat_in(a3),a4)), 5),
  "hidden.scan": run_lib((a0,a1,a2) => run_loop($hidden_scan(a0,a1,a2)), 3),
  "pass": run_lib((a0) => run_loop($pass(a0)), 1),
  "found.cell": run_lib((a0) => run_loop($found_cell(a0)), 1),
  "found.digit": run_lib((a0) => run_loop($found_digit(a0)), 1),
  "apply": run_lib((a0,a1) => run_loop($apply(a0,a1)), 2),
  "solves.next": run_lib((a0,a1,a2) => run_loop($solves_next(a0,a1,a2)), 3),
  "solves": run_lib((a0,a1) => run_loop($solves(nat_in(a0),a1)), 2),
  "first_at": run_lib((a0,a1,a2) => run_loop($first_at(a0,nat_in(a1),nat_in(a2))), 3),
  "wit.pick": run_lib((a0,a1,a2,a3) => run_loop($wit_pick(a0,nat_in(a1),nat_in(a2),a3)), 4),
  "wit.in": run_lib((a0,a1,a2,a3) => run_loop($wit_in(a0,a1,nat_in(a2),nat_in(a3))), 4),
  "wits": run_lib((a0,a1,a2,a3) => run_loop($wits(a0,a1,nat_in(a2),nat_in(a3))), 4),
  "excls": run_lib((a0,a1,a2,a3) => run_loop($excls(a0,a1,nat_in(a2),nat_in(a3))), 4),
  "to_step": run_lib((a0,a1) => run_loop($to_step(a0,a1)), 2),
  "to_steps": run_lib((a0,a1) => run_loop($to_steps(a0,a1)), 2),
  "certify.next": run_lib((a0,a1,a2) => run_loop($certify_next(a0,a1,a2)), 3),
  "certify": run_lib((a0,a1) => run_loop($certify(nat_in(a0),a1)), 2),
  "fits": run_lib((a0,a1,a2) => run_loop($fits(a0,nat_in(a1),nat_in(a2))), 3),
  "options": run_lib((a0,a1,a2) => run_loop($options(a0,a1,nat_in(a2))), 3),
  "tries": run_lib((a0,a1,a2) => run_loop($tries(a0,a1,nat_in(a2))), 3),
  "fill.or": run_lib((a0,a1) => run_loop($fill_or(a0,a1)), 2),
  "fill": run_lib((a0,a1,a2,a3,a4) => run_loop($fill(nat_in(a0),a1,a2,a3,nat_in(a4))), 5),
  "solution": run_lib((a0) => run_loop($solution(a0)), 1),
  "dig": run_lib((a0,a1,a2,a3,a4) => run_loop($dig(a0,a1,nat_in(a2),nat_in(a3),a4)), 5),
  "game": run_lib((a0,a1) => run_loop($game(nat_in(a0),a1)), 2),
  "keep.if": run_lib((a0,a1) => run_loop($keep_if(a0,a1)), 2),
  "keep": run_lib((a0) => run_loop($keep(a0)), 1),
};
