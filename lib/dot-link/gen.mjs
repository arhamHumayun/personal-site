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

function $dots_Path() {
  return null;
}

function $dots_Puzzle_seed(_p_0) {
  const _s_0 = _p_0["seed"];
  return _s_0;
}

function $dots_Puzzle_game(_p_0) {
  const _g_0 = _p_0["game"];
  return _g_0;
}

function $dots_Game_w(_g_0) {
  const _w_0 = _g_0["w"];
  return _w_0;
}

function $dots_Game_h(_g_0) {
  const _h_0 = _g_0["h"];
  return _h_0;
}

function $dots_Game_pairs(_g_0) {
  const _pairs_0 = _g_0["pairs"];
  return _pairs_0;
}

function $dots_Game_sol(_g_0) {
  const _sol_0 = _g_0["sol"];
  return _sol_0;
}

function $dots_Pos_eq(_a_0, _b_0) {
  const _ax_0 = _a_0["x"];
  const _ay_0 = _a_0["y"];
  const _bx_0 = _b_0["x"];
  const _by_0 = _b_0["y"];
  return $Bool_and(($Nat_is_eq(_ax_0, _bx_0)), ($Nat_is_eq(_ay_0, _by_0)));
}

function $dots_inside(_w_0, _h_0, _p_0) {
  const _x_0 = _p_0["x"];
  const _y_0 = _p_0["y"];
  return $Bool_and((_x_0 < _w_0), (_y_0 < _h_0));
}

function $dots_gap(_a_0, _b_0) {
  const _x_0 = (_a_0 < _b_0 ? 0 : _a_0 - _b_0);
  const _x_1 = (_b_0 < _a_0 ? 0 : _b_0 - _a_0);
  return nat_chk(_x_0 + _x_1);
}

function $dots_touch(_a_0, _b_0) {
  const _ax_0 = _a_0["x"];
  const _ay_0 = _a_0["y"];
  const _bx_0 = _b_0["x"];
  const _by_0 = _b_0["y"];
  const _x_0 = ($dots_gap(_ax_0, _bx_0));
  const _x_1 = ($dots_gap(_ay_0, _by_0));
  return $Nat_is_eq(nat_chk(_x_0 + _x_1), 1);
}

function $dots_walk(_path_0, _w_0, _h_0, _prev_0) {
  if (_path_0.$ === "Nil") {
    return true;
  } else {
    const _p_0 = _path_0["head"];
    const _rest_0 = _path_0["tail"];
    return $Bool_and(($dots_inside(_w_0, _h_0, _p_0)), ($Bool_and(($dots_touch(_prev_0, _p_0)), ($dots_walk(_rest_0, _w_0, _h_0, _p_0)))));
  }
}

function $dots_ends_at(_path_0, _b_0) {
  if (_path_0.$ === "Nil") {
    return false;
  } else {
    const _p_0 = _path_0["head"];
    const _rest_0 = _path_0["tail"];
    return $dots_Pos_eq(($List_last_go(_rest_0, _p_0)), _b_0);
  }
}

function $dots_joins(_w_0, _h_0, _pair_0, _path_0) {
  const _a_0 = _pair_0["a"];
  const _b_0 = _pair_0["b"];
  if (_path_0.$ === "Nil") {
    return false;
  } else {
    const _p_0 = _path_0["head"];
    const _rest_0 = _path_0["tail"];
    return $Bool_and(($dots_Pos_eq(_p_0, _a_0)), ($Bool_and(($dots_inside(_w_0, _h_0, _p_0)), ($Bool_and(($dots_walk(_rest_0, _w_0, _h_0, _p_0)), ($dots_ends_at({$: "Con", "head": _p_0, "tail": _rest_0}, _b_0)))))));
  }
}

