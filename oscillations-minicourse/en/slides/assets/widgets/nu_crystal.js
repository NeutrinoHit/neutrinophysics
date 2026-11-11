// The neutrino crystal drawn like the calcite plate: a source of νe (the "polarizer"), a layer of vacuum or matter
// of length L (the "crystal"), the flavor state at its end and a detector of νμ (the "analyzer").
// The two-flavor state (ψe, ψμ) is drawn as a Jones vector: the same picture as the polarization of light.
// Two flavors, θ = θ12 of NuFIT 6.1 (sin²θ12 = 0.3088). Matter: A = 2EV/Δm², the axes of the crystal are the
// eigenstates ν1m = (cos θm, −sin θm), ν2m = (sin θm, cos θm) in the plane (νe, νμ), with
// sin 2θm = sin 2θ / R, cos 2θm = (cos 2θ − A)/R, R = √((cos 2θ − A)² + sin² 2θ);
// the phase between them after L: Δφ = 2π R L / L_osc, L_osc = 4πE/Δm² (the vacuum oscillation length);
// P(νe → νμ) = sin² 2θm sin²(Δφ/2). Wavelengths in the drawing are not to scale.
(function () {
  "use strict";
  if (window.NuCrystal) return;
  window.NuCrystal = true;
  const THETA = Math.asin(Math.sqrt(0.3088)), C2 = Math.cos(2 * THETA), S2 = Math.sin(2 * THETA);
  const PRESETS = [[0, "vacuum"], [C2, "resonance"], [2.084, "solar center"]];
  const Y0 = 160, AMP = 62, DH = [-0.5, 0.36], XP = 95, XC = 150, WPX = 300, KX = 2 * Math.PI / 64, LMAX = 2;
  const scr = (x, eH, eV) => [x + AMP * eH * DH[0], Y0 + AMP * (eH * DH[1] - eV)];
  const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const quad = (x, a, cls) => `<polygon class="${cls}" points="${[[-a, -a], [a, -a], [a, a], [-a, a]].map(([h, v]) => P(scr(x, h, v))).join(" ")}"/>`;
  const line = (p1, p2, cls) => `<line class="${cls}" x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}"/>`;

  function mixing(A) {
    const R = Math.hypot(C2 - A, S2);
    return { R, thm: 0.5 * Math.atan2(S2, C2 - A) };
  }
  function geom(st) {
    const x1 = XC + WPX * st.Lr;
    return { x1, XO: x1 + 50, XA: x1 + 120, XD: x1 + 175 };
  }
  // the flavor "field" at x and time t: ν1m along (cos θm, −sin θm), ν2m along (sin θm, cos θm), ν2m lags by Δφ(x)
  function field(st, g, x, t) {
    const c = Math.cos(st.thm), s = Math.sin(st.thm);
    const f = Math.min(1, Math.max(0, (x - XC) / Math.max(1e-6, g.x1 - XC)));
    const ph = KX * x - t, dphi = x < XC ? 0 : st.dphi * f;
    const Ea = c * Math.cos(ph), Eb = s * Math.cos(ph - dphi);
    let eH = Ea * c + Eb * s, eV = -Ea * s + Eb * c;
    if (x > g.XA) eH = 0;
    return [eH, eV];
  }
  function draw(svg, st, t) {
    const g = geom(st), matter = Math.abs(st.A) >= 0.0025;
    let h = `<line class="bf-axis" x1="${XP - 30}" y1="${Y0}" x2="985" y2="${Y0}"/>`;
    const box = (x) => [[-1.15, -1.15], [1.15, -1.15], [1.15, 1.15], [-1.15, 1.15]].map(([a, b]) => scr(x, a, b));
    const b0 = box(XC), b1 = box(g.x1), show = st.Lr > 0.002;
    const faceCls = matter ? "bf-crystal-face nu-matter" : "bf-crystal-face";
    if (show) {
      h += `<polygon class="bf-crystal-side" points="${[b0[0], b1[0], b1[1], b0[1]].map(P).join(" ")}"/>`;
      h += `<polygon class="bf-crystal-side" points="${[b0[0], b1[0], b1[3], b0[3]].map(P).join(" ")}"/>`;
      h += `<polygon class="${faceCls}" points="${b0.map(P).join(" ")}"/>`;
    }
    // the source: νe along H
    h += quad(XP, 1.1, "bf-filter") + line(scr(XP, -0.9, 0), scr(XP, 0.9, 0), "bf-pass");
    let tips = "", spokes = "";
    for (let x = XP; x <= g.XD; x += 2) {
      const [eH, eV] = field(st, g, x, t), p = scr(x, eH, eV);
      tips += `${tips ? "L" : "M"}${P(p)}`;
      if ((x - XP) % 8 === 0) spokes += `M${x},${Y0}L${P(p)}`;
    }
    h += `<path class="bf-spoke" d="${spokes}"/><path class="bf-wave" d="${tips}"/>`;
    if (show) {
      h += `<polygon class="bf-crystal-side" points="${[b0[1], b1[1], b1[2], b0[2]].map(P).join(" ")}"/>`;
      h += `<polygon class="bf-crystal-side" points="${[b0[3], b1[3], b1[2], b0[2]].map(P).join(" ")}"/>`;
      h += `<polygon class="${faceCls}" points="${b1.map(P).join(" ")}"/>`;
    }
    // axes on the exit face: the vacuum ν1, ν2 (dashed in matter) and the matter ν1m, ν2m
    const ax = (ang, cls) => line(scr(g.x1, -1.05 * Math.cos(ang), -1.05 * Math.sin(ang)), scr(g.x1, 1.05 * Math.cos(ang), 1.05 * Math.sin(ang)), cls);
    h += line(scr(g.x1, -1.05, 0), scr(g.x1, 1.05, 0), "bf-href");
    h += ax(-THETA, matter ? "nu-vac" : "nu-ax") + ax(Math.PI / 2 - THETA, matter ? "nu-vac" : "nu-ax");
    if (matter) h += ax(-st.thm, "nu-ax") + ax(Math.PI / 2 - st.thm, "nu-ax");
    let arc = "";
    for (let i = 0; i <= 24; i += 1) { const a = -st.thm * i / 24; arc += `${i ? "L" : "M"}${P(scr(g.x1, 0.55 * Math.cos(a), 0.55 * Math.sin(a)))}`; }
    h += `<path class="bf-arc" d="${arc}"/>`;
    // the flavor state at the end and the detector of νμ
    h += quad(g.XO, 1.1, "bf-screen");
    let ell = "";
    for (let i = 0; i <= 120; i += 1) { const [eH, eV] = field(st, g, g.XO, KX * g.XO - 2 * Math.PI * i / 120); ell += `${i ? "L" : "M"}${P(scr(g.XO, eH, eV))}`; }
    h += `<path class="bf-ellipse" d="${ell}"/>`;
    { const [eH, eV] = field(st, g, g.XO, t), p = scr(g.XO, eH, eV); h += line([g.XO, Y0], p, "bf-evec") + `<circle class="bf-edot" cx="${p[0]}" cy="${p[1]}" r="5"/>`; }
    h += quad(g.XA, 1.1, "bf-filter") + line(scr(g.XA, 0, -0.9), scr(g.XA, 0, 0.9), "bf-pass");
    const pmu = Math.sin(2 * st.thm) ** 2 * Math.sin(st.dphi / 2) ** 2;
    h += `<rect class="bf-det" x="${g.XD}" y="${Y0 - 70}" width="34" height="140" rx="5"/>`;
    h += `<rect class="bf-det-fill" x="${g.XD + 4}" y="${Y0 + 66 - 132 * pmu}" width="26" height="${132 * pmu}" rx="3"/>`;
    svg.innerHTML = h;
    return g;
  }
  const LABELS = [
    { id: "src", html: "source \\(\\nu_e\\)" },
    { id: "vac", html: "vacuum, length \\(L\\)" },
    { id: "mat", html: "matter, length \\(L\\)" },
    { id: "n1", html: "\\(\\nu_1\\)", cls: "nu-l-vac" },
    { id: "n2", html: "\\(\\nu_2\\)", cls: "nu-l-vac" },
    { id: "m1", html: "\\(\\nu_{1m}\\)", cls: "nu-l-ax" },
    { id: "m2", html: "\\(\\nu_{2m}\\)", cls: "nu-l-ax" },
    { id: "th", html: "\\(\\theta_m\\)", cls: "bf-l-gold" },
    { id: "out", html: "flavor at \\(L\\)" },
    { id: "det", html: "detector \\(\\nu_\\mu\\)" },
    { id: "p", html: "\\(P_{e\\mu}\\)" }
  ];
  function setup(root) {
    if (root.dataset.nuReady) return;
    root.dataset.nuReady = "1";
    const svg = root.querySelector("svg.bf-scene"), plot = root.querySelector("svg.bf-plot");
    const st = { A: 0, Lr: 0.5 };
    const layer = root.querySelector(".bf-labels"), els = {};
    LABELS.forEach((it) => { const d = document.createElement("div"); d.className = "bf-label" + (it.cls ? " " + it.cls : ""); d.innerHTML = it.html; layer.appendChild(d); els[it.id] = d; });
    if (window.MathJax && MathJax.Hub) MathJax.Hub.Queue(["Typeset", MathJax.Hub, root]);
    const move = (id, x, y, on = true) => { const d = els[id]; d.style.left = `${x / 10}%`; d.style.top = `${y / 3}%`; d.style.display = on ? "" : "none"; };
    const out = (k, v) => { const e = root.querySelector(`[data-out="${k}"]`); if (e) e.textContent = v; };
    function update() {
      const m = mixing(st.A);
      st.R = m.R; st.thm = Math.abs(st.A) >= 0.0025 ? m.thm : THETA; st.dphi = 2 * Math.PI * st.R * st.Lr;
      const s2m = Math.sin(2 * st.thm) ** 2, pmu = s2m * Math.sin(st.dphi / 2) ** 2;
      out("A", st.A.toFixed(3)); out("L", st.Lr.toFixed(2));
      out("thm", `${(st.thm * 180 / Math.PI).toFixed(1)}°`); out("s2m", s2m.toFixed(2));
      out("lm", (1 / st.R).toFixed(2)); out("pmu", pmu.toFixed(2)); out("pee", (1 - pmu).toFixed(2));
      root.querySelectorAll("[data-a]").forEach((b) => b.classList.toggle("on", Math.abs(Number(b.dataset.a) - st.A) < 1e-3));
      // P(νe → νμ) against L: vacuum dashed, the chosen medium solid
      const X0 = 70, X1 = 980, T = 22, B = 140, xm = (x) => X0 + (X1 - X0) * x / LMAX, ym = (p) => B - (B - T) * p;
      let h = `<rect class="bf-frame" x="${X0}" y="${T}" width="${X1 - X0}" height="${B - T}"/>`;
      [0, 0.5, 1].forEach((p) => { h += `<line class="bf-grid" x1="${X0}" y1="${ym(p)}" x2="${X1}" y2="${ym(p)}"/><text x="${X0 - 10}" y="${ym(p) + 5}" text-anchor="end">${p}</text>`; });
      [0, 0.5, 1, 1.5, 2].forEach((x) => { h += `<line class="bf-grid" x1="${xm(x)}" y1="${T}" x2="${xm(x)}" y2="${B}"/><text x="${xm(x)}" y="${B + 20}" text-anchor="middle">${x}</text>`; });
      let dv = "", dm = "";
      for (let i = 0; i <= 400; i += 1) {
        const x = LMAX * i / 400;
        dv += `${i ? "L" : "M"}${xm(x).toFixed(1)},${ym(S2 * S2 * Math.sin(Math.PI * x) ** 2).toFixed(1)}`;
        dm += `${i ? "L" : "M"}${xm(x).toFixed(1)},${ym(s2m * Math.sin(Math.PI * st.R * x) ** 2).toFixed(1)}`;
      }
      h += `<path class="bf-ih" d="${dv}"/><path class="bf-iv" d="${dm}"/>`;
      h += `<line class="bf-now" x1="${xm(st.Lr)}" y1="${T}" x2="${xm(st.Lr)}" y2="${B}"/><circle class="bf-iv-dot" cx="${xm(st.Lr)}" cy="${ym(pmu)}" r="6"/>`;
      plot.innerHTML = h;
    }
    const sA = root.querySelector('[data-in="A"]'), sL = root.querySelector('[data-in="L"]');
    sA.addEventListener("input", () => { st.A = Number(sA.value); update(); });
    sL.addEventListener("input", () => { st.Lr = Number(sL.value); update(); });
    root.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => { st.A = Number(b.dataset.a); sA.value = st.A; update(); }));
    update();
    let t = 0, last = 0;
    function frame(now) {
      const sec = root.closest("section");
      if ((!sec || sec.classList.contains("present")) && root.offsetParent !== null) {
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        t += dt * 2 * Math.PI * 0.35;
        const g = draw(svg, st, t), matter = Math.abs(st.A) >= 0.0025;
        move("src", XP, 270); move("vac", (XC + Math.max(g.x1, XC + 80)) / 2, 270, !matter); move("mat", (XC + Math.max(g.x1, XC + 80)) / 2, 270, matter);
        const lab = (ang, k) => scr(g.x1, 1.3 * Math.cos(ang) * k, 1.3 * Math.sin(ang) * k);
        move("n1", ...lab(-THETA, 1)); move("n2", ...lab(Math.PI / 2 - THETA, 1));
        move("m1", ...lab(-st.thm, 1.12), matter); move("m2", ...lab(Math.PI / 2 - st.thm, 1.12), matter);
        move("th", ...scr(g.x1, 0.75 * Math.cos(-st.thm / 2), 0.75 * Math.sin(-st.thm / 2)));
        move("out", g.XO, 270); move("det", g.XA + 10, 270); move("p", g.XD + 17, 72);
      }
      last = now;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function init() { document.querySelectorAll(".nu-crystal").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
