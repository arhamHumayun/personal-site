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

function $ice_Grid() {
  return null;
}

function $ice_Dists() {
  return null;
}

function $ice_Puzzle_seed(_p_0) {
  const _s_0 = _p_0["seed"];
  return _s_0;
}

function $ice_Puzzle_game(_p_0) {
  const _g_0 = _p_0["game"];
  return _g_0;
}

function $ice_Game_grid(_g_0) {
  const _grid_0 = _g_0["grid"];
  return _grid_0;
}

function $ice_Game_start(_g_0) {
  const _s_0 = _g_0["start"];
  return _s_0;
}

function $ice_Game_exit(_g_0) {
  const _e_0 = _g_0["exit"];
  return _e_0;
}

function $ice_Game_par(_g_0) {
  const _par_0 = _g_0["par"];
  return _par_0;
}

function $ice_Game_sol(_g_0) {
  const _sol_0 = _g_0["sol"];
  return _sol_0;
}

function $ice_Game_dists(_g_0) {
  const _ds_0 = _g_0["dists"];
  return _ds_0;
}

function $ice_Game_fuel(_g_0) {
  const _w_0 = _g_0["w"];
  const _h_0 = _g_0["h"];
  return nat_chk(_w_0 + _h_0);
}

function $ice_cell(_c_0) {
  if (_c_0.$ === "None") {
    return true;
  } else {
    const _b_0 = _c_0["value"];
    return _b_0;
  }
}

function $ice_row(_r_0, _x_0) {
  if (_r_0.$ === "None") {
    return true;
  } else {
    const _cells_0 = _r_0["value"];
    return $ice_cell(($List_get(_cells_0, _x_0)));
  }
}

function $ice_blocked(_g_0, _p_0) {
  const _x_0 = _p_0["x"];
  const _y_0 = _p_0["y"];
  return $ice_row(($List_get(_g_0, _y_0)), _x_0);
}

function $ice_hits(_g_0, _q_0) {
  if (_q_0.$ === "None") {
    return true;
  } else {
    const _p_0 = _q_0["value"];
    return $ice_blocked(_g_0, _p_0);
  }
}

function $ice_next(_d_0, _p_0) {
  if (_d_0.$ === "Up") {
    const _x_0 = _p_0["x"];
    const _t_0 = _p_0["y"];
    if (_t_0 === 0) {
      return {$: "None"};
    } else {
      const _y_0 = (_t_0 - 1);
      return {$: "Some", "value": {$: "Pos", "x": _x_0, "y": _y_0}};
    }
  } else if (_d_0.$ === "Down") {
    const _x_1 = _p_0["x"];
    const _y_1 = _p_0["y"];
    return {$: "Some", "value": {$: "Pos", "x": _x_1, "y": nat_chk(_y_1 + 1)}};
  } else if (_d_0.$ === "Left") {
    const _t_1 = _p_0["x"];
    if (_t_1 === 0) {
      return {$: "None"};
    } else {
      const _x_2 = (_t_1 - 1);
      const _y_3 = _p_0["y"];
      return {$: "Some", "value": {$: "Pos", "x": _x_2, "y": _y_3}};
    }
  } else {
    const _x_3 = _p_0["x"];
    const _y_4 = _p_0["y"];
    return {$: "Some", "value": {$: "Pos", "x": nat_chk(_x_3 + 1), "y": _y_4}};
  }
}

function $ice_slide_go($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _g_0 = $1;
      const _d_0 = $2;
      const _p_0 = $3;
      const _stop_0 = $4;
      const _q_0 = $5;
      if (_fuel_0 === 0) {
        return _p_0;
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (_stop_0) {
          return _p_0;
        } else {
          if (_q_0.$ === "None") {
            return _p_0;
          } else {
            const _n_0 = _q_0["value"];
            $0 = _f_0;
            $1 = _g_0;
            $2 = _d_0;
            $3 = _n_0;
            $4 = ($ice_hits(_g_0, ($ice_next(_d_0, _n_0))));
            $5 = ($ice_next(_d_0, _n_0));
            continue;
          }
        }
      }
    }
  }
}

