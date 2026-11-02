// «Построй свою материю»: профиль плотности из слоёв постоянной плотности и вероятность P(e→x) вдоль пути.
// Слой k: S_k = exp(-iπ x_k M_k), M = [[A-cos2θ, sin2θ],[sin2θ, cos2θ-A]], x = L/L_vac (см. l12_tex.js).
(() => {
  "use strict";

  const { label, plot, model } = window.L12;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const rad = (d) => d * Math.PI / 180;
  const fmt = (x, n = 2) => (Number.isFinite(x) ? x.toFixed(n) : "—").replace("-", "−");
  const A_MAX = 6;
  const N_MAX = 12;
  const W_MIN = 0.03;
  const SOLAR = 33.8;

  // комплексное умножение матрицы 2×2 (пары [re, im]) на вектор
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  function apply(S, psi) {
    return [cadd(cmul(S[0][0], psi[0]), cmul(S[0][1], psi[1])), cadd(cmul(S[1][0], psi[0]), cmul(S[1][1], psi[1]))];
  }

  function init(root) {
    if (root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    const $ = (s) => root.querySelector(s);
    const thetaInput = $('[data-control="theta"]');
    const totalInput = $('[data-control="total"]');
    const antiInput = $('[data-control="anti"]');
    const edSvg = $('[data-plot="editor"]');
    const prSvg = $('[data-plot="probability"]');
    const ed = plot(edSvg);
    const pr = plot(prSvg);

    const labels = {
      edY: label(ed.lab, { tex: "A=V/\\Delta", w: 100, h: 28, rotate: -90 }),
      edX: label(ed.lab, { tex: "L/L_{\\rm vac}", w: 110, h: 28 }),
      edRes: label(ed.lab, { tex: "A=\\cos2\\theta", w: 120, h: 26, anchor: "end", cls: "is-gold" }),
      prY: label(pr.lab, { tex: "P_{e\\to x}", w: 90, h: 28, rotate: -90 }),
      prX: label(pr.lab, { tex: "L/L_{\\rm vac}", w: 110, h: 28 })
    };

    let layers = [{ A: 1.0, w: 3 }];
    let theta = rad(Number(thetaInput.value));

    const total = () => layers.reduce((s, l) => s + l.w, 0);
    const sign = () => (antiInput.checked ? -1 : 1);

    function setTheta(deg) {
      thetaInput.value = String(deg);
      theta = rad(deg);
    }

    function curve() {
      const T = total();
      const matter = [], vacuum = [];
      const s2 = Math.sin(2 * theta);
      let psi = [[1, 0], [0, 0]];
      let start = 0;
      layers.forEach((l, k) => {
        const A = sign() * l.A;
        const n = Math.max(8, Math.ceil(l.w * 200));
        for (let i = (k ? 1 : 0); i <= n; i += 1) {
          const dx = l.w * i / n;
          const ps = apply(model.layer(theta, A, dx), psi);
          matter.push([start + dx, ps[1][0] ** 2 + ps[1][1] ** 2]);
        }
        psi = apply(model.layer(theta, A, l.w), psi);
        start += l.w;
      });
      for (let i = 0; i <= 500; i += 1) {
        const x = T * i / 500;
        vacuum.push([x, s2 ** 2 * Math.sin(Math.PI * x) ** 2]);
      }
      return { matter, vacuum, final: psi[1][0] ** 2 + psi[1][1] ** 2 };
    }

    function ticksFor(T) {
      const step = T <= 3 ? 0.5 : T <= 6 ? 1 : T <= 12 ? 2 : 5;
      const t = [];
      for (let v = 0; v <= T + 1e-9; v += step) t.push(+v.toFixed(3));
      return t;
    }

    // В узком апплете viewBox меньше, чтобы подписи не мельчали.
    let narrow = null;
    function fit() {
      const w = edSvg.parentElement.clientWidth;
      if (!w) return false;
      const next = w < 900;
      if (next === narrow) return false;
      narrow = next;
      edSvg.setAttribute("viewBox", next ? "0 0 720 300" : "0 0 1140 280");
      prSvg.setAttribute("viewBox", next ? "0 0 720 340" : "0 0 1140 350");
      return true;
    }

    function render() {
      fit();
      const T = total();
      const c2 = Math.cos(2 * theta);
      // Редактор профиля
      let p = ed;
      p.set({ left: 66, right: 18, top: 16, bottom: 52, xmin: 0, xmax: T, ymin: 0, ymax: A_MAX });
      let html = p.frame(ticksFor(T), [0, 1, 2, 3, 4, 5, 6]);
      html += `<line class="resonance-line" x1="${p.left}" y1="${p.y(c2)}" x2="${p.w - p.right}" y2="${p.y(c2)}"/>`;
      let x0 = 0;
      layers.forEach((l, i) => {
        const xa = p.x(x0), xb = p.x(x0 + l.w), y = p.y(l.A);
        html += `<rect class="layer-bar" x="${xa}" y="${y}" width="${xb - xa}" height="${p.y(0) - y}"/>`;
        html += `<line class="layer-top" x1="${xa}" y1="${y}" x2="${xb}" y2="${y}"/>`;
        if (xb - xa > 26) html += `<text class="layer-num" x="${(xa + xb) / 2}" y="${p.y(0) - 8}" text-anchor="middle">${i + 1}</text>`;
        html += `<rect class="hit" data-kind="top" data-i="${i}" x="${xa + 5}" y="${p.top}" width="${Math.max(0, xb - xa - 10)}" height="${p.y(0) - p.top}"/>`;
        x0 += l.w;
      });
      x0 = 0;
      layers.forEach((l, i) => {
        x0 += l.w;
        if (i === layers.length - 1) return;
        const x = p.x(x0);
        html += `<line class="layer-edge" x1="${x}" y1="${p.top}" x2="${x}" y2="${p.y(0)}"/>`;
        html += `<path class="edge-grip" d="M${x - 7},${p.y(0) + 1} L${x + 7},${p.y(0) + 1} L${x},${p.y(0) + 13} Z"/>`;
        html += `<rect class="hit" data-kind="edge" data-i="${i}" x="${x - 9}" y="${p.top}" width="18" height="${p.y(0) - p.top + 16}"/>`;
      });
      p.dyn.innerHTML = html;
      labels.edY.move(14, (p.top + p.h - p.bottom) / 2);
      labels.edX.move((p.left + p.w - p.right) / 2, p.h - 12);
      labels.edRes.move(p.w - p.right - 6, p.y(c2) - 14);

      // Вероятность
      const c = curve();
      p = pr;
      p.set({ left: 66, right: 18, top: 16, bottom: 52, xmin: 0, xmax: T, ymin: 0, ymax: 1 });
      html = p.frame(ticksFor(T), [0, 0.5, 1]);
      x0 = 0;
      layers.forEach((l, i) => {
        x0 += l.w;
        if (i < layers.length - 1) html += `<line class="layer-edge faint" x1="${p.x(x0)}" y1="${p.top}" x2="${p.x(x0)}" y2="${p.h - p.bottom}"/>`;
      });
      html += `<path class="vacuum-line" d="${p.path(c.vacuum)}"/>`;
      html += `<path class="matter-line" d="${p.path(c.matter)}"/>`;
      html += `<circle class="state-dot" cx="${p.x(T)}" cy="${p.y(c.final)}" r="6"/>`;
      p.dyn.innerHTML = html;
      labels.prY.move(14, (p.top + p.h - p.bottom) / 2);
      labels.prX.move((p.left + p.w - p.right) / 2, p.h - 12);

      const pmax = c.matter.reduce((m, q) => Math.max(m, q[1]), 0);
      $('[data-val="final"]').textContent = fmt(c.final, 3);
      $('[data-val="max"]').textContent = fmt(pmax, 3);
      $('[data-val="n"]').textContent = String(layers.length);
      $('[data-val="L"]').textContent = fmt(T, 2);
      $('[data-out="theta"]').textContent = fmt(theta * 180 / Math.PI, 1);
      $('[data-out="total"]').textContent = fmt(T, 2);
      totalInput.value = String(clamp(T, Number(totalInput.min), Number(totalInput.max)));
    }

    // Перетаскивание: верх столбца задаёт A, граница между слоями переносит длину из слоя в слой.
    let drag = null;
    const toSvg = (e) => {
      const pt = edSvg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(edSvg.getScreenCTM().inverse());
    };
    edSvg.addEventListener("pointerdown", (e) => {
      const t = e.target.closest("[data-kind]");
      if (!t) return;
      drag = { kind: t.dataset.kind, i: Number(t.dataset.i) };
      edSvg.setPointerCapture(e.pointerId);
      e.preventDefault();
      move(e);
    });
    function move(e) {
      if (!drag) return;
      const pt = toSvg(e);
      const p = ed;
      if (drag.kind === "top") {
        const A = p.ymin + (p.y(0) - pt.y) / (p.y(0) - p.y(A_MAX)) * A_MAX;
        layers[drag.i].A = clamp(Math.round(A * 20) / 20, 0, A_MAX);
      } else {
        const i = drag.i;
        const a = layers.slice(0, i).reduce((s, l) => s + l.w, 0);
        const b = a + layers[i].w + layers[i + 1].w;
        const xv = p.xmin + (pt.x - p.left) / (p.w - p.left - p.right) * (p.xmax - p.xmin);
        const edge = clamp(Math.round(xv * 100) / 100, a + W_MIN, b - W_MIN);
        layers[i].w = edge - a;
        layers[i + 1].w = b - edge;
      }
      render();
    }
    edSvg.addEventListener("pointermove", move);
    const end = () => { drag = null; };
    edSvg.addEventListener("pointerup", end);
    edSvg.addEventListener("pointercancel", end);

    thetaInput.addEventListener("input", () => { theta = rad(Number(thetaInput.value)); render(); });
    antiInput.addEventListener("change", render);
    totalInput.addEventListener("input", () => {
      const k = Number(totalInput.value) / total();
      layers.forEach((l) => { l.w *= k; });
      render();
    });
    $('[data-action="add"]').addEventListener("click", () => {
      if (layers.length >= N_MAX) return;
      let k = 0;
      layers.forEach((l, i) => { if (l.w > layers[k].w) k = i; });
      const l = layers[k];
      layers.splice(k, 1, { A: l.A, w: l.w / 2 }, { A: l.A, w: l.w / 2 });
      render();
    });
    $('[data-action="remove"]').addEventListener("click", () => {
      if (layers.length < 2) return;
      const last = layers.pop();
      layers[layers.length - 1].w += last.w;
      render();
    });

    const presets = {
      single() {
        setTheta(SOLAR);
        layers = [{ A: 1.0, w: 3 }];
      },
      plate() {
        setTheta(SOLAR);
        // резонансный слой длиной в полупериод: полный переход
        const s2 = Math.sin(2 * theta);
        layers = [{ A: Math.cos(2 * theta), w: 1 / (2 * s2) }];
      },
      parametric() {
        setTheta(8);
        layers = [];
        for (let k = 0; k < 5; k += 1) {
          [1.6, 4.0].forEach((A) => layers.push({ A, w: 1 / (2 * model.mix(theta, A).R) }));
        }
      },
      earth() {
        setTheta(SOLAR);
        layers = [{ A: 0.45, w: 1.4 }, { A: 1.1, w: 2.2 }, { A: 0.45, w: 1.4 }];
      },
      sun() {
        setTheta(SOLAR);
        layers = [];
        for (let i = 0; i < 10; i += 1) layers.push({ A: Math.round(500 * Math.exp(-3.2 * i / 9)) / 100, w: 0.5 });
      },
      random() {
        const n = 5 + Math.floor(Math.random() * 5);
        const T = Math.max(3, total());
        const ws = Array.from({ length: n }, () => 0.3 + Math.random());
        const s = ws.reduce((a, b) => a + b, 0);
        layers = ws.map((w) => ({ A: Math.round(Math.random() * 100 * A_MAX * 0.75) / 100, w: w / s * T }));
      }
    };
    root.querySelectorAll("[data-preset]").forEach((b) => {
      b.addEventListener("click", () => {
        presets[b.dataset.preset]();
        render();
      });
    });

    presets.parametric();
    render();
    if (typeof ResizeObserver === "function") new ResizeObserver(() => { if (fit()) render(); }).observe(edSvg.parentElement);
  }

  function boot() {
    document.querySelectorAll("[data-matter-layers-lab]").forEach(init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  if (window.Reveal && typeof window.Reveal.on === "function") window.Reveal.on("ready", boot);
})();
