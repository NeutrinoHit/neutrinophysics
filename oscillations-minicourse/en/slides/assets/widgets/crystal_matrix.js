// The neutrino crystal as a 2×2 matrix in the mass basis ν1, ν2, in units of Δm²/2E with the common phase dropped:
// M = diag(0, 1) + A P_e, P_e = [[cos²θ, sinθcosθ], [sinθcosθ, sin²θ]], A = 2EV/Δm². The phases after L are
// 2π (L/L_osc) M. "Diagonalize": M = R(θ − θm) diag(λ1, λ2) R(θ − θm)ᵀ with λ1,2 = (1 + A ∓ R)/2,
// R = √((cos2θ − A)² + sin²2θ), sin2θm = sin2θ/R, cos2θm = (cos2θ − A)/R; the axes ν1m, ν2m are ν1, ν2 turned by θ − θm.
// θ = θ12 of NuFIT 6.1 (sin²θ12 = 0.3088). Solar center: n_e/N_A = 102.9 cm⁻³ (BS05(OP)), E = 10 MeV: A = 2.08.
(function () {
  "use strict";
  if (window.CrystalMatrix) return;
  window.CrystalMatrix = true;
  const THETA = Math.asin(Math.sqrt(0.3088));
  const PRESETS = [[0, "vacuum"], [-0.0134, "geo \\(\\bar\\nu_e\\), mantle"], [Math.cos(2 * THETA), "resonance"], [2.084, "solar center"]];
  const C2 = Math.cos(2 * THETA), S2 = Math.sin(2 * THETA), c = Math.cos(THETA), s = Math.sin(THETA);
  const deg = (x) => (x * 180 / Math.PI).toFixed(1);
  const fmt = (v) => (Math.abs(v) < 0.005 ? "0" : v.toFixed(2));

  function matrix(id, title, cls, heads) {
    const cell = (i, j) => `<td class="cm-cell${i !== j ? " off" : ""}" data-c="${id}${i}${j}"></td>`;
    return `<div class="cm-mat ${cls}" data-m="${id}"><div class="cm-title">${title}</div>
      <table><tr><th></th><th>${heads[0]}</th><th>${heads[1]}</th></tr>
      <tr><th>${heads[0]}</th>${cell(0, 0)}${cell(0, 1)}</tr>
      <tr><th>${heads[1]}</th>${cell(1, 0)}${cell(1, 1)}</tr></table></div>`;
  }

  function setup(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = "1";
    const st = { A: 0, diag: false };
    const H = ["\\(\\nu_1\\)", "\\(\\nu_2\\)"], HM = ["\\(\\nu_{1m}\\)", "\\(\\nu_{2m}\\)"];
    root.innerHTML = `
      <div class="cm-controls">
        <label class="cm-slider"><span>\\(A=\\dfrac{2EV}{\\Delta m^2}\\)</span> <b data-out="A"></b><input data-in="A" type="range" min="-0.5" max="3" step="0.005" value="0"></label>
        <span class="cm-seg">${PRESETS.map(([a, t]) => `<button type="button" data-a="${a}">${t}</button>`).join("")}</span>
        <button type="button" class="cm-diag" data-act="diag">Diagonalize</button>
      </div>
      <div class="cm-body">
        <div class="cm-left">
          <div class="cm-eq">
            ${matrix("v", "vacuum", "v", H)}<div class="cm-op">+</div>
            <div class="cm-op cm-a">\\(A\\,\\times\\)</div>${matrix("m", "matter: \\(\\nu_e\\) only", "m", H)}<div class="cm-op">=</div>
            ${matrix("c", "the crystal", "c", H)}
          </div>
          <div class="cm-diagrow">
            <div class="cm-op">=</div>
            ${matrix("d", "in its own axes", "d", HM)}
            <div class="cm-note"><div>\\(\\lambda_{1,2}=\\tfrac12\\bigl(1+A\\mp R\\bigr)\\)</div><div>\\(R=\\lambda_2-\\lambda_1=\\sqrt{(\\cos2\\theta-A)^2+\\sin^2 2\\theta}\\)</div>
              <div class="cm-hl">\\(R=\\) <b data-out="R"></b>, \\(\\ \\theta_m=\\) <b data-out="thm"></b>°</div></div>
          </div>
        </div>
        <div class="cm-right"><svg viewBox="0 0 500 500" role="img" aria-label="The axes nu1, nu2, the flavor states nu_e, nu_mu and, after diagonalization, the axes of the crystal nu1m, nu2m"></svg><div class="cm-labels"></div></div>
      </div>`;
    const svg = root.querySelector("svg"), layer = root.querySelector(".cm-labels");
    const names = { n1: "\\(\\nu_1\\)", n2: "\\(\\nu_2\\)", m1: "\\(\\nu_{1m}\\)", m2: "\\(\\nu_{2m}\\)", e: "\\(\\nu_e\\)", mu: "\\(\\nu_\\mu\\)", th: "\\(\\theta\\)", thm: "\\(\\theta_m\\)" };
    const lab = {};
    Object.entries(names).forEach(([k, t]) => { const d = document.createElement("div"); d.className = `cm-l cm-l-${k}`; d.innerHTML = t; layer.appendChild(d); lab[k] = d; });
    if (window.MathJax && MathJax.Hub) MathJax.Hub.Queue(["Typeset", MathJax.Hub, root]);
    const sl = root.querySelector('[data-in="A"]'), btn = root.querySelector('[data-act="diag"]');
    const put = (k, x, y, show = true) => { const d = lab[k]; d.style.left = `${x / 5}%`; d.style.top = `${y / 5}%`; d.style.display = show ? "" : "none"; };

    function draw() {
      const A = st.A, R = Math.hypot(C2 - A, S2), thm = 0.5 * Math.atan2(S2, C2 - A);
      const M = { v: [[0, 0], [0, 1]], m: [[c * c, c * s], [c * s, s * s]] };
      M.c = [[A * c * c, A * c * s], [A * c * s, 1 + A * s * s]];
      M.d = [[(1 + A - R) / 2, 0], [0, (1 + A + R) / 2]];
      ["v", "m", "c", "d"].forEach((k) => [0, 1].forEach((i) => [0, 1].forEach((j) => {
        const td = root.querySelector(`[data-c="${k}${i}${j}"]`), v = M[k][i][j];
        td.textContent = fmt(v);
        td.style.backgroundColor = `rgba(${i !== j ? "255,138,92" : "115,199,255"},${(0.06 + 0.6 * Math.min(1, Math.abs(v) / 2.5)).toFixed(2)})`;
      })));
      root.querySelector('[data-out="A"]').textContent = A.toFixed(3);
      root.querySelector('[data-out="R"]').textContent = R.toFixed(2);
      root.querySelector('[data-out="thm"]').textContent = deg(thm);
      root.classList.toggle("is-diag", st.diag);
      btn.textContent = st.diag ? "Back" : "Diagonalize";
      // axes: ν1 along x, ν2 along y, νe at θ; after diagonalization ν1m at θ − θm
      const cx = 250, cy = 250, r = 190;
      const end = (ang, len) => [cx + len * Math.cos(ang), cy - len * Math.sin(ang)];
      const line = (ang, len, cls, both = false) => {
        const [x2, y2] = end(ang, len), [x1, y1] = both ? end(ang + Math.PI, len) : [cx, cy];
        return `<line class="${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      };
      const arcPath = (a0, a1, rad) => { let d = ""; for (let i = 0; i <= 30; i += 1) { const [x, y] = end(a0 + (a1 - a0) * i / 30, rad); d += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; } return d; };
      const phi = THETA - thm;
      let h = `<circle cx="${cx}" cy="${cy}" r="${r}" class="cm-ring"/>`;
      h += line(0, r, st.diag ? "cm-ax dim" : "cm-ax", true) + line(Math.PI / 2, r, st.diag ? "cm-ax dim" : "cm-ax", true);
      if (st.diag) {
        h += line(phi, r, "cm-mx", true) + line(phi + Math.PI / 2, r, "cm-mx", true);
        h += `<path class="cm-arc-m" d="${arcPath(phi, THETA, 80)}"/>`;
      } else {
        h += `<path class="cm-arc" d="${arcPath(0, THETA, 80)}"/>`;
      }
      h += line(THETA, r * 0.9, "cm-fe") + line(THETA + Math.PI / 2, r * 0.9, "cm-fm");
      svg.innerHTML = h;
      put("n1", ...end(0, r + 28)); put("n2", ...end(Math.PI / 2, r + 24));
      put("m1", ...end(phi, r + 32), st.diag); put("m2", ...end(phi + Math.PI / 2, r + 32), st.diag);
      put("e", ...end(THETA, r * 0.9 + 28)); put("mu", ...end(THETA + Math.PI / 2, r * 0.9 + 28));
      put("th", ...end(THETA / 2, 110), !st.diag);
      put("thm", ...end((phi + THETA) / 2, 112), st.diag && Math.abs(thm) > 0.06);
      root.querySelectorAll("[data-a]").forEach((b) => b.classList.toggle("on", Math.abs(Number(b.dataset.a) - A) < 1e-3));
    }
    sl.addEventListener("input", () => { st.A = Number(sl.value); draw(); });
    root.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => { st.A = Number(b.dataset.a); sl.value = st.A; draw(); }));
    btn.addEventListener("click", () => { st.diag = !st.diag; draw(); });
    draw();
  }

  function init() { document.querySelectorAll(".crystal-matrix").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