function $dots_connects(_w_0, _h_0, _pairs_0, _sol_0) {
  if (_pairs_0.$ === "Nil") {
    if (_sol_0.$ === "Nil") {
      return true;
    } else {
      return false;
    }
  } else {
    const _pr_0 = _pairs_0["head"];
    const _prs_0 = _pairs_0["tail"];
    if (_sol_0.$ === "Con") {
      const _pa_0 = _sol_0["head"];
      const _pas_0 = _sol_0["tail"];
      return $Bool_and(($dots_joins(_w_0, _h_0, _pr_0, _pa_0)), ($dots_connects(_w_0, _h_0, _prs_0, _pas_0)));
    } else {
      return false;
    }
  }
}

function $dots_fresh(_cells_0, _p_0) {
  if (_cells_0.$ === "Nil") {
    return true;
  } else {
    const _c_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    return $Bool_and(($Bool_not(($dots_Pos_eq(_c_0, _p_0)))), ($dots_fresh(_rest_0, _p_0)));
  }
}

function $dots_distinct(_cells_0) {
  if (_cells_0.$ === "Nil") {
    return true;
  } else {
    const _p_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    return $Bool_and(($dots_fresh(_rest_0, _p_0)), ($dots_distinct(_rest_0)));
  }
}

function $dots_all_inside(_cells_0, _w_0, _h_0) {
  if (_cells_0.$ === "Nil") {
    return true;
  } else {
    const _p_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    return $Bool_and(($dots_inside(_w_0, _h_0, _p_0)), ($dots_all_inside(_rest_0, _w_0, _h_0)));
  }
}

function $dots_fills(_w_0, _h_0, _sol_0) {
  const _cells_0 = ($List_concat(_sol_0));
  return $Bool_and(($dots_all_inside(_cells_0, _w_0, _h_0)), ($Bool_and(($Nat_is_eq(($List_length(_cells_0)), nat_chk(_w_0 * _h_0))), ($dots_distinct(_cells_0)))));
}

function $dots_solved(_w_0, _h_0, _pairs_0, _sol_0) {
  return $Bool_and(($dots_connects(_w_0, _h_0, _pairs_0, _sol_0)), ($dots_fills(_w_0, _h_0, _sol_0)));
}

function $dots_apart(_pairs_0) {
  if (_pairs_0.$ === "Nil") {
    return true;
  } else {
    const _t_0 = _pairs_0["head"];
    const _a_0 = _t_0["a"];
    const _b_0 = _t_0["b"];
    const _rest_0 = _pairs_0["tail"];
    return $Bool_and(($Bool_not(($dots_touch(_a_0, _b_0)))), ($dots_apart(_rest_0)));
  }
}

function $dots_clear(_cells_0, _p_0) {
  if (_cells_0.$ === "Nil") {
    return true;
  } else {
    const _c_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    return $Bool_and(($Bool_not(($dots_touch(_c_0, _p_0)))), ($dots_clear(_rest_0, _p_0)));
  }
}

function $dots_thin_line(_path_0) {
  if (_path_0.$ === "Nil") {
    return true;
  } else {
    const _p_0 = _path_0["head"];
    const _rest_0 = _path_0["tail"];
    return $Bool_and(($dots_clear(($List_tail(_rest_0)), _p_0)), ($dots_thin_line(_rest_0)));
  }
}

function $dots_thin(_sol_0) {
  if (_sol_0.$ === "Nil") {
    return true;
  } else {
    const _line_0 = _sol_0["head"];
    const _rest_0 = _sol_0["tail"];
    return $Bool_and(($dots_thin_line(_line_0)), ($dots_thin(_rest_0)));
  }
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

function $draw(_s_0, _slot_0) {
  const _x_0 = ($mix(_slot_0));
  return $mix(((_s_0 ^ _x_0) >>> 0));
}

function $nat_if(_c_0, _t_0, _f_0) {
  if (_c_0) {
    return _t_0;
  } else {
    return _f_0;
  }
}

function $snake_cell(_w_0, _i_0) {
  const _y_0 = ($Nat_div(_i_0, _w_0));
  const _c_0 = ($Nat_mod(_i_0, _w_0));
  const _x_0 = (_w_0 < 1 ? 0 : _w_0 - 1);
  return {$: "Pos", "x": ($nat_if(($Nat_is_eq(($Nat_mod(_y_0, 2)), 0)), _c_0, (_x_0 < _c_0 ? 0 : _x_0 - _c_0))), "y": _y_0};
}

function $snake(_n_0, _w_0, _i_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    return {$: "Con", "head": ($snake_cell(_w_0, _i_0)), "tail": ($snake(_k_0, _w_0, nat_chk(_i_0 + 1)))};
  }
}

