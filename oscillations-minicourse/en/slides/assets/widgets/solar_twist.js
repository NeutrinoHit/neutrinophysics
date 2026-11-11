// A νe born at the center of the Sun and followed out to the surface, two flavors, adiabatic.
// The axes ν1m, ν2m of the crystal turn with the density: θm(r) from cos2θm = (cos2θ − A)/R, A = 2EV/Δm²₂₁.
// Adiabatic: the shares of ν1m and ν2m stay fixed at their values at birth, cos²θm0 and sin²θm0; the phase between the
// two parts runs fast and averages out, so the νe share at r is ½ + ½ cos2θm0 cos2θm(r). At the surface ν1m = ν1, ν2m = ν2.
// Density: BS05(OP), n_e/N_A = 102.9 cm⁻³ at the center, e^{−10.54 r/R☉} (the profile of the twisted-crystal figure).
// NuFIT 6.1: sin²θ12 = 0.3088, Δm²21 = 7.537e-5 eV². V = 7.6325e-14 eV · n_e/N_A [cm⁻³]. Energies of the Borexino points.
(function () {
  "use strict";
  if (window.SolarTwist) return;
  window.SolarTwist = true;
  const S12 = 0.3088, DM21 = 7.537e-5, V0 = 7.6325e-14 * 102.9, K = 10.54;
  const C2 = 1 - 2 * S12, S2 = Math.sqrt(1 - C2 * C2);
  const PRESETS = [[0.267, "pp"], [0.862, "⁷Be"], [1.44, "pep"], [8.1, "⁸B"]];
  const A = (E, r) => 2 * E * 1e6 * V0 * Math.exp(-K * r) / DM21;
  const theta = (E, r) => 0.5 * Math.atan2(S2, C2 - A(E, r));     // θm in (0, π/2)
  const sub = (b, s) => `${b}<tspan class="st-sub" dy="0.3em">${s}</tspan><tspan dy="-0.3em"></tspan>`;

  function setup(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = "1";
    const st = { E: 8.1, r: 0, play: false };
    root.innerHTML = `
      <div class="st-controls">
        <label class="st-slider">energy <b data-out="E"></b><input data-in="E" type="range" min="-1" max="1.301" step="0.001"></label>
        <span class="st-seg">${PRESETS.map(([e, t]) => `<button type="button" data-e="${e}">${t}</button>`).join("")}</span>
        <label class="st-slider">position \\(r/R_\\odot\\) <b data-out="r"></b><input data-in="r" type="range" min="0" max="1" step="0.002" value="0"></label>
        <button type="button" data-act="play">Fly out</button>
      </div>
      <div class="st-status" aria-live="polite"></div>
      <svg viewBox="0 0 1500 500" role="img" aria-label="The axes nu1m, nu2m turning from the center of the Sun to the surface, the state with fixed shares of nu1m and nu2m, and the matter angle against the radius"></svg>`;
    if (window.MathJax && MathJax.Hub) MathJax.Hub.Queue(["Typeset", MathJax.Hub, root.querySelector(".st-controls")]);
    const svg = root.querySelector("svg"), status = root.querySelector(".st-status");
    const sE = root.querySelector('[data-in="E"]'), sR = root.querySelector('[data-in="r"]'), playBtn = root.querySelector('[data-act="play"]');
    sE.value = Math.log10(st.E);

    const CX = 260, CY = 250, RAD = 190;
    const end = (ang, len) => [CX + len * Math.cos(ang), CY - len * Math.sin(ang)];
    const ln = (a, len, cls, both) => { const [x2, y2] = end(a, len), [x1, y1] = both ? end(a + Math.PI, len) : [CX, CY]; return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${cls}"/>`; };
    const txt = (a, len, s, cls) => { const [x, y] = end(a, len); return `<text x="${x.toFixed(1)}" y="${(y + 10).toFixed(1)}" text-anchor="middle" class="${cls}">${s}</text>`; };
    // right panel
    const PX0 = 720, PX1 = 1260, PY0 = 470, PY1 = 330;   // θm plot
    const px = (r) => PX0 + (PX1 - PX0) * r, py = (deg) => PY0 - (PY0 - PY1) * deg / 90;

    function draw() {
      const E = st.E, r = st.r, th0 = theta(E, 0), th = theta(E, r);
      const w1 = Math.cos(th0) ** 2, w2 = 1 - w1;                       // shares, fixed from birth
      const pee = 0.5 + 0.5 * Math.cos(2 * th0) * Math.cos(2 * th);
      // flavor axes: νe along x, νμ along y; ν1m at angle −θm, ν2m at 90° − θm
      const a1 = -th, a2 = Math.PI / 2 - th;
      let h = `<circle cx="${CX}" cy="${CY}" r="${RAD}" class="st-ring"/>`;
      h += ln(0, RAD, "st-fl", true) + ln(Math.PI / 2, RAD, "st-fl", true);
      h += txt(0, RAD + 34, sub("ν", "e"), "st-fl-t") + txt(Math.PI / 2, RAD + 26, sub("ν", "μ"), "st-fl-t");
      h += ln(a1, RAD, "st-m1", true) + ln(a2, RAD, "st-m2", true);
      const surf = r > 0.995;
      h += txt(a1, RAD + 40, surf ? sub("ν", "1") : sub("ν", "1m"), "st-m1-t") + txt(a2, RAD + 40, surf ? sub("ν", "2") : sub("ν", "2m"), "st-m2-t");
      // the state: the ν2m part as an arrow, the ν1m part as a blurred segment (its phase runs and averages out)
      const L2 = RAD * 0.92 * Math.sqrt(w2), L1 = RAD * 0.92 * Math.sqrt(w1);
      const [bx, by] = end(a2, L2), [ux, uy] = [Math.cos(a1), -Math.sin(a1)];
      h += `<line x1="${(bx - ux * L1).toFixed(1)}" y1="${(by - uy * L1).toFixed(1)}" x2="${(bx + ux * L1).toFixed(1)}" y2="${(by + uy * L1).toFixed(1)}" class="st-blur"/>`;
      h += `<line x1="${CX}" y1="${CY}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" class="st-state"/><circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="7" class="st-state-dot"/>`;
      // legend of the band: the ν1m part, whose phase runs fast
      h += `<rect x="720" y="481" width="34" height="14" rx="7" class="st-blur-key"/><text x="764" y="495" class="st-key">the ${sub("ν", surf ? "1" : "1m")} part: its phase runs and averages out</text>`;
      // the Sun strip
      h += `<defs><linearGradient id="st-sun" x1="0" x2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="0.25" stop-color="#ff8a5c"/><stop offset="1" stop-color="#3a2618"/></linearGradient></defs>`;
      h += `<rect x="${PX0}" y="22" width="${PX1 - PX0}" height="44" rx="8" fill="url(#st-sun)"/>
        <text x="${PX0}" y="98" class="st-tick">center</text><text x="${PX1}" y="98" text-anchor="end" class="st-tick">surface</text>
        <line x1="${px(r)}" y1="12" x2="${px(r)}" y2="76" class="st-mark"/>`;
      // shares
      const bar = (y, label, w, cls) => `<text x="${PX0}" y="${y + 30}" class="st-lab">${label}</text>
        <rect x="${PX0 + 210}" y="${y}" width="${PX1 - PX0 - 210}" height="36" class="st-track"/><rect x="${PX0 + 210}" y="${y}" width="${((PX1 - PX0 - 210) * w).toFixed(1)}" height="36" class="${cls}"/>
        <text x="${PX1 + 20}" y="${y + 31}" class="st-num">${(100 * w).toFixed(0)}%</text>`;
      h += bar(122, `share ${sub("ν", surf ? "2" : "2m")}`, w2, "st-b2") + bar(170, `share ${sub("ν", surf ? "1" : "1m")}`, w1, "st-b1") + bar(232, `share ${sub("ν", "e")}`, pee, "st-be");
      // θm(r)
      h += `<line x1="${PX0}" y1="${PY0}" x2="${PX1}" y2="${PY0}" class="st-axis"/><line x1="${PX0}" y1="${PY0}" x2="${PX0}" y2="${PY1}" class="st-axis"/>
        <line x1="${PX0}" y1="${py(45)}" x2="${PX1}" y2="${py(45)}" class="st-grid"/><text x="${PX1 + 10}" y="${py(45) + 9}" class="st-tick">45° resonance</text>
        <text x="${PX0 - 12}" y="${py(90) + 9}" text-anchor="end" class="st-tick">90°</text><text x="${PX0 - 12}" y="${PY0 + 9}" text-anchor="end" class="st-tick">0</text>
        <text x="${PX0 - 12}" y="${py(45) + 9}" text-anchor="end" class="st-tick">${sub("θ", "m")}</text>`;
      let d = "";
      for (let i = 0; i <= 200; i += 1) { const rr = i / 200; d += `${i ? "L" : "M"}${px(rr).toFixed(1)},${py(theta(E, rr) * 180 / Math.PI).toFixed(1)}`; }
      h += `<path d="${d}" class="st-curve"/><circle cx="${px(r)}" cy="${py(th * 180 / Math.PI)}" r="8" class="st-pt"/>`;
      svg.innerHTML = h;
      root.querySelector('[data-out="E"]').textContent = `${E < 1 ? E.toFixed(2) : E.toFixed(1)} MeV`;
      root.querySelector('[data-out="r"]').textContent = r.toFixed(2);
      root.querySelectorAll("[data-e]").forEach((b) => b.classList.toggle("on", Math.abs(Number(b.dataset.e) - E) < 1e-3));
      playBtn.textContent = st.play ? "Pause" : "Fly out";
      setStatus(r, w2, pee);
    }
    let last = "";
    function setStatus(r, w2, pee) {
      let m;
      if (r < 0.005) m = `Born as \\(\\nu_e\\): ${(100 * w2).toFixed(0)}% \\(\\nu_{2m}\\), ${(100 - 100 * w2).toFixed(0)}% \\(\\nu_{1m}\\). Press “Fly out”.`;
      else if (r < 0.995) m = "The axes turn with the density; the shares of \\(\\nu_{1m}\\) and \\(\\nu_{2m}\\) stay: adiabatic.";
      else if (w2 > 0.85) m = `Out comes \\(\\nu_2\\) (${(100 * w2).toFixed(0)}%): a mass state, it no longer oscillates. \\(\\nu_e\\) and \\(\\nu_\\mu\\) are gone; \\(P_{ee}=${pee.toFixed(2)}\\to\\sin^2\\theta_{12}\\).`;
      else m = `Out comes a mixture of \\(\\nu_1\\) and \\(\\nu_2\\); their phase averages out on the way: \\(P_{ee}=${pee.toFixed(2)}\\), almost the vacuum average.`;
      if (m === last) return;
      last = m; status.innerHTML = m;
      if (window.MathJax && MathJax.Hub) MathJax.Hub.Queue(["Typeset", MathJax.Hub, status]);
    }
    let prev = 0;
    function tick(now) {
      const dt = Math.min(0.05, (now - prev) / 1000 || 0);
      prev = now;
      if (st.play) {
        st.r = Math.min(1, st.r + dt / 6);
        sR.value = st.r;
        if (st.r >= 1) st.play = false;
        draw();
      }
      requestAnimationFrame(tick);
    }
    sE.addEventListener("input", () => { st.E = 10 ** Number(sE.value); draw(); });
    sR.addEventListener("input", () => { st.r = Number(sR.value); st.play = false; draw(); });
    root.querySelectorAll("[data-e]").forEach((b) => b.addEventListener("click", () => { st.E = Number(b.dataset.e); sE.value = Math.log10(st.E); draw(); }));
    playBtn.addEventListener("click", () => { if (st.r >= 1) st.r = 0; st.play = !st.play; draw(); });
    draw();
    requestAnimationFrame(tick);
  }

  function init() { document.querySelectorAll(".solar-twist").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
