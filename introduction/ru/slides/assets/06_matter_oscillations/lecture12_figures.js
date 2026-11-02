// Иллюстрации лекции 12: углы и расщепление в веществе, три базиса, режимы слоя, диаграммы обмена.
// Подписи набраны в TeX через window.L12 (l12_tex.js).
(() => {
  "use strict";

  const { label, plot, model } = window.L12;
  const rad = (d) => d * Math.PI / 180;
  const deg = (r) => r * 180 / Math.PI;
  const fmt = (x, n = 2) => (Number.isFinite(x) ? x.toFixed(n) : "—").replace("-", "−");

  const q = (root, sel) => root.querySelector(sel);

  // ---------- Угол смешивания и расщепление масс как функции потенциала ----------
  function initMixing(root) {
    const thetaInput = q(root, '[data-control="theta"]');
    const pAngle = plot(q(root, '[data-plot="angle"]'));
    const pSplit = plot(q(root, '[data-plot="split"]'));
    const lab = {
      ax: label(pAngle.lab, { tex: "A=V/\\Delta", w: 100, h: 28 }),
      ay: label(pAngle.lab, { tex: "\\theta_m", w: 60, h: 28, rotate: -90 }),
      aTheta: label(pAngle.lab, { tex: "\\theta", w: 40, h: 26, cls: "is-gold", anchor: "start" }),
      sx: label(pSplit.lab, { tex: "A=V/\\Delta", w: 100, h: 28 }),
      sy: label(pSplit.lab, { tex: "\\Delta m_m^2/\\Delta m^2", w: 170, h: 28, rotate: -90 }),
      sMin: label(pSplit.lab, { tex: "\\sin2\\theta", w: 80, h: 26, cls: "is-gold", anchor: "start" })
    };

    function update() {
      const thetaDeg = Number(thetaInput.value);
      const theta = rad(thetaDeg);
      const { s2, c2 } = model.mix(theta, 0);
      q(root, '[data-out="theta"]').textContent = fmt(thetaDeg, 1);

      // θm(A)
      let p = pAngle;
      p.set({ left: 56, right: 16, top: 14, bottom: 48, xmin: -3, xmax: 5, ymin: 0, ymax: 90 });
      const pts = [];
      for (let i = 0; i <= 400; i += 1) {
        const a = p.xmin + (p.xmax - p.xmin) * i / 400;
        pts.push([a, deg(model.mix(theta, a).thetaM)]);
      }
      let html = `<rect class="anti-band" x="${p.x(-3)}" y="${p.top}" width="${p.x(0) - p.x(-3)}" height="${p.h - p.top - p.bottom}"/>`;
      html += p.frame([-3, -2, -1, 0, 1, 2, 3, 4, 5], [0, 45, 90], (v) => `${v}°`);
      html += `<text class="band-note" x="${(p.x(-3) + p.x(0)) / 2}" y="${p.top + 18}" text-anchor="middle">антинейтрино</text>`;
      html += `<line class="resonance-line" x1="${p.x(c2)}" y1="${p.top}" x2="${p.x(c2)}" y2="${p.h - p.bottom}"/>`;
      html += `<text class="resonance-label" x="${p.x(c2) + 6}" y="${p.top + 18}">резонанс</text>`;
      html += `<line class="level-line" x1="${p.left}" y1="${p.y(thetaDeg)}" x2="${p.x(0)}" y2="${p.y(thetaDeg)}"/>`;
      html += `<line class="level-line" x1="${p.left}" y1="${p.y(45)}" x2="${p.x(c2)}" y2="${p.y(45)}"/>`;
      html += `<path class="matter-line" d="${p.path(pts)}"/>`;
      html += `<circle class="state-dot" cx="${p.x(0)}" cy="${p.y(thetaDeg)}" r="5.5"/>`;
      html += `<circle class="state-dot" cx="${p.x(c2)}" cy="${p.y(45)}" r="5.5"/>`;
      html += `<text class="point-note" x="${p.x(0) + 10}" y="${p.y(thetaDeg) + 22}">вакуум</text>`;
      p.dyn.innerHTML = html;
      lab.ax.move((p.left + p.w - p.right) / 2, p.h - 10);
      lab.ay.move(16, (p.top + p.h - p.bottom) / 2);
      lab.aTheta.move(p.left + 10, p.y(thetaDeg) - 14);
      lab.aTheta.show(thetaDeg > 6);

      // Δm_m²/Δm² = R(A)
      p = pSplit;
      p.set({ left: 56, right: 16, top: 14, bottom: 48, xmin: -3, xmax: 5, ymin: 0, ymax: 5.5 });
      const R = [], asym = [];
      for (let i = 0; i <= 400; i += 1) {
        const a = p.xmin + (p.xmax - p.xmin) * i / 400;
        R.push([a, model.mix(theta, a).R]);
        asym.push([a, Math.abs(a - c2)]);
      }
      html = `<rect class="anti-band" x="${p.x(-3)}" y="${p.top}" width="${p.x(0) - p.x(-3)}" height="${p.h - p.top - p.bottom}"/>`;
      html += p.frame([-3, -2, -1, 0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5]);
      html += `<line class="resonance-line" x1="${p.x(c2)}" y1="${p.top}" x2="${p.x(c2)}" y2="${p.h - p.bottom}"/>`;
      html += `<path class="bare-branch" d="${p.path(asym)}"/>`;
      html += `<line class="level-line" x1="${p.left}" y1="${p.y(1)}" x2="${p.x(0)}" y2="${p.y(1)}"/>`;
      html += `<path class="matter-line" d="${p.path(R)}"/>`;
      html += `<circle class="state-dot" cx="${p.x(0)}" cy="${p.y(1)}" r="5.5"/>`;
      html += `<circle class="state-dot" cx="${p.x(c2)}" cy="${p.y(s2)}" r="5.5"/>`;
      html += `<text class="point-note" x="${p.x(0)}" y="${p.y(1) - 14}" text-anchor="middle">вакуум</text>`;
      p.dyn.innerHTML = html;
      lab.sx.move((p.left + p.w - p.right) / 2, p.h - 10);
      lab.sy.move(16, (p.top + p.h - p.bottom) / 2);
      lab.sMin.move(p.x(c2) + 12, p.y(s2) + 20);
    }

    thetaInput.addEventListener("input", update);
    update();
  }

  // ---------- Три базиса на одной плоскости ----------
  function arrow(cx, cy, dx, dy, cls) {
    const x2 = cx + dx, y2 = cy + dy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const hx = x2 - 14 * ux, hy = y2 - 14 * uy;
    return `<line class="${cls}" x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}"/>` +
      `<path class="${cls} head" d="M${x2},${y2} L${hx - 6 * uy},${hy + 6 * ux} L${hx + 6 * uy},${hy - 6 * ux} Z"/>`;
  }

  function arc(cx, cy, r, from, to, cls) {
    // углы отсчитываются от оси ν_x (вверх) по часовой стрелке, радианы
    const pt = (a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    const [x1, y1] = pt(from), [x2, y2] = pt(to);
    return `<path class="${cls}" d="M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}"/>`;
  }

  function initBases(root) {
    const thetaInput = q(root, '[data-control="theta"]');
    const aInput = q(root, '[data-control="A"]');
    const svg = q(root, '[data-plot="bases"]');
    const p = plot(svg);
    p.set({});
    const cx = 150, cy = 330, Rr = 245;
    const lab = {
      e: label(p.lab, { tex: "\\nu_e", w: 70, h: 30, cls: "is-red", anchor: "start" }),
      x: label(p.lab, { tex: "\\nu_x", w: 70, h: 30, cls: "is-red" }),
      n1: label(p.lab, { tex: "\\nu_1", w: 70, h: 30, cls: "is-blue", anchor: "start" }),
      n2: label(p.lab, { tex: "\\nu_2", w: 70, h: 30, cls: "is-blue" }),
      n1m: label(p.lab, { tex: "\\nu_{1m}", w: 80, h: 30, cls: "is-gold", anchor: "start" }),
      n2m: label(p.lab, { tex: "\\nu_{2m}", w: 80, h: 30, cls: "is-gold" }),
      th: label(p.lab, { tex: "\\theta", w: 40, h: 28, cls: "is-blue" }),
      thm: label(p.lab, { tex: "\\theta_m", w: 50, h: 28, cls: "is-gold" }),
      al: label(p.lab, { tex: "\\alpha", w: 40, h: 28, cls: "is-cyan" })
    };
    const val = (name, v) => { q(root, `[data-v="${name}"]`).textContent = v; };

    function update() {
      const thetaDeg = Number(thetaInput.value);
      const A = Number(aInput.value);
      const theta = rad(thetaDeg);
      const m = model.mix(theta, A);
      const tm = m.thetaM;
      const al = tm - theta;
      q(root, '[data-out="theta"]').textContent = fmt(thetaDeg, 1);
      q(root, '[data-out="A"]').textContent = fmt(A, 2);

      let html = "";
      html += arrow(cx, cy, Rr, 0, "ax flavor");
      html += arrow(cx, cy, 0, -Rr, "ax flavor");
      html += arrow(cx, cy, Rr * Math.cos(theta), Rr * Math.sin(theta), "ax vacuum");
      html += arrow(cx, cy, Rr * Math.sin(theta), -Rr * Math.cos(theta), "ax vacuum");
      html += arrow(cx, cy, 0.92 * Rr * Math.cos(tm), 0.92 * Rr * Math.sin(tm), "ax matter");
      html += arrow(cx, cy, 0.92 * Rr * Math.sin(tm), -0.92 * Rr * Math.cos(tm), "ax matter");
      html += arc(cx, cy, 80, 0, theta, "arc vacuum");
      html += arc(cx, cy, 120, 0, tm, "arc matter");
      if (Math.abs(al) > 0.02) html += arc(cx, cy, 160, Math.min(theta, tm), Math.max(theta, tm), "arc diff");
      p.dyn.innerHTML = html;

      lab.e.move(cx + Rr + 8, cy);
      lab.x.move(cx, cy - Rr - 18);
      lab.n1.move(cx + Rr * Math.cos(theta) + 6, cy + Rr * Math.sin(theta) + 14);
      lab.n2.move(cx + Rr * Math.sin(theta) + 22, cy - Rr * Math.cos(theta) - 12);
      lab.n1m.move(cx + 0.92 * Rr * Math.cos(tm) + 6, cy + 0.92 * Rr * Math.sin(tm) + 18);
      lab.n2m.move(cx + 0.92 * Rr * Math.sin(tm) + 30, cy - 0.92 * Rr * Math.cos(tm) + 10);
      const mid = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
      let [lx, ly] = mid(92, theta / 2);
      lab.th.move(lx + 14, ly - 6);
      [lx, ly] = mid(132, tm / 2);
      lab.thm.move(lx + 18, ly);
      [lx, ly] = mid(172, (theta + tm) / 2);
      lab.al.move(lx + 12, ly - 4);
      lab.al.show(Math.abs(al) > 0.08);

      const c = Math.cos(theta), s = Math.sin(theta), cm = Math.cos(tm), sm = Math.sin(tm);
      val("ce", fmt(c)); val("se", fmt(s));
      val("cx", fmt(-s)); val("sx", fmt(c));
      val("cem", fmt(cm)); val("sem", fmt(sm));
      val("cxm", fmt(-sm)); val("sxm", fmt(cm));
      val("alpha", `${fmt(deg(al), 1)}°`);
      val("thetaM", `${fmt(deg(tm), 1)}°`);
      val("sa", fmt(Math.sin(al)));
      val("ca", fmt(Math.cos(al)));
      val("ca2", fmt(Math.cos(al)));
      val("masa", fmt(-Math.sin(al)));
    }

    [thetaInput, aInput].forEach((i) => i.addEventListener("input", update));
    root.querySelectorAll("[data-preset]").forEach((b) => {
      b.addEventListener("click", () => {
        const k = b.dataset.preset;
        const c2 = Math.cos(2 * rad(Number(thetaInput.value)));
        aInput.value = k === "vacuum" ? "0" : k === "resonance" ? String(c2) : k === "dense" ? "5" : "-1.5";
        update();
      });
    });
    update();
  }

  // ---------- Четыре режима: P(L) в вакууме и в слое ----------
  function initRegimes(root) {
    const thetaInput = q(root, '[data-control="theta"]');
    const cells = [...root.querySelectorAll("[data-regime]")];
    const plots = cells.map((cell) => {
      const p = plot(q(cell, "svg"));
      return { cell, p, x: label(p.lab, { tex: "L/L_{\\rm vac}", w: 100, h: 26 }), y: label(p.lab, { tex: "P_{e\\to x}", w: 80, h: 26, rotate: -90 }) };
    });
    const X = 3;

    function update() {
      const thetaDeg = Number(thetaInput.value);
      const theta = rad(thetaDeg);
      q(root, '[data-out="theta"]').textContent = fmt(thetaDeg, 1);
      const c2 = Math.cos(2 * theta);
      plots.forEach(({ cell, p, x, y }) => {
        const k = cell.dataset.regime;
        const A = k === "vacuum" ? 0 : k === "resonance" ? c2 : k === "dense" ? 4 : -1.5;
        const m = model.mix(theta, A);
        p.set({ left: 56, right: 12, top: 12, bottom: 52, xmin: 0, xmax: X, ymin: 0, ymax: 1 });
        const mat = [], vac = [];
        for (let i = 0; i <= 300; i += 1) {
          const xx = X * i / 300;
          mat.push([xx, m.amp * Math.sin(Math.PI * m.R * xx) ** 2]);
          vac.push([xx, m.s2 ** 2 * Math.sin(Math.PI * xx) ** 2]);
        }
        let html = p.frame([0, 1, 2, 3], [0, 0.5, 1]);
        html += `<path class="vacuum-line" d="${p.path(vac)}"/>`;
        html += `<path class="envelope-line" d="M${p.x(0)},${p.y(m.amp)} L${p.x(X)},${p.y(m.amp)}"/>`;
        html += `<path class="matter-line" d="${p.path(mat)}"/>`;
        p.dyn.innerHTML = html;
        x.move((p.left + p.w - p.right) / 2, p.h - 12);
        y.move(14, (p.top + p.h - p.bottom) / 2);
        q(cell, '[data-v="amp"]').textContent = fmt(m.amp, 2);
        q(cell, '[data-v="period"]').textContent = fmt(1 / m.R, 2);
      });
    }

    thetaInput.addEventListener("input", update);
    update();
  }

  // ---------- Диаграммы обмена бозоном ----------
  function wavy(x, y1, y2, amp, waves) {
    const n = 60;
    let d = "";
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      const y = y1 + (y2 - y1) * t;
      const xx = x + amp * Math.sin(2 * Math.PI * waves * t);
      d += `${i ? "L" : "M"}${xx.toFixed(1)},${y.toFixed(1)} `;
    }
    return `<path class="boson" d="${d}"/>`;
  }

  function mid(x1, y1, x2, y2, cls) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    return `<path class="${cls} head" d="M${mx + 8 * ux},${my + 8 * uy} L${mx - 6 * ux - 6 * uy},${my - 6 * uy + 6 * ux} L${mx - 6 * ux + 6 * uy},${my - 6 * uy - 6 * ux} Z"/>`;
  }

  function initFeynman(root) {
    const kind = root.dataset.l12Fig === "feynman-cc" ? "cc" : "nc";
    const svg = q(root, "svg");
    const p = plot(svg);
    const ax = 190, ay = 62, by = 168; // вершины сверху и снизу
    let html = "";
    const seg = (x1, y1, x2, y2) => `<line class="fermion" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${mid(x1, y1, x2, y2, "fermion")}`;
    html += seg(30, ay, ax, ay) + seg(ax, ay, 350, ay);
    html += seg(30, by, ax, by) + seg(ax, by, 350, by);
    html += wavy(ax, ay, by, 8, 3);
    html += `<circle class="vertex" cx="${ax}" cy="${ay}" r="4"/><circle class="vertex" cx="${ax}" cy="${by}" r="4"/>`;
    p.dyn.innerHTML = html;
    const tex = kind === "cc"
      ? { tl: "\\nu_e", tr: "e^-", bl: "e^-", br: "\\nu_e", b: "W^+" }
      : { tl: "\\nu_e", tr: "\\nu_e", bl: "f", br: "f", b: "Z^0" };
    label(p.lab, { tex: tex.tl, x: 30, y: ay - 18, w: 60, h: 26, anchor: "start" });
    label(p.lab, { tex: tex.tr, x: 350, y: ay - 18, w: 60, h: 26, anchor: "end" });
    label(p.lab, { tex: tex.bl, x: 30, y: by + 20, w: 60, h: 26, anchor: "start" });
    label(p.lab, { tex: tex.br, x: 350, y: by + 20, w: 60, h: 26, anchor: "end" });
    label(p.lab, { tex: tex.b, x: ax + 24, y: (ay + by) / 2, w: 60, h: 26, anchor: "start", cls: "is-gold" });
  }

  function init() {
    document.querySelectorAll("[data-l12-fig]").forEach((root) => {
      if (root.dataset.ready === "1") return;
      root.dataset.ready = "1";
      const kind = root.dataset.l12Fig;
      if (kind === "mixing") initMixing(root);
      else if (kind === "bases") initBases(root);
      else if (kind === "regimes") initRegimes(root);
      else if (kind.startsWith("feynman")) initFeynman(root);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  if (window.Reveal && typeof window.Reveal.on === "function") window.Reveal.on("ready", init);
})();
