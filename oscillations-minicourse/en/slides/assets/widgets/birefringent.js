// Light through a birefringent plate between a polarizer H and an analyzer V.
// Calcite at 589.3 nm, from the dispersion formulas of G. Ghosh, Opt. Commun. 163, 95 (1999):
// n_o = 1.6583, n_e = 1.4861, so the extraordinary wave (along the optic axis) is the fast one;
// Δn = 0.1722 and the full-wave thickness L_w = λ/Δn = 3.42 μm.
// Field behind a plate of thickness L whose fast axis makes the angle θ with H (I₀ = 1 behind the polarizer):
//   E_f = cos θ cos(kx − ωt),  E_s = −sin θ cos(kx − ωt − Δφ),  Δφ = 2π Δn L / λ,
//   E_H = E_f cos θ − E_s sin θ,  E_V = E_f sin θ + E_s cos θ,  ⟨E_V²⟩/⟨E²⟩ = sin²2θ sin²(Δφ/2).
// The drawing is schematic: wavelengths and the thickness of the plate are not to scale.
(function () {
  "use strict";
  if (window.Birefringent) return;
  const LAMBDA_NM = 589.3, N_O = 1.6583, N_E = 1.4861, DN = N_O - N_E, LW_UM = LAMBDA_NM / 1000 / DN;
  const svgNS = "http://www.w3.org/2000/svg";
  // scene geometry (viewBox 1000 × 300): the beam along x, V up, H drawn into the depth
  const Y0 = 160, A = 62, DH = [-0.5, 0.36], XP = 150, XC = 290, WPX = 150, XO = 735, XA = 835, XD = 935, KX = 2 * Math.PI / 64;
  const scr = (x, eH, eV, a = A) => [x + a * eH * DH[0], Y0 + a * (eH * DH[1] - eV)];
  const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  function quad(x, a, cls) {     // a square in the transverse plane at x, half-size a (in units of A)
    const c = [[-a, -a], [a, -a], [a, a], [-a, a]].map(([h, v]) => P(scr(x, h, v)));
    return `<polygon class="${cls}" points="${c.join(" ")}"/>`;
  }
  function field(st, x, t) {
    const c = Math.cos(st.theta), s = Math.sin(st.theta);
    const x1 = XC + WPX * st.Lr;
    const f = Math.min(1, Math.max(0, (x - XC) / Math.max(1e-6, x1 - XC)));
    const dphi = x < XC ? 0 : st.dphi * f;
    const ph = KX * x - t;
    const Ef = c * Math.cos(ph), Es = -s * Math.cos(ph - dphi);
    let eH = Ef * c - Es * s, eV = Ef * s + Es * c;
    if (x > XA) eH = 0;
    return [eH, eV];
  }
  function draw(svg, st, t) {
    const c = Math.cos(st.theta), s = Math.sin(st.theta), x1 = XC + WPX * st.Lr;
    let h = "";
    // beam axis
    h += `<line class="bf-axis" x1="20" y1="${Y0}" x2="985" y2="${Y0}"/>`;
    // unpolarized light before the polarizer: a few random directions
    for (let k = 0; k < 6; k += 1) {
      const a = k * Math.PI / 6 + 0.3, x = 40 + 16 * k;
      const p1 = scr(x, 0.6 * Math.cos(a), 0.6 * Math.sin(a)), p2 = scr(x, -0.6 * Math.cos(a), -0.6 * Math.sin(a));
      h += `<line class="bf-unpol" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}"/>`;
    }
    // the crystal: back face, field, front face
    const box = (x) => [[-1.15, -1.15], [1.15, -1.15], [1.15, 1.15], [-1.15, 1.15]].map(([a, b]) => scr(x, a, b));
    const b0 = box(XC), b1 = box(x1);
    if (st.Lr > 0.002) {
      h += `<polygon class="bf-crystal-side" points="${[b0[0], b1[0], b1[1], b0[1]].map(P).join(" ")}"/>`;
      h += `<polygon class="bf-crystal-side" points="${[b0[0], b1[0], b1[3], b0[3]].map(P).join(" ")}"/>`;
      h += `<polygon class="bf-crystal-face" points="${b0.map(P).join(" ")}"/>`;
    }
    // polarizer H
    h += quad(XP, 1.1, "bf-filter");
    { const p1 = scr(XP, -0.9, 0), p2 = scr(XP, 0.9, 0); h += `<line class="bf-pass" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}"/>`; }
    // the field along the beam at time t: tips and spokes
    let tips = "", spokes = "";
    for (let x = XP; x <= XD; x += 2) {
      const [eH, eV] = field(st, x, t), p = scr(x, eH, eV);
      tips += `${tips ? "L" : "M"}${P(p)}`;
      if ((x - XP) % 8 === 0) spokes += `M${x},${Y0}L${P(p)}`;
    }
    h += `<path class="bf-spoke" d="${spokes}"/><path class="bf-wave" d="${tips}"/>`;
    // the crystal: far faces over the field, with the axes on the exit face
    if (st.Lr > 0.002) {
      h += `<polygon class="bf-crystal-side" points="${[b0[1], b1[1], b1[2], b0[2]].map(P).join(" ")}"/>`;
      h += `<polygon class="bf-crystal-side" points="${[b0[3], b1[3], b1[2], b0[2]].map(P).join(" ")}"/>`;
      h += `<polygon class="bf-crystal-face" points="${b1.map(P).join(" ")}"/>`;
    }
    const ax = (x, cos, sin, cls) => { const p1 = scr(x, -1.05 * cos, -1.05 * sin), p2 = scr(x, 1.05 * cos, 1.05 * sin); return `<line class="${cls}" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}"/>`; };
    h += ax(x1, c, s, "bf-fast") + ax(x1, -s, c, "bf-slow");
    // the H direction on the entry face and the angle θ between H and the fast axis
    h += ax(x1, 1, 0, "bf-href");
    let arc = "";
    for (let i = 0; i <= 24; i += 1) { const a = st.theta * i / 24; arc += `${i ? "L" : "M"}${P(scr(x1, 0.55 * Math.cos(a), 0.55 * Math.sin(a)))}`; }
    h += `<path class="bf-arc" d="${arc}"/>`;
    // output: the polarization ellipse and the field vector now
    h += quad(XO, 1.1, "bf-screen");
    let ell = "";
    for (let i = 0; i <= 120; i += 1) {
      const [eH, eV] = field(st, XO, KX * XO - 2 * Math.PI * i / 120);
      ell += `${i ? "L" : "M"}${P(scr(XO, eH, eV))}`;
    }
    h += `<path class="bf-ellipse" d="${ell}"/>`;
    { const [eH, eV] = field(st, XO, t), p = scr(XO, eH, eV); h += `<line class="bf-evec" x1="${XO}" y1="${Y0}" x2="${p[0]}" y2="${p[1]}"/><circle class="bf-edot" cx="${p[0]}" cy="${p[1]}" r="5"/>`; }
    // analyzer V and the detector
    h += quad(XA, 1.1, "bf-filter");
    { const p1 = scr(XA, 0, -0.9), p2 = scr(XA, 0, 0.9); h += `<line class="bf-pass" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}"/>`; }
    const iv = Math.sin(2 * st.theta) ** 2 * Math.sin(st.dphi / 2) ** 2;
    h += `<rect class="bf-det" x="${XD}" y="${Y0 - 70}" width="34" height="140" rx="5"/>`;
    h += `<rect class="bf-det-fill" x="${XD + 4}" y="${Y0 + 66 - 132 * iv}" width="26" height="${132 * iv}" rx="3"/>`;
    svg.innerHTML = h;
    return { x1 };
  }
  function derived(st) {
    const dphi = 2 * Math.PI * st.Lr;                       // Lr = L / L_w
    const s2 = Math.sin(2 * st.theta);
    const iv = s2 * s2 * Math.sin(dphi / 2) ** 2;
    const chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, s2 * Math.sin(dphi))));   // ellipticity angle
    const ba = Math.abs(Math.tan(chi));
    return { dphi, iv, ih: 1 - iv, ba, kind: ba < 0.02 ? "linear" : ba > 0.98 ? "circular" : "elliptical" };
  }
  // labels typeset by MathJax once, then only moved
  function overlay(root, items) {
    const layer = root.querySelector(".bf-labels");
    const els = {};
    items.forEach((it) => {
      const d = document.createElement("div");
      d.className = "bf-label" + (it.cls ? " " + it.cls : "");
      d.innerHTML = it.html;
      layer.appendChild(d);
      els[it.id] = d;
    });
    if (window.MathJax && MathJax.Hub) MathJax.Hub.Queue(["Typeset", MathJax.Hub, layer]);
    return (id, x, y) => { const d = els[id]; if (d) { d.style.left = `${x / 10}%`; d.style.top = `${y / 3}%`; } };
  }
  const LABELS = [
    { id: "pol", html: "polarizer \\(H\\)" },
    { id: "cry", html: "crystal: thickness \\(L\\)" },
    { id: "th", html: "\\(\\theta\\)", cls: "bf-l-gold" },
    { id: "fast", html: "fast", cls: "bf-l-blue" },
    { id: "slow", html: "slow", cls: "bf-l-orange" },
    { id: "out", html: "output" },
    { id: "ana", html: "analyzer \\(V\\)" },
    { id: "det", html: "\\(I_V\\)" }
  ];
  function place(move, st, x1) {
    const xf = x1;
    move("pol", XP, 270); move("cry", (XC + Math.max(x1, XC + 60)) / 2 + 20, 270);
    const pt = scr(xf, 0.38 * Math.cos(st.theta / 2), 0.38 * Math.sin(st.theta / 2)); move("th", pt[0], pt[1]);
    const pf = scr(xf, 1.25 * Math.cos(st.theta), 1.25 * Math.sin(st.theta)); move("fast", pf[0], pf[1]);
    const ps = scr(xf, -1.25 * Math.sin(st.theta), 1.25 * Math.cos(st.theta)); move("slow", ps[0], ps[1]);
    move("out", XO, 270); move("ana", XA + 10, 270); move("det", XD + 17, 72);
  }
  function running(root) { const sec = root.closest("section"); return !sec || sec.classList.contains("present"); }

  function setup(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = "1";
    const svg = root.querySelector("svg.bf-scene");
    const st = { theta: Number(root.dataset.theta || 30) * Math.PI / 180, Lr: Number(root.dataset.lr || 0.35) };
    st.dphi = 2 * Math.PI * st.Lr;
    const move = overlay(root, LABELS);
    const lab = root.querySelector(".bf-controls");
    const out = (k, v) => { const e = root.querySelector(`[data-out="${k}"]`); if (e) e.textContent = v; };
    const plot = root.querySelector("svg.bf-plot");
    const LMAX = 2.5;                                       // in units of L_w
    function drawPlot() {
      if (!plot) return;
      const X0 = 70, X1 = 980, T = 22, B = 140, xm = (lr) => X0 + (X1 - X0) * lr / LMAX, ym = (p) => B - (B - T) * p;
      const s2 = Math.sin(2 * st.theta) ** 2;
      let h = `<rect class="bf-frame" x="${X0}" y="${T}" width="${X1 - X0}" height="${B - T}"/>`;
      [0, 0.5, 1].forEach((p) => { h += `<line class="bf-grid" x1="${X0}" y1="${ym(p)}" x2="${X1}" y2="${ym(p)}"/><text x="${X0 - 10}" y="${ym(p) + 5}" text-anchor="end">${p}</text>`; });
      for (let um = 0; um <= LMAX * LW_UM + 1e-9; um += 1) {
        const x = xm(um / LW_UM);
        h += `<line class="bf-grid" x1="${x}" y1="${T}" x2="${x}" y2="${B}"/><text x="${x}" y="${B + 20}" text-anchor="middle">${um}</text>`;
      }
      [[0.25, "λ/4"], [0.5, "λ/2"], [1, "λ"], [2, "2λ"]].forEach(([lr, t]) => {
        h += `<line class="bf-mark" x1="${xm(lr)}" y1="${T}" x2="${xm(lr)}" y2="${B}"/><text class="bf-mark-t" x="${xm(lr)}" y="${T - 6}" text-anchor="middle">${t}</text>`;
      });
      let dv = "", dh = "";
      for (let i = 0; i <= 400; i += 1) {
        const lr = LMAX * i / 400, iv = s2 * Math.sin(Math.PI * lr) ** 2;
        dv += `${i ? "L" : "M"}${xm(lr).toFixed(1)},${ym(iv).toFixed(1)}`;
        dh += `${i ? "L" : "M"}${xm(lr).toFixed(1)},${ym(1 - iv).toFixed(1)}`;
      }
      const d = derived(st);
      h += `<path class="bf-ih" d="${dh}"/><path class="bf-iv" d="${dv}"/>`;
      h += `<line class="bf-now" x1="${xm(st.Lr)}" y1="${T}" x2="${xm(st.Lr)}" y2="${B}"/><circle class="bf-iv-dot" cx="${xm(st.Lr)}" cy="${ym(d.iv)}" r="6"/>`;
      h += `<text x="${(X0 + X1) / 2}" y="${B + 44}" text-anchor="middle">thickness L [μm]; plates: λ/4, λ/2, λ of retardation</text>`;
      plot.innerHTML = h;
    }
    function readouts() {
      const d = derived(st);
      out("L", `${(st.Lr * LW_UM).toFixed(2)} μm`);
      out("Llam", (st.Lr * LW_UM * 1000 / LAMBDA_NM).toFixed(2));
      out("dphi", `${(d.dphi * 180 / Math.PI).toFixed(0)}°`);
      out("theta", `${(st.theta * 180 / Math.PI).toFixed(1)}°`);
      out("kind", d.kind);
      out("ba", d.ba.toFixed(2));
      out("ih", d.ih.toFixed(2));
      out("iv", d.iv.toFixed(2));
    }
    if (lab) {
      const sL = lab.querySelector('[data-in="L"]'), sT = lab.querySelector('[data-in="theta"]');
      sL.max = (LMAX * LW_UM).toFixed(2);
      const setL = (um) => { st.Lr = Math.max(0, um) / LW_UM; st.dphi = 2 * Math.PI * st.Lr; sL.value = um; readouts(); drawPlot(); };
      const setT = (deg) => { st.theta = deg * Math.PI / 180; sT.value = deg; readouts(); drawPlot(); };
      sL.addEventListener("input", () => setL(Number(sL.value)));
      sT.addEventListener("input", () => setT(Number(sT.value)));
      lab.querySelectorAll("[data-plate]").forEach((b) => b.addEventListener("click", () => setL(Number(b.dataset.plate) * LW_UM)));
      lab.querySelectorAll("[data-theta]").forEach((b) => b.addEventListener("click", () => setT(Number(b.dataset.theta))));
      setL(st.Lr * LW_UM); setT(st.theta * 180 / Math.PI);
    }
    let t = 0, last = 0;
    function frame(now) {
      if (running(root) && root.offsetParent !== null) {
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        t += dt * 2 * Math.PI * 0.35;                       // slow: 0.35 turns of the field per second
        const g = draw(svg, st, t);
        place(move, st, g.x1);
      }
      last = now;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  window.Birefringent = { LW_UM, LAMBDA_NM, N_O, N_E };
  function init() { document.querySelectorAll(".bf-widget:not(.nu-crystal)").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