function $some_if(_ok_0, _p_0) {
  if (_ok_0) {
    return {$: "Some", "value": _p_0};
  } else {
    return {$: "None"};
  }
}

function $near_go(_d_0, _w_0, _h_0, _x_0, _y_0) {
  if (_d_0 === 0) {
    return $some_if((0 < _y_0), {$: "Pos", "x": _x_0, "y": (_y_0 < 1 ? 0 : _y_0 - 1)});
  } else if (_d_0 === 1) {
    return $some_if((0 < _x_0), {$: "Pos", "x": (_x_0 < 1 ? 0 : _x_0 - 1), "y": _y_0});
  } else if (_d_0 === 2) {
    const _x_1 = nat_chk(_y_0 + 1);
    return $some_if((_x_1 < _h_0), {$: "Pos", "x": _x_0, "y": nat_chk(_y_0 + 1)});
  } else {
    const _x_2 = nat_chk(_x_0 + 1);
    return $some_if((_x_2 < _w_0), {$: "Pos", "x": nat_chk(_x_0 + 1), "y": _y_0});
  }
}

function $near(_w_0, _h_0, _p_0, _d_0) {
  const _x_0 = _p_0["x"];
  const _y_0 = _p_0["y"];
  return $near_go(_d_0, _w_0, _h_0, _x_0, _y_0);
}

function $index_if(_hit_0, _n_0) {
  if (_hit_0) {
    return 0;
  } else {
    return nat_chk(_n_0 + 1);
  }
}

function $index(_path_0, _q_0) {
  if (_path_0.$ === "Nil") {
    return 0;
  } else {
    const _p_0 = _path_0["head"];
    const _rest_0 = _path_0["tail"];
    return $index_if(($dots_Pos_eq(_p_0, _q_0)), ($index(_rest_0, _q_0)));
  }
}

function $bite_cut(_i_0, _path_0) {
  return $List_append(($List_reverse(($List_take(_path_0, _i_0)))), ($List_drop(_path_0, _i_0)));
}

function $bite_at(_q_0, _path_0) {
  if (_q_0.$ === "None") {
    return _path_0;
  } else {
    const _n_0 = _q_0["value"];
    return $bite_cut(($index(_path_0, _n_0)), _path_0);
  }
}

function $bite(_path_0, _w_0, _h_0, _d_0) {
  if (_path_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _p_0 = _path_0["head"];
    const _rest_0 = _path_0["tail"];
    return $bite_at(($near(_w_0, _h_0, _p_0, _d_0)), {$: "Con", "head": _p_0, "tail": _rest_0});
  }
}

function $orient(_flip_0, _path_0) {
  if (_flip_0) {
    return $List_reverse(_path_0);
  } else {
    return _path_0;
  }
}

function $shuffle($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _n_0 = $0;
      const _w_0 = $1;
      const _h_0 = $2;
      const _s_0 = $3;
      const _k_0 = $4;
      const _path_0 = $5;
      if (_n_0 === 0) {
        return _path_0;
      } else {
        const _f_0 = (_n_0 - 1);
        const _r_0 = ($draw(_s_0, _k_0));
        const _x_0 = ((_r_0 & 1) >>> 0);
        const _x_1 = (1 >= 32 ? 0 : (_r_0 >>> 1) >>> 0);
        const _x_2 = (4 === 0 ? _x_1 : _x_1 % 4);
        $0 = _f_0;
        $1 = _w_0;
        $2 = _h_0;
        $3 = _s_0;
        $4 = ((_k_0 + 1) >>> 0);
        $5 = ($bite(($orient((_x_0 === 1), _path_0)), _w_0, _h_0, _x_2));
        continue;
      }
    }
  }
}