function $ice_slide(_g_0, _d_0, _p_0, _fuel_0) {
  return $ice_slide_go(_fuel_0, _g_0, _d_0, _p_0, ($ice_hits(_g_0, ($ice_next(_d_0, _p_0)))), ($ice_next(_d_0, _p_0)));
}

function $ice_replay($0, $1, $2, $3) {
  for (;;) {
    {
      const _ms_0 = $0;
      const _g_0 = $1;
      const _fuel_0 = $2;
      const _p_0 = $3;
      if (_ms_0.$ === "Nil") {
        return _p_0;
      } else {
        const _d_0 = _ms_0["head"];
        const _rest_0 = _ms_0["tail"];
        $0 = _rest_0;
        $1 = _g_0;
        $2 = _fuel_0;
        $3 = ($ice_slide(_g_0, _d_0, _p_0, _fuel_0));
        continue;
      }
    }
  }
}

function $ice_Pos_eq(_a_0, _b_0) {
  const _ax_0 = _a_0["x"];
  const _ay_0 = _a_0["y"];
  const _bx_0 = _b_0["x"];
  const _by_0 = _b_0["y"];
  return $Bool_and(($Nat_is_eq(_ax_0, _bx_0)), ($Nat_is_eq(_ay_0, _by_0)));
}

function $ice_dist_row(_r_0, _x_0) {
  if (_r_0.$ === "None") {
    return 0;
  } else {
    const _cells_0 = _r_0["value"];
    return $Maybe_default(($List_get(_cells_0, _x_0)), 0);
  }
}

function $ice_dist(_ds_0, _p_0) {
  const _x_0 = _p_0["x"];
  const _y_0 = _p_0["y"];
  return $ice_dist_row(($List_get(_ds_0, _y_0)), _x_0);
}

function $ice_step_ok(_g_0, _ds_0, _fuel_0, _p_0, _d_0) {
  return $Nat_is_le(($ice_dist(_ds_0, ($ice_slide(_g_0, _d_0, _p_0, _fuel_0)))), nat_chk(($ice_dist(_ds_0, _p_0)) + 1));
}

function $ice_ok_rest2(_g_0, _ds_0, _fuel_0, _p_0) {
  return $Bool_and(($ice_step_ok(_g_0, _ds_0, _fuel_0, _p_0, {$: "Left"})), ($ice_step_ok(_g_0, _ds_0, _fuel_0, _p_0, {$: "Right"})));
}

function $ice_ok_rest1(_g_0, _ds_0, _fuel_0, _p_0) {
  return $Bool_and(($ice_step_ok(_g_0, _ds_0, _fuel_0, _p_0, {$: "Down"})), ($ice_ok_rest2(_g_0, _ds_0, _fuel_0, _p_0)));
}

function $ice_ok(_g_0, _ds_0, _fuel_0, _p_0) {
  return $Bool_and(($ice_step_ok(_g_0, _ds_0, _fuel_0, _p_0, {$: "Up"})), ($ice_ok_rest1(_g_0, _ds_0, _fuel_0, _p_0)));
}

function $ice_check_cell(_rock_0, _g_0, _ds_0, _fuel_0, _p_0) {
  if (_rock_0) {
    return true;
  } else {
    return $ice_ok(_g_0, _ds_0, _fuel_0, _p_0);
  }
}

function $ice_check_row(_cells_0, _g_0, _ds_0, _fuel_0, _x_0, _y_0) {
  if (_cells_0.$ === "Nil") {
    return true;
  } else {
    const _c_0 = _cells_0["head"];
    const _cs_0 = _cells_0["tail"];
    return $Bool_and(($ice_check_cell(_c_0, _g_0, _ds_0, _fuel_0, {$: "Pos", "x": _x_0, "y": _y_0})), ($ice_check_row(_cs_0, _g_0, _ds_0, _fuel_0, nat_chk(_x_0 + 1), _y_0)));
  }
}

