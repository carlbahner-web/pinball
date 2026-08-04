#!/usr/bin/env python3
"""Build an engineer page from _template.html plus one JSON of content.

    python3 build-page.py engineers/yago-mann.json
    python3 build-page.py engineers/*.json

Writes <slug>.html beside the template, and the matching
<slug>.standalone.html if build-standalone.py is present.

WHY THIS EXISTS. The template and the live page used to be two hand-kept
copies of the same markup, and they drifted apart on nearly every change:
a fix would land in one and be forgotten in the other. The page is an
OUTPUT now. Do not edit the generated .html — edit the template or the
JSON and rebuild, or your change disappears at the next build.

WHAT A NEW ENGINEER NEEDS. Copy any file in engineers/, change the values:

    slug              file name, no extension: "someone-else"
    name              "Someone Else"
    first_name        used in the questions heading
    role              "Producer, Mixer"
    photo             path to the hero image, or a source image to convert
    photo_alt         what is happening in the picture, for screen readers
    bio               list of paragraphs, plain text
    questions         list of {q, a}; numbering is added here, not written
    spotify_playlist  the id after /playlist/ in the Spotify url, or ""
    website / instagram / email

Write the copy as plain prose with real apostrophes and dashes. Escaping
and entity conversion happen here, so the JSON stays readable.
"""

import html
import json
import pathlib
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).parent
TEMPLATE = HERE / "_template.html"

# Typographic substitutions applied to prose. Straight quotes become curly and
# " - " becomes an en dash, so the copy can be typed naturally.
SMART = [
    (r'(\w)\'(\w)', '\\1\u2019\\2'),      # don't
    (r'(?<=\s)"([^"]+)"', '\u201c\\1\u201d'),
    (r'\s+-\s+', ' \u2013 '),
    (r'\.\.\.', '\u2026'),
]


def prose(text: str) -> str:
    """Escape for HTML, then apply the typographic niceties."""
    out = html.escape(text, quote=False)
    for pat, rep in SMART:
        out = re.sub(pat, rep, out)
    return out


def build(data_path: pathlib.Path) -> pathlib.Path:
    d = json.loads(data_path.read_text())
    for key in ("slug", "name", "role", "photo", "bio", "questions"):
        if not d.get(key):
            raise SystemExit(f"{data_path.name}: missing required field '{key}'")

    photo = HERE / d["photo"]
    if not photo.exists():
        raise SystemExit(f"{data_path.name}: photo not found: {d['photo']}")
    # The width/height attributes are an aspect-ratio hint: the browser uses
    # them to reserve the right space before the image arrives. A wrong pair
    # makes the page jump, so these are read from the file, never guessed.
    if photo.suffix.lower() == ".svg":
        head = photo.read_text(errors="ignore")[:2000]
        m = re.search(r'viewBox="[\d.\s]*?([\d.]+)[\s,]+([\d.]+)"', head)
        if not m:
            m = re.search(r'width="([\d.]+)"[^>]*height="([\d.]+)"', head)
        if not m:
            raise SystemExit(f"{d['photo']}: cannot find a viewBox or width/height in the SVG")
        w, h = (round(float(m.group(1))), round(float(m.group(2))))
    else:
        try:
            from PIL import Image
        except ImportError:
            raise SystemExit("Pillow is needed to read image dimensions: pip install pillow")
        try:
            w, h = Image.open(photo).size
        except Exception as e:
            raise SystemExit(f"{d['photo']}: cannot read image dimensions ({e})")

    first = d.get("first_name") or d["name"].split()[0]
    n = len(d["questions"])
    words = {2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven"}
    heading = (f'<h2>Get to know {prose(first)}<br />'
               f'in {words.get(n, n)} questions:</h2>')

    bio = "\n\n".join(
        f"          <p>{prose(p)}</p>" for p in d["bio"]
    )
    qa = "\n\n".join(
        f"          <dt>{i}. {prose(q['q'])}</dt>\n"
        f"          <dd>{prose(q['a'])}</dd>"
        for i, q in enumerate(d["questions"], 1)
    )

    out = TEMPLATE.read_text()
    # strip the template's own banner; it is advice for whoever edits it
    out = re.sub(r'<!-- =+\n     TEMPLATE.*?=+ -->\n', '', out, flags=re.S)

    for token, value in {
        "NAME": html.escape(d["name"]),
        "ROLE": html.escape(d["role"]),
        "ROLE_LOWER": html.escape(d["role"].lower()),
        "PHOTO": d["photo"],
        "PHOTO_ALT": html.escape(d.get("photo_alt") or d["name"]),
        "PHOTO_W": str(w),
        "PHOTO_H": str(h),
        "QA_HEADING": heading,
        "BIO": bio,
        "QUESTIONS": qa,
        "PLAYLIST": d.get("spotify_playlist") or "",
        "WEBSITE": d.get("website") or "#",
        "INSTAGRAM": d.get("instagram") or "#",
        "EMAIL": d.get("email") or "",
    }.items():
        out = out.replace("{{%s}}" % token, value)

    left = re.findall(r"\{\{(\w+)\}\}", out)
    if left:
        raise SystemExit(f"template has placeholders nothing filled: {sorted(set(left))}")

    page = HERE / f"{d['slug']}.html"
    page.write_text(out)
    return page


if __name__ == "__main__":
    args = sys.argv[1:] or ["engineers/yago-mann.json"]
    for a in args:
        page = build(HERE / a if not pathlib.Path(a).is_absolute() else pathlib.Path(a))
        print(f"{page.name}  {page.stat().st_size / 1024:.0f} KB")
        if (HERE / "build-standalone.py").exists():
            subprocess.run([sys.executable, "build-standalone.py", page.name],
                           cwd=HERE, check=True)
