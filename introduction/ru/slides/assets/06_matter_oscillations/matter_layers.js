// «Построй свою материю»: профиль плотности из слоёв постоянной плотности, вероятность P(e→x) вдоль пути
// и сфера состояний, на которой в слое k вектор состояния вращается вокруг оси n_k = (sin2θ_mk, 0, −cos2θ_mk).
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
  const AXES_MAX = 6;

  // комплексное умножение матрицы 2×2 (пары [re, im]) на вектор
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  function apply(S, psi) {
    return [cadd(cmul(S[0][0], psi[0]), cmul(S[0][1], psi[1])), cadd(cmul(S[1][0], psi[0]), cmul(S[1][1], psi[1]))];
  }
  // Вектор Блоха r = ψ†σψ: r_z = |ψ_e|² − |ψ_x|², r_x + i r_y = 2 ψ_e* ψ_x; P(e→x) = (1 − r_z)/2.
  function bloch(psi) {
    const [a, b] = psi[0], [c, d] = psi[1];
    return [2 * (a * c + b * d), 2 * (a * d - b * c), a * a + b * b - c * c - d * d];
  }

  // Ортографическая проекция сферы: плоскость (ν_e, ν_x) чуть повёрнута, чтобы был виден выход вектора из неё.
  const VIEW = { az: rad(28), el: rad(18), cx: 180, cy: 182, R: 138 };
  function project(n) {
    const x1 = n[0] * Math.cos(VIEW.az) + n[1] * Math.sin(VIEW.az);
    const y1 = -n[0] * Math.sin(VIEW.az) + n[1] * Math.cos(VIEW.az);
    return { X: x1, Y: n[2] * Math.cos(VIEW.el) - y1 * Math.sin(VIEW.el), D: y1 * Math.cos(VIEW.el) + n[2] * Math.sin(VIEW.el) };
  }
  const sx = (q, k = 1) => (VIEW.cx + VIEW.R * k * q.X).toFixed(1);
  const sy = (q, k = 1) => (VIEW.cy - VIEW.R * k * q.Y).toFixed(1);
  // Ломаная по точкам сферы: передняя часть сплошная, задняя пунктиром.
  function splitPaths(pts) {
    let front = "", back = "", onFront = null;
    pts.forEach((q, i) => {
      const f = i === 0 ? q.D >= 0 : (pts[i - 1].D + q.D) >= 0;
      const cmd = (f === onFront && i > 0) ? "L" : "M";
      if (cmd === "M" && i > 0) {
        const prev = pts[i - 1];
        if (f) front += `M${sx(prev)},${sy(prev)} L${sx(q)},${sy(q)}`;
        else back += `M${sx(prev)},${sy(prev)} L${sx(q)},${sy(q)}`;
      } else if (f) front += `${cmd}${sx(q)},${sy(q)} `;
      else back += `${cmd}${sx(q)},${sy(q)} `;
      onFront = f;
    });
    return { front, back };
  }
  const circle = (fn, m = 96) => Array.from({ length: m + 1 }, (_, i) => project(fn(2 * Math.PI * i / m)));

  function init(root) {
    if (root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    const $ = (s) => root.querySelector(s);
    const thetaInput = $('[data-control="theta"]');
    const totalInput = $('[data-control="total"]');
    const antiInput = $('[data-control="anti"]');
    const posInput = $('[data-control="pos"]');
    const playButton = $('[data-action="play"]');
    const edSvg = $('[data-plot="editor"]');
    const prSvg = $('[data-plot="probability"]');
    const spSvg = $('[data-plot="sphere"]');
    const ed = plot(edSvg);
    const pr = plot(prSvg);
    const sp = spSvg ? plot(spSvg) : null;

    const labels = {
      edY: label(ed.lab, { tex: "A=V/\\Delta", w: 100, h: 28, rotate: -90 }),
      edX: label(ed.lab, { tex: "L/L_{\\rm vac}", w: 110, h: 28 }),
      edRes: label(ed.lab, { tex: "A=\\cos2\\theta", w: 120, h: 26, anchor: "end", cls: "is-gold" }),
      prY: label(pr.lab, { tex: "P_{e\\to x}", w: 90, h: 28, rotate: -90 }),
      prX: label(pr.lab, { tex: "L/L_{\\rm vac}", w: 110, h: 28 })
    };
    if (sp) {
      const top = project([0, 0, 1]), bottom = project([0, 0, -1]);
      labels.spE = label(sp.lab, { tex: "\\nu_e", w: 40, h: 26, cls: "is-red", x: Number(sx(top)), y: Number(sy(top)) - 16 });
      labels.spX = label(sp.lab, { tex: "\\nu_x", w: 40, h: 26, x: Number(sx(bottom)), y: Number(sy(bottom)) + 16 });
    }

    let layers = [{ A: 1.0, w: 3 }];
    let theta = rad(Number(thetaInput.value));
    let last = null;
    let animation = null;

    const total = () => layers.reduce((s, l) => s + l.w, 0);
    const sign = () => (antiInput.checked ? -1 : 1);
    const pos = () => (posInput ? clamp(Number(posInput.value), 0, 1) : 1);

    function setTheta(deg) {
      thetaInput.value = String(deg);
      theta = rad(deg);
    }

    // Состояние вдоль пути: вероятность, вектор Блоха и номер слоя в каждой точке.
    function curve() {
      const T = total();
      const matter = [], vacuum = [], states = [];
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
          states.push({ x: start + dx, r: bloch(ps), k });
        }
        psi = apply(model.layer(theta, A, l.w), psi);
        start += l.w;
      });
      for (let i = 0; i <= 500; i += 1) {
        const x = T * i / 500;
        vacuum.push([x, s2 ** 2 * Math.sin(Math.PI * x) ** 2]);
      }
      return { T, matter, vacuum, states, final: psi[1][0] ** 2 + psi[1][1] ** 2 };
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
      prSvg.setAttribute("viewBox", next ? "0 0 720 340" : "0 0 740 350");
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
      html += `<line class="probe" data-cursor x1="${p.x(T)}" y1="${p.top}" x2="${p.x(T)}" y2="${p.y(0)}"/>`;
      p.dyn.innerHTML = html;
      labels.edY.move(14, (p.top + p.h - p.bottom) / 2);
      labels.edX.move((p.left + p.w - p.right) / 2, p.h - 12);
      labels.edRes.move(p.w - p.right - 6, p.y(c2) - 14);

      // Вероятность
      const c = curve();
      last = c;
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
      html += `<line class="probe" data-cursor x1="${p.x(T)}" y1="${p.top}" x2="${p.x(T)}" y2="${p.h - p.bottom}"/>`;
      html += `<circle class="state-dot" data-cursor-dot cx="${p.x(T)}" cy="${p.y(c.final)}" r="6"/>`;
      p.dyn.innerHTML = html;
      labels.prY.move(14, (p.top + p.h - p.bottom) / 2);
      labels.prX.move((p.left + p.w - p.right) / 2, p.h - 12);

      const pmax = c.matter.reduce((m, q) => Math.max(m, q[1]), 0);
      $('[data-val="max"]').textContent = fmt(pmax, 3);
      $('[data-val="n"]').textContent = String(layers.length);
      $('[data-val="L"]').textContent = fmt(T, 2);
      $('[data-out="theta"]').textContent = fmt(theta * 180 / Math.PI, 1);
      $('[data-out="total"]').textContent = fmt(T, 2);
      totalInput.value = String(clamp(T, Number(totalInput.min), Number(totalInput.max)));
      renderCursor();
    }

    // Положение вдоль пути: отметки на графиках, число P и сфера состояний.
    function renderCursor() {
      if (!last) return;
      const f = pos();
      const x = f * last.T;
      let index = last.states.findIndex((s) => s.x >= x - 1e-9);
      if (index < 0) index = last.states.length - 1;
      const state = last.states[index];
      const P = last.matter[index][1];
      const line = ed.dyn.querySelector("[data-cursor]");
      if (line) {
        line.setAttribute("x1", ed.x(x));
        line.setAttribute("x2", ed.x(x));
      }
      const probe = pr.dyn.querySelector("[data-cursor]");
      if (probe) {
        probe.setAttribute("x1", pr.x(x));
        probe.setAttribute("x2", pr.x(x));
      }
      const dot = pr.dyn.querySelector("[data-cursor-dot]");
      if (dot) {
        dot.setAttribute("cx", pr.x(x));
        dot.setAttribute("cy", pr.y(P));
      }
      $('[data-val="final"]').textContent = fmt(P, 3);
      const out = $('[data-out="pos"]');
      if (out) out.textContent = fmt(f, 2);
      if (sp) renderSphere(index, state, P);
    }

    function renderSphere(index, state, P) {
      const R = VIEW.R, cx = VIEW.cx, cy = VIEW.cy;
      let html = `<circle class="sphere-outline" cx="${cx}" cy="${cy}" r="${R}"/>`;
      const eq = splitPaths(circle((t) => [Math.cos(t), Math.sin(t), 0]));
      html += `<path class="great-circle equator back" d="${eq.back}"/><path class="great-circle equator" d="${eq.front}"/>`;
      const fl = splitPaths(circle((t) => [Math.sin(t), 0, Math.cos(t)]));
      html += `<path class="great-circle back" d="${fl.back}"/><path class="great-circle" d="${fl.front}"/>`;
      // Оси слоёв: все различные A, если их немного, иначе только ось текущего слоя
      const current = sign() * layers[state.k].A;
      const values = [];
      layers.forEach((l) => {
        const A = sign() * l.A;
        if (!values.some((v) => Math.abs(v - A) < 1e-9)) values.push(A);
      });
      const shown = values.length <= AXES_MAX ? values : [current];
      shown.forEach((A, i) => {
        const tm = model.mix(theta, A).thetaM;
        const n = [Math.sin(2 * tm), 0, -Math.cos(2 * tm)];
        const a = project(n), b = project(n.map((v) => -v));
        const isCurrent = Math.abs(A - current) < 1e-9;
        const cls = isCurrent ? "layer-axis current" : "layer-axis";
        html += `<line class="${cls}" x1="${sx(b)}" y1="${sy(b)}" x2="${sx(a)}" y2="${sy(a)}"/>`;
        // легенда осей в правом верхнем углу: оси сходятся у полюсов, и подписи на концах налезали бы друг на друга
        const y = 18 + 17 * i;
        html += `<line class="${cls}" x1="${VIEW.cx * 2 - 96}" y1="${y - 4}" x2="${VIEW.cx * 2 - 76}" y2="${y - 4}"/>`;
        html += `<text class="axis-tag${isCurrent ? " current" : ""}" x="${VIEW.cx * 2 - 8}" y="${y}" text-anchor="end"><tspan font-style="italic">A</tspan> = ${fmt(A, 2)}</text>`;
      });
      // Полюсы: ν_e вверху, ν_x внизу
      [[0, 0, 1], [0, 0, -1]].forEach((n) => {
        const q = project(n);
        html += `<circle class="pole" cx="${sx(q)}" cy="${sy(q)}" r="3"/>`;
      });
      // След вектора и сам вектор
      const trail = splitPaths(last.states.slice(0, index + 1).map((s) => project(s.r)));
      html += `<path class="trail back" d="${trail.back}"/><path class="trail" d="${trail.front}"/>`;
      const tip = project(state.r);
      const tx = Number(sx(tip)), ty = Number(sy(tip));
      const dx = tx - cx, dy = ty - cy, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const back = Math.min(12, len), half = 5.5;
      html += `<line class="state-arrow" x1="${cx}" y1="${cy}" x2="${(tx - 0.6 * back * ux).toFixed(1)}" y2="${(ty - 0.6 * back * uy).toFixed(1)}"/>`;
      html += `<polygon class="state-head" points="${tx},${ty} ${(tx - back * ux - half * uy).toFixed(1)},${(ty - back * uy + half * ux).toFixed(1)} ${(tx - back * ux + half * uy).toFixed(1)},${(ty - back * uy - half * ux).toFixed(1)}"/>`;
      html += `<circle class="origin-dot" cx="${cx}" cy="${cy}" r="2.6"/>`;
      html += `<text class="sphere-note" x="8" y="18">слой ${state.k + 1} из ${layers.length}</text>`;
      html += `<text class="sphere-note" x="8" y="37"><tspan font-style="italic">P</tspan> = ${fmt(P, 3)}</text>`;
      sp.dyn.innerHTML = html;
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
    if (posInput) posInput.addEventListener("input", () => { stop(); renderCursor(); });
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
      const removed = layers.pop();
      layers[layers.length - 1].w += removed.w;
      render();
    });

    // Проход по профилю: ползунок положения идёт от 0 до L, примерно секунда на слой.
    const PLAY = "▶ пройти профиль", STOP = "■ остановить";
    function stop() {
      if (!animation) return;
      cancelAnimationFrame(animation);
      animation = null;
      if (playButton) playButton.textContent = PLAY;
    }
    if (playButton && posInput) {
      playButton.addEventListener("click", () => {
        if (animation) {
          stop();
          return;
        }
        const duration = 1000 * clamp(0.9 * layers.length, 4, 12);
        const start = performance.now();
        playButton.textContent = STOP;
        const frame = (now) => {
          const f = clamp((now - start) / duration, 0, 1);
          posInput.value = String(f);
          renderCursor();
          if (f < 1) animation = requestAnimationFrame(frame);
          else stop();
        };
        posInput.value = "0";
        animation = requestAnimationFrame(frame);
      });
    }

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
        stop();
        presets[b.dataset.preset]();
        if (posInput) posInput.value = "1";
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
