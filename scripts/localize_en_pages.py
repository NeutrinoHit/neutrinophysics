#!/usr/bin/env python3
"""Post-render script: give English pages an English site title and navbar.

The site-wide title and navbar in _quarto.yml are Russian and Quarto cannot override them
per directory, so every rendered page with <html lang="en"> is patched after rendering.
"""
import os
import re
from pathlib import Path

ROOT = Path(os.environ.get("QUARTO_PROJECT_DIR") or Path.cwd())
OUT = ROOT / (os.environ.get("QUARTO_PROJECT_OUTPUT_DIR") or "_site")

SITE = ("Физика нейтрино", "Neutrino Physics")
MENU = {
    "Физика нейтрино": "Neutrino Physics",
    "Введение": "Introduction",
    "Апплеты": "Applets (in Russian)",
    "Все лекции": "All lectures",
}
HREF = {
    "introduction/index.html": "introduction/en/index.html",
    "https://neutrinohit.github.io/lectures.html": "https://neutrinohit.github.io/en/education.html",
}


def patch(text: str) -> str:
    if not re.search(r"<html[^>]*\blang=\"en", text):
        return text
    text = re.sub(r"<title>[^<]*</title>", lambda m: m.group(0).replace(*SITE), text, count=1)
    text = text.replace(f'<span class="navbar-title">{SITE[0]}</span>', f'<span class="navbar-title">{SITE[1]}</span>')

    def item(m):
        href, label = m.group(1), m.group(2)
        for old, new in HREF.items():
            if href.endswith(old):
                href = href[: len(href) - len(old)] + new
        return f'<a class="nav-link" href="{href}"> \n<span class="menu-text">{MENU.get(label, label)}</span></a>'

    return re.sub(r'<a class="nav-link" href="([^"]*)"> \n<span class="menu-text">([^<]*)</span></a>', item, text)


def targets():
    listed = os.environ.get("QUARTO_PROJECT_OUTPUT_FILES")
    if listed:
        for line in listed.splitlines():
            p = Path(line.strip())
            p = p if p.is_absolute() else ROOT / p
            if p.suffix == ".html" and p.exists():
                yield p
    else:
        yield from OUT.rglob("*.html")


for page in targets():
    old = page.read_text(encoding="utf-8")
    new = patch(old)
    if new != old:
        page.write_text(new, encoding="utf-8")
