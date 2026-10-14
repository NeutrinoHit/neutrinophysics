"""Regenerate every QR code of the book with the shared NeutrinoHit generator.

Each `.animation` or `.interactive` block with `url` and `qr` in a chapter of
_quarto.yml gets the standard book code (rounded modules, ECC H, quiet border 4,
globe logo at 0.32) from neutrinohit-map/scripts/generate_qrcode.py. The code
encodes exactly the block's `url`: animation pages /qr/neutrino-physics/<id>/,
applets and slides alike. One file must not be declared with two addresses.
A long address (an applet, a slide or a raw video) hides the central alignment
pattern under the logo; such a code gets the smaller logo of build_robust_qr.

  python scripts/update_slide_qr_codes.py          # regenerate all codes
  python scripts/update_slide_qr_codes.py --check  # only decode them (zbarimg) and compare with url
"""

from __future__ import annotations

import argparse
import importlib.util
import re
import shutil
import subprocess
import sys
from pathlib import Path


BOOK_DIR = Path(__file__).resolve().parents[1]
GENERATOR = BOOK_DIR.parents[3] / "neutrinohit-map" / "scripts" / "generate_qrcode.py"
CHAPTER_RE = re.compile(r"^\s*-\s+(chapters/[^\s]+\.qmd)\s*$", re.M)
BLOCK_RE = re.compile(r"^:::+\s*\{([^}]*)\}", re.M)
SIDE_PX = 1200  # 0.25 of the text width is about 35 mm: 1200 px is above 600 dpi


def load_generator():
    if not GENERATOR.is_file():
        raise SystemExit(f"Shared generator not found: {GENERATOR}")
    spec = importlib.util.spec_from_file_location("generate_qrcode", GENERATOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def declarations() -> dict[Path, tuple[str, list[str]]]:
    """{qr file: (url, [chapter:line, ...])} over the chapters of the book."""
    found: dict[Path, tuple[str, list[str]]] = {}
    conflicts = []
    chapters = CHAPTER_RE.findall((BOOK_DIR / "_quarto.yml").read_text(encoding="utf-8"))
    for name in chapters:
        chapter = BOOK_DIR / name
        text = chapter.read_text(encoding="utf-8")
        for match in BLOCK_RE.finditer(text):
            attrs = match.group(1)
            url = re.search(r'\burl="([^"]+)"', attrs)
            qr = re.search(r'\bqr="([^"]+)"', attrs)
            if not (url and qr):
                continue
            where = f"{name}:{text.count(chr(10), 0, match.start()) + 1}"
            path = (chapter.parent / qr.group(1)).resolve()
            if path in found and found[path][0] != url.group(1):
                conflicts.append(f"{path.relative_to(BOOK_DIR)}: {found[path][0]} ({found[path][1][0]}) "
                                 f"vs {url.group(1)} ({where})")
                continue
            found.setdefault(path, (url.group(1), []))[1].append(where)
    if conflicts:
        raise SystemExit("One QR file, two addresses:\n  " + "\n  ".join(conflicts))
    return found


def decode(path: Path) -> str:
    result = subprocess.run(["zbarimg", "-q", "--raw", str(path)], capture_output=True, text=True)
    return result.stdout.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--check", action="store_true", help="decode the codes and compare with url, do not write")
    args = parser.parse_args()

    found = declarations()
    if not args.check:
        generator = load_generator()
        reduced = []
        for path, (url, _) in sorted(found.items()):
            image, scale = generator.build_robust_qr(url, side_px=SIDE_PX)
            path.parent.mkdir(parents=True, exist_ok=True)
            image.convert("L").save(path, "PNG", dpi=(600, 600), optimize=True)
            print(f"{path.relative_to(BOOK_DIR)} -> {url}")
            if scale != generator.DEFAULT_SCALE:
                reduced.append(path.relative_to(BOOK_DIR))
        print(f"Wrote {len(found)} QR codes; {len(reduced)} long address(es) with a reduced logo")

    if not shutil.which("zbarimg"):
        print("zbarimg not found (brew install zbar): codes are not checked", file=sys.stderr)
        return 0 if not args.check else 2
    failures = 0
    for path, (url, places) in sorted(found.items()):
        got = decode(path) if path.is_file() else "missing"
        if got != url:
            failures += 1
            print(f"WRONG {path.relative_to(BOOK_DIR)} ({', '.join(places)}): {got or 'not decoded'} != {url}")
    print(f"Checked {len(found)} QR codes: {'all match url' if not failures else f'{failures} problem(s)'}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
