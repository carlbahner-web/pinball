#!/usr/bin/env bash
# Mirror the live brand assets into this folder so the page renders fully
# offline. Optional — on the real site these paths already resolve.
#
#   ./fetch-assets.sh
#
# Everything lands under site/assets and site/fonts, matching the root-relative
# paths the page uses. The downloads are gitignored; the repo keeps only the
# placeholders.

set -euo pipefail

BASE="${STUDIOLAND_BASE:-https://welcometostudioland.netlify.app}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$HERE/assets" "$HERE/fonts"

get() {  # get <remote-path> <local-path>
  if curl -fsS -o "$HERE/$2" "$BASE/$1"; then
    echo "  ok    $2"
  else
    echo "  FAIL  $2  ($BASE/$1)" >&2
  fi
}

echo "Fetching from $BASE"

# Images
get "assets/studioland_mgmt_1.png"    "assets/studioland_mgmt_1.png"
get "assets/Buzz%20The%20Mascot5.png" "assets/Buzz The Mascot5.png"

# Paper grain — the page uses the first; the others are alternate cuts
get "assets/website-noise.webp"   "assets/website-noise.webp"
get "assets/website-noise-2.webp" "assets/website-noise-2.webp"
get "assets/website-noise-3.webp" "assets/website-noise-3.webp"

# The two brand faces
get "fonts/dwfairfield-webfont.woff2" "fonts/dwfairfield-webfont.woff2"
get "fonts/dwfairfield-webfont.woff"  "fonts/dwfairfield-webfont.woff"
get "fonts/TAYWingman.woff2"          "fonts/TAYWingman.woff2"
get "fonts/TAYWingman.woff"           "fonts/TAYWingman.woff"

echo "Done. Serve this folder as the web root:  python3 -m http.server 8000"
