// Общие помощники графиков лекции 12: подписи в TeX внутри SVG и сетка осей.
// MathJax 2 набирает формулы в HTML, поэтому подпись лежит в foreignObject.
(() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const L12 = (window.L12 = window.L12 || {});

  const pending = new Set();
  function typeset(el) {
    const mj = window.MathJax;
    if (mj && mj.Hub && typeof mj.Hub.Queue === "function") {
      mj.Hub.Queue(["Typeset", mj.Hub, el]);
    } else if (mj && typeof mj.typesetPromise === "function") {
      mj.typesetPromise([el]).catch(() => {});
    } else {
      pending.add(el);
    }
  }
  window.addEventListener("load", () => {
    pending.forEach(typeset);
    pending.clear();
  });

  // Подпись с TeX. anchor: start | middle | end — к какому краю привязана точка (x, y).
  function label(layer, o) {
    const w = o.w || 120;
    const h = o.h || 32;
    const anchor = o.anchor || "middle";
    const fo = document.createElementNS(NS, "foreignObject");
    fo.setAttribute("width", w);
    fo.setAttribute("height", h);
    fo.style.overflow = "visible";
    const div = document.createElement("div");
    div.className = `l12-tex ${o.cls || ""}`.trim();
    div.style.justifyContent = anchor === "start" ? "flex-start" : anchor === "end" ? "flex-end" : "center";
    div.textContent = `\\(${o.tex}\\)`;
    fo.appendChild(div);
    layer.appendChild(fo);
    const api = {
      fo,
      move(x, y) {
        const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
        fo.setAttribute("x", x0.toFixed(1));
        fo.setAttribute("y", (y - h / 2).toFixed(1));
        if (o.rotate) fo.setAttribute("transform", `rotate(${o.rotate} ${x.toFixed(1)} ${y.toFixed(1)})`);
      },
      show(on) {
        fo.style.display = on ? "" : "none";
      }
    };
    if (o.x !== undefined) api.move(o.x, o.y);
    typeset(div);
    return api;
  }

  const tick = (v) => {
    const s = Number.isInteger(v) ? String(v) : String(+v.toFixed(2));
    return s.startsWith("-") ? `−${s.slice(1)}` : s;
  };

  // Поле графика: два слоя (перерисовываемый и статичный) и отображение координат.
  function plot(svg) {
    svg.innerHTML = '<g class="dyn"></g><g class="lab"></g>';
    const p = {
      svg,
      dyn: svg.querySelector(".dyn"),
      lab: svg.querySelector(".lab"),
      set(box) {
        const vb = svg.viewBox.baseVal;
        p.w = vb.width;
        p.h = vb.height;
        Object.assign(p, box);
      },
      x: (v) => p.left + (p.w - p.left - p.right) * (v - p.xmin) / (p.xmax - p.xmin),
      y: (v) => p.h - p.bottom - (p.h - p.top - p.bottom) * (v - p.ymin) / (p.ymax - p.ymin),
      frame(xTicks, yTicks, fmtY) {
        let html = "";
        yTicks.forEach((v) => {
          const y = p.y(v);
          html += `<line class="grid" x1="${p.left}" y1="${y}" x2="${p.w - p.right}" y2="${y}"/>`;
          html += `<text x="${p.left - 8}" y="${y + 4}" text-anchor="end">${fmtY ? fmtY(v) : tick(v)}</text>`;
        });
        xTicks.forEach((v) => {
          const x = p.x(v);
          html += `<line class="grid" x1="${x}" y1="${p.top}" x2="${x}" y2="${p.h - p.bottom}"/>`;
          html += `<text x="${x}" y="${p.h - p.bottom + 18}" text-anchor="middle">${tick(v)}</text>`;
        });
        html += `<line class="axis" x1="${p.left}" y1="${p.h - p.bottom}" x2="${p.w - p.right}" y2="${p.h - p.bottom}"/>`;
        html += `<line class="axis" x1="${p.left}" y1="${p.top}" x2="${p.left}" y2="${p.h - p.bottom}"/>`;
        return html;
      },
      path(points) {
        return points.map((q, i) => `${i ? "L" : "M"}${p.x(q[0]).toFixed(2)},${p.y(q[1]).toFixed(2)}`).join(" ");
      }
    };
    return p;
  }

  // Физика двух флэйворов в безразмерных единицах: A = V/Δ, x = L/L_vac.
  const model = {
    mix(theta, A) {
      const s2 = Math.sin(2 * theta);
      const c2 = Math.cos(2 * theta);
      const R = Math.hypot(c2 - A, s2);
      return { s2, c2, R, thetaM: 0.5 * Math.atan2(s2, c2 - A), amp: (s2 / R) ** 2 };
    },
    // Пропагатор слоя exp(-i π x M), M = [[A-c2, s2],[s2, c2-A]], M² = R². Возвращает 2×2 комплексную матрицу.
    layer(theta, A, x) {
      const { s2, c2, R } = model.mix(theta, A);
      const ph = Math.PI * R * x;
      const c = Math.cos(ph);
      const s = Math.sin(ph) / R;
      const m11 = A - c2;
      return [
        [[c, -s * m11], [0, -s * s2]],
        [[0, -s * s2], [c, s * m11]]
      ];
    }
  };

  Object.assign(L12, { NS, typeset, label, plot, model, tick });
})();
