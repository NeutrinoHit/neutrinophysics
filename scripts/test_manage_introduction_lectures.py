"""Checks for manage_introduction_lectures.py on a temporary copy of the catalogues.

Run from the repository root:  python -m pytest scripts/test_manage_introduction_lectures.py
The map page is copied from a sibling neutrinohit-map checkout when present;
otherwise a minimal stand-in is used. Nothing outside the temporary tree is written.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import re
import shutil

import pytest

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
MAP_PAGE = REPO.parent / "neutrinohit-map/ru/education.qmd"

spec = importlib.util.spec_from_file_location("mil", HERE / "manage_introduction_lectures.py")
mil = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mil)


@pytest.fixture
def tree(tmp_path, monkeypatch):
    root = tmp_path / "repo"
    slides = root / "introduction/ru/slides"
    exercises = root / "introduction/ru/exercises"
    shutil.copytree(REPO / "introduction/ru/slides/planned", slides / "planned",
                    ignore=shutil.ignore_patterns("29_study"))
    for path in (REPO / "introduction/ru/slides").glob("*.qmd"):
        shutil.copy2(path, slides / path.name)
    shutil.copytree(REPO / "introduction/ru/exercises", exercises,
                    ignore=shutil.ignore_patterns("assets"))
    shutil.copy2(REPO / "introduction/index.qmd", root / "introduction/index.qmd")
    map_root = tmp_path / "map"
    (map_root / "ru").mkdir(parents=True)
    if MAP_PAGE.exists():
        shutil.copy2(MAP_PAGE, map_root / "ru/education.qmd")
    else:
        rows = "".join(
            json.loads((slides / "planned/lectures.json").read_text())[k]["map_row"]
            for k in ("16",)
        ).replace("16", "15")
        (map_root / "ru/education.qmd").write_text(
            "<p>Опубликовано 15 лекций.</p>\n" + rows, encoding="utf-8")
    for name, value in {
        "ROOT": root, "SLIDES": slides, "PLANNED": slides / "planned",
        "EXERCISES": exercises, "MANIFEST": slides / "planned/lectures.json",
        "COURSE_INDEX": root / "introduction/index.qmd", "SLIDES_INDEX": slides / "index.qmd",
    }.items():
        monkeypatch.setattr(mil, name, value)
    return root, map_root


def order(text: str, pattern: str) -> list[str]:
    return re.findall(pattern, text)


def map_order(text: str) -> list[str]:
    return [
        re.search(r"<summary>(\d{2}[a-z]?)\. ", m.group()).group(1)
        for m in mil.rows(text, "lecture-material")
        if "../neutrinophysics/introduction/ru/slides/" in m.group()
    ]


def test_keys_and_sorting():
    assert mil.lecture_key("29A") == "29a"
    assert mil.lecture_key("7") == "07"
    assert mil.manifest_key("07") == "7"
    with pytest.raises(Exception):
        mil.lecture_key("29ab")
    keys = ["30", "29c", "29", "29a", "16", "29b"]
    assert sorted(keys, key=lambda k: mil.sort_key(mil.lecture_key(k))) == [
        "16", "29", "29a", "29b", "29c", "30"]


def test_manifest_has_cycle():
    manifest = mil.load_manifest()
    assert "29" not in manifest
    for key in ("29a", "29b", "29c"):
        record = manifest[key]
        assert (mil.PLANNED / record["filename"]).exists()
        stem = Path(record["filename"]).stem
        for field in ("course_row", "slides_row", "map_row"):
            assert stem + ".html" in record[field]
    sources = [p.name.split("_", 1)[0] for p in mil.lecture_sources(mil.PLANNED)]
    assert sources.index("28") < sources.index("29a") < sources.index("29b") \
        < sources.index("29c") < sources.index("30")


def test_publish_order_and_archive_roundtrip(tree):
    root, map_root = tree
    page = map_root / "ru/education.qmd"
    count = int(re.search(r"Опубликовано (\d+) лекций", page.read_text()).group(1))
    # Publish out of order; rows must still come out sorted.
    for key in ("29b", "30", "29a", "29c", "28"):
        mil.publish(mil.lecture_key(key), map_root)
    course = (root / "introduction/index.qmd").read_text()
    index = order(course, r'lecture-index">(\d{2}[a-z]?)<')
    assert index[-5:] == ["28", "29a", "29b", "29c", "30"]
    slides_index = order(mil.SLIDES_INDEX.read_text(), r'lecture-index">(\d{2}[a-z]?)<')
    assert slides_index[-5:] == ["28", "29a", "29b", "29c", "30"]
    text = page.read_text()
    published = map_order(text)
    assert published[-5:] == ["28", "29a", "29b", "29c", "30"]
    assert f"Опубликовано {count + 5} лекций" in text
    published_file = mil.SLIDES / "29a_central_engine.qmd"
    assert "../../../shared/" in published_file.read_text()
    assert "../../../../shared/" not in published_file.read_text()

    # Archive requires an empty manifest slot; emulate a fresh archive run for 29a–c.
    saved = mil.MANIFEST.read_text()
    mil.MANIFEST.unlink()
    mil.archive([mil.lecture_key(k) for k in ("29c", "29a", "29b")], map_root)
    archived = json.loads(mil.MANIFEST.read_text())
    assert list(archived) == ["29a", "29b", "29c"]
    assert "../../../../shared/" in (mil.PLANNED / "29a_central_engine.qmd").read_text()
    after = map_order(page.read_text())
    assert "29a" not in after and after[-2:] == ["28", "30"]
    assert json.loads(saved)["29a"]["course_row"] == archived["29a"]["course_row"]


def test_prune_dry_run_lists_lettered_lectures(tree, capsys):
    root, _ = tree
    out = root / "_site/introduction/ru/slides"
    out.mkdir(parents=True)
    for stem in ("29a_central_engine", "15_matter_three_flavors"):
        (out / f"{stem}.html").write_text("x")
    mil.prune(dry_run=True)
    printed = capsys.readouterr().out
    assert "29a_central_engine.html" in printed
    assert "15_matter_three_flavors" not in printed
    assert (out / "29a_central_engine.html").exists()
    mil.prune(dry_run=False)
    assert not (out / "29a_central_engine.html").exists()
    assert (out / "15_matter_three_flavors.html").exists()
