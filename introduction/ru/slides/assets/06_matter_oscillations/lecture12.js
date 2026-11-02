// Лаборатория одного слоя постоянной плотности (лекция 12 и апплет matter-constant).
// Модель: P(e→x) = sin²2θm · sin²(π R L/Lvac), R = Δm/Δ = sqrt((cos2θ − A)² + sin²2θ).
(() => {
  "use strict";

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const deg = (radians) => radians * 180 / Math.PI;
  const rad = (degrees) => degrees * Math.PI / 180;
  const fmt = (x, digits = 3) => Number.isFinite(x) ? x.toFixed(digits) : "—";
  const X_MAX = 5;

  const { label, plot } = window.L12;

  function model(theta, A, x) {
    const s2 = Math.sin(2 * theta);
    const c2 = Math.cos(2 * theta);
    const R = Math.hypot(c2 - A, s2);
    const thetaM = 0.5 * Math.atan2(s2, c2 - A);
    const amp = (s2 / R) ** 2;
    const P = amp * Math.sin(Math.PI * R * x) ** 2;
    return { s2, c2, R, thetaM, amp, P };
  }

  function initLab(root) {
    if (root.dataset.ready === "1") return;
    root.dataset.ready = "1";

    const thetaInput = root.querySelector('[data-control="theta"]');
    const aInput = root.querySelector('[data-control="A"]');
    const xInput = root.querySelector('[data-control="x"]');
    const probSvg = root.querySelector('[data-plot="probability"]');
    const levelsSvg = root.querySelector('[data-plot="levels"]');
    const probPlot = plot(probSvg);
    const levelsPlot = plot(levelsSvg);

    const out = (name, value) => {
      const node = root.querySelector(`[data-out="${name}"]`);
      if (node) node.textContent = value;
    };
    const val = (name, value) => {
      const node = root.querySelector(`[data-val="${name}"]`);
      if (node) node.textContent = value;
    };

    const labels = {
      probX: label(probPlot.lab, { tex: "L/L_{\\rm vac}", w: 110, h: 30 }),
      probY: label(probPlot.lab, { tex: "P_{e\\to x}", w: 90, h: 30, rotate: -90 }),
      lvlX: label(levelsPlot.lab, { tex: "A=V/\\Delta", w: 100, h: 30 }),
      lvlY: label(levelsPlot.lab, { tex: "\\lambda/\\Delta", w: 70, h: 30, rotate: -90 }),
      nu2: label(levelsPlot.lab, { tex: "\\nu_{2m}", w: 70, h: 28, anchor: "start" }),
      nu1: label(levelsPlot.lab, { tex: "\\nu_{1m}", w: 70, h: 28, anchor: "start" }),
      nuE: label(levelsPlot.lab, { tex: "\\nu_e", w: 50, h: 28 })
    };

    function renderProbability(m, x) {
      const p = probPlot;
      p.set({ left: 50, right: 14, top: 14, bottom: 52, xmin: 0, xmax: X_MAX, ymin: 0, ymax: 1 });
      const matter = [], vacuum = [];
      for (let i = 0; i <= 400; i += 1) {
        const xx = X_MAX * i / 400;
        matter.push([xx, m.amp * Math.sin(Math.PI * m.R * xx) ** 2]);
        vacuum.push([xx, m.s2 ** 2 * Math.sin(Math.PI * xx) ** 2]);
      }
      let html = p.frame([0, 1, 2, 3, 4, 5], [0, 0.5, 1]);
      html += `<path class="vacuum-line" d="${p.path(vacuum)}"/>`;
      html += `<path class="envelope-line" d="M${p.x(0)},${p.y(m.amp)} L${p.x(X_MAX)},${p.y(m.amp)}"/>`;
      html += `<path class="matter-line" d="${p.path(matter)}"/>`;
      html += `<line class="probe" x1="${p.x(x)}" y1="${p.top}" x2="${p.x(x)}" y2="${p.h - p.bottom}"/>`;
      html += `<circle class="probe-dot" cx="${p.x(x)}" cy="${p.y(m.P)}" r="5"/>`;
      p.dyn.innerHTML = html;
      labels.probX.move((p.left + p.w - p.right) / 2, p.h - 12);
      labels.probY.move(14, (p.top + p.h - p.bottom) / 2);
    }

    function renderLevels(m, A) {
      const p = levelsPlot;
      p.set({ left: 46, right: 64, top: 14, bottom: 52, xmin: -3, xmax: 5, ymin: -2.8, ymax: 2.8 });
      const upper = [], lower = [], bareE = [], bareX = [];
      for (let i = 0; i <= 320; i += 1) {
        const a = p.xmin + (p.xmax - p.xmin) * i / 320;
        const R = Math.hypot(m.c2 - a, m.s2);
        upper.push([a, R / 2]);
        lower.push([a, -R / 2]);
        bareE.push([a, (a - m.c2) / 2]);
        bareX.push([a, -(a - m.c2) / 2]);
      }
      let html = p.frame([-3, -1, 0, 1, 3, 5], [-2, 0, 2]);
      html += `<line class="resonance-line" x1="${p.x(m.c2)}" y1="${p.top}" x2="${p.x(m.c2)}" y2="${p.h - p.bottom}"/>`;
      html += `<text class="resonance-label" x="${p.x(m.c2) + 5}" y="${p.top + 12}">резонанс</text>`;
      html += `<path class="bare-branch" d="${p.path(bareE)}"/>`;
      html += `<path class="bare-branch" d="${p.path(bareX)}"/>`;
      html += `<path class="branch" d="${p.path(upper)}"/>`;
      html += `<path class="branch" d="${p.path(lower)}"/>`;
      const a = clamp(A, p.xmin, p.xmax);
      html += `<line class="probe" x1="${p.x(a)}" y1="${p.top}" x2="${p.x(a)}" y2="${p.h - p.bottom}"/>`;
      html += `<circle class="state-dot" cx="${p.x(a)}" cy="${p.y(m.R / 2)}" r="5.5"/>`;
      // Доля νe в верхней волне: |<νe|ν2m>|² = sin²θm.
      const eFraction = Math.sin(m.thetaM) ** 2;
      const barW = 16, barX = p.w - p.right + 24, barY = p.top + 30, barH = Math.min(220, p.h - p.top - p.bottom - 60);
      html += `<rect class="electron-frame" x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="4"/>`;
      html += `<rect class="electron-fill" x="${barX}" y="${barY + barH * (1 - eFraction)}" width="${barW}" height="${barH * eFraction}" rx="3"/>`;
      html += `<text x="${barX + barW / 2}" y="${barY + barH + 18}" text-anchor="middle">${Math.round(100 * eFraction)}%</text>`;
      p.dyn.innerHTML = html;
      const yUp = p.y(Math.hypot(m.c2 - p.xmin, m.s2) / 2);
      const yLo = p.y(-Math.hypot(m.c2 - p.xmin, m.s2) / 2);
      labels.nu2.move(p.left + 6, yUp - 14);
      labels.nu1.move(p.left + 6, yLo + 14);
      labels.nuE.move(barX + barW / 2, barY - 14);
      labels.lvlX.move((p.left + p.w - p.right) / 2, p.h - 12);
      labels.lvlY.move(14, (p.top + p.h - p.bottom) / 2);
    }

    // На узком экране графики идут друг под другом: меньше единиц viewBox, чтобы подписи остались читаемыми.
    const VIEWBOX = { wide: [[610, 430], [440, 430]], compact: [[380, 300], [380, 330]] };
    let layout = "";
    function fitViewBoxes() {
      const w = root.clientWidth;                 // 0, пока слайд скрыт
      if (!w && layout) return false;
      const next = w && w < 560 ? "compact" : "wide";
      if (next === layout) return false;
      layout = next;
      root.classList.toggle("is-compact", next === "compact");
      [probSvg, levelsSvg].forEach((svg, i) => svg.setAttribute("viewBox", `0 0 ${VIEWBOX[next][i].join(" ")}`));
      return true;
    }

    function update() {
      fitViewBoxes();
      const thetaDeg = Number(thetaInput.value);
      const A = Number(aInput.value);
      const x = Number(xInput.value);
      const m = model(rad(thetaDeg), A, x);
      out("theta", fmt(thetaDeg, 1));
      out("A", fmt(A, 2));
      out("x", fmt(x, 2));
      val("thetaM", `${fmt(deg(m.thetaM), 1)}°`);
      val("R", fmt(m.R, 3));
      val("amp", fmt(m.amp, 3));
      val("period", fmt(1 / m.R, 3));
      val("P", fmt(m.P, 3));
      renderProbability(m, x);
      renderLevels(m, A);
    }

    [thetaInput, aInput, xInput].forEach((input) => input.addEventListener("input", update));
    root.querySelectorAll("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = button.dataset.preset;
        if (preset === "vacuum") aInput.value = "0";
        if (preset === "resonance") aInput.value = String(Math.cos(2 * rad(Number(thetaInput.value))));
        if (preset === "dense") aInput.value = "4.5";
        if (preset === "antinu") aInput.value = "-1.5";
        update();
      });
    });

    update();
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(() => { if (fitViewBoxes()) update(); }).observe(root);
    }
  }

  function init() {
    document.querySelectorAll("[data-matter-constant-lab]").forEach(initLab);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
  if (window.Reveal && typeof window.Reveal.on === "function") window.Reveal.on("ready", init);
})();
