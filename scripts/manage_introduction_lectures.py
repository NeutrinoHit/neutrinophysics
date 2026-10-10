#!/usr/bin/env python3
"""Keep DN's unpublished Russian lectures out of the website build."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SLIDES = ROOT / "introduction/ru/slides"
PLANNED = SLIDES / "planned"
EXERCISES = ROOT / "introduction/ru/exercises"
MANIFEST = PLANNED / "lectures.json"
COURSE_INDEX = ROOT / "introduction/index.qmd"
SLIDES_INDEX = SLIDES / "index.qmd"


def rows(text: str, css_class: str) -> list[re.Match[str]]:
    pattern = rf'(?m)^[ \t]*<details class="{re.escape(css_class)}">.*?</details>[ \t]*\n'
    return list(re.finditer(pattern, text, re.DOTALL))


def row_for(text: str, css_class: str, filename: str) -> str:
    target = Path(filename).with_suffix(".html").name
    matches = [m.group() for m in rows(text, css_class) if target in m.group()]
    if len(matches) != 1:
        raise ValueError(f"Expected one catalogue row for {target}, found {len(matches)}")
    return matches[0]


def rebase(text: str, *, to_planned: bool, exercise: bool = False) -> str:
    if to_planned:
        text = text.replace("../../../", "../../../../")
        text = text.replace("../../_includes/", "../../../_includes/")
        text = re.sub(r"(?<![/\w.-])assets/", "../assets/", text)
        if exercise:
            text = text.replace("../slides/", "../../slides/planned/")
            text = text.replace("(index.html)", "(../index.html)")
    else:
        text = text.replace("../../../../", "../../../")
        text = text.replace("../../../_includes/", "../../_includes/")
        text = re.sub(r"(?<![/\w.-])\.\./assets/", "assets/", text)
        if exercise:
            text = text.replace("../../slides/planned/", "../slides/")
            text = text.replace("../../slides/", "../slides/")
            text = text.replace("(../index.html)", "(index.html)")
    return text


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def archive(numbers: list[int], map_root: Path | None) -> None:
    if MANIFEST.exists():
        raise ValueError("The planned catalogue already exists; archive has already run.")
    texts = {
        "course_row": COURSE_INDEX.read_text(encoding="utf-8"),
        "slides_row": SLIDES_INDEX.read_text(encoding="utf-8"),
    }
    if map_root:
        texts["map_row"] = (map_root / "ru/education.qmd").read_text(encoding="utf-8")
    records = {}
    moves = []
    for number in numbers:
        sources = list(SLIDES.glob(f"{number:02d}_*.qmd"))
        if len(sources) != 1:
            raise ValueError(f"Expected one source for lecture {number}, found {len(sources)}")
        source = sources[0]
        destination = PLANNED / source.name
        if destination.exists():
            raise ValueError(f"Destination exists: {destination}")
        record = {"filename": source.name}
        for key, text in texts.items():
            record[key] = row_for(
                text, "lecture-material" if key == "map_row" else "lecture-row", source.name
            )
        exercises = list(EXERCISES.glob(f"{number:02d}_*_exercises.qmd"))
        if exercises:
            record["exercises"] = [path.name for path in exercises]
        records[str(number)] = record
        moves.append((source, destination, False))
        moves.extend((path, EXERCISES / "planned" / path.name, True) for path in exercises)

    # Resolve all targets before changing source files.
    for source, destination, _ in moves:
        if destination.exists():
            raise ValueError(f"Destination exists: {destination}")
    PLANNED.mkdir(parents=True, exist_ok=True)
    for source, destination, exercise in moves:
        contents = rebase(source.read_text(encoding="utf-8"), to_planned=True, exercise=exercise)
        destination.parent.mkdir(parents=True, exist_ok=True)
        source.rename(destination)
        destination.write_text(contents, encoding="utf-8")
    for key, text in texts.items():
        for record in records.values():
            text = text.replace(record[key], "", 1)
        path = COURSE_INDEX if key == "course_row" else SLIDES_INDEX
        if key == "map_row":
            path = map_root / "ru/education.qmd"
        path.write_text(text, encoding="utf-8")
    MANIFEST.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Moved {len(records)} lectures to {PLANNED.relative_to(ROOT)}.")


def insert_row(text: str, row: str, number: int, css_class: str, map_page: bool) -> str:
    candidates = rows(text, css_class)
    if map_page:
        candidates = [
            m for m in candidates
            if "../neutrinophysics/introduction/ru/slides/" in m.group()
        ]
    if not candidates:
        raise ValueError("Cannot locate the published lecture catalogue.")
    for match in candidates:
        found = re.search(r'(?:lecture-index">|<summary>)(\d{2})', match.group())
        if found and int(found.group(1)) > number:
            return text[:match.start()] + row + text[match.start():]
    last = candidates[-1]
    return text[:last.end()] + row + text[last.end():]


def publish(number: int, map_root: Path | None) -> None:
    record = load_manifest().get(str(number))
    if record is None:
        raise ValueError(f"No planned lecture {number}.")
    source = PLANNED / record["filename"]
    destination = SLIDES / record["filename"]
    if not source.exists() or destination.exists():
        raise ValueError("Lecture must exist only in planned/ before publication.")
    edits = []
    for key, path in (("course_row", COURSE_INDEX), ("slides_row", SLIDES_INDEX)):
        text = path.read_text(encoding="utf-8")
        edits.append((path, insert_row(text, record[key], number, "lecture-row", False)))
    if map_root:
        path = map_root / "ru/education.qmd"
        text = insert_row(
            path.read_text(encoding="utf-8"), record["map_row"], number,
            "lecture-material", True
        )
        count = len(list(SLIDES.glob("[0-9][0-9]_*.qmd"))) + 1
        text = re.sub(r"Опубликовано \d+ лекций", f"Опубликовано {count} лекций", text)
        edits.append((path, text))
    if record.get("exercises"):
        path = EXERCISES / "index.qmd"
        text = path.read_text(encoding="utf-8")
        for filename in record["exercises"]:
            exercise = (EXERCISES / "planned" / filename).read_text(encoding="utf-8")
            include = re.search(r"\{\{< include .*?([^/ ]+-ru\.qmd) >\}\}", exercise)
            if include is None:
                raise ValueError(f"Cannot locate the exercise include in {filename}")
            line = "{{< include ../../_includes/exercises/" + include.group(1) + " >}}"
            if line not in text:
                text = text.rstrip() + "\n\n---\n\n" + line + "\n"
        edits.append((path, text))
    moves = [(source, destination, False)]
    for filename in record.get("exercises", []):
        moves.append((EXERCISES / "planned" / filename, EXERCISES / filename, True))
    for source, destination, _ in moves:
        if not source.exists() or destination.exists():
            raise ValueError(f"Cannot move {source} to {destination}")
    for source, destination, exercise in moves:
        contents = rebase(source.read_text(encoding="utf-8"), to_planned=False, exercise=exercise)
        source.rename(destination)
        destination.write_text(contents, encoding="utf-8")
    for path, text in edits:
        path.write_text(text, encoding="utf-8")
    print(f"Lecture {number:02d} returned to slides/ and added to the catalogues.")
    print("Review, render, then commit and push both repositories.")


def prune(dry_run: bool) -> None:
    """Remove only reproducible outputs of sources still stored in planned/."""
    output = ROOT / "_site"
    targets = []
    for source in sorted(PLANNED.glob("[0-9][0-9]_*.qmd")):
        targets.extend([
            output / "introduction/ru/slides" / (source.stem + ".html"),
            output / "introduction/ru/slides" / (source.stem + "_files"),
        ])
    for source in (EXERCISES / "planned").glob("*.qmd"):
        targets.extend([
            output / "introduction/ru/exercises" / (source.stem + ".html"),
            output / "introduction/ru/exercises" / (source.stem + "_files"),
        ])
    targets.extend([
        output / "introduction/ru/slides/planned",
        output / "introduction/ru/exercises/planned",
    ])
    blocked = {str(path.relative_to(output)) for path in targets if path.suffix == ".html"}
    for target in targets:
        if not target.exists():
            continue
        print(("Would remove " if dry_run else "Removing ") + str(target.relative_to(ROOT)))
        if not dry_run:
            if target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink()
    search = output / "search.json"
    if search.exists():
        records = json.loads(search.read_text(encoding="utf-8"))
        kept = [
            item for item in records
            if str(item.get("href", "")).split("#", 1)[0].lstrip("/") not in blocked
        ]
        if len(kept) != len(records):
            action = "Would remove" if dry_run else "Removing"
            print(f"{action} {len(records) - len(kept)} unpublished search entries.")
            if not dry_run:
                search.write_text(json.dumps(kept, ensure_ascii=False), encoding="utf-8")
    sitemap = output / "sitemap.xml"
    if sitemap.exists():
        text = sitemap.read_text(encoding="utf-8")
        text = re.sub(
            r"<url>.*?</url>",
            lambda m: "" if any("/" + path in m.group() for path in blocked) else m.group(),
            text, flags=re.DOTALL,
        )
        if not dry_run:
            sitemap.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    draft = commands.add_parser("archive")
    draft.add_argument("numbers", type=int, nargs="+")
    draft.add_argument("--map-root", type=Path)
    ready = commands.add_parser("publish")
    ready.add_argument("number", type=int)
    ready.add_argument("--map-root", type=Path)
    cleanup = commands.add_parser("prune")
    cleanup.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.command == "archive":
        archive(args.numbers, args.map_root)
    elif args.command == "publish":
        publish(args.number, args.map_root)
    else:
        prune(args.dry_run)


if __name__ == "__main__":
    main()
