#!/usr/bin/env python3
"""Rebuild the widget includes of the English mini-course from the shared English fragments.

The mini-course carries no widget code of its own: every wrapper below is the English fragment
of introduction/ru/slides/assets with the asset paths made relative to the mini-course slides,
and the stylesheets and scripts of the widgets are loaded from the same shared folder.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHARED = ROOT / "introduction/ru/slides/assets"
OUT = ROOT / "oscillations-minicourse/en/slides/assets/widgets"
UP = "../../../introduction/ru/slides/assets/"
LECTURE_UP = "../../ru/slides/assets/"  # paths inside the English fragments are relative to introduction/en/slides

V, M = "05_vacuum_oscillations/", "06_matter_oscillations/"
# wrapper -> (fragment, stylesheets, scripts); stylesheets and scripts are loaded by the wrapper itself
WRAPPERS = {
    "_two_flavor_lab.qmd": (V + "_two_flavor_lab.en.qmd", [], []),
    "_coupled_pendula.qmd": (V + "_coupled_pendula.en.qmd", [], []),
    "_quantum_chameleon.qmd": (V + "_quantum_chameleon.en.qmd", [], []),
    "_three_flavor_probabilities.qmd": (V + "_three_flavor_probabilities.en.qmd",
                                        [V + "three_flavor_probabilities.css"], [V + "three_flavor_probabilities.js"]),
    "_three_flavor_triangle_widget.qmd": (V + "_three_flavor_triangle_widget.en.qmd",
                                          [V + "three_flavor_triangle.css"], [V + "three_flavor_triangle.js"]),
    "_pmns_from_data.qmd": (V + "_pmns_from_data.en.qmd", [V + "pmns_from_data.css"], [V + "pmns_from_data.js"]),
    "_refraction_layers.qmd": (M + "_refraction_layers.en.qmd", [M + "refraction_labs.css"], [M + "refraction_labs.js"]),
    "_refraction_two_modes.qmd": (M + "_refraction_two_modes.en.qmd", [M + "refraction_labs.css"], [M + "refraction_labs.js"]),
}

# wrapper -> [(old, new)]: lines of a shared fragment that point to another lecture of the Russian course
EDITS = {
    "_pmns_from_data.qmd": [("Why the Sun singles out the second mass\n        column will be explained in the lecture on the MSW effect.",
                             "The Sun turns a \\(\\nu_e\\) into \\(\\nu_2\\):\n        the adiabatic MSW effect (appendix, \"Follow the twist\").")],
}

for name, (fragment, styles, scripts) in WRAPPERS.items():
    body = (SHARED / fragment).read_text(encoding="utf-8").replace(LECTURE_UP, UP)
    for old, new in EDITS.get(name, []):
        assert old in body, (name, old)
        body = body.replace(old, new)
    head = "".join(f'<link rel="stylesheet" href="{UP}{s}">\n' for s in styles)
    tail = "".join(f'<script defer src="{UP}{s}"></script>\n' for s in scripts)
    if body.startswith(("```{=html}\n", "~~~{=html}\n")):
        fence = body[:3]
        inner = body[len(fence) + len("{=html}\n"):].rstrip()
        assert inner.endswith(fence), name
        text = f"{fence}{{=html}}\n{head}{inner[:-3].rstrip()}\n{tail}{fence}\n"
    else:
        text = body
    (OUT / name).write_text(text, encoding="utf-8")
    print("wrote", name)
