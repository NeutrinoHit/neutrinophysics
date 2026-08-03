(() => {
  const DURATION_MS = 30000;
  const TAU = 2 * Math.PI;

  const clamp = (value, minimum = 0, maximum = 1) =>
    Math.min(maximum, Math.max(minimum, value));

  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  function branchY(travel) {
    return 472 - 44 * travel + 6 * Math.sin(TAU * (travel + 0.08));
  }

  function setLegRotation(root, name, angle, anchorX, anchorY) {
    root.querySelectorAll(`[data-qc-leg="${name}"]`).forEach((leg) => {
      leg.setAttribute("transform", `rotate(${angle.toFixed(2)} ${anchorX} ${anchorY})`);
    });
  }

  function initialize(root) {
    if (root.dataset.quantumChameleonReady === "true") return;
    root.dataset.quantumChameleonReady = "true";

    const chameleon = root.querySelector("[data-qc-chameleon]");
    const camoWorlds = root.querySelectorAll("[data-qc-camo-world]");
    const outlineLayers = root.querySelectorAll("[data-qc-outline-layer]");
    const pupil = root.querySelector("[data-qc-pupil]");
    const butterfly = root.querySelector("[data-qc-butterfly]");
    const wings = root.querySelectorAll("[data-qc-wing]");
    const tongue = root.querySelector("[data-qc-tongue]");
    const tongueLine = root.querySelector("[data-qc-tongue-line]");
    const tongueHighlight = root.querySelector("[data-qc-tongue-highlight]");
    const tongueTip = root.querySelector("[data-qc-tongue-tip]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const previewValue = Number.parseFloat(
      new URLSearchParams(window.location.search).get("qc-progress")
    );
    const previewProgress = Number.isFinite(previewValue) ? clamp(previewValue) : null;

    let animationStart = null;
    let wasPresent = false;

    function restart() {
      animationStart = performance.now();
    }

    function isPresent() {
      const slide = root.closest("section");
      return !slide || slide.classList.contains("present");
    }

    function drawFrame(elapsed) {
      const rawProgress = previewProgress ?? (
        reducedMotion.matches ? 0.52 : (elapsed % DURATION_MS) / DURATION_MS
      );
      const travel = clamp((rawProgress - 0.035) / 0.705);
      const x = 64 + 1328 * travel;
      const walkPhase = travel * 22 * TAU;
      const bodyLift = 2.6 * (0.5 + 0.5 * Math.cos(2 * walkPhase));
      const y = branchY(travel) - 82 - bodyLift;
      const fadeIn = smoothstep(0.005, 0.048, rawProgress);
      const fadeOut = 1 - smoothstep(0.935, 0.995, rawProgress);
      const opacity = reducedMotion.matches ? 1 : fadeIn * fadeOut;

      chameleon.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      chameleon.setAttribute("opacity", opacity.toFixed(3));
      camoWorlds.forEach((world) => {
        world.setAttribute("transform", `translate(${-x.toFixed(2)} ${-y.toFixed(2)})`);
      });

      const nearSwing = 17 * Math.sin(walkPhase);
      const farSwing = 13 * Math.sin(walkPhase + Math.PI);
      setLegRotation(root, "rear-near", nearSwing, -29, 35);
      setLegRotation(root, "front-near", -nearSwing, 75, 31);
      setLegRotation(root, "rear-far", farSwing, -37, 27);
      setLegRotation(root, "front-far", -farSwing, 72, 22);

      const camouflageSettled = smoothstep(0.08, 0.22, rawProgress);
      const outlineOpacity = (0.84 - 0.14 * camouflageSettled).toFixed(3);
      outlineLayers.forEach((layer) => {
        layer.style.opacity = outlineOpacity;
      });

      const mouthX = x + 185;
      const mouthY = y + 14;
      const freeFlightProgress = Math.min(rawProgress, 0.835);
      const horizontalDrift = smoothstep(0.05, 0.79, freeFlightProgress);
      const verticalDrift = smoothstep(0.35, 0.80, freeFlightProgress);
      const preyX = 720 + 325 * horizontalDrift;
      const preyY = 245
        + 105 * verticalDrift
        + 16 * Math.sin((freeFlightProgress - 0.835) * 5 * TAU);
      const tongueRetractEnd = 0.847 + 500 / DURATION_MS;
      const tongueShoot = smoothstep(0.805, 0.835, rawProgress);
      const tongueRetract = smoothstep(0.847, tongueRetractEnd, rawProgress);
      const tongueReach = tongueShoot * (1 - tongueRetract);
      const tongueEndX = mouthX + (preyX - mouthX) * tongueReach;
      const tongueEndY = mouthY + (preyY - mouthY) * tongueReach;
      const caught = rawProgress >= 0.835;
      const butterflyX = caught ? tongueEndX : preyX;
      const butterflyY = caught ? tongueEndY : preyY;
      const butterflyTilt = caught
        ? -12 + 18 * tongueRetract
        : 8 * Math.sin(rawProgress * 5 * TAU);
      butterfly.setAttribute(
        "transform",
        `translate(${butterflyX.toFixed(2)} ${butterflyY.toFixed(2)}) rotate(${butterflyTilt.toFixed(2)})`
      );
      butterfly.setAttribute("opacity", rawProgress >= tongueRetractEnd ? "0" : "1");

      const localTongueEndX = tongueEndX - x;
      const localTongueEndY = tongueEndY - y;
      const tongueControlX = 185 + 0.52 * (localTongueEndX - 185);
      const tongueControlY = 14 + 0.52 * (localTongueEndY - 14) - 7 * tongueReach;
      const tonguePath = `M185 14 Q${tongueControlX.toFixed(2)} ${tongueControlY.toFixed(2)} ${localTongueEndX.toFixed(2)} ${localTongueEndY.toFixed(2)}`;
      const highlightPath = `M185 11.8 Q${tongueControlX.toFixed(2)} ${(tongueControlY - 2).toFixed(2)} ${localTongueEndX.toFixed(2)} ${(localTongueEndY - 2).toFixed(2)}`;
      const tongueAngle = Math.atan2(localTongueEndY - 14, localTongueEndX - 185) * 180 / Math.PI;
      tongueLine.setAttribute("d", tonguePath);
      tongueHighlight.setAttribute("d", highlightPath);
      tongueTip.setAttribute("transform", `translate(${localTongueEndX.toFixed(2)} ${localTongueEndY.toFixed(2)}) rotate(${tongueAngle.toFixed(2)})`);
      tongueTip.setAttribute("cx", "0");
      tongueTip.setAttribute("cy", "0");
      tongue.setAttribute("opacity", tongueReach > 0.015 ? "1" : "0");

      const eyeX = x + 133;
      const eyeY = y - 14;
      const lookX = butterflyX - eyeX;
      const lookY = butterflyY - eyeY;
      const lookLength = Math.max(1, Math.hypot(lookX, lookY));
      pupil.setAttribute("cx", (133 + 5 * lookX / lookLength).toFixed(2));
      pupil.setAttribute("cy", (-14 + 5 * lookY / lookLength).toFixed(2));

      const flap = caught ? 0.88 : 0.32 + 0.68 * Math.abs(Math.sin(elapsed / 115));
      wings[0].setAttribute("transform", `rotate(28 -7 -3) scale(1 ${flap.toFixed(3)})`);
      wings[1].setAttribute("transform", `rotate(-28 7 -3) scale(1 ${flap.toFixed(3)})`);
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
      if (event.key.toLowerCase() === "r" || event.key === "Enter") {
        event.preventDefault();
        restart();
      }
    });

    reducedMotion.addEventListener?.("change", restart);
    requestAnimationFrame(draw);
  }

  function initializeAll() {
    document.querySelectorAll("[data-quantum-chameleon]").forEach(initialize);
  }

  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