function $touches(_cells_0, _p_0) {
  if (_cells_0.$ === "Nil") {
    return false;
  } else {
    const _c_0 = _cells_0["head"];
    const _rest_0 = _cells_0["tail"];
    const _x_0 = ($dots_touch(_c_0, _p_0));
    const _x_1 = ($touches(_rest_0, _p_0));
    return (_x_0 || _x_1);
  }
}

function $carve_cut(_hit_0, _p_0, _cur_0, _out_0) {
  if (_hit_0) {
    return {$: "Cut", "cur": {$: "Con", "head": _p_0, "tail": {$: "Nil"}}, "out": {$: "Con", "head": ($List_reverse(_cur_0)), "tail": _out_0}};
  } else {
    return {$: "Cut", "cur": {$: "Con", "head": _p_0, "tail": _cur_0}, "out": _out_0};
  }
}

function $carve_end(_short_0, _cur_0, _out_0) {
  if (!_short_0) {
    return $List_reverse({$: "Con", "head": ($List_reverse(_cur_0)), "tail": _out_0});
  } else {
    if (_out_0.$ === "Nil") {
      return {$: "Con", "head": ($List_reverse(_cur_0)), "tail": {$: "Nil"}};
    } else {
      const _last_0 = _out_0["head"];
      const _rest_0 = _out_0["tail"];
      return $List_reverse({$: "Con", "head": ($List_append(_last_0, ($List_reverse(_cur_0)))), "tail": _rest_0});
    }
  }
}

function $carve($0, $1) {
  for (;;) {
    {
      const _path_0 = $0;
      const _st_0 = $1;
      if (_path_0.$ === "Nil") {
        const _cur_0 = _st_0["cur"];
        const _out_0 = _st_0["out"];
        const _x_0 = ($List_length(_cur_0));
        return $carve_end((_x_0 < 3), _cur_0, _out_0);
      } else {
        const _p_0 = _path_0["head"];
        const _rest_0 = _path_0["tail"];
        const _cur_1 = _st_0["cur"];
        const _out_1 = _st_0["out"];
        $0 = _rest_0;
        $1 = ($carve_cut(($touches(($List_tail(_cur_1)), _p_0)), _p_0, _cur_1, _out_1));
        continue;
      }
    }
  }
}

function $ends(_sol_0) {
  if (_sol_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _line_0 = _sol_0["head"];
    const _rest_0 = _sol_0["tail"];
    const _o_0 = {$: "Pos", "x": 0, "y": 0};
    return {$: "Con", "head": {$: "Dots", "a": ($Maybe_default(($List_head(_line_0)), _o_0)), "b": ($Maybe_default(($List_last(_line_0)), _o_0))}, "tail": ($ends(_rest_0))};
  }
}

function $game(_n_0, _s_0) {
  const _cells_0 = nat_chk(_n_0 * _n_0);
  const _sol_0 = ($carve(($shuffle(nat_chk(_cells_0 * 12), _n_0, _n_0, _s_0, 16, ($snake(_cells_0, _n_0, 0)))), {$: "Cut", "cur": {$: "Nil"}, "out": {$: "Nil"}}));
  return {$: "Game", "w": _n_0, "h": _n_0, "pairs": ($ends(_sol_0)), "sol": _sol_0};
}

function $puzzle(_n_0, _s_0) {
  return {$: "Puzzle", "seed": _s_0, "game": ($game(_n_0, _s_0))};
}

function $size(_i_0) {
  const _x_0 = ($Nat_div((_i_0 < 1 ? 0 : _i_0 - 1), 5));
  const _x_1 = nat_chk(5 + _x_0);
  return (_x_1 < 9 ? _x_1 : 9);
}

function $min_pairs(_i_0) {
  const _x_0 = ($size(_i_0));
  return (_x_0 < 1 ? 0 : _x_0 - 1);
}

