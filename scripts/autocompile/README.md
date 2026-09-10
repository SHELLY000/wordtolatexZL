# 本机自动编译 / Local auto-compile

排版工具在浏览器里导出 `*-LaTeX-Project.zip`；这里的脚本监视下载目录，ZIP 一落地就解压、用 **XeLaTeX** 编译并打开 PDF，
作者看到的就是真正的 LaTeX 结果，而不是浏览器预览。编译出错时把前几行错误显示在窗口里，并把完整日志放到下载目录。

| 平台 | 文件 | 用法 |
|---|---|---|
| Windows | `GalleyTeX-autocompile.bat` + `galleytex-autocompile.ps1` | 两个文件放在同一文件夹，双击 .bat；首次确认监视目录（默认"下载"），以后记住。把 ZIP 或文件夹拖到 .bat 上也可以。 |
| macOS / Linux | `galleytex-autocompile.sh` | `./galleytex-autocompile.sh`（默认监视 ~/Downloads）或 `./galleytex-autocompile.sh paper-LaTeX-Project.zip` |

需要本机装有 TeX Live / MiKTeX / MacTeX，并且包含 `xelatex`（有 `latexmk` 更好）。导出的项目是为 XeLaTeX 写的：中文和
Unicode 符号只有 XeLaTeX 能编译；脚本在只找到 pdflatex 时会给出警告。

编译在纯 ASCII 路径下进行（Windows：`C:\Users\Public\galleytex-build\<时间>-<论文名>\`；macOS/Linux：`$TMPDIR/galleytex-build/`），
里面的 `main.tex` 可以直接用 TeXstudio 打开继续修改。
