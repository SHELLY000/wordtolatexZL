# 本机编译 / Local compilation

用这些脚本编译自己导出或来源可信的 GalleyTeX 项目 ZIP。编译成功后，脚本打开 PDF。失败时，编译日志保存在 ZIP 旁边。

| 平台 | 编译单个项目 | 监视目录 |
|---|---|---|
| Windows | 将可信 ZIP 拖到 `GalleyTeX-autocompile.bat` 上。`.bat` 与 `galleytex-autocompile.ps1` 放在同一目录。 | 双击 `.bat` 选择目录，或把目录拖到 `.bat` 上。脚本在解压前逐个询问。 |
| macOS / Linux | `./galleytex-autocompile.sh paper-LaTeX-Project.zip` | `./galleytex-autocompile.sh path/to/folder`。脚本在解压前逐个询问。 |

安装含 `xelatex` 的 TeX Live、MiKTeX 或 MacTeX。若已安装 `latexmk`，脚本会优先使用它，忽略初始化文件，并关闭 TeX 的 shell escape。仅对可信项目使用这些脚本。每次编译在系统临时目录下的新工程目录中运行，可打开其中的 `main.tex` 继续编辑。
