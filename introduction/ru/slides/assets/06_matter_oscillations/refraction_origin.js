// Step-by-step lab "Where the refractive index comes from" (lecture 11).
// Lorentz model after Feynman, Lectures I, ch. 31: bound charges on springs,
// the field of a sheet of charges, a stack of sheets, a time-domain solution.
(() => {
  "use strict";

  if (window.refractionOriginLoaded) return;
  window.refractionOriginLoaded = true;

  const svgNS = "http://www.w3.org/2000/svg";
  const twoPi = 2 * Math.PI;
  const weakDamping = 0.01;      // gamma / omega_0 of the charges in steps 3 and 4

  // ---------- small complex arithmetic ----------
  const cx = (re, im = 0) => ({re, im});
  const add = (a, b) => cx(a.re + b.re, a.im + b.im);
  const sub = (a, b) => cx(a.re - b.re, a.im - b.im);
  const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const scale = (a, s) => cx(a.re * s, a.im * s);
  const div = (a, b) => {
    const d = b.re * b.re + b.im * b.im;
    return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
  };
  const expi = phase => cx(Math.cos(phase), Math.sin(phase));
  const abs = a => Math.hypot(a.re, a.im);
  const arg = a => Math.atan2(a.im, a.re);
  const csqrt = a => {
    const r = abs(a);
    const re = Math.sqrt((r + a.re) / 2);
    const im = Math.sign(a.im || 1) * Math.sqrt(Math.max(0, (r - a.re) / 2));
    return cx(re, im);
  };
  const clog = a => cx(Math.log(abs(a)), arg(a));
  // acos z = -i ln(z + i sqrt(1 - z^2))
  const cacos = z => {
    const w = add(z, mul(cx(0, 1), csqrt(sub(cx(1), mul(z, z)))));
    const l = clog(w);
    return cx(l.im, -l.re);
  };

  // Response of a charge on a spring, x / x(omega -> 0), time factor exp(-i omega t);
  // u = omega / omega_0, gamma in units of omega_0.
  const response = (u, gamma) => div(cx(1), cx(1 - u * u, -gamma * u));

  // Causal solution of the same Lorentz oscillator as in step 1. Time is in
  // 1/omega_0, q E_0 / m = 1; the real part is the response to f(t) cos(omega t).
  // Both quadratures start at rest. The envelope belongs to the driving field,
  // not to the velocity or to the radiation propagator.
  function makeOscillatorHistory({ratio = 0.6, gamma = 0.1, switchCycles = 4, holdCycles = 3} = {}) {
    const period = twoPi / ratio;
    const switchTime = switchCycles * period;
    const end = switchTime + holdCycles * period;
    const steps = Math.ceil(end / Math.min(0.025, period / 192));
    const dt = end / steps;
    const states = new Array(steps + 1);
    const envelope = t => {
      const s = Math.max(0, Math.min(1, t / switchTime));
      return s * s * s * (10 + s * (-15 + 6 * s));
    };
    const drive = t => scale(expi(-ratio * t), envelope(t));
    const derivative = (t, y) => {
      const f = drive(t);
      return [y[2], y[3], f.re - gamma * y[2] - y[0], f.im - gamma * y[3] - y[1]];
    };
    let y = [0, 0, 0, 0];
    states[0] = y;
    for (let i = 0; i < steps; i += 1) {
      const t = i * dt;
      const a = derivative(t, y);
      const b = derivative(t + dt / 2, y.map((v, j) => v + dt * a[j] / 2));
      const c = derivative(t + dt / 2, y.map((v, j) => v + dt * b[j] / 2));
      const d = derivative(t + dt, y.map((v, j) => v + dt * c[j]));
      y = y.map((v, j) => v + dt * (a[j] + 2 * b[j] + 2 * c[j] + d[j]) / 6);
      states[i + 1] = y;
    }
    function sample(t) {
      if (t <= 0) return {x: cx(0), v: cx(0), a: cx(0)};
      const at = Math.min(end, t);
      const i = Math.min(steps - 1, Math.floor(at / dt));
      const s = (at - i * dt) / dt;
      const left = states[i], right = states[i + 1];
      const dl = derivative(i * dt, left), dr = derivative((i + 1) * dt, right);
      const h00 = (2 * s - 3) * s * s + 1, h10 = ((s - 2) * s + 1) * s;
      const h01 = (-2 * s + 3) * s * s, h11 = (s - 1) * s * s;
      const z = left.map((v, j) => h00 * v + h10 * dt * dl[j] + h01 * right[j] + h11 * dt * dr[j]);
      const a = derivative(at, z);
      return {x: cx(z[0], z[1]), v: cx(z[2], z[3]), a: cx(a[2], a[3])};
    }
    return {ratio, gamma, period, switchTime, switchCycles, end, dt, envelope, drive, sample};
  }

  // E_a / D = -integral_0^(a/c) acceleration(u - s) ds, D = N_s q / (2 eps_0 c).
  // This is the paraxial ring sum. Its complete-sheet limit agrees with the
  // exact uniform current-sheet field -Z_0 K(u)/2. No radial damping is used.
  function causalSheetPartial(history, delay, observation = history.end) {
    return sub(history.sample(observation - delay).v, history.sample(observation).v);
  }

  // ---------- DOM helpers ----------
  function node(tag, attrs, parent, ns) {
    const element = ns ? document.createElementNS(svgNS, tag) : document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === "text") element.textContent = value;
      else if (key === "html") element.innerHTML = value;
      else element.setAttribute(key, value);
    }
    if (parent) parent.appendChild(element);
    return element;
  }
  const svgNode = (tag, attrs, parent) => node(tag, attrs, parent, true);

  function points(list) {
    return list.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  }

  function arrow(parent, cls) {
    const group = svgNode("g", {class: cls}, parent);
    const line = svgNode("line", {}, group);
    const head = svgNode("polygon", {}, group);
    return {
      group,
      set(x0, y0, x1, y1) {
        const length = Math.hypot(x1 - x0, y1 - y0);
        const size = Math.min(18, length * 0.45);
        const ux = length ? (x1 - x0) / length : 0;
        const uy = length ? (y1 - y0) / length : 0;
        line.setAttribute("x1", x0.toFixed(1));
        line.setAttribute("y1", y0.toFixed(1));
        line.setAttribute("x2", (x1 - ux * size * 0.6).toFixed(1));
        line.setAttribute("y2", (y1 - uy * size * 0.6).toFixed(1));
        const bx = x1 - ux * size;
        const by = y1 - uy * size;
        head.setAttribute("points", [
          [x1, y1], [bx - uy * size * 0.45, by + ux * size * 0.45], [bx + uy * size * 0.45, by - ux * size * 0.45]
        ].map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "));
        group.setAttribute("visibility", length > 1 ? "visible" : "hidden");
      }
    };
  }

  function slider(parent, label, min, max, step, value, format) {
    const wrap = node("label", {}, parent);
    wrap.innerHTML = label + " ";
    const shown = node("span", {}, wrap);
    const input = node("input", {type: "range", min, max, step, value}, wrap);
    const update = () => { shown.textContent = format(Number(input.value)); };
    input.addEventListener("input", update);
    update();
    return input;
  }

  function button(parent, text) {
    return node("button", {type: "button", text}, parent);
  }

  function typeset(element, attempt = 0) {
    const mj = window.MathJax;
    if (mj && mj.typesetPromise) {
      Promise.resolve(mj.startup && mj.startup.promise).then(() => mj.typesetPromise([element])).catch(() => {});
    }
    else if (mj && mj.Hub && mj.Hub.Queue) mj.Hub.Queue(["Typeset", mj.Hub, element]);
    else if (attempt < 150) setTimeout(() => typeset(element, attempt + 1), 100);
  }

  const deg = radians => radians * 180 / Math.PI;
  const fmt = (value, digits) => value.toFixed(digits);

  function legend(svg, items, x, y, gap) {
    items.forEach(([cls, text, dot], i) => {
      const lx = x + i * gap;
      if (dot) svgNode("circle", {class: cls, cx: lx + 22, cy: y - 5, r: 6}, svg);
      else svgNode("line", {class: cls, x1: lx, y1: y - 6, x2: lx + 44, y2: y - 6}, svg);
      svgNode("text", {x: lx + 56, y: y + 1, text}, svg);
    });
  }

  function lessonPage(lead, equations, takeaway, note = "") {
    return "<p class='origin-lab__lead'>" + lead + "</p>" +
      equations.map(eq => "<div class='origin-lab__formula'>\\[" +
        eq.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "\\]</div>").join("") +
      (takeaway ? "<p class='origin-lab__takeaway'>" + takeaway + "</p>" : "") +
      (note ? "<p class='origin-lab__definition'>" + note + "</p>" : "");
  }

  let lessonSerial = 0;
  function makeLessonTabs(body, pages, label) {
    body.classList.add("origin-lab__lesson");
    const bar = node("div", {class: "origin-lab__tabs", role: "tablist", "aria-label": label}, body);
    const area = node("div", {class: "origin-lab__theory"}, body);
    const uid = "origin-lesson-" + (++lessonSerial);
    const buttons = [], panels = [];
    let active = 0;
    const api = {onSelect: null, get active() { return active; },
      get isExperiment() { return active === pages.length - 1; }};
    function select(i) {
      active = i;
      body.classList.toggle("origin-lab__lesson--interactive", api.isExperiment);
      buttons.forEach((tab, j) => {
        tab.setAttribute("aria-selected", String(i === j));
        tab.tabIndex = i === j ? 0 : -1;
        panels[j].hidden = i !== j;
      });
      if (api.onSelect) api.onSelect(i);
    }
    pages.forEach(([title, html], i) => {
      const tab = button(bar, title);
      tab.id = uid + "-tab-" + i;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", uid + "-panel-" + i);
      const panel = node("div", {id: uid + "-panel-" + i, role: "tabpanel", "aria-labelledby": tab.id,
        class: i === pages.length - 1 ? "origin-lab__experiment" : "origin-lab__lesson-copy", html}, area);
      buttons.push(tab); panels.push(panel);
      tab.addEventListener("click", () => select(i));
      tab.addEventListener("keydown", event => {
        let next;
        if (event.key === "ArrowRight") next = (i + 1) % pages.length;
        if (event.key === "ArrowLeft") next = (i + pages.length - 1) % pages.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = pages.length - 1;
        if (next !== undefined) {
          event.preventDefault(); event.stopPropagation(); select(next); buttons[next].focus();
        }
      });
    });
    api.experiment = panels[pages.length - 1];
    api.select = select;
    select(0);
    return api;
  }

  // ---------- step 1: a charge on a spring ----------
  function stepOscillator(body) {
    body.classList.add("origin-lab__oscillator");
    const tabs = makeLessonTabs(body, [
      ["Уравнение", lessonPage("Что делает электрическое поле с зарядом?", [
        "E(t)=E_0\\cos\\omega t",
        "m\\ddot x+m\\gamma\\dot x+m\\omega_0^2x=qE(t)"
      ], "Поле раскачивает связанный заряд.", "\\(\\omega_0\\) — собственная частота; \\(\\gamma\\) — трение. Рассматриваем \\(q>0\\).")],
      ["Отклик", lessonPage("Как движется заряд после затухания переходного процесса?", [
        "x(t)=x_0\\cos(\\omega t-\\delta)",
        "x_0=\\frac{qE_0/m}{\\sqrt{(\\omega_0^2-\\omega^2)^2+\\gamma^2\\omega^2}}"
      ], "Частоту задаёт свет. Заряд меняет амплитуду и фазу.",
      "\\(x_{\\rm ст}=qE_0/(m\\omega_0^2)\\) — смещение в постоянном поле.")],
      ["Скорость", lessonPage("Как связаны смещение и скорость?", [
        "x=x_0\\cos\\varphi",
        "v=\\dot x=\\omega x_0\\cos\\!\\left(\\varphi+\\frac\\pi2\\right)"
      ], "Скорость опережает смещение на четверть периода.", "\\(\\varphi=\\omega t-\\delta\\). Эта скорость определит поле всего слоя.")],
      ["Фаза", lessonPage("Когда заряд следует за полем, а когда движется против него?", [
        "\\tan\\delta=\\frac{\\gamma\\omega}{\\omega_0^2-\\omega^2},\\qquad 0<\\delta<\\pi",
        "\\begin{aligned}\\omega\\ll\\omega_0&:\\quad\\delta\\simeq0\\\\\\omega=\\omega_0&:\\quad\\delta=\\pi/2\\\\\\omega\\gg\\omega_0&:\\quad\\delta\\simeq\\pi\\end{aligned}"
      ], "В прозрачной области ниже резонанса смещение почти в фазе с полем.", "Предельные оценки: слабое трение, \\(\\gamma\\ll\\omega_0\\).")],
      ["Интерактив", ""]
    ], "Один заряд: уравнение, отклик, скорость, фаза и интерактив");
    const experiment = tabs.experiment;
    const controls = node("div", {class: "origin-lab__controls"}, experiment);
    const ratio = slider(controls, "Частота поля, \\(\\omega/\\omega_0\\)", 0.1, 2, 0.01, 0.6, v => fmt(v, 2));
    const damping = slider(controls, "Трение, \\(\\gamma/\\omega_0\\)", 0.02, 0.6, 0.01, 0.1, v => fmt(v, 2));
    const figures = node("div", {class: "origin-lab__lesson-figures origin-lab__oscillator-figures"}, experiment);
    const chargeSvg = svgNode("svg", {viewBox: "0 0 560 560", role: "img",
      "aria-label": "Поле волны раскачивает связанный заряд; смещение нормировано на амплитуду"}, figures);
    svgNode("line", {class: "origin-lab__wall", x1: 60, y1: 250, x2: 60, y2: 430}, chargeSvg);
    const spring = svgNode("path", {class: "origin-lab__spring"}, chargeSvg);
    const ball = svgNode("circle", {class: "origin-lab__charge", r: 26, cy: 340}, chargeSvg);
    svgNode("text", {x: 250, y: 520, "text-anchor": "middle", text: "связанный заряд q > 0"}, chargeSvg);
    svgNode("text", {x: 250, y: 550, "text-anchor": "middle", text: "смещение x/x₀"}, chargeSvg);
    const field = arrow(chargeSvg, "origin-lab__field-arrow");
    svgNode("text", {x: 250, y: 60, "text-anchor": "middle", text: "поле волны E/E₀"}, chargeSvg);
    const xArrow = arrow(chargeSvg, "origin-lab__x-arrow");
    const svg = svgNode("svg", {viewBox: "0 0 600 560", role: "img",
      "aria-label": "Нормированные поле, смещение и скорость заряда во времени"}, figures);
    const x0 = 30, x1 = 570, y0 = 310, amp = 145, window = 2.4;
    svgNode("line", {class: "origin-lab__axis", x1: x0, y1: y0, x2: x1, y2: y0}, svg);
    svgNode("text", {x: x1, y: 535, "text-anchor": "end", text: "время; 2,4 собственных периода"}, svg);
    const traceE = svgNode("path", {class: "origin-lab__trace-incident"}, svg);
    const traceX = svgNode("path", {class: "origin-lab__trace-charge"}, svg);
    const traceV = svgNode("path", {class: "origin-lab__trace-velocity"}, svg);
    const cursor = svgNode("line", {class: "origin-lab__cursor", y1: y0 - amp - 20, y2: y0 + amp + 20}, svg);
    const cursorLabel = svgNode("text", {class: "origin-lab__cursor-label", y: y0 - amp - 30,
      "text-anchor": "middle", text: "сейчас"}, svg);
    legend(svg, [["origin-lab__trace-incident", "E/E₀"], ["origin-lab__trace-charge", "x/x₀"],
      ["origin-lab__trace-velocity", "v/(ωx₀)"]], 30, 45, 180);
    const readout = node("p", {class: "origin-lab__readout", "aria-live": "polite"}, experiment);
    let tau = 0;
    function draw() {
      const u = Number(ratio.value), chi = response(u, Number(damping.value));
      const lag = arg(chi), gain = abs(chi), samples = 320;
      const pathE = [], pathX = [], pathV = [];
      for (let i = 0; i <= samples; i += 1) {
        const t = twoPi * window * i / samples, px = x0 + (x1 - x0) * i / samples;
        pathE.push([px, y0 - amp * Math.cos(u * t)]);
        pathX.push([px, y0 - amp * Math.cos(u * t - lag)]);
        pathV.push([px, y0 + amp * Math.sin(u * t - lag)]);
      }
      traceE.setAttribute("d", points(pathE)); traceX.setAttribute("d", points(pathX)); traceV.setAttribute("d", points(pathV));
      const cursorX = x0 + (x1 - x0) * ((tau / (twoPi * window)) % 1);
      cursor.setAttribute("x1", cursorX); cursor.setAttribute("x2", cursorX); cursorLabel.setAttribute("x", cursorX);
      const phase = u * tau, shift = 95 * Math.cos(phase - lag), ballX = 250 + shift;
      field.set(250, 145, 250 + 125 * Math.cos(phase), 145);
      ball.setAttribute("cx", ballX);
      const spr = [[60, 340]];
      for (let i = 1; i < 18; i += 1) spr.push([60 + (ballX - 86) * i / 18, 340 + (i % 2 ? -18 : 18)]);
      spr.push([ballX - 26, 340]); spring.setAttribute("d", points(spr)); xArrow.set(250, 425, ballX, 425);
      const where = lag < Math.PI / 6 ? "почти в фазе с полем" : lag > 5 * Math.PI / 6 ?
        "почти в противофазе" : Math.abs(lag - Math.PI / 2) < Math.PI / 12 ? "около четверти периода" : "смещение отстаёт от поля";
      readout.textContent = "δ = " + fmt(deg(lag), 1) + "°; " + where + ". Амплитуда x₀/xст = " + fmt(gain, 2) + ".";
    }
    ratio.addEventListener("input", draw); damping.addEventListener("input", draw);
    return {
      tick(dt) { if (!tabs.isExperiment) return; tau = (tau + dt * twoPi / 2.4) % (twoPi * window * 1e6); draw(); }, draw
    };
  }

  // ---------- step 2: retarded rings and a causally driven sheet ----------
  function stepZones(body) {
    body.classList.add("origin-lab__zones");
    const tabs = makeLessonTabs(body, [
      ["Запаздывание", lessonPage("Какое движение заряда мы видим в точке P?", [
        "t'=t-\\frac Rc",
        "dE_x\\propto-\\frac{\\ddot x(t')}{R}"
      ], "Разные расстояния — разные моменты движения.", "Поперечное излучение заряда: дальнее поле, малые углы к оси.")],
      ["Кольца", lessonPage("Сложим сначала заряды на одинаковом расстоянии от P.", [
        "R^2=L^2+b^2,\\qquad b\\,db=R\\,dR",
        "dE_x\\simeq-\\frac{N_sq}{2\\varepsilon_0c^2}\\,\\ddot x(t-R/c)\\,dR"
      ], "Рост площади кольца сокращает множитель \\(1/R\\).", "\\(N_s\\) — число зарядов на единицу площади; \\(b\\) — радиус кольца.")],
      ["Сумма", lessonPage("Теперь добавим кольца до расстояния \\(R=L+a\\).", [
        "E_a\\simeq-\\frac Dc\\int_L^{L+a}\\ddot x(t-R/c)\\,dR",
        "E_a=-D\\,[v(u)-v(u-a/c)]"
      ], "Сумма ускорений превращается в разность скоростей.", "\\(u=t-L/c,\\quad v=\\dot x,\\quad D=N_sq/(2\\varepsilon_0c)\\).")],
      ["Окружность", lessonPage("Что получится, если колебания шли всегда?", [
        "\\widetilde v(\\tau)=Ve^{-i\\omega\\tau}",
        "\\widetilde E_a=-DV e^{-i\\omega u}(1-e^{ika})"
      ], "Дальний член не уменьшается. Конец суммы ходит по окружности.", "\\(k=\\omega/c\\). Предельного значения у такой суммы нет.")],
      ["Включение", lessonPage("Включим падающую волну плавно.", [
        "\\ddot{\\widetilde x}+\\gamma\\dot{\\widetilde x}+\\omega_0^2\\widetilde x=\\frac{qE_0}{m}f(t)e^{-i\\omega t}",
        "x(0)=0,\\qquad v(0)=0"
      ], "Историю скорости берём из уравнения шага 1.", "До включения \\(f=0\\); после включения \\(f=1\\).")],
      ["Поле слоя", lessonPage("Дальние кольца показывают время до включения.", [
        "v(u-a/c)\\longrightarrow0",
        "E_{\\rm слой}=-D v(u)=-\\frac{Z_0}{2}K_x(u)"
      ], "Остаётся скорость в момент \\(u=t-L/c\\).", "\\(K_x=N_sqv,\\quad Z_0=1/(\\varepsilon_0c)\\). Для однородного слоя результат точен.")],
      ["90°", lessonPage("Почему поле слоя сдвинуто на четверть периода?", [
        "x=X_0\\cos\\omega u",
        "E_{\\rm слой}=D\\omega X_0\\sin\\omega u"
      ], "Поле слоя отстаёт от смещения на четверть периода.", "К падающему полю: \\(90^\\circ+\\delta\\); в прозрачной области ниже резонанса \\(\\delta\\approx0\\).")],
      ["Интерактив", ""]
    ], "Поле слоя: от запаздывающих вкладов к сдвигу фазы");
    const experiment = tabs.experiment;
    const controls = node("div", {class: "origin-lab__controls origin-lab__zones-controls"}, experiment);
    const ratio = slider(controls, "Частота поля, \\(\\omega/\\omega_0\\)", 0.1, 2, 0.01, 0.6, v => fmt(v, 2));
    const friction = slider(controls, "Трение, \\(\\gamma/\\omega_0\\)", 0.02, 0.6, 0.01, 0.1, v => fmt(v, 2));
    const switching = slider(controls, "Включение поля, периодов", 1, 8, 0.5, 4, v => fmt(v, 1));
    const zones = slider(controls, "Учтённые зоны Френеля", 0, 16, "any", 16, v => fmt(v, 1));
    const figures = node("div", {class: "origin-lab__zones-figures"}, experiment);
    const geometry = svgNode("svg", {viewBox: "0 0 560 560", role: "img",
      "aria-label": "Слой и точка наблюдения; история поля и скорости с отметкой запаздывающего момента"}, figures);
    const planeX = 65, pointX = 492, midY = 145, radius = 118;
    svgNode("line", {class: "origin-lab__ray origin-lab__ray--axis", x1: planeX, x2: pointX, y1: midY, y2: midY}, geometry);
    const rings = svgNode("g", {}, geometry);
    const rays = [-1, 1].map(() => svgNode("line", {class: "origin-lab__ray"}, geometry));
    svgNode("circle", {class: "origin-lab__point", cx: pointX, cy: midY, r: 6}, geometry);
    svgNode("text", {x: pointX + 13, y: midY + 7, text: "P"}, geometry);
    svgNode("text", {x: planeX + 20, y: 26, text: "слой z = 0"}, geometry);
    svgNode("text", {x: 270, y: 136, text: "L ≫ λ"}, geometry);
    const retardLabel = svgNode("text", {x: 280, y: 70, text: ""}, geometry);
    const timeLabel = svgNode("text", {x: 28, y: 310, text: ""}, geometry);
    svgNode("text", {x: 28, y: 550, text: "T = 2π/ω"}, geometry);
    const hx = 30, hw = 495, hy = 420, ha = 76;
    svgNode("line", {class: "origin-lab__axis", x1: hx, x2: hx + hw, y1: hy, y2: hy}, geometry);
    const driveTrace = svgNode("path", {class: "origin-lab__trace-incident"}, geometry);
    const velocityTrace = svgNode("path", {class: "origin-lab__trace-velocity"}, geometry);
    const pastCursor = svgNode("line", {class: "origin-lab__cursor", y1: hy - ha - 6, y2: hy + ha + 6}, geometry);
    const pastDot = svgNode("circle", {class: "origin-lab__charge", r: 5}, geometry);
    const pastLabel = svgNode("text", {class: "origin-lab__cursor-label", y: hy - ha - 12, "text-anchor": "middle", text: "t′"}, geometry);
    const beforeLabel = svgNode("text", {class: "origin-lab__cursor-label", x: hx, y: 525, text: "0: начало"}, geometry);
    svgNode("text", {class: "origin-lab__cursor-label", x: hx + hw, y: 525, "text-anchor": "end", text: "u = t − L/c"}, geometry);
    legend(geometry, [["origin-lab__trace-incident", "E/E₀"], ["origin-lab__trace-velocity", "v/(ωx₀)"]], 245, 550, 145);

    const svg = svgNode("svg", {viewBox: "0 0 600 560", role: "img",
      "aria-label": "Комплексная сумма запаздывающих вкладов: окружность вечной волны и спираль причинно включённой волны"}, figures);
    const axisX = svgNode("line", {class: "origin-lab__axis"}, svg);
    const axisY = svgNode("line", {class: "origin-lab__axis"}, svg);
    const reLabel = svgNode("text", {text: "Re"}, svg);
    const imLabel = svgNode("text", {text: "Im"}, svg);
    const exact = svgNode("path", {class: "origin-lab__exact"}, svg);
    const spiralParts = [0, 1].map(i => svgNode("path", {class: "origin-lab__spiral origin-lab__spiral--" + i}, svg));
    const center = svgNode("circle", {class: "origin-lab__limit", r: 6}, svg);
    const centerLabel = svgNode("text", {text: "−Dv(u)"}, svg);
    const lastArrow = arrow(svg, "origin-lab__ring-arrow");
    const total = arrow(svg, "origin-lab__sum-arrow");
    legend(svg, [["origin-lab__exact", "вечная волна"]], 25, 26, 0);
    legend(svg, [["origin-lab__spiral--0", "плавное включение"]], 270, 26, 0);
    svgNode("text", {class: "origin-lab__cursor-label", x: 300, y: 550, "text-anchor": "middle",
      text: "фаза относительно падающего поля; t фиксировано"}, svg);
    const bottom = node("div", {class: "origin-lab__zones-bottom"}, experiment);
    const play = button(bottom, "Собрать слой");
    const readout = node("p", {class: "origin-lab__readout", "aria-live": "polite"}, bottom);

    let model = null, running = false, automatic = false, segments = [];
    function rebuild() {
      const history = makeOscillatorHistory({ratio: Number(ratio.value), gamma: Number(friction.value), switchCycles: Number(switching.value)});
      const maxZones = 2 * history.end / history.period + 2;
      const amplitude = history.ratio * abs(response(history.ratio, history.gamma));
      const rotation = scale(expi(history.ratio * history.end), 1 / amplitude);
      const partial = count => mul(causalSheetPartial(history, count * history.period / 2), rotation);
      const limit = mul(scale(history.sample(history.end).v, -1), rotation);
      const steady = mul(cx(0, 1), scale(response(history.ratio, history.gamma), 1 / abs(response(history.ratio, history.gamma))));
      const eternal = count => mul(steady, sub(cx(1), expi(Math.PI * count)));
      const all = [cx(0), limit];
      for (let i = 0; i <= Math.ceil(maxZones * 40); i += 1) all.push(partial(maxZones * i / Math.ceil(maxZones * 40)));
      for (let i = 0; i <= 100; i += 1) all.push(eternal(2 * i / 100));
      const minX = Math.min(...all.map(p => p.re)), maxX = Math.max(...all.map(p => p.re));
      const minY = Math.min(...all.map(p => p.im)), maxY = Math.max(...all.map(p => p.im));
      const unit = Math.min(455 / Math.max(2, maxX - minX), 410 / Math.max(2, maxY - minY));
      const map = p => [300 + unit * (p.re - (maxX + minX) / 2), 280 - unit * (p.im - (maxY + minY) / 2)];
      const origin = map(cx(0)), end = map(limit);
      axisX.setAttribute("x1", 35); axisX.setAttribute("x2", 560); axisX.setAttribute("y1", origin[1]); axisX.setAttribute("y2", origin[1]);
      axisY.setAttribute("x1", origin[0]); axisY.setAttribute("x2", origin[0]); axisY.setAttribute("y1", 48); axisY.setAttribute("y2", 520);
      reLabel.setAttribute("x", 565); reLabel.setAttribute("y", origin[1] + 7);
      imLabel.setAttribute("x", origin[0] + 10); imLabel.setAttribute("y", 62);
      center.setAttribute("cx", end[0]); center.setAttribute("cy", end[1]);
      centerLabel.setAttribute("x", end[0] + 12); centerLabel.setAttribute("y", end[1] - 10);
      exact.setAttribute("d", points(Array.from({length: 121}, (_, i) => map(eternal(2 * i / 120)))));
      const wasFull = !model || Number(zones.value) >= Number(zones.max) - 0.01;
      zones.max = String(maxZones);
      zones.value = String(wasFull ? maxZones : Math.min(maxZones, Number(zones.value)));
      zones.dispatchEvent(new Event("input"));
      const edge = count => Math.sqrt((1000 + count / 2) ** 2 - 1000 ** 2);
      const bmax = edge(maxZones);
      rings.replaceChildren(); segments = [];
      for (let m = 0; m < Math.ceil(maxZones); m += 1) {
        for (const sign of [-1, 1]) {
          segments.push({m, line: svgNode("line", {class: "origin-lab__zone origin-lab__zone--" + (m % 2),
            x1: planeX, x2: planeX, y1: midY + sign * radius * edge(m) / bmax,
            y2: midY + sign * radius * edge(Math.min(m + 1, maxZones)) / bmax}, rings)});
        }
      }
      const historyPoints = [], forcePoints = [];
      const tmin = -history.period;
      for (let i = 0; i <= 650; i += 1) {
        const t = tmin + (history.end - tmin) * i / 650;
        const px = hx + hw * i / 650;
        historyPoints.push([px, hy - ha * history.sample(t).v.re / amplitude]);
        forcePoints.push([px, hy - ha * history.drive(t).re]);
      }
      velocityTrace.setAttribute("d", points(historyPoints)); driveTrace.setAttribute("d", points(forcePoints));
      beforeLabel.setAttribute("x", hx + hw * (-tmin) / (history.end - tmin));
      model = {history, partial, limit, eternal, map, origin, amplitude, edge, bmax, maxZones, tmin};
      running = false; play.textContent = "Собрать слой";
      draw();
    }
    function draw() {
      if (!model) return;
      const {history, partial, limit, map, origin, amplitude, edge, bmax, tmin} = model;
      const count = Number(zones.value);
      const paths = ["", ""];
      let previous = origin;
      const n = Math.max(2, Math.ceil(count * 44));
      for (let i = 1; i <= n; i += 1) {
        const at = count * i / n, p = map(partial(at));
        const parity = Math.floor(Math.max(0, at - count / n / 2)) % 2;
        paths[parity] += "M" + previous[0].toFixed(2) + " " + previous[1].toFixed(2) + "L" + p[0].toFixed(2) + " " + p[1].toFixed(2);
        previous = p;
      }
      spiralParts.forEach((path, i) => path.setAttribute("d", paths[i]));
      exact.style.opacity = "0.45";
      const sum = partial(count), end = map(sum), tail = map(partial(Math.max(0, count - 0.12)));
      total.set(...origin, ...end); lastArrow.set(...tail, ...end);
      const retarded = history.end - count * history.period / 2;
      const velocity = history.sample(retarded).v;
      const b = radius * edge(count) / bmax;
      segments.forEach(({m, line}) => {
        line.classList.toggle("is-on", m < count);
        line.classList.toggle("origin-lab__zone--quiet", m >= 2 * history.end / history.period);
      });
      rays.forEach((ray, i) => {
        ray.setAttribute("x1", planeX); ray.setAttribute("y1", midY + (i ? 1 : -1) * b);
        ray.setAttribute("x2", pointX); ray.setAttribute("y2", midY);
      });
      retardLabel.textContent = "R/c = L/c + " + fmt(count / 2, 1) + " T";
      timeLabel.textContent = "u = " + fmt(history.end / history.period, 1) + " T;  t′ = " + fmt(retarded / history.period, 1) + " T";
      const cursorX = hx + hw * (retarded - tmin) / (history.end - tmin);
      pastCursor.setAttribute("x1", cursorX); pastCursor.setAttribute("x2", cursorX);
      pastLabel.setAttribute("x", cursorX); pastDot.setAttribute("cx", cursorX); pastDot.setAttribute("cy", hy - ha * velocity.re / amplitude);
      const residual = abs(sub(sum, limit));
      const phase = ((deg(arg(sum)) % 360) + 360) % 360;
      const phaseText = abs(sum) > 1e-3 * abs(limit) ?
        " Фаза к падающему полю: " + fmt(phase, 1) + "°." : " При нулевой амплитуде фаза не определена.";
      readout.textContent = count < 0.01 ? "Кольца ещё не учтены. Момент наблюдения t фиксирован." :
        (retarded <= 0 ? "v(t′) = 0: сумма достигла поля слоя." :
          "Остаток до поля слоя: " + fmt(100 * residual / Math.max(1e-12, abs(limit)), 1) + " %.") +
        phaseText;
    }
    zones.addEventListener("input", () => {
      if (!automatic) { running = false; play.textContent = "Собрать слой"; }
      draw();
    });
    [ratio, friction, switching].forEach(input => input.addEventListener("input", rebuild));
    play.addEventListener("click", () => {
      running = !running;
      if (running && Number(zones.value) >= Number(zones.max) - 0.01) zones.value = "0";
      play.textContent = running ? "Пауза" : "Собрать слой";
      draw();
    });
    tabs.onSelect = () => {
      if (!model) return;
      if (!tabs.isExperiment) { running = false; play.textContent = "Собрать слой"; }
      draw();
    };
    rebuild();
    return {
      tick(dt) {
        if (!running || !tabs.isExperiment) return;
        const next = Math.min(Number(zones.max), Number(zones.value) + dt * 2.4);
        zones.value = String(next); automatic = true; zones.dispatchEvent(new Event("input")); automatic = false;
        running = next < Number(zones.max); play.textContent = running ? "Пауза" : "Собрать слой";
      }, draw
    };
  }

  // ---------- stack of thin sheets: exact 1D solution ----------
  // Field between sheets: A e^{ikz} + B e^{-ikz}; at a sheet E is continuous and
  // E'(z+) - E'(z-) = -2 k beta E, so a single sheet transmits t = 1/(1 - i beta).
  function solveStack(count, spacing, beta, k) {
    const regions = new Array(count + 1);
    let A = cx(1), B = cx(0);
    regions[count] = {A, B};
    const ik = cx(0, k);
    for (let j = count - 1; j >= 0; j -= 1) {
      const z = j * spacing;
      const ep = expi(k * z), em = expi(-k * z);
      const E = add(mul(A, ep), mul(B, em));
      const dRight = mul(ik, sub(mul(A, ep), mul(B, em)));
      const dLeft = add(dRight, scale(mul(beta, E), 2 * k));
      const ratio = div(dLeft, ik);
      A = mul(scale(add(E, ratio), 0.5), em);
      B = mul(scale(sub(E, ratio), 0.5), ep);
      regions[j] = {A, B};
    }
    const norm = regions[0].A;
    const normalized = regions.map(r => ({A: div(r.A, norm), B: div(r.B, norm)}));
    return {
      regions: normalized,
      transmitted: div(cx(1), norm),
      reflected: div(regions[0].B, norm),
      field(z) {
        const index = z < 0 ? 0 : Math.min(count, Math.floor(z / spacing) + 1);
        const r = normalized[index];
        return add(mul(r.A, expi(k * z)), mul(r.B, expi(-k * z)));
      }
    };
  }

  // ---------- step 3: behind one sheet ----------
  function stepSheet(body) {
    const controls = node("div", {class: "origin-lab__controls"}, body);
    const density = slider(controls, "Плотность зарядов в слое", 0, 1, 0.01, 0.4, v => fmt(v, 2));
    const ratio = slider(controls, "Частота, \\(\\omega/\\omega_0\\)", 0.1, 2, 0.01, 0.6, v => fmt(v, 2));
    const svg = svgNode("svg", {viewBox: "0 0 1200 430", role: "img",
      "aria-label": "Падающая волна, волна слоя и их сумма за слоем; вращающиеся стрелки"}, body);
    const readout = node("p", {class: "origin-lab__readout", "aria-live": "polite"}, body);

    const x0 = 40, x1 = 600, y0 = 230, amp = 120;
    svgNode("line", {class: "origin-lab__axis", x1: x0, y1: y0, x2: x1, y2: y0}, svg);
    svgNode("text", {x: x1, y: y0 + amp + 50, "text-anchor": "end", text: "время в точке за слоем"}, svg);
    const traceIn = svgNode("path", {class: "origin-lab__trace-incident"}, svg);
    const traceSheet = svgNode("path", {class: "origin-lab__trace-charge"}, svg);
    const traceSum = svgNode("path", {class: "origin-lab__trace-sum"}, svg);
    const cursor = svgNode("line", {class: "origin-lab__cursor", y1: y0 - amp - 20, y2: y0 + amp + 20}, svg);
    legend(svg, [["origin-lab__trace-incident", "падающая"], ["origin-lab__trace-charge", "волна слоя"],
      ["origin-lab__trace-sum", "сумма"]], 40, 47, 215);

    // the rotating arrows: the vertical coordinate of a tip is the field now
    const ox = 880, oy = 215, unit = 150;
    svgNode("line", {class: "origin-lab__axis", x1: ox - 190, y1: oy, x2: ox + 190, y2: oy}, svg);
    svgNode("line", {class: "origin-lab__axis", x1: ox, y1: oy + 185, x2: ox, y2: oy - 185}, svg);
    svgNode("circle", {class: "origin-lab__circle", cx: ox, cy: oy, r: unit}, svg);
    svgNode("text", {x: ox + 10, y: oy - 170, text: "поле сейчас"}, svg);
    svgNode("text", {x: ox + 190, y: oy + 215, "text-anchor": "end", text: "стрелки вращаются с частотой ω"}, svg);
    const projection = svgNode("line", {class: "origin-lab__projection"}, svg);
    const projectionDot = svgNode("circle", {class: "origin-lab__projection-dot", r: 7}, svg);
    const vIn = arrow(svg, "origin-lab__phasor-incident");
    const vSheet = arrow(svg, "origin-lab__phasor-charge");
    const vSum = arrow(svg, "origin-lab__phasor-sum");
    const angleArc = svgNode("path", {class: "origin-lab__angle"}, svg);
    const labelIn = svgNode("text", {class: "origin-lab__label-incident", text: "E₀"}, svg);
    const labelSheet = svgNode("text", {class: "origin-lab__label-charge", text: "εE₀"}, svg);
    const labelSum = svgNode("text", {class: "origin-lab__label-sum", text: "сумма"}, svg);
    const labelAngle = svgNode("text", {text: "ε"}, svg);

    let theta = 0;
    function draw() {
      const u = Number(ratio.value);
      const beta = scale(response(u, weakDamping), 0.5 * Number(density.value));
      const t = div(cx(1), sub(cx(1), mul(cx(0, 1), beta)));
      const r = sub(t, cx(1));
      const samples = 200;
      const pIn = [], pSheet = [], pSum = [];
      for (let i = 0; i <= samples; i += 1) {
        const phase = twoPi * 2 * i / samples;
        const x = x0 + (x1 - x0) * i / samples;
        const e = expi(-phase);
        pIn.push([x, y0 - amp * e.re]);
        pSheet.push([x, y0 - amp * mul(r, e).re]);
        pSum.push([x, y0 - amp * mul(t, e).re]);
      }
      traceIn.setAttribute("d", points(pIn));
      traceSheet.setAttribute("d", points(pSheet));
      traceSum.setAttribute("d", points(pSum));
      const cursorX = x0 + (x1 - x0) * ((theta / (2 * twoPi)) % 1);
      cursor.setAttribute("x1", cursorX.toFixed(1));
      cursor.setAttribute("x2", cursorX.toFixed(1));

      // arrows at the present moment, z e^{-i theta}, with the real axis vertical:
      // the vertical coordinate of a tip is the value drawn on the traces
      const rot = expi(-theta);
      const place = z => { const w = mul(z, rot); return [ox - unit * w.im, oy - unit * w.re]; };
      const pInTip = place(cx(1));
      const pSumTip = place(t);
      vIn.set(ox, oy, pInTip[0], pInTip[1]);
      vSheet.set(pInTip[0], pInTip[1], pSumTip[0], pSumTip[1]);
      vSum.set(ox, oy, pSumTip[0], pSumTip[1]);
      projection.setAttribute("x1", pSumTip[0].toFixed(1));
      projection.setAttribute("y1", pSumTip[1].toFixed(1));
      projection.setAttribute("x2", ox);
      projection.setAttribute("y2", pSumTip[1].toFixed(1));
      projectionDot.setAttribute("cx", ox);
      projectionDot.setAttribute("cy", pSumTip[1].toFixed(1));
      const phi = arg(t);
      const a0 = Math.atan2(-(pInTip[1] - oy), pInTip[0] - ox);
      const a1 = Math.atan2(-(pSumTip[1] - oy), pSumTip[0] - ox);
      const radius = 70;
      angleArc.setAttribute("d", Math.abs(phi) > 0.01 ?
        "M" + (ox + radius * Math.cos(a0)).toFixed(1) + " " + (oy - radius * Math.sin(a0)).toFixed(1) +
        " A" + radius + " " + radius + " 0 0 " + (phi > 0 ? 1 : 0) + " " +
        (ox + radius * Math.cos(a1)).toFixed(1) + " " + (oy - radius * Math.sin(a1)).toFixed(1) : "");
      const am = a0 - phi / 2;
      labelAngle.setAttribute("x", (ox + 92 * Math.cos(am)).toFixed(1));
      labelAngle.setAttribute("y", (oy - 92 * Math.sin(am) + 8).toFixed(1));
      labelAngle.setAttribute("visibility", Math.abs(phi) > 0.05 ? "visible" : "hidden");
      const put = (label, p, dx, dy) => {
        label.setAttribute("x", (p[0] + dx).toFixed(1));
        label.setAttribute("y", (p[1] + dy).toFixed(1));
      };
      // labels beside the arrows: E_0 on the side away from the sum, the sheet
      // arrow on the side away from the origin, the sum beyond its tip
      const side = (dx, dy, px, py, qx, qy) => {
        let nx = -dy, ny = dx;
        if (nx * (qx - px) + ny * (qy - py) > 0) { nx = -nx; ny = -ny; }
        return [nx, ny];
      };
      const dir = [(pInTip[0] - ox) / unit, (pInTip[1] - oy) / unit];
      const nIn = side(dir[0], dir[1], ox, oy, pSumTip[0], pSumTip[1]);
      put(labelIn, [ox + 0.5 * unit * dir[0], oy + 0.5 * unit * dir[1]], 22 * nIn[0] - 10, 22 * nIn[1] + 9);
      const sLen = Math.hypot(pSumTip[0] - pInTip[0], pSumTip[1] - pInTip[1]) || 1;
      const sDir = [(pSumTip[0] - pInTip[0]) / sLen, (pSumTip[1] - pInTip[1]) / sLen];
      const mid = [(pInTip[0] + pSumTip[0]) / 2, (pInTip[1] + pSumTip[1]) / 2];
      const nSheet = side(sDir[0], sDir[1], mid[0], mid[1], ox, oy);
      put(labelSheet, mid, 24 * nSheet[0] - 14, 24 * nSheet[1] + 9);
      const tLen = Math.hypot(pSumTip[0] - ox, pSumTip[1] - oy) || 1;
      put(labelSum, pSumTip, 34 * (pSumTip[0] - ox) / tLen - 30, 34 * (pSumTip[1] - oy) / tLen + 9);

      const lead = phi < 0 ? "опережает на " : "опаздывает на ";
      readout.textContent = "Сумма " + lead + fmt(deg(Math.abs(phi)), 1) + "°" +
        (phi < 0 ? ": выше резонанса заряды в противофазе" : "") +
        ". Амплитуда " + fmt(abs(t), 3) + "; назад уходит " + fmt(100 * abs(r) ** 2, 1) + "\u00a0% интенсивности.";
    }
    density.addEventListener("input", draw);
    ratio.addEventListener("input", draw);
    return {
      tick(dt) { theta = (theta + dt * twoPi / 3.2) % (2 * twoPi); draw(); },
      draw
    };
  }

  // ---------- step 4: many sheets ----------
  function stepStack(body) {
    const controls = node("div", {class: "origin-lab__controls"}, body);
    const count = slider(controls, "Число слоёв", 1, 48, 1, 32, v => String(v));
    const density = slider(controls, "Плотность", 0, 1, 0.01, 0.5, v => fmt(v, 2));
    const ratio = slider(controls, "Частота, \\(\\omega/\\omega_0\\)", 0.1, 0.8, 0.01, 0.6, v => fmt(v, 2));
    const svg = svgNode("svg", {viewBox: "0 0 1200 430", role: "img",
      "aria-label": "Волна в стопке слоёв зарядов и та же волна в вакууме"}, body);
    const readout = node("p", {class: "origin-lab__readout", "aria-live": "polite"}, body);

    const spacing = 1 / 16;        // in vacuum wavelengths
    const k = twoPi;
    const zLeft = -1.25, zRight = 4.25;
    const xLeft = 30, xRight = 1170;
    const X = z => xLeft + (xRight - xLeft) * (z - zLeft) / (zRight - zLeft);
    const y0 = 190, amp = 110;
    const medium = svgNode("rect", {class: "origin-lab__medium", y: 50, height: 280}, svg);
    svgNode("line", {class: "origin-lab__axis", x1: xLeft, y1: y0, x2: xRight, y2: y0}, svg);
    const vacuumWave = svgNode("path", {class: "origin-lab__trace-vacuum"}, svg);
    const wave = svgNode("path", {class: "origin-lab__trace-sum"}, svg);
    const springs = svgNode("path", {class: "origin-lab__spring origin-lab__spring--thin"}, svg);
    const balls = [];
    for (let j = 0; j < 48; j += 1) balls.push(svgNode("circle", {class: "origin-lab__charge", r: 6}, svg));
    legend(svg, [["origin-lab__trace-vacuum", "без вещества"], ["origin-lab__trace-sum", "в веществе"],
      ["origin-lab__charge", "заряды слоёв", true]], 40, 419, 380);

    let theta = 0;
    let solution = null;
    let state = "";
    function solve() {
      const m = Number(count.value);
      const u = Number(ratio.value);
      const chi = response(u, weakDamping);
      const beta = scale(chi, 0.2 * Number(density.value));
      const stack = solveStack(m, spacing, beta, k);
      // Bloch: cos(q a) = cos(k a) - beta sin(k a)
      const ka = k * spacing;
      const q = cacos(sub(cx(Math.cos(ka)), scale(beta, Math.sin(ka))));
      const single = div(cx(1), sub(cx(1), mul(cx(0, 1), beta)));
      solution = {m, chi, beta, stack, index: q.re / ka, epsilon: arg(single),
        linear: 1 + arg(single) / ka};
    }
    function draw() {
      const key = count.value + "|" + density.value + "|" + ratio.value;
      if (key !== state) { solve(); state = key; }
      const {m, chi, stack} = solution;
      const thickness = m * spacing;
      medium.setAttribute("x", X(0).toFixed(1));
      medium.setAttribute("width", (X(thickness) - X(0)).toFixed(1));
      const e = expi(-theta);
      const samples = 600;
      const pw = [], pv = [];
      for (let i = 0; i <= samples; i += 1) {
        const z = zLeft + (zRight - zLeft) * i / samples;
        pw.push([X(z), y0 - amp * mul(stack.field(z), e).re]);
        pv.push([X(z), y0 - amp * mul(expi(k * z), e).re]);
      }
      wave.setAttribute("d", points(pw));
      vacuumWave.setAttribute("d", points(pv));
      const unitChi = div(chi, cx(abs(chi)));
      let d = "";
      balls.forEach((ball, j) => {
        if (j >= m) { ball.setAttribute("visibility", "hidden"); return; }
        const z = j * spacing;
        const shift = 26 * mul(mul(stack.field(z), unitChi), e).re;
        const x = X(z);
        ball.removeAttribute("visibility");
        ball.setAttribute("cx", x.toFixed(1));
        ball.setAttribute("cy", (360 - shift).toFixed(1));
        d += "M" + x.toFixed(1) + " 330 L" + x.toFixed(1) + " " + (360 - shift - 6).toFixed(1) + " ";
      });
      springs.setAttribute("d", d);
      readout.innerHTML = "Опоздание за один слой ε = " + fmt(deg(solution.epsilon), 1) +
        "°, слоёв на длину волны 16: n − 1 ≈ ε/(ka) = " + fmt(solution.linear - 1, 3) +
        ". Точный расчёт с переотражениями: n = <span>" + fmt(solution.index, 3) + "</span>; отражается " +
        fmt(100 * abs(stack.reflected) ** 2, 1) + "\u00a0%.";
    }
    [count, density, ratio].forEach(input => input.addEventListener("input", draw));
    return {
      tick(dt) { theta = (theta + dt * twoPi / 3.2) % twoPi; draw(); },
      draw
    };
  }

  // ---------- step 5: time-domain simulation ----------
  // 1D Maxwell equations (c = 1, cell = 1) with Lorentz oscillators in a slab:
  // dE/dt = dH/dz - J, dH/dt = dE/dz, dJ/dt = -gamma J - w0^2 P + wp^2 E, dP/dt = J.
  function makeSimulation(cells, slab, options) {
    const E = new Float64Array(cells), H = new Float64Array(cells);
    const P = new Float64Array(cells), J = new Float64Array(cells);
    const dt = 0.5, mur = (dt - 1) / (dt + 1);
    let time = 0;
    const {omega, omega0, gamma, plasma, source, shape} = options;
    return {
      E, get time() { return time; },
      step() {
        const leftOld = E[1], rightOld = E[cells - 2];
        for (let i = 0; i < cells - 1; i += 1) H[i] += dt * (E[i + 1] - E[i]);
        if (slab) {
          for (let i = slab[0]; i < slab[1]; i += 1) {
            J[i] += dt * (-gamma * J[i] - omega0 * omega0 * P[i] + plasma * E[i]);
            P[i] += dt * J[i];
          }
        }
        const e0 = E[0], eN = E[cells - 1];
        for (let i = 1; i < cells - 1; i += 1) E[i] += dt * (H[i] - H[i - 1]) - dt * J[i];
        E[source] += dt * shape(time);
        E[0] = leftOld + mur * (E[1] - e0);
        E[cells - 1] = rightOld + mur * (E[cells - 2] - eN);
        time += dt;
      },
      omega
    };
  }

  function stepSimulation(body) {
    const controls = node("div", {class: "origin-lab__controls origin-lab__controls--buttons"}, body);
    const play = button(controls, "Пауза");
    const restart = button(controls, "Сначала");
    const steady = button(controls, "Установившаяся волна");
    const kind = button(controls, "Импульс");
    const split = button(controls, "Разложить поле");
    split.setAttribute("aria-pressed", "false");
    const speedWrap = node("label", {class: "origin-lab__speed"}, controls);
    speedWrap.innerHTML = "Скорость, периодов в секунду ";
    const speedShown = node("span", {}, speedWrap);
    const speed = node("input", {type: "range", min: 0.2, max: 3, step: 0.1, value: 0.8}, speedWrap);
    const showSpeed = () => { speedShown.textContent = fmt(Number(speed.value), 1); };
    speed.addEventListener("input", showSpeed);
    showSpeed();
    const svg = svgNode("svg", {viewBox: "0 0 1200 430", role: "img",
      "aria-label": "Численное решение: волна входит в слой вещества"}, body);
    const readout = node("p", {class: "origin-lab__readout", "aria-live": "polite"}, body);

    const cells = 960, slab = [360, 760], source = 60, lambda0 = 60;
    const omega = twoPi / lambda0, omega0 = omega / 0.6, index = 1.5;
    const plasma = (index * index - 1) * (omega0 * omega0 - omega * omega);
    const stepsPerPeriod = lambda0 / 0.5;
    const xLeft = 20, xRight = 1180, y0 = 210, amp = 85;
    const X = i => xLeft + (xRight - xLeft) * i / (cells - 1);
    svgNode("rect", {class: "origin-lab__medium", x: X(slab[0]), y: 40,
      width: X(slab[1]) - X(slab[0]), height: 320}, svg);
    svgNode("text", {x: (X(slab[0]) + X(slab[1])) / 2, y: 30, "text-anchor": "middle",
      text: "вещество: заряды на пружинках, n = 1.5"}, svg);
    svgNode("line", {class: "origin-lab__axis", x1: xLeft, y1: y0, x2: xRight, y2: y0}, svg);
    const front = svgNode("line", {class: "origin-lab__front", y1: 45, y2: 355}, svg);
    const frontLabel = svgNode("text", {class: "origin-lab__front-label", y: 380, "text-anchor": "middle",
      text: "фронт, скорость c"}, svg);
    const curveVacuum = svgNode("path", {class: "origin-lab__trace-vacuum"}, svg);
    const curveCharges = svgNode("path", {class: "origin-lab__trace-charge"}, svg);
    const curveTotal = svgNode("path", {class: "origin-lab__trace-sum"}, svg);
    const legendVacuum = svgNode("text", {x: 90, y: 422}, svg);
    svgNode("line", {class: "origin-lab__trace-vacuum", x1: 30, y1: 415, x2: 76, y2: 415}, svg);
    svgNode("line", {class: "origin-lab__trace-sum", x1: 420, y1: 415, x2: 466, y2: 415}, svg);
    svgNode("text", {x: 480, y: 422, text: "полное поле"}, svg);
    const legendCharges = svgNode("g", {}, svg);
    svgNode("line", {class: "origin-lab__trace-charge", x1: 800, y1: 415, x2: 846, y2: 415}, legendCharges);
    svgNode("text", {x: 860, y: 422, text: "поле зарядов"}, legendCharges);

    let pulse = false, playing = true, splitOn = false, medium1, vacuum, gain = 1, carry = 0;
    const shapeOf = () => {
      const period = twoPi / omega;
      return pulse ?
        t => Math.exp(-(((t - 2.2 * period) / (0.8 * period)) ** 2)) * Math.sin(omega * t) :
        t => (t < period ? 0.5 * (1 - Math.cos(Math.PI * t / period)) : 1) * Math.sin(omega * t);
    };
    function reset() {
      const options = {omega, omega0, gamma: 0.02 * omega0, plasma, source, shape: shapeOf()};
      medium1 = makeSimulation(cells, slab, options);
      vacuum = makeSimulation(cells, null, options);
      // amplitude of the free wave from this source, for the vertical scale
      const probe = makeSimulation(cells, null, {...options, shape: t => Math.sin(omega * t)});
      let peak = 0;
      for (let n = 0; n < 2400; n += 1) {
        probe.step();
        if (n > 1200) peak = Math.max(peak, Math.abs(probe.E[source + 120]));
      }
      gain = peak || 1;
      draw();
    }
    function advance(steps) {
      for (let n = 0; n < steps; n += 1) { medium1.step(); vacuum.step(); }
    }
    function draw() {
      const pTotal = [], pVac = [], pCharges = [];
      for (let i = 0; i < cells; i += 2) {
        const x = X(i);
        const total = medium1.E[i] / gain, free = vacuum.E[i] / gain;
        pTotal.push([x, y0 - amp * total]);
        pVac.push([x, y0 - amp * free]);
        pCharges.push([x, y0 - amp * (total - free)]);
      }
      curveTotal.setAttribute("d", points(pTotal));
      curveVacuum.setAttribute("d", points(pVac));
      curveCharges.setAttribute("d", points(pCharges));
      curveCharges.setAttribute("visibility", splitOn ? "visible" : "hidden");
      legendCharges.setAttribute("visibility", splitOn ? "visible" : "hidden");
      legendVacuum.textContent = splitOn ? "падающая волна" : "без вещества";
      const frontCell = source + medium1.time;
      const showFront = frontCell < cells - 10;
      front.setAttribute("visibility", showFront ? "visible" : "hidden");
      frontLabel.setAttribute("visibility", showFront ? "visible" : "hidden");
      front.setAttribute("x1", X(frontCell).toFixed(1));
      front.setAttribute("x2", X(frontCell).toFixed(1));
      frontLabel.setAttribute("x", Math.min(X(frontCell), xRight - 110).toFixed(1));
      const periods = medium1.time * omega / twoPi;
      readout.textContent = "Прошло " + fmt(periods, 1) + " периода. Внутри вещества длина волны " +
        "λ₀/n: гребни стоят в 1.5 раза теснее; частота та же." +
        (splitOn ? " Поле зарядов внутри гасит падающую волну и вместе с ней даёт медленную; слева оно же — отражённая волна." : "");
    }
    play.addEventListener("click", () => { playing = !playing; play.textContent = playing ? "Пауза" : "Пуск"; });
    restart.addEventListener("click", () => { reset(); playing = true; play.textContent = "Пауза"; });
    steady.addEventListener("click", () => {
      if (pulse) { pulse = false; kind.textContent = "Импульс"; reset(); }
      advance(40 * stepsPerPeriod);
      draw();
    });
    kind.addEventListener("click", () => {
      pulse = !pulse;
      kind.textContent = pulse ? "Синусоида" : "Импульс";
      reset();
    });
    split.addEventListener("click", () => {
      splitOn = !splitOn;
      split.setAttribute("aria-pressed", splitOn ? "true" : "false");
      draw();
    });
    reset();
    return {
      tick(dt) {
        if (!playing) return;
        carry += dt * Number(speed.value) * stepsPerPeriod;
        const steps = Math.floor(carry);
        carry -= steps;
        advance(steps);
        if (pulse && medium1.time > 3400) reset();
        draw();
      },
      draw
    };
  }

  // ---------- the lab ----------
  const STEPS = [
    {title: "Заряд на пружинке", build: stepOscillator},
    {title: "Поле слоя: от ускорения к скорости", build: stepZones},
    {title: "Волна за одним слоем", build: stepSheet,
      text: "Колебание — вращающаяся стрелка; высота её конца — поле в данный момент. Волна слоя " +
        "повёрнута к падающей на 90° и в \\(\\varepsilon\\) раз короче. Сумма почти той же длины, но " +
        "повёрнута на угол \\(\\varepsilon\\): " +
        "\\(E_0(\\cos\\varphi+\\varepsilon\\sin\\varphi)\\approx E_0\\cos(\\varphi-\\varepsilon)\\), " +
        "та же частота, фаза опоздала. Слой считается точно: \\(t=1/(1-i\\beta)\\), " +
        "\\(\\beta\\propto\\) плотность \\(\\times\\) отклик заряда."},
    {title: "Много слоёв", build: stepStack,
      text: "Каждый слой задерживает фазу на \\(\\varepsilon\\). Если слои стоят через \\(a\\), на пути \\(z\\) " +
        "набегает \\(\\varepsilon z/a\\) сверх вакуумного \\(kz\\). Число \\(n\\), при котором фаза внутри растёт " +
        "как \\(nkz\\), и есть показатель преломления: \\(n-1\\approx\\varepsilon/(ka)\\). Длина волны внутри " +
        "\\(\\lambda_0/n\\), частота прежняя. Расчёт точный: каждый слой раскачивается полным полем в своём " +
        "месте, с учётом переотражений."},
    {title: "Волна входит в стекло", build: stepSimulation,
      text: "Численное решение уравнений Максвелла для среды из зарядов на пружинках, \\(n=1.5\\). Фронт " +
        "входит в вещество со скоростью \\(c\\): заряды впереди ещё не раскачаны. За фронтом устанавливается " +
        "волна с длиной \\(\\lambda_0/n\\), часть света отражается. «Установившаяся волна» пропускает переходный " +
        "процесс; «Разложить поле» показывает, что падающая волна внутри бежит как в вакууме, а поле зарядов " +
        "гасит её и вместе с ней даёт медленную волну."}
  ];

  function initialize(root) {
    if (root.dataset.ready === "true") return;
    root.dataset.ready = "true";
    const single = root.hasAttribute("data-single");
    let current = Math.min(STEPS.length, Math.max(1, Number(root.dataset.step || 1))) - 1;
    const nav = single ? null : node("div", {class: "origin-lab__nav"}, root);
    let back, next, label;
    if (nav) {
      back = button(nav, "← Назад");
      label = node("span", {class: "origin-lab__step-title"}, nav);
      next = button(nav, "Дальше →");
    }
    const steps = STEPS.map((spec, i) => {
      if (single && i !== current) return null;
      const body = node("div", {class: "origin-lab__step"}, root);
      if (spec.text) node("p", {class: "origin-lab__text", html: spec.text}, body);
      const controller = spec.build(body);
      return {spec, body, controller, index: i};
    });

    function show(index) {
      current = index;
      steps.forEach(step => { if (step) step.body.hidden = step.index !== current; });
      if (nav) {
        label.textContent = "Шаг " + (current + 1) + " из " + STEPS.length + ". " + STEPS[current].title;
        back.disabled = current === 0;
        next.disabled = current === STEPS.length - 1;
      }
      steps[current].controller.draw();
    }
    if (nav) {
      back.addEventListener("click", () => show(Math.max(0, current - 1)));
      next.addEventListener("click", () => show(Math.min(STEPS.length - 1, current + 1)));
    }
    show(current);
    typeset(root);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = null;
    function frame(now) {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.25);
      last = now;
      const slide = root.closest(".reveal .slides section");
      const visible = !document.hidden && (!slide || slide.classList.contains("present"));
      if (visible && !reduced) steps[current].controller.tick(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // The physics, for checks from the console.
  window.refractionOriginPhysics = {solveStack, response, cacos, makeSimulation, makeOscillatorHistory, causalSheetPartial};

  function initializeAll() {
    document.querySelectorAll("[data-refraction-origin]").forEach(initialize);
  }
  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
