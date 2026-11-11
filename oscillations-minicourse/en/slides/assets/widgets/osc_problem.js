// The problem of the lecture as an experiment: a source makes a neutrino together with e⁺, a detector at the
// distance L turns it into a charged lepton. At L = 0 only e⁻ comes out; at L ≠ 0 μ⁻ appears too, with the
// probability P(νe → νμ) = sin²2θ sin²(π L/L_osc). Events are drawn at random, counted, and binned in L.
// The statistics run fast (RATE events per second); the picture stays calm: a running dashed beam,
// two bars at the detector with the e⁻ and μ⁻ shares at this L, counters refreshed a few times per second.
// Two flavors, θ = θ12 of NuFIT 6.1 (sin²θ12 = 0.3088); L in units of L_osc = 4πE/Δm².
(function () {
  "use strict";
  if (window.OscProblem) return;
  window.OscProblem = true;
  const S2 = 4 * 0.3088 * (1 - 0.3088);           // sin²2θ12 = 0.854
  const LMAX = 2, BIN = 0.05, RATE = 150;         // L/L_osc range, bin width, events per second
  const BEAM_SPEED = 90, REFRESH = 0.2;          // speed of the running dashes (px/s), counter refresh (s)
  const sub = (b, s) => `${b}<tspan class="op-sub" dy="0.3em">${s}</tspan>`;
  const sup = (b, s) => `${b}<tspan class="op-sup" dy="-0.55em">${s}</tspan>`;

  function setup(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = "1";
    const st = { L: 0, run: true, curve: false, equal: false, zero: false, ne: 0, nm: 0, bins: new Map(),
      dash: 0, acc: 0, shown: { ne: 0, nm: 0, here: "—" }, sinceRefresh: 0, bar: 0 };
    root.innerHTML = `
      <div class="op-controls">
        <label class="op-slider">detector at \\(L/L_{\\rm osc}=\\) <b data-out="L"></b><input data-in="L" type="range" min="0" max="${LMAX}" step="0.01" value="0"></label>
        <button type="button" data-act="run">Pause</button>
        <button type="button" data-act="clear">Clear</button>
        <button type="button" data-act="curve">Show \\(P(L/E)\\)</button>
        <label class="op-check"><input type="checkbox" data-in="equal"> \\(m_1=m_2\\)</label>
        <label class="op-check"><input type="checkbox" data-in="zero"> \\(\\theta=0\\)</label>
      </div>
      <div class="op-status" aria-live="polite"></div>
      <svg viewBox="0 0 1500 530" role="img" aria-label="A neutrino source, a movable detector, the counts of electrons and muons and the measured fraction of muons against the distance"></svg>`;
    if (window.MathJax && MathJax.Hub) MathJax.Hub.Queue(["Typeset", MathJax.Hub, root.querySelector(".op-controls")]);
    const svg = root.querySelector("svg"), status = root.querySelector(".op-status");
    const sl = root.querySelector('[data-in="L"]'), runBtn = root.querySelector('[data-act="run"]'), curveBtn = root.querySelector('[data-act="curve"]');

    const SRC = 110, D0 = 275, D1 = 1100, BEAM = 165, LINE = 248;   // source x, detector x at L = 0 and L = LMAX, beam and L-line heights
    const detX = (L) => D0 + (D1 - D0) * L / LMAX;
    const PX0 = 275, PX1 = 1100, PY0 = 490, PY1 = 310;               // plot box
    const px = (L) => PX0 + (PX1 - PX0) * L / LMAX, py = (p) => PY0 - (PY0 - PY1) * p;
    const P = (L) => (st.equal || st.zero ? 0 : S2 * Math.sin(Math.PI * L) ** 2);
    const BAR = 85;                                                   // full height of the detector bars

    const STATIC = (() => {
      let h = `<rect x="${SRC - 75}" y="${BEAM - 50}" width="150" height="100" rx="12" class="op-src"/>
        <text x="${SRC}" y="${BEAM - 8}" class="op-box-t" text-anchor="middle">source</text>
        <text x="${SRC}" y="${BEAM + 30}" class="op-box-t" text-anchor="middle">ν + ${sup("e", "+")}</text>
        <line x1="${SRC + 75}" y1="${BEAM}" x2="${D1 + 70}" y2="${BEAM}" class="op-beam"/>`;
      h += `<line x1="${PX0}" y1="${PY0}" x2="${PX1}" y2="${PY0}" class="op-axis"/><line x1="${PX0}" y1="${PY0}" x2="${PX0}" y2="${PY1}" class="op-axis"/>`;
      for (let k = 0; k <= 4; k += 1) {
        const L = k / 2;
        h += `<line x1="${px(L)}" y1="${PY0}" x2="${px(L)}" y2="${PY0 + 7}" class="op-axis"/><text x="${px(L)}" y="${PY0 + 32}" text-anchor="middle" class="op-tick">${L}</text>`;
      }
      [0, 0.5, 1].forEach((p) => { h += `<line x1="${PX0 - 7}" y1="${py(p)}" x2="${PX1}" y2="${py(p)}" class="op-grid"/><text x="${PX0 - 14}" y="${py(p) + 8}" text-anchor="end" class="op-tick">${p}</text>`; });
      h += `<text x="${PX1 + 20}" y="${PY0 + 8}" class="op-axis-t">L / L<tspan class="op-sub" dy="0.3em">osc</tspan></text>`;
      h += `<text x="${PX0 - 85}" y="${(PY0 + PY1) / 2}" text-anchor="middle" class="op-axis-t" transform="rotate(-90 ${PX0 - 85} ${(PY0 + PY1) / 2})">${sup("μ", "−")} / all</text>`;
      return h;
    })();

    function curvePath() {
      let d = "";
      for (let i = 0; i <= 400; i += 1) { const L = LMAX * i / 400; d += `${i ? "L" : "M"}${px(L).toFixed(1)},${py(P(L)).toFixed(1)}`; }
      return `<path d="${d}" class="op-curve"/>`;
    }
    const binHere = () => st.bins.get(Math.round(st.L / BIN));

    function draw() {
      const x = detX(st.L);
      let h = STATIC;
      h += `<line x1="${SRC}" y1="${LINE}" x2="${x}" y2="${LINE}" class="op-dim"/>
        <line x1="${SRC}" y1="${LINE - 10}" x2="${SRC}" y2="${LINE + 10}" class="op-dim"/><line x1="${x}" y1="${LINE - 10}" x2="${x}" y2="${LINE + 10}" class="op-dim"/>
        <text x="${Math.max((SRC + x) / 2, SRC + 60)}" y="${LINE + 34}" text-anchor="middle" class="op-L">L</text>`;
      const x0 = SRC + 75, x1 = x - 55;
      if (x1 > x0 + 4) h += `<line x1="${x0}" y1="${BEAM}" x2="${x1}" y2="${BEAM}" class="op-run" stroke-dashoffset="${(-st.dash).toFixed(1)}"/>`;
      // the detector with two calm bars: the e⁻ and μ⁻ shares at this L
      const fm = st.bar, fe = binHere() && binHere().n ? 1 - fm : 0;
      h += `<rect x="${x - 55}" y="${BEAM - 50}" width="110" height="100" rx="10" class="op-det"/>
        <text x="${x}" y="${BEAM + 9}" text-anchor="middle" class="op-box-t">detector</text>
        <rect x="${x - 38}" y="${BEAM - 58 - BAR}" width="34" height="${BAR}" class="op-track"/><rect x="${x + 4}" y="${BEAM - 58 - BAR}" width="34" height="${BAR}" class="op-track"/>
        <rect x="${x - 38}" y="${(BEAM - 58 - BAR * fe).toFixed(1)}" width="34" height="${(BAR * fe).toFixed(1)}" class="op-bar-e"/>
        <rect x="${x + 4}" y="${(BEAM - 58 - BAR * fm).toFixed(1)}" width="34" height="${(BAR * fm).toFixed(1)}" class="op-bar-m"/>
        <text x="${x - 46}" y="${BEAM - 64}" text-anchor="end" class="op-le-s">${sup("e", "−")}</text>
        <text x="${x + 46}" y="${BEAM - 64}" class="op-lm-s">${sup("μ", "−")}</text>`;
      const c = st.shown;
      h += `<g class="op-count"><text x="1250" y="75" class="op-le-t">${sup("e", "−")}</text><text x="1470" y="75" text-anchor="end" class="op-num">${c.ne}</text>
        <text x="1250" y="135" class="op-lm-t">${sup("μ", "−")}</text><text x="1470" y="135" text-anchor="end" class="op-num">${c.nm}</text>
        <text x="1250" y="350" class="op-note">at this L:</text><text x="1470" y="400" text-anchor="end" class="op-num">${c.here}</text>
        <text x="1470" y="440" text-anchor="end" class="op-note">${sup("μ", "−")} / all</text></g>`;
      if (st.curve) h += curvePath();
      st.bins.forEach((b, k) => {
        if (b.n < 20) return;
        const f = b.m / b.n, s = Math.sqrt(Math.max(f * (1 - f), 1 / b.n) / b.n), xb = px(k * BIN);
        h += `<line x1="${xb}" y1="${py(Math.min(1, f + s))}" x2="${xb}" y2="${py(Math.max(0, f - s))}" class="op-err"/><circle cx="${xb}" cy="${py(f)}" r="6" class="op-pt"/>`;
      });
      h += `<line x1="${px(st.L)}" y1="${PY0}" x2="${px(st.L)}" y2="${PY1 - 10}" class="op-mark"/>`;
      svg.innerHTML = h;
      root.querySelector('[data-out="L"]').textContent = st.L.toFixed(2);
      runBtn.textContent = st.run ? "Pause" : "Run";
      curveBtn.classList.toggle("on", st.curve);
    }
    function refreshCounters() {
      const b = binHere();
      st.shown = { ne: st.ne, nm: st.nm, here: b && b.n ? `${b.m} / ${b.n}` : "—" };
    }
    function message() {
      if (st.equal || st.zero) return `${st.equal ? "Equal masses" : "No mixing"}: only e<sup>−</sup> at any \\(L\\). Both \\(m_1\\ne m_2\\) and \\(\\theta\\ne0\\) are needed.`;
      if (st.L < 0.005) return "\\(L=0\\): born with e<sup>+</sup>, the neutrino makes only e<sup>−</sup>. A μ<sup>−</sup> is impossible.";
      if (st.curve) return "\\(P(\\nu_e\\to\\nu_\\mu)\\) is a periodic function of \\(L/E\\): <b>neutrino oscillations</b>.";
      return "\\(L\\ne0\\): μ<sup>−</sup> appears. The impossible becomes possible.";
    }
    let lastMsg = "";
    const typeset = () => { const m = message(); if (m !== lastMsg) { lastMsg = m; status.innerHTML = m; if (window.MathJax && MathJax.Hub) MathJax.Hub.Queue(["Typeset", MathJax.Hub, status]); } };

    function event() {
      const mu = Math.random() < P(st.L);
      if (mu) st.nm += 1; else st.ne += 1;
      const k = Math.round(st.L / BIN), b = st.bins.get(k) || { n: 0, m: 0 };
      b.n += 1; b.m += mu ? 1 : 0; st.bins.set(k, b);
    }
    let prev = 0;
    function tick(now) {
      const dt = Math.min(0.05, (now - prev) / 1000 || 0);
      prev = now;
      if (root.offsetParent !== null) {
        if (st.run) {
          st.acc += dt * RATE;
          while (st.acc >= 1) { st.acc -= 1; event(); }
          st.dash = (st.dash + dt * BEAM_SPEED) % 1040;   // 40 dash periods of 26 px
        }
        const b = binHere(), target = b && b.n ? b.m / b.n : 0;
        st.bar += (target - st.bar) * Math.min(1, dt * 4);            // the bars glide to the share at this L
        st.sinceRefresh += dt;
        if (st.sinceRefresh >= REFRESH) { st.sinceRefresh = 0; refreshCounters(); }
        draw(); typeset();
      }
      requestAnimationFrame(tick);
    }
    const moveTo = (L) => { st.L = L; sl.value = L; refreshCounters(); };
    sl.addEventListener("input", () => moveTo(Number(sl.value)));
    runBtn.addEventListener("click", () => { st.run = !st.run; });
    root.querySelector('[data-act="clear"]').addEventListener("click", () => { st.ne = 0; st.nm = 0; st.bins.clear(); refreshCounters(); });
    curveBtn.addEventListener("click", () => { st.curve = !st.curve; });
    ["equal", "zero"].forEach((k) => root.querySelector(`[data-in="${k}"]`).addEventListener("change", (e) => { st[k] = e.target.checked; st.bins.clear(); st.ne = 0; st.nm = 0; refreshCounters(); }));
    // drag the detector in the picture
    let drag = false;
    const toL = (ev) => { const r = svg.getBoundingClientRect(), xs = (ev.clientX - r.left) * 1500 / r.width; return Math.round(Math.min(LMAX, Math.max(0, (xs - D0) / (D1 - D0) * LMAX)) * 100) / 100; };
    svg.addEventListener("pointerdown", (ev) => { const r = svg.getBoundingClientRect(), ys = (ev.clientY - r.top) * 530 / r.height; if (ys < 290) { drag = true; svg.setPointerCapture(ev.pointerId); moveTo(toL(ev)); } });
    svg.addEventListener("pointermove", (ev) => { if (drag) moveTo(toL(ev)); });
    svg.addEventListener("pointerup", () => { drag = false; });
    draw(); typeset();
    requestAnimationFrame(tick);
  }

  function init() { document.querySelectorAll(".osc-problem").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
