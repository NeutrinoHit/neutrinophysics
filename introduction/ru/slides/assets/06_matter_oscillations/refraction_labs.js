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

    function draw() {
      const n = Number(index.value);
      const layerLength = Number(length.value);
      const coordinate = x => {
        if (x <= 285) return (x - 285) / 210;
        if (x <= 915) return layerLength * (x - 285) / 630;
        return layerLength + (x - 915) / 210;
      };
      const vacuumY = x => 165 - 70 * Math.sin(twoPi * coordinate(x));
      const mediumY = x => {
        const z = coordinate(x);
        const phase = x <= 285 ? twoPi * z :
          x <= 915 ? twoPi * n * z :
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

  function initializeModes(root) {
    if (root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const angle = root.querySelector("[data-angle]");
    const difference = root.querySelector("[data-difference]");
    const angleValue = root.querySelector("[data-angle-value]");
    const differenceValue = root.querySelector("[data-difference-value]");
    const probabilityValue = root.querySelector("[data-probability-value]");
    const secondMode = root.querySelector("[data-second-mode]");
    const secondDot = root.querySelector("[data-second-dot]");
    const secondLabel = root.querySelector("[data-second-label]");
    const curve = root.querySelector("[data-probability-curve]");
    const marker = root.querySelector("[data-probability-marker]");

    function draw() {
      const degrees = Number(angle.value);
      const theta = degrees * Math.PI / 180;
      const phase = Number(difference.value);
      const amplitude = Math.sin(2 * theta) ** 2;
      const probability = phi => amplitude * Math.sin(phi / 2) ** 2;
      const tipX = 255 + 137 * Math.cos(phase);
      const tipY = 218 - 137 * Math.sin(phase);
      secondMode.setAttribute("x2", tipX.toFixed(2));
      secondMode.setAttribute("y2", tipY.toFixed(2));
      secondDot.setAttribute("cx", tipX.toFixed(2));
      secondDot.setAttribute("cy", tipY.toFixed(2));
      secondLabel.setAttribute("x", (tipX + (tipX > 255 ? 12 : -24)).toFixed(2));
      const sameDirection = Math.cos(phase) > 0.9 && Math.abs(Math.sin(phase)) < 0.25;
      secondLabel.setAttribute("y", (tipY + (sameDirection ? 30 : -12)).toFixed(2));
      curve.setAttribute("d", pathFrom(
        x => 345 - 270 * probability(twoPi * (x - 605) / 505),
        605, 1110, 240
      ));
      marker.setAttribute("cx", (605 + 505 * phase / twoPi).toFixed(2));
      marker.setAttribute("cy", (345 - 270 * probability(phase)).toFixed(2));
      angleValue.textContent = degrees + "°";
      differenceValue.textContent = phase.toFixed(2) + " рад";
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
