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

function $mines_Cells() {
  return null;
}

function $mines_cell(_c_0) {
  if (_c_0.$ === "None") {
    return false;
  } else {
    const _b_0 = _c_0["value"];
    return _b_0;
  }
}

function $mines_at(_cells_0, _i_0) {
  return $mines_cell(($List_get(_cells_0, _i_0)));
}

function $mines_count($0) {
  for (;;) {
    {
      const _cells_0 = $0;
      if (_cells_0.$ === "Nil") {
        return 0;
      } else {
        const _t_0 = _cells_0["head"];
        if (_t_0) {
          const _rest_0 = _cells_0["tail"];
          return nat_chk(($mines_count(_rest_0)) + 1);
        } else {
          const _rest_1 = _cells_0["tail"];
          $0 = _rest_1;
          continue;
        }
      }
    }
  }
}

function $mines_close(_a_0, _b_0) {
  return $Bool_and(($Nat_is_le(_a_0, nat_chk(_b_0 + 1))), ($Nat_is_le(_b_0, nat_chk(_a_0 + 1))));
}

function $mines_near(_w_0, _i_0, _j_0) {
  return $Bool_and(($mines_close(($Nat_mod(_i_0, _w_0)), ($Nat_mod(_j_0, _w_0)))), ($mines_close(($Nat_div(_i_0, _w_0)), ($Nat_div(_j_0, _w_0)))));
}

function $mines_clear(_cells_0, _w_0, _first_0, _i_0) {
  if (_cells_0.$ === "Nil") {
    return true;
  } else {
    const _c_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    const _x_0 = ($Bool_not(_c_0));
    const _x_1 = ($Bool_not(($mines_near(_w_0, _first_0, _i_0))));
    return $Bool_and((_x_0 || _x_1), ($mines_clear(_rest_0, _w_0, _first_0, nat_chk(_i_0 + 1))));
  }
}

function $mines_valid(_w_0, _h_0, _mines_0, _first_0, _cells_0) {
  return $Bool_and(($Nat_is_eq(($List_length(_cells_0)), nat_chk(_w_0 * _h_0))), ($Bool_and(($Nat_is_eq(($mines_count(_cells_0)), _mines_0)), ($mines_clear(_cells_0, _w_0, _first_0, 0)))));
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

function $rank_le(_a_0, _b_0) {
  const _ra_0 = _a_0["rank"];
  const _rb_0 = _b_0["rank"];
  return (_ra_0 <= _rb_0);
}

function $keys_if(_far_0, _k_0, _rest_0) {
  if (_far_0) {
    return {$: "Con", "head": _k_0, "tail": _rest_0};
  } else {
    return _rest_0;
  }
}

function $keys(_n_0, _w_0, _first_0, _seed_0, _i_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    const _x_0 = ($mix((_i_0 >>> 0)));
    return $keys_if(($Bool_not(($mines_near(_w_0, _first_0, _i_0)))), {$: "Rank", "rank": ($mix(((_seed_0 ^ _x_0) >>> 0))), "cell": _i_0}, ($keys(_k_0, _w_0, _first_0, _seed_0, nat_chk(_i_0 + 1))));
  }
}

function $chosen(_ks_0) {
  if (_ks_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _t_0 = _ks_0["head"];
    const _c_0 = _t_0["cell"];
    const _rest_0 = _ks_0["tail"];
    return {$: "Con", "head": _c_0, "tail": ($chosen(_rest_0))};
  }
}

function $has(_xs_0, _i_0) {
  if (_xs_0.$ === "Nil") {
    return false;
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _x_1 = ($Nat_is_eq(_x_0, _i_0));
    const _x_2 = ($has(_rest_0, _i_0));
    return (_x_1 || _x_2);
  }
}

function $lay(_n_0, _mines_0, _i_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    return {$: "Con", "head": ($has(_mines_0, _i_0)), "tail": ($lay(_k_0, _mines_0, nat_chk(_i_0 + 1)))};
  }
}

function $layout(_w_0, _h_0, _mines_0, _first_0, _seed_0) {
  const _n_0 = nat_chk(_w_0 * _h_0);
  const _ks_0 = ($List_sort_0(($keys(_n_0, _w_0, _first_0, _seed_0, 0))));
  return $lay(_n_0, ($chosen(($List_take(_ks_0, _mines_0)))), 0);
}

function $keep_if(_cells_0, _ok_0) {
  if (_ok_0) {
    return {$: "Some", "value": _cells_0};
  } else {
    return {$: "None"};
  }
}

