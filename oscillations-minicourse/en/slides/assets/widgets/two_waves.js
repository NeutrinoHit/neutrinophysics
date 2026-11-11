// Two waves with slightly different wavelengths leave the source in phase; their relative phase grows
// along the path, and the detector sees the flavor (or the polarization) set by that phase.
// Modes: "vacuum" (ν1, ν2 → νe, νμ), "light" (a birefringent plate between polarizers H and V),
// "matter" (the vacuum and the solar-matter eigenstates on one path, 10 MeV, center of the Sun).
(function () {
  "use strict";
  if (window.TwoWaves) return;
  window.TwoWaves = true;

  // ν with a true subscript inside SVG text (always the last characters of a label)
  const nu = (s) => `ν<tspan class="tw-sub" dy="0.3em">${s}</tspan>`;
  const LABELS = {
    vacuum: { w1: nu("1"), w2: nu("2"), out1: nu("e"), out2: nu("μ"), x: "distance along the path", det: "detector" },
    light: { w1: "axis 1", w2: "axis 2", out1: "H", out2: "V", x: "depth in the plate", det: "analyzer" },
    matter: { w1: nu("1"), w2: nu("2"), out1: nu("e"), out2: nu("μ"), x: "distance along the path, km", det: "detector" }
  };
  // solar center, 10 MeV, NuFIT 6.1: A = 2EV/Δm²₂₁
  const THETA12 = Math.asin(Math.sqrt(0.3088)), A_SUN = 2.084, LVAC_KM = 329;   // n_e/N_A = 102.9 cm⁻³ (BS05(OP))
  const svgNS = "http://www.w3.org/2000/svg";

  function setup(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = "1";
    const mode = root.dataset.mode || "vacuum";
    const L = LABELS[mode];
    const st = { theta: mode === "matter" ? THETA12 : Math.PI / 4, x: 0.25, medium: "matter" };

    root.innerHTML = `
      <div class="tw-controls">
        <label class="tw-slider">${L.det} <input data-in="x" type="range" min="0" max="1" step="0.001" value="0.25"></label>
        ${mode === "matter"
          ? `<span class="tw-seg"><button type="button" data-medium="vacuum">vacuum</button><button type="button" data-medium="matter" class="on">solar matter</button></span>`
          : `<label class="tw-slider">angle θ <b data-out="theta"></b><input data-in="theta" type="range" min="0" max="90" step="0.5" value="45"></label>
             <span class="tw-seg"><button type="button" data-theta="45">45°</button><button type="button" data-theta="33.8">34°</button><button type="button" data-theta="0">0°</button></span>`}
      </div>
      <svg viewBox="0 0 1500 560" role="img" aria-label="Two waves with a growing relative phase"></svg>`;
    const svg = root.querySelector("svg");
    const xs = root.querySelector('[data-in="x"]');

    // parameters of the active medium: angle of the axes and the number of flavor periods along the path
    function medium(which) {
      if (mode !== "matter") return { th: st.theta, periods: 1, label: "" };
      if (which === "vacuum") return { th: THETA12, periods: 1, label: "vacuum" };
      const c2 = Math.cos(2 * THETA12), s2 = Math.sin(2 * THETA12);
      const R = Math.hypot(c2 - A_SUN, s2);
      return { th: 0.5 * Math.atan2(s2, c2 - A_SUN), periods: R, label: "solar matter" };
    }
    const P2 = (m, x) => Math.sin(2 * m.th) ** 2 * Math.sin(Math.PI * m.periods * x) ** 2;

    const X0 = 140, X1 = 1060, lane1 = 95, lane2 = 215, AMP = 48, CYCLES = 3;   // ν1 makes 3 waves, ν2 one more per period
    const xPix = (x) => X0 + (X1 - X0) * x;
    const plotTop = 330, plotBot = 500, yP = (p) => plotBot - (plotBot - plotTop) * p;

    function wavePath(y0, amp, cycles, phase0) {
      let d = "";
      for (let i = 0; i <= 600; i += 1) {
        const x = i / 600;
        d += `${i ? "L" : "M"}${xPix(x).toFixed(1)},${(y0 - amp * Math.cos(2 * Math.PI * cycles * x - phase0)).toFixed(1)}`;
      }
      return d;
    }

    function draw() {
      const m = medium(st.medium);
      const inMatter = mode === "matter" && st.medium === "matter";
      const n1 = inMatter ? nu("1m") : L.w1, n2 = inMatter ? nu("2m") : L.w2;
      const a1 = Math.cos(m.th), a2 = Math.sin(m.th);
      const extra = m.periods;                       // ν2 has `extra` more cycles over the path: Δφ(x) = 2π·extra·x
      const dphi = 2 * Math.PI * extra * st.x;
      const pOut2 = P2(m, st.x), pOut1 = 1 - pOut2;
      let h = "";
      // lanes
      h += `<text x="${X0 - 20}" y="${lane1 + 6}" text-anchor="end" class="tw-l1">${n1}</text>`;
      h += `<text x="${X0 - 20}" y="${lane2 + 6}" text-anchor="end" class="tw-l2">${n2}</text>`;
      h += `<text x="${X0 - 20}" y="${lane1 + 30}" text-anchor="end" class="tw-small">× ${a1.toFixed(2)}</text>`;
      h += `<text x="${X0 - 20}" y="${lane2 + 30}" text-anchor="end" class="tw-small">× ${a2.toFixed(2)}</text>`;
      h += `<line class="tw-axis" x1="${X0}" y1="${lane1}" x2="${X1}" y2="${lane1}"/><line class="tw-axis" x1="${X0}" y1="${lane2}" x2="${X1}" y2="${lane2}"/>`;
      h += `<path class="tw-w1" d="${wavePath(lane1, AMP * Math.max(a1, 0.04), CYCLES, 0)}"/>`;
      h += `<path class="tw-w2" d="${wavePath(lane2, AMP * Math.max(a2, 0.04), CYCLES + extra, 0)}"/>`;
      // where the waves are in phase (Δφ = 0, 2π, ...) and in antiphase (Δφ = π, 3π, ...)
      for (let k = 0; k / (2 * extra) <= 1.0001; k += 1) {
        const xg = xPix(k / (2 * extra)), even = k % 2 === 0;
        h += `<line class="tw-guide" x1="${xg}" y1="${lane1 - AMP}" x2="${xg}" y2="${lane2 + AMP}"/>`;
        h += `<text x="${xg}" y="${lane2 + AMP + 24}" text-anchor="middle" class="tw-guide-t${even ? "" : " anti"}">${even ? "in phase: " + L.out1 : "antiphase: " + L.out2}</text>`;
      }
      // detector
      const xd = xPix(st.x);
      h += `<line class="tw-det" x1="${xd}" y1="${lane1 - AMP - 6}" x2="${xd}" y2="${plotBot}"/>`;
      h += `<text x="${xd}" y="${lane1 - AMP - 14}" text-anchor="middle" class="tw-det-t">${L.det}</text>`;
      // probability along the path
      [0, 0.5, 1].forEach((p) => {
        h += `<line class="tw-grid" x1="${X0}" y1="${yP(p)}" x2="${X1}" y2="${yP(p)}"/><text x="${X0 - 12}" y="${yP(p) + 5}" text-anchor="end" class="tw-small">${p}</text>`;
      });
      if (mode === "matter") {
        const other = medium(st.medium === "matter" ? "vacuum" : "matter");
        let dv = "";
        for (let i = 0; i <= 400; i += 1) dv += `${i ? "L" : "M"}${xPix(i / 400).toFixed(1)},${yP(P2(other, i / 400)).toFixed(1)}`;
        h += `<path class="tw-pother" d="${dv}"/>`;
        h += `<text x="${X1}" y="${plotTop - 10}" text-anchor="end" class="tw-small">dashed: ${other.label}</text>`;
      }
      let dp = "";
      for (let i = 0; i <= 400; i += 1) dp += `${i ? "L" : "M"}${xPix(i / 400).toFixed(1)},${yP(P2(m, i / 400)).toFixed(1)}`;
      h += `<path class="tw-p" d="${dp}"/>`;
      h += `<circle class="tw-pdot" cx="${xd}" cy="${yP(pOut2)}" r="7"/>`;
      h += `<text x="${X0}" y="${plotTop - 10}" class="tw-small">probability to find ${L.out2}</text>`;
      const ticks = mode === "matter" ? [[0, "0"], [0.5, `${Math.round(LVAC_KM / 2)}`], [1, `${LVAC_KM}`]]
        : mode === "light" ? [[0, "0"], [0.5, "half-wave plate"], [1, "full-wave plate"]]
        : [[0, "0"], [0.5, "½ L<tspan class='tw-sub' dy='0.3em'>osc</tspan>"], [1, "L<tspan class='tw-sub' dy='0.3em'>osc</tspan>"]];
      ticks.forEach(([x, t]) => { h += `<text x="${xPix(x)}" y="${plotBot + 26}" text-anchor="middle" class="tw-small">${t}</text>`; });
      h += `<text x="${(X0 + X1) / 2}" y="${plotBot + 52}" text-anchor="middle" class="tw-small">${L.x}</text>`;
      // phase clock at the detector
      const cx = 1290, cy = 165, r = 100;
      h += `<text x="${cx}" y="40" text-anchor="middle" class="tw-head">at the ${L.det}</text>`;
      h += `<circle class="tw-clock" cx="${cx}" cy="${cy}" r="${r}"/>`;
      const arrow = (ang, cls) => {
        const ex = cx + r * Math.cos(ang), ey = cy - r * Math.sin(ang);
        return `<line class="${cls}" x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"/><circle class="${cls}-dot" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="7"/>`;
      };
      h += arrow(Math.PI / 2, "tw-a1") + arrow(Math.PI / 2 - dphi, "tw-a2");
      const deg = ((dphi * 180 / Math.PI) % 360 + 360) % 360;
      const word = deg < 15 || deg > 345 ? "in phase" : Math.abs(deg - 180) < 15 ? "antiphase" : "";
      h += `<text x="${cx}" y="${cy + r + 34}" text-anchor="middle" class="tw-head">Δφ = ${deg.toFixed(0)}°${word ? " · " + word : ""}</text>`;
      // bars
      const bx = 1180, bw = 220, by = 360;
      [[L.out1, pOut1, "tw-b1"], [L.out2, pOut2, "tw-b2"]].forEach(([name, p, cls], i) => {
        const y = by + i * 62;
        h += `<text x="${bx}" y="${y}" class="tw-head">${name}</text><text x="${bx + bw}" y="${y}" text-anchor="end" class="tw-head">${p.toFixed(2)}</text>`;
        h += `<rect class="tw-track" x="${bx}" y="${y + 10}" width="${bw}" height="16" rx="8"/><rect class="${cls}" x="${bx}" y="${y + 10}" width="${(bw * p).toFixed(1)}" height="16" rx="8"/>`;
      });
      svg.innerHTML = h;
      const tOut = root.querySelector('[data-out="theta"]');
      if (tOut) tOut.textContent = `${(st.theta * 180 / Math.PI).toFixed(1)}°`;
      root.querySelectorAll("[data-medium]").forEach((b) => b.classList.toggle("on", b.dataset.medium === st.medium));
    }

    xs.addEventListener("input", () => { st.x = Number(xs.value); draw(); });
    const th = root.querySelector('[data-in="theta"]');
    if (th) th.addEventListener("input", () => { st.theta = Number(th.value) * Math.PI / 180; draw(); });
    root.querySelectorAll("[data-theta]").forEach((b) => b.addEventListener("click", () => {
      st.theta = Number(b.dataset.theta) * Math.PI / 180; if (th) th.value = b.dataset.theta; draw();
    }));
    root.querySelectorAll("[data-medium]").forEach((b) => b.addEventListener("click", () => { st.medium = b.dataset.medium; draw(); }));
    draw();
  }

  function init() { document.querySelectorAll(".two-waves").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
