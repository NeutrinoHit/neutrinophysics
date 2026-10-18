// Лаборатория одного слоя постоянной плотности (лекция 12 и апплет matter-constant).
// Модель: P(e→x) = sin²2θm · sin²(π R L/Lvac), R = Δm/Δ = sqrt((cos2θ − A)² + sin²2θ).
(() => {
  "use strict";

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const deg = (radians) => radians * 180 / Math.PI;
  const rad = (degrees) => degrees * Math.PI / 180;
  const fmt = (x, digits = 3) => Number.isFinite(x) ? x.toFixed(digits) : "—";
  const X_MAX = 5;

  function pathFrom(points, xMap, yMap) {
    return points.map((p, i) => `${i ? "L" : "M"}${xMap(p[0]).toFixed(2)},${yMap(p[1]).toFixed(2)}`).join(" ");
  }

  // Подпись оси: символы курсивом, индексы опущены.
  const SUB = (text) => `<tspan class="sub" dy="4">${text}</tspan><tspan dy="-4"></tspan>`;
  const LABELS = {
    distance: `<tspan class="sym">L</tspan> / <tspan class="sym">L</tspan>${SUB("vac")}`,
    probability: `<tspan class="sym">P</tspan>${SUB("e→x")}`,
    potential: `<tspan class="sym">A</tspan> = <tspan class="sym">V</tspan> / Δ`,
    level: `<tspan class="sym">λ</tspan> / Δ`
  };

  function axes({ width, height, left, right, top, bottom, xTicks, yTicks, xMap, yMap, xLabel, yLabel }) {
    let html = "";
    yTicks.forEach((v) => {
      const y = yMap(v);
      html += `<line class="grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/>`;
      html += `<text x="${left - 8}" y="${y + 4}" text-anchor="end">${v}</text>`;
    });
    xTicks.forEach((v) => {
      const x = xMap(v);
      html += `<line class="grid" x1="${x}" y1="${top}" x2="${x}" y2="${height - bottom}"/>`;
      html += `<text x="${x}" y="${height - bottom + 18}" text-anchor="middle">${v}</text>`;
    });
    html += `<line class="axis" x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}"/>`;
    html += `<line class="axis" x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}"/>`;
    const yMid = (top + height - bottom) / 2;
    html += `<text class="axis-label" x="${(left + width - right) / 2}" y="${height - 4}" text-anchor="middle">${xLabel}</text>`;
    html += `<text class="axis-label" x="14" y="${yMid}" text-anchor="middle" transform="rotate(-90 14 ${yMid})">${yLabel}</text>`;
    return html;
  }

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
    const playButton = root.querySelector('[data-action="play"]');
    let animation = null;

    const out = (name, value) => {
      const node = root.querySelector(`[data-out="${name}"]`);
      if (node) node.textContent = value;
    };
    const val = (name, value) => {
      const node = root.querySelector(`[data-val="${name}"]`);
      if (node) node.textContent = value;
    };

    function renderProbability(m, x) {
      const { width, height } = probSvg.viewBox.baseVal;
      const left = 50, right = 14, top = 14, bottom = 44;
      const xMap = (v) => left + (width - left - right) * v / X_MAX;
      const yMap = (v) => height - bottom - (height - top - bottom) * v;
      const matter = [], vacuum = [];
      for (let i = 0; i <= 400; i += 1) {
        const xx = X_MAX * i / 400;
        matter.push([xx, m.amp * Math.sin(Math.PI * m.R * xx) ** 2]);
        vacuum.push([xx, m.s2 ** 2 * Math.sin(Math.PI * xx) ** 2]);
      }
      let html = axes({
        width, height, left, right, top, bottom,
        xTicks: [0, 1, 2, 3, 4, 5], yTicks: [0, 0.5, 1],
        xMap, yMap, xLabel: LABELS.distance, yLabel: LABELS.probability
      });
      html += `<path class="vacuum-line" d="${pathFrom(vacuum, xMap, yMap)}"/>`;
      html += `<path class="envelope-line" d="M${xMap(0)},${yMap(m.amp)} L${xMap(X_MAX)},${yMap(m.amp)}"/>`;
      html += `<path class="matter-line" d="${pathFrom(matter, xMap, yMap)}"/>`;
      html += `<line class="probe" x1="${xMap(x)}" y1="${top}" x2="${xMap(x)}" y2="${height - bottom}"/>`;
      html += `<circle class="probe-dot" cx="${xMap(x)}" cy="${yMap(m.P)}" r="5"/>`;
      probSvg.innerHTML = html;
    }

    function renderLevels(m, A) {
      const { width, height } = levelsSvg.viewBox.baseVal;
      const left = 46, right = 64, top = 14, bottom = 44;
      const xmin = -3, xmax = 5, ymin = -2.8, ymax = 2.8;
      const xMap = (v) => left + (width - left - right) * (v - xmin) / (xmax - xmin);
      const yMap = (v) => height - bottom - (height - top - bottom) * (v - ymin) / (ymax - ymin);
      const upper = [], lower = [], bareE = [], bareX = [];
      for (let i = 0; i <= 320; i += 1) {
        const a = xmin + (xmax - xmin) * i / 320;
        const R = Math.hypot(m.c2 - a, m.s2);
        upper.push([a, R / 2]);
        lower.push([a, -R / 2]);
        bareE.push([a, (a - m.c2) / 2]);
        bareX.push([a, -(a - m.c2) / 2]);
      }
      let html = axes({
        width, height, left, right, top, bottom,
        xTicks: [-3, -1, 0, 1, 3, 5], yTicks: [-2, 0, 2],
        xMap, yMap, xLabel: LABELS.potential, yLabel: LABELS.level
      });
      html += `<line class="resonance-line" x1="${xMap(m.c2)}" y1="${top}" x2="${xMap(m.c2)}" y2="${height - bottom}"/>`;
      html += `<text class="resonance-label" x="${xMap(m.c2) + 5}" y="${top + 12}">резонанс</text>`;
      html += `<path class="bare-branch" d="${pathFrom(bareE, xMap, yMap)}"/>`;
      html += `<path class="bare-branch" d="${pathFrom(bareX, xMap, yMap)}"/>`;
      html += `<path class="branch" d="${pathFrom(upper, xMap, yMap)}"/>`;
      html += `<path class="branch" d="${pathFrom(lower, xMap, yMap)}"/>`;
      const yUp = yMap(Math.hypot(m.c2 - xmin, m.s2) / 2);
      const yLo = yMap(-Math.hypot(m.c2 - xmin, m.s2) / 2);
      html += `<text class="branch-label" x="${left + 6}" y="${yUp - 8}">ν${SUB("2m")}</text>`;
      html += `<text class="branch-label" x="${left + 6}" y="${yLo + 18}">ν${SUB("1m")}</text>`;
      const a = clamp(A, xmin, xmax);
      html += `<line class="probe" x1="${xMap(a)}" y1="${top}" x2="${xMap(a)}" y2="${height - bottom}"/>`;
      html += `<circle class="state-dot" cx="${xMap(a)}" cy="${yMap(m.R / 2)}" r="5.5"/>`;
      // Доля νe в верхней волне: |<νe|ν2m>|² = sin²θm.
      const eFraction = Math.sin(m.thetaM) ** 2;
      const barW = 16, barX = width - right + 24, barY = top + 30, barH = Math.min(220, height - top - bottom - 60);
      html += `<rect class="electron-frame" x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="4"/>`;
      html += `<rect class="electron-fill" x="${barX}" y="${barY + barH * (1 - eFraction)}" width="${barW}" height="${barH * eFraction}" rx="3"/>`;
      html += `<text x="${barX + barW / 2}" y="${barY - 8}" text-anchor="middle">ν${SUB("e")}</text>`;
      html += `<text x="${barX + barW / 2}" y="${barY + barH + 18}" text-anchor="middle">${Math.round(100 * eFraction)}%</text>`;
      levelsSvg.innerHTML = html;
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

    function stop() {
      if (animation) cancelAnimationFrame(animation);
      animation = null;
      playButton.textContent = "▶ движение";
      playButton.setAttribute("aria-pressed", "false");
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

    playButton.addEventListener("click", () => {
      if (animation) {
        stop();
        return;
      }
      const start = performance.now();
      const x0 = Number(xInput.value);
      playButton.textContent = "■ стоп";
      playButton.setAttribute("aria-pressed", "true");
      const frame = (now) => {
        const elapsed = (now - start) / 1000;
        xInput.value = String((x0 + 0.36 * elapsed) % X_MAX);
        update();
        if (elapsed < 28) animation = requestAnimationFrame(frame);
        else stop();
      };
      animation = requestAnimationFrame(frame);
    });

    if (window.Reveal && typeof window.Reveal.on === "function") window.Reveal.on("slidechanged", stop);

    update();
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(() => { if (fitViewBoxes()) update(); }).observe(root);
    }

    // Подписи в разметке набраны в TeX; повторный набор безопасен, если MathJax уже прошёл по странице.
    const mj = window.MathJax;
    if (mj && mj.startup && mj.startup.promise && typeof mj.typesetPromise === "function") {
      mj.startup.promise.then(() => mj.typesetPromise([root])).catch(() => {});
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
