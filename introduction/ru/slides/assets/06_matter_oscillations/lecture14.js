// Lecture 14 and the applet "pendulums-matter": coupled pendulums in matter.
//
// The model is the one of the films l14_pendulums_*.mp4 (scene msw_pendulums).  Two equal bobs hang on pendulums of
// lengths l1(t) and l2 = 1 m and are joined by a horizontal spring, kappa = k/m.  The support of pendulum 1 moves
// vertically together with the length, so the bobs stay at one height and the equations
//
//   xddot_1 = -(g/l1) x_1 - kappa (x_1 - x_2),     xddot_2 = -(g/l2) x_2 - kappa (x_2 - x_1)
//
// are exact for any speed of the change.  Amplitudes: the complex envelope
// psi = sum_k e_k sqrt(Omega_k/2) (Q_k - i P_k/Omega_k) over the instantaneous normal modes.  Its components in the
// pendulum basis, the instantaneous modes and the fixed vacuum modes play the roles of the flavour, matter-mode and
// mass amplitudes.  By linearity the motion is the sum of two paths, d (from the initial vacuum mode 1) and f (from the
// initial vacuum mode 2); their vacuum-mode-1 amplitudes give c_1 = d + f, shown in the frame of the lower branch.
(function (root) {
  "use strict";

  // ------------------------------------------------------------------ physics

  const G = 9.81;
  const L2 = 1.0;
  const W2 = G / L2;
  // The vacuum length of pendulum 1 is fixed by theta = 20 deg at kappa = 2 s^-2 (as in the films): 1.95 m.
  const W_VAC = W2 - 2 * 2.0 / Math.tan(2 * (20 * Math.PI) / 180);
  const L_VAC = G / W_VAC;
  const T_START = 4.0; // the support rests before the passage, s
  const T_TAIL = 8.0; // and after it, s
  const MAX_DT = 0.004; // the largest RK4 step, s
  const AMPLITUDE = 0.16; // the larger initial horizontal displacement, m

  function smootherstep(s) {
    s = Math.min(1, Math.max(0, s));
    return s * s * s * (10 - 15 * s + 6 * s * s);
  }

  // Normal modes of D = [[w + kappa, -kappa], [-kappa, g/l2 + kappa]] for g/l1 = w: frequencies (lower, upper) and unit
  // vectors e_1 = (cos thm, sin thm), e_2 = (-sin thm, cos thm), tan 2 thm = 2 kappa / (g/l2 - w).
  function modes(w, kappa) {
    const thm = 0.5 * Math.atan2(2 * kappa, W2 - w);
    const mean = 0.5 * (w + W2) + kappa;
    const half = Math.hypot(0.5 * (W2 - w), kappa);
    const c = Math.cos(thm);
    const s = Math.sin(thm);
    return { om: [Math.sqrt(mean - half), Math.sqrt(mean + half)], e: [[c, s], [-s, c]], thm };
  }

  // Complex numbers are pairs [re, im]; a two-component envelope is [[re, im], [re, im]].
  function envelope(m, x, v) {
    const psi = [[0, 0], [0, 0]];
    for (let k = 0; k < 2; k++) {
      const e = m.e[k];
      const om = m.om[k];
      const a = Math.sqrt(om / 2);
      const re = a * (e[0] * x[0] + e[1] * x[1]);
      const im = -a * (e[0] * v[0] + e[1] * v[1]) / om;
      psi[0][0] += e[0] * re; psi[0][1] += e[0] * im;
      psi[1][0] += e[1] * re; psi[1][1] += e[1] * im;
    }
    return psi;
  }

  function stateFromEnvelope(m, psi) {
    const x = [0, 0];
    const v = [0, 0];
    for (let k = 0; k < 2; k++) {
      const e = m.e[k];
      const om = m.om[k];
      const a = Math.sqrt(2 / om);
      const re = a * (e[0] * psi[0][0] + e[1] * psi[1][0]);
      const im = a * (e[0] * psi[0][1] + e[1] * psi[1][1]);
      x[0] += e[0] * re; x[1] += e[1] * re;
      v[0] -= e[0] * om * im; v[1] -= e[1] * om * im;
    }
    return { x, v };
  }

  // The projection e . psi of an envelope on a real unit vector.
  function project(e, psi) {
    return [e[0] * psi[0][0] + e[1] * psi[1][0], e[0] * psi[0][1] + e[1] * psi[1][1]];
  }

  function cmul(a, b) {
    return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  }

  function abs2(a) {
    return a[0] * a[0] + a[1] * a[1];
  }

  // A run: mode "constant" (pendulum 1 alone at the start, constant l1) or "passage" (the upper normal mode at the
  // start; the support rises from l1 to the vacuum length in the time T, smootherstep in g/l1).
  function createRun(opts) {
    const kappa = opts.kappa;
    const passage = opts.mode === "passage";
    const w0 = G / opts.l1;
    const T = opts.T;
    const wAt = passage
      ? (t) => w0 + (W_VAC - w0) * smootherstep((t - T_START) / T)
      : () => w0;
    const m0 = modes(w0, kappa);
    const vac = modes(W_VAC, kappa).e;
    let tEnd;
    if (passage) {
      tEnd = T_START + T + T_TAIL;
    } else {
      const beat = (2 * Math.PI) / (m0.om[1] - m0.om[0]);
      tEnd = Math.min(90, Math.max(24, 3 * beat));
    }

    // The initial envelope, split into the vacuum modes: the path d starts along e_1^vac, the path f along e_2^vac.
    const psi0 = passage ? [[m0.e[1][0], 0], [m0.e[1][1], 0]] : [[1, 0], [0, 0]];
    const y = new Float64Array(8); // x_d, v_d, x_f, v_f (two components each)
    const parts = [0, 1].map((k) => {
      const p = project(vac[k], psi0);
      return stateFromEnvelope(m0, [[vac[k][0] * p[0], vac[k][0] * p[1]], [vac[k][1] * p[0], vac[k][1] * p[1]]]);
    });
    const x0 = [parts[0].x[0] + parts[1].x[0], parts[0].x[1] + parts[1].x[1]];
    const scale = AMPLITUDE / Math.max(Math.abs(x0[0]), Math.abs(x0[1]));
    parts.forEach((s, k) => {
      y[4 * k] = s.x[0] * scale; y[4 * k + 1] = s.x[1] * scale;
      y[4 * k + 2] = s.v[0] * scale; y[4 * k + 3] = s.v[1] * scale;
    });

    const run = { mode: opts.mode, l1: opts.l1, kappa, T, tEnd, t: 0, phase: 0, wAt, vac };
    const k1 = new Float64Array(8);
    const k2 = new Float64Array(8);
    const k3 = new Float64Array(8);
    const k4 = new Float64Array(8);
    const tmp = new Float64Array(8);

    function deriv(t, s, out) {
      const w = wAt(t);
      for (let p = 0; p < 8; p += 4) {
        const a = s[p];
        const b = s[p + 1];
        out[p] = s[p + 2];
        out[p + 1] = s[p + 3];
        out[p + 2] = -(w + kappa) * a + kappa * b;
        out[p + 3] = kappa * a - (W2 + kappa) * b;
      }
    }

    function rk4(dt) {
      const t = run.t;
      deriv(t, y, k1);
      for (let i = 0; i < 8; i++) tmp[i] = y[i] + 0.5 * dt * k1[i];
      deriv(t + 0.5 * dt, tmp, k2);
      for (let i = 0; i < 8; i++) tmp[i] = y[i] + 0.5 * dt * k2[i];
      deriv(t + 0.5 * dt, tmp, k3);
      for (let i = 0; i < 8; i++) tmp[i] = y[i] + dt * k3[i];
      deriv(t + dt, tmp, k4);
      for (let i = 0; i < 8; i++) y[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
      // The phase of the lower branch, int Omega_- dt (trapezoid).
      run.phase += 0.5 * dt * (modes(wAt(t), kappa).om[0] + modes(wAt(t + dt), kappa).om[0]);
      run.t = t + dt;
    }

    // Advance by dt physical seconds (never past the end of the run).
    run.advance = function (dt) {
      dt = Math.min(dt, tEnd - run.t);
      if (dt <= 1e-12) return;
      const n = Math.max(1, Math.ceil(dt / MAX_DT - 1e-9));
      for (let i = 0; i < n; i++) rk4(dt / n);
    };

    run.done = () => run.t >= tEnd - 1e-9;

    // Everything shown at the current moment.
    run.observe = function () {
      const w = wAt(run.t);
      const m = modes(w, kappa);
      const psiD = envelope(m, [y[0], y[1]], [y[2], y[3]]);
      const psiF = envelope(m, [y[4], y[5]], [y[6], y[7]]);
      const psi = [[psiD[0][0] + psiF[0][0], psiD[0][1] + psiF[0][1]], [psiD[1][0] + psiF[1][0], psiD[1][1] + psiF[1][1]]];
      const n2 = abs2(psi[0]) + abs2(psi[1]);
      const nrm = Math.sqrt(n2);
      const frame = [Math.cos(run.phase) / nrm, -Math.sin(run.phase) / nrm];
      const d = cmul(project(vac[0], psiD), frame);
      const f = cmul(project(vac[0], psiF), frame);
      const c2 = cmul(project(vac[1], psi), frame);
      return {
        t: run.t,
        l1: G / w,
        u: w - W_VAC,
        thm: m.thm,
        om: m.om,
        x: [y[0] + y[4], y[1] + y[5]],
        d,
        f,
        c1: [d[0] + f[0], d[1] + f[1]],
        c2,
        p2: abs2(psi[1]) / n2,
        occ: [abs2(project(m.e[0], psi)) / n2, abs2(project(m.e[1], psi)) / n2]
      };
    };

    return run;
  }

  const core = { G, L2, W2, W_VAC, L_VAC, T_START, T_TAIL, MAX_DT, modes, envelope, stateFromEnvelope, createRun };

  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof document === "undefined") return;

  // ------------------------------------------------------------------ drawing

  const NS = "http://www.w3.org/2000/svg";
  const COL = {
    ink: "#e9f1fb",
    muted: "#b8c7d8",
    grid: "rgba(190, 214, 236, 0.14)",
    axis: "rgba(190, 214, 236, 0.42)",
    blue: "#54a8ff",
    red: "#ff715b",
    gold: "#ffc857",
    purple: "#b79cff",
    green: "#5fdc9e",
    cyan: "#5ee6d2"
  };
  const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
  const sub = (s) => `<tspan font-size="0.75em" dy="0.3em">${s}</tspan><tspan dy="-0.3em">\u200b</tspan>`;

  function num(x, digits) {
    return x.toFixed(digits).replace(".", ",").replace("-", "−");
  }

  // Small numbers as m·10^k.
  function numSci(x) {
    if (x >= 0.01) return num(x, 3);
    if (x < 1e-6) return "0";
    const k = Math.floor(Math.log10(x));
    const sup = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
    return `${num(x / 10 ** k, 1)}·10${String(k).split("").map((c) => sup[c]).join("")}`;
  }

  function el(tag, attrs, html) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function path(points) {
    return points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  }

  // ---- the pendulums (world: metres, bobs at height 0)
  const PEND = { w: 400, h: 560, s: 180, x0: 200, y0: 500, sep: 0.45, rail: 0.13 };
  const px = (X) => PEND.x0 + X * PEND.s;
  const py = (Y) => PEND.y0 - Y * PEND.s;

  function drawPendulums(svg, o) {
    const X1 = -PEND.sep;
    const X2 = PEND.sep;
    const b1 = [px(X1 + o.x[0]), py(0)];
    const b2 = [px(X2 + o.x[1]), py(0)];
    const r = 13;
    // The spring between the bobs: leads and a zigzag of seven turns.
    const lead = 8;
    const xa = b1[0] + r + lead;
    const xb = b2[0] - r - lead;
    const zig = [[b1[0] + r, b1[1]], [xa, b1[1]]];
    const turns = 7;
    for (let i = 1; i < 2 * turns; i++) zig.push([xa + ((xb - xa) * i) / (2 * turns), b1[1] + (i % 2 ? -7 : 7)]);
    zig.push([xb, b1[1]], [b2[0] - r, b2[1]]);
    const railX = px(X1 - PEND.rail);
    const tick = (Y, label) =>
      `<line x1="${railX - 7}" x2="${railX}" y1="${py(Y)}" y2="${py(Y)}" stroke="${COL.axis}"/>` +
      `<text x="${railX - 11}" y="${py(Y) + 4}" text-anchor="end">${label}</text>`;
    svg.innerHTML =
      `<line x1="${px(-0.78)}" x2="${px(0.78)}" y1="${py(-0.12)}" y2="${py(-0.12)}" stroke="rgba(190,214,236,0.12)" stroke-width="2"/>` +
      // the rail and the clamp of pendulum 1
      `<line x1="${railX}" x2="${railX}" y1="${py(0.2)}" y2="${py(2.5)}" stroke="rgba(190,214,236,0.35)" stroke-width="1.5"/>` +
      tick(L_VAC, "вакуум") +
      tick(L2, `${it("ℓ")}${sub("2")}`) +
      `<line x1="${railX}" x2="${px(X1 + 0.09)}" y1="${py(o.l1)}" y2="${py(o.l1)}" stroke="${COL.ink}" stroke-width="4" stroke-linecap="round"/>` +
      // the beam of pendulum 2
      `<line x1="${px(X2 - 0.12)}" x2="${px(X2 + 0.12)}" y1="${py(L2)}" y2="${py(L2)}" stroke="${COL.ink}" stroke-width="4" stroke-linecap="round"/>` +
      // rest verticals, strings, pivots
      `<line x1="${px(X1)}" x2="${px(X1)}" y1="${py(o.l1)}" y2="${py(0)}" stroke="rgba(190,214,236,0.16)" stroke-dasharray="2 4"/>` +
      `<line x1="${px(X2)}" x2="${px(X2)}" y1="${py(L2)}" y2="${py(0)}" stroke="rgba(190,214,236,0.16)" stroke-dasharray="2 4"/>` +
      `<line x1="${px(X1)}" y1="${py(o.l1)}" x2="${b1[0]}" y2="${b1[1]}" stroke="${COL.ink}" stroke-opacity="0.85" stroke-width="1.6"/>` +
      `<line x1="${px(X2)}" y1="${py(L2)}" x2="${b2[0]}" y2="${b2[1]}" stroke="${COL.ink}" stroke-opacity="0.85" stroke-width="1.6"/>` +
      `<circle cx="${px(X1)}" cy="${py(o.l1)}" r="3.5" fill="${COL.ink}"/>` +
      `<circle cx="${px(X2)}" cy="${py(L2)}" r="3.5" fill="${COL.ink}"/>` +
      `<path d="${path(zig)}" fill="none" stroke="rgb(184,199,224)" stroke-opacity="0.8" stroke-width="1.4"/>` +
      `<circle cx="${b1[0]}" cy="${b1[1]}" r="${r}" fill="${COL.red}" stroke="rgba(255,255,255,0.45)"/>` +
      `<circle cx="${b2[0]}" cy="${b2[1]}" r="${r}" fill="${COL.blue}" stroke="rgba(255,255,255,0.45)"/>` +
      `<text x="${px(X1)}" y="${py(-0.27)}" text-anchor="middle">1</text>` +
      `<text x="${px(X2)}" y="${py(-0.27)}" text-anchor="middle">2</text>` +
      `<text x="${PEND.w / 2}" y="26" text-anchor="middle" fill="${COL.ink}">${it("ℓ")}${sub("1")} = ${num(o.l1, 2)} м,  ${it("t")} = ${num(o.t, 1)} с</text>`;
  }

  // ---- the branches Omega_pm(l1)
  const BR = { w: 520, h: 360, left: 58, right: 505, top: 18, bottom: 315, lmin: 0.25, lmax: 2.45 };

  function branchFrame(svg, run) {
    const kappa = run.kappa;
    const ls = [];
    for (let i = 0; i <= 160; i++) ls.push(BR.lmin + ((BR.lmax - BR.lmin) * i) / 160);
    const lo = ls.map((l) => modes(G / l, kappa).om[0]);
    const hi = ls.map((l) => modes(G / l, kappa).om[1]);
    const bare1 = ls.map((l) => Math.sqrt(G / l + kappa));
    const bare2 = Math.sqrt(W2 + kappa);
    const ymin = Math.floor((Math.min(...lo) - 0.15) * 2) / 2;
    const ymax = Math.ceil((Math.max(...hi) + 0.15) * 2) / 2;
    const X = (l) => BR.left + ((l - BR.lmin) / (BR.lmax - BR.lmin)) * (BR.right - BR.left);
    const Y = (om) => BR.bottom - ((om - ymin) / (ymax - ymin)) * (BR.bottom - BR.top);
    const clipY = (v) => Math.max(BR.top, Math.min(BR.bottom, v));
    let g = "";
    for (let om = Math.ceil(ymin); om <= ymax + 1e-9; om += 1) {
      g += `<line class="grid" x1="${BR.left}" x2="${BR.right}" y1="${Y(om)}" y2="${Y(om)}"/>`;
      g += `<text x="${BR.left - 8}" y="${Y(om) + 4}" text-anchor="end">${om}</text>`;
    }
    [0.5, 1, 1.5, 2].forEach((l) => {
      g += `<line class="grid" x1="${X(l)}" x2="${X(l)}" y1="${BR.top}" y2="${BR.bottom}"/>`;
      g += `<text x="${X(l)}" y="${BR.bottom + 18}" text-anchor="middle">${num(l, l % 1 ? 1 : 0)}</text>`;
    });
    if (run.mode === "passage") {
      const a = X(Math.min(run.l1, L_VAC));
      const b = X(Math.max(run.l1, L_VAC));
      g += `<rect x="${a}" width="${b - a}" y="${BR.top}" height="${BR.bottom - BR.top}" fill="rgba(94,230,210,0.06)"/>`;
    }
    g +=
      `<line class="axis" x1="${BR.left}" x2="${BR.right}" y1="${BR.bottom}" y2="${BR.bottom}"/>` +
      `<line class="axis" x1="${BR.left}" x2="${BR.left}" y1="${BR.top}" y2="${BR.bottom}"/>` +
      `<line x1="${X(L2)}" x2="${X(L2)}" y1="${BR.top}" y2="${BR.bottom}" stroke="${COL.axis}" stroke-dasharray="3 4"/>` +
      `<line x1="${X(L_VAC)}" x2="${X(L_VAC)}" y1="${BR.top}" y2="${BR.bottom}" stroke="${COL.axis}" stroke-dasharray="3 4"/>` +
      `<text x="${X(L2) + 5}" y="${BR.top + 12}">резонанс</text>` +
      `<text x="${X(L_VAC) + 5}" y="${BR.top + 12}">вакуум</text>` +
      `<path class="bare-branch" d="${path(ls.map((l, i) => [X(l), clipY(Y(bare1[i]))]))}"/>` +
      `<line class="bare-branch" x1="${BR.left}" x2="${BR.right}" y1="${Y(bare2)}" y2="${Y(bare2)}"/>` +
      `<path d="${path(ls.map((l, i) => [X(l), Y(lo[i])]))}" fill="none" stroke="${COL.ink}" stroke-width="2.2"/>` +
      `<path d="${path(ls.map((l, i) => [X(l), Y(hi[i])]))}" fill="none" stroke="${COL.ink}" stroke-width="2.2"/>` +
      `<text x="${BR.right}" y="${BR.bottom + 36}" text-anchor="end">${it("ℓ")}${sub("1")}, м</text>` +
      `<text x="${BR.left - 40}" y="${BR.top + 4}" text-anchor="start">${it("Ω")}</text>`;
    svg.innerHTML = `<g>${g}</g><g data-dyn></g>`;
    svg._map = { X, Y };
  }

  function drawBranches(svg, o) {
    const { X, Y } = svg._map;
    const xl = X(Math.min(BR.lmax, Math.max(BR.lmin, o.l1)));
    const rad = (p) => 2 + 9 * Math.sqrt(p);
    svg.querySelector("[data-dyn]").innerHTML =
      `<line x1="${xl}" x2="${xl}" y1="${BR.top}" y2="${BR.bottom}" stroke="${COL.cyan}" stroke-opacity="0.45"/>` +
      `<circle cx="${xl}" cy="${Y(o.om[1])}" r="${rad(o.occ[1])}" fill="${COL.gold}" stroke="#fff" stroke-width="1.2"/>` +
      `<circle cx="${xl}" cy="${Y(o.om[0])}" r="${rad(o.occ[0])}" fill="${COL.purple}" stroke="#fff" stroke-width="1.2"/>`;
  }

  // ---- the phasors of the vacuum mode 1
  const PH = { w: 380, h: 380, cx: 190, cy: 196, r: 165 };

  function arrow(z, color, from) {
    const a = from || [0, 0];
    const x1 = PH.cx + a[0] * PH.r;
    const y1 = PH.cy - a[1] * PH.r;
    const x2 = x1 + z[0] * PH.r;
    const y2 = y1 - z[1] * PH.r;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 10) return `<circle cx="${x2}" cy="${y2}" r="5" fill="${color}"/>`;
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const h = 13;
    const bx = x2 - ux * h;
    const by = y2 - uy * h;
    return (
      `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M${x2},${y2}L${bx - uy * 6},${by + ux * 6}L${bx + uy * 6},${by - ux * 6}Z" fill="${color}"/>`
    );
  }

  function drawPhasors(svg, o) {
    let g =
      `<line class="axis" x1="${PH.cx - PH.r * 1.05}" x2="${PH.cx + PH.r * 1.05}" y1="${PH.cy}" y2="${PH.cy}"/>` +
      `<line class="axis" x1="${PH.cx}" x2="${PH.cx}" y1="${PH.cy - PH.r * 1.05}" y2="${PH.cy + PH.r * 1.05}"/>`;
    [0.5, 1].forEach((rr) => {
      g += `<circle cx="${PH.cx}" cy="${PH.cy}" r="${rr * PH.r}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-dasharray="${rr < 1 ? "2 4" : "none"}"/>`;
    });
    g += `<text x="${PH.cx + PH.r + 4}" y="${PH.cy - 6}" text-anchor="end">1</text>`;
    // f drawn again from the tip of d: the sum c_1 = d + f closes the triangle.
    g += `<g opacity="0.35">${arrow(o.f, COL.purple, o.d)}</g>`;
    g += arrow(o.d, COL.green) + arrow(o.f, COL.purple) + arrow(o.c1, COL.gold);
    g +=
      `<text x="8" y="22" fill="${COL.green}">|${it("d")}| = ${num(Math.hypot(...o.d), 2)}</text>` +
      `<text x="8" y="44" fill="${COL.purple}">|${it("f")}| = ${num(Math.hypot(...o.f), 2)}</text>` +
      `<text x="8" y="66" fill="${COL.gold}">|${it("c")}${sub("1")}| = ${num(Math.hypot(...o.c1), 2)}</text>`;
    svg.innerHTML = g;
  }

  // ---- the time traces
  // A wide strip; on a narrow screen a taller box, so that the labels stay readable.
  const TR_WIDE = { w: 900, h: 210, left: 46, right: 885, top: 26, bottom: 172 };
  const TR_NARROW = { w: 520, h: 300, left: 46, right: 505, top: 26, bottom: 252 };

  function drawTraces(svg, run, hist, o) {
    const TR = svg.clientWidth && svg.clientWidth < 480 ? TR_NARROW : TR_WIDE;
    const box = `0 0 ${TR.w} ${TR.h}`;
    if (svg.getAttribute("viewBox") !== box) svg.setAttribute("viewBox", box);
    const X = (t) => TR.left + (t / run.tEnd) * (TR.right - TR.left);
    const Y = (p) => TR.bottom - p * (TR.bottom - TR.top);
    let g = "";
    if (run.mode === "passage") {
      g += `<rect x="${X(T_START)}" width="${X(T_START + run.T) - X(T_START)}" y="${TR.top}" height="${TR.bottom - TR.top}" fill="rgba(94,230,210,0.06)"/>`;
      g += `<text x="${X(T_START) + 5}" y="${TR.top - 9}">опора движется</text>`;
    } else {
      const pmax = Math.sin(2 * o.thm) ** 2;
      g += `<line x1="${TR.left}" x2="${TR.right}" y1="${Y(pmax)}" y2="${Y(pmax)}" stroke="${COL.blue}" stroke-opacity="0.55" stroke-dasharray="5 4"/>`;
      g += `<text x="${TR.right - 4}" y="${Y(pmax) - 6}" text-anchor="end">sin²2${it("θ")}${sub("m")} = ${num(pmax, 2)}</text>`;
    }
    [0, 0.5, 1].forEach((p) => {
      g += `<line class="grid" x1="${TR.left}" x2="${TR.right}" y1="${Y(p)}" y2="${Y(p)}"/>`;
      g += `<text x="${TR.left - 7}" y="${Y(p) + 4}" text-anchor="end">${num(p, p % 1 ? 1 : 0)}</text>`;
    });
    const step = run.tEnd > 60 ? 20 : 10;
    for (let t = 0; t <= run.tEnd + 1e-9; t += step) {
      g += `<text x="${X(t)}" y="${TR.bottom + 18}" text-anchor="middle">${t}</text>`;
    }
    g +=
      `<text x="${TR.right}" y="${TR.bottom + 34}" text-anchor="end">${it("t")}, с</text>` +
      `<line class="axis" x1="${TR.left}" x2="${TR.right}" y1="${TR.bottom}" y2="${TR.bottom}"/>` +
      `<line class="axis" x1="${TR.left}" x2="${TR.left}" y1="${TR.top}" y2="${TR.bottom}"/>`;
    const line = (key, color, extra) =>
      `<path d="${path(hist.map((h) => [X(h.t), Y(h[key])]))}" fill="none" stroke="${color}" stroke-width="2.2" ${extra || ""}/>`;
    g += line("up", COL.ink, 'stroke-dasharray="6 4" stroke-opacity="0.8"') + line("p2", COL.blue) + line("c1", COL.gold);
    g += `<circle cx="${X(o.t)}" cy="${Y(o.p2)}" r="4.5" fill="${COL.blue}"/>`;
    g += `<circle cx="${X(o.t)}" cy="${Y(abs2(o.c1))}" r="4.5" fill="${COL.gold}"/>`;
    svg.innerHTML = g;
  }

  // ------------------------------------------------------------------ the lab

  const FILM_S = 28; // a run lasts about this many seconds on screen, never faster than real time x 1

  function initLab(root) {
    if (root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    const q = (s) => root.querySelector(s);
    const ctl = { l1: q('[data-control="l1"]'), kappa: q('[data-control="kappa"]'), T: q('[data-control="T"]') };
    const out = (k) => q(`[data-out="${k}"]`);
    const val = (k) => q(`[data-val="${k}"]`);
    const svg = {
      pend: q('svg[data-plot="pendulums"]'),
      branches: q('svg[data-plot="branches"]'),
      phasor: q('svg[data-plot="phasor"]'),
      traces: q('svg[data-plot="traces"]')
    };
    svg.pend.setAttribute("viewBox", `0 0 ${PEND.w} ${PEND.h}`);
    svg.branches.setAttribute("viewBox", `0 0 ${BR.w} ${BR.h}`);
    svg.phasor.setAttribute("viewBox", `0 0 ${PH.w} ${PH.h}`);
    const playBtn = q('[data-action="play"]');
    const modeBtns = root.querySelectorAll("[data-mode]");

    let mode = "passage";
    let run = null;
    let hist = [];
    let running = false;
    let visible = false;
    let started = false;
    let last = 0;

    function record(o) {
      const h = hist[hist.length - 1];
      if (!h || o.t - h.t >= run.tEnd / 700 || run.done()) {
        hist.push({ t: o.t, p2: o.p2, c1: abs2(o.c1), up: o.occ[1] });
      }
    }

    function show() {
      const o = run.observe();
      record(o);
      drawPendulums(svg.pend, o);
      drawBranches(svg.branches, o);
      drawPhasors(svg.phasor, o);
      drawTraces(svg.traces, run, hist, o);
      val("thm").textContent = `${num((o.thm * 180) / Math.PI, 1)}°`;
      val("p2").textContent = num(o.p2, 3);
      val("up").textContent = num(o.occ[1], 4);
      val("c1").textContent = numSci(abs2(o.c1));
      const fd = Math.hypot(...o.f) > 1e-3 && Math.hypot(...o.d) > 1e-3
        ? Math.atan2(o.f[1] * o.d[0] - o.f[0] * o.d[1], o.f[0] * o.d[0] + o.f[1] * o.d[1])
        : NaN;
      val("arg").textContent = Number.isNaN(fd) ? "—" : `${num((fd * 180) / Math.PI, 1)}°`;
      playBtn.textContent = run.done() ? "▶ заново" : running ? "❚❚ пауза" : "▶ дальше";
    }

    function readControls() {
      const l1 = parseFloat(ctl.l1.value);
      const kappa = parseFloat(ctl.kappa.value);
      const T = parseFloat(ctl.T.value);
      out("l1").textContent = num(l1, 2);
      out("u").textContent = num(G / l1 - W_VAC, 2);
      out("kappa").textContent = num(kappa, 1);
      out("T").textContent = num(T, 0);
      ctl.T.disabled = mode !== "passage";
      ctl.T.closest("label").classList.toggle("is-off", mode !== "passage");
      modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      return { mode, l1, kappa, T };
    }

    function reset(play) {
      run = createRun(readControls());
      hist = [];
      branchFrame(svg.branches, run);
      running = play;
      show();
      if (running) loop();
    }

    function frame(now) {
      if (!running || !visible) {
        last = 0;
        return;
      }
      const dtWall = last ? Math.min(0.25, (now - last) / 1000) : 0;
      last = now;
      const rate = Math.max(1, run.tEnd / FILM_S);
      run.advance(dtWall * rate);
      if (run.done()) running = false;
      show();
      if (running) requestAnimationFrame(frame);
      else last = 0;
    }

    function loop() {
      if (running && visible && !last) requestAnimationFrame(frame);
    }

    Object.values(ctl).forEach((input) => input.addEventListener("input", () => reset(true)));
    modeBtns.forEach((b) =>
      b.addEventListener("click", () => {
        mode = b.dataset.mode;
        reset(true);
      })
    );
    playBtn.addEventListener("click", () => {
      if (run.done()) reset(true);
      else {
        running = !running;
        show();
        loop();
      }
    });

    reset(false);

    // Play only while the lab is on screen; start by itself the first time it appears.
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !started) {
        started = true;
        running = true;
        show();
      }
      loop();
    }).observe(root);
  }

  function init() {
    document.querySelectorAll(".pendulum-matter-lab").forEach(initLab);
  }

  root.L14Pendulums = core;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(typeof window !== "undefined" ? window : globalThis);
