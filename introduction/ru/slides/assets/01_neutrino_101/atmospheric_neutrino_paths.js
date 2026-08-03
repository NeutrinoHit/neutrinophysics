(() => {
  const DURATION_MS = 8500;

  const clamp = (value, minimum = 0, maximum = 1) =>
    Math.min(maximum, Math.max(minimum, value));

  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  function initialize(root) {
    if (root.dataset.atmoPathReady === "true") return;
    root.dataset.atmoPathReady = "true";

    const currentPath = root.querySelector("[data-atmo-current-path]");
    const currentPathShadow = root.querySelector("[data-atmo-current-path-shadow]");
    const sourceMarker = root.querySelector("[data-atmo-source-marker]");
    const sourceLabel = root.querySelector("[data-atmo-source-label]");
    const particle = root.querySelector("[data-atmo-particle]");
    const ratioCurve = root.querySelector("[data-atmo-ratio-curve]");
    const graphCursor = root.querySelector("[data-atmo-graph-cursor]");
    const graphPoint = root.querySelector("[data-atmo-graph-point]");
    const lengthValue = root.querySelector("[data-atmo-length]");
    const ratioValue = root.querySelector("[data-atmo-ratio-value]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const previewValue = Number.parseFloat(
      new URLSearchParams(window.location.search).get("atmo-progress")
    );
    const previewProgress = Number.isFinite(previewValue)
      ? clamp(previewValue)
      : null;

    const earth = {x: 355, y: 245, radius: 160, atmosphereRadius: 177};
    const detector = {x: 447, y: 116};
    const detectorAngle = Math.atan2(detector.y - earth.y, detector.x - earth.x);
    const earthRadiusKm = 6371;
    const productionHeightKm = 20;
    const minimumLengthKm = productionHeightKm;
    const maximumLengthKm = 2 * earthRadiusKm + productionHeightKm;
    const graph = {x0: 72, x1: 690, yTop: 28, yBottom: 132};
    let animationStart = null;
    let wasPresent = false;

    function ratioForFraction(fraction) {
      return 2 - 0.95 * smoothstep(0.08, 0.94, fraction);
    }

    function graphY(ratio) {
      return graph.yBottom - (ratio - 1) * (graph.yBottom - graph.yTop);
    }

    const curvePoints = Array.from({length: 161}, (_, index) => {
      const fraction = index / 160;
      const x = graph.x0 + fraction * (graph.x1 - graph.x0);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${graphY(ratioForFraction(fraction)).toFixed(2)}`;
    });
    ratioCurve.setAttribute("d", curvePoints.join(" "));
    const curveLength = ratioCurve.getTotalLength();
    ratioCurve.style.strokeDasharray = `${curveLength}`;
    ratioCurve.style.strokeDashoffset = `${curveLength}`;

    function physicalLengthKm(separationAngle) {
      const productionRadius = earthRadiusKm + productionHeightKm;
      return Math.sqrt(
        earthRadiusKm ** 2
        + productionRadius ** 2
        - 2 * earthRadiusKm * productionRadius * Math.cos(separationAngle)
      );
    }

    function formatLength(lengthKm) {
      if (lengthKm < 1000) return `${Math.round(lengthKm)} км`;
      return `${(lengthKm / 1000).toFixed(1).replace(".", ",")} тыс. км`;
    }

    function drawFrame(elapsed) {
      const cycle = previewProgress ?? (reducedMotion.matches
        ? 1
        : (elapsed % DURATION_MS) / DURATION_MS);
      const sweep = smoothstep(0.035, 0.84, cycle);
      const separationAngle = Math.PI * sweep;
      const sourceAngle = detectorAngle - separationAngle;
      const source = {
        x: earth.x + earth.atmosphereRadius * Math.cos(sourceAngle),
        y: earth.y + earth.atmosphereRadius * Math.sin(sourceAngle),
      };

      const pathData = `M${source.x.toFixed(2)} ${source.y.toFixed(2)} L${detector.x} ${detector.y}`;
      currentPath.setAttribute("d", pathData);
      currentPathShadow.setAttribute("d", pathData);
      sourceMarker.setAttribute("transform", `translate(${source.x.toFixed(2)} ${source.y.toFixed(2)})`);
      sourceLabel.setAttribute("x", (source.x + (source.x >= earth.x ? 18 : -18)).toFixed(2));
      sourceLabel.setAttribute("y", (source.y - 30).toFixed(2));
      sourceLabel.setAttribute("text-anchor", source.x >= earth.x ? "start" : "end");

      const particleProgress = reducedMotion.matches
        ? 0.58
        : (elapsed % 1050) / 1050;
      particle.setAttribute("cx", (source.x + (detector.x - source.x) * particleProgress).toFixed(2));
      particle.setAttribute("cy", (source.y + (detector.y - source.y) * particleProgress).toFixed(2));
      particle.style.opacity = "1";

      const lengthKm = physicalLengthKm(separationAngle);
      const lengthFraction = clamp(
        (lengthKm - minimumLengthKm) / (maximumLengthKm - minimumLengthKm)
      );
      const ratio = ratioForFraction(lengthFraction);
      const graphX = graph.x0 + lengthFraction * (graph.x1 - graph.x0);
      const pointY = graphY(ratio);

      ratioCurve.style.strokeDashoffset = `${curveLength * (1 - lengthFraction)}`;
      graphCursor.setAttribute("x1", graphX.toFixed(2));
      graphCursor.setAttribute("x2", graphX.toFixed(2));
      graphCursor.setAttribute("y1", pointY.toFixed(2));
      graphPoint.setAttribute("cx", graphX.toFixed(2));
      graphPoint.setAttribute("cy", pointY.toFixed(2));
      lengthValue.textContent = formatLength(lengthKm);
      ratioValue.textContent = ratio.toFixed(2).replace(".", ",");
    }

    function isPresent() {
      const slide = root.closest("section");
      return !slide || slide.classList.contains("present");
    }

    function restart() {
      animationStart = performance.now();
      drawFrame(0);
    }

    function draw(now) {
      if (!document.body.contains(root)) return;

      const present = isPresent();
      if (present) {
        if (!wasPresent || animationStart === null) animationStart = now;
        drawFrame(now - animationStart);
      }
      wasPresent = present;
      requestAnimationFrame(draw);
    }

    root.addEventListener("click", restart);
    root.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key.toLowerCase() === "r") {
        event.preventDefault();
        restart();
      }
    });
    reducedMotion.addEventListener?.("change", restart);
    requestAnimationFrame(draw);
  }

  function initializeAll() {
    document.querySelectorAll("[data-atmo-path-demo]").forEach(initialize);
  }

  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
