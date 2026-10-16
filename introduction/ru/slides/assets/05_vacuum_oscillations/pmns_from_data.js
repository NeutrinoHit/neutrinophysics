(() => {
  "use strict";

  const checks = [
    "Сначала заполним измеренные доли, затем используем унитарность.",
    "Солнце задаёт одну клетку электронной строки.",
    "Строка e: 2/3 + 1/3 + 0 = 1.",
    "Атмосферные данные выделяют клетку μ3.",
    "Столбец 3: 0 + 1/2 + 1/2 = 1.",
    "Столбец 2: 1/3 + 1/3 + 1/3 = 1; ортогональность связала модули.",
    "Каждая строка и каждый столбец даёт единицу.",
    "Квадратный корень даёт модуль амплитуды, но ещё не её знак.",
    "Столбцы 2 и 3 ортогональны: c₂ · c₃ = 0.",
    "Теперь c₁ · c₂ = c₁ · c₃ = 0 и U₀ᵀU₀ = I.",
    "Современные значения рассчитаны внутри унитарной модели; округление даёт суммы около 1."
  ];

  function initialize(root) {
    if (root.dataset.pmnsReady === "true") return;
    root.dataset.pmnsReady = "true";

    const contents = [...root.querySelectorAll("[data-step-content]")];
    const cells = [...root.querySelectorAll("[data-cell]")];
    const previous = root.querySelector("[data-step-back]");
    const next = root.querySelector("[data-step-next]");
    const counter = root.querySelector("[data-step-counter]");
    const check = root.querySelector("[data-step-check]");
    const titles = [...root.querySelectorAll("[data-matrix-title]")];
    let step = 0;

    function draw() {
      const modern = step === 10;
      const active = contents[step];

      contents.forEach((section, index) => {
        section.hidden = index !== step;
      });
      cells.forEach(cell => {
        const first = Number(cell.dataset.first);
        cell.classList.toggle("is-filled", modern || step >= first);
        const column = cell.dataset.cell.slice(-1);
        const newlySigned = (step === 8 && (column === "2" || column === "3"))
          || (step === 9 && column === "1");
        cell.classList.toggle("is-new", modern || step === first || newlySigned);
      });
      root.classList.toggle("is-roots", step === 7);
      root.classList.toggle("is-partial", step === 8);
      root.classList.toggle("is-signed", step === 9);
      root.classList.toggle("is-modern", modern);
      titles.forEach(title => {
        const kind = title.dataset.matrixTitle;
        title.hidden = kind !== (step === 7 ? "roots" :
          step === 8 ? "partial" : step === 9 ? "signed" : "squares");
      });
      counter.textContent = `Шаг ${step} из 10`;
      check.textContent = checks[step];
      previous.disabled = step === 0;
      next.disabled = step === 10;

      const panel = root.querySelector(".pmns-from-data__matrix-panel");
      if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([active, panel]).catch(() => {});
      } else if (window.MathJax?.Hub) {
        const hub = window.MathJax.Hub;
        hub.Queue(["Typeset", hub, active], ["Typeset", hub, panel]);
      }
    }

    previous.addEventListener("click", () => {
      step = Math.max(0, step - 1);
      draw();
    });
    next.addEventListener("click", () => {
      step = Math.min(10, step + 1);
      draw();
    });
    root.addEventListener("keydown", event => {
      if (event.key === "ArrowRight" && step < 10) {
        event.preventDefault();
        event.stopPropagation();
        step += 1;
        draw();
      } else if (event.key === "ArrowLeft" && step > 0) {
        event.preventDefault();
        event.stopPropagation();
        step -= 1;
        draw();
      }
    });

    draw();
  }

  function initializeAll() {
    document.querySelectorAll("[data-pmns-from-data]").forEach(initialize);
  }

  initializeAll();
  document.addEventListener("DOMContentLoaded", initializeAll, {once: true});
})();