function $ice_check_rows(_rows_0, _g_0, _ds_0, _fuel_0, _y_0) {
  if (_rows_0.$ === "Nil") {
    return true;
  } else {
    const _r_0 = _rows_0["head"];
    const _rs_0 = _rows_0["tail"];
    return $Bool_and(($ice_check_row(_r_0, _g_0, _ds_0, _fuel_0, 0, _y_0)), ($ice_check_rows(_rs_0, _g_0, _ds_0, _fuel_0, nat_chk(_y_0 + 1))));
  }
}

function $ice_check(_g_0, _ds_0, _fuel_0) {
  return $ice_check_rows(_g_0, _g_0, _ds_0, _fuel_0, 0);
}

function $ice_Game_valid(_gm_0) {
  const _g_0 = ($ice_Game_grid(_gm_0));
  const _ds_0 = ($ice_Game_dists(_gm_0));
  const _fuel_0 = ($ice_Game_fuel(_gm_0));
  const _s_0 = ($ice_Game_start(_gm_0));
  const _par_0 = ($ice_Game_par(_gm_0));
  const _sol_0 = ($ice_Game_sol(_gm_0));
  return $Bool_and(($Bool_not(($ice_blocked(_g_0, _s_0)))), ($Bool_and(($Nat_is_eq(($ice_dist(_ds_0, _s_0)), 0)), ($Bool_and(($ice_check(_g_0, _ds_0, _fuel_0)), ($Bool_and(($ice_Pos_eq(($ice_replay(_sol_0, _g_0, _fuel_0, _s_0)), ($ice_Game_exit(_gm_0)))), ($Bool_and(($Nat_is_eq(($List_length(_sol_0)), _par_0)), ($Nat_is_le(_par_0, ($ice_dist(_ds_0, ($ice_Game_exit(_gm_0)))))))))))))));
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

function $below(_s_0, _slot_0, _n_0) {
  const _x_0 = ($draw(_s_0, _slot_0));
  const _x_1 = (_n_0 === 0 ? _x_0 : _x_0 % _n_0);
  return _x_1;
}

function $cell_slot(_base_0, _x_0, _y_0) {
  const _x_1 = nat_chk(_y_0 * 16);
  const _x_2 = nat_chk(_x_1 + _x_0);
  const _x_3 = (_x_2 >>> 0);
  return ((_base_0 + _x_3) >>> 0);
}

function $rock(_s_0, _dens_0, _x_0, _y_0, _start_0) {
  const _x_1 = ($below(_s_0, ($cell_slot(64, _x_0, _y_0)), 100));
  return $Bool_and(($Bool_not(($ice_Pos_eq({$: "Pos", "x": _x_0, "y": _y_0}, _start_0)))), (_x_1 < _dens_0));
}

function $board_row(_n_0, _s_0, _dens_0, _x_0, _y_0, _start_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    return {$: "Con", "head": ($rock(_s_0, _dens_0, _x_0, _y_0, _start_0)), "tail": ($board_row(_k_0, _s_0, _dens_0, nat_chk(_x_0 + 1), _y_0, _start_0))};
  }
}

function $board(_n_0, _s_0, _dens_0, _w_0, _y_0, _start_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    return {$: "Con", "head": ($board_row(_w_0, _s_0, _dens_0, 0, _y_0, _start_0)), "tail": ($board(_k_0, _s_0, _dens_0, _w_0, nat_chk(_y_0 + 1), _start_0))};
  }
}

function $inf() {
  return 255;
}

