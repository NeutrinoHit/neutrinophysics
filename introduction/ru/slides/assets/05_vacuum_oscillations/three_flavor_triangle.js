(() => {
  "use strict";

  const K_PHASE = 2 * 1.267;
  const MASS_SQUARED = [0, 7.537e-5, 2.511e-3];
  const SIN2_THETA_12 = 0.3088;
  const SIN2_THETA_23 = 0.470;
  const SIN2_THETA_13 = 0.02248;
  const VERTICES = [
    {x: 380, y: 42},
    {x: 100, y: 288},
    {x: 660, y: 288}
  ];
  const FLAVOR_LABELS = ["e", "μ", "τ"];

  const complex = (re, im = 0) => ({re, im});
  const add = (a, b) => complex(a.re + b.re, a.im + b.im);
  const multiply = (a, b) => complex(
    a.re * b.re - a.im * b.im,
    a.re * b.im + a.im * b.re
  );
  const conjugate = value => complex(value.re, -value.im);
  const phase = angle => complex(Math.cos(angle), -Math.sin(angle));
  const modulusSquared = value => value.re ** 2 + value.im ** 2;
  const fromPolar = (radius, angle) => complex(
    radius * Math.cos(angle),
    radius * Math.sin(angle)
  );

  function pmns(delta) {
    const s12 = Math.sqrt(SIN2_THETA_12);
    const s23 = Math.sqrt(SIN2_THETA_23);
    const s13 = Math.sqrt(SIN2_THETA_13);
    const c12 = Math.sqrt(1 - SIN2_THETA_12);
    const c23 = Math.sqrt(1 - SIN2_THETA_23);
    const c13 = Math.sqrt(1 - SIN2_THETA_13);
    const expPlus = fromPolar(1, delta);
    const expMinus = conjugate(expPlus);

    return [
      [
        complex(c12 * c13),
        complex(s12 * c13),
        multiply(complex(s13), expMinus)
      ],
      [
        add(complex(-s12 * c23), multiply(complex(-c12 * s23 * s13), expPlus)),
        add(complex(c12 * c23), multiply(complex(-s12 * s23 * s13), expPlus)),
        complex(s23 * c13)
      ],
      [
        add(complex(s12 * s23), multiply(complex(-c12 * c23 * s13), expPlus)),
        add(complex(-c12 * s23), multiply(complex(-s12 * c23 * s13), expPlus)),
        complex(c23 * c13)
      ]
    ];
  }

  function probabilities(source, ratio, delta, antineutrino) {
    let mixing = pmns(delta);
    if (antineutrino) {
      mixing = mixing.map(row => row.map(conjugate));
    }

    const result = [0, 1, 2].map(target => {
      let amplitude = complex(0);
      for (let index = 0; index < 3; index += 1) {
        const coefficient = multiply(
          mixing[target][index],
          conjugate(mixing[source][index])
        );
        const propagation = phase(K_PHASE * MASS_SQUARED[index] * ratio);
        amplitude = add(amplitude, multiply(coefficient, propagation));
      }
      return Math.max(0, modulusSquared(amplitude));
    });

    const total = result.reduce((sum, value) => sum + value, 0);
    return result.map(value => value / total);
  }

  function trianglePoint(values) {
    return values.reduce(
      (point, value, index) => ({
        x: point.x + value * VERTICES[index].x,
        y: point.y + value * VERTICES[index].y
      }),
      {x: 0, y: 0}
    );
  }

  function initialize(root) {
    if (root.dataset.threeFlavorReady === "true") return;
    root.dataset.threeFlavorReady = "true";

    const sourceButtons = [...root.querySelectorAll("[data-source]")];
    const particleButtons = [...root.querySelectorAll("[data-antineutrino]")];
    const energyInput = root.querySelector("[data-energy-input]");
    const baselineInput = root.querySelector("[data-baseline-input]");
    const deltaInput = root.querySelector("[data-delta-input]");
    const energyOutput = root.querySelector("[data-energy-output]");
    const baselineOutput = root.querySelector("[data-baseline-output]");
    const deltaOutput = root.querySelector("[data-delta-output]");
    const ratioOutput = root.querySelector("[data-ratio-output]");
    const playButton = root.querySelector("[data-play]");
    const resetButton = root.querySelector("[data-reset]");
    const trail = root.querySelector("[data-trail]");
    const point = root.querySelector("[data-point]");
    const halo = root.querySelector("[data-halo]");
    const bars = [...root.querySelectorAll("[data-bar]")];
    const probabilityOutputs = [...root.querySelectorAll("[data-probability]")];
    const status = root.querySelector("[data-status]");

    let source = 1;
    let antineutrino = false;
    let playing = false;
    let previousTimestamp = null;

    function setButtons(buttons, active) {
      buttons.forEach(button => {
        const selected = button === active;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    function currentParameters() {
      const energy = Number(energyInput.value);
      const baseline = Number(baselineInput.value);
      const deltaDegrees = Number(deltaInput.value);
      return {
        energy,
        baseline,
        ratio: baseline / energy,
        deltaDegrees,
        delta: deltaDegrees * Math.PI / 180
      };
    }

    function trailPath(ratio, delta) {
      const count = 90;
      const points = [];
      for (let index = 0; index <= count; index += 1) {
        const sampleRatio = ratio * index / count;
        const values = probabilities(source, sampleRatio, delta, antineutrino);
        const position = trianglePoint(values);
        points.push(
          (index === 0 ? "M" : "L") +
          position.x.toFixed(2) + "," + position.y.toFixed(2)
        );
      }
      return points.join(" ");
    }

    function draw() {
      const parameters = currentParameters();
      const values = probabilities(
        source,
        parameters.ratio,
        parameters.delta,
        antineutrino
      );
      const position = trianglePoint(values);

      energyOutput.textContent = parameters.energy.toFixed(2) + " ГэВ";
      baselineOutput.textContent = Math.round(parameters.baseline) + " км";
      deltaOutput.textContent = Math.round(parameters.deltaDegrees) + "°";
      ratioOutput.textContent = Math.round(parameters.ratio) + " км/ГэВ";
      point.setAttribute("cx", position.x.toFixed(2));
      point.setAttribute("cy", position.y.toFixed(2));
      halo.setAttribute("cx", position.x.toFixed(2));
      halo.setAttribute("cy", position.y.toFixed(2));
      trail.setAttribute("d", trailPath(parameters.ratio, parameters.delta));

      values.forEach((value, index) => {
        bars[index].setAttribute("width", (460 * value).toFixed(2));
        probabilityOutputs[index].textContent = value.toFixed(3);
      });

      const symbol = antineutrino ? "ν̄" : "ν";
      status.textContent =
        symbol + FLAVOR_LABELS[source] + ": Pₑ + Pμ + Pτ = " +
        values.reduce((sum, value) => sum + value, 0).toFixed(3);
    }

    function stop() {
      playing = false;
      previousTimestamp = null;
      playButton.textContent = "▶ Пустить";
      playButton.classList.remove("is-active");
    }

    function animate(timestamp) {
      if (!playing) return;
      if (previousTimestamp !== null) {
        const elapsed = Math.min(50, timestamp - previousTimestamp);
        const next = (Number(baselineInput.value) + 0.095 * elapsed) % 1305;
        baselineInput.value = String(Math.min(1300, next));
        draw();
      }
      previousTimestamp = timestamp;
      requestAnimationFrame(animate);
    }

    sourceButtons.forEach(button => {
      button.addEventListener("click", () => {
        source = Number(button.dataset.source);
        setButtons(sourceButtons, button);
        draw();
      });
    });

    particleButtons.forEach(button => {
      button.addEventListener("click", () => {
        antineutrino = button.dataset.antineutrino === "true";
        setButtons(particleButtons, button);
        draw();
      });
    });

    [energyInput, baselineInput, deltaInput].forEach(input => {
      input.addEventListener("input", draw);
    });

    playButton.addEventListener("click", () => {
      if (playing) {
        stop();
        return;
      }
      playing = true;
      playButton.textContent = "❚❚ Пауза";
      playButton.classList.add("is-active");
      requestAnimationFrame(animate);
    });

    resetButton.addEventListener("click", () => {
      stop();
      baselineInput.value = "0";
      draw();
    });

    setButtons(sourceButtons, sourceButtons[1]);
    setButtons(particleButtons, particleButtons[0]);
    draw();
  }

  function initializeAll() {
    document.querySelectorAll("[data-three-flavor-triangle]").forEach(initialize);
  }

  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
