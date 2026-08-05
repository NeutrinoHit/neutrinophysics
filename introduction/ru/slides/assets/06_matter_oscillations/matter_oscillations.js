(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const deg = (radians) => radians * 180 / Math.PI;
  const rad = (degrees) => degrees * Math.PI / 180;
  const fmt = (x, digits = 3) => Number.isFinite(x) ? x.toFixed(digits) : "—";

  function pathFrom(points, xMap, yMap) {
    return points.map((p, i) => `${i ? "L" : "M"}${xMap(p[0]).toFixed(2)},${yMap(p[1]).toFixed(2)}`).join(" ");
  }

  function baseAxes({ width, height, left, right, top, bottom, xTicks, yTicks, xMap, yMap, xLabel, yLabel }) {
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
    if (xLabel) html += `<text x="${(left + width - right) / 2}" y="${height - 5}" text-anchor="middle">${xLabel}</text>`;
    if (yLabel) html += `<text x="13" y="${(top + height - bottom) / 2}" text-anchor="middle" transform="rotate(-90 13 ${(top + height - bottom) / 2})">${yLabel}</text>`;
    return html;
  }

  function setOutput(root, name, value) {
    const node = root.querySelector(`[data-out="${name}"]`);
    if (node) node.textContent = value;
  }

  function setValue(root, name, value) {
    const node = root.querySelector(`[data-val="${name}"]`);
    if (node) node.textContent = value;
  }

  function initConstantLab() {
    const root = document.getElementById("matter-constant-lab");
    if (!root || root.dataset.ready === "1") return;
    root.dataset.ready = "1";

    const thetaInput = root.querySelector('[data-control="theta"]');
    const aInput = root.querySelector('[data-control="A"]');
    const xInput = root.querySelector('[data-control="x"]');
    const probSvg = root.querySelector('[data-plot="probability"]');
    const levelsSvg = root.querySelector('[data-plot="levels"]');
    let animation = null;

    function model() {
      const thetaDeg = Number(thetaInput.value);
      const theta = rad(thetaDeg);
      const A = Number(aInput.value);
      const x = Number(xInput.value);
      const s2 = Math.sin(2 * theta);
      const c2 = Math.cos(2 * theta);
      const R = Math.hypot(c2 - A, s2);
      const thetaM = 0.5 * Math.atan2(s2, c2 - A);
      const amp = (s2 / R) ** 2;
      const P = amp * Math.sin(Math.PI * R * x) ** 2;
      return { thetaDeg, theta, A, x, s2, c2, R, thetaM, amp, P };
    }

    function renderProbability(m) {
      const width = 610, height = 270, left = 46, right = 15, top = 14, bottom = 39;
      const xMap = (v) => left + (width - left - right) * v / 5;
      const yMap = (v) => height - bottom - (height - top - bottom) * v;
      const matter = [], vacuum = [];
      for (let i = 0; i <= 320; i += 1) {
        const xx = 5 * i / 320;
        matter.push([xx, m.amp * Math.sin(Math.PI * m.R * xx) ** 2]);
        vacuum.push([xx, m.s2 ** 2 * Math.sin(Math.PI * xx) ** 2]);
      }
      let html = baseAxes({
        width, height, left, right, top, bottom,
        xTicks: [0, 1, 2, 3, 4, 5], yTicks: [0, 0.25, 0.5, 0.75, 1],
        xMap, yMap, xLabel: "L / Lvac", yLabel: "P(e → x)"
      });
      html += `<path class="vacuum-line" d="${pathFrom(vacuum, xMap, yMap)}"/>`;
      html += `<path class="envelope-line" d="M${xMap(0)},${yMap(m.amp)} L${xMap(5)},${yMap(m.amp)}"/>`;
      html += `<path class="matter-line" d="${pathFrom(matter, xMap, yMap)}"/>`;
      html += `<line class="probe" x1="${xMap(m.x)}" y1="${top}" x2="${xMap(m.x)}" y2="${height - bottom}"/>`;
      html += `<circle class="probe-dot" cx="${xMap(m.x)}" cy="${yMap(m.P)}" r="5"/>`;
      html += `<line class="vacuum-line" x1="385" y1="24" x2="418" y2="24"/><text class="legend-label" x="424" y="28">вакуум</text>`;
      html += `<line class="matter-line" x1="385" y1="43" x2="418" y2="43"/><text class="legend-label" x="424" y="47">вещество</text>`;
      html += `<line class="envelope-line" x1="385" y1="62" x2="418" y2="62"/><text class="legend-label" x="424" y="66">огибающая</text>`;
      probSvg.innerHTML = html;
    }

    function renderLevels(m) {
      const width = 440, height = 270, left = 43, right = 20, top = 14, bottom = 39;
      const xmin = -3, xmax = 5, ymin = -2.8, ymax = 2.8;
      const xMap = (v) => left + (width - left - right) * (v - xmin) / (xmax - xmin);
      const yMap = (v) => height - bottom - (height - top - bottom) * (v - ymin) / (ymax - ymin);
      const upper = [], lower = [], bare1 = [], bare2 = [];
      for (let i = 0; i <= 280; i += 1) {
        const A = xmin + (xmax - xmin) * i / 280;
        const R = Math.hypot(m.c2 - A, m.s2);
        upper.push([A, R / 2]);
        lower.push([A, -R / 2]);
        bare1.push([A, (A - m.c2) / 2]);
        bare2.push([A, -(A - m.c2) / 2]);
      }
      let html = baseAxes({
        width, height, left, right, top, bottom,
        xTicks: [-3, -1, 0, 1, 3, 5], yTicks: [-2, -1, 0, 1, 2],
        xMap, yMap, xLabel: "A = V/Δ", yLabel: "λ / Δ"
      });
      html += `<path class="bare-branch" d="${pathFrom(bare1, xMap, yMap)}"/>`;
      html += `<path class="bare-branch" d="${pathFrom(bare2, xMap, yMap)}"/>`;
      html += `<path class="branch" d="${pathFrom(upper, xMap, yMap)}"/>`;
      html += `<path class="branch" d="${pathFrom(lower, xMap, yMap)}"/>`;
      const currentA = clamp(m.A, xmin, xmax);
      html += `<line class="probe" x1="${xMap(currentA)}" y1="${top}" x2="${xMap(currentA)}" y2="${height - bottom}"/>`;
      html += `<circle class="state-dot" cx="${xMap(currentA)}" cy="${yMap(m.R / 2)}" r="5.5"/>`;
      const eFraction = Math.sin(m.thetaM) ** 2;
      const barX = width - 48, barY = 30, barH = 104, barW = 16;
      html += `<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="4" fill="rgba(190,214,236,.12)" stroke="rgba(190,214,236,.35)"/>`;
      html += `<rect class="electron-fill" x="${barX}" y="${barY + barH * (1 - eFraction)}" width="${barW}" height="${barH * eFraction}" rx="3"/>`;
      html += `<text x="${barX + 8}" y="${barY - 7}" text-anchor="middle">νe</text>`;
      html += `<text x="${barX + 8}" y="${barY + barH + 16}" text-anchor="middle">${Math.round(100 * eFraction)}%</text>`;
      html += `<text x="${xMap(m.c2)}" y="${height - bottom - 7}" text-anchor="middle" fill="var(--matter-gold)">рез.</text>`;
      levelsSvg.innerHTML = html;
    }

    function update() {
      const m = model();
      setOutput(root, "theta", fmt(m.thetaDeg, 1));
      setOutput(root, "A", fmt(m.A, 2));
      setOutput(root, "x", fmt(m.x, 2));
      setValue(root, "thetaM", `${fmt(deg(m.thetaM), 1)}°`);
      setValue(root, "R", fmt(m.R, 3));
      setValue(root, "amp", fmt(m.amp, 3));
      setValue(root, "period", fmt(1 / m.R, 3));
      setValue(root, "P", fmt(m.P, 3));
      renderProbability(m);
      renderLevels(m);
    }

    [thetaInput, aInput, xInput].forEach((input) => input.addEventListener("input", update));
    root.querySelectorAll("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const theta = rad(Number(thetaInput.value));
        const resonance = Math.cos(2 * theta);
        const preset = button.dataset.preset;
        if (preset === "vacuum") aInput.value = "0";
        if (preset === "resonance") aInput.value = String(resonance);
        if (preset === "dense") aInput.value = "4.5";
        if (preset === "antinu") aInput.value = "-1.5";
        update();
      });
    });

    const playButton = root.querySelector('[data-action="play"]');
    playButton.addEventListener("click", () => {
      if (animation) {
        cancelAnimationFrame(animation);
        animation = null;
        playButton.textContent = "▶ движение";
        return;
      }
      const start = performance.now();
      const x0 = Number(xInput.value);
      playButton.textContent = "■ стоп";
      const frame = (now) => {
        const elapsed = (now - start) / 1000;
        xInput.value = String((x0 + elapsed * 0.72) % 5);
        update();
        if (elapsed < 14) {
          animation = requestAnimationFrame(frame);
        } else {
          animation = null;
          playButton.textContent = "▶ движение";
        }
      };
      animation = requestAnimationFrame(frame);
    });

    update();
  }

  function cAbs2(z) {
    return z.re * z.re + z.im * z.im;
  }

  function rotateReal(theta, z0, z1, transpose = false) {
    const c = Math.cos(theta), s = Math.sin(theta);
    if (transpose) {
      return [
        { re: c * z0.re - s * z1.re, im: c * z0.im - s * z1.im },
        { re: s * z0.re + c * z1.re, im: s * z0.im + c * z1.im }
      ];
    }
    return [
      { re: c * z0.re + s * z1.re, im: c * z0.im + s * z1.im },
      { re: -s * z0.re + c * z1.re, im: -s * z0.im + c * z1.im }
    ];
  }

  function layerStep(psi, theta, A, dx) {
    const s2 = Math.sin(2 * theta);
    const c2 = Math.cos(2 * theta);
    const R = Math.hypot(c2 - A, s2);
    const h00 = (A - c2) / R;
    const h01 = s2 / R;
    const phase = R * dx / 2;
    const cp = Math.cos(phase);
    const sp = Math.sin(phase);
    const z0 = {
      re: h00 * psi[0].re + h01 * psi[1].re,
      im: h00 * psi[0].im + h01 * psi[1].im
    };
    const z1 = {
      re: h01 * psi[0].re - h00 * psi[1].re,
      im: h01 * psi[0].im - h00 * psi[1].im
    };
    return [
      { re: cp * psi[0].re + sp * z0.im, im: cp * psi[0].im - sp * z0.re },
      { re: cp * psi[1].re + sp * z1.im, im: cp * psi[1].im - sp * z1.re }
    ];
  }

  function initAdiabaticLab() {
    const root = document.getElementById("matter-adiabatic-lab");
    if (!root || root.dataset.ready === "1") return;
    root.dataset.ready = "1";

    const a0Input = root.querySelector('[data-control="A0"]');
    const tInput = root.querySelector('[data-control="T"]');
    const thetaInput = root.querySelector('[data-control="theta"]');
    const profileSvg = root.querySelector('[data-plot="profile"]');
    const branchesSvg = root.querySelector('[data-plot="branches"]');
    const progress = root.querySelector("[data-progress]");
    let data = null;
    let animation = null;
    let cursor = 1;

    const profileA = (s, A0) => A0 * (1 - 3 * s * s + 2 * s * s * s);
    const profileDerivative = (s, A0) => A0 * (-6 * s + 6 * s * s);

    function matterParameters(theta, A) {
      const s2 = Math.sin(2 * theta);
      const c2 = Math.cos(2 * theta);
      const R = Math.hypot(c2 - A, s2);
      const thetaM = 0.5 * Math.atan2(s2, c2 - A);
      return { s2, c2, R, thetaM };
    }

    function simulate() {
      const A0 = Number(a0Input.value);
      const T = Number(tInput.value);
      const thetaDeg = Number(thetaInput.value);
      const theta = rad(thetaDeg);
      const n = 620;
      const start = matterParameters(theta, A0);
      let psi = [
        { re: Math.sin(start.thetaM), im: 0 },
        { re: Math.cos(start.thetaM), im: 0 }
      ];
      const rows = [];
      let maxEta = 0;
      let minGap = Infinity;

      for (let i = 0; i < n; i += 1) {
        const s = i / (n - 1);
        const A = profileA(s, A0);
        const mp = matterParameters(theta, A);
        const mass = rotateReal(theta, psi[0], psi[1], true);
        const matter = rotateReal(mp.thetaM, psi[0], psi[1], true);
        const alpha = mp.thetaM - theta;
        const eta = Math.abs(profileDerivative(s, A0) / T) * mp.s2 / (2 * mp.R ** 3);
        maxEta = Math.max(maxEta, eta);
        minGap = Math.min(minGap, mp.R);
        rows.push({
          s, A, R: mp.R, thetaM: mp.thetaM, eta,
          Pe: cAbs2(psi[0]),
          P2: cAbs2(mass[1]),
          P2m: cAbs2(matter[1]),
          P1m: cAbs2(matter[0]),
          P2ad: Math.cos(alpha) ** 2,
          upper: mp.R / 2,
          lower: -mp.R / 2
        });
        if (i < n - 1) {
          const smid = (i + 0.5) / (n - 1);
          const Amid = profileA(smid, A0);
          const dx = T / (n - 1);
          psi = layerStep(psi, theta, Amid, dx);
        }
      }
      return { A0, T, theta, thetaDeg, rows, maxEta, minGap };
    }

    function renderProfile(d, at = 1) {
      const width = 610, height = 285, left = 47, right = 15, top = 15, bottom = 39;
      const xMap = (v) => left + (width - left - right) * v;
      const yMap = (v) => height - bottom - (height - top - bottom) * v;
      const pe = d.rows.map((r) => [r.s, r.Pe]);
      const p2 = d.rows.map((r) => [r.s, r.P2]);
      const p2m = d.rows.map((r) => [r.s, r.P2m]);
      const p2ad = d.rows.map((r) => [r.s, r.P2ad]);
      const density = d.rows.map((r) => [r.s, r.A / d.A0]);
      let html = baseAxes({
        width, height, left, right, top, bottom,
        xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 0.25, 0.5, 0.75, 1],
        xMap, yMap, xLabel: "s = x / X", yLabel: "вероятность"
      });
      html += `<path d="${pathFrom(density, xMap, yMap)}" fill="none" stroke="rgba(200,214,228,.32)" stroke-width="7"/>`;
      html += `<path d="${pathFrom(p2ad, xMap, yMap)}" fill="none" stroke="var(--matter-blue)" stroke-width="1.4" stroke-dasharray="4 4" opacity=".65"/>`;
      html += `<path d="${pathFrom(pe, xMap, yMap)}" fill="none" stroke="var(--matter-red)" stroke-width="2.5"/>`;
      html += `<path d="${pathFrom(p2, xMap, yMap)}" fill="none" stroke="var(--matter-blue)" stroke-width="3"/>`;
      html += `<path d="${pathFrom(p2m, xMap, yMap)}" fill="none" stroke="var(--matter-gold)" stroke-width="2.6"/>`;
      const index = clamp(Math.round(at * (d.rows.length - 1)), 0, d.rows.length - 1);
      const row = d.rows[index];
      html += `<line class="probe" x1="${xMap(row.s)}" y1="${top}" x2="${xMap(row.s)}" y2="${height - bottom}"/>`;
      [[row.Pe, "var(--matter-red)"], [row.P2, "var(--matter-blue)"], [row.P2m, "var(--matter-gold)"]].forEach(([value, color]) => {
        html += `<circle cx="${xMap(row.s)}" cy="${yMap(value)}" r="4.5" fill="${color}" stroke="#fff" stroke-width="1"/>`;
      });
      const legend = [
        ["Pe", "var(--matter-red)"], ["P2", "var(--matter-blue)"], ["P2m", "var(--matter-gold)"], ["A/A0", "rgba(200,214,228,.55)"]
      ];
      legend.forEach((item, i) => {
        const x = 335 + (i % 2) * 105, y = 25 + Math.floor(i / 2) * 19;
        html += `<line x1="${x}" y1="${y}" x2="${x + 26}" y2="${y}" stroke="${item[1]}" stroke-width="3"/><text class="legend-label" x="${x + 31}" y="${y + 4}">${item[0]}</text>`;
      });
      profileSvg.innerHTML = html;
    }

    function renderBranches(d, at = 1) {
      const width = 440, height = 285, left = 46, right = 18, top = 15, bottom = 39;
      const maxR = Math.max(...d.rows.map((r) => r.R / 2));
      const ylim = Math.max(1, maxR * 1.12);
      const xMap = (v) => left + (width - left - right) * v;
      const yMap = (v) => height - bottom - (height - top - bottom) * (v + ylim) / (2 * ylim);
      const upper = d.rows.map((r) => [r.s, r.upper]);
      const lower = d.rows.map((r) => [r.s, r.lower]);
      let html = baseAxes({
        width, height, left, right, top, bottom,
        xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [-Math.round(ylim), 0, Math.round(ylim)],
        xMap, yMap, xLabel: "s", yLabel: "λ / Δ"
      });
      html += `<path class="branch" d="${pathFrom(upper, xMap, yMap)}"/>`;
      html += `<path class="branch" d="${pathFrom(lower, xMap, yMap)}"/>`;
      for (let i = 0; i < d.rows.length; i += 14) {
        const r = d.rows[i];
        html += `<circle cx="${xMap(r.s)}" cy="${yMap(r.upper)}" r="3.3" fill="var(--matter-gold)" opacity="${0.12 + 0.86 * r.P2m}"/>`;
        html += `<circle cx="${xMap(r.s)}" cy="${yMap(r.lower)}" r="3.3" fill="var(--matter-purple)" opacity="${0.08 + 0.9 * r.P1m}"/>`;
      }
      const index = clamp(Math.round(at * (d.rows.length - 1)), 0, d.rows.length - 1);
      const row = d.rows[index];
      html += `<line class="probe" x1="${xMap(row.s)}" y1="${top}" x2="${xMap(row.s)}" y2="${height - bottom}"/>`;
      html += `<circle class="state-dot" cx="${xMap(row.s)}" cy="${yMap(row.upper)}" r="${4 + 4 * row.P2m}" opacity="${0.25 + 0.75 * row.P2m}"/>`;
      html += `<circle cx="${xMap(row.s)}" cy="${yMap(row.lower)}" r="${3 + 5 * row.P1m}" fill="var(--matter-purple)" stroke="#fff" stroke-width="1" opacity="${0.18 + 0.82 * row.P1m}"/>`;
      html += `<text x="70" y="27">● upper: P2m</text><text x="70" y="46" fill="var(--matter-purple)">● lower: P1m</text>`;
      branchesSvg.innerHTML = html;
    }

    function update(recompute = true) {
      if (recompute || !data) data = simulate();
      const last = data.rows[data.rows.length - 1];
      setOutput(root, "A0", fmt(data.A0, 1));
      setOutput(root, "T", fmt(data.T, data.T % 1 ? 1 : 0));
      setOutput(root, "theta", fmt(data.thetaDeg, 1));
      setValue(root, "eta", fmt(data.maxEta, data.maxEta < 0.01 ? 4 : 3));
      setValue(root, "gap", fmt(data.minGap, 3));
      setValue(root, "P2m", fmt(last.P2m, 4));
      setValue(root, "P2", fmt(last.P2, 4));
      setValue(root, "Pe", fmt(last.Pe, 4));
      renderProfile(data, cursor);
      renderBranches(data, cursor);
      progress.style.transform = `scaleX(${cursor})`;
    }

    [a0Input, tInput, thetaInput].forEach((input) => input.addEventListener("input", () => {
      cursor = 1;
      update(true);
    }));

    root.querySelectorAll("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = button.dataset.preset;
        if (preset === "slow") {
          a0Input.value = "5.5";
          tInput.value = "55";
          thetaInput.value = "33.4";
        }
        if (preset === "fast") {
          a0Input.value = "5.5";
          tInput.value = "3";
          thetaInput.value = "33.4";
        }
        if (preset === "smallmix") {
          a0Input.value = "5.5";
          tInput.value = "55";
          thetaInput.value = "8";
        }
        cursor = 1;
        update(true);
      });
    });

    const playButton = root.querySelector('[data-action="play"]');
    playButton.addEventListener("click", () => {
      if (animation) {
        cancelAnimationFrame(animation);
        animation = null;
        cursor = 1;
        playButton.textContent = "▶ пройти профиль";
        update(false);
        return;
      }
      data = simulate();
      const start = performance.now();
      const duration = 6500;
      playButton.textContent = "■ остановить";
      const frame = (now) => {
        cursor = clamp((now - start) / duration, 0, 1);
        update(false);
        if (cursor < 1) {
          animation = requestAnimationFrame(frame);
        } else {
          animation = null;
          playButton.textContent = "▶ пройти профиль";
        }
      };
      cursor = 0;
      animation = requestAnimationFrame(frame);
    });

    update(true);
  }

  function init() {
    initConstantLab();
    initAdiabaticLab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  if (window.Reveal && typeof window.Reveal.on === "function") {
    window.Reveal.on("ready", init);
  }
})();
