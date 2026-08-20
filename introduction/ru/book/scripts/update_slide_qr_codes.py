"""Regenerate book QR codes that point to individual lecture slides."""

from __future__ import annotations

import re
from pathlib import Path

import qrcode
from PIL import Image


BOOK_DIR = Path(__file__).resolve().parents[1]
DIRECTIVE_RE = re.compile(r'url="([^"]+)"\s+qr="([^"]+)"')


def render_qr(url: str, output: Path) -> None:
    with Image.open(output) as current:
        target_size = current.size

    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=16,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    if image.size != target_size:
        image = image.resize(target_size, Image.Resampling.NEAREST)
    image.save(output)


def main() -> None:
    updated = 0
    for chapter in sorted((BOOK_DIR / "chapters").glob("*.qmd")):
        for url, qr_path in DIRECTIVE_RE.findall(chapter.read_text(encoding="utf-8")):
            if "/introduction/ru/slides/" not in url or "/slides/assets/" in url:
                continue
            output = (chapter.parent / qr_path).resolve()
            render_qr(url, output)
            print(f"{output.relative_to(BOOK_DIR)} -> {url}")
            updated += 1
    print(f"Updated {updated} slide QR codes")


if __name__ == "__main__":
    main()
