"""Reference probabilities from osc.py for check_against_python.mjs (writes JSON to stdout)."""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "oscillations"))
import osc  # noqa: E402

cases = []
E = np.geomspace(1, 20, 25)
for cosz, ye, ordering, anti in ((-1.0, osc.YE_CORE, "NO", False), (-0.9, 0.48, "NO", True), (-0.6, osc.YE_CORE, "IO", False), (-0.2, osc.YE_CORE, "NO", False)):
    P = osc.probability_layers(E, osc.path_layers(cosz, 80, ye_core=ye), osc.NUFIT61[ordering], anti)
    cases.append({"cosz": cosz, "ye": ye, "ord": ordering, "anti": anti, "E": E.tolist(),
                  "Pme": P[:, 1, 0].tolist(), "Pmm": P[:, 1, 1].tolist(), "Pee": P[:, 0, 0].tolist()})
json.dump(cases, sys.stdout)
