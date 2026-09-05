#!/usr/bin/env bash
# Paperlogy TTF(680KB×3, 힌팅 포함) → 라틴/한글 woff2 서브셋. 재실행 가능.
# 요구: python fontTools + brotli (pip install fonttools brotli).
# 결과는 globals.css의 @font-face unicode-range와 짝을 이룬다.
set -euo pipefail
cd "$(dirname "$0")/../public/fonts"

LATIN="U+0000-024F,U+0300-036F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+25A0-25FF,U+2600-26FF,U+FB00-FB4F"
HANGUL="U+1100-11FF,U+3000-303F,U+3130-318F,U+AC00-D7A3,U+FF00-FFEF"

for w in 4Regular 6SemiBold 7Bold; do
  src="Paperlogy-$w.ttf"
  [ -f "$src" ] || { echo "missing $src (원본 TTF는 git history c4c3593 에서 복구)"; exit 1; }
  python -m fontTools.subset "$src" --unicodes="$LATIN"  --flavor=woff2 --no-hinting --desubroutinize --layout-features='*' --output-file="Paperlogy-$w-latin.woff2"
  python -m fontTools.subset "$src" --unicodes="$HANGUL" --flavor=woff2 --no-hinting --desubroutinize --layout-features='*' --output-file="Paperlogy-$w-hangul.woff2"
done

ls -la Paperlogy-*
