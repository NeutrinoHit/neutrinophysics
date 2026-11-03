(() => {
  "use strict";

  const twoPi = 2 * Math.PI;

  // Words of the widgets, one dictionary per language. The language is read
  // from the nearest [lang] ancestor; anything not starting with "en" is Russian.
  const T = {
    ru: {
      rad: " рад",
      glass: "стекло, n = ",
      air: "воздух, n = 1",
      pause: "Пауза",
      play: "Пуск",
      build: "Собрать слой",
      none: "нет",
      sumZero: "Сумма вернулась к нулю: соседние зоны гасят друг друга. ",
      sumIsZero: "Сумма равна нулю. ",
      sumPhase: "Фаза суммы ",
      noLimit: "Без обрезания предела нет: конец стрелки бежит по окружности.",
      toLimit: "До предела осталось ",
      limit: " %. Предел ",
      limitEnd: "°, при ε/k → 0 — 90°, то есть i.",
      scatterer: "рассеиватель",
      incident: "падающая волна",
      percent: "\u00a0%",
      comma: true
    },
    en: {
      rad: " rad",
      glass: "glass, n = ",
      air: "air, n = 1",
      pause: "Pause",
      play: "Play",
      build: "Build the layer",
      none: "none",
      sumZero: "The sum has returned to zero: neighboring zones cancel each other. ",
      sumIsZero: "The sum is zero. ",
      sumPhase: "Sum phase ",
      noLimit: "Without the cutoff there is no limit: the tip of the arrow runs around the circle.",
      toLimit: "Remaining to the limit: ",
      limit: "%. The limit is ",
      limitEnd: "°; as ε/k → 0 it tends to 90°, that is, to i.",
      scatterer: "scatterer",
      incident: "incident wave",
      percent: "%",
      comma: false
    }
  };
  const wordsFor = root => {
    const holder = root.closest("[lang]") || document.documentElement;
    return /^en/i.test(holder.lang || "") ? T.en : T.ru;
  };

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
    const words = wordsFor(root);
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
      // the common phase exp(i k_mat,1 L) is removed; |A|^2 = P(e -> x).
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
      differenceValue.textContent = phase.toFixed(2) + words.rad;
      weightValue.textContent = weight.toFixed(3);
      probabilityValue.textContent = probability(phase).toFixed(3);
    }

    angle.addEventListener("input", draw);
    difference.addEventListener("input", draw);
    draw();
  }

  const svgNS = "http://www.w3.org/2000/svg";
  let clipCount = 0;

  function initializeBoundary(root) {
    if (root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const words = wordsFor(root);
    const q = selector => root.querySelector(selector);
    const angle = q("[data-angle]");
    const index = q("[data-index]");
    const direction = q("[data-direction]");
    const play = q("[data-play]");
    const glass = q("[data-glass]");
    const arcIncident = q("[data-arc-incident]");
    const arcTransmitted = q("[data-arc-transmitted]");
    const labelIncident = q("[data-label-incident]");
    const labelReflected = q("[data-label-reflected]");
    const labelTransmitted = q("[data-label-transmitted]");
    const upperName = q("[data-upper-name]");
    const lowerName = q("[data-lower-name]");
    const tir = q("[data-tir]");
    const angleValue = q("[data-angle-value]");
    const indexValue = q("[data-index-value]");
    const refractedValue = q("[data-refracted-value]");
    const reflectedValue = q("[data-reflected-value]");
    const transmittedValue = q("[data-transmitted-value]");
    const ratioValue = q("[data-ratio-value]");

    // SVG units: the boundary is y = 220, the beam meets it at x = 600.
    const ox = 600;
    const oy = 220;
    const reach = 300;
    const width = 70;
    const lambda0 = 64;
    const speed0 = 70;
    const k0 = twoPi / lambda0;
    const omega = k0 * speed0;

    clipCount += 1;
    const clipIds = ["upper", "lower"].map(side => {
      const id = "refraction-boundary-" + side + "-" + clipCount;
      q("[data-clip-" + side + "]").setAttribute("id", id);
      return id;
    });

    function makeBeam(selector, clipId) {
      const group = q(selector);
      group.setAttribute("clip-path", "url(#" + clipId + ")");
      const band = document.createElementNS(svgNS, "polygon");
      band.setAttribute("class", "refraction-boundary-lab__band");
      group.appendChild(band);
      const crests = [];
      for (let i = 0; i < 40; i += 1) {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("class", "refraction-boundary-lab__crest");
        group.appendChild(line);
        crests.push(line);
      }
      return {group, band, crests};
    }

    const incident = makeBeam("[data-beam-incident]", clipIds[0]);
    const reflected = makeBeam("[data-beam-reflected]", clipIds[0]);
    const transmitted = makeBeam("[data-beam-transmitted]", clipIds[1]);

    // A beam along the unit vector (dx, dy) through the point of incidence;
    // s is the distance along the beam, the phase is k s - omega t.
    function drawBeam(beam, dx, dy, s0, s1, k, time, strength) {
      const ux = -dy * width / 2;
      const uy = dx * width / 2;
      const point = s => [ox + s * dx, oy + s * dy];
      const [ax, ay] = point(s0);
      const [bx, by] = point(s1);
      beam.band.setAttribute("points", [
        [ax + ux, ay + uy], [bx + ux, by + uy], [bx - ux, by - uy], [ax - ux, ay - uy]
      ].map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "));
      beam.group.setAttribute("opacity", strength.toFixed(3));
      const first = Math.ceil((k * s0 - omega * time) / twoPi);
      let used = 0;
      for (let m = first; used < beam.crests.length; m += 1) {
        const s = (omega * time + twoPi * m) / k;
        if (s > s1) break;
        const [cx, cy] = point(s);
        const line = beam.crests[used];
        line.setAttribute("x1", (cx + ux).toFixed(1));
        line.setAttribute("y1", (cy + uy).toFixed(1));
        line.setAttribute("x2", (cx - ux).toFixed(1));
        line.setAttribute("y2", (cy - uy).toFixed(1));
        line.removeAttribute("visibility");
        used += 1;
      }
      for (let i = used; i < beam.crests.length; i += 1) {
        beam.crests[i].setAttribute("visibility", "hidden");
      }
    }

    function arc(radius, fromX, fromY, toX, toY, sweep) {
      return "M" + (ox + radius * fromX).toFixed(1) + " " + (oy + radius * fromY).toFixed(1) +
        " A" + radius + " " + radius + " 0 0 " + sweep + " " +
        (ox + radius * toX).toFixed(1) + " " + (oy + radius * toY).toFixed(1);
    }

    function place(label, radius, x, y, shown) {
      label.setAttribute("x", (ox + radius * x).toFixed(1));
      label.setAttribute("y", (oy + radius * y + 8).toFixed(1));
      label.setAttribute("visibility", shown ? "visible" : "hidden");
    }

    let time = 0;
    let playing = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function draw() {
      const n = Number(index.value);
      const fromGlass = direction.getAttribute("aria-pressed") === "true";
      const n1 = fromGlass ? n : 1;
      const n2 = fromGlass ? 1 : n;
      const theta1 = Number(angle.value) * Math.PI / 180;
      const sin1 = Math.sin(theta1);
      const cos1 = Math.cos(theta1);
      const sin2 = n1 * sin1 / n2;
      const total = sin2 >= 1;
      const cos2 = total ? 0 : Math.sqrt(1 - sin2 * sin2);
      const theta2 = total ? Math.PI / 2 : Math.asin(sin2);

      // Fresnel coefficients, unpolarized light.
      let reflectance = 1;
      if (!total) {
        const rs = (n1 * cos1 - n2 * cos2) / (n1 * cos1 + n2 * cos2);
        const rp = (n2 * cos1 - n1 * cos2) / (n2 * cos1 + n1 * cos2);
        reflectance = (rs * rs + rp * rp) / 2;
      }
      const transmittance = 1 - reflectance;

      // The beams share one footprint on the boundary.
      const reach1 = Math.min(reach, width / 2 * Math.tan(theta1) + 4);
      const reach2 = Math.min(reach, width / 2 * Math.tan(theta2) + 4);
      const k1 = n1 * k0;
      const k2 = n2 * k0;
      drawBeam(incident, sin1, cos1, -reach, reach1, k1, time, 1);
      drawBeam(reflected, sin1, -cos1, -reach1, reach, k1, time,
        0.15 + 0.85 * Math.sqrt(reflectance));
      if (total) {
        transmitted.group.setAttribute("visibility", "hidden");
      } else {
        transmitted.group.removeAttribute("visibility");
        drawBeam(transmitted, sin2, cos2, -reach2, reach, k2, time,
          0.15 + 0.85 * Math.sqrt(transmittance));
      }

      const shown = theta1 > 0.06;
      const half1 = theta1 / 2;
      arcIncident.setAttribute("d", shown ?
        arc(72, 0, -1, -sin1, -cos1, 0) + " " + arc(72, 0, -1, sin1, -cos1, 1) : "");
      place(labelIncident, 100, -Math.sin(half1), -Math.cos(half1), shown);
      place(labelReflected, 100, Math.sin(half1), -Math.cos(half1), shown);
      arcTransmitted.setAttribute("d", shown && !total ? arc(84, 0, 1, sin2, cos2, 0) : "");
      place(labelTransmitted, 114, Math.sin(theta2 / 2), Math.cos(theta2 / 2), shown && !total);
      tir.setAttribute("visibility", total ? "visible" : "hidden");

      glass.setAttribute("y", fromGlass ? "0" : "220");
      const glassName = words.glass + n.toFixed(2);
      upperName.textContent = fromGlass ? glassName : words.air;
      lowerName.textContent = fromGlass ? words.air : glassName;

      angleValue.textContent = Math.round(theta1 * 180 / Math.PI) + "°";
      indexValue.textContent = n.toFixed(2);
      refractedValue.textContent = total ? "—" : (theta2 * 180 / Math.PI).toFixed(1) + "°";
      reflectedValue.textContent = (100 * reflectance).toFixed(1) + words.percent;
      transmittedValue.textContent = (100 * transmittance).toFixed(1) + words.percent;
      ratioValue.textContent = n.toFixed(2);
    }

    function visible() {
      if (document.hidden) return false;
      const slide = root.closest(".reveal .slides section");
      return !slide || slide.classList.contains("present");
    }

    let last = null;
    function frame(now) {
      if (playing && visible()) {
        if (last !== null) time += Math.min(now - last, 100) / 1000;
        draw();
      }
      last = now;
      requestAnimationFrame(frame);
    }

    function setPlaying(value) {
      playing = value;
      play.textContent = playing ? words.pause : words.play;
    }

    angle.addEventListener("input", draw);
    index.addEventListener("input", draw);
    direction.addEventListener("click", () => {
      const pressed = direction.getAttribute("aria-pressed") === "true";
      direction.setAttribute("aria-pressed", pressed ? "false" : "true");
      draw();
    });
    play.addEventListener("click", () => setPlaying(!playing));
    setPlaying(playing);
    draw();
    requestAnimationFrame(frame);
  }

  // Fresnel zones of a thin sheet: the geometric sum with f(0) taken out.
  // With s = k (r - z), r the exact distance from a ring to P (b db = r dr),
  // the zone m spans s in [m pi, (m+1) pi]; a smooth cutoff exp(-eta s) of
  // the far rings gives
  //   S(s) = (1 - exp((i - eta) s)) / (eta - i),  S(inf) = 1/(eta - i) -> i.
  // Without the cutoff S runs on the circle |S - i| = 1 and has no limit;
  // with it the remainder after m zones is exp(-pi eta m) of the limit.
  function initializeZones(root) {
    if (root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const words = wordsFor(root);
    const zones = root.querySelector("[data-zones]");
    const cutoff = root.querySelector("[data-cutoff]");
    const zonesValue = root.querySelector("[data-zones-value]");
    const cutoffValue = root.querySelector("[data-cutoff-value]");
    const bands = root.querySelector("[data-zone-bands]");
    const rayTop = root.querySelector("[data-ray-top]");
    const rayBottom = root.querySelector("[data-ray-bottom]");
    const pathLabel = root.querySelector("[data-path-label]");
    const spiral = root.querySelector("[data-spiral]");
    const sum = root.querySelector("[data-sum]");
    const sumHead = root.querySelector("[data-sum-head]");
    const limit = root.querySelector("[data-limit]");
    const limitLabel = root.querySelector("[data-limit-label]");
    const readout = root.querySelector("[data-readout]");
    const play = root.querySelector("[data-play]");
    const svgNS = "http://www.w3.org/2000/svg";
    const sheetX = 110, mid = 310, half = 270, ox = 1020, oy = 540, unit = 230;
    const toX = re => ox + unit * re, toY = im => oy - unit * im;
    const fmt = (v, d) => words.comma ? v.toFixed(d).replace(".", ",") : v.toFixed(d);
    // The remainder |S - S(inf)| / |S(inf)| = exp(-pi eta m): offer zones up to 1 %.
    const zonesFor = eta => eta > 0 ? Math.min(160, Math.max(4, Math.ceil(Math.log(100) / (Math.PI * eta)))) : 16;
    let maxZones = 0, segments = [], position = null;
    const zonesNow = () => position === null ? Number(zones.value) : position;
    const edge = m => half * Math.sqrt(m / maxZones);

    function rebuildZones() {
      const next = zonesFor(Number(cutoff.value));
      if (next === maxZones) return;
      const atEnd = maxZones === 0 || zonesNow() >= maxZones - 1e-9;
      maxZones = next;
      zones.max = String(maxZones);
      position = null;
      zones.value = String(atEnd ? maxZones : Math.min(maxZones, Number(zones.value)));
      bands.replaceChildren(); segments = [];
      for (let m = 0; m < maxZones; m += 1) {
        for (const sign of [-1, 1]) {
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("class", "fresnel-lab__zone fresnel-lab__zone--" + (m % 2));
          line.setAttribute("x1", sheetX); line.setAttribute("x2", sheetX);
          line.setAttribute("y1", mid + sign * edge(m)); line.setAttribute("y2", mid + sign * edge(m + 1));
          bands.appendChild(line);
          segments.push({m, line});
        }
      }
    }

    function partial(s, eta) {
      const a = Math.exp(-eta * s), c = Math.cos(s), sn = Math.sin(s), d = eta * eta + 1;
      return [((1 - a * c) * eta + a * sn) / d, ((1 - a * c) - a * sn * eta) / d];
    }

    function draw() {
      const m = zonesNow(), eta = Number(cutoff.value), s = Math.PI * m;
      zonesValue.textContent = fmt(m, 1);
      cutoffValue.textContent = eta === 0 ? words.none : fmt(eta, 2);
      segments.forEach(({m: k, line}) => {
        line.style.opacity = k < m ? String(Math.max(0.12, Math.exp(-eta * Math.PI * (k + 0.5)))) : "0.08";
      });
      const b = edge(m);
      rayTop.setAttribute("y1", mid - b); rayBottom.setAttribute("y1", mid + b);
      pathLabel.textContent = "r = z + " + fmt(m / 2, 1) + " λ";
      const n = Math.max(2, Math.ceil(m * 40));
      const pts = [];
      for (let i = 0; i <= n; i += 1) {
        const p = partial(s * i / n, eta);
        pts.push((i ? "L" : "M") + toX(p[0]).toFixed(1) + " " + toY(p[1]).toFixed(1));
      }
      spiral.setAttribute("d", pts.join(" "));
      const p = partial(s, eta), x = toX(p[0]), y = toY(p[1]);
      sum.setAttribute("x2", x); sum.setAttribute("y2", y);
      const len = Math.hypot(x - ox, y - oy);
      if (len > 24) {
        const ux = (x - ox) / len, uy = (y - oy) / len;
        sumHead.setAttribute("points", [[x, y], [x - 26 * ux - 12 * uy, y - 26 * uy + 12 * ux],
          [x - 26 * ux + 12 * uy, y - 26 * uy - 12 * ux]].map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" "));
      } else sumHead.setAttribute("points", "");
      const d = eta * eta + 1, lx = toX(eta / d), ly = toY(1 / d);
      limit.setAttribute("cx", lx); limit.setAttribute("cy", ly);
      limitLabel.setAttribute("x", lx + 18); limitLabel.setAttribute("y", ly - 12);
      limit.style.display = limitLabel.style.display = eta === 0 ? "none" : "";
      const phase = len > 1 ? Math.atan2(p[1], p[0]) * 180 / Math.PI : NaN;
      const sumText = Number.isNaN(phase) ? (eta === 0 && m > 0 ?
        words.sumZero : words.sumIsZero) : words.sumPhase + fmt(phase, 0) + "°. ";
      readout.textContent = sumText + (eta === 0 ?
        words.noLimit :
        words.toLimit + fmt(100 * Math.exp(-Math.PI * eta * m), 0) + words.limit +
        fmt(Math.atan2(1, eta) * 180 / Math.PI, 1) + words.limitEnd);
    }

    function visible() {
      if (document.hidden) return false;
      const slide = root.closest(".reveal .slides section");
      return !slide || slide.classList.contains("present");
    }

    let playing = false, last = null;
    function setPlaying(value) {
      playing = value;
      play.textContent = playing ? words.pause : words.build;
    }
    function frame(now) {
      if (playing && visible() && last !== null) {
        const next = Math.min(maxZones, zonesNow() + Math.min(now - last, 100) / 1000 * maxZones / 6);
        position = next;
        zones.value = String(next);
        draw();
        if (next >= maxZones) setPlaying(false);
      }
      last = now;
      requestAnimationFrame(frame);
    }
    zones.addEventListener("input", () => { position = null; setPlaying(false); draw(); });
    cutoff.addEventListener("input", () => { rebuildZones(); draw(); });
    play.addEventListener("click", () => {
      if (!playing && zonesNow() >= maxZones) { position = 0; zones.value = "0"; }
      setPlaying(!playing);
      draw();
    });
    rebuildZones();
    draw();
    requestAnimationFrame(frame);
  }

  // One scatterer: the section of psi = e^{ikz} + f e^{ikr}/r through the
  // scatterer and the z axis, drawn as Re(psi e^{-i omega t}). The per-pixel
  // phases are tabulated once, so a frame is only cos(a - wt) = cos a cos wt + sin a sin wt.
  function initializeScatterer(root) {
    if (root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const words = wordsFor(root);
    const canvas = root.querySelector("canvas");
    const modeButtons = root.querySelectorAll("[data-mode]");
    const play = root.querySelector("[data-play]");
    const slider = root.querySelector("[data-f]");
    const sliderValue = root.querySelector("[data-f-value]");
    const context = canvas.getContext("2d");

    const cols = 220;
    const rows = 165;
    const lambda = 22;          // field pixels per wavelength
    const cx = 0.38 * cols;     // the scatterer sits left of centre: more room downstream
    const cy = rows / 2;
    const period = 2.6;         // seconds
    const rMin = 0.5 * lambda;  // the 1/r core is clipped, as the point is not resolved
    const vmax = 1.7;

    const cosZ = new Float32Array(cols * rows);
    const sinZ = new Float32Array(cols * rows);
    const cosR = new Float32Array(cols * rows);
    const sinR = new Float32Array(cols * rows);
    const decay = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const n = j * cols + i;
        const z = (i - cx) / lambda;
        const x = (j - cy) / lambda;
        const r = Math.max(Math.hypot(z, x), rMin / lambda);
        cosZ[n] = Math.cos(twoPi * z);
        sinZ[n] = Math.sin(twoPi * z);
        cosR[n] = Math.cos(twoPi * r);
        sinR[n] = Math.sin(twoPi * r);
        decay[n] = 1 / r;     // in units of lambda: f/lambda is the slider
      }
    }

    const field = document.createElement("canvas");
    field.width = cols;
    field.height = rows;
    const fieldContext = field.getContext("2d");
    const image = fieldContext.createImageData(cols, rows);
    const bg = [8, 19, 30];
    const positive = [255, 211, 134];
    const negative = [115, 214, 235];

    let mode = "sum";
    let time = 0;
    let playing = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function draw() {
      const f = Number(slider.value);
      const c = Math.cos(twoPi * time / period);
      const s = Math.sin(twoPi * time / period);
      const withPlane = mode !== "scattered";
      const withScattered = mode !== "incident";
      const data = image.data;
      for (let n = 0; n < cols * rows; n += 1) {
        let v = 0;
        if (withPlane) v += cosZ[n] * c + sinZ[n] * s;
        if (withScattered) v += f * decay[n] * (cosR[n] * c + sinR[n] * s);
        const t = Math.min(Math.abs(v) / vmax, 1);
        const target = v >= 0 ? positive : negative;
        const p = 4 * n;
        data[p] = bg[0] + t * (target[0] - bg[0]);
        data[p + 1] = bg[1] + t * (target[1] - bg[1]);
        data[p + 2] = bg[2] + t * (target[2] - bg[2]);
        data[p + 3] = 255;
      }
      fieldContext.putImageData(image, 0, 0);

      const w = canvas.width;
      const h = canvas.height;
      const scale = w / cols;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(field, 0, 0, w, h);

      // Scatterer, the incident direction and one wavelength.
      const px = cx * scale;
      const py = cy * scale;
      context.fillStyle = "#edf6fc";
      context.strokeStyle = "#08131e";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(px, py, 11, 0, twoPi);
      context.fill();
      context.stroke();

      context.font = "28px system-ui, sans-serif";
      context.fillStyle = "#e5eff7";
      context.textBaseline = "alphabetic";
      context.textAlign = "left";
      context.fillText(words.scatterer, px + 18, py - 20);

      const ax0 = 28;
      const ay = 44;
      context.strokeStyle = "#e5eff7";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(ax0, ay);
      context.lineTo(ax0 + 120, ay);
      context.moveTo(ax0 + 104, ay - 10);
      context.lineTo(ax0 + 122, ay);
      context.lineTo(ax0 + 104, ay + 10);
      context.stroke();
      context.fillText(words.incident, ax0 + 140, ay + 9);

      const bx0 = w - 28 - lambda * scale;
      const by = h - 30;
      context.beginPath();
      context.moveTo(bx0, by - 9);
      context.lineTo(bx0, by + 9);
      context.moveTo(bx0 + lambda * scale, by - 9);
      context.lineTo(bx0 + lambda * scale, by + 9);
      context.moveTo(bx0, by);
      context.lineTo(bx0 + lambda * scale, by);
      context.stroke();
      context.textAlign = "right";
      context.fillText("λ", bx0 - 12, by + 9);

      sliderValue.textContent = f.toFixed(1);
    }

    function visible() {
      if (document.hidden) return false;
      const slide = root.closest(".reveal .slides section");
      return !slide || slide.classList.contains("present");
    }

    let last = null;
    function frame(now) {
      if (playing && visible()) {
        if (last !== null) time += Math.min(now - last, 100) / 1000;
        draw();
      }
      last = now;
      requestAnimationFrame(frame);
    }

    function setPlaying(value) {
      playing = value;
      play.textContent = playing ? words.pause : words.play;
    }

    modeButtons.forEach(button => {
      button.addEventListener("click", () => {
        mode = button.dataset.mode;
        modeButtons.forEach(other =>
          other.setAttribute("aria-pressed", other === button ? "true" : "false"));
        draw();
      });
    });
    slider.addEventListener("input", draw);
    play.addEventListener("click", () => setPlaying(!playing));
    setPlaying(playing);
    draw();
    requestAnimationFrame(frame);
  }

  function initializeAll() {
    document.querySelectorAll("[data-single-scatterer]").forEach(initializeScatterer);
    document.querySelectorAll("[data-refraction-layers]").forEach(initializeLayers);
    document.querySelectorAll("[data-refraction-modes]").forEach(initializeModes);
    document.querySelectorAll("[data-refraction-boundary]").forEach(initializeBoundary);
    document.querySelectorAll("[data-fresnel-zones]").forEach(initializeZones);
  }

  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
