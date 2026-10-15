/*
 * Three-flavor vacuum oscillation probabilities as functions of E and L.
 * Oscillations mini-course, lecture I (vacuum).
 *
 * The formulas match the slides and three_flavor_oscillations.py:
 *   A(α→β) = Σ_i U_{βi} U*_{αi} exp(-i m_i² L / 2E),  P = |A|²,
 *   U = R23 U13(δ) R12,  for antineutrinos U → U*.
 * Units: L in km, E in GeV, masses in eV². Matter is not included.
 *
 * Default parameters come from BEST_FIT below: when the global fit is
 * updated, it is enough to change this table and its label.
 */
(() => {
  "use strict";

  // ------------------------------------------------------------------ data
  const PHASE_K = 1.26693; // eV²·km/GeV: Δm²L/(4E) = K·Δm²·L/E
  const BEST_FIT = {
    label: "NuFIT 6.1, IC24 + SK-atm",
    short: "NuFIT 6.1",
    NO: {s12: 0.3088, s13: 0.02248, s23: 0.470, delta: 212, dm21: 7.537e-5, dm3l: 2.511e-3},
    IO: {s12: 0.3088, s13: 0.02262, s23: 0.550, delta: 274, dm21: 7.537e-5, dm3l: 2.483e-3}
  };

  // ------------------------------------------------------------------ core
  function pmns(p) {
    const th12 = Math.asin(Math.sqrt(p.s12));
    const th13 = Math.asin(Math.sqrt(p.s13));
    const th23 = Math.asin(Math.sqrt(p.s23));
    const d = p.delta * Math.PI / 180;
    const s12 = Math.sin(th12), c12 = Math.cos(th12);
    const s13 = Math.sin(th13), c13 = Math.cos(th13);
    const s23 = Math.sin(th23), c23 = Math.cos(th23);
    const cd = Math.cos(d), sd = Math.sin(d);
    const re = [
      [c12 * c13, s12 * c13, s13 * cd],
      [-s12 * c23 - c12 * s23 * s13 * cd, c12 * c23 - s12 * s23 * s13 * cd, s23 * c13],
      [s12 * s23 - c12 * c23 * s13 * cd, -c12 * s23 - s12 * c23 * s13 * cd, c23 * c13]
    ];
    const im = [
      [0, 0, -s13 * sd],
      [-c12 * s23 * s13 * sd, -s12 * s23 * s13 * sd, 0],
      [-c12 * c23 * s13 * sd, -s12 * c23 * s13 * sd, 0]
    ];
    return {re, im};
  }

  // c[a][b] = {re[i], im[i]}: U_{βi} U*_{αi} for α=a, β=b
  function coefficients(p) {
    const U = pmns(p);
    const c = [[], [], []];
    for (let a = 0; a < 3; a += 1) {
      for (let b = 0; b < 3; b += 1) {
        const re = [0, 0, 0], im = [0, 0, 0];
        for (let i = 0; i < 3; i += 1) {
          re[i] = U.re[b][i] * U.re[a][i] + U.im[b][i] * U.im[a][i];
          im[i] = U.im[b][i] * U.re[a][i] - U.re[b][i] * U.im[a][i];
        }
        c[a][b] = {re, im};
      }
    }
    return c;
  }

  function massSquared(p, ordering) {
    // dm3l = |Δm²_3ℓ|: NO → Δm²_31 = +dm3l;  IO → Δm²_32 = −dm3l, Δm²_31 = Δm²_32 + Δm²_21
    return [0, p.dm21, ordering === "NO" ? p.dm3l : p.dm21 - p.dm3l];
  }

  function phases(m2, L, E) {
    const f = 2 * PHASE_K * L / E;
    const cs = [0, 0, 0], sn = [0, 0, 0];
    for (let i = 0; i < 3; i += 1) {
      cs[i] = Math.cos(f * m2[i]);
      sn[i] = Math.sin(f * m2[i]);
    }
    return {cs, sn};
  }

  function probabilityFromPhases(c, ph, anti) {
    let re = 0, im = 0;
    for (let i = 0; i < 3; i += 1) {
      const cr = c.re[i];
      const ci = anti ? -c.im[i] : c.im[i];
      re += cr * ph.cs[i] + ci * ph.sn[i];
      im += ci * ph.cs[i] - cr * ph.sn[i];
    }
    return re * re + im * im;
  }

  function probability(a, b, L, E, p, ordering, anti) {
    const c = coefficients(p)[a][b];
    return probabilityFromPhases(c, phases(massSquared(p, ordering), L, E), anti);
  }

  function jarlskog(p) {
    const th12 = Math.asin(Math.sqrt(p.s12));
    const th13 = Math.asin(Math.sqrt(p.s13));
    const th23 = Math.asin(Math.sqrt(p.s23));
    return Math.cos(th12) * Math.sin(th12) * Math.cos(th23) * Math.sin(th23) *
      Math.cos(th13) ** 2 * Math.sin(th13) * Math.sin(p.delta * Math.PI / 180);
  }

  // Evaluator for one parameter set: shares sines and cosines between
  // channels. kind: "nu", "nubar", "cp" (ν − ν̄), "ord_nu", "ord_nubar"
  // (value for NO minus value for IO with all other parameters equal).
  function makeEvaluator(p, ordering) {
    const coef = coefficients(p);
    const m2 = {
      NO: massSquared(p, "NO"),
      IO: massSquared(p, "IO")
    };
    const own = m2[ordering];
    return function evaluate(L, E, requests, out, offset) {
      const phOwn = phases(own, L, E);
      let phNO = null, phIO = null;
      for (let r = 0; r < requests.length; r += 1) {
        const q = requests[r];
        const c = coef[q.a][q.b];
        let value;
        if (q.kind === "nu") value = probabilityFromPhases(c, phOwn, false);
        else if (q.kind === "nubar") value = probabilityFromPhases(c, phOwn, true);
        else if (q.kind === "cp") {
          value = probabilityFromPhases(c, phOwn, false) - probabilityFromPhases(c, phOwn, true);
        } else {
          if (!phNO) phNO = phases(m2.NO, L, E);
          if (!phIO) phIO = phases(m2.IO, L, E);
          const anti = q.kind === "ord_nubar";
          value = probabilityFromPhases(c, phNO, anti) - probabilityFromPhases(c, phIO, anti);
        }
        out[offset + r] = value;
      }
    };
  }

  const core = {PHASE_K, BEST_FIT, pmns, coefficients, massSquared, probability, jarlskog, makeEvaluator};
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof document === "undefined") return;
  if (window.ThreeFlavorProbabilities) return; // already loaded by another include
  window.ThreeFlavorProbabilities = core;

  // -------------------------------------------------------------------- UI
  const FLAVORS = ["e", "μ", "τ"];
  // The color belongs to the channel, not to the selection order. The first eight
  // slots are a checked categorical palette (dark surface); the ninth is neutral.
  const CHANNEL_COLORS = {
    "1-1": "#3987e5", "1-0": "#d95926", "0-0": "#199e70",
    "1-2": "#c98500", "0-1": "#d55181", "0-2": "#008300",
    "2-2": "#9085e9", "2-1": "#e66767", "2-0": "#b3b2a8"
  };
  const SET_DASHES = [
    {nu: "", nubar: "11 7"},
    {nu: "2 6", nubar: "2 6 12 6"},
    {nu: "16 5 3 5", nubar: "6 5"},
    {nu: "22 6", nubar: "3 11"}
  ];
  const PARAM_ROWS = [
    {key: "s12", label: "sin²θ₁₂", min: 0.2, max: 0.45, step: 0.0005, digits: 4, unit: 1},
    {key: "s13", label: "sin²θ₁₃", min: 0, max: 0.06, step: 0.0001, digits: 5, unit: 1},
    {key: "s23", label: "sin²θ₂₃", min: 0.3, max: 0.7, step: 0.001, digits: 3, unit: 1},
    {key: "delta", label: "δ_CP, °", min: 0, max: 360, step: 1, digits: 0, unit: 1},
    {key: "dm21", label: "Δm²₂₁, 10⁻⁵ eV²", min: 5, max: 10, step: 0.01, digits: 3, unit: 1e-5},
    {key: "dm3l", label: "|Δm²₃ℓ|, 10⁻³ eV²", min: 1.5, max: 3.5, step: 0.001, digits: 3, unit: 1e-3}
  ];
  const PRESETS = [
    {id: "juno", label: "JUNO · 52.5 km", view: "E", L: 52.5, Emin: 0.001, Emax: 0.010, unit: "MeV",
     scale: "lin", channels: ["0-0"], particles: {nu: false, nubar: true}, quantity: "P", yMode: "01"},
    {id: "t2k", label: "T2K · 295 km", view: "E", L: 295, Emin: 0.2, Emax: 2, unit: "GeV",
     scale: "lin", channels: ["1-0"], particles: {nu: true, nubar: true}, quantity: "P", yMode: "auto"},
    {id: "nova", label: "NOvA · 810 km", view: "E", L: 810, Emin: 0.5, Emax: 4, unit: "GeV",
     scale: "lin", channels: ["1-0"], particles: {nu: true, nubar: true}, quantity: "P", yMode: "auto"},
    {id: "dune", label: "DUNE · 1300 km", view: "E", L: 1300, Emin: 0.5, Emax: 6, unit: "GeV",
     scale: "lin", channels: ["1-0"], particles: {nu: true, nubar: true}, quantity: "P", yMode: "auto"}
  ];
  const VIEW_W = 1290, VIEW_H = 560;
  const PLOT = {left: 82, right: 18, top: 16, bottom: 58};
  const MAX_PINNED = 3;

  const svgNS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
    children.forEach(child => node.append(child));
    return node;
  };
  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };

  // ν, ν̄ and flavor subscripts without LaTeX, so they work in tooltips and the legend
  function nuLabel(anti, flavor) {
    const span = el("span", {class: "tfp-nu"});
    span.append(el("span", {class: anti ? "tfp-bar" : "", text: "ν"}));
    if (flavor !== undefined) span.append(el("sub", {text: flavor}));
    return span;
  }
  function channelLabel(a, b, anti, prefix = "P") {
    const span = el("span");
    span.append(prefix + "(", nuLabel(anti, FLAVORS[a]), " → ", nuLabel(anti, FLAVORS[b]), ")");
    return span;
  }
  const SUPERSCRIPT = {"0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻"};
  function formatNumber(value, digits = 3) {
    if (value === 0) return "0";
    const abs = Math.abs(value);
    if (abs < 1e-3 || abs >= 1e5) {
      const [mantissa, exponent] = value.toExponential(digits - 1).split("e");
      const power = String(Number(exponent)).split("").map(ch => SUPERSCRIPT[ch] || "").join("");
      return `${Number(mantissa)}·10${power}`;
    }
    return Number(value.toPrecision(digits)).toString();
  }
  function niceLinearTicks(lo, hi, target = 7) {
    const span = hi - lo;
    const raw = span / target;
    const pow = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) || 10 * pow;
    const ticks = [];
    for (let t = Math.ceil(lo / step - 1e-9) * step; t <= hi + step * 1e-9; t += step) {
      ticks.push(Number(t.toPrecision(12)));
    }
    return ticks;
  }
  function logTicks(lo, hi) {
    const ticks = [];
    const start = Math.floor(Math.log10(lo));
    const end = Math.ceil(Math.log10(hi));
    for (let k = start; k <= end; k += 1) {
      [1, 2, 5].forEach(m => {
        const value = m * 10 ** k;
        if (value >= lo * (1 - 1e-9) && value <= hi * (1 + 1e-9)) ticks.push(value);
      });
    }
    return ticks;
  }

  function sequentialColor(t) {
    // P = 0 → dark, P = 1 → light: steps of the blue scale 700 → 100
    const stops = ["#0d366b", "#104281", "#184f95", "#1c5cab", "#256abf", "#2a78d6", "#3987e5",
                   "#6da7ec", "#9ec5f4", "#cde2fb"];
    return interpolateStops(stops, Math.min(1, Math.max(0, t)));
  }
  function divergingColor(t) {
    // t ∈ [−1, 1]; neutral gray middle, blue and red arms
    const blue = ["#383835", "#1c5cab", "#3987e5", "#9ec5f4"];
    const red = ["#383835", "#933a3a", "#e66767", "#f6b3b3"];
    const arm = t < 0 ? blue : red;
    return interpolateStops(arm, Math.min(1, Math.abs(t)));
  }
  function hexToRgb(hex) {
    return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  }
  function interpolateStops(stops, t) {
    const position = t * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(position));
    const f = position - index;
    const a = hexToRgb(stops[index]), b = hexToRgb(stops[index + 1]);
    return a.map((v, i) => Math.round(v + (b[i] - v) * f));
  }

  function initialize(root) {
    if (root.dataset.tfpReady === "true") return;
    root.dataset.tfpReady = "true";
    root.textContent = "";

    // -------------------------------------------------------------- state
    const state = {
      view: "E",
      ordering: "NO",
      live: {...BEST_FIT.NO},
      channels: ["1-1", "1-0"],
      particles: {nu: true, nubar: false},
      quantity: "P",
      L: 295,
      E: 0.6,
      Emin: 0.2,
      Emax: 2,
      Lmin: 0,
      Lmax: 1300,
      unit: "GeV",
      scale: "lin",
      yMode: "01",
      pinned: [],
      hoverFraction: null,
      lastHover: null,
      pinCounter: 0
    };
    const unitFactor = () => (state.unit === "MeV" ? 1000 : 1);

    // ---------------------------------------------------------- DOM build
    const tabs = el("div", {class: "tfp__tabs", role: "group", "aria-label": "Plot type"});
    [["E", "P(E) at fixed L"], ["L", "P(L) at fixed E"], ["map", "Map P(L, E)"]].forEach(([id, text]) => {
      tabs.append(el("button", {type: "button", "data-view": id, text}));
    });
    const presets = el("div", {class: "tfp__presets"}, [el("span", {text: "Experiments:"})]);
    PRESETS.forEach(preset => presets.append(el("button", {type: "button", "data-preset": preset.id, text: preset.label})));
    const bar = el("div", {class: "tfp__bar"}, [tabs, presets]);

    // --- left panel
    const orderingButtons = el("div", {class: "tfp__seg", role: "group", "aria-label": "Mass ordering"}, [
      el("button", {type: "button", "data-ordering": "NO", text: "Normal"}),
      el("button", {type: "button", "data-ordering": "IO", text: "Inverted"})
    ]);
    const bestFitButton = el("button", {type: "button", class: "tfp__link", text: "Reset to best fit " + BEST_FIT.short, title: BEST_FIT.label});
    const orderingNote = el("div", {class: "tfp__small", "data-ordering-note": ""});

    const paramInputs = {};
    const paramBox = el("div", {class: "tfp__params"});
    PARAM_ROWS.forEach(row => {
      const slider = el("input", {type: "range", min: row.min, max: row.max, step: row.step, "aria-label": row.label});
      const number = el("input", {type: "number", step: "any", class: "tfp__number", "aria-label": row.label + ", value"});
      paramInputs[row.key] = {slider, number, row};
      paramBox.append(el("label", {class: "tfp__param"}, [el("span", {text: row.label}), slider, number]));
    });

    const channelGrid = el("div", {class: "tfp__channels", role: "group", "aria-label": "Channels α → β"});
    channelGrid.append(el("span", {class: "tfp__corner", text: "from ↓  to →"}));
    FLAVORS.forEach(f => channelGrid.append(el("span", {class: "tfp__colhead"}, [nuLabel(false, f)])));
    for (let a = 0; a < 3; a += 1) {
      channelGrid.append(el("span", {class: "tfp__rowhead"}, [nuLabel(false, FLAVORS[a])]));
      for (let b = 0; b < 3; b += 1) {
        const key = `${a}-${b}`;
        const button = el("button", {type: "button", "data-channel": key, class: "tfp__chan"});
        button.style.setProperty("--chan", CHANNEL_COLORS[key]);
        button.append(el("i"), a === b ? "surv." : "app.");
        button.setAttribute("aria-label", `P(${FLAVORS[a]} → ${FLAVORS[b]})`);
        channelGrid.append(button);
      }
    }
    const particleButtons = el("div", {class: "tfp__seg", role: "group", "aria-label": "Neutrino or antineutrino"}, [
      el("button", {type: "button", "data-particle": "nu"}, [nuLabel(false), " neutrino"]),
      el("button", {type: "button", "data-particle": "nubar"}, [nuLabel(true), " antineutrino"])
    ]);
    const quantityButtons = el("div", {class: "tfp__seg tfp__seg--three", role: "group", "aria-label": "Quantity"}, [
      el("button", {type: "button", "data-quantity": "P", text: "P"}),
      el("button", {type: "button", "data-quantity": "CP", text: "ν − ν̄"}),
      el("button", {type: "button", "data-quantity": "ORD", text: "NO − IO"})
    ]);

    const pinButton = el("button", {type: "button", "data-pin": "same", text: "Pin current"});
    const pinOtherSame = el("button", {type: "button", "data-pin": "other-same"});
    const pinOtherBest = el("button", {type: "button", "data-pin": "other-best"});
    const clearButton = el("button", {type: "button", "data-pin": "clear", text: "Clear pinned"});

    const compareSection = el("div", {class: "tfp__sect"}, [el("h4", {text: "Compare curves"}), pinButton, pinOtherSame, pinOtherBest, clearButton]);
    const controls = el("div", {class: "tfp__controls"}, [
      el("div", {class: "tfp__sect"}, [el("h4", {text: "Mass ordering"}), orderingButtons, orderingNote, bestFitButton]),
      el("div", {class: "tfp__sect"}, [el("h4", {text: "Parameters"}), paramBox]),
      el("div", {class: "tfp__sect"}, [el("h4", {text: "Channels"}), channelGrid, particleButtons]),
      compareSection
    ]);

    // --- right panel
    const fieldL = el("label", {}, [el("span", {text: "L, km"}), el("input", {type: "number", step: "any", "data-field": "L"})]);
    const fieldE = el("label", {}, [el("span", {text: "E"}), el("input", {type: "number", step: "any", "data-field": "E"})]);
    const fieldEmin = el("label", {}, [el("span", {text: "E from"}), el("input", {type: "number", step: "any", "data-field": "Emin"})]);
    const fieldEmax = el("label", {}, [el("span", {text: "to"}), el("input", {type: "number", step: "any", "data-field": "Emax"})]);
    const fieldLmin = el("label", {}, [el("span", {text: "L from, km"}), el("input", {type: "number", step: "any", "data-field": "Lmin"})]);
    const fieldLmax = el("label", {}, [el("span", {text: "to, km"}), el("input", {type: "number", step: "any", "data-field": "Lmax"})]);
    const unitSeg = el("div", {class: "tfp__seg tfp__seg--compact", role: "group", "aria-label": "Energy units"}, [
      el("button", {type: "button", "data-unit": "MeV", text: "MeV"}),
      el("button", {type: "button", "data-unit": "GeV", text: "GeV"})
    ]);
    const scaleSeg = el("div", {class: "tfp__seg tfp__seg--compact", role: "group", "aria-label": "Axis scale"}, [
      el("button", {type: "button", "data-scale": "lin", text: "lin"}),
      el("button", {type: "button", "data-scale": "log", text: "log"})
    ]);
    const ySeg = el("div", {class: "tfp__seg tfp__seg--compact", role: "group", "aria-label": "Probability axis"}, [
      el("button", {type: "button", "data-ymode": "01", text: "0–1"}),
      el("button", {type: "button", "data-ymode": "auto", text: "auto"})
    ]);
    const axesRow = el("div", {class: "tfp__axes"}, [
      fieldL, fieldE, fieldEmin, fieldEmax, fieldLmin, fieldLmax,
      unitSeg, el("span", {class: "tfp__axes-label", text: "scale"}), scaleSeg,
      el("span", {class: "tfp__axes-label", "data-yaxis-label": "", text: "y axis"}), ySeg,
      el("span", {class: "tfp__axes-label", text: "quantity"}), quantityButtons
    ]);

    const svg = svgEl("svg", {viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, class: "tfp__svg", role: "img", tabindex: "0",
      "aria-label": "Oscillation probability plot"});
    const canvas = el("canvas", {class: "tfp__canvas", width: 360, height: 190});
    const tooltip = el("div", {class: "tfp__tooltip", hidden: ""});
    const stage = el("div", {class: "tfp__stage"}, [canvas, svg, tooltip]);
    const legend = el("div", {class: "tfp__legend"});
    const foot = el("div", {class: "tfp__foot"});
    const pythonCode = el("code", {class: "tfp__code"});
    const copyButton = el("button", {type: "button", class: "tfp__link", text: "Copy"});
    const pythonBox = el("details", {class: "tfp__details"}, [
      el("summary", {text: "Reproduce in Python"}),
      el("p", {class: "tfp__small", text: "The same calculation in three_flavor_oscillations.py (numpy, matplotlib). Command for the current settings:"}),
      pythonCode, copyButton
    ]);
    const tableBox = el("details", {class: "tfp__details"}, [el("summary", {text: "Table of values"})]);
    const tableHost = el("div", {class: "tfp__table-host"});
    tableBox.append(tableHost);
    const main = el("div", {class: "tfp__main"}, [axesRow, stage, legend, foot, el("div", {class: "tfp__details-row"}, [tableBox])]);

    root.append(bar, el("div", {class: "tfp__body"}, [controls, main]));

    // ------------------------------------------------------------ helpers
    const ordOther = ord => (ord === "NO" ? "IO" : "NO");
    const plotW = VIEW_W - PLOT.left - PLOT.right;
    const plotH = VIEW_H - PLOT.top - PLOT.bottom;
    const isMap = () => state.view === "map";

    function xRange() {
      if (state.view === "E") return [state.Emin, state.Emax];
      return [state.Lmin, state.Lmax];
    }
    function xLogAllowed() {
      const [lo] = xRange();
      return lo > 0;
    }
    function isLogX() {
      return state.scale === "log" && xLogAllowed();
    }
    function xToFrac(x, lo, hi, log) {
      return log ? (Math.log(x) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (x - lo) / (hi - lo);
    }
    function fracToX(f, lo, hi, log) {
      return log ? Math.exp(Math.log(lo) + f * (Math.log(hi) - Math.log(lo))) : lo + f * (hi - lo);
    }

    function setsList() {
      const sets = [{p: state.live, ord: state.ordering, live: true, id: "live"}];
      state.pinned.forEach(item => sets.push({p: item.p, ord: item.ord, live: false, id: item.id, pin: item}));
      return sets;
    }

    function requests() {
      const list = [];
      const kinds = (() => {
        if (state.quantity === "CP") return ["cp"];
        const base = state.quantity === "ORD" ? ["ord_nu", "ord_nubar"] : ["nu", "nubar"];
        const out = [];
        if (state.particles.nu) out.push(base[0]);
        if (state.particles.nubar) out.push(base[1]);
        return out;
      })();
      state.channels.forEach(key => {
        const [a, b] = key.split("-").map(Number);
        kinds.forEach(kind => list.push({a, b, kind, key}));
      });
      return list;
    }

    function fixedPair(x) {
      // converts the plot coordinate to (L, E_GeV)
      return state.view === "E" ? {L: state.L, E: x} : {L: x, E: state.E};
    }

    function phaseScale(p) {
      const big = Math.max(p.dm21, p.dm3l, Math.abs(p.dm21 - p.dm3l));
      return 2 * PHASE_K * big;
    }

    function buildGrid() {
      const [lo, hi] = xRange();
      const log = isLogX();
      const pts = new Set();
      const add = v => { if (isFinite(v)) pts.add(Math.min(hi, Math.max(lo, v))); };
      add(lo); add(hi);
      let maxSpan = 0;
      setsList().forEach(set => {
        const k = phaseScale(set.p);
        if (state.view === "E") maxSpan = Math.max(maxSpan, k * state.L * Math.abs(1 / lo - 1 / hi));
        else maxSpan = Math.max(maxSpan, k * (hi - lo) / state.E);
      });
      const needed = Math.ceil(36 * maxSpan / (2 * Math.PI));
      const n = Math.min(Math.max(needed, 500), 30000);
      state.unresolved = needed > 30000;
      for (let i = 0; i <= n; i += 1) {
        const f = i / n;
        if (state.view === "E") {
          add(1 / (1 / lo + f * (1 / hi - 1 / lo))); // uniform in phase
        } else {
          add(lo + f * (hi - lo));
        }
      }
      for (let i = 0; i <= 500; i += 1) {
        add(lo + (hi - lo) * i / 500);
        if (lo > 0) add(lo * (hi / lo) ** (i / 500));
      }
      return Float64Array.from([...pts].sort((a, b) => a - b));
    }

    function computeSeries(grid, reqs, sets) {
      const R = reqs.length;
      const total = sets.length * R;
      const data = Array.from({length: total}, () => new Float64Array(grid.length));
      const buffer = new Float64Array(R);
      sets.forEach((set, s) => {
        const evaluate = makeEvaluator(set.p, set.ord);
        for (let k = 0; k < grid.length; k += 1) {
          const {L, E} = fixedPair(grid[k]);
          evaluate(L, E, reqs, buffer, 0);
          for (let r = 0; r < R; r += 1) data[s * R + r][k] = buffer[r];
        }
      });
      return data;
    }

    // ------------------------------------------------------------- labels
    function unitText() { return state.unit === "MeV" ? "MeV" : "GeV"; }
    function quantityLabel() {
      return {P: "Probability", CP: "P(ν) − P(ν̄)", ORD: "P(NO) − P(IO)"}[state.quantity];
    }

    // ------------------------------------------------------ panel updates
    function syncControls() {
      root.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("is-active", b.dataset.view === state.view));
      root.querySelectorAll("[data-ordering]").forEach(b => b.classList.toggle("is-active", b.dataset.ordering === state.ordering));
      root.querySelectorAll("[data-particle]").forEach(b => {
        b.classList.toggle("is-active", state.particles[b.dataset.particle]);
        b.disabled = state.quantity === "CP";
      });
      root.querySelectorAll("[data-quantity]").forEach(b => b.classList.toggle("is-active", b.dataset.quantity === state.quantity));
      root.querySelectorAll("[data-channel]").forEach(b => b.classList.toggle("is-active", state.channels.includes(b.dataset.channel)));
      root.querySelectorAll("[data-unit]").forEach(b => b.classList.toggle("is-active", b.dataset.unit === state.unit));
      root.querySelectorAll("[data-scale]").forEach(b => {
        b.classList.toggle("is-active", b.dataset.scale === (isMap() ? "log" : (isLogX() ? "log" : "lin")));
        b.disabled = isMap() || (b.dataset.scale === "log" && !xLogAllowed());
      });
      root.querySelectorAll("[data-ymode]").forEach(b => {
        b.classList.toggle("is-active", b.dataset.ymode === state.yMode);
        b.disabled = state.quantity !== "P";
      });
      const other = ordOther(state.ordering);
      pinOtherSame.textContent = `+ ${other}, same parameters`;
      pinOtherBest.textContent = `+ ${other}, best fit`;
      pinButton.disabled = state.pinned.length >= MAX_PINNED;
      pinOtherSame.disabled = state.pinned.length >= MAX_PINNED;
      pinOtherBest.disabled = state.pinned.length >= MAX_PINNED;
      clearButton.disabled = state.pinned.length === 0;
      compareSection.hidden = isMap();
      root.querySelector("[data-yaxis-label]").textContent = isMap() ? "color" : "y axis";

      const showE = state.view === "E", showL = state.view === "L", map = isMap();
      fieldL.hidden = !showE;
      fieldE.hidden = !showL;
      fieldEmin.hidden = !(showE || map);
      fieldEmax.hidden = !(showE || map);
      fieldLmin.hidden = !(showL);
      fieldLmax.hidden = !(showL || map);
      fieldE.querySelector("span").textContent = `E, ${unitText()}`;
      fieldEmin.querySelector("span").textContent = `E from, ${unitText()}`;
      fieldEmax.querySelector("span").textContent = `to, ${unitText()}`;
      const f = unitFactor();
      const setField = (name, value) => {
        const input = root.querySelector(`[data-field="${name}"]`);
        if (document.activeElement !== input) input.value = formatNumber(value, 6);
      };
      setField("L", state.L);
      setField("E", state.E * f);
      setField("Emin", state.Emin * f);
      setField("Emax", state.Emax * f);
      setField("Lmin", state.Lmin);
      setField("Lmax", state.Lmax);

      PARAM_ROWS.forEach(row => {
        const {slider, number} = paramInputs[row.key];
        const shown = state.live[row.key] / row.unit;
        slider.value = String(shown);
        if (document.activeElement !== number) number.value = Number(shown.toFixed(row.digits + 1)).toString();
      });
      const p = state.live;
      const m2 = massSquared(p, state.ordering);
      orderingNote.textContent = state.ordering === "NO"
        ? `m₁ < m₂ < m₃: Δm²₃₁ = +${formatNumber(m2[2] * 1e3, 4)}·10⁻³ eV²`
        : `m₃ < m₁ < m₂: Δm²₃₂ = −${formatNumber(p.dm3l * 1e3, 4)}·10⁻³, Δm²₃₁ = −${formatNumber(-m2[2] * 1e3, 4)}·10⁻³ eV²`;
    }

    function differences(set) {
      const live = state.live;
      const parts = [];
      PARAM_ROWS.forEach(row => {
        if (Math.abs(set.p[row.key] - live[row.key]) > 1e-12 * Math.max(1, Math.abs(live[row.key]))) {
          parts.push(`${row.label.split(",")[0]} = ${formatNumber(set.p[row.key] / row.unit, 4)}`);
        }
      });
      return parts;
    }

    function updateLegend(reqs, sets) {
      legend.textContent = "";
      const colors = el("div", {class: "tfp__legend-group"});
      const seen = new Set();
      reqs.forEach(q => {
        if (seen.has(q.key)) return;
        seen.add(q.key);
        const item = el("span", {class: "tfp__key"});
        const swatch = svgEl("svg", {width: 34, height: 12, viewBox: "0 0 34 12", "aria-hidden": "true"});
        swatch.append(svgEl("line", {x1: 1, x2: 33, y1: 6, y2: 6, stroke: CHANNEL_COLORS[q.key], "stroke-width": 4, "stroke-linecap": "round"}));
        item.append(swatch);
        const label = el("span");
        if (state.quantity === "P") label.append(channelLabel(q.a, q.b, false));
        else {
          const name = `${FLAVORS[q.a]} → ${FLAVORS[q.b]}`;
          label.append(state.quantity === "CP" ? `P(ν) − P(ν̄), ${name}` : `P(NO) − P(IO), ${name}`);
        }
        item.append(label);
        colors.append(item);
      });
      legend.append(colors);

      const lines = el("div", {class: "tfp__legend-group"});
      sets.forEach((set, s) => {
        const dash = SET_DASHES[s % SET_DASHES.length];
        const kinds = state.quantity === "CP" ? [["nu", "ν − ν̄"]] : [
          ...(state.particles.nu ? [["nu", "ν"]] : []),
          ...(state.particles.nubar ? [["nubar", "ν̄"]] : [])
        ];
        const item = el("span", {class: "tfp__key tfp__key--set"});
        kinds.forEach(([kind, text]) => {
          const swatch = svgEl("svg", {width: 46, height: 12, viewBox: "0 0 46 12", "aria-hidden": "true"});
          const line = svgEl("line", {x1: 2, x2: 44, y1: 6, y2: 6, stroke: "#e8f1f9", "stroke-width": 3,
            "stroke-linecap": dash.nu.startsWith("2 6") ? "round" : "butt"});
          const pattern = kind === "nubar" ? dash.nubar : dash.nu;
          if (pattern) line.setAttribute("stroke-dasharray", pattern);
          swatch.append(line);
          item.append(swatch, el("span", {class: "tfp__key-text", text}));
        });
        const tag = set.live ? `${set.ord}, current parameters` : `${set.ord}${differences(set).length ? ": " + differences(set).join(", ") : ", same as current"}`;
        item.append(el("span", {class: "tfp__key-set", text: set.live ? tag : `pinned ${set.pin.number}. ${tag}`}));
        if (!set.live) {
          const remove = el("button", {type: "button", class: "tfp__x", "aria-label": `Remove pinned set ${set.pin.number}`, text: "×"});
          remove.addEventListener("click", () => {
            state.pinned = state.pinned.filter(p => p.id !== set.id);
            render();
          });
          item.append(remove);
        }
        lines.append(item);
      });
      if (!isMap()) legend.append(lines);
    }

    function updateFoot() {
      foot.textContent = "";
      const p = state.live;
      const parts = [
        `J_CP = ${formatNumber(jarlskog(p), 3).replace("-", "−")}`,
        isMap() ? "map uses the current parameters" : null,
        state.unresolved ? "fast oscillations not resolved by the grid: narrow the range" : null
      ].filter(Boolean);
      foot.append(el("span", {text: parts.join(" · ")}));
      foot.append(el("span", {class: "tfp__small", text: "Vacuum; matter effects not included. Default parameters: " + BEST_FIT.label + "."}));
    }

    function updatePythonCommand() {
      const plain = v => String(Number(v.toPrecision(6)));
      const base = BEST_FIT[state.ordering];
      const args = ["python three_flavor_oscillations.py"];
      const channelName = key => {
        const [a, b] = key.split("-").map(Number);
        return ["e", "mu", "tau"][a] + ["e", "mu", "tau"][b];
      };
      if (isMap()) {
        args.push("--map", `--channels ${channelName(state.channels[0] || "1-0")}`);
        args.push(`--quantity ${{P: "p", CP: "cp", ORD: "ordering"}[state.quantity]}`);
        if (state.quantity === "P") args.push(`--particles ${state.particles.nu ? "neutrino" : "antineutrino"}`);
        args.push(`--Lmax ${plain(state.Lmax)}`, `--Emin ${plain(state.Emin)}`, `--Emax ${plain(state.Emax)}`);
      } else {
        args.push(`--vs ${state.view}`);
        if (state.view === "E") args.push(`--L ${plain(state.L)}`, `--Emin ${plain(state.Emin)}`, `--Emax ${plain(state.Emax)}`);
        else args.push(`--E ${plain(state.E)}`, `--Lmin ${plain(state.Lmin)}`, `--Lmax ${plain(state.Lmax)}`);
        args.push(`--channels ${state.channels.map(channelName).join(" ") || "mue"}`);
        const particles = state.particles.nu && state.particles.nubar ? "both" : state.particles.nubar ? "antineutrino" : "neutrino";
        args.push(`--particles ${particles}`);
        if (state.quantity === "CP") args.push("--quantity cp");
        if (isLogX()) args.push("--log");
      }
      args.push(`--ordering ${state.ordering}`);
      const flag = {s12: "sin2-theta12", s13: "sin2-theta13", s23: "sin2-theta23", delta: "delta-cp-deg", dm21: "dm21"};
      Object.keys(flag).forEach(key => {
        if (Math.abs(state.live[key] - base[key]) > 1e-12 * Math.max(1, Math.abs(base[key]))) {
          args.push(`--${flag[key]} ${Number(state.live[key].toPrecision(6))}`);
        }
      });
      const signedDm3l = (state.ordering === "NO" ? 1 : -1) * state.live.dm3l;
      const baseSigned = (state.ordering === "NO" ? 1 : -1) * base.dm3l;
      if (Math.abs(signedDm3l - baseSigned) > 1e-15) args.push(`--dm3l ${Number(signedDm3l.toPrecision(6))}`);
      pythonCode.textContent = args.join(" ");
    }

    // --------------------------------------------------------------- axes
    function clearSvg() { while (svg.firstChild) svg.removeChild(svg.firstChild); }

    function drawAxes(xLo, xHi, xLog, yLo, yHi, yLabel, xLabel, yTicksOverride) {
      const g = svgEl("g", {class: "tfp__axes-layer"});
      const left = PLOT.left, top = PLOT.top, right = VIEW_W - PLOT.right, bottom = VIEW_H - PLOT.bottom;
      const fx = x => left + xToFrac(x, xLo, xHi, xLog) * plotW;
      const fy = y => bottom - (y - yLo) / (yHi - yLo) * plotH;
      const xTicks = xLog ? logTicks(xLo, xHi) : niceLinearTicks(xLo, xHi, 8);
      const unit = state.view === "L" ? 1 : unitFactor();
      const yTicks = yTicksOverride || niceLinearTicks(yLo, yHi, 6);
      yTicks.forEach(t => {
        const y = fy(t);
        g.append(svgEl("line", {x1: left, x2: right, y1: y, y2: y, class: "tfp__grid"}));
        const label = svgEl("text", {x: left - 10, y: y + 5, class: "tfp__tick", "text-anchor": "end"});
        label.textContent = formatNumber(t, 3).replace("-", "−");
        g.append(label);
      });
      xTicks.forEach(t => {
        const x = fx(t);
        g.append(svgEl("line", {x1: x, x2: x, y1: top, y2: bottom, class: "tfp__grid tfp__grid--x"}));
        const label = svgEl("text", {x, y: bottom + 24, class: "tfp__tick", "text-anchor": "middle"});
        label.textContent = formatNumber(t * unit, 3);
        g.append(label);
      });
      g.append(svgEl("rect", {x: left, y: top, width: plotW, height: plotH, class: "tfp__frame"}));
      const xl = svgEl("text", {x: left + plotW / 2, y: VIEW_H - 10, class: "tfp__axis-label", "text-anchor": "middle"});
      xl.textContent = xLabel;
      g.append(xl);
      const yl = svgEl("text", {x: 20, y: top + plotH / 2, class: "tfp__axis-label", "text-anchor": "middle",
        transform: `rotate(-90 20 ${top + plotH / 2})`});
      yl.textContent = yLabel;
      g.append(yl);
      svg.append(g);
      return {fx, fy};
    }

    // --------------------------------------------------------- line plot
    let current = null; // last computation, for the tooltip

    function renderLines() {
      canvas.style.display = "none";
      clearSvg();
      const reqs = requests();
      const sets = setsList();
      const [xLo, xHi] = xRange();
      const log = isLogX();
      const grid = buildGrid();
      const R = reqs.length;
      const data = R ? computeSeries(grid, reqs, sets) : [];

      let yLo = 0, yHi = 1, yTicks = null;
      if (state.quantity !== "P" || state.yMode === "auto") {
        let lo = Infinity, hi = -Infinity;
        data.forEach(arr => arr.forEach(v => { if (v < lo) lo = v; if (v > hi) hi = v; }));
        if (!isFinite(lo)) { lo = 0; hi = 1; }
        if (state.quantity === "P") {
          yLo = 0; yHi = Math.max(hi * 1.08, 1e-3);
        } else {
          const m = Math.max(Math.abs(lo), Math.abs(hi), 1e-4) * 1.12;
          yLo = -m; yHi = m;
        }
      }
      const xLabel = state.view === "E" ? `E, ${unitText()}  (L = ${formatNumber(state.L, 4)} km)` : `L, km  (E = ${formatNumber(state.E * unitFactor(), 4)} ${unitText()})`;
      const yLabel = quantityLabel();
      const {fx, fy} = drawAxes(xLo, xHi, log, yLo, yHi, yLabel, xLabel, yTicks);

      if (yLo < 0 && yHi > 0) {
        svg.append(svgEl("line", {x1: PLOT.left, x2: VIEW_W - PLOT.right, y1: fy(0), y2: fy(0), class: "tfp__zero"}));
      }
      const defs = svgEl("defs");
      const clip = svgEl("clipPath", {id: "tfp-clip-" + (root.dataset.tfpId || "0")});
      clip.append(svgEl("rect", {x: PLOT.left, y: PLOT.top - 2, width: plotW, height: plotH + 4}));
      defs.append(clip);
      svg.append(defs);
      const curves = svgEl("g", {"clip-path": `url(#tfp-clip-${root.dataset.tfpId || "0"})`});
      sets.forEach((set, s) => {
        const dash = SET_DASHES[s % SET_DASHES.length];
        reqs.forEach((q, r) => {
          const arr = data[s * R + r];
          let d = "";
          for (let k = 0; k < grid.length; k += 1) {
            d += (k === 0 ? "M" : "L") + fx(grid[k]).toFixed(1) + " " + fy(arr[k]).toFixed(1);
          }
          const isBar = q.kind.endsWith("nubar");
          const path = svgEl("path", {d, class: "tfp__curve", stroke: CHANNEL_COLORS[q.key]});
          const pattern = isBar ? dash.nubar : dash.nu;
          if (pattern) path.setAttribute("stroke-dasharray", pattern);
          if (dash.nu.startsWith("2 6")) path.setAttribute("stroke-linecap", "round");
          curves.append(path);
        });
      });
      svg.append(curves);

      const cursor = svgEl("g", {class: "tfp__cursor", visibility: "hidden"});
      cursor.append(svgEl("line", {y1: PLOT.top, y2: VIEW_H - PLOT.bottom, class: "tfp__hair"}));
      svg.append(cursor);
      const dots = svgEl("g", {class: "tfp__dots"});
      svg.append(dots);

      current = {kind: "lines", reqs, sets, xLo, xHi, log, fx, fy, yLo, yHi, cursor, dots, grid};
      if (state.hoverFraction !== null) showLineHover(state.hoverFraction, false);
      updateTable(reqs, sets, xLo, xHi, log);
      if (!R) drawEmptyNote("Select at least one channel and particle type");
    }

    function drawEmptyNote(text) {
      const note = svgEl("text", {x: PLOT.left + plotW / 2, y: PLOT.top + plotH / 2, class: "tfp__empty", "text-anchor": "middle"});
      note.textContent = text;
      svg.append(note);
    }

    function valuesAt(x, reqs, sets) {
      const {L, E} = fixedPair(x);
      const out = new Float64Array(reqs.length);
      return sets.map(set => {
        makeEvaluator(set.p, set.ord)(L, E, reqs, out, 0);
        return Float64Array.from(out);
      });
    }

    function showLineHover(fraction, fromPointer) {
      if (!current || current.kind !== "lines") return;
      const {reqs, sets, xLo, xHi, log, fx, fy, cursor, dots} = current;
      if (!reqs.length) return;
      const f = Math.min(1, Math.max(0, fraction));
      state.hoverFraction = f;
      const x = fracToX(f, xLo, xHi, log);
      const px = PLOT.left + f * plotW;
      cursor.setAttribute("visibility", "visible");
      cursor.firstChild.setAttribute("x1", px);
      cursor.firstChild.setAttribute("x2", px);
      const values = valuesAt(x, reqs, sets);
      dots.textContent = "";
      const rows = [];
      values.forEach((row, s) => {
        row.forEach((value, r) => {
          const q = reqs[r];
          const cy = fy(value);
          if (cy >= PLOT.top - 2 && cy <= VIEW_H - PLOT.bottom + 2) {
            dots.append(svgEl("circle", {cx: px, cy, r: 5, fill: CHANNEL_COLORS[q.key], class: "tfp__dot"}));
          }
          rows.push({s, q, value});
        });
      });
      // tooltip
      tooltip.textContent = "";
      const head = state.view === "E"
        ? `E = ${formatNumber(x * unitFactor(), 4)} ${unitText()}, L = ${formatNumber(state.L, 4)} km`
        : `L = ${formatNumber(x, 4)} km, E = ${formatNumber(state.E * unitFactor(), 4)} ${unitText()}`;
      tooltip.append(el("div", {class: "tfp__tip-head", text: head}));
      if (state.view === "E" && x > 0) tooltip.append(el("div", {class: "tfp__tip-sub", text: `L/E = ${formatNumber(state.L / x, 4)} km/GeV`}));
      if (state.view === "L") tooltip.append(el("div", {class: "tfp__tip-sub", text: `L/E = ${formatNumber(x / state.E, 4)} km/GeV`}));
      rows.forEach(({s, q, value}) => {
        const dash = SET_DASHES[s % SET_DASHES.length];
        const row = el("div", {class: "tfp__tip-row"});
        const swatch = svgEl("svg", {width: 30, height: 10, viewBox: "0 0 30 10", "aria-hidden": "true"});
        const line = svgEl("line", {x1: 1, x2: 29, y1: 5, y2: 5, stroke: CHANNEL_COLORS[q.key], "stroke-width": 3});
        const pattern = q.kind.endsWith("nubar") ? dash.nubar : dash.nu;
        if (pattern) line.setAttribute("stroke-dasharray", pattern);
        swatch.append(line);
        row.append(swatch);
        row.append(el("strong", {text: formatNumber(value, 4).replace("-", "−")}));
        const anti = q.kind.endsWith("nubar");
        const name = el("span", {class: "tfp__tip-name"});
        if (state.quantity === "P") name.append(channelLabel(q.a, q.b, anti));
        else name.append(`${FLAVORS[q.a]}→${FLAVORS[q.b]}${q.kind === "ord_nubar" ? " (ν̄)" : ""}`);
        name.append(` · ${sets[s].live ? sets[s].ord : "pin " + sets[s].pin.number + ", " + sets[s].ord}`);
        row.append(name);
        tooltip.append(row);
      });
      positionTooltip(px / VIEW_W, Math.min(...rows.map(r => fy(r.value))) / VIEW_H);
    }

    function positionTooltip(fx, fy) {
      tooltip.hidden = false;
      const w = stage.clientWidth, h = stage.clientHeight;
      const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      let left = fx * w + 18;
      if (left + tw > w - 6) left = fx * w - tw - 18;
      let top = Math.min(Math.max(8, fy * h - th / 2), Math.max(8, h - th - 8));
      tooltip.style.left = Math.max(6, left) + "px";
      tooltip.style.top = top + "px";
    }

    function hideHover() {
      state.hoverFraction = null;
      state.lastHover = null;
      tooltip.hidden = true;
      if (current && current.cursor) current.cursor.setAttribute("visibility", "hidden");
      if (current && current.dots) current.dots.textContent = "";
      if (current && current.mapMark) current.mapMark.setAttribute("visibility", "hidden");
    }

    // ---------------------------------------------------------------- map
    function renderMap() {
      clearSvg();
      const key = state.channels[0] || "1-0";
      const [a, b] = key.split("-").map(Number);
      const anti = !state.particles.nu && state.particles.nubar;
      const Elo = state.Emin, Ehi = state.Emax, Lhi = state.Lmax, Llo = 0;
      const W = canvas.width, H = canvas.height;
      const evaluateCell = (L, E) => {
        const out = new Float64Array(1);
        const req = [{a, b, kind: state.quantity === "P" ? (anti ? "nubar" : "nu") : state.quantity === "CP" ? "cp" : (anti ? "ord_nubar" : "ord_nu")}];
        makeEvaluator(state.live, state.ordering)(L, E, req, out, 0);
        return out[0];
      };
      const values = new Float64Array(W * H);
      let vmax = 1e-6;
      for (let j = 0; j < H; j += 1) {
        const E = Math.exp(Math.log(Ehi) - (j + 0.5) / H * (Math.log(Ehi) - Math.log(Elo)));
        for (let i = 0; i < W; i += 1) {
          const L = Llo + (i + 0.5) / W * (Lhi - Llo);
          const v = evaluateCell(L, E);
          values[j * W + i] = v;
          if (Math.abs(v) > vmax) vmax = Math.abs(v);
        }
      }
      const symmetric = state.quantity !== "P";
      let peak = 0;
      values.forEach(v => { if (Math.abs(v) > peak) peak = Math.abs(v); });
      const range = symmetric ? vmax : (state.yMode === "auto" ? Math.max(peak, 1e-6) : 1);
      const context = canvas.getContext("2d");
      const image = context.createImageData(W, H);
      for (let n = 0; n < W * H; n += 1) {
        const rgb = symmetric ? divergingColor(values[n] / range) : sequentialColor(values[n] / range);
        image.data[4 * n] = rgb[0];
        image.data[4 * n + 1] = rgb[1];
        image.data[4 * n + 2] = rgb[2];
        image.data[4 * n + 3] = 255;
      }
      context.putImageData(image, 0, 0);
      canvas.style.display = "block";
      canvas.style.left = (100 * PLOT.left / VIEW_W) + "%";
      canvas.style.top = (100 * PLOT.top / VIEW_H) + "%";
      canvas.style.width = (100 * plotW / VIEW_W) + "%";
      canvas.style.height = (100 * plotH / VIEW_H) + "%";

      const logFrac = E => (Math.log(E) - Math.log(Elo)) / (Math.log(Ehi) - Math.log(Elo));
      // axes: x linear (L), y logarithmic (E)
      const g = svgEl("g", {class: "tfp__axes-layer"});
      const left = PLOT.left, top = PLOT.top, right = VIEW_W - PLOT.right, bottom = VIEW_H - PLOT.bottom;
      const eTicks = logTicks(Elo, Ehi);
      eTicks.forEach(t => {
        const y = bottom - logFrac(t) * plotH;
        g.append(svgEl("line", {x1: left, x2: right, y1: y, y2: y, class: "tfp__grid tfp__grid--map"}));
        const label = svgEl("text", {x: left - 10, y: y + 5, class: "tfp__tick", "text-anchor": "end"});
        label.textContent = formatNumber(t * unitFactor(), 3);
        g.append(label);
      });
      niceLinearTicks(Llo, Lhi, 8).forEach(t => {
        const x = left + (t - Llo) / (Lhi - Llo) * plotW;
        g.append(svgEl("line", {x1: x, x2: x, y1: top, y2: bottom, class: "tfp__grid tfp__grid--map"}));
        const label = svgEl("text", {x, y: bottom + 24, class: "tfp__tick", "text-anchor": "middle"});
        label.textContent = formatNumber(t, 4);
        g.append(label);
      });
      g.append(svgEl("rect", {x: left, y: top, width: plotW, height: plotH, class: "tfp__frame"}));
      const xl = svgEl("text", {x: left + plotW / 2, y: VIEW_H - 10, class: "tfp__axis-label", "text-anchor": "middle"});
      xl.textContent = "L, km";
      g.append(xl);
      const yl = svgEl("text", {x: 20, y: top + plotH / 2, class: "tfp__axis-label", "text-anchor": "middle", transform: `rotate(-90 20 ${top + plotH / 2})`});
      yl.textContent = `E, ${unitText()}`;
      g.append(yl);
      svg.append(g);

      // color bar inside the plot, on the right
      const barW = 18, barH = plotH * 0.6, barX = right - 118, barY = top + 44;
      const defs = svgEl("defs");
      const gradient = svgEl("linearGradient", {id: "tfp-grad-" + (root.dataset.tfpId || "0"), x1: 0, x2: 0, y1: 0, y2: 1});
      for (let i = 0; i <= 12; i += 1) {
        const t = 1 - i / 12;
        const rgb = symmetric ? divergingColor(2 * t - 1) : sequentialColor(t);
        gradient.append(svgEl("stop", {offset: `${100 * i / 12}%`, "stop-color": `rgb(${rgb.join(",")})`}));
      }
      defs.append(gradient);
      svg.append(defs);
      svg.append(svgEl("rect", {x: barX - 12, y: barY - 44, width: 124, height: barH + 60, rx: 8, class: "tfp__cbar-bg"}));
      svg.append(svgEl("rect", {x: barX, y: barY, width: barW, height: barH, fill: `url(#tfp-grad-${root.dataset.tfpId || "0"})`, stroke: "rgba(255,255,255,.45)"}));
      const cbarTicks = symmetric ? [range, 0, -range] : [range, range / 2, 0];
      cbarTicks.forEach(t => {
        const y = barY + (symmetric ? (1 - (t / range + 1) / 2) : 1 - t / range) * barH;
        const label = svgEl("text", {x: barX + barW + 8, y: y + 5, class: "tfp__tick"});
        label.textContent = formatNumber(t, 2).replace("-", "−");
        svg.append(label);
      });
      const title = svgEl("text", {x: barX - 4, y: barY - 18, class: "tfp__tick"});
      title.textContent = state.quantity === "P" ? (anti ? "P(ν̄)" : "P(ν)") : state.quantity === "CP" ? "P(ν)−P(ν̄)" : "P(NO)−P(IO)";
      svg.append(title);

      const mapMark = svgEl("circle", {r: 6, class: "tfp__map-mark", visibility: "hidden"});
      svg.append(mapMark);
      current = {kind: "map", a, b, anti, Elo, Ehi, Lhi, Llo, mapMark, evaluateCell, logFrac};
      tableHost.textContent = "No table for the map: use the P(E) and P(L) views.";
    }

    function showMapHover(px, py) {
      if (!current || current.kind !== "map") return;
      const {Elo, Ehi, Lhi, Llo, mapMark, evaluateCell, a, b} = current;
      const fxp = (px - PLOT.left) / plotW, fyp = (py - PLOT.top) / plotH;
      if (fxp < 0 || fxp > 1 || fyp < 0 || fyp > 1) { hideHover(); return; }
      const L = Llo + fxp * (Lhi - Llo);
      const E = Math.exp(Math.log(Ehi) - fyp * (Math.log(Ehi) - Math.log(Elo)));
      const v = evaluateCell(L, E);
      mapMark.setAttribute("cx", px);
      mapMark.setAttribute("cy", py);
      mapMark.setAttribute("visibility", "visible");
      tooltip.textContent = "";
      tooltip.append(el("div", {class: "tfp__tip-head", text: `L = ${formatNumber(L, 4)} km, E = ${formatNumber(E * unitFactor(), 4)} ${unitText()}`}));
      tooltip.append(el("div", {class: "tfp__tip-sub", text: `L/E = ${formatNumber(L / E, 4)} km/GeV`}));
      const row = el("div", {class: "tfp__tip-row"});
      row.append(el("strong", {text: formatNumber(v, 4).replace("-", "−")}));
      const label = el("span", {class: "tfp__tip-name"});
      if (state.quantity === "P") label.append(channelLabel(a, b, current.anti));
      else label.append(`${quantityLabel()} · ${FLAVORS[a]}→${FLAVORS[b]}`);
      row.append(label);
      tooltip.append(row);
      positionTooltip(px / VIEW_W, py / VIEW_H);
    }

    // -------------------------------------------------------------- table
    function updateTable(reqs, sets, xLo, xHi, log) {
      if (!tableBox.open) return;
      tableHost.textContent = "";
      if (!reqs.length) return;
      const table = el("table", {class: "tfp__table"});
      const head = el("tr", {}, [el("th", {text: state.view === "E" ? `E, ${unitText()}` : "L, km"})]);
      sets.forEach((set, s) => reqs.forEach(q => {
        const th = el("th");
        th.append(state.quantity === "P" ? channelLabel(q.a, q.b, q.kind.endsWith("nubar")) : `${FLAVORS[q.a]}→${FLAVORS[q.b]}`, ` · ${set.live ? set.ord : "pin " + set.pin.number}`);
        head.append(th);
      }));
      table.append(head);
      for (let i = 0; i <= 10; i += 1) {
        const x = fracToX(i / 10, xLo, xHi, log);
        const values = valuesAt(x, reqs, sets);
        const tr = el("tr", {}, [el("td", {text: formatNumber(state.view === "E" ? x * unitFactor() : x, 4)})]);
        values.forEach(row => row.forEach(v => tr.append(el("td", {text: formatNumber(v, 4).replace("-", "−")}))));
        table.append(tr);
      }
      tableHost.append(table);
    }

    // ------------------------------------------------------------- render
    let queued = false;
    function render() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        syncControls();
        if (isMap()) renderMap(); else renderLines();
        updateLegend(requests(), setsList());
        updateFoot();
        updatePythonCommand();
        if (state.lastHover && isMap()) showMapHover(state.lastHover.x, state.lastHover.y);
        stage.classList.toggle("is-map", isMap());
      });
    }

    // ------------------------------------------------------------- events
    root.addEventListener("click", event => {
      const target = event.target.closest("button");
      if (!target || !root.contains(target)) return;
      const d = target.dataset;
      if (d.view) {
        state.view = d.view;
        if (d.view === "map") {
          state.channels = state.channels.length ? [state.channels[0]] : ["1-0"];
          if (state.particles.nu && state.particles.nubar) state.particles.nubar = false;
          if (!state.particles.nu && !state.particles.nubar) state.particles.nu = true;
          if (state.scale === "lin") state.scale = "log";
          if (state.Emin <= 0) state.Emin = 0.1;
          if (state.Lmax <= 0) state.Lmax = 1300;
          if (state.quantity === "P") { /* stays */ }
        }
        if (d.view === "L" && state.Lmax <= state.Lmin) { state.Lmin = 0; state.Lmax = 1300; }
        hideHover();
        render();
      } else if (d.preset) {
        applyPreset(PRESETS.find(p => p.id === d.preset));
      } else if (d.ordering) {
        state.ordering = d.ordering;
        render();
      } else if (d.channel) {
        if (isMap()) state.channels = [d.channel];
        else if (state.channels.includes(d.channel)) state.channels = state.channels.filter(c => c !== d.channel);
        else state.channels = [...state.channels, d.channel];
        render();
      } else if (d.particle) {
        if (isMap()) {
          state.particles = {nu: d.particle === "nu", nubar: d.particle === "nubar"};
        } else {
          state.particles[d.particle] = !state.particles[d.particle];
        }
        render();
      } else if (d.quantity) {
        state.quantity = d.quantity;
        render();
      } else if (d.unit) {
        state.unit = d.unit;
        render();
      } else if (d.scale) {
        state.scale = d.scale;
        render();
      } else if (d.ymode) {
        state.yMode = d.ymode;
        render();
      } else if (d.pin) {
        pin(d.pin);
      }
    });

    function pin(kind) {
      if (kind === "clear") { state.pinned = []; render(); return; }
      if (state.pinned.length >= MAX_PINNED) return;
      let p = {...state.live}, ord = state.ordering;
      if (kind === "other-same") ord = ordOther(state.ordering);
      if (kind === "other-best") { ord = ordOther(state.ordering); p = {...BEST_FIT[ord]}; }
      state.pinCounter += 1;
      state.pinned.push({id: "pin" + state.pinCounter, number: state.pinCounter, p, ord});
      render();
    }

    copyButton.addEventListener("click", () => {
      const text = pythonCode.textContent;
      const done = () => { copyButton.textContent = "Copied"; setTimeout(() => { copyButton.textContent = "Copy"; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => {});
      else {
        const area = el("textarea", {}); area.value = text; document.body.append(area); area.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
        area.remove();
      }
    });
    bestFitButton.addEventListener("click", () => {
      state.live = {...BEST_FIT[state.ordering]};
      render();
    });
    tableBox.addEventListener("toggle", render);

    function applyPreset(preset) {
      state.view = preset.view;
      state.L = preset.L;
      state.Emin = preset.Emin; state.Emax = preset.Emax;
      state.unit = preset.unit;
      state.scale = preset.scale;
      state.channels = [...preset.channels];
      state.particles = {...preset.particles};
      state.quantity = preset.quantity;
      state.yMode = preset.yMode || "01";
      state.E = Math.sqrt(preset.Emin * preset.Emax);
      state.Lmin = 0; state.Lmax = Math.max(preset.L * 2, 100);
      hideHover();
      render();
    }

    PARAM_ROWS.forEach(row => {
      const {slider, number} = paramInputs[row.key];
      const apply = value => {
        if (!isFinite(value)) return;
        let v = value * row.unit;
        if (row.key === "delta") v = ((v % 360) + 360) % 360;
        if (["s12", "s13", "s23"].includes(row.key)) v = Math.min(1, Math.max(0, v));
        if (row.key === "dm21" || row.key === "dm3l") v = Math.abs(v);
        state.live[row.key] = v;
        render();
      };
      slider.addEventListener("input", () => apply(Number(slider.value)));
      number.addEventListener("input", () => apply(Number(number.value)));
      number.addEventListener("change", () => { number.blur(); render(); });
    });

    root.querySelectorAll("[data-field]").forEach(input => {
      input.addEventListener("input", () => {
        const value = Number(input.value);
        if (!isFinite(value) || input.value === "") return;
        const name = input.dataset.field;
        const f = unitFactor();
        if (name === "L" && value > 0) state.L = value;
        else if (name === "E" && value > 0) state.E = value / f;
        else if (name === "Emin" && value > 0) { state.Emin = value / f; if (state.Emin >= state.Emax) return; }
        else if (name === "Emax" && value > 0) { state.Emax = value / f; if (state.Emax <= state.Emin) return; }
        else if (name === "Lmin" && value >= 0) { state.Lmin = value; }
        else if (name === "Lmax" && value > 0) { state.Lmax = value; }
        if (state.Lmax <= state.Lmin) return;
        render();
      });
      input.addEventListener("change", () => { input.blur(); render(); });
    });

    // pointer and keyboard over the plot
    const toView = event => {
      const box = svg.getBoundingClientRect();
      return {x: (event.clientX - box.left) / box.width * VIEW_W, y: (event.clientY - box.top) / box.height * VIEW_H};
    };
    svg.addEventListener("pointermove", event => {
      const {x, y} = toView(event);
      if (isMap()) {
        state.lastHover = {x, y};
        showMapHover(x, y);
      } else {
        if (x < PLOT.left - 4 || x > VIEW_W - PLOT.right + 4) { hideHover(); return; }
        showLineHover((x - PLOT.left) / plotW, true);
      }
    });
    svg.addEventListener("pointerleave", hideHover);
    svg.addEventListener("keydown", event => {
      if (isMap()) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const delta = (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 0.05 : 0.01);
        showLineHover((state.hoverFraction === null ? 0.5 : state.hoverFraction) + delta, false);
        event.preventDefault();
        event.stopPropagation(); // do not change slides while the cursor is on the plot
      } else if (event.key === "Escape") { hideHover(); event.stopPropagation(); }
    });
    svg.addEventListener("blur", () => { /* keep the cursor: the reader may have chosen a point with the keys */ });

    root.dataset.tfpId = String(Math.floor(Math.random() * 1e9));
    // initial state: T2K-like example, P(ν_μ → ν_e) and P(ν̄_μ → ν̄_e)
    applyPreset(PRESETS[1]);
  }

  function initializeAll() {
    document.querySelectorAll("[data-tfp]").forEach(initialize);
  }
  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
