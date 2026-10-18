/*
 * Лекция 15. Три флэйвора в веществе постоянной плотности.
 *
 * Расчёт точный: H = U diag(0, Δm²21, Δm²31) U† / 2E + diag(V, 0, 0),
 * V = 7.63·10⁻¹⁴ эВ · ρ Y_e / (г/см³), Y_e = 0.5. Собственные числа
 * эрмитовой матрицы 3×3 находятся в тригонометрической форме, а элемент
 * exp(−iHL) — по формуле Сильвестра. Антинейтрино: U → U*, V → −V.
 * Матрица U = R23 U13(δ) R12, как в апплете вакуумных вероятностей.
 */
(function () {
  "use strict";

  const KM = 5.0677307e9;        // 1 км в эВ⁻¹
  const V_PER_RHO_YE = 7.63e-14; // эВ на 1 г/см³ электронной плотности
  const YE = 0.5;

  // NuFIT 6.1, IC24 + SK-atm; dm3l = |Δm²3ℓ| (NO: Δm²31, IO: Δm²32)
  const BEST_FIT = {
    NO: {s12: 0.3088, s13: 0.02248, s23: 0.470, delta: 212, dm21: 7.537e-5, dm3l: 2.511e-3},
    IO: {s12: 0.3088, s13: 0.02262, s23: 0.550, delta: 274, dm21: 7.537e-5, dm3l: 2.483e-3}
  };
  // Интерфейс сравнивает порядки при одних и тех же углах и |Δm²3ℓ| (лучшая
  // точка NO): порядок меняет только знак Δm²3ℓ, и вклад вещества виден в чистом виде.
  const PARAMS = BEST_FIT.NO;

  const PRESETS = {
    T2K: {L: 295, rho: 2.8, E: 0.6},
    NOvA: {L: 810, rho: 2.8, E: 1.9},
    DUNE: {L: 1300, rho: 2.8, E: 2.5},
    mantle: {L: 8000, rho: 4.4, E: 6.0}
  };

  /* ------------------------------------------------------------ физика */

  function pmns(p, deltaDeg, anti) {
    const t12 = Math.asin(Math.sqrt(p.s12));
    const t13 = Math.asin(Math.sqrt(p.s13));
    const t23 = Math.asin(Math.sqrt(p.s23));
    const s12 = Math.sin(t12), c12 = Math.cos(t12);
    const s13 = Math.sin(t13), c13 = Math.cos(t13);
    const s23 = Math.sin(t23), c23 = Math.cos(t23);
    const d = deltaDeg * Math.PI / 180;
    const cd = Math.cos(d), sd = (anti ? -1 : 1) * Math.sin(d);
    // re, im по строкам (e, μ, τ) и столбцам (1, 2, 3); U*: знак sin δ меняется
    const re = [
      c12 * c13, s12 * c13, s13 * cd,
      -s12 * c23 - c12 * s23 * s13 * cd, c12 * c23 - s12 * s23 * s13 * cd, s23 * c13,
      s12 * s23 - c12 * c23 * s13 * cd, -c12 * s23 - s12 * c23 * s13 * cd, c23 * c13
    ];
    const im = [
      0, 0, -s13 * sd,
      -c12 * s23 * s13 * sd, -s12 * s23 * s13 * sd, 0,
      -c12 * c23 * s13 * sd, -s12 * c23 * s13 * sd, 0
    ];
    return {re, im};
  }

  function massSquared(p, ordering) {
    return [0, p.dm21, ordering === "NO" ? p.dm3l : p.dm21 - p.dm3l];
  }

  /* Гамильтониан в км⁻¹ без следа: возвращает re, im (3×3 по строкам). */
  function hamiltonian(p, ordering, deltaDeg, E_GeV, rho, anti) {
    const U = pmns(p, deltaDeg, anti);
    const m2 = massSquared(p, ordering);
    const k = KM / (2 * E_GeV * 1e9);
    const re = new Array(9).fill(0), im = new Array(9).fill(0);
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        let r = 0, i = 0;
        for (let j = 0; j < 3; j++) {
          // U_aj m_j² conj(U_bj)
          const ur = U.re[3 * a + j], ui = U.im[3 * a + j];
          const vr = U.re[3 * b + j], vi = -U.im[3 * b + j];
          r += m2[j] * (ur * vr - ui * vi);
          i += m2[j] * (ur * vi + ui * vr);
        }
        re[3 * a + b] = k * r;
        im[3 * a + b] = k * i;
      }
    }
    re[0] += (anti ? -1 : 1) * V_PER_RHO_YE * rho * YE * KM;
    const q = (re[0] + re[4] + re[8]) / 3;
    re[0] -= q; re[4] -= q; re[8] -= q;
    return {re, im};
  }

  /* Собственные числа эрмитовой матрицы без следа. */
  function eigenvalues(H) {
    const {re, im} = H;
    const a = re[0], b = re[4], c = re[8];
    const x01 = re[1] * re[1] + im[1] * im[1];
    const x02 = re[2] * re[2] + im[2] * im[2];
    const x12 = re[5] * re[5] + im[5] * im[5];
    const p2 = a * a + b * b + c * c + 2 * (x01 + x02 + x12);
    const p = Math.sqrt(p2 / 6);
    if (p === 0) return [0, 0, 0];
    // Re(H01 H12 H20), H20 = conj(H02)
    const tr = re[1] * re[5] - im[1] * im[5], ti = re[1] * im[5] + im[1] * re[5];
    const triple = tr * re[2] + ti * im[2];
    const det = a * b * c + 2 * triple - a * x12 - b * x02 - c * x01;
    const r = Math.max(-1, Math.min(1, det / (2 * p * p * p)));
    const phi = Math.acos(r) / 3;
    const l0 = 2 * p * Math.cos(phi);
    const l2 = 2 * p * Math.cos(phi + 2 * Math.PI / 3);
    return [l0, -l0 - l2, l2];
  }

  /* |[exp(−iHL)]_{βα}|² по формуле Сильвестра. */
  function transition(H, alpha, beta, L_km) {
    const lam = eigenvalues(H);
    const {re, im} = H;
    const hb = 3 * beta;
    // (H²)_{βα}
    let h2r = 0, h2i = 0;
    for (let m = 0; m < 3; m++) {
      const ar = re[hb + m], ai = im[hb + m];
      const br = re[3 * m + alpha], bi = im[3 * m + alpha];
      h2r += ar * br - ai * bi;
      h2i += ar * bi + ai * br;
    }
    const hr = re[hb + alpha], hi = im[hb + alpha];
    const id = alpha === beta ? 1 : 0;
    let sr = 0, si = 0;
    for (let k = 0; k < 3; k++) {
      const i = (k + 1) % 3, j = (k + 2) % 3;
      const den = (lam[k] - lam[i]) * (lam[k] - lam[j]);
      const nr = (h2r - (lam[i] + lam[j]) * hr + lam[i] * lam[j] * id) / den;
      const ni = (h2i - (lam[i] + lam[j]) * hi) / den;
      const ph = -lam[k] * L_km;
      const cr = Math.cos(ph), ci = Math.sin(ph);
      sr += nr * cr - ni * ci;
      si += nr * ci + ni * cr;
    }
    return sr * sr + si * si;
  }

  /* P(ν_μ → ν_e) или P(ν̄_μ → ν̄_e). */
  function probMuE(p, ordering, deltaDeg, E_GeV, L_km, rho, anti) {
    return transition(hamiltonian(p, ordering, deltaDeg, E_GeV, rho, anti), 1, 0, L_km);
  }

  function probability(alpha, beta, p, ordering, deltaDeg, E_GeV, L_km, rho, anti) {
    return transition(hamiltonian(p, ordering, deltaDeg, E_GeV, rho, anti), alpha, beta, L_km);
  }

  const core = {BEST_FIT, PARAMS, PRESETS, pmns, hamiltonian, eigenvalues, probability, probMuE};
  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
    return;
  }
  window.Lecture15Core = core;

  /* ------------------------------------------------------------ интерфейс */

  const SVG = "http://www.w3.org/2000/svg";

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
    (children || []).forEach((c) => node.append(c));
    return node;
  }

  function svgEl(tag, attrs) {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    return node;
  }

  function fmt(x, digits) {
    return x.toFixed(digits).replace("-", "−");
  }

  function niceTicks(lo, hi, count) {
    const raw = (hi - lo) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    const out = [];
    for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9 * step; t += step) out.push(+t.toPrecision(12));
    return out;
  }

  function slider(key, label, min, max, step, value, unit) {
    const out = el("output", {"data-out": key});
    const input = el("input", {type: "range", min, max, step, value, "data-control": key, "aria-label": label.replace(/<[^>]+>/g, "")});
    const lab = el("label", {}, [
      el("span", {class: "m3-name", html: label}),
      el("span", {class: "m3-value"}, [out, unit ? " " + unit : ""]),
      input
    ]);
    return {lab, input, out};
  }

  function build(root) {
    const state = {ordering: "NO", delta: 212, rho: 2.8, L: 1300, E: 2.5};

    const presetRow = el("div", {class: "m3-buttons", role: "group", "aria-label": "Базы"});
    const presetNames = {T2K: "T2K", NOvA: "NOvA", DUNE: "DUNE", mantle: "8000 км"};
    Object.keys(PRESETS).forEach((k) => {
      presetRow.append(el("button", {type: "button", "data-preset": k, text: presetNames[k]}));
    });
    const orderRow = el("div", {class: "m3-buttons m3-order", role: "group", "aria-label": "Порядок масс"}, [
      el("button", {type: "button", "data-ordering": "NO", text: "нормальный"}),
      el("button", {type: "button", "data-ordering": "IO", text: "обратный"})
    ]);

    const sDelta = slider("delta", "δ<sub>CP</sub>", 0, 360, 1, state.delta, "°");
    const sRho = slider("rho", "плотность ρ", 0, 13, 0.1, state.rho, "г/см³");
    const sL = slider("L", "база L", 100, 12700, 5, state.L, "км");
    const sE = slider("E", "энергия E", -1, Math.log10(20), 0.005, Math.log10(state.E), "ГэВ");

    const controls = el("div", {class: "m3-controls"}, [
      el("div", {class: "m3-group-title", text: "база и плотность"}), presetRow,
      el("div", {class: "m3-group-title", text: "порядок масс"}), orderRow,
      sDelta.lab, sRho.lab, sL.lab, sE.lab,
      el("p", {class: "m3-note", html: "Y<sub>e</sub> = 0.5. Углы и |Δm²<sub>3ℓ</sub>| из NuFIT 6.1 (NO); порядок меняет только знак Δm²<sub>3ℓ</sub>"})
    ]);

    const read = (key, label, cls) => el("div", {class: cls || ""}, [el("span", {html: label}), el("b", {"data-val": key, text: "—"})]);
    const readouts = el("div", {class: "m3-readouts", "aria-live": "polite"}, [
      read("P", "P(ν<sub>μ</sub>→ν<sub>e</sub>)", "nu"),
      read("Pb", "P(ν̄<sub>μ</sub>→ν̄<sub>e</sub>)", "nubar"),
      read("A", "𝒜<sub>CP</sub> в веществе"),
      read("Av", "𝒜<sub>CP</sub> в вакууме")
    ]);

    const svgP = svgEl("svg", {viewBox: "0 0 640 400", role: "img", "aria-label": "Вероятности появления электронных нейтрино и антинейтрино как функции энергии"});
    const svgB = svgEl("svg", {viewBox: "0 0 420 400", role: "img", "aria-label": "Биграмма: вероятность для нейтрино против вероятности для антинейтрино при всех значениях фазы"});
    const plots = el("div", {class: "m3-plots"}, [
      el("figure", {}, [svgP, el("figcaption", {html: "сплошные: вещество; штрихи: вакуум; <span class='m3-c-nu'>ν</span> и <span class='m3-c-nubar'>ν̄</span>"})]),
      el("figure", {}, [svgB, el("figcaption", {html: "δ<sub>CP</sub> от 0 до 360° при выбранной E: <span class='m3-c-no'>нормальный</span> и <span class='m3-c-io'>обратный</span> порядок"})])
    ]);

    root.replaceChildren(controls, readouts, plots);

    function sync() {
      sDelta.input.value = state.delta;
      sRho.input.value = state.rho;
      sL.input.value = state.L;
      sE.input.value = Math.log10(state.E);
      sDelta.out.textContent = Math.round(state.delta);
      sRho.out.textContent = state.rho.toFixed(1);
      sL.out.textContent = Math.round(state.L);
      sE.out.textContent = state.E < 1 ? state.E.toFixed(2) : state.E.toFixed(1);
      root.querySelectorAll("[data-ordering]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ordering === state.ordering)));
      root.querySelectorAll("[data-preset]").forEach((b) => {
        const pr = PRESETS[b.dataset.preset];
        b.setAttribute("aria-pressed", String(pr.L === state.L && pr.rho === state.rho));
      });
    }

    function draw() {
      sync();
      const p = PARAMS;
      const P = probMuE(p, state.ordering, state.delta, state.E, state.L, state.rho, false);
      const Pb = probMuE(p, state.ordering, state.delta, state.E, state.L, state.rho, true);
      const Pv = probMuE(p, state.ordering, state.delta, state.E, state.L, 0, false);
      const Pbv = probMuE(p, state.ordering, state.delta, state.E, state.L, 0, true);
      const val = (k, x) => { root.querySelector(`[data-val="${k}"]`).textContent = x; };
      val("P", fmt(P, 3));
      val("Pb", fmt(Pb, 3));
      val("A", fmt((P - Pb) / (P + Pb), 2));
      val("Av", fmt((Pv - Pbv) / (Pv + Pbv), 2));
      drawSpectrum(p);
      drawBigram();
    }

    function axes(svg, box, xr, yr, xlabel, ylabel, xticks, yticks, xfmt, yfmt) {
      const [x0, y0, w, h] = box;
      const sx = (x) => x0 + (x - xr[0]) / (xr[1] - xr[0]) * w;
      const sy = (y) => y0 + h - (y - yr[0]) / (yr[1] - yr[0]) * h;
      svg.append(svgEl("rect", {x: x0, y: y0, width: w, height: h, class: "m3-frame"}));
      xticks.forEach((t) => {
        svg.append(svgEl("line", {x1: sx(t), x2: sx(t), y1: y0, y2: y0 + h, class: "m3-grid"}));
        const tx = svgEl("text", {x: sx(t), y: y0 + h + 22, class: "m3-tick", "text-anchor": "middle"});
        tx.textContent = xfmt(t);
        svg.append(tx);
      });
      yticks.forEach((t) => {
        svg.append(svgEl("line", {x1: x0, x2: x0 + w, y1: sy(t), y2: sy(t), class: "m3-grid"}));
        const ty = svgEl("text", {x: x0 - 8, y: sy(t) + 6, class: "m3-tick", "text-anchor": "end"});
        ty.textContent = yfmt(t);
        svg.append(ty);
      });
      const xl = svgEl("text", {x: x0 + w, y: y0 + h + 48, class: "m3-axis", "text-anchor": "end"});
      xl.innerHTML = xlabel;
      const yl = svgEl("text", {x: x0, y: y0 - 12, class: "m3-axis", "text-anchor": "start"});
      yl.innerHTML = ylabel;
      svg.append(xl, yl);
      return {sx, sy};
    }

    function path(points, sx, sy, cls) {
      const d = points.map(([x, y], i) => (i ? "L" : "M") + sx(x).toFixed(1) + " " + sy(y).toFixed(1)).join("");
      return svgEl("path", {d, class: cls});
    }

    function drawSpectrum(p) {
      svgP.replaceChildren();
      // первый максимум вакуумной вероятности: Δ31 = π/2
      const E1 = 1.26693 * p.dm3l * state.L / (Math.PI / 2);
      const xr = [0, Math.max(3 * E1, state.E * 1.15)];
      const n = 320;
      const curves = {nu: [], nubar: [], nuv: [], nubarv: []};
      let ymax = 0.02;
      for (let i = 1; i <= n; i++) {
        const E = xr[1] * (0.04 + 0.96 * i / n);
        const a = probMuE(p, state.ordering, state.delta, E, state.L, state.rho, false);
        const b = probMuE(p, state.ordering, state.delta, E, state.L, state.rho, true);
        const c = probMuE(p, state.ordering, state.delta, E, state.L, 0, false);
        const d = probMuE(p, state.ordering, state.delta, E, state.L, 0, true);
        curves.nu.push([E, a]); curves.nubar.push([E, b]); curves.nuv.push([E, c]); curves.nubarv.push([E, d]);
        if (E > 0.35 * E1) ymax = Math.max(ymax, a, b, c, d);
      }
      const yr = [0, Math.min(1, ymax * 1.12)];
      const box = [72, 34, 548, 296];
      const xt = niceTicks(xr[0], xr[1], 6), yt = niceTicks(yr[0], yr[1], 5);
      const {sx, sy} = axes(svgP, box, xr, yr, "E, ГэВ", "P(ν<tspan baseline-shift='sub' font-size='70%'>μ</tspan>→ν<tspan baseline-shift='sub' font-size='70%'>e</tspan>)",
        xt, yt, (t) => String(+t.toFixed(2)), (t) => String(+t.toFixed(3)));
      const clip = svgEl("clipPath", {id: "m3-clip-" + uid});
      clip.append(svgEl("rect", {x: box[0], y: box[1], width: box[2], height: box[3]}));
      svgP.append(clip);
      const g = svgEl("g", {"clip-path": `url(#m3-clip-${uid})`});
      g.append(path(curves.nuv, sx, sy, "m3-line m3-nu m3-vac"), path(curves.nubarv, sx, sy, "m3-line m3-nubar m3-vac"),
        path(curves.nu, sx, sy, "m3-line m3-nu"), path(curves.nubar, sx, sy, "m3-line m3-nubar"));
      if (state.E <= xr[1]) g.append(svgEl("line", {x1: sx(state.E), x2: sx(state.E), y1: box[1], y2: box[1] + box[3], class: "m3-marker"}));
      svgP.append(g);
    }

    function drawBigram() {
      svgB.replaceChildren();
      const ells = {};
      let pmax = 0.01;
      ["NO", "IO"].forEach((ord) => {
        const p = PARAMS;
        const pts = [];
        for (let d = 0; d <= 360; d += 5) {
          const a = probMuE(p, ord, d, state.E, state.L, state.rho, false);
          const b = probMuE(p, ord, d, state.E, state.L, state.rho, true);
          pts.push([a, b]);
          pmax = Math.max(pmax, a, b);
        }
        ells[ord] = pts;
      });
      const top = pmax * 1.12;
      const box = [72, 34, 316, 296];
      const t = niceTicks(0, top, 4);
      const {sx, sy} = axes(svgB, box, [0, top], [0, top], "P(ν<tspan baseline-shift='sub' font-size='70%'>μ</tspan>→ν<tspan baseline-shift='sub' font-size='70%'>e</tspan>)",
        "P(ν̄<tspan baseline-shift='sub' font-size='70%'>μ</tspan>→ν̄<tspan baseline-shift='sub' font-size='70%'>e</tspan>)", t, t, (x) => String(+x.toFixed(3)), (x) => String(+x.toFixed(3)));
      svgB.append(svgEl("line", {x1: sx(0), y1: sy(0), x2: sx(top), y2: sy(top), class: "m3-diag"}));
      ["NO", "IO"].forEach((ord) => {
        svgB.append(path(ells[ord], sx, sy, "m3-line m3-ell m3-" + ord.toLowerCase()));
        [0, 90, 180, 270].forEach((d) => {
          const [a, b] = ells[ord][d / 5];
          svgB.append(svgEl("circle", {cx: sx(a), cy: sy(b), r: 3.2, class: "m3-tickdot m3-" + ord.toLowerCase()}));
          // 0° и 180° на узком эллипсе почти совпадают: подписываем крайние точки 90° и 270°
          if (ord === state.ordering && (d === 90 || d === 270)) {
            const lab = svgEl("text", {x: sx(a) + 7, y: sy(b) - 6, class: "m3-dlabel"});
            lab.textContent = d + "°";
            svgB.append(lab);
          }
        });
      });
      const p = PARAMS;
      const a = probMuE(p, state.ordering, state.delta, state.E, state.L, state.rho, false);
      const b = probMuE(p, state.ordering, state.delta, state.E, state.L, state.rho, true);
      svgB.append(svgEl("circle", {cx: sx(a), cy: sy(b), r: 7, class: "m3-current m3-" + state.ordering.toLowerCase()}));
      const lab = svgEl("text", {x: box[0] + box[2] - 6, y: box[1] + 22, class: "m3-tick", "text-anchor": "end"});
      lab.textContent = "P = P̄";
      svgB.append(lab);
    }

    const uid = Math.random().toString(36).slice(2, 8);
    let pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; draw(); });
    }

    sDelta.input.addEventListener("input", () => { state.delta = +sDelta.input.value; schedule(); });
    sRho.input.addEventListener("input", () => { state.rho = +sRho.input.value; schedule(); });
    sL.input.addEventListener("input", () => { state.L = +sL.input.value; schedule(); });
    sE.input.addEventListener("input", () => { state.E = Math.pow(10, +sE.input.value); schedule(); });
    root.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      if (b.dataset.preset) Object.assign(state, PRESETS[b.dataset.preset]);
      if (b.dataset.ordering) state.ordering = b.dataset.ordering;
      schedule();
    });
    // клавиши слайдов не должны листать презентацию, пока фокус на ползунке
    root.addEventListener("keydown", (ev) => { if (ev.target.matches("input")) ev.stopPropagation(); });

    draw();
  }

  function init() {
    document.querySelectorAll("[data-m3-lab]").forEach((root) => {
      if (!root.dataset.ready) {
        root.dataset.ready = "1";
        build(root);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