function $dset_row(_ds_0, _y_0, _x_0, _v_0) {
  if (_ds_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _r_0 = _ds_0["head"];
    const _rs_0 = _ds_0["tail"];
    if (_y_0 === 0) {
      return {$: "Con", "head": ($List_set(_r_0, _x_0, _v_0)), "tail": _rs_0};
    } else {
      const _k_0 = (_y_0 - 1);
      return {$: "Con", "head": _r_0, "tail": ($dset_row(_rs_0, _k_0, _x_0, _v_0))};
    }
  }
}

function $dset(_ds_0, _p_0, _v_0) {
  const _x_0 = _p_0["x"];
  const _y_0 = _p_0["y"];
  return $dset_row(_ds_0, _y_0, _x_0, _v_0);
}

function $expand(_front_0, _g_0, _d_0, _fuel_0) {
  if (_front_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _t_0 = _front_0["head"];
    const _p_0 = _t_0["pos"];
    const _path_0 = _t_0["path"];
    const _rest_0 = _front_0["tail"];
    return {$: "Con", "head": {$: "Seen", "pos": ($ice_slide(_g_0, _d_0, _p_0, _fuel_0)), "path": {$: "Con", "head": _d_0, "tail": _path_0}}, "tail": ($expand(_rest_0, _g_0, _d_0, _fuel_0))};
  }
}

function $visit_if(_fresh_0, _p_0, _path_0, _k_0, _ds_0, _front_0, _seen_0) {
  if (!_fresh_0) {
    return {$: "Bfs", "dists": _ds_0, "front": _front_0, "seen": _seen_0};
  } else {
    return {$: "Bfs", "dists": ($dset(_ds_0, _p_0, _k_0)), "front": {$: "Con", "head": {$: "Seen", "pos": _p_0, "path": _path_0}, "tail": _front_0}, "seen": {$: "Con", "head": {$: "Seen", "pos": _p_0, "path": _path_0}, "tail": _seen_0}};
  }
}

function $visit(_c_0, _k_0, _st_0) {
  const _p_0 = _c_0["pos"];
  const _path_0 = _c_0["path"];
  const _ds_0 = _st_0["dists"];
  const _front_0 = _st_0["front"];
  const _seen_0 = _st_0["seen"];
  return $visit_if(($Nat_is_eq(($ice_dist(_ds_0, _p_0)), ($inf()))), _p_0, _path_0, _k_0, _ds_0, _front_0, _seen_0);
}

function $absorb($0, $1, $2) {
  for (;;) {
    {
      const _cands_0 = $0;
      const _k_0 = $1;
      const _st_0 = $2;
      if (_cands_0.$ === "Nil") {
        return _st_0;
      } else {
        const _c_0 = _cands_0["head"];
        const _cs_0 = _cands_0["tail"];
        $0 = _cs_0;
        $1 = _k_0;
        $2 = ($visit(_c_0, _k_0, _st_0));
        continue;
      }
    }
  }
}

function $bfs($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _levels_0 = $0;
      const _g_0 = $1;
      const _fuel_0 = $2;
      const _k_0 = $3;
      const _st_0 = $4;
      if (_levels_0 === 0) {
        return _st_0;
      } else {
        const _l_0 = (_levels_0 - 1);
        const _ds_0 = _st_0["dists"];
        const _front_0 = _st_0["front"];
        const _seen_0 = _st_0["seen"];
        const _u_0 = ($expand(_front_0, _g_0, {$: "Up"}, _fuel_0));
        const _d_0 = ($expand(_front_0, _g_0, {$: "Down"}, _fuel_0));
        const _e_0 = ($expand(_front_0, _g_0, {$: "Left"}, _fuel_0));
        const _r_0 = ($expand(_front_0, _g_0, {$: "Right"}, _fuel_0));
        const _cands_0 = ($List_append(_u_0, ($List_append(_d_0, ($List_append(_e_0, _r_0))))));
        $0 = _l_0;
        $1 = _g_0;
        $2 = _fuel_0;
        $3 = nat_chk(_k_0 + 1);
        $4 = ($absorb(_cands_0, nat_chk(_k_0 + 1), {$: "Bfs", "dists": _ds_0, "front": {$: "Nil"}, "seen": _seen_0}));
        continue;
      }
    }
  }
}

