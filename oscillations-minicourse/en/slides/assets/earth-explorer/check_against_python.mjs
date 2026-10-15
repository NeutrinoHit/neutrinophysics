// Compare the browser calculation with assets/oscillations/osc.py:  node check_against_python.mjs <python-json>
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("./earth_explorer.js");
const ref = JSON.parse(readFileSync(process.argv[2], "utf8"));
let worst = 0;
for (const c of ref) {
  const layers = E.pathLayers(c.cosz, 80, c.ye, E.YE_MANTLE);
  c.E.forEach((en, i) => {
    const P = E.probabilityMatrix(en, layers, E.NUFIT61[c.ord], c.anti);
    worst = Math.max(worst, Math.abs(P[1][0] - c.Pme[i]), Math.abs(P[1][1] - c.Pmm[i]), Math.abs(P[0][0] - c.Pee[i]));
  });
}
console.log("max |P_js - P_py| =", worst.toExponential(2));
if (worst > 1e-6) process.exit(1);
