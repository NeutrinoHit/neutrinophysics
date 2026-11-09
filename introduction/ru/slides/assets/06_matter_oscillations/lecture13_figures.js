// Рисунки блока «Несколько слоёв» лекции 13: произвольный ступенчатый профиль,
// профиль параметрического усиления с вероятностью вдоль пути, одно и два зеркала, сфера Блоха.
// Подписи в TeX и оператор слоя берутся из window.L12 (l12_tex.js).
(() => {
  "use strict";

  const { label, plot, model } = window.L12;
  const rad = (d) => d * Math.PI / 180;
  const q = (root, sel) => root.querySelector(sel);

  // комплексное умножение матрицы 2×2 (пары [re, im]) на вектор
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const apply = (S, psi) => [
    cadd(cmul(S[0][0], psi[0]), cmul(S[0][1], psi[1])),
    cadd(cmul(S[1][0], psi[0]), cmul(S[1][1], psi[1]))
  ];

  // Вероятность P(e→x) вдоль профиля из слоёв {A, w}; w в единицах L_vac.
  function curve(theta, layers, perUnit = 220) {
    const pts = [];
    let psi = [[1, 0], [0, 0]];
    let x0 = 0;
    layers.forEach((l, k) => {
      const n = Math.max(6, Math.ceil(l.w * perUnit));
      for (let i = (k ? 1 : 0); i <= n; i += 1) {
        const ps = apply(model.layer(theta, l.A, l.w * i / n), psi);
        pts.push([x0 + l.w * i / n, ps[1][0] ** 2 + ps[1][1] ** 2]);
      }
      psi = apply(model.layer(theta, l.A, l.w), psi);
      x0 += l.w;
    });
    return pts;
  }

  function ticks(T, step) {
    const t = [];
    for (let v = 0; v <= T + 1e-9; v += step) t.push(+v.toFixed(3));
    return t;
  }

  // ---------- Произвольный ступенчатый профиль: S_total = S_N ⋯ S_1 ----------
  function initSteps(root) {
    const p = plot(q(root, "svg"));
    const layers = [
      { A: 0.9, w: 1.2 }, { A: 2.6, w: 0.8 }, { A: 1.5, w: 1.3 },
      { A: 3.4, w: 0.7 }, { A: 1.1, w: 1.1 }, { A: 2.2, w: 0.9 }
    ];
    const names = ["S_1", "S_2", "S_3", "\\cdots", "S_{N-1}", "S_N"];
    const T = layers.reduce((s, l) => s + l.w, 0);
    p.set({ left: 70, right: 24, top: 46, bottom: 34, xmin: 0, xmax: T, ymin: 0, ymax: 4 });
    let html = `<line class="axis" x1="${p.left}" y1="${p.y(0)}" x2="${p.w - p.right}" y2="${p.y(0)}"/>`;
    html += `<line class="axis" x1="${p.left}" y1="${p.top - 10}" x2="${p.left}" y2="${p.y(0)}"/>`;
    let x0 = 0;
    layers.forEach((l, i) => {
      const xa = p.x(x0), xb = p.x(x0 + l.w), y = p.y(l.A);
      html += `<rect class="step-bar" x="${xa}" y="${y}" width="${xb - xa}" height="${p.y(0) - y}"/>`;
      html += `<line class="step-top" x1="${xa}" y1="${y}" x2="${xb}" y2="${y}"/>`;
      label(p.lab, { tex: names[i], x: (xa + xb) / 2, y: p.y(0) - 20, w: 90, h: 30 });
      x0 += l.w;
    });
    // направление распространения
    const ya = 20, xa = p.left + 10, xb = p.w - p.right - 10;
    html += `<line class="flow-line" x1="${xa}" y1="${ya}" x2="${xb - 12}" y2="${ya}"/>`;
    html += `<path class="flow-head" d="M${xb},${ya} L${xb - 14},${ya - 7} L${xb - 14},${ya + 7} Z"/>`;
    p.dyn.innerHTML = html;
    label(p.lab, { tex: "\\nu_e", x: xa + 4, y: ya + 22, w: 50, h: 28, anchor: "start", cls: "is-red" });
    label(p.lab, { tex: "x", x: p.w - p.right - 4, y: p.h - 14, w: 40, h: 26, anchor: "end" });
    label(p.lab, { tex: "A(x)", x: 26, y: (p.top + p.y(0)) / 2, w: 80, h: 28, rotate: -90 });
  }

  // ---------- Параметрическое усиление: профиль и P(e→x) вдоль пути ----------
  function initCastle(root) {
    const theta = rad(8);
    const A1 = 1.6, A2 = 4.0, pairs = 5;
    const w1 = 1 / (2 * model.mix(theta, A1).R);
    const w2 = 1 / (2 * model.mix(theta, A2).R);
    const layers = [];
    for (let k = 0; k < pairs; k += 1) layers.push({ A: A1, w: w1 }, { A: A2, w: w2 });
    const T = layers.reduce((s, l) => s + l.w, 0);
    const Abar = (A1 * w1 + A2 * w2) / (w1 + w2);
    const c2 = Math.cos(2 * theta);

    // профиль
    const pa = plot(q(root, '[data-plot="profile"]'));
    pa.set({ left: 70, right: 24, top: 34, bottom: 10, xmin: 0, xmax: T, ymin: 0, ymax: 4.6 });
    let html = pa.frame([], [0, 2, 4]);
    let x0 = 0;
    layers.forEach((l, i) => {
      const xa = pa.x(x0), xb = pa.x(x0 + l.w), y = pa.y(l.A);
      const cls = i % 2 ? "layer-2" : "layer-1";
      html += `<rect class="castle-bar ${cls}" x="${xa}" y="${y}" width="${xb - xa}" height="${pa.y(0) - y}"/>`;
      html += `<line class="castle-top ${cls}" x1="${xa}" y1="${y}" x2="${xb}" y2="${y}"/>`;
      x0 += l.w;
    });
    html += `<line class="resonance-line" x1="${pa.left}" y1="${pa.y(c2)}" x2="${pa.w - pa.right}" y2="${pa.y(c2)}"/>`;
    pa.dyn.innerHTML = html;
    label(pa.lab, { tex: "L_{m1}/2", x: (pa.x(0) + pa.x(w1)) / 2, y: pa.y(A1) - 18, w: 110, h: 28, cls: "is-cyan" });
    label(pa.lab, { tex: "L_{m2}/2", x: pa.x(w1 + w2 / 2), y: pa.y(A2) - 18, w: 110, h: 28, cls: "is-purple" });
    label(pa.lab, { tex: "A=\\cos2\\theta", x: pa.w - pa.right - 4, y: pa.y(c2) - 16, w: 150, h: 28, anchor: "end", cls: "is-gold" });
    label(pa.lab, { tex: "A", x: 24, y: (pa.top + pa.y(0)) / 2, w: 40, h: 28, rotate: -90 });

    // вероятность
    const pp = plot(q(root, '[data-plot="probability"]'));
    pp.set({ left: 70, right: 24, top: 12, bottom: 50, xmin: 0, xmax: T, ymin: 0, ymax: 1 });
    html = pp.frame(ticks(T, 1), [0, 0.5, 1]);
    x0 = 0;
    layers.forEach((l, i) => {
      x0 += l.w;
      if (i < layers.length - 1) html += `<line class="layer-edge" x1="${pp.x(x0)}" y1="${pp.top}" x2="${pp.x(x0)}" y2="${pp.y(0)}"/>`;
    });
    html += `<path class="only-1" d="${pp.path(curve(theta, [{ A: A1, w: T }]))}"/>`;
    html += `<path class="only-2" d="${pp.path(curve(theta, [{ A: A2, w: T }]))}"/>`;
    html += `<path class="mean-line" d="${pp.path(curve(theta, [{ A: Abar, w: T }]))}"/>`;
    const alt = curve(theta, layers);
    html += `<path class="castle-line" d="${pp.path(alt)}"/>`;
    const end = alt[alt.length - 1];
    html += `<circle class="state-dot" cx="${pp.x(end[0])}" cy="${pp.y(end[1])}" r="6"/>`;
    pp.dyn.innerHTML = html;
    label(pp.lab, { tex: "P_{e\\to x}", x: 24, y: (pp.top + pp.y(0)) / 2, w: 90, h: 28, rotate: -90 });
    label(pp.lab, { tex: "L/L_{\\rm vac}", x: (pp.left + pp.w - pp.right) / 2, y: pp.h - 14, w: 120, h: 28 });
  }

  // ---------- Два зеркала дают поворот на удвоенный угол между ними ----------
  function initMirrors(root) {
    const p = plot(q(root, "svg"));
    p.set({ left: 0, right: 0, top: 0, bottom: 0, xmin: 0, xmax: 1, ymin: 0, ymax: 1 });
    const ox = 60, oy = 330, r = 300;
    const at = (deg, k = 1) => [ox + r * k * Math.cos(rad(deg)), oy - r * k * Math.sin(rad(deg))];
    const m1 = 10, m2 = 35;            // оси ν2m двух слоёв (углы условные)
    const v0 = 0, v1 = 2 * m1 - v0, v2 = 2 * m2 - v1;
    const line = (deg, cls, k = 1.05) => {
      const [x, y] = at(deg, k);
      return `<line class="${cls}" x1="${ox}" y1="${oy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    };
    const arrow = (deg, cls, k = 0.86) => {
      const [x, y] = at(deg, k);
      const ux = Math.cos(rad(deg)), uy = -Math.sin(rad(deg));
      const b = 16, h = 7;
      return `<line class="${cls}" x1="${ox}" y1="${oy}" x2="${(x - 0.7 * b * ux).toFixed(1)}" y2="${(y - 0.7 * b * uy).toFixed(1)}"/>`
        + `<path class="${cls}-head" d="M${x.toFixed(1)},${y.toFixed(1)} L${(x - b * ux - h * uy).toFixed(1)},${(y - b * uy + h * ux).toFixed(1)} L${(x - b * ux + h * uy).toFixed(1)},${(y - b * uy - h * ux).toFixed(1)} Z"/>`;
    };
    const arc = (from, to, k, cls) => {
      const [x1, y1] = at(from, k), [x2, y2] = at(to, k);
      return `<path class="${cls}" d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r * k},${r * k} 0 0 0 ${x2.toFixed(1)},${y2.toFixed(1)}"/>`;
    };
    let html = "";
    html += `<line class="axis" x1="${ox}" y1="${oy}" x2="${ox + r * 1.12}" y2="${oy}"/>`;
    html += `<line class="axis" x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - r * 1.02}"/>`;
    html += line(m1, "mirror mirror-1") + line(m2, "mirror mirror-2");
    html += arc(v0, v1, 0.62, "hop") + arc(v1, v2, 0.62, "hop");
    html += arc(m1, m2, 0.97, "alpha-arc");
    html += arc(v0, v2, 0.42, "beta-arc");
    html += arrow(v1, "vec-mid") + arrow(v0, "vec-start") + arrow(v2, "vec-end");
    html += `<circle class="origin" cx="${ox}" cy="${oy}" r="3.5"/>`;
    p.dyn.innerHTML = html;
    const put = (tex, deg, k, cls, w = 90) => {
      const [x, y] = at(deg, k);
      label(p.lab, { tex, x, y, w, h: 30, cls });
    };
    put("\\nu_e", 0, 1.2, "is-red", 50);
    label(p.lab, { tex: "\\nu_x", x: ox, y: oy - r * 1.02 - 16, w: 50, h: 30 });
    put("\\nu_{2m}^{(1)}", m1, 1.16, "is-cyan");
    put("\\nu_{2m}^{(2)}", m2, 1.14, "is-purple");
    put("\\psi_1", v1, 0.95, "", 50);
    put("\\psi_2", v2, 0.95, "is-gold", 50);
    put("\\alpha", (m1 + m2) / 2, 1.05, "is-muted", 40);
    put("\\beta=2\\alpha", -9, 0.36, "is-gold", 110);
  }

  // Одно зеркало: полупериодный слой отражает состояние относительно оси ν2m,
  // компонента вдоль ν1m меняет знак.
  function initMirror(root) {
    const p = plot(q(root, "svg"));
    p.set({ left: 0, right: 0, top: 0, bottom: 0, xmin: 0, xmax: 1, ymin: 0, ymax: 1 });
    const ox = 150, oy = 215, r = 170;
    const pt = (deg, k = 1) => [ox + r * k * Math.cos(rad(deg)), oy - r * k * Math.sin(rad(deg))];
    const f = (v) => v.toFixed(1);
    const m = 50, v0 = 15, v1 = 2 * m - v0;   // ось ν2m, состояние и его отражение (углы условные)
    const seg = (a, ka, b, kb, cls) => {
      const [x1, y1] = pt(a, ka), [x2, y2] = pt(b, kb);
      return `<line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
    };
    const arrow = (deg, cls, k = 0.9) => {
      const [x, y] = pt(deg, k);
      const ux = Math.cos(rad(deg)), uy = -Math.sin(rad(deg));
      const b = 16, h = 7;
      return `<line class="${cls}" x1="${ox}" y1="${oy}" x2="${f(x - 0.7 * b * ux)}" y2="${f(y - 0.7 * b * uy)}"/>`
        + `<path class="${cls}-head" d="M${f(x)},${f(y)} L${f(x - b * ux - h * uy)},${f(y - b * uy + h * ux)} L${f(x - b * ux + h * uy)},${f(y - b * uy - h * ux)} Z"/>`;
    };
    let html = "";
    html += seg(180, 0.35, 0, 1.12, "axis") + seg(270, 0.35, 90, 1.08, "axis");
    html += seg(m + 180, 0.45, m, 1.08, "mirror mirror-1");
    html += seg(m - 90, 1.0, m + 90, 0.45, "minor-axis");
    // отрезок между концами ψ и S_kψ перпендикулярен зеркалу и делится им пополам
    html += seg(v0, 0.9, v1, 0.9, "hop");
    const foot = pt(m, 0.9 * Math.cos(rad(m - v0)));
    const [ex, ey] = pt(m, 1), ux = (ex - ox) / r, uy = (ey - oy) / r, s = 9;
    html += `<path class="right-angle" d="M${f(foot[0] - s * ux)},${f(foot[1] - s * uy)} l${f(s * uy)},${f(-s * ux)} l${f(s * ux)},${f(s * uy)}"/>`;
    html += arrow(v0, "vec-start") + arrow(v1, "vec-end");
    html += `<circle class="origin" cx="${ox}" cy="${oy}" r="3.5"/>`;
    p.dyn.innerHTML = html;
    const put = (tex, deg, k, cls, w = 90) => {
      const [x, y] = pt(deg, k);
      label(p.lab, { tex, x, y, w, h: 30, cls });
    };
    put("\\nu_e", 0, 1.22, "is-red", 50);
    put("\\nu_x", 90, 1.18, "", 50);
    put("\\nu_{2m}", m, 1.2, "is-cyan", 70);
    put("\\nu_{1m}", m - 90, 1.12, "is-muted", 70);
    put("\\psi", v0 - 6, 0.98, "", 40);
    put("S_k\\psi", v1 + 9, 1.0, "is-gold", 70);
  }

  // Сфера Блоха: полупериодный слой поворачивает вектор r на пол-оборота вокруг оси n_k.
  function initBloch(root) {
    const p = plot(q(root, "svg"));
    p.set({ left: 0, right: 0, top: 0, bottom: 0, xmin: 0, xmax: 1, ymin: 0, ymax: 1 });
    const az = rad(28), el = rad(18), cx = 200, cy = 195, R = 150;
    const proj = (n) => {
      const x1 = n[0] * Math.cos(az) + n[1] * Math.sin(az);
      const y1 = -n[0] * Math.sin(az) + n[1] * Math.cos(az);
      return { X: cx + R * x1, Y: cy - R * (n[2] * Math.cos(el) - y1 * Math.sin(el)), D: y1 * Math.cos(el) + n[2] * Math.sin(el) };
    };
    const f = (v) => v.toFixed(1);
    const path = (pts, cls) => {
      let front = "", back = "";
      pts.forEach((a, i) => {
        if (i === 0) return;
        const b = pts[i - 1], d = `M${f(b.X)},${f(b.Y)} L${f(a.X)},${f(a.Y)} `;
        if (a.D + b.D >= 0) front += d; else back += d;
      });
      return `<path class="${cls} back" d="${back}"/><path class="${cls}" d="${front}"/>`;
    };
    const ring = (fn, t0 = 0, t1 = 2 * Math.PI, m = 120) =>
      Array.from({ length: m + 1 }, (_, i) => proj(fn(t0 + (t1 - t0) * i / m)));
    const arrow = (to, cls) => {
      const a = proj(to), dx = a.X - cx, dy = a.Y - cy, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len, b = 16, h = 7;
      return `<line class="${cls}" x1="${cx}" y1="${cy}" x2="${f(a.X - 0.7 * b * ux)}" y2="${f(a.Y - 0.7 * b * uy)}"/>`
        + `<path class="${cls}-head" d="M${f(a.X)},${f(a.Y)} L${f(a.X - b * ux - h * uy)},${f(a.Y - b * uy + h * ux)} L${f(a.X - b * ux + h * uy)},${f(a.Y - b * uy - h * ux)} Z"/>`;
    };
    const tm = rad(60);                                  // θm слоя (условно)
    const n = [Math.sin(2 * tm), 0, -Math.cos(2 * tm)];  // ось слоя
    const r0 = [0, 0, 1];                                // ν_e
    const c = n[2];                                      // n·r0
    const u = r0.map((v, i) => v - c * n[i]);            // от оси к r0
    const w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    const onCone = (t) => [0, 1, 2].map((i) => c * n[i] + u[i] * Math.cos(t) + w[i] * Math.sin(t));
    const r1 = onCone(Math.PI);
    let html = `<circle class="sphere" cx="${cx}" cy="${cy}" r="${R}"/>`;
    html += path(ring((t) => [Math.cos(t), Math.sin(t), 0]), "great");
    html += path(ring((t) => [Math.sin(t), 0, Math.cos(t)]), "great flavour-circle");
    const nA = proj(n.map((v) => 1.18 * v)), nB = proj(n.map((v) => -1.08 * v));
    html += `<line class="layer-axis" x1="${f(nB.X)}" y1="${f(nB.Y)}" x2="${f(nA.X)}" y2="${f(nA.Y)}"/>`;
    html += path(ring(onCone), "cone");
    html += path(ring(onCone, 0, Math.PI), "half-turn");
    html += arrow(r0, "vec-start") + arrow(r1, "vec-end");
    [[0, 0, 1], [0, 0, -1]].forEach((v) => {
      const a = proj(v);
      html += `<circle class="pole" cx="${f(a.X)}" cy="${f(a.Y)}" r="4"/>`;
    });
    html += `<circle class="origin" cx="${cx}" cy="${cy}" r="3.5"/>`;
    p.dyn.innerHTML = html;
    const put = (tex, v, k, cls, w = 70, dx = 0, dy = 0) => {
      const a = proj(v.map((x) => k * x));
      label(p.lab, { tex, x: a.X + dx, y: a.Y + dy, w, h: 30, cls });
    };
    put("\\nu_e", [0, 0, 1], 1.13, "is-red", 50, -30, 0);
    put("\\nu_x", [0, 0, -1], 1.13, "", 50, 0, 4);
    put("\\mathbf n_k", n, 1.3, "is-cyan", 60);
    put("\\mathbf r", r0, 0.55, "is-red", 30, 18, 0);
    put("S_k\\mathbf r", r1, 1.18, "is-gold", 70);
  }

  function init() {
    document.querySelectorAll("[data-l13-fig]").forEach((root) => {
      if (root.dataset.ready === "1") return;
      root.dataset.ready = "1";
      const kind = root.dataset.l13Fig;
      if (kind === "steps") initSteps(root);
      else if (kind === "castle") initCastle(root);
      else if (kind === "mirrors") initMirrors(root);
      else if (kind === "mirror") initMirror(root);
      else if (kind === "bloch") initBloch(root);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  if (window.Reveal && typeof window.Reveal.on === "function") window.Reveal.on("ready", init);
})();