function $tie(_s_0, _p_0) {
  const _x_0 = _p_0["x"];
  const _y_0 = _p_0["y"];
  return $draw(_s_0, ($cell_slot(4096, _x_0, _y_0)));
}

function $farther(_s_0, _hi_0, _a_0, _b_0) {
  const _ap_0 = _a_0["pos"];
  const _apath_0 = _a_0["path"];
  const _bp_0 = _b_0["pos"];
  const _bpath_0 = _b_0["path"];
  const _la_0 = ($List_length(_apath_0));
  const _lb_0 = ($List_length(_bpath_0));
  const _x_0 = ($tie(_s_0, _ap_0));
  const _x_1 = ($tie(_s_0, _bp_0));
  const _x_2 = ($Nat_is_gt(_la_0, _lb_0));
  const _x_3 = ($Bool_and(($Nat_is_eq(_la_0, _lb_0)), (_x_0 > _x_1)));
  return $Bool_and(($Nat_is_le(_la_0, _hi_0)), (_x_2 || _x_3));
}

function $pick_if(_better_0, _c_0, _cur_0) {
  if (_better_0) {
    return _c_0;
  } else {
    return _cur_0;
  }
}

function $pick($0, $1, $2, $3) {
  for (;;) {
    {
      const _seen_0 = $0;
      const _s_0 = $1;
      const _hi_0 = $2;
      const _cur_0 = $3;
      if (_seen_0.$ === "Nil") {
        return _cur_0;
      } else {
        const _c_0 = _seen_0["head"];
        const _rest_0 = _seen_0["tail"];
        $0 = _rest_0;
        $1 = _s_0;
        $2 = _hi_0;
        $3 = ($pick_if(($farther(_s_0, _hi_0, _c_0, _cur_0)), _c_0, _cur_0));
        continue;
      }
    }
  }
}

function $game_fin(_w_0, _h_0, _g_0, _start_0, _ds_0, _exit_0) {
  const _e_0 = _exit_0["pos"];
  const _path_0 = _exit_0["path"];
  return {$: "Game", "w": _w_0, "h": _h_0, "grid": _g_0, "start": _start_0, "exit": _e_0, "par": ($List_length(_path_0)), "sol": ($List_reverse(_path_0)), "dists": _ds_0};
}

function $game_bfs(_s_0, _hi_0, _w_0, _h_0, _g_0, _start_0, _st_0) {
  const _ds_0 = _st_0["dists"];
  const _seen_0 = _st_0["seen"];
  return $game_fin(_w_0, _h_0, _g_0, _start_0, _ds_0, ($pick(_seen_0, _s_0, _hi_0, {$: "Seen", "pos": _start_0, "path": {$: "Nil"}})));
}

function $game(_hi_0, _s_0) {
  const _x_0 = ($below(_s_0, 1, 5));
  const _w_0 = nat_chk(8 + _x_0);
  const _x_1 = ($below(_s_0, 2, 5));
  const _h_0 = nat_chk(8 + _x_1);
  const _x_2 = ($below(_s_0, 3, 10));
  const _dens_0 = nat_chk(12 + _x_2);
  const _start_0 = {$: "Pos", "x": ($below(_s_0, 4, (_w_0 >>> 0))), "y": ($below(_s_0, 5, (_h_0 >>> 0)))};
  const _g_0 = ($board(_h_0, _s_0, _dens_0, _w_0, 0, _start_0));
  const _ds_0 = ($dset(($List_replicate(_h_0, ($List_replicate(_w_0, ($inf()))))), _start_0, 0));
  const _seen_0 = {$: "Con", "head": {$: "Seen", "pos": _start_0, "path": {$: "Nil"}}, "tail": {$: "Nil"}};
  return $game_bfs(_s_0, _hi_0, _w_0, _h_0, _g_0, _start_0, ($bfs(nat_chk(_w_0 * _h_0), _g_0, nat_chk(_w_0 + _h_0), 0, {$: "Bfs", "dists": _ds_0, "front": _seen_0, "seen": _seen_0})));
}

