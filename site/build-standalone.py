#!/usr/bin/env python3
"""Fold an engineer page into ONE self-contained .html file.

    python3 build-standalone.py yago-mann.html

Writes yago-mann.standalone.html beside it: markup, stylesheet, script, both
brand faces and every image inlined as data URIs. Nothing is fetched at
runtime except the Spotify player, which is a third-party embed and has to
stay a live iframe.

Why bother, when the folder already works: a single file has no paths to get
wrong. It renders identically opened from a URL, from a raw-file proxy, from
Dropbox, or by double-clicking it on a desktop — none of which agree about
what "/" means. That makes it the honest thing to hand someone who just wants
to look at the page.

The cost is weight. Base64 is 4 bytes per 3, so inlining inflates every asset
by a third, and the whole file must arrive before anything paints — where the
folder version streams and paints early. Fine for review, worse for a real
visitor. Deploy the folder; send the file.
"""

import base64
import mimetypes
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).parent


def datauri(path: pathlib.Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if path.suffix == ".woff2":
        mime = "font/woff2"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def build(page: pathlib.Path) -> pathlib.Path:
    html = page.read_text()
    css = (HERE / "engineer.css").read_text()
    js = (HERE / "engineer.js").read_text()

    # --- fonts. The stylesheet lists a .woff fallback for each face; only
    # TAYWingman actually ships one, and inlining both would carry the same
    # typeface twice. Modern browsers all take woff2, so inline that alone.
    for face in ("dwfairfield-webfont", "TAYWingman"):
        css = re.sub(
            r'url\("fonts/%s\.woff2"\) format\("woff2"\),\s*\n\s*url\("fonts/%s\.woff"\)\s*format\("woff"\)'
            % (re.escape(face), re.escape(face)),
            lambda m, f=face: 'url("%s") format("woff2")' % datauri(HERE / "fonts" / f"{f}.woff2"),
            css,
        )

    # --- images referenced from the stylesheet (the paper grain, and the
    # weathering plate if one is ever added). Skip any that isn't there.
    for ref in sorted(set(re.findall(r'url\("(assets/[^"]+)"\)', css))):
        f = HERE / ref
        if f.exists():
            css = css.replace(f'url("{ref}")', f'url("{datauri(f)}")')

    # --- images referenced from the markup. The lockup appears twice, top bar
    # and footer; inlined naively that is the same artwork carried twice in one
    # file, so it goes in a custom property and both <img> point at a 1x1
    # transparent GIF with the real thing painted behind.
    BLANK = ("data:image/gif;base64,"
             "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
    lockup = None
    for ref in sorted(set(re.findall(r'src="(assets/[^"]+)"', html))):
        f = HERE / ref
        if not f.exists():
            print(f"  ! missing {ref} — left as a relative path", file=sys.stderr)
            continue
        if html.count(f'src="{ref}"') > 1:
            lockup = datauri(f)
            html = html.replace(f'src="{ref}"', f'src="{BLANK}"')
        else:
            html = html.replace(f'src="{ref}"', f'src="{datauri(f)}"')

    # onerror fallbacks point at files that no longer exist relative to this
    # document. Every real asset is inlined above, so they can only fire on a
    # false alarm and swap a good image for a placeholder.
    html = re.sub(r'\s*onerror="[^"]*"', "", html)

    extra = ""
    if lockup:
        extra = (
            "\n/* standalone: the lockup, carried once and painted in both places */\n"
            ".topbar__logo img, .site-footer__logo img {\n"
            f"  background-image: url(\"{lockup}\");\n"
            "  background-size: contain;\n"
            "  background-repeat: no-repeat;\n"
            "  background-position: center;\n"
            "}\n"
        )

    html = html.replace(
        '  <link rel="stylesheet" href="engineer.css" />',
        f"  <style>\n{css}{extra}  </style>",
    )
    html = html.replace(
        '  <script src="engineer.js" defer></script>',
        f"  <script>\n{js}\n  </script>",
    )

    out = page.with_suffix(".standalone.html")
    out.write_text(html)
    return out


if __name__ == "__main__":
    src = HERE / (sys.argv[1] if len(sys.argv) > 1 else "yago-mann.html")
    out = build(src)
    print(f"{out.name}  {out.stat().st_size / 1024:.0f} KB")