function $board(_w_0, _h_0, _mines_0, _first_0, _seed_0) {
  const _cells_0 = ($layout(_w_0, _h_0, _mines_0, _first_0, _seed_0));
  return $keep_if(_cells_0, ($mines_valid(_w_0, _h_0, _mines_0, _first_0, _cells_0)));
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

function $Bool_and(_a_0, _b_0) {
  if (!_a_0) {
    return false;
  } else {
    return _b_0;
  }
}

function $Nat_is_le(_a_0, _b_0) {
  return $Cmp_is_le(cmp_new(_a_0, _b_0));
}

function $Nat_mod(_a_0, _b_0) {
  return $Pair_snd(nat_divmod(_a_0, _b_0));
}

function $Nat_div(_a_0, _b_0) {
  return $Pair_fst(nat_divmod(_a_0, _b_0));
}

function $Bool_not(_b_0) {
  if (!_b_0) {
    return true;
  } else {
    return false;
  }
}

function $Nat_is_eq(_a_0, _b_0) {
  return $Cmp_is_eq(cmp_new(_a_0, _b_0));
}

function $List_length(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return 0;
  } else {
    const _t_0 = _xs_0["tail"];
    return nat_chk(($List_length(_t_0)) + 1);
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

function $List_take(_xs_0, _n_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    if (_n_0 === 0) {
      return {$: "Nil"};
    } else {
      const _p_0 = (_n_0 - 1);
      return {$: "Con", "head": _h_0, "tail": ($List_take(_t_0, _p_0))};
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

function $Pair_snd(_p_0) {
  const _b_0 = _p_0["snd"];
  return _b_0;
}

function $Pair_fst(_p_0) {
  const _a_0 = _p_0["fst"];
  return _a_0;
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

function $List_concat(_xss_0) {
  if (_xss_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xss_0["head"];
    const _t_0 = _xss_0["tail"];
    return $List_append(_h_0, ($List_concat(_t_0)));
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

function $List_append(_xs_0, _ys_0) {
  if (_xs_0.$ === "Nil") {
    return _ys_0;
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Con", "head": _h_0, "tail": ($List_append(_t_0, _ys_0))};
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
export default {
  "mines:Cells": run_lib(() => run_loop($mines_Cells()), 0),
  "mines:cell": run_lib((a0) => run_loop($mines_cell(a0)), 1),
  "mines:at": run_lib((a0,a1) => run_loop($mines_at(a0,nat_in(a1))), 2),
  "mines:count": run_lib((a0) => run_loop($mines_count(a0)), 1),
  "mines:close": run_lib((a0,a1) => run_loop($mines_close(nat_in(a0),nat_in(a1))), 2),
  "mines:near": run_lib((a0,a1,a2) => run_loop($mines_near(nat_in(a0),nat_in(a1),nat_in(a2))), 3),
  "mines:clear": run_lib((a0,a1,a2,a3) => run_loop($mines_clear(a0,nat_in(a1),nat_in(a2),nat_in(a3))), 4),
  "mines:valid": run_lib((a0,a1,a2,a3,a4) => run_loop($mines_valid(nat_in(a0),nat_in(a1),nat_in(a2),nat_in(a3),a4)), 5),
  "mix": run_lib((a0) => run_loop($mix(a0)), 1),
  "rank_le": run_lib((a0,a1) => run_loop($rank_le(a0,a1)), 2),
  "keys.if": run_lib((a0,a1,a2) => run_loop($keys_if(a0,a1,a2)), 3),
  "keys": run_lib((a0,a1,a2,a3,a4) => run_loop($keys(nat_in(a0),nat_in(a1),nat_in(a2),a3,nat_in(a4))), 5),
  "chosen": run_lib((a0) => run_loop($chosen(a0)), 1),
  "has": run_lib((a0,a1) => run_loop($has(a0,nat_in(a1))), 2),
  "lay": run_lib((a0,a1,a2) => run_loop($lay(nat_in(a0),a1,nat_in(a2))), 3),
  "layout": run_lib((a0,a1,a2,a3,a4) => run_loop($layout(nat_in(a0),nat_in(a1),nat_in(a2),nat_in(a3),a4)), 5),
  "keep.if": run_lib((a0,a1) => run_loop($keep_if(a0,a1)), 2),
  "board": run_lib((a0,a1,a2,a3,a4) => run_loop($board(nat_in(a0),nat_in(a1),nat_in(a2),nat_in(a3),a4)), 5),
};
