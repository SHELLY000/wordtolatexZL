#!/bin/sh
# GalleyTeX · macOS/Linux 本机编译。仅编译自己导出或来源可信的 ZIP。
#   ./galleytex-autocompile.sh watch-dir              监视指定目录，逐个确认 ZIP
#   ./galleytex-autocompile.sh some-LaTeX-Project.zip  编译明确指定的可信 ZIP
# 需要 xelatex（TeX Live / MacTeX）；有 latexmk 更好。
set -u
if [ "$#" -ne 1 ]; then
  echo "用法：$0 <可信的项目 ZIP 或要监视的目录>" >&2
  exit 1
fi
WATCH=$1
BUILD_ROOT="${TMPDIR:-/tmp}/galleytex-build"
mkdir -p "$BUILD_ROOT" || exit 1
open_file() { if command -v xdg-open >/dev/null 2>&1; then xdg-open "$1" >/dev/null 2>&1 & elif command -v open >/dev/null 2>&1; then open "$1"; fi; }
compile_zip() {
  zip="$1"
  name=$(basename "$zip" .zip | sed 's/-LaTeX-Project.*$//')
  dir=$(mktemp -d "$BUILD_ROOT/project.XXXXXXXX") || return 1
  echo "==> $zip"; unzip -q -o "$zip" -d "$dir" || { echo "    解压失败"; return 1; }
  [ -f "$dir/main.tex" ] || { echo "    ZIP 里没有 main.tex，跳过"; return 1; }
  (
    cd "$dir" || exit 1
    if command -v latexmk >/dev/null 2>&1; then
      latexmk -norc -xelatex -no-shell-escape -halt-on-error -interaction=nonstopmode -file-line-error main.tex
    else
      xelatex -no-shell-escape -halt-on-error -interaction=nonstopmode -file-line-error main.tex &&
        xelatex -no-shell-escape -halt-on-error -interaction=nonstopmode -file-line-error main.tex
    fi
  ) > "$dir/build.log" 2>&1
  status=$?
  if [ "$status" -ne 0 ] || grep -q '^!' "$dir/main.log" 2>/dev/null || [ ! -s "$dir/main.pdf" ]; then
    echo "    编译出错："
    log="$dir/main.log"; [ -s "$log" ] || log="$dir/build.log"
    grep -m 8 -E '^(!|main\.tex:[0-9]+:)' "$log"
    log_out="$(dirname "$zip")/$name-编译日志.log"
    cp "$log" "$log_out" && echo "    完整日志：$log_out"
    return 1
  fi
  pages=$(grep "Output written on main\.\(pdf\|xdv\)" "$dir/main.log" | tail -1 | sed "s/[^0-9]*\([0-9]*\) page.*/\1/")
  out="$(dirname "$zip")/$name.pdf"
  cp "$dir/main.pdf" "$out" || return 1
  echo "    完成：$pages 页 → $out（工程目录 $dir）"; open_file "$out"
}
command -v xelatex >/dev/null 2>&1 || { echo "没有找到 xelatex，请先安装 TeX Live / MacTeX。"; exit 1; }
case "$WATCH" in -*) WATCH="./$WATCH";; esac
case "$WATCH" in *.zip) compile_zip "$WATCH"; exit $?;; esac
[ -d "$WATCH" ] || { echo "目录不存在：$WATCH"; exit 1; }
[ -t 0 ] || { echo "监视目录需要在终端中逐个确认 ZIP 来源。" >&2; exit 1; }
echo "正在监视 $WATCH（Ctrl+C 退出）"; seen=""
while :; do
  for f in "$WATCH"/*-LaTeX-Project*.zip; do
    [ -f "$f" ] || continue
    stamp=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f"); key="$f@$stamp"
    case "$seen" in *"|$key|"*) continue;; esac
    sleep 2; stamp2=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f"); [ "$stamp" = "$stamp2" ] || continue
    seen="$seen|$key|"
    printf '编译这个可信 ZIP？[y/N] %s\n' "$f"
    IFS= read -r answer || exit 0
    case "$answer" in y|Y) compile_zip "$f";; esac
    echo "继续监视中…"
  done
  sleep 2
done