function $puzzle(_hi_0, _s_0) {
  return {$: "Puzzle", "seed": _s_0, "game": ($game(_hi_0, _s_0))};
}

function $accept(_lo_0, _hi_0, _p_0) {
  const _par_0 = ($ice_Game_par(($ice_Puzzle_game(_p_0))));
  return $Bool_and(($Bool_and(($Nat_is_le(_lo_0, _par_0)), ($Nat_is_le(_par_0, _hi_0)))), ($ice_Game_valid(($ice_Puzzle_game(_p_0)))));
}

function $keep_if(_p_0, _ok_0) {
  if (_ok_0) {
    return {$: "Some", "value": _p_0};
  } else {
    return {$: "None"};
  }
}

function $keep(_lo_0, _hi_0, _p_0) {
  return $keep_if(_p_0, ($accept(_lo_0, _hi_0, _p_0)));
}

function $seed(_base_0, _i_0, _a_0) {
  const _x_0 = (_i_0 >>> 0);
  const _x_1 = ($mix(((_base_0 ^ _x_0) >>> 0)));
  const _x_2 = (Math.imul(_a_0, 2654435769) >>> 0);
  return $mix(((_x_1 + _x_2) >>> 0));
}

function $tries($0, $1, $2, $3, $4, $5, $6) {
  for (;;) {
    {
      const _k_0 = $0;
      const _lo_0 = $1;
      const _hi_0 = $2;
      const _base_0 = $3;
      const _i_0 = $4;
      const _a_0 = $5;
      const _m_0 = $6;
      if (_k_0 === 0) {
        return _m_0;
      } else {
        const _f_0 = (_k_0 - 1);
        if (_m_0.$ === "Some") {
          const _p_0 = _m_0["value"];
          return {$: "Some", "value": _p_0};
        } else {
          $0 = _f_0;
          $1 = _lo_0;
          $2 = _hi_0;
          $3 = _base_0;
          $4 = _i_0;
          $5 = ((_a_0 + 1) >>> 0);
          $6 = ($keep(_lo_0, _hi_0, ($puzzle(_hi_0, ($seed(_base_0, _i_0, _a_0))))));
          continue;
        }
      }
    }
  }
}

