(function () {
  "use strict";

  const ROOT_ID = "loss-cone-lab";
  const EARTH_RADIUS_KM = 6371;
  const ATMOSPHERE_HEIGHT_KM = 100;
  const ATMOSPHERE_RADIUS = 1 + ATMOSPHERE_HEIGHT_KM / EARTH_RADIUS_KM;
  const EARTH_CX = 94;
  const EARTH_CY = 220;
  const SPACE_SCALE = 158;
  const PLOT = { left: 58, right: 790, top: 492, bottom: 598 };
  const VELOCITY = { cx: 1050, cy: 552, radius: 72 };

  function initLossConeLab() {
    const root = document.getElementById(ROOT_ID);
    if (!root || root.dataset.initialized === "true") return;
    root.dataset.initialized = "true";

    const svg = root.querySelector("svg");
    const get = (role) => root.querySelector(`[data-role="${role}"]`);
    const elements = {
      fieldLine: get("field-line"),
      travelledPath: get("travelled-path"),
      mirrorPoints: get("mirror-points"),
      mirrorNorth: get("mirror-north"),
      mirrorSouth: get("mirror-south"),
      impactGlow: get("impact-glow"),
      particle: get("particle"),
      weakFieldLabel: get("weak-field-label"),
      strongFieldLabel: get("strong-field-label"),
      lineLabel: get("line-label"),
      fieldPlotPath: get("field-plot-path"),
      mirrorLevel: get("mirror-level"),
      mirrorLevelLabel: get("mirror-level-label"),
      plotMirrorSouth: get("plot-mirror-south"),
      plotMirrorNorth: get("plot-mirror-north"),
      plotParticle: get("plot-particle"),
      lossSectorRight: get("loss-sector-right"),
      lossSectorLeft: get("loss-sector-left"),
      velocityArrow: get("velocity-arrow"),
      velocityHandle: get("velocity-handle"),
      velocityHit: get("velocity-hit"),
      lSlider: get("l-slider"),
      alphaSlider: get("alpha-slider"),
      lValue: get("l-value"),
      heightValue: get("height-value"),
      alphaValue: get("alpha-value"),
      prediction: get("prediction"),
      lossAngle: get("loss-angle"),
      mirrorRatio: get("mirror-ratio"),
      energyParallel: get("energy-parallel"),
      energyPerp: get("energy-perp"),
      energyTotal: get("energy-total"),
      energyParallelValue: get("energy-parallel-value"),
      energyPerpValue: get("energy-perp-value"),
      energyTotalValue: get("energy-total-value"),
      play: get("play"),
      pause: get("pause"),
      reset: get("reset"),
      stateExplanation: get("state-explanation")
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const state = {
      l: Number(elements.lSlider.value),
      alphaDeg: Number(elements.alphaSlider.value),
      elapsed: 0,
      running: false,
      lastTime: 0,
      frame: 0,
      draggingVelocity: false,
      announcedState: ""
    };

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function smoothstep(value) {
      const x = clamp(value, 0, 1);
      return x * x * (3 - 2 * x);
    }

    function formatOne(value) {
      return value.toFixed(1).replace(".", ",");
    }

    function formatPercent(value) {
      return `${Math.round(clamp(value, 0, 1) * 100)}%`;
    }

    function atmosphereLatitude(lValue) {
      return Math.acos(Math.sqrt(ATMOSPHERE_RADIUS / lValue));
    }

    function fieldRatio(lambda) {
      const sinLambda = Math.sin(lambda);
      const cosLambda = Math.cos(lambda);
      return Math.sqrt(1 + 3 * sinLambda * sinLambda) / Math.pow(cosLambda, 6);
    }

    function pointOnLine(lambda, lValue = state.l) {
      const cosLambda = Math.cos(lambda);
      const sinLambda = Math.sin(lambda);
      const xEarth = lValue * Math.pow(cosLambda, 3);
      const zEarth = lValue * cosLambda * cosLambda * sinLambda;
      return {
        x: EARTH_CX + SPACE_SCALE * xEarth,
        y: EARTH_CY - SPACE_SCALE * zEarth
      };
    }

    function mirrorLatitude(targetRatio, maximumLatitude) {
      let low = 0;
      let high = maximumLatitude;
      for (let index = 0; index < 70; index += 1) {
        const middle = (low + high) / 2;
        if (fieldRatio(middle) < targetRatio) low = middle;
        else high = middle;
      }
      return (low + high) / 2;
    }

    function model() {
      const lambdaAtmosphere = atmosphereLatitude(state.l);
      const atmosphereFieldRatio = fieldRatio(lambdaAtmosphere);
      const alphaRad = state.alphaDeg * Math.PI / 180;
      const mirrorFieldRatio = 1 / Math.pow(Math.sin(alphaRad), 2);
      const trapped = mirrorFieldRatio <= atmosphereFieldRatio;
      const lambdaMirror = trapped
        ? mirrorLatitude(mirrorFieldRatio, lambdaAtmosphere)
        : lambdaAtmosphere;
      const lossAngleDeg = Math.asin(Math.sqrt(1 / atmosphereFieldRatio)) * 180 / Math.PI;
      return {
        lambdaAtmosphere,
        atmosphereFieldRatio,
        alphaRad,
        mirrorFieldRatio,
        mirrorToAtmosphere: mirrorFieldRatio / atmosphereFieldRatio,
        trapped,
        lambdaMirror,
        lossAngleDeg
      };
    }

    function makePath(fromLambda, toLambda, samples, lValue = state.l) {
      const points = [];
      for (let index = 0; index <= samples; index += 1) {
        const fraction = index / samples;
        const lambda = fromLambda + (toLambda - fromLambda) * fraction;
        points.push(pointOnLine(lambda, lValue));
      }
      return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    }

    function plotX(lambda, maximumLatitude) {
      return PLOT.left + (lambda + maximumLatitude) / (2 * maximumLatitude) * (PLOT.right - PLOT.left);
    }

    function plotY(normalizedField) {
      return PLOT.bottom - clamp(normalizedField, 0, 1) * (PLOT.bottom - PLOT.top);
    }

    function sectorPath(centerAngle, halfAngle) {
      const start = centerAngle - halfAngle;
      const end = centerAngle + halfAngle;
      const startX = VELOCITY.cx + VELOCITY.radius * Math.cos(start);
      const startY = VELOCITY.cy - VELOCITY.radius * Math.sin(start);
      const endX = VELOCITY.cx + VELOCITY.radius * Math.cos(end);
      const endY = VELOCITY.cy - VELOCITY.radius * Math.sin(end);
      return [
        `M${VELOCITY.cx},${VELOCITY.cy}`,
        `L${startX.toFixed(2)},${startY.toFixed(2)}`,
        `A${VELOCITY.radius},${VELOCITY.radius} 0 0 0 ${endX.toFixed(2)},${endY.toFixed(2)}`,
        "Z"
      ].join(" ");
    }

    function setSvgPosition(element, point) {
      element.setAttribute("cx", point.x.toFixed(2));
      element.setAttribute("cy", point.y.toFixed(2));
    }

    function setEnergy(parallel, perpendicular, total) {
      const values = [
        [elements.energyParallel, elements.energyParallelValue, parallel],
        [elements.energyPerp, elements.energyPerpValue, perpendicular],
        [elements.energyTotal, elements.energyTotalValue, total]
      ];
      values.forEach(([bar, output, value]) => {
        bar.style.width = formatPercent(value);
        output.textContent = formatPercent(value);
      });
    }

    function announce(key, text) {
      if (state.announcedState === key) return;
      state.announcedState = key;
      elements.stateExplanation.textContent = text;
    }

    function renderStatic(currentModel) {
      const lambdaA = currentModel.lambdaAtmosphere;
      elements.fieldLine.setAttribute("d", makePath(-lambdaA, lambdaA, 180));

      const equator = pointOnLine(0);
      const northAtmosphere = pointOnLine(lambdaA);
      elements.weakFieldLabel.setAttribute("x", clamp(equator.x - 170, 225, 1070));
      elements.weakFieldLabel.setAttribute("y", equator.y - 25);
      elements.strongFieldLabel.setAttribute("x", clamp(northAtmosphere.x + 25, 210, 960));
      elements.strongFieldLabel.setAttribute("y", clamp(northAtmosphere.y - 18, 38, 410));
      elements.lineLabel.setAttribute("x", clamp(equator.x - 8, 215, 1150));
      elements.lineLabel.setAttribute("y", equator.y + 31);
      elements.lineLabel.textContent = `L = ${formatOne(state.l)}`;

      const fieldPlotPoints = [];
      for (let index = 0; index <= 180; index += 1) {
        const lambda = -lambdaA + 2 * lambdaA * index / 180;
        const normalized = fieldRatio(lambda) / currentModel.atmosphereFieldRatio;
        fieldPlotPoints.push({ x: plotX(lambda, lambdaA), y: plotY(normalized) });
      }
      elements.fieldPlotPath.setAttribute("d", fieldPlotPoints.map((point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`
      ).join(" "));

      const mirrorNormalized = currentModel.mirrorToAtmosphere;
      const mirrorY = plotY(mirrorNormalized);
      elements.mirrorLevel.setAttribute("x1", PLOT.left);
      elements.mirrorLevel.setAttribute("x2", PLOT.right);
      elements.mirrorLevel.setAttribute("y1", mirrorY);
      elements.mirrorLevel.setAttribute("y2", mirrorY);
      elements.mirrorLevel.classList.toggle("is-loss", !currentModel.trapped);
      elements.mirrorLevelLabel.setAttribute("x", 635);
      elements.mirrorLevelLabel.setAttribute("y", currentModel.trapped ? mirrorY - 7 : PLOT.top + 15);
      elements.mirrorLevelLabel.textContent = currentModel.trapped
        ? "Bₘ < Bₐₜₘ: отражение раньше"
        : "Bₘ > Bₐₜₘ: зеркало лежало бы ниже";
      elements.mirrorLevelLabel.classList.toggle("is-loss", !currentModel.trapped);

      if (currentModel.trapped) {
        const northMirror = pointOnLine(currentModel.lambdaMirror);
        const southMirror = pointOnLine(-currentModel.lambdaMirror);
        setSvgPosition(elements.mirrorNorth, northMirror);
        setSvgPosition(elements.mirrorSouth, southMirror);
        elements.mirrorPoints.style.display = "inline";

        const plotNorthX = plotX(currentModel.lambdaMirror, lambdaA);
        const plotSouthX = plotX(-currentModel.lambdaMirror, lambdaA);
        [
          [elements.plotMirrorNorth, plotNorthX],
          [elements.plotMirrorSouth, plotSouthX]
        ].forEach(([line, x]) => {
          line.setAttribute("x1", x);
          line.setAttribute("x2", x);
          line.setAttribute("y1", mirrorY);
          line.setAttribute("y2", PLOT.bottom);
          line.style.display = "inline";
        });
      } else {
        elements.mirrorPoints.style.display = "none";
        elements.plotMirrorNorth.style.display = "none";
        elements.plotMirrorSouth.style.display = "none";
      }

      const lossAngleRad = currentModel.lossAngleDeg * Math.PI / 180;
      elements.lossSectorRight.setAttribute("d", sectorPath(0, lossAngleRad));
      elements.lossSectorLeft.setAttribute("d", sectorPath(Math.PI, lossAngleRad));

      const arrowX = VELOCITY.cx + VELOCITY.radius * Math.cos(currentModel.alphaRad);
      const arrowY = VELOCITY.cy - VELOCITY.radius * Math.sin(currentModel.alphaRad);
      elements.velocityArrow.setAttribute("x2", arrowX.toFixed(2));
      elements.velocityArrow.setAttribute("y2", arrowY.toFixed(2));
      elements.velocityHandle.setAttribute("cx", arrowX.toFixed(2));
      elements.velocityHandle.setAttribute("cy", arrowY.toFixed(2));

      elements.lValue.textContent = formatOne(state.l);
      elements.heightValue.textContent = `${Math.round((state.l - 1) * EARTH_RADIUS_KM).toLocaleString("ru-RU")} км`;
      elements.alphaValue.textContent = `${formatOne(state.alphaDeg)}°`;
      elements.lossAngle.textContent = `${formatOne(currentModel.lossAngleDeg)}°`;
      elements.mirrorRatio.textContent = formatOne(currentModel.mirrorToAtmosphere);

      elements.prediction.classList.toggle("is-loss", !currentModel.trapped);
      elements.prediction.innerHTML = currentModel.trapped
        ? `<strong>Захват:</strong> α<sub>eq</sub> ≥ α<sub>loss</sub>, частица отразится до атмосферы.`
        : `<strong>Потеря:</strong> α<sub>eq</sub> &lt; α<sub>loss</sub>, частица войдёт в атмосферу.`;
    }

    function motionState(currentModel) {
      if (currentModel.trapped) {
        const period = 7.2;
        const phase = 2 * Math.PI * state.elapsed / period;
        return {
          lambda: currentModel.lambdaMirror * Math.sin(phase),
          collision: 0,
          finished: false
        };
      }

      const duration = 5.2;
      const progress = clamp(state.elapsed / duration, 0, 1);
      const travelProgress = clamp(progress / 0.72, 0, 1);
      const collision = clamp((progress - 0.72) / 0.28, 0, 1);
      return {
        lambda: currentModel.lambdaAtmosphere * smoothstep(travelProgress),
        collision,
        finished: progress >= 1
      };
    }

    function renderMotion(currentModel) {
      const motion = motionState(currentModel);
      const basePoint = pointOnLine(motion.lambda);
      const jitterStrength = motion.collision * 4.5;
      const jitterX = Math.sin(state.elapsed * 31) * jitterStrength;
      const jitterY = Math.cos(state.elapsed * 43) * jitterStrength;
      const particlePoint = {
        x: basePoint.x + jitterX,
        y: basePoint.y + jitterY
      };

      setSvgPosition(elements.particle.querySelector("circle:first-child"), { x: 0, y: 0 });
      elements.particle.setAttribute("transform", `translate(${particlePoint.x.toFixed(2)} ${particlePoint.y.toFixed(2)})`);
      elements.particle.style.opacity = String(1 - motion.collision * 0.82);
      elements.particle.classList.toggle("is-loss", motion.collision > 0);

      const northAtmosphere = pointOnLine(currentModel.lambdaAtmosphere);
      setSvgPosition(elements.impactGlow, northAtmosphere);
      elements.impactGlow.style.opacity = String(0.54 * motion.collision * (1 - 0.35 * motion.collision));

      const trailEnd = motion.lambda;
      elements.travelledPath.setAttribute("d", makePath(0, trailEnd, 70));

      const normalizedField = fieldRatio(motion.lambda) / currentModel.atmosphereFieldRatio;
      setSvgPosition(elements.plotParticle, {
        x: plotX(motion.lambda, currentModel.lambdaAtmosphere),
        y: plotY(normalizedField)
      });
      elements.plotParticle.style.opacity = String(1 - motion.collision * 0.65);

      const initialPerpendicular = Math.pow(Math.sin(currentModel.alphaRad), 2);
      const adiabaticPerpendicular = clamp(initialPerpendicular * fieldRatio(motion.lambda), 0, 1);
      const totalEnergy = currentModel.trapped ? 1 : 1 - 0.92 * smoothstep(motion.collision);
      const perpendicularEnergy = motion.collision > 0
        ? totalEnergy * adiabaticPerpendicular
        : adiabaticPerpendicular;
      const parallelEnergy = Math.max(0, totalEnergy - perpendicularEnergy);
      setEnergy(parallelEnergy, perpendicularEnergy, totalEnergy);

      if (!state.running && state.elapsed === 0) {
        announce("ready", "До запуска исход уже известен из сравнения αeq с границей конуса потерь.");
      } else if (currentModel.trapped) {
        const nearMirror = Math.abs(motion.lambda) > 0.92 * currentModel.lambdaMirror;
        announce(
          nearMirror ? "mirror" : "trapped-motion",
          nearMirror
            ? "У зеркальной точки E∥ обращается в нуль, после чего направляющий центр движется обратно."
            : "В стационарном поле E постоянно: при росте B энергия перетекает из E∥ в E⊥."
        );
      } else if (motion.collision > 0) {
        announce(
          motion.finished ? "lost" : "collision",
          motion.finished
            ? "После столкновений с атмосферой частица покидает адиабатическую орбиту и теряет энергию."
            : "В атмосфере столкновения, ионизация и рассеяние нарушают адиабатическое движение; E уменьшается."
        );
      } else {
        announce("loss-flight", "До атмосферы поле статично и E постоянно, но Bm больше доступного Batm: отражения ещё нет.");
      }

      if (motion.finished && state.running) {
        state.running = false;
        cancelAnimationFrame(state.frame);
      }
    }

    function render() {
      const currentModel = model();
      renderStatic(currentModel);
      renderMotion(currentModel);
    }

    function resetMotion() {
      state.running = false;
      cancelAnimationFrame(state.frame);
      state.elapsed = 0;
      state.lastTime = 0;
      state.announcedState = "";
      render();
    }

    function tick(timestamp) {
      if (!state.running) return;
      if (root.offsetParent === null) {
        state.running = false;
        return;
      }
      if (!state.lastTime) state.lastTime = timestamp;
      const delta = Math.min((timestamp - state.lastTime) / 1000, 0.08);
      state.lastTime = timestamp;
      state.elapsed += delta;
      renderMotion(model());
      if (state.running) state.frame = requestAnimationFrame(tick);
    }

    function play() {
      const currentModel = model();
      if (reducedMotion.matches) {
        state.elapsed = currentModel.trapped ? 1.8 : 5.2;
        state.running = false;
        renderMotion(currentModel);
        return;
      }
      if (!currentModel.trapped && state.elapsed >= 5.2) state.elapsed = 0;
      if (state.running) return;
      state.running = true;
      state.lastTime = 0;
      state.frame = requestAnimationFrame(tick);
    }

    function pause() {
      state.running = false;
      cancelAnimationFrame(state.frame);
      state.lastTime = 0;
    }

    function updateFromControls() {
      state.l = Number(elements.lSlider.value);
      state.alphaDeg = Number(elements.alphaSlider.value);
      resetMotion();
    }

    function svgCoordinates(event) {
      const rect = svg.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * 1280 / rect.width,
        y: (event.clientY - rect.top) * 620 / rect.height
      };
    }

    function updateAngleFromPointer(event) {
      const point = svgCoordinates(event);
      const dx = Math.abs(point.x - VELOCITY.cx);
      const dy = Math.abs(point.y - VELOCITY.cy);
      if (dx === 0 && dy === 0) return;
      const angle = clamp(Math.atan2(dy, dx) * 180 / Math.PI, 1, 89);
      state.alphaDeg = Math.round(angle * 2) / 2;
      elements.alphaSlider.value = String(state.alphaDeg);
      resetMotion();
    }

    elements.lSlider.addEventListener("input", updateFromControls);
    elements.alphaSlider.addEventListener("input", updateFromControls);
    elements.play.addEventListener("click", play);
    elements.pause.addEventListener("click", pause);
    elements.reset.addEventListener("click", resetMotion);

    elements.velocityHit.addEventListener("pointerdown", (event) => {
      state.draggingVelocity = true;
      elements.velocityHit.setPointerCapture(event.pointerId);
      updateAngleFromPointer(event);
    });
    elements.velocityHit.addEventListener("pointermove", (event) => {
      if (state.draggingVelocity) updateAngleFromPointer(event);
    });
    elements.velocityHit.addEventListener("pointerup", (event) => {
      state.draggingVelocity = false;
      if (elements.velocityHit.hasPointerCapture(event.pointerId)) {
        elements.velocityHit.releasePointerCapture(event.pointerId);
      }
    });
    elements.velocityHit.addEventListener("pointercancel", () => {
      state.draggingVelocity = false;
    });

    document.addEventListener("slidechanged", () => {
      if (!root.closest("section.present")) pause();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLossConeLab, { once: true });
  } else {
    initLossConeLab();
  }
})();
