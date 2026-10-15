/* Earth path explorer: three-flavor oscillation probabilities through the PREM Earth.
   Same physics as assets/oscillations/osc.py (NuFIT 6.1 best fit, PREM density, model Y_e),
   checked against it by assets/earth-explorer/check_against_python.mjs. */
(function (root) {
  "use strict";

  const HBARC_EV_KM = 197.3269804e6 * 1e-15 * 1e-3;
  const V_PER_YE_RHO = Math.SQRT2 * 1.1663787e-23 * 6.02214076e23 * Math.pow(197.3269804e6 * 1e-13, 3);
  const R_EARTH = 6371.0, R_CORE = 3480.0, R_INNER = 1221.5;
  const PREM = [
    [1221.5, [13.0885, 0.0, -8.8381, 0.0]],
    [3480.0, [12.5815, -1.2638, -3.6426, -5.5281]],
    [5701.0, [7.9565, -6.4761, 5.5283, -3.0807]],
    [5771.0, [5.3197, -1.4836, 0, 0]],
    [5971.0, [11.2494, -8.0298, 0, 0]],
    [6151.0, [7.1089, -3.8045, 0, 0]],
    [6346.6, [2.6910, 0.6924, 0, 0]],
    [6356.0, [2.900, 0, 0, 0]],
    [6368.0, [2.600, 0, 0, 0]],
    [6371.0, [1.020, 0, 0, 0]],
  ];
  const AW = { H: [1, 1.0080], O: [8, 15.999], Mg: [12, 24.305], Si: [14, 28.085], Fe: [26, 55.845] };
  const YE_CORE = AW.Fe[0] / AW.Fe[1];
  const YE_MANTLE = (2 * AW.Mg[0] + AW.Si[0] + 4 * AW.O[0]) / (2 * AW.Mg[1] + AW.Si[1] + 4 * AW.O[1]);
  const NUFIT61 = {
    NO: { s12sq: 0.3088, s13sq: 0.02248, s23sq: 0.470, delta: 212.0, dm21: 7.537e-5, dm31: 2.511e-3 },
    IO: { s12sq: 0.3088, s13sq: 0.02262, s23sq: 0.550, delta: 274.0, dm21: 7.537e-5, dm31: -2.483e-3 },
  };

  function density(r) {
    const x = r / R_EARTH;
    let inner = 0;
    for (const [outer, a] of PREM) {
      if (r >= inner && (outer < R_EARTH ? r < outer : r <= outer)) return a[0] + a[1] * x + a[2] * x * x + a[3] * x * x * x;
      inner = outer;
    }
    return 0;
  }

  function electronFraction(r, yeCore, yeMantle) {
    return r < R_CORE ? yeCore : yeMantle;
  }

  /* density just above the core-mantle boundary (lowest mantle), used by the "no core" option */
  const RHO_LOWEST_MANTLE = (function () { const x = R_CORE / R_EARTH, a = PREM[2][1]; return a[0] + a[1] * x + a[2] * x * x + a[3] * x * x * x; })();

  /* layers [dL_km, V_eV] along the chord, split at every PREM boundary (detector at the surface).
     opts.coreScale multiplies the core density; opts.noCore replaces the core by lowest-mantle rock;
     opts.land replaces the 3 km PREM ocean by PREM upper crust (2.6 g/cm^3). */
  function pathLayers(cosz, steps, yeCore, yeMantle, opts) {
    opts = opts || {};
    const coreScale = opts.coreScale || 1;
    const L = cosz < 0 ? -2 * R_EARTH * cosz : 0;
    if (L <= 0) return [];
    const b2 = R_EARTH * R_EARTH * (1 - cosz * cosz), s0 = -R_EARTH * cosz;
    let cuts = [0, L];
    for (let k = 0; k < PREM.length - 1; k++) {
      const o = PREM[k][0];
      if (o * o > b2) { const h = Math.sqrt(o * o - b2); cuts.push(s0 - h, s0 + h); }
    }
    cuts = cuts.map((c) => Math.min(Math.max(c, 0), L)).sort((a, b) => a - b);
    const out = [], ds = L / steps;
    for (let j = 0; j + 1 < cuts.length; j++) {
      const a = cuts[j], b = cuts[j + 1];
      if (b - a < 1e-9) continue;
      const n = Math.max(2, Math.ceil((b - a) / ds));
      for (let i = 0; i < n; i++) {
        const s = a + (i + 0.5) / n * (b - a);
        const r = Math.sqrt(Math.max(R_EARTH * R_EARTH + s * s + 2 * R_EARTH * s * cosz, 0));
        let yr;
        if (opts.land && r > 6368.0) yr = 2.600 * yeMantle;
        else if (r < R_CORE && opts.noCore) yr = RHO_LOWEST_MANTLE * yeMantle;
        else if (r < R_CORE) yr = density(r) * coreScale * yeCore;
        else yr = density(r) * yeMantle;
        out.push([(b - a) / n, V_PER_YE_RHO * yr]);
      }
    }
    return out;
  }

  /* complex 3x3 matrices: {re: Float64Array(9), im: Float64Array(9)}, row-major */
  const zeros = () => ({ re: new Float64Array(9), im: new Float64Array(9) });
  function eye() { const m = zeros(); m.re[0] = m.re[4] = m.re[8] = 1; return m; }
  function mul(A, B) {
    const C = zeros();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      let sr = 0, si = 0;
      for (let k = 0; k < 3; k++) {
        const ar = A.re[3 * i + k], ai = A.im[3 * i + k], br = B.re[3 * k + j], bi = B.im[3 * k + j];
        sr += ar * br - ai * bi; si += ar * bi + ai * br;
      }
      C.re[3 * i + j] = sr; C.im[3 * i + j] = si;
    }
    return C;
  }

  function pmns(p, anti) {
    const s12 = Math.sqrt(p.s12sq), s13 = Math.sqrt(p.s13sq), s23 = Math.sqrt(p.s23sq);
    const c12 = Math.sqrt(1 - p.s12sq), c13 = Math.sqrt(1 - p.s13sq), c23 = Math.sqrt(1 - p.s23sq);
    const d = (p.delta * Math.PI) / 180, cd = Math.cos(d), sd = Math.sin(d);
    const U = zeros();
    const set = (i, j, re, im) => { U.re[3 * i + j] = re; U.im[3 * i + j] = anti ? -im : im; };
    set(0, 0, c12 * c13, 0); set(0, 1, s12 * c13, 0); set(0, 2, s13 * cd, -s13 * sd);
    set(1, 0, -s12 * c23 - c12 * s23 * s13 * cd, -c12 * s23 * s13 * sd);
    set(1, 1, c12 * c23 - s12 * s23 * s13 * cd, -s12 * s23 * s13 * sd);
    set(1, 2, s23 * c13, 0);
    set(2, 0, s12 * s23 - c12 * c23 * s13 * cd, -c12 * c23 * s13 * sd);
    set(2, 1, -c12 * s23 - s12 * c23 * s13 * cd, -s12 * c23 * s13 * sd);
    set(2, 2, c23 * c13, 0);
    return U;
  }

  /* vacuum part M = U diag(0, dm21, dm31) U^dagger (eV^2) */
  function massMatrix(p, anti) {
    const U = pmns(p, anti), m = [0, p.dm21, p.dm31], M = zeros();
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      let sr = 0, si = 0;
      for (let i = 0; i < 3; i++) {
        const ur = U.re[3 * a + i], ui = U.im[3 * a + i], vr = U.re[3 * b + i], vi = -U.im[3 * b + i];
        sr += m[i] * (ur * vr - ui * vi); si += m[i] * (ur * vi + ui * vr);
      }
      M.re[3 * a + b] = sr; M.im[3 * a + b] = si;
    }
    return M;
  }

  /* exp(-i H t) for Hermitian H (eV) and t = L / hbar c, by scaling and squaring of a Taylor series */
  function expmMinusI(H, t) {
    let norm = 0;
    for (let k = 0; k < 9; k++) norm = Math.max(norm, Math.hypot(H.re[k], H.im[k]));
    const theta = 3 * norm * t;
    let s = 0;
    while (theta / Math.pow(2, s) > 0.25) s++;
    const h = t / Math.pow(2, s);
    const X = zeros();                     // X = -i H h
    for (let k = 0; k < 9; k++) { X.re[k] = H.im[k] * h; X.im[k] = -H.re[k] * h; }
    let term = eye(), sum = eye();
    for (let n = 1; n <= 9; n++) {
      term = mul(term, X);
      for (let k = 0; k < 9; k++) { term.re[k] /= n; term.im[k] /= n; sum.re[k] += term.re[k]; sum.im[k] += term.im[k]; }
    }
    for (let i = 0; i < s; i++) sum = mul(sum, sum);
    return sum;
  }

  /* P[a][b] = P(nu_a -> nu_b) for one energy (GeV) through given layers */
  function probabilityMatrix(E, layers, p, anti) {
    const M = massMatrix(p, anti), sgn = anti ? -1 : 1;
    let S = eye();
    for (const [dL, V] of layers) {
      const H = zeros();
      for (let k = 0; k < 9; k++) { H.re[k] = M.re[k] / (2 * E * 1e9); H.im[k] = M.im[k] / (2 * E * 1e9); }
      H.re[0] += sgn * V;
      S = mul(expmMinusI(H, dL / HBARC_EV_KM), S);
    }
    const P = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) P[a][b] = S.re[3 * b + a] ** 2 + S.im[3 * b + a] ** 2;
    return P;
  }

  /* flavor probabilities [Pe, Pmu, Ptau] after each layer, starting from flavor index a0 */
  function evolve(E, layers, p, anti, a0) {
    const M = massMatrix(p, anti), sgn = anti ? -1 : 1, out = [];
    let S = eye();
    for (const [dL, V] of layers) {
      const H = zeros();
      for (let k = 0; k < 9; k++) { H.re[k] = M.re[k] / (2 * E * 1e9); H.im[k] = M.im[k] / (2 * E * 1e9); }
      H.re[0] += sgn * V;
      S = mul(expmMinusI(H, dL / HBARC_EV_KM), S);
      out.push([0, 1, 2].map((b) => S.re[3 * b + a0] ** 2 + S.im[3 * b + a0] ** 2));
    }
    return out;
  }

  const api = { R_EARTH, R_CORE, R_INNER, YE_CORE, YE_MANTLE, NUFIT61, V_PER_YE_RHO, RHO_LOWEST_MANTLE, density, pathLayers, probabilityMatrix, evolve };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EarthOsc = api;

  /* ------------------------------------------------------------------ widget */
  if (typeof document === "undefined") return;

  const FLAV = { e: 0, mu: 1, tau: 2 };
  const SVGNS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  function init(box) {
    const q = (s) => box.querySelector(s);
    const ctl = {
      cosz: q('[data-control="cosz"]'), ye: q('[data-control="ye"]'), channel: q('[data-control="channel"]'),
      anti: q('[data-control="anti"]'), ordering: q('[data-control="ordering"]'),
    };
    const out = { cosz: q('[data-out="cosz"]'), ye: q('[data-out="ye"]'), L: q('[data-out="L"]'), core: q('[data-out="core"]') };
    const earth = q('[data-plot="earth"]'), plot = q('[data-plot="prob"]');
    const energies = []; for (let i = 0; i < 160; i++) energies.push(Math.pow(10, (i / 159) * Math.log10(20)));

    // Earth drawing (static part)
    const EW = 420, EH = 440, cx = EW / 2, cy = 232, sc = 190 / R_EARTH;
    el("circle", { cx, cy, r: R_EARTH * sc, class: "ee-mantle" }, earth);
    el("circle", { cx, cy, r: R_CORE * sc, class: "ee-outer" }, earth);
    el("circle", { cx, cy, r: R_INNER * sc, class: "ee-inner" }, earth);
    el("text", { x: cx, y: cy - 0.80 * R_EARTH * sc, class: "ee-label" }, earth).textContent = "mantle";
    el("text", { x: cx, y: cy - 0.40 * R_EARTH * sc, class: "ee-label" }, earth).textContent = "core";
    const chord = el("line", { class: "ee-chord" }, earth);
    const src = el("circle", { r: 6, class: "ee-src" }, earth);
    el("circle", { cx, cy: cy - R_EARTH * sc, r: 8, class: "ee-det" }, earth);
    el("text", { x: cx + 14, y: cy - R_EARTH * sc - 10, class: "ee-label ee-det-label" }, earth).textContent = "detector";

    // probability plot frame
    const PW = 820, PH = 440, m = { l: 74, r: 18, t: 18, b: 58 };
    const xs = (E) => m.l + (Math.log10(E) / Math.log10(20)) * (PW - m.l - m.r);
    const ys = (P) => PH - m.b - P * (PH - m.t - m.b);
    for (const E of [1, 2, 5, 10, 20]) {
      el("line", { x1: xs(E), x2: xs(E), y1: m.t, y2: PH - m.b, class: "ee-grid" }, plot);
      el("text", { x: xs(E), y: PH - m.b + 28, class: "ee-tick" }, plot).textContent = String(E);
    }
    for (let P = 0; P <= 1.0001; P += 0.2) {
      el("line", { x1: m.l, x2: PW - m.r, y1: ys(P), y2: ys(P), class: "ee-grid" }, plot);
      el("text", { x: m.l - 10, y: ys(P) + 6, class: "ee-tick ee-tick-y" }, plot).textContent = P.toFixed(1);
    }
    el("text", { x: (m.l + PW - m.r) / 2, y: PH - 8, class: "ee-axis" }, plot).textContent = "neutrino energy E [GeV]";
    const ylab = el("text", { x: 18, y: (m.t + PH - m.b) / 2, class: "ee-axis", transform: `rotate(-90 18 ${(m.t + PH - m.b) / 2})` }, plot);
    const refPath = el("path", { class: "ee-ref" }, plot);
    const curPath = el("path", { class: "ee-cur" }, plot);
    const legend = el("text", { x: PW - m.r - 8, y: m.t + 26, class: "ee-legend" }, plot);

    let pending = false;
    function curve(cosz, ye, chan, anti, p) {
      const layers = pathLayers(cosz, 40, ye, YE_MANTLE);
      const [a, b] = chan.split("-");
      return energies.map((E) => probabilityMatrix(E, layers, p, anti)[FLAV[a]][FLAV[b]]);
    }
    const toPath = (ys_) => energies.map((E, i) => `${i ? "L" : "M"}${xs(E).toFixed(1)},${ys(ys_[i]).toFixed(1)}`).join("");

    function update() {
      pending = false;
      const cosz = parseFloat(ctl.cosz.value), ye = parseFloat(ctl.ye.value);
      const chan = ctl.channel.value, anti = ctl.anti.checked, p = NUFIT61[ctl.ordering.value];
      const L = -2 * R_EARTH * cosz;
      out.cosz.textContent = cosz.toFixed(2);
      out.ye.textContent = ye.toFixed(3);
      out.L.textContent = Math.round(L).toLocaleString("en-US").replace(/,/g, " ") + " km";
      const b = R_EARTH * Math.sqrt(1 - cosz * cosz);
      out.core.textContent = b < R_INNER ? "inner core" : b < R_CORE ? "outer core" : "mantle only";
      // chord: from detector (top) towards the source below
      const th = Math.acos(cosz), dx = Math.sin(th) * L * sc, dy = -Math.cos(th) * L * sc;
      chord.setAttribute("x1", cx); chord.setAttribute("y1", cy - R_EARTH * sc);
      chord.setAttribute("x2", cx + dx); chord.setAttribute("y2", cy - R_EARTH * sc + dy);
      src.setAttribute("cx", cx + dx); src.setAttribute("cy", cy - R_EARTH * sc + dy);
      const [fa, fb] = chan.split("-"), sub = { e: "e", mu: "μ" }, nu = anti ? "ν̄" : "ν";
      ylab.textContent = "";
      const part = (t, s) => { const n = el("tspan", s ? { "baseline-shift": "sub", "font-size": "15" } : {}, ylab); n.textContent = t; };
      part("P(" + nu); part(sub[fa], true); part(" → " + nu); part(sub[fb], true); part(")");
      curPath.setAttribute("d", toPath(curve(cosz, ye, chan, anti, p)));
      const differs = Math.abs(ye - YE_CORE) > 5e-4;
      refPath.setAttribute("d", differs ? toPath(curve(cosz, YE_CORE, chan, anti, p)) : "");
      legend.textContent = differs ? "dashed: pure-iron core (Yₑ = 0.466)" : "";
    }
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
    Object.values(ctl).forEach((c) => c.addEventListener("input", schedule));
    box.querySelectorAll("[data-preset]").forEach((btn) => btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-preset").split(":");
      ctl[v[0]].value = v[1];
      schedule();
    }));
    update();
  }

  const start = () => document.querySelectorAll("[data-earth-explorer]").forEach(init);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})(typeof window !== "undefined" ? window : globalThis);