function $level(_lo_0, _hi_0, _base_0, _i_0) {
  return $tries(1000, _lo_0, _hi_0, _base_0, _i_0, 0, {$: "None"});
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

function $Nat_is_eq(_a_0, _b_0) {
  return $Cmp_is_eq(cmp_new(_a_0, _b_0));
}

function $Maybe_default(_m_0, _d_0) {
  if (_m_0.$ === "None") {
    return _d_0;
  } else {
    const _x_0 = _m_0["value"];
    return _x_0;
  }
}

function $Nat_is_le(_a_0, _b_0) {
  return $Cmp_is_le(cmp_new(_a_0, _b_0));
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

function $List_append(_xs_0, _ys_0) {
  if (_xs_0.$ === "Nil") {
    return _ys_0;
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Con", "head": _h_0, "tail": ($List_append(_t_0, _ys_0))};
  }
}

function $Nat_is_gt(_a_0, _b_0) {
  return $Cmp_is_gt(cmp_new(_a_0, _b_0));
}

function $List_reverse(_xs_0) {
  return $List_reverse_go(_xs_0, {$: "Nil"});
}

function $List_replicate(_n_0, _x_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": _x_0, "tail": ($List_replicate(_p_0, _x_0))};
  }
}

function $Cmp_is_eq(_c_0) {
  if (_c_0.$ === "EQ") {
    return true;
  } else {
    return false;
  }
}

function $Cmp_is_le(_c_0) {
  if (_c_0.$ === "GT") {
    return false;
  } else {
    return true;
  }
}

function $Cmp_is_gt(_c_0) {
  if (_c_0.$ === "GT") {
    return true;
  } else {
    return false;
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
export default {
  "ice:Grid": run_lib(() => run_loop($ice_Grid()), 0),
  "ice:Dists": run_lib(() => run_loop($ice_Dists()), 0),
  "ice:Puzzle.seed": run_lib((a0) => run_loop($ice_Puzzle_seed(a0)), 1),
  "ice:Puzzle.game": run_lib((a0) => run_loop($ice_Puzzle_game(a0)), 1),
  "ice:Game.grid": run_lib((a0) => run_loop($ice_Game_grid(a0)), 1),
  "ice:Game.start": run_lib((a0) => run_loop($ice_Game_start(a0)), 1),
  "ice:Game.exit": run_lib((a0) => run_loop($ice_Game_exit(a0)), 1),
  "ice:Game.par": run_lib((a0) => run_loop($ice_Game_par(a0)), 1),
  "ice:Game.sol": run_lib((a0) => run_loop($ice_Game_sol(a0)), 1),
  "ice:Game.dists": run_lib((a0) => run_loop($ice_Game_dists(a0)), 1),
  "ice:Game.fuel": run_lib((a0) => run_loop($ice_Game_fuel(a0)), 1),
  "ice:cell": run_lib((a0) => run_loop($ice_cell(a0)), 1),
  "ice:row": run_lib((a0,a1) => run_loop($ice_row(a0,nat_in(a1))), 2),
  "ice:blocked": run_lib((a0,a1) => run_loop($ice_blocked(a0,a1)), 2),
  "ice:hits": run_lib((a0,a1) => run_loop($ice_hits(a0,a1)), 2),
  "ice:next": run_lib((a0,a1) => run_loop($ice_next(a0,a1)), 2),
  "ice:slide.go": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($ice_slide_go(nat_in(a0),a1,a2,a3,a4,a5)), 6),
  "ice:slide": run_lib((a0,a1,a2,a3) => run_loop($ice_slide(a0,a1,a2,nat_in(a3))), 4),
  "ice:replay": run_lib((a0,a1,a2,a3) => run_loop($ice_replay(a0,a1,nat_in(a2),a3)), 4),
  "ice:Pos.eq": run_lib((a0,a1) => run_loop($ice_Pos_eq(a0,a1)), 2),
  "ice:dist.row": run_lib((a0,a1) => run_loop($ice_dist_row(a0,nat_in(a1))), 2),
  "ice:dist": run_lib((a0,a1) => run_loop($ice_dist(a0,a1)), 2),
  "ice:step_ok": run_lib((a0,a1,a2,a3,a4) => run_loop($ice_step_ok(a0,a1,nat_in(a2),a3,a4)), 5),
  "ice:ok.rest2": run_lib((a0,a1,a2,a3) => run_loop($ice_ok_rest2(a0,a1,nat_in(a2),a3)), 4),
  "ice:ok.rest1": run_lib((a0,a1,a2,a3) => run_loop($ice_ok_rest1(a0,a1,nat_in(a2),a3)), 4),
  "ice:ok": run_lib((a0,a1,a2,a3) => run_loop($ice_ok(a0,a1,nat_in(a2),a3)), 4),
  "ice:check.cell": run_lib((a0,a1,a2,a3,a4) => run_loop($ice_check_cell(a0,a1,a2,nat_in(a3),a4)), 5),
  "ice:check.row": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($ice_check_row(a0,a1,a2,nat_in(a3),nat_in(a4),nat_in(a5))), 6),
  "ice:check.rows": run_lib((a0,a1,a2,a3,a4) => run_loop($ice_check_rows(a0,a1,a2,nat_in(a3),nat_in(a4))), 5),
  "ice:check": run_lib((a0,a1,a2) => run_loop($ice_check(a0,a1,nat_in(a2))), 3),
  "ice:Game.valid": run_lib((a0) => run_loop($ice_Game_valid(a0)), 1),
  "mix": run_lib((a0) => run_loop($mix(a0)), 1),
  "draw": run_lib((a0,a1) => run_loop($draw(a0,a1)), 2),
  "below": run_lib((a0,a1,a2) => run_loop($below(a0,a1,a2)), 3),
  "cell_slot": run_lib((a0,a1,a2) => run_loop($cell_slot(a0,nat_in(a1),nat_in(a2))), 3),
  "rock": run_lib((a0,a1,a2,a3,a4) => run_loop($rock(a0,nat_in(a1),nat_in(a2),nat_in(a3),a4)), 5),
  "board.row": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($board_row(nat_in(a0),a1,nat_in(a2),nat_in(a3),nat_in(a4),a5)), 6),
  "board": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($board(nat_in(a0),a1,nat_in(a2),nat_in(a3),nat_in(a4),a5)), 6),
  "inf": run_lib(() => run_loop($inf()), 0),
  "dset.row": run_lib((a0,a1,a2,a3) => run_loop($dset_row(a0,nat_in(a1),nat_in(a2),nat_in(a3))), 4),
  "dset": run_lib((a0,a1,a2) => run_loop($dset(a0,a1,nat_in(a2))), 3),
  "expand": run_lib((a0,a1,a2,a3) => run_loop($expand(a0,a1,a2,nat_in(a3))), 4),
  "visit.if": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($visit_if(a0,a1,a2,nat_in(a3),a4,a5,a6)), 7),
  "visit": run_lib((a0,a1,a2) => run_loop($visit(a0,nat_in(a1),a2)), 3),
  "absorb": run_lib((a0,a1,a2) => run_loop($absorb(a0,nat_in(a1),a2)), 3),
  "bfs": run_lib((a0,a1,a2,a3,a4) => run_loop($bfs(nat_in(a0),a1,nat_in(a2),nat_in(a3),a4)), 5),
  "tie": run_lib((a0,a1) => run_loop($tie(a0,a1)), 2),
  "farther": run_lib((a0,a1,a2,a3) => run_loop($farther(a0,nat_in(a1),a2,a3)), 4),
  "pick.if": run_lib((a0,a1,a2) => run_loop($pick_if(a0,a1,a2)), 3),
  "pick": run_lib((a0,a1,a2,a3) => run_loop($pick(a0,a1,nat_in(a2),a3)), 4),
  "game.fin": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($game_fin(nat_in(a0),nat_in(a1),a2,a3,a4,a5)), 6),
  "game.bfs": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($game_bfs(a0,nat_in(a1),nat_in(a2),nat_in(a3),a4,a5,a6)), 7),
  "game": run_lib((a0,a1) => run_loop($game(nat_in(a0),a1)), 2),
  "puzzle": run_lib((a0,a1) => run_loop($puzzle(nat_in(a0),a1)), 2),
  "accept": run_lib((a0,a1,a2) => run_loop($accept(nat_in(a0),nat_in(a1),a2)), 3),
  "keep.if": run_lib((a0,a1) => run_loop($keep_if(a0,a1)), 2),
  "keep": run_lib((a0,a1,a2) => run_loop($keep(nat_in(a0),nat_in(a1),a2)), 3),
  "seed": run_lib((a0,a1,a2) => run_loop($seed(a0,nat_in(a1),a2)), 3),
  "tries": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($tries(nat_in(a0),nat_in(a1),nat_in(a2),a3,nat_in(a4),a5,a6)), 7),
  "level": run_lib((a0,a1,a2,a3) => run_loop($level(nat_in(a0),nat_in(a1),a2,nat_in(a3))), 4),
};
