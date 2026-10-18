// Lecture 13: typeset the axis labels of the adiabatic lab.
// The plots are drawn by matter_oscillations.js; this file only rewrites the
// plain-text labels each time a plot is redrawn.
(() => {
  "use strict";

  const it = (s) => `<tspan font-style="italic">${s}</tspan>`;

  // Axis labels; the legends are hidden by lecture13.css and repeated in the captions.
  const LABELS = {
    "s = x / X": `${it("s")} = ${it("x")}/${it("X")}`,
    "s": it("s"),
    "λ / Δ": `${it("λ")}/Δ`
  };

  function relabel(svg) {
    svg.querySelectorAll("text").forEach((node) => {
      const html = LABELS[node.textContent];
      if (html !== undefined) node.innerHTML = html;
    });
  }

  function init() {
    const root = document.getElementById("matter-adiabatic-lab");
    if (!root || root.dataset.labels === "1") return;
    root.dataset.labels = "1";
    root.querySelectorAll("svg[data-plot]").forEach((svg) => {
      relabel(svg);
      new MutationObserver(() => relabel(svg)).observe(svg, { childList: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
