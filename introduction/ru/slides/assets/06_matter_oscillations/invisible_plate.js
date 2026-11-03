/* "Invisible plate" (lecture 11): light in a birefringent plate, then
   neutrinos in vacuum and in matter of constant density.

   Two-state model. Prepared state along the horizontal axis (H or nu_e);
   eigenstates u1, u2 at the angle phi: u1 = (cos phi, -sin phi),
   u2 = (sin phi, cos phi) in the (H, V) or (nu_e, nu_x) basis, so that
   nu_e = cos phi u1 + sin phi u2. The common phase of wave 1 is removed:
   A_x = -sin phi c1 + cos phi c2 exp(i dphi).

   Neutrinos: E = 10 MeV, dm2 = 7.5e-5 eV^2, theta = 33.7 deg.
   Matter: A = 2EV/dm2, tan 2 theta_m = sin 2 theta / (cos 2 theta - A),
   dk_mat = dk_vac sqrt((cos 2 theta - A)^2 + sin^2 2 theta).
   At the solar centre (N_e = 6.1e25 cm^-3) A = 2.05 for 10 MeV. */
(() => {
  "use strict";

  const deg = Math.PI / 180;
  const theta = 33.7 * deg;
  const energyEV = 10e6;
  const dm2 = 7.5e-5;
  const hbarcEVm = 1.973269804e-7;
  const vacuumLength = 4 * Math.PI * energyEV * hbarcEVm / dm2 / 1000; // km
  const maxDistance = 700; // km
  const resonance = Math.cos(2 * theta);
  const solarCentre = 2.05;
  const maxDensity = 3;

  const stepText = {
    1: "Меняйте толщину и угол. Экран светлеет, только если возбуждены обе " +
       "собственные состояния и между ними набежала разность фаз.",
    2: "Меняйте расстояние. Источник готовит ν<sub>e</sub>, но на некотором " +
       "расстоянии измерение находит ν<sub>x</sub>.",
    3: "Одна энергия. Два собственных состояния. Разные длины волн.",
    4: "Модель: постоянная плотность на всём участке. Вещество поворачивает " +
       "собственные направления и меняет скорость набега разности фаз.",
    6: "Чтобы состояние меняло флэйворный состав, нужны два собственных состояния " +
       "с разными фазами."
  };

  const svgNS = "http://www.w3.org/2000/svg";

  function setArrow(line, head, x0, y0, x1, y1, size0) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const length = Math.hypot(dx, dy);
    const size = Math.min(size0 || 16, 0.6 * length);
    const ux = length > 0 ? dx / length : 1;
    const uy = length > 0 ? dy / length : 0;
    const bx = x1 - size * ux;
    const by = y1 - size * uy;
    line.setAttribute("x1", x0.toFixed(2));
    line.setAttribute("y1", y0.toFixed(2));
    line.setAttribute("x2", (bx + 0.3 * size * ux).toFixed(2));
    line.setAttribute("y2", (by + 0.3 * size * uy).toFixed(2));
    head.setAttribute("points", [
      [x1, y1],
      [bx - 0.5 * size * uy, by + 0.5 * size * ux],
      [bx + 0.5 * size * uy, by - 0.5 * size * ux]
    ].map(p => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" "));
    const visible = length > 2 ? "visible" : "hidden";
    line.style.visibility = visible;
    head.style.visibility = visible;
  }

  function setLine(line, x0, y0, x1, y1) {
    line.setAttribute("x1", x0.toFixed(2));
    line.setAttribute("y1", y0.toFixed(2));
    line.setAttribute("x2", x1.toFixed(2));
    line.setAttribute("y2", y1.toFixed(2));
  }

  // Text with an optional subscript, e.g. label(el, "ν", "vac,1").
  function label(el, base, sub) {
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(document.createTextNode(base));
    if (sub) {
      const s = document.createElementNS(svgNS, "tspan");
      s.setAttribute("baseline-shift", "sub");
      s.setAttribute("font-size", "65%");
      s.textContent = sub;
      el.appendChild(s);
    }
  }

  function fmt(x, digits) {
    return x.toFixed(digits).replace(".", ",");
  }

  function initialize(root) {
    if (root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const q = s => root.querySelector(s);
    const qa = s => Array.from(root.querySelectorAll(s));
    // A wrapping div may restrict the steps: data-plate-steps="1-3".
    const host = root.closest("[data-plate-steps]");
    const range = host ? host.dataset.plateSteps.split("-").map(Number) : [];
    const first = range[0] || Number(root.dataset.firstStep || 1);
    const last = range[1] || Number(root.dataset.lastStep || 6);

    const angle = q("[data-angle]");
    const path = q("[data-path]");
    const density = q("[data-density]");
    const play = q("[data-play]");
    const formulaToggle = q("[data-formula-toggle]");
    const assemble = q("[data-assemble]");
    const stepsBox = q("[data-steps]");
    const controls = {
      angle: q('[data-control="angle"]'),
      path: q('[data-control="path"]'),
      density: q('[data-control="density"]'),
      prep: q('[data-control="prep"]')
    };
    const groups = {
      optics: q('[data-layer="optics"]'),
      neutrino: q('[data-layer="neutrino"]'),
      inset: q("[data-inset]"),
      dials: q("[data-dials]"),
      sum: q("[data-sum]"),
      bars: q("[data-bars]"),
      brightness: q("[data-brightness]"),
      curve: q("[data-curve-box]"),
      vacAxes: q("[data-vac-axes]")
    };

    const state = {
      step: first,
      prep: "light",
      formula: false,
      playing: false,
      busy: false
    };

    // Step buttons.
    const stepButtons = [];
    for (let s = first; s <= last; s += 1) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = String(s);
      b.setAttribute("aria-label", "Шаг " + s);
      b.addEventListener("click", () => goTo(s));
      stepsBox.appendChild(b);
      stepButtons.push(b);
    }
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Дальше →";
    next.addEventListener("click", () => goTo(Math.min(last, state.step + 1)));
    stepsBox.appendChild(next);

    // Density marks.
    const ticks = q("[data-ticks]");
    [[0, "вакуум"], [resonance, "макс. смешивание"], [solarCentre, "центр Солнца"]]
      .forEach(([a, text]) => {
        const t = document.createElement("span");
        t.style.left = (100 * a / maxDensity) + "%";
        if (a > 0 && a < 1) t.classList.add("is-start");
        t.textContent = text;
        ticks.appendChild(t);
      });

    function optics() {
      return state.step === 1 || (state.step === 6 && state.prep === "light");
    }

    function show(group, on) {
      group.classList.toggle("is-hidden", !on);
    }

    function physics() {
      const t = Number(path.value);
      const A = Number(density.value);
      if (optics()) {
        const phi = (state.step === 6 ? 0 : Number(angle.value)) * deg;
        return {optical: true, phi, dphi: 4 * Math.PI * t, t, A: 0,
          prep: "h", rate: 1};
      }
      const matter = state.step >= 4;
      const a = matter ? A : 0;
      const phi = 0.5 * Math.atan2(Math.sin(2 * theta), Math.cos(2 * theta) - a);
      const rate = Math.hypot(Math.cos(2 * theta) - a, Math.sin(2 * theta));
      const L = maxDistance * t;
      return {optical: false, phi, rate, L, t, A: a,
        dphi: 2 * Math.PI * L / vacuumLength * rate,
        prep: state.step === 6 && state.prep === "mat1" ? "mat1" : "e"};
    }

    function amplitudes(p, dphi) {
      const c1 = p.prep === "mat1" ? 1 : Math.cos(p.phi);
      const c2 = p.prep === "mat1" ? 0 : Math.sin(p.phi);
      const a1 = -Math.sin(p.phi) * c1;
      const a2 = Math.cos(p.phi) * c2;
      const re = a1 + a2 * Math.cos(dphi);
      const im = a2 * Math.sin(dphi);
      return {c1, c2, a1, a2, re, im, px: re * re + im * im};
    }

    function drawInset(p, amp) {
      const cx = 195, cy = 365, R = 105;
      const at = (a, r) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
      const a1 = -p.phi;
      const a2 = Math.PI / 2 - p.phi;
      label(q("[data-axis-h]"), p.optical ? "H" : "ν", p.optical ? "" : "e");
      label(q("[data-axis-v]"), p.optical ? "V" : "ν", p.optical ? "" : "x");
      [a1, a2].forEach((a, i) => {
        const s = at(a + Math.PI, 0.7 * R);
        const e = at(a, 1.08 * R);
        setLine(q('[data-eigen-axis="' + (i + 1) + '"]'), s[0], s[1], e[0], e[1]);
        const l = q('[data-eigen-label="' + (i + 1) + '"]');
        const lp = at(a, 1.2 * R);
        // Keep labels of steep axes above the note under the inset; move
        // them off the H/V labels when the axes nearly coincide.
        const near = p.phi < 6 * deg;
        l.setAttribute("x", (lp[0] + (near && i === 1 ? 26 : 0)).toFixed(1));
        l.setAttribute("y", (Math.min(lp[1] + 8, 466) + (near && i === 0 ? 26 : 0)).toFixed(1));
        l.setAttribute("text-anchor", Math.cos(a) < -0.2 ? "end" : "start");
        if (p.optical) label(l, "ось " + (i + 1), "");
        else label(l, "ν", (state.step >= 4 ? "mat," : "vac,") + (i + 1));
      });
      [-theta, Math.PI / 2 - theta].forEach((a, i) => {
        const s = at(a + Math.PI, 0.6 * R);
        const e = at(a, 1.0 * R);
        setLine(q('[data-vac-axis="' + (i + 1) + '"]'), s[0], s[1], e[0], e[1]);
      });
      show(groups.vacAxes, !p.optical && state.step >= 4);
      const r = 0.9 * R;
      const stateAngle = p.prep === "mat1" ? a1 : 0;
      const tip = at(stateAngle, r);
      setArrow(q("[data-state]"), q("[data-state-head]"), cx, cy, tip[0], tip[1], 18);
      [[amp.c1, a1], [amp.c2, a2]].forEach(([c, a], i) => {
        const e = at(a, r * c);
        const n = i + 1;
        setArrow(q('[data-comp="' + n + '"]'), q('[data-comp-head="' + n + '"]'),
          cx, cy, e[0], e[1], 14);
        setLine(q('[data-drop="' + n + '"]'), tip[0], tip[1], e[0], e[1]);
        q('[data-drop="' + n + '"]').style.visibility = c > 0.02 && c < 0.98 ? "visible" : "hidden";
      });
      // Output polarization of light: Re(E exp(-i tau)).
      const ellipse = q("[data-ellipse]");
      if (p.optical) {
        const pts = [];
        for (let k = 0; k <= 96; k += 1) {
          const tau = 2 * Math.PI * k / 96;
          // E = c1 u1 + c2 exp(i dphi) u2
          const e1 = Math.cos(-tau);
          const e2 = Math.cos(p.dphi - tau);
          const h = amp.c1 * Math.cos(p.phi) * e1 + amp.c2 * Math.sin(p.phi) * e2;
          const v = -amp.c1 * Math.sin(p.phi) * e1 + amp.c2 * Math.cos(p.phi) * e2;
          pts.push((k ? "L" : "M") + (cx + 0.55 * R * h).toFixed(1) + " " +
            (cy - 0.55 * R * v).toFixed(1));
        }
        ellipse.setAttribute("d", pts.join(" "));
        ellipse.style.visibility = "visible";
      } else {
        ellipse.style.visibility = "hidden";
      }
      q("[data-inset-note]").textContent = p.optical ?
        "поляризации; золотая кривая — свет на выходе" :
        "пространство состояний — не оси в пространстве";
    }

    function drawDials(p, amp) {
      const centres = [[530, 300], [670, 300]];
      const r = 38;
      [[amp.c1, 0], [amp.c2, p.dphi]].forEach(([c, ph], i) => {
        const [x, y] = centres[i];
        const n = i + 1;
        setArrow(q('[data-pointer="' + n + '"]'), q('[data-pointer-head="' + n + '"]'),
          x, y, x + r * c * Math.cos(ph), y - r * c * Math.sin(ph), 12);
      });
      const dphi = q("[data-dphi]");
      dphi.textContent = "Δφ = " + fmt(p.dphi, 2) + " рад; фаза волны 1 вынесена";
    }

    function drawSum(p, amp) {
      const ox = 700, oy = 438, unit = 110;
      const x1 = ox + unit * amp.a1;
      const x2 = x1 + unit * amp.a2 * Math.cos(p.dphi);
      const y2 = oy - unit * amp.a2 * Math.sin(p.dphi);
      const locus = q("[data-locus]");
      locus.setAttribute("cx", x1.toFixed(2));
      locus.setAttribute("r", Math.abs(unit * amp.a2).toFixed(2));
      setArrow(q("[data-sum-line]"), q("[data-sum-head]"), ox, oy, x2, y2, 16);
      setArrow(q('[data-arrow="1"]'), q('[data-arrow-head="1"]'), ox, oy, x1, oy, 14);
      setArrow(q('[data-arrow="2"]'), q('[data-arrow-head="2"]'), x1, oy, x2, y2, 14);
      const sl = q("[data-sum-label]");
      sl.setAttribute("x", ((ox + x2) / 2).toFixed(1));
      sl.setAttribute("y", ((oy + y2) / 2 - 10).toFixed(1));
      sl.style.visibility = Math.hypot(x2 - ox, y2 - oy) > 12 ? "visible" : "hidden";
    }

    function probabilityAt(p, t) {
      if (p.optical) {
        return (Math.sin(2 * p.phi) * Math.sin(2 * Math.PI * t)) ** 2;
      }
      if (p.prep === "mat1") return Math.sin(p.phi) ** 2;
      const d = 2 * Math.PI * maxDistance * t / vacuumLength * p.rate;
      return (Math.sin(2 * p.phi) * Math.sin(d / 2)) ** 2;
    }

    function drawMeasure(p, amp) {
      const px = amp.px;
      const base = 430, height = 140;
      if (p.optical) {
        const g = Math.round(255 * (0.08 + 0.84 * px));
        const fill = "rgb(" + g + "," + g + "," + g + ")";
        q("[data-screen]").style.fill = fill;
        q("[data-screen-big]").style.fill = fill;
        q("[data-brightness-value]").textContent = "яркость " + fmt(px, 2);
      } else {
        [["e", 1 - px], ["x", px]].forEach(([k, v]) => {
          const bar = q('[data-bar="' + k + '"]');
          bar.setAttribute("y", (base - height * v).toFixed(1));
          bar.setAttribute("height", Math.max(0.5, height * v).toFixed(1));
          const t = q('[data-bar-value="' + k + '"]');
          t.setAttribute("y", (base - height * v - 8).toFixed(1));
          t.textContent = fmt(v, 2);
        });
      }
      const pts = [];
      for (let k = 0; k <= 160; k += 1) {
        const t = k / 160;
        pts.push((k ? "L" : "M") + (1012 + 160 * t).toFixed(1) + " " +
          (430 - 140 * probabilityAt(p, t)).toFixed(1));
      }
      q("[data-curve]").setAttribute("d", pts.join(" "));
      const m = q("[data-marker]");
      m.setAttribute("cx", (1012 + 160 * p.t).toFixed(1));
      m.setAttribute("cy", (430 - 140 * px).toFixed(1));
      label(q("[data-curve-y]"), "P", p.optical ? "V" : "x");
      q("[data-curve-x]").textContent = p.optical ? "толщина" : "L, км";
      const depth = p.prep === "mat1" ? null : Math.sin(2 * p.phi) ** 2;
      q("[data-depth]").textContent = depth === null ? "без колебаний" :
        "размах " + fmt(depth, 2);
    }

    function drawScene(p) {
      if (p.optical) {
        const w = 40 + 260 * p.t;
        const plate = q("[data-plate]");
        plate.setAttribute("x", (510 - w / 2).toFixed(1));
        plate.setAttribute("width", w.toFixed(1));
        q("[data-plate-label]").textContent = state.step === 6 ?
          "пластинка, ось вдоль H" : "пластинка, оси под α";
        return;
      }
      const detX = 230 + 750 * p.t;
      q("[data-detector]").setAttribute("transform", "translate(" + detX.toFixed(1) + ",0)");
      const beam = q("[data-nu-beam]");
      beam.setAttribute("x2", Math.max(156, detX - 48).toFixed(1));
      const medium = q("[data-medium]");
      const matter = state.step >= 4;
      medium.setAttribute("width", Math.max(0, detX - 156).toFixed(1));
      medium.style.opacity = matter ? (0.12 + 0.55 * p.A / maxDensity).toFixed(3) : "0";
      q("[data-path-caption]").textContent = matter ?
        "вещество: постоянная плотность на всём участке" : "вакуум";
      q("[data-path-caption]").setAttribute("x", ((156 + Math.max(detX, 520)) / 2).toFixed(1));
      label(q("[data-source-label]"), "ν", p.prep === "mat1" ? "mat,1" : "e");
      q("[data-question]").textContent = state.step === 2 ?
        "Пластинки больше нет. Почему превращения остались?" : "";
    }

    function replica(p, amp) {
      if (state.step !== 5) return stepText[state.step];
      const s = Math.sin(p.phi), c = Math.cos(p.phi);
      const mat = "ν<sub>mat,i</sub>";
      let text = "<b>Источник:</b> ⟨" + mat + "|ν<sub>e</sub>⟩ = " + fmt(c, 2) +
        " и " + fmt(s, 2) + ". <b>Путь:</b> Δφ = " + fmt(p.dphi, 2) +
        " рад. <b>Измерение:</b> ⟨ν<sub>x</sub>|" + mat + "⟩ = −" + fmt(s, 2) +
        " и " + fmt(c, 2) + ". Сумма: P<sub>x</sub> = " + fmt(amp.px, 2) + ".";
      if (Math.abs(p.A - resonance) < 0.06) {
        text += " Максимальная глубина осцилляций; результат на выбранном расстоянии зависит от фазы.";
      }
      return text;
    }

    function draw() {
      const p = physics();
      const amp = amplitudes(p, p.dphi);
      const s = state.step;
      show(groups.optics, p.optical);
      show(groups.neutrino, !p.optical);
      show(groups.inset, s !== 2);
      show(groups.dials, s !== 2);
      show(groups.sum, s >= 5);
      show(groups.bars, !p.optical);
      show(groups.brightness, p.optical);
      show(controls.angle, s === 1);
      show(controls.density, s === 4 || s === 5);
      show(controls.prep, s === 6);
      if (assemble) show(assemble, s === 5);
      q("[data-path-name]").textContent = p.optical ? "Толщина пластинки" : "Расстояние L";
      q("[data-path-value]").textContent = p.optical ?
        "δ = " + fmt(p.dphi, 2) + " рад" : Math.round(p.L) + " км";
      q("[data-angle-value]").textContent = fmt(Number(angle.value), 1) + "°";
      const A = Number(density.value);
      q("[data-density-value]").textContent = state.formula ?
        "A = " + fmt(A, 2) : (Math.abs(A - solarCentre) < 0.05 ? "центр Солнца" :
          Math.abs(A - resonance) < 0.05 ? "макс. смешивание" : A < 0.01 ? "вакуум" : "");
      drawScene(p);
      drawInset(p, amp);
      drawDials(p, amp);
      drawSum(p, amp);
      drawMeasure(p, amp);
      q("[data-replica]").innerHTML = replica(p, amp);
      stepButtons.forEach((b, i) => b.setAttribute("aria-pressed",
        String(first + i === s)));
      qa("[data-prep]").forEach(b => b.setAttribute("aria-pressed",
        String(b.dataset.prep === state.prep)));
      qa("[data-formula]").forEach(f => f.classList.toggle("is-active",
        state.formula && Number(f.dataset.formula) === s));
      formulaToggle.setAttribute("aria-pressed", String(state.formula));
      root.classList.toggle("is-formula", state.formula);
      root.dataset.step = String(s);
    }

    // Step 1 -> 2: the angle visibly turns to theta, then the plate goes.
    function goTo(s) {
      if (state.busy || s === state.step) return;
      if (state.step === 1 && s === 2) {
        state.busy = true;
        const a0 = Number(angle.value);
        const a1 = theta / deg;
        const t0 = performance.now();
        const tick = now => {
          const u = Math.min(1, (now - t0) / 900);
          const e = u * u * (3 - 2 * u);
          angle.value = String(a0 + (a1 - a0) * e);
          draw();
          if (u < 1) requestAnimationFrame(tick);
          else {
            state.busy = false;
            state.step = 2;
            draw();
          }
        };
        requestAnimationFrame(tick);
        return;
      }
      state.step = s;
      if (s === 6) state.prep = "light";
      draw();
    }

    // Path playback.
    let lastTime = null;
    function frame(now) {
      if (state.playing) {
        if (lastTime !== null) {
          let t = Number(path.value) + (now - lastTime) / 9000;
          if (t > 1) t -= 1;
          path.value = String(t);
          draw();
        }
        lastTime = now;
        requestAnimationFrame(frame);
      } else {
        lastTime = null;
      }
    }
    play.addEventListener("click", () => {
      state.playing = !state.playing;
      play.setAttribute("aria-pressed", String(state.playing));
      play.textContent = state.playing ? "❚❚ путь" : "▶ путь";
      if (state.playing) requestAnimationFrame(frame);
    });

    // Step 5: source, path, measurement in turn.
    if (assemble) {
      assemble.addEventListener("click", () => {
        const order = [groups.inset, groups.dials, groups.sum];
        order.forEach((g, i) => {
          setTimeout(() => {
            order.forEach(h => h.classList.toggle("is-lit", h === g));
          }, 1200 * i);
        });
        setTimeout(() => order.forEach(h => h.classList.remove("is-lit")), 3600);
      });
    }

    formulaToggle.addEventListener("click", () => {
      state.formula = !state.formula;
      draw();
    });
    qa("[data-prep]").forEach(b => b.addEventListener("click", () => {
      state.prep = b.dataset.prep;
      draw();
    }));
    [angle, path, density].forEach(i => i.addEventListener("input", draw));
    if (first >= 4) {
      density.value = String(solarCentre);
      path.value = "0.3";
    }
    // No fade on the first draw.
    root.classList.add("is-static");
    draw();
    requestAnimationFrame(() => requestAnimationFrame(() =>
      root.classList.remove("is-static")));
  }

  function initializeAll() {
    document.querySelectorAll("[data-invisible-plate]").forEach(initialize);
  }

  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
