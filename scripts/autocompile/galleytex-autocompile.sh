#!/bin/sh
# GalleyTeX · macOS/Linux 本机自动编译：监视一个文件夹，*-LaTeX-Project*.zip 落地即用 XeLaTeX 编译并打开 PDF。
#   ./galleytex-autocompile.sh [watch-dir]          默认监视 ~/Downloads
#   ./galleytex-autocompile.sh some-LaTeX-Project.zip   只编译这一个
# 需要 xelatex（TeX Live / MacTeX）；有 latexmk 更好。
set -u
WATCH="${1:-$HOME/Downloads}"
BUILD_ROOT="${TMPDIR:-/tmp}/galleytex-build"
mkdir -p "$BUILD_ROOT"
open_file() { if command -v xdg-open >/dev/null 2>&1; then xdg-open "$1" >/dev/null 2>&1 & elif command -v open >/dev/null 2>&1; then open "$1"; fi; }
compile_zip() {
  zip="$1"; name=$(basename "$zip" .zip | sed 's/-LaTeX-Project.*$//'); ascii=$(printf '%s' "$name" | tr -c 'A-Za-z0-9_-' '_')
  dir="$BUILD_ROOT/$(date +%Y%m%d-%H%M%S)-$ascii"; mkdir -p "$dir"
  echo "==> $zip"; unzip -q -o "$zip" -d "$dir" || { echo "    解压失败"; return; }
  [ -f "$dir/main.tex" ] || { echo "    ZIP 里没有 main.tex，跳过"; return; }
  ( cd "$dir" && if command -v latexmk >/dev/null 2>&1; then latexmk -xelatex -interaction=nonstopmode -file-line-error main.tex >/dev/null 2>&1; else xelatex -interaction=nonstopmode -file-line-error main.tex >/dev/null 2>&1 && xelatex -interaction=nonstopmode main.tex >/dev/null 2>&1; fi )
  if grep -q '^!' "$dir/main.log" 2>/dev/null || [ ! -f "$dir/main.pdf" ]; then
    echo "    编译出错："; grep -m 8 -E '^(!|main\.tex:[0-9]+:)' "$dir/main.log"; cp "$dir/main.log" "$(dirname "$zip")/$name-编译日志.log"; echo "    完整日志：$(dirname "$zip")/$name-编译日志.log"; return
  fi
  pages=$(grep "Output written on main\.\(pdf\|xdv\)" "$dir/main.log" | tail -1 | sed "s/[^0-9]*\([0-9]*\) page.*/\1/")
  out="$(dirname "$zip")/$name.pdf"; cp "$dir/main.pdf" "$out"; echo "    完成：$pages 页 → $out（工程目录 $dir）"; open_file "$out"
}
command -v xelatex >/dev/null 2>&1 || { echo "没有找到 xelatex，请先安装 TeX Live / MacTeX。"; exit 1; }
case "$WATCH" in *.zip) compile_zip "$WATCH"; exit 0;; esac
[ -d "$WATCH" ] || { echo "目录不存在：$WATCH"; exit 1; }
echo "正在监视 $WATCH（Ctrl+C 退出）"; seen=""
while :; do
  for f in "$WATCH"/*-LaTeX-Project*.zip; do
    [ -f "$f" ] || continue
    stamp=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f"); key="$f@$stamp"
    case "$seen" in *"|$key|"*) continue;; esac
    sleep 2; stamp2=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f"); [ "$stamp" = "$stamp2" ] || continue
    seen="$seen|$key|"; compile_zip "$f"; echo "继续监视中…"
  done
  sleep 2
done
