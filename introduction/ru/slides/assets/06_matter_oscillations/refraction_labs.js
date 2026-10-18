(() => {
  "use strict";

  const twoPi = 2 * Math.PI;

  function pathFrom(fn, x0, x1, samples) {
    const points = [];
    for (let i = 0; i <= samples; i += 1) {
      const x = x0 + (x1 - x0) * i / samples;
      points.push((i === 0 ? "M" : "L") + x.toFixed(2) + " " + fn(x).toFixed(2));
    }
    return points.join(" ");
  }

  function initializeLayers(root) {
    if (root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const index = root.querySelector("[data-index]");
    const length = root.querySelector("[data-length]");
    const indexValue = root.querySelector("[data-index-value]");
    const lengthValue = root.querySelector("[data-length-value]");
    const phaseValue = root.querySelector("[data-phase-value]");
    const vacuumWave = root.querySelector("[data-vacuum-wave]");
    const mediumWave = root.querySelector("[data-medium-wave]");
    const medium = root.querySelector("[data-medium]");
    const entry = root.querySelector("[data-entry]");
    const exit = root.querySelector("[data-exit]");
    // One scale along z everywhere: 210 SVG units per vacuum wavelength.
    const unit = 210;
    const centre = 600;

    function draw() {
      const n = Number(index.value);
      const layerLength = Number(length.value);
      const x0 = centre - unit * layerLength / 2;
      const x1 = centre + unit * layerLength / 2;
      medium.setAttribute("x", x0.toFixed(2));
      medium.setAttribute("width", (x1 - x0).toFixed(2));
      [entry, exit].forEach((line, i) => {
        const x = (i === 0 ? x0 : x1).toFixed(2);
        line.setAttribute("x1", x);
        line.setAttribute("x2", x);
      });
      const coordinate = x => (x - x0) / unit;
      const vacuumY = x => 165 - 70 * Math.sin(twoPi * coordinate(x));
      const mediumY = x => {
        const z = coordinate(x);
        const phase = x <= x0 ? twoPi * z :
          x <= x1 ? twoPi * n * z :
            twoPi * (z + (n - 1) * layerLength);
        return 165 - 70 * Math.sin(phase);
      };
      vacuumWave.setAttribute("d", pathFrom(vacuumY, 70, 1130, 440));
      mediumWave.setAttribute("d", pathFrom(mediumY, 70, 1130, 440));
      indexValue.textContent = n.toFixed(3);
      lengthValue.textContent = layerLength.toFixed(2);
      phaseValue.textContent = (twoPi * (n - 1) * layerLength).toFixed(2);
    }

    index.addEventListener("input", draw);
    length.addEventListener("input", draw);
    draw();
  }

  // Arrow from (x0, y0) to (x1, y1): a line and a triangular head.
  function setArrow(line, head, x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const length = Math.hypot(dx, dy);
    const size = Math.min(22, 0.6 * length);
    const ux = length > 0 ? dx / length : 1;
    const uy = length > 0 ? dy / length : 0;
    const bx = x1 - size * ux;
    const by = y1 - size * uy;
    line.setAttribute("x1", x0.toFixed(2));
    line.setAttribute("y1", y0.toFixed(2));
    line.setAttribute("x2", (length > 1 ? bx + 0.3 * size * ux : x1).toFixed(2));
    line.setAttribute("y2", (length > 1 ? by + 0.3 * size * uy : y1).toFixed(2));
    head.setAttribute("points", [
      [x1, y1],
      [bx - 0.5 * size * uy, by + 0.5 * size * ux],
      [bx + 0.5 * size * uy, by - 0.5 * size * ux]
    ].map(p => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" "));
    const visible = length > 2 ? "visible" : "hidden";
    line.style.visibility = visible;
    head.style.visibility = visible;
  }

  function initializeModes(root) {
    if (root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const angle = root.querySelector("[data-angle]");
    const difference = root.querySelector("[data-difference]");
    const angleValue = root.querySelector("[data-angle-value]");
    const differenceValue = root.querySelector("[data-difference-value]");
    const weightValue = root.querySelector("[data-weight-value]");
    const probabilityValue = root.querySelector("[data-probability-value]");
    const parts = name => [
      root.querySelector("[data-" + name + "]"),
      root.querySelector("[data-" + name + "-head]"),
      root.querySelector("[data-" + name + "-label]")
    ];
    const [first, firstHead, firstLabel] = parts("first");
    const [second, secondHead, secondLabel] = parts("second");
    const [sum, sumHead, sumLabel] = parts("sum");
    const locus = root.querySelector("[data-locus]");
    const curve = root.querySelector("[data-probability-curve]");
    const marker = root.querySelector("[data-probability-marker]");
    // Complex plane of A(e -> x): origin and length of the unit amplitude.
    const ox = 450;
    const oy = 218;
    const unit = 300;

    // Label next to the middle of a segment, on the side away from (gx, gy).
    function place(label, x0, y0, x1, y1, gx, gy, fallback) {
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const length = Math.hypot(x1 - x0, y1 - y0);
      let nx = length > 0 ? -(y1 - y0) / length : 0;
      let ny = length > 0 ? (x1 - x0) / length : 1;
      const side = nx * (mx - gx) + ny * (my - gy);
      if (Math.abs(side) < 4) {
        nx = 0;
        ny = fallback;
      } else if (side < 0) {
        nx = -nx;
        ny = -ny;
      }
      label.setAttribute("x", (mx + 30 * nx).toFixed(2));
      label.setAttribute("y", (my + 30 * ny + 9).toFixed(2));
      label.style.visibility = length > 2 ? "visible" : "hidden";
    }

    function draw() {
      const degrees = Number(angle.value);
      const theta = degrees * Math.PI / 180;
      const phase = Number(difference.value);
      // A = -sin(theta) cos(theta) + sin(theta) cos(theta) exp(i phase),
      // the common phase exp(i k_1m L) is removed; |A|^2 = P(e -> x).
      const weight = Math.sin(theta) * Math.cos(theta);
      const probability = phi => (Math.sin(2 * theta) * Math.sin(phi / 2)) ** 2;
      const x1 = ox - unit * weight;
      const y1 = oy;
      const x2 = x1 + unit * weight * Math.cos(phase);
      const y2 = y1 - unit * weight * Math.sin(phase);
      locus.setAttribute("cx", x1.toFixed(2));
      locus.setAttribute("r", (unit * weight).toFixed(2));
      setArrow(sum, sumHead, ox, oy, x2, y2);
      setArrow(first, firstHead, ox, oy, x1, y1);
      setArrow(second, secondHead, x1, y1, x2, y2);
      const gx = (ox + x1 + x2) / 3;
      const gy = (oy + y1 + y2) / 3;
      place(firstLabel, ox, oy, x1, y1, gx, gy, 1);
      place(secondLabel, x1, y1, x2, y2, gx, gy, Math.cos(phase) > 0 ? -1 : 1);
      place(sumLabel, ox, oy, x2, y2, gx, gy, -1);
      curve.setAttribute("d", pathFrom(
        x => 345 - 270 * probability(twoPi * (x - 605) / 505),
        605, 1110, 240
      ));
      marker.setAttribute("cx", (605 + 505 * phase / twoPi).toFixed(2));
      marker.setAttribute("cy", (345 - 270 * probability(phase)).toFixed(2));
      angleValue.textContent = degrees + "°";
      differenceValue.textContent = phase.toFixed(2) + " рад";
      weightValue.textContent = weight.toFixed(3);
      probabilityValue.textContent = probability(phase).toFixed(3);
    }

    angle.addEventListener("input", draw);
    difference.addEventListener("input", draw);
    draw();
  }

  function initializeAll() {
    document.querySelectorAll("[data-refraction-layers]").forEach(initializeLayers);
    document.querySelectorAll("[data-refraction-modes]").forEach(initializeModes);
  }

  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
