#!/bin/zsh
# Capture ODIN at exact device sizes with headless Chrome (GPU via ANGLE/Metal).
# Usage: scripts/capture.sh <out-dir> [url-query]
# Requires the dev server on :5173.
set -e
OUT=${1:-captures}
QUERY=${2:-nointro}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT"
typeset -A SIZES
SIZES=(
  desktop-1920x1080 "1920,1080"
  laptop-1440x900 "1440,900"
  tablet-portrait-820x1180 "820,1180"
  tablet-landscape-1180x820 "1180,820"
  phone-390x844 "390,844"
  phone-landscape-844x390 "844,390"
  ultrawide-2560x1080 "2560,1080"
)
for name size in ${(kv)SIZES}; do
  "$CHROME" --headless=new --use-angle=metal --enable-gpu-rasterization --ignore-gpu-blocklist \
    --hide-scrollbars --force-device-scale-factor=1 --window-size="$size" \
    --virtual-time-budget=14000 --screenshot="$OUT/$name.png" "http://localhost:5173/?$QUERY" >/dev/null 2>&1 || true
  echo "$OUT/$name.png"
done
