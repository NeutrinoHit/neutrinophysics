/* Three widgets on the EarthOsc engine (earth_explorer.js, checked against assets/oscillations/osc.py):
   - [data-baseline-lab]     long-baseline nu_mu -> nu_e through the Earth's crust/mantle, mass ordering and delta_CP;
   - [data-flavor-path]      animation of the flavor content along a chord through the PREM Earth;
   - [data-oscillogram-lab]  oscillogram of a modified Earth (core Y_e, core density, no core) and its difference from PREM. */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  const O = window.EarthOsc;
  if (!O) return;

  const SVGNS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => Math.pow(10, Math.log10(a) + (i / (n - 1)) * (Math.log10(b) - Math.log10(a))));
  const fmtKm = (L) => Math.round(L).toLocaleString("en-US").replace(/,/g, " ") + " km";
  const PHASE = 1 / (4 * 1e9 * 197.3269804e6 * 1e-15 * 1e-3);       // 1.267 eV^-2 GeV km^-1
  const FLAVOR_COLORS = ["#ff8a5c", "#73c7ff", "#7ee2ae"];
  const FLAVOR_NAMES = ["e", "μ", "τ"];

  function labelNu(parent, x, y, cls, flavorText, anti, extra) {
    const t = el("text", { x, y, class: cls }, parent);
    const add = (s, sub) => { const n = el("tspan", sub ? { "baseline-shift": "sub", "font-size": "0.75em" } : {}, t); n.textContent = s; };
    add((extra || "") + (anti ? "ν̄" : "ν")); add(flavorText, true);
    return t;
  }

  function axes(svg, W, H, m, xs, ys, xTicks, yTicks, xLabel, yLabel) {
    for (const v of xTicks) {
      el("line", { x1: xs(v), x2: xs(v), y1: m.t, y2: H - m.b, class: "ew-grid" }, svg);
      el("text", { x: xs(v), y: H - m.b + 24, class: "ew-tick" }, svg).textContent = String(v);
    }
    for (const v of yTicks) {
      el("line", { x1: m.l, x2: W - m.r, y1: ys(v), y2: ys(v), class: "ew-grid" }, svg);
      el("text", { x: m.l - 8, y: ys(v) + 6, class: "ew-tick ew-tick-y" }, svg).textContent = String(v);
    }
    el("text", { x: (m.l + W - m.r) / 2, y: H - 6, class: "ew-axis" }, svg).textContent = xLabel;
    if (yLabel) el("text", { x: 16, y: (m.t + H - m.b) / 2, class: "ew-axis", transform: `rotate(-90 16 ${(m.t + H - m.b) / 2})` }, svg).textContent = yLabel;
  }

  /* ---------------------------------------------------------------- baseline lab */
  function initBaseline(box) {
    const q = (s) => box.querySelector(s);
    const ctl = { L: q('[data-control="L"]'), delta: q('[data-control="delta"]'), ordering: q('[data-control="ordering"]'), matter: q('[data-control="matter"]') };
    const out = { L: q('[data-out="L"]'), delta: q('[data-out="delta"]'), depth: q('[data-out="depth"]'), rho: q('[data-out="rho"]'), E1: q('[data-out="E1"]'), A: q('[data-out="A"]') };
    const svg = q('[data-plot="baseline"]');
    const W = 900, H = 470, m = { l: 70, r: 20, t: 20, b: 56 };
    const E = logspace(0.2, 10, 150);
    const xs = (e) => m.l + (Math.log10(e / 0.2) / Math.log10(50)) * (W - m.l - m.r);
    let yMax = 0.2;
    const ys = (P) => H - m.b - (P / yMax) * (H - m.t - m.b);
    const grid = el("g", {}, svg);
    const pv = el("path", { class: "bl-vac" }, svg), pva = el("path", { class: "bl-vac bl-anti" }, svg);
    const pn = el("path", { class: "bl-nu" }, svg), pa = el("path", { class: "bl-antinu" }, svg);
    const leg = el("g", {}, svg);
    function legend(y, cls, anti, prefix) {
      const t = el("text", { x: W - m.r - 260, y, class: "bl-leg " + cls }, leg), nu = anti ? "ν̄" : "ν";
      const add = (txt, sub) => { const n = el("tspan", sub ? { "baseline-shift": "sub", "font-size": "0.75em" } : {}, t); n.textContent = txt; };
      add(prefix + nu); add("μ", true); add(" → " + nu); add("e", true);
      return t;
    }
    legend(m.t + 30, "bl-leg-nu", false, "—— ");
    legend(m.t + 60, "bl-leg-anti", true, "– – ");
    const l3 = el("text", { x: W - m.r - 260, y: m.t + 90, class: "bl-leg bl-leg-vac" }, leg); l3.textContent = "····  same in vacuum";
    const marker = el("line", { class: "bl-marker" }, svg);

    function path(arr) { return arr.map((P, i) => `${i ? "L" : "M"}${xs(E[i]).toFixed(1)},${ys(Math.min(P, yMax)).toFixed(1)}`).join(""); }
    let pending = false;
    function update() {
      pending = false;
      const L = parseFloat(ctl.L.value), delta = parseFloat(ctl.delta.value);
      const p = Object.assign({}, O.NUFIT61[ctl.ordering.value], { delta });
      const cosz = -L / (2 * O.R_EARTH);
      const layers = O.pathLayers(cosz, 30, O.YE_CORE, O.YE_MANTLE, { land: true });
      const matter = ctl.matter.checked;
      const vac = [[L, 0]];
      const use = matter ? layers : vac;
      const nu = E.map((e) => O.probabilityMatrix(e, use, p, false)[1][0]);
      const an = E.map((e) => O.probabilityMatrix(e, use, p, true)[1][0]);
      const nuV = matter ? E.map((e) => O.probabilityMatrix(e, vac, p, false)[1][0]) : null;
      const anV = matter ? E.map((e) => O.probabilityMatrix(e, vac, p, true)[1][0]) : null;
      const mx = Math.max(...nu, ...an, ...(nuV || []), ...(anV || []));
      const newMax = mx < 0.09 ? 0.1 : mx < 0.18 ? 0.2 : mx < 0.28 ? 0.3 : 0.5;
      if (newMax !== yMax || !grid.firstChild) {
        yMax = newMax;
        while (grid.firstChild) grid.removeChild(grid.firstChild);
        const yt = []; for (let v = 0; v <= yMax + 1e-9; v += yMax / 5) yt.push(+v.toFixed(2));
        axes(grid, W, H, m, xs, ys, [0.2, 0.5, 1, 2, 5, 10], yt, "neutrino energy E [GeV]", "appearance probability");
      }
      pn.setAttribute("d", path(nu)); pa.setAttribute("d", path(an));
      pv.setAttribute("d", nuV ? path(nuV) : ""); pva.setAttribute("d", anV ? path(anV) : "");
      l3.style.display = matter ? "" : "none";
      // readouts
      const dm31 = Math.abs(p.dm31), E1 = PHASE * dm31 * L / (Math.PI / 2);
      let sumV = 0, sumL = 0; for (const [dl, v] of layers) { sumV += v * dl; sumL += dl; }
      const yr = sumV / sumL / O.V_PER_YE_RHO;
      out.L.textContent = fmtKm(L); out.delta.textContent = `${Math.round(delta)}°`;
      out.depth.textContent = fmtKm(O.R_EARTH * (1 - Math.sqrt(1 - cosz * cosz)));
      out.rho.textContent = `${yr.toFixed(2)} g/cm³`;
      out.E1.textContent = `${E1.toFixed(2)} GeV`;
      out.A.textContent = (2 * E1 * 1e9 * yr * O.V_PER_YE_RHO / dm31).toFixed(2);
      const x1 = xs(Math.min(Math.max(E1, 0.2), 10));
      marker.setAttribute("x1", x1); marker.setAttribute("x2", x1); marker.setAttribute("y1", m.t); marker.setAttribute("y2", H - m.b);
    }
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
    Object.values(ctl).forEach((c) => c.addEventListener("input", schedule));
    box.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => { ctl.L.value = b.getAttribute("data-preset"); schedule(); }));
    update();
  }

  /* ---------------------------------------------------------------- flavor along the path */
  function initFlavorPath(box) {
    const q = (s) => box.querySelector(s);
    const ctl = { cosz: q('[data-control="cosz"]'), logE: q('[data-control="logE"]'), start: q('[data-control="start"]') };
    const out = { cosz: q('[data-out="cosz"]'), E: q('[data-out="E"]'), L: q('[data-out="L"]') };
    const playBtn = q('[data-action="play"]');
    const earth = q('[data-plot="earth"]'), prof = q('[data-plot="profile"]');
    // Earth
    const sc = 175 / O.R_EARTH, cx = 200, cy = 210;
    el("circle", { cx, cy, r: O.R_EARTH * sc, class: "ee-mantle" }, earth);
    el("circle", { cx, cy, r: O.R_CORE * sc, class: "ee-outer" }, earth);
    el("circle", { cx, cy, r: O.R_INNER * sc, class: "ee-inner" }, earth);
    const chord = el("line", { class: "fp-chord" }, earth);
    const done = el("line", { class: "fp-done" }, earth);
    const dot = el("circle", { r: 9, class: "fp-dot" }, earth);
    el("circle", { cx, cy: cy - O.R_EARTH * sc, r: 8, class: "ee-det" }, earth);
    el("text", { x: cx + 14, y: cy - O.R_EARTH * sc - 8, class: "ee-label ee-det-label" }, earth).textContent = "detector";
    // composition bar
    const barY = 410, barX = 40, barW = 320;
    const bars = [0, 1, 2].map((k) => el("rect", { y: barY, height: 22, fill: FLAVOR_COLORS[k] }, earth));
    [0, 1, 2].forEach((k) => labelNu(earth, barX + 20 + k * 110, barY + 52, "fp-bar-label", FLAVOR_NAMES[k], false).setAttribute("fill", FLAVOR_COLORS[k]));
    // profile + probabilities
    const W = 820, H = 480, m = { l: 70, r: 18, t: 14, b: 50 }, split = 150;
    const xs = (s, L) => m.l + (s / L) * (W - m.l - m.r);
    const yP = (P) => H - m.b - P * (H - m.b - split - 30);
    const yD = (d) => split - d / 6.5 * (split - m.t);
    const gridG = el("g", {}, prof);
    const densPath = el("path", { class: "fp-density" }, prof);
    const probPaths = [0, 1, 2].map((k) => el("path", { class: "fp-prob", stroke: FLAVOR_COLORS[k] }, prof));
    const cursor = el("line", { class: "fp-cursor" }, prof);
    el("text", { x: m.l + 6, y: m.t + 18, class: "fp-panel" }, prof).textContent = "Yₑρ along the path [g/cm³]";
    el("text", { x: m.l + 6, y: split + 48, class: "fp-panel" }, prof).textContent = "flavor probabilities";

    let data = null, t0 = null, playing = false, frac = 1, raf = null;
    const DURATION = 9000;

    function compute() {
      const cosz = parseFloat(ctl.cosz.value), E = Math.pow(10, parseFloat(ctl.logE.value));
      const a0 = ctl.start.value === "e" ? 0 : 1;
      const layers = O.pathLayers(cosz, 300, O.YE_CORE, O.YE_MANTLE);
      const probs = O.evolve(E, layers, O.NUFIT61.NO, false, a0);
      const s = []; let acc = 0; for (const [dl] of layers) { s.push(acc + dl / 2); acc += dl; }
      const yr = layers.map(([, v]) => v / O.V_PER_YE_RHO);
      data = { cosz, E, L: acc, s, yr, probs };
      out.cosz.textContent = cosz.toFixed(2); out.E.textContent = `${E.toFixed(1)} GeV`; out.L.textContent = fmtKm(acc);
      while (gridG.firstChild) gridG.removeChild(gridG.firstChild);
      const step = acc > 8000 ? 2000 : acc > 3000 ? 1000 : 500;
      for (let v = 0; v <= acc + 1; v += step) {
        el("line", { x1: xs(v, acc), x2: xs(v, acc), y1: m.t, y2: H - m.b, class: "ew-grid" }, gridG);
        el("text", { x: xs(v, acc), y: H - m.b + 22, class: "ew-tick" }, gridG).textContent = String(v);
      }
      for (const P of [0, 0.5, 1]) {
        el("line", { x1: m.l, x2: W - m.r, y1: yP(P), y2: yP(P), class: "ew-grid" }, gridG);
        el("text", { x: m.l - 8, y: yP(P) + 6, class: "ew-tick ew-tick-y" }, gridG).textContent = P.toFixed(1);
      }
      for (const d of [0, 3, 6]) el("text", { x: m.l - 8, y: yD(d) + 6, class: "ew-tick ew-tick-y" }, gridG).textContent = String(d);
      el("text", { x: (m.l + W - m.r) / 2, y: H - 4, class: "ew-axis" }, gridG).textContent = "distance travelled [km]";
      densPath.setAttribute("d", s.map((x, i) => `${i ? "L" : "M"}${xs(x, acc).toFixed(1)},${yD(yr[i]).toFixed(1)}`).join(""));
      // chord
      const th = Math.acos(cosz), x0 = cx, y0 = cy - O.R_EARTH * sc;
      data.p0 = [x0 + Math.sin(th) * acc * sc, y0 - Math.cos(th) * acc * sc];   // source
      data.p1 = [x0, y0];                                                       // detector
      chord.setAttribute("x1", data.p0[0]); chord.setAttribute("y1", data.p0[1]); chord.setAttribute("x2", x0); chord.setAttribute("y2", y0);
      draw(frac);
    }

    function draw(f) {
      if (!data) return;
      const n = Math.max(1, Math.round(f * data.s.length));
      for (let k = 0; k < 3; k++)
        probPaths[k].setAttribute("d", data.s.slice(0, n).map((x, i) => `${i ? "L" : "M"}${xs(x, data.L).toFixed(1)},${yP(data.probs[i][k]).toFixed(1)}`).join(""));
      const x = xs(data.s[n - 1], data.L);
      cursor.setAttribute("x1", x); cursor.setAttribute("x2", x); cursor.setAttribute("y1", m.t); cursor.setAttribute("y2", H - m.b);
      const px = data.p0[0] + (data.p1[0] - data.p0[0]) * f, py = data.p0[1] + (data.p1[1] - data.p0[1]) * f;
      dot.setAttribute("cx", px); dot.setAttribute("cy", py);
      done.setAttribute("x1", data.p0[0]); done.setAttribute("y1", data.p0[1]); done.setAttribute("x2", px); done.setAttribute("y2", py);
      const P = data.probs[n - 1]; let x0 = barX;
      for (let k = 0; k < 3; k++) { const w = P[k] * barW; bars[k].setAttribute("x", x0); bars[k].setAttribute("width", Math.max(w, 0)); x0 += w; }
    }

    function tick(ts) {
      if (!playing) return;
      if (t0 === null) t0 = ts - frac * DURATION;
      frac = Math.min((ts - t0) / DURATION, 1);
      draw(frac);
      if (frac >= 1) { playing = false; playBtn.textContent = "▶ replay"; return; }
      raf = requestAnimationFrame(tick);
    }
    playBtn.addEventListener("click", () => {
      if (playing) { playing = false; playBtn.textContent = "▶ play"; cancelAnimationFrame(raf); return; }
      if (frac >= 1) frac = 0;
      playing = true; t0 = null; playBtn.textContent = "❚❚ pause"; raf = requestAnimationFrame(tick);
    });
    let pending = false;
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; frac = 1; compute(); }); } };
    Object.values(ctl).forEach((c) => c.addEventListener("input", schedule));
    compute();
  }

  /* ---------------------------------------------------------------- oscillogram lab */
  const SEQ = [[0.004, 0.008, 0.020], [0.05, 0.12, 0.30], [0.12, 0.42, 0.75], [0.45, 0.88, 1.00], [1.0, 0.82, 0.40], [1.0, 0.98, 0.90]];
  const DIV = [[1.0, 0.54, 0.36], [0.23, 0.12, 0.09], [0, 0, 0], [0.07, 0.23, 0.35], [0.45, 0.78, 1.0]];
  function cmap(stops, t) {
    t = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
    const i = Math.min(Math.floor(t), stops.length - 2), f = t - i, a = stops[i], b = stops[i + 1];
    return [0, 1, 2].map((k) => Math.round(255 * (a[k] + f * (b[k] - a[k]))));
  }

  function initOscillogramLab(box) {
    const q = (s) => box.querySelector(s);
    const ctl = { ye: q('[data-control="ye"]'), scale: q('[data-control="scale"]'), nocore: q('[data-control="nocore"]'), channel: q('[data-control="channel"]') };
    const out = { ye: q('[data-out="ye"]'), scale: q('[data-out="scale"]'), status: q('[data-out="status"]'), dmax: q('[data-out="dmax"]') };
    const btn = q('[data-action="compute"]');
    const cMap = q('[data-plot="map"]'), cDiff = q('[data-plot="diff"]');
    const E = logspace(1, 20, 90), Z = Array.from({ length: 64 }, (_, i) => -1 + i * (0.8 / 63));   // cos(theta_z) from -1 to -0.2
    const cache = {};
    let job = 0;
    out.ye.textContent = parseFloat(ctl.ye.value).toFixed(3);
    out.scale.textContent = parseFloat(ctl.scale.value).toFixed(2);

    function grid(opts, chan, cb, progress) {
      const [a, b] = chan === "mu-mu" ? [1, 1] : [1, 0];
      const res = new Float32Array(E.length * Z.length);
      const my = ++job;
      let j = 0;
      function row() {
        if (my !== job) return;
        const t1 = performance.now();
        while (j < Z.length && performance.now() - t1 < 40) {
          const layers = O.pathLayers(Z[j], 36, opts.ye, O.YE_MANTLE, opts);
          for (let i = 0; i < E.length; i++) res[j * E.length + i] = O.probabilityMatrix(E[i], layers, O.NUFIT61.NO, false)[a][b];
          j++;
        }
        progress(j / Z.length);
        if (j < Z.length) setTimeout(row, 0); else cb(res);
      }
      row();
    }

    function paint(canvas, values, colorOf, title) {
      const ctx = canvas.getContext("2d"), Wc = canvas.width, Hc = canvas.height, m = { l: 74, r: 14, t: 34, b: 58 };
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, Wc, Hc);
      const w = (Wc - m.l - m.r) / E.length, h = (Hc - m.t - m.b) / Z.length;
      for (let j = 0; j < Z.length; j++) for (let i = 0; i < E.length; i++) {
        const [r, g, bb] = colorOf(values[j * E.length + i]);
        ctx.fillStyle = `rgb(${r},${g},${bb})`;
        ctx.fillRect(m.l + i * w, m.t + (Z.length - 1 - j) * h, Math.ceil(w) + 0.5, Math.ceil(h) + 0.5);
      }
      ctx.fillStyle = "#e8edf2"; ctx.font = "22px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(title, (m.l + Wc - m.r) / 2, 24);
      ctx.font = "19px system-ui, sans-serif";
      const xE = (e) => m.l + (Math.log10(e) / Math.log10(20)) * (Wc - m.l - m.r);
      const yZ = (z) => m.t + ((z - Z[Z.length - 1]) / (Z[0] - Z[Z.length - 1])) * (Hc - m.t - m.b);
      for (const e of [1, 2, 5, 10, 20]) ctx.fillText(String(e), xE(e), Hc - m.b + 24);
      ctx.fillText("neutrino energy E [GeV]", (m.l + Wc - m.r) / 2, Hc - 8);
      ctx.textAlign = "right";
      for (const z of [-1, -0.8, -0.6, -0.4, -0.2]) ctx.fillText(z.toFixed(1), m.l - 8, yZ(z) + 6);
      ctx.save(); ctx.translate(20, (m.t + Hc - m.b) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.fillText("cos θz", 0, 0); ctx.restore();
      const zc = -Math.sqrt(1 - (O.R_CORE / O.R_EARTH) ** 2);
      ctx.strokeStyle = "rgba(238,238,238,0.8)"; ctx.setLineDash([8, 6]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(m.l, yZ(zc)); ctx.lineTo(Wc - m.r, yZ(zc)); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = "left"; ctx.fillText("core", m.l + 8, yZ(zc) - 8);
    }

    function run() {
      const chan = ctl.channel.value, vmax = chan === "mu-mu" ? 1 : 0.5;
      const opts = { ye: parseFloat(ctl.ye.value), coreScale: parseFloat(ctl.scale.value), noCore: ctl.nocore.checked };
      const label = chan === "mu-mu" ? "P(νμ → νμ)" : "P(νμ → νe)";
      btn.disabled = true;
      const withRef = (ref) => grid(opts, chan, (res) => {
        paint(cMap, res, (v) => cmap(SEQ, v / vmax), `${label}, modified Earth`);
        let dmax = 0; const d = new Float32Array(res.length);
        for (let k = 0; k < res.length; k++) { d[k] = res[k] - ref[k]; dmax = Math.max(dmax, Math.abs(d[k])); }
        const lim = Math.max(0.01, Math.min(0.3, dmax));
        paint(cDiff, d, (v) => cmap(DIV, 0.5 + 0.5 * v / lim), `difference from PREM with an iron core (±${lim.toFixed(2)})`);
        out.dmax.textContent = dmax.toFixed(3);
        out.status.textContent = "done"; btn.disabled = false;
      }, (f) => { out.status.textContent = `computing ${Math.round(50 + 50 * f)} %`; });
      if (cache[chan]) withRef(cache[chan]);
      else grid({ ye: O.YE_CORE, coreScale: 1, noCore: false }, chan, (ref) => { cache[chan] = ref; withRef(ref); },
        (f) => { out.status.textContent = `computing ${Math.round(50 * f)} %`; });
    }
    btn.addEventListener("click", run);
    ctl.ye.addEventListener("input", () => { out.ye.textContent = parseFloat(ctl.ye.value).toFixed(3); out.status.textContent = "press compute"; });
    ctl.scale.addEventListener("input", () => { out.scale.textContent = parseFloat(ctl.scale.value).toFixed(2); out.status.textContent = "press compute"; });
    [ctl.nocore, ctl.channel].forEach((c) => c.addEventListener("input", () => { out.status.textContent = "press compute"; }));
    box.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
      const [k, v] = b.getAttribute("data-preset").split(":");
      if (k === "nocore") ctl.nocore.checked = v === "1"; else { ctl[k].value = v; ctl[k].dispatchEvent(new Event("input")); }
      run();
    }));
    // compute the first time the slide is shown
    let started = false;
    const visible = () => box.closest("section.present");
    const maybeStart = () => { if (!started && visible()) { started = true; run(); } };
    if (window.Reveal && Reveal.on) Reveal.on("slidechanged", maybeStart);
    setTimeout(maybeStart, 500);
  }

  function start() {
    document.querySelectorAll("[data-baseline-lab]").forEach(initBaseline);
    document.querySelectorAll("[data-flavor-path]").forEach(initFlavorPath);
    document.querySelectorAll("[data-oscillogram-lab]").forEach(initOscillogramLab);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