function $max_pairs(_i_0) {
  const _x_0 = ($size(_i_0));
  return nat_chk(_x_0 + 3);
}

function $accept_lines(_g_0) {
  return $Bool_and(($dots_thin(($dots_Game_sol(_g_0)))), ($dots_solved(($dots_Game_w(_g_0)), ($dots_Game_h(_g_0)), ($dots_Game_pairs(_g_0)), ($dots_Game_sol(_g_0)))));
}

function $accept_dots(_i_0, _g_0) {
  const _count_0 = ($List_length(($dots_Game_pairs(_g_0))));
  return $Bool_and(($Bool_and(($Nat_is_le(($min_pairs(_i_0)), _count_0)), ($Nat_is_le(_count_0, ($max_pairs(_i_0)))))), ($Bool_and(($dots_apart(($dots_Game_pairs(_g_0)))), ($accept_lines(_g_0)))));
}

function $accept_size(_i_0, _g_0) {
  return $Bool_and(($Nat_is_eq(($dots_Game_h(_g_0)), ($size(_i_0)))), ($accept_dots(_i_0, _g_0)));
}

function $accept(_i_0, _p_0) {
  return $Bool_and(($Nat_is_eq(($dots_Game_w(($dots_Puzzle_game(_p_0)))), ($size(_i_0)))), ($accept_size(_i_0, ($dots_Puzzle_game(_p_0)))));
}

function $keep_if(_p_0, _ok_0) {
  if (_ok_0) {
    return {$: "Some", "value": _p_0};
  } else {
    return {$: "None"};
  }
}

function $keep(_i_0, _p_0) {
  return $keep_if(_p_0, ($accept(_i_0, _p_0)));
}

function $seed(_base_0, _i_0, _a_0) {
  const _x_0 = (_i_0 >>> 0);
  const _x_1 = ($mix(((_base_0 ^ _x_0) >>> 0)));
  const _x_2 = (Math.imul(_a_0, 2654435769) >>> 0);
  return $mix(((_x_1 + _x_2) >>> 0));
}

function $tries($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _k_0 = $0;
      const _base_0 = $1;
      const _i_0 = $2;
      const _a_0 = $3;
      const _m_0 = $4;
      if (_k_0 === 0) {
        return _m_0;
      } else {
        const _f_0 = (_k_0 - 1);
        if (_m_0.$ === "Some") {
          const _p_0 = _m_0["value"];
          return {$: "Some", "value": _p_0};
        } else {
          $0 = _f_0;
          $1 = _base_0;
          $2 = _i_0;
          $3 = ((_a_0 + 1) >>> 0);
          $4 = ($keep(_i_0, ($puzzle(($size(_i_0)), ($seed(_base_0, _i_0, _a_0))))));
          continue;
        }
      }
    }
  }
}

function $level(_base_0, _i_0) {
  return $tries(1000, _base_0, _i_0, 0, {$: "None"});
}

function $Bool_and(_a_0, _b_0) {
  if (!_a_0) {
    return false;
  } else {
    return _b_0;
  }
}

function $Nat_is_eq(_a_0, _b_0) {
  return $Cmp_is_eq(cmp_new(_a_0, _b_0));
}

function $List_last_go($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _last_0 = $1;
      if (_xs_0.$ === "Nil") {
        return _last_0;
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        $0 = _t_0;
        $1 = _h_0;
        continue;
      }
    }
  }
}

function $Bool_not(_b_0) {
  if (!_b_0) {
    return true;
  } else {
    return false;
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

function $List_length(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return 0;
  } else {
    const _t_0 = _xs_0["tail"];
    return nat_chk(($List_length(_t_0)) + 1);
  }
}

function $List_tail(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _t_0 = _xs_0["tail"];
    return _t_0;
  }
}

function $Nat_div(_a_0, _b_0) {
  return $Pair_fst(nat_divmod(_a_0, _b_0));
}

