(() => {
  "use strict";
  if (window.ThreeFlavorTriangleLoaded) return; // already loaded by another include
  window.ThreeFlavorTriangleLoaded = true;

  // NuFIT 6.1, IC24 + SK-atm: Δm²_3ℓ = Δm²_31 > 0 for NO, Δm²_32 < 0 for IO
  const DM21 = 7.537e-5;
  const DM31_NO = 2.511e-3;
  const DM32_IO = -2.483e-3;
  const SAMPLE_COUNT = 3000;
  // Best-fit points of the same fit, angles in degrees: sin²θ12 = 0.3088;
  // NO: sin²θ13 = 0.02248, sin²θ23 = 0.470, δ = 212°;
  // IO: sin²θ13 = 0.02262, sin²θ23 = 0.550, δ = 274°.
  // The ordering button sets the angles and phase of its own point;
  // the NO values equal the initial ones in the markup.
  const BEST_FIT = {
    NO: {theta12: "33.76", theta13: "8.62", theta23: "43.29", delta: "212"},
    IO: {theta12: "33.76", theta13: "8.65", theta23: "47.87", delta: "274"}
  };
  const VERTICES = [
    {x: 380, y: 42},
    {x: 100, y: 288},
    {x: 660, y: 288}
  ];

  const complex = (re, im = 0) => ({re, im});
  const add = (a, b) => complex(a.re + b.re, a.im + b.im);
  const multiply = (a, b) => complex(
    a.re * b.re - a.im * b.im,
    a.re * b.im + a.im * b.re
  );
  const conjugate = value => complex(value.re, -value.im);
  const phase = angle => complex(Math.cos(angle), -Math.sin(angle));
  const modulusSquared = value => value.re ** 2 + value.im ** 2;
  const polar = angle => complex(Math.cos(angle), Math.sin(angle));
  const radians = degrees => degrees * Math.PI / 180;

  function pmns(theta12, theta13, theta23, delta) {
    const s12 = Math.sin(theta12), c12 = Math.cos(theta12);
    const s13 = Math.sin(theta13), c13 = Math.cos(theta13);
    const s23 = Math.sin(theta23), c23 = Math.cos(theta23);
    const expPlus = polar(delta);
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

  function coefficients(mixing, source) {
    return [0, 1, 2].map(target =>
      [0, 1, 2].map(index =>
        multiply(mixing[target][index], conjugate(mixing[source][index]))
      )
    );
  }

  function probabilities(x, coefficientsByFlavor, massRatio) {
    const phase2 = phase(2 * Math.PI * x);
    const phase3 = phase(2 * Math.PI * x * massRatio);
    return coefficientsByFlavor.map(row => {
      const amplitude = add(
        add(row[0], multiply(row[1], phase2)),
        multiply(row[2], phase3)
      );
      return modulusSquared(amplitude);
    });
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
    const orderingButtons = [...root.querySelectorAll("[data-ordering]")];
    const inputs = {
      x: root.querySelector("[data-x-input]"),
      theta12: root.querySelector("[data-theta12-input]"),
      theta13: root.querySelector("[data-theta13-input]"),
      theta23: root.querySelector("[data-theta23-input]"),
      delta: root.querySelector("[data-delta-input]")
    };
    const outputs = {
      x: root.querySelector("[data-x-output]"),
      theta12: root.querySelector("[data-theta12-output]"),
      theta13: root.querySelector("[data-theta13-output]"),
      theta23: root.querySelector("[data-theta23-output]"),
      delta: root.querySelector("[data-delta-output]"),
      ratio: root.querySelector("[data-ratio-output]"),
      total: root.querySelector("[data-total-output]")
    };
    const playButton = root.querySelector("[data-play]");
    const resetButton = root.querySelector("[data-reset]");
    const trail = root.querySelector("[data-trail]");
    const point = root.querySelector("[data-point]");
    const halo = root.querySelector("[data-halo]");
    const bars = [...root.querySelectorAll("[data-bar]")];
    const valueOutputs = [...root.querySelectorAll("[data-probability]")];

    let source = 1;
    let antineutrino = false;
    let ordering = "NO";
    let playing = false;
    let previousTimestamp = null;
    let animationX = Number(inputs.x.value);
    let cacheKey = "";
    let cachedCoefficients = null;
    let cachedMassRatio = 0;
    let trailPieces = [];

    function selectButton(buttons, active) {
      buttons.forEach(button => {
        const selected = button === active;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    function parameters() {
      return {
        x: Number(inputs.x.value),
        theta12: radians(Number(inputs.theta12.value)),
        theta13: radians(Number(inputs.theta13.value)),
        theta23: radians(Number(inputs.theta23.value)),
        delta: radians(Number(inputs.delta.value))
      };
    }

    function prepareTrail(p) {
      const nextKey = [
        source, antineutrino, ordering,
        inputs.theta12.value, inputs.theta13.value,
        inputs.theta23.value, inputs.delta.value
      ].join("|");
      if (nextKey === cacheKey) return;
      cacheKey = nextKey;

      let mixing = pmns(p.theta12, p.theta13, p.theta23, p.delta);
      if (antineutrino) {
        mixing = mixing.map(row => row.map(conjugate));
      }
      cachedCoefficients = coefficients(mixing, source);
      cachedMassRatio =
        (ordering === "NO" ? DM31_NO : DM32_IO + DM21) / DM21;

      trailPieces = [];
      for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
        const sampleX = 3 * index / SAMPLE_COUNT;
        const value = probabilities(
          sampleX, cachedCoefficients, cachedMassRatio
        );
        const position = trianglePoint(value);
        trailPieces.push(
          (index === 0 ? "M" : "L") +
          position.x.toFixed(2) + "," + position.y.toFixed(2)
        );
      }
    }

    function draw() {
      const p = parameters();
      prepareTrail(p);
      const values = probabilities(
        p.x, cachedCoefficients, cachedMassRatio
      );
      const position = trianglePoint(values);
      const last = Math.round(p.x * SAMPLE_COUNT / 3);

      outputs.x.textContent = p.x.toFixed(3);
      outputs.theta12.textContent = Number(inputs.theta12.value).toFixed(2) + "°";
      outputs.theta13.textContent = Number(inputs.theta13.value).toFixed(2) + "°";
      outputs.theta23.textContent = Number(inputs.theta23.value).toFixed(2) + "°";
      outputs.delta.textContent = Math.round(Number(inputs.delta.value)) + "°";
      outputs.ratio.textContent =
        Math.round(Math.PI * p.x / (1.267 * DM21)).toLocaleString("en-US");
      outputs.total.textContent =
        values.reduce((sum, value) => sum + value, 0).toFixed(3);

      point.setAttribute("cx", position.x.toFixed(2));
      point.setAttribute("cy", position.y.toFixed(2));
      halo.setAttribute("cx", position.x.toFixed(2));
      halo.setAttribute("cy", position.y.toFixed(2));
      trail.setAttribute("d", trailPieces.slice(0, last + 1).join(" "));

      values.forEach((value, index) => {
        bars[index].style.width = (100 * value).toFixed(2) + "%";
        valueOutputs[index].textContent = value.toFixed(3);
      });
    }

    function stop() {
      playing = false;
      previousTimestamp = null;
      playButton.textContent = "▶ Play";
      playButton.classList.remove("is-active");
    }

    function animate(timestamp) {
      if (!playing) return;
      if (previousTimestamp !== null) {
        const elapsed = Math.min(60, timestamp - previousTimestamp);
        animationX = Math.min(3, animationX + 3 * elapsed / 35000);
        inputs.x.value = String(animationX);
        draw();
        if (animationX >= 3) {
          stop();
          return;
        }
      }
      previousTimestamp = timestamp;
      requestAnimationFrame(animate);
    }

    sourceButtons.forEach(button => {
      button.addEventListener("click", () => {
        source = Number(button.dataset.source);
        selectButton(sourceButtons, button);
        draw();
      });
    });
    particleButtons.forEach(button => {
      button.addEventListener("click", () => {
        antineutrino = button.dataset.antineutrino === "true";
        selectButton(particleButtons, button);
        draw();
      });
    });
    orderingButtons.forEach(button => {
      button.addEventListener("click", () => {
        ordering = button.dataset.ordering;
        selectButton(orderingButtons, button);
        Object.entries(BEST_FIT[ordering]).forEach(([name, value]) => {
          inputs[name].value = value;
        });
        draw();
      });
    });
    Object.values(inputs).forEach(input => {
      input.addEventListener("input", () => {
        if (input === inputs.x) animationX = Number(inputs.x.value);
        draw();
      });
    });

    playButton.addEventListener("click", () => {
      if (playing) {
        stop();
        return;
      }
      if (Number(inputs.x.value) >= 3) inputs.x.value = "0";
      animationX = Number(inputs.x.value);
      playing = true;
      playButton.textContent = "❚❚ Pause";
      playButton.classList.add("is-active");
      draw();
      requestAnimationFrame(animate);
    });
    resetButton.addEventListener("click", () => {
      stop();
      inputs.x.value = "0";
      animationX = 0;
      draw();
    });

    selectButton(sourceButtons, sourceButtons[1]);
    selectButton(particleButtons, particleButtons[0]);
    selectButton(orderingButtons, orderingButtons[0]);
    draw();
  }

  function initializeAll() {
    document.querySelectorAll("[data-three-flavor-triangle]").forEach(initialize);
  }

  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