function $Nat_mod(_a_0, _b_0) {
  return $Pair_snd(nat_divmod(_a_0, _b_0));
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

function $List_reverse(_xs_0) {
  return $List_reverse_go(_xs_0, {$: "Nil"});
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

function $List_drop($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _n_0 = $1;
      if (_xs_0.$ === "Nil") {
        return {$: "Nil"};
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        if (_n_0 === 0) {
          return {$: "Con", "head": _h_0, "tail": _t_0};
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

function $Maybe_default(_m_0, _d_0) {
  if (_m_0.$ === "None") {
    return _d_0;
  } else {
    const _x_0 = _m_0["value"];
    return _x_0;
  }
}

function $List_head(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "None"};
  } else {
    const _h_0 = _xs_0["head"];
    return {$: "Some", "value": _h_0};
  }
}

function $List_last(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "None"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Some", "value": ($List_last_go(_t_0, _h_0))};
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

function $Pair_fst(_p_0) {
  const _a_0 = _p_0["fst"];
  return _a_0;
}

function $Pair_snd(_p_0) {
  const _b_0 = _p_0["snd"];
  return _b_0;
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

function $Cmp_is_le(_c_0) {
  if (_c_0.$ === "GT") {
    return false;
  } else {
    return true;
  }
}
export default {
  "dots:Path": run_lib(() => run_loop($dots_Path()), 0),
  "dots:Puzzle.seed": run_lib((a0) => run_loop($dots_Puzzle_seed(a0)), 1),
  "dots:Puzzle.game": run_lib((a0) => run_loop($dots_Puzzle_game(a0)), 1),
  "dots:Game.w": run_lib((a0) => run_loop($dots_Game_w(a0)), 1),
  "dots:Game.h": run_lib((a0) => run_loop($dots_Game_h(a0)), 1),
  "dots:Game.pairs": run_lib((a0) => run_loop($dots_Game_pairs(a0)), 1),
  "dots:Game.sol": run_lib((a0) => run_loop($dots_Game_sol(a0)), 1),
  "dots:Pos.eq": run_lib((a0,a1) => run_loop($dots_Pos_eq(a0,a1)), 2),
  "dots:inside": run_lib((a0,a1,a2) => run_loop($dots_inside(nat_in(a0),nat_in(a1),a2)), 3),
  "dots:gap": run_lib((a0,a1) => run_loop($dots_gap(nat_in(a0),nat_in(a1))), 2),
  "dots:touch": run_lib((a0,a1) => run_loop($dots_touch(a0,a1)), 2),
  "dots:walk": run_lib((a0,a1,a2,a3) => run_loop($dots_walk(a0,nat_in(a1),nat_in(a2),a3)), 4),
  "dots:ends_at": run_lib((a0,a1) => run_loop($dots_ends_at(a0,a1)), 2),
  "dots:joins": run_lib((a0,a1,a2,a3) => run_loop($dots_joins(nat_in(a0),nat_in(a1),a2,a3)), 4),
  "dots:connects": run_lib((a0,a1,a2,a3) => run_loop($dots_connects(nat_in(a0),nat_in(a1),a2,a3)), 4),
  "dots:fresh": run_lib((a0,a1) => run_loop($dots_fresh(a0,a1)), 2),
  "dots:distinct": run_lib((a0) => run_loop($dots_distinct(a0)), 1),
  "dots:all_inside": run_lib((a0,a1,a2) => run_loop($dots_all_inside(a0,nat_in(a1),nat_in(a2))), 3),
  "dots:fills": run_lib((a0,a1,a2) => run_loop($dots_fills(nat_in(a0),nat_in(a1),a2)), 3),
  "dots:solved": run_lib((a0,a1,a2,a3) => run_loop($dots_solved(nat_in(a0),nat_in(a1),a2,a3)), 4),
  "dots:apart": run_lib((a0) => run_loop($dots_apart(a0)), 1),
  "dots:clear": run_lib((a0,a1) => run_loop($dots_clear(a0,a1)), 2),
  "dots:thin.line": run_lib((a0) => run_loop($dots_thin_line(a0)), 1),
  "dots:thin": run_lib((a0) => run_loop($dots_thin(a0)), 1),
  "mix": run_lib((a0) => run_loop($mix(a0)), 1),
  "draw": run_lib((a0,a1) => run_loop($draw(a0,a1)), 2),
  "nat.if": run_lib((a0,a1,a2) => run_loop($nat_if(a0,nat_in(a1),nat_in(a2))), 3),
  "snake.cell": run_lib((a0,a1) => run_loop($snake_cell(nat_in(a0),nat_in(a1))), 2),
  "snake": run_lib((a0,a1,a2) => run_loop($snake(nat_in(a0),nat_in(a1),nat_in(a2))), 3),
  "some.if": run_lib((a0,a1) => run_loop($some_if(a0,a1)), 2),
  "near.go": run_lib((a0,a1,a2,a3,a4) => run_loop($near_go(nat_in(a0),nat_in(a1),nat_in(a2),nat_in(a3),nat_in(a4))), 5),
  "near": run_lib((a0,a1,a2,a3) => run_loop($near(nat_in(a0),nat_in(a1),a2,nat_in(a3))), 4),
  "index.if": run_lib((a0,a1) => run_loop($index_if(a0,nat_in(a1))), 2),
  "index": run_lib((a0,a1) => run_loop($index(a0,a1)), 2),
  "bite.cut": run_lib((a0,a1) => run_loop($bite_cut(nat_in(a0),a1)), 2),
  "bite.at": run_lib((a0,a1) => run_loop($bite_at(a0,a1)), 2),
  "bite": run_lib((a0,a1,a2,a3) => run_loop($bite(a0,nat_in(a1),nat_in(a2),nat_in(a3))), 4),
  "orient": run_lib((a0,a1) => run_loop($orient(a0,a1)), 2),
  "shuffle": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($shuffle(nat_in(a0),nat_in(a1),nat_in(a2),a3,a4,a5)), 6),
  "touches": run_lib((a0,a1) => run_loop($touches(a0,a1)), 2),
  "carve.cut": run_lib((a0,a1,a2,a3) => run_loop($carve_cut(a0,a1,a2,a3)), 4),
  "carve.end": run_lib((a0,a1,a2) => run_loop($carve_end(a0,a1,a2)), 3),
  "carve": run_lib((a0,a1) => run_loop($carve(a0,a1)), 2),
  "ends": run_lib((a0) => run_loop($ends(a0)), 1),
  "game": run_lib((a0,a1) => run_loop($game(nat_in(a0),a1)), 2),
  "puzzle": run_lib((a0,a1) => run_loop($puzzle(nat_in(a0),a1)), 2),
  "size": run_lib((a0) => run_loop($size(nat_in(a0))), 1),
  "min_pairs": run_lib((a0) => run_loop($min_pairs(nat_in(a0))), 1),
  "max_pairs": run_lib((a0) => run_loop($max_pairs(nat_in(a0))), 1),
  "accept.lines": run_lib((a0) => run_loop($accept_lines(a0)), 1),
  "accept.dots": run_lib((a0,a1) => run_loop($accept_dots(nat_in(a0),a1)), 2),
  "accept.size": run_lib((a0,a1) => run_loop($accept_size(nat_in(a0),a1)), 2),
  "accept": run_lib((a0,a1) => run_loop($accept(nat_in(a0),a1)), 2),
  "keep.if": run_lib((a0,a1) => run_loop($keep_if(a0,a1)), 2),
  "keep": run_lib((a0,a1) => run_loop($keep(nat_in(a0),a1)), 2),
  "seed": run_lib((a0,a1,a2) => run_loop($seed(a0,nat_in(a1),a2)), 3),
  "tries": run_lib((a0,a1,a2,a3,a4) => run_loop($tries(nat_in(a0),a1,nat_in(a2),a3,a4)), 5),
  "level": run_lib((a0,a1) => run_loop($level(a0,nat_in(a1))), 2),
};
