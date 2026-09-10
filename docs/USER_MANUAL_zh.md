# WordTeX 用户手册（中文）

**版本 0.2.2** · Word (.docx) → LaTeX 论文排版，作者逐块校对

本手册翻译并整理了英文完整手册 `WordTeX_USER_MANUAL.md` 中面向**作者和编辑部**的部分：系统要求、安装、操作指南、常见问题、检查清单说明。面向开发者的内容（功能模块、API 参考、验证数据、仓库结构、转义规则）请看英文手册第 4、5、8 节和附录 A、C、D、F。

界面默认为英文；点页面右上角的 **EN / 中文** 切换为简体中文，切换不会丢失已上传的论文和未保存的修改，选择会记在浏览器里。下文按**中文界面**的按钮和提示描述。

---

## 目录

1. [简介](#1-简介)
2. [系统要求](#2-系统要求)
3. [安装](#3-安装)
4. [操作指南](#4-操作指南)
5. [浏览器工具说明](#5-浏览器工具说明)
6. [功能范围与已知限制](#6-功能范围与已知限制)
7. [常见问题](#7-常见问题)
8. [检查清单说明](#8-检查清单说明)
9. [导出项目的内容](#9-导出项目的内容)
10. [支持与版本信息](#10-支持与版本信息)

---

## 1. 简介

### 1.1 它解决什么问题

WordTeX 把一篇 Word 论文转换成**能直接编译**的 LaTeX 项目，并让不会 LaTeX 的作者自己检查和修正转换结果。它面对的是很多小型会议和新创期刊的处境：

- **作者用 Word 写稿**，不会 LaTeX；
- **出版流程跑在 LaTeX 上**，主办方模板（这里是 ACM `acmart`）只有 `.cls` 文件。

编辑部夹在中间，要么重新录入，要么跑一遍转换器再手工修补。现有转换器（Pandoc、Writer2LaTeX、商业插件）停在一个 `.tex` 文件上：不面向任何模板，不告诉作者丢了什么，也不给不会 LaTeX 的作者任何可以修改的东西。

WordTeX 把这个环闭上。转换全部在浏览器里完成；识别出的每一个块——标题、段落、**可编辑的公式 LaTeX**、表格、图片、参考文献——都列在模板预览旁边；作者用普通的文字编辑和一个"块类型"下拉菜单修正转换错误；检查清单指出还需要注意的地方；导出的项目**一定能编译**，因为 WordTeX 转不了的内容（旧式公式编辑器对象、Word 原生图表、WMF 图片）会变成原位置上一个可见的占位框，而不是编译错误。

### 1.2 主要功能

- **Word 公式（OMML）→ LaTeX**：分式、上下标、前置标、根式、带上下限的大型运算符、定界符、矩阵、重音、上下划线、大括号、函数、方程组；正体/粗体/黑板体/花体/哥特体；公式回到原来的位置（包括表格单元格内），带编号的公式通过 `\tag` 保留作者的编号。
- **公式校对**：每个公式以可编辑的 LaTeX 源码显示，用内置 KaTeX 实时渲染，语法错误标红并计数。
- **从任何模板恢复标题层级**：通过 `styles.xml` 里的大纲级别识别段落样式（Word 内置"标题 1–3"、ACM 的 Head1–3、Springer、IEEE 等）；作者只加粗没用样式的标题（`2.1 …`、`I. …`、`A. …`、Introduction、References）按保守规则提升为标题并标注"请确认"。
- **论文信息**：标题、作者、单位、邮箱、ORCID、通讯作者标记、摘要、关键词、CCS 概念；用表格排版刊头或摘要框的期刊模板也能识别。
- **表格**：合并单元格转为 `\multirow` / `\multicolumn` + `\cline`；超过 18 行的表格用 `xltabular` 跨页；单元格里的图片保留。
- **图片与浮动体控制**：`figure` 环境带 `\caption`、`\Description`、`\label`；默认 `[!htbp]` 加放宽的浮动参数并在每节前加 `\FloatBarrier`，也可选"严格保持 Word 原位"（`[H]`）。
- **文内引用关联**：`[3]`、`[2, 5]`、`[4–6]` 和 `(Author et al., 2024)` 匹配到参考文献后变成 `\cite{refN}`；参考文献列表输出为 `thebibliography`。
- **一定能编译**：WMF/EMF 图片、公式编辑器 3.0 / MathType 对象、原生图表变成占位框；`xeCJK` 仅在已安装时加载；缺少国家时从邮箱域名推断；过长的字段会截断。
- **会议资料只填一次**：会议名称、日期、ISBN、`\setcopyright`、模板变体填一次后记在浏览器里，也可导出/导入为 JSON。
- **零安装**：`wordtex_studio.html` 一个 1.6 MB 的文件，离线运行，无服务器、无上传、无网络访问。
- **中英双语界面**。
- **无浏览器批处理**：同一页面可由 Node/jsdom 驱动，供编辑部平台、批量转换和持续集成使用。

---

## 2. 系统要求

### 2.1 浏览器工具

| 项目 | 要求 |
|---|---|
| 浏览器 | Chrome 105+、Edge 105+、Firefox 126+、Safari 16.4+ |
| 分辨率 | 至少 1280 × 720；宽度低于 900 px 时布局改为上下排列 |
| 内存 | 图片以 base64 形式驻留内存；几百页、大量照片的稿件建议 8 GB |
| 稿件 | 仅限 `.docx`（Word 2007 及以后，或 LibreOffice / WPS 导出），最大 30 MB |
| 网络 | **不需要**。页面不发出任何网络请求。 |
| 安装 | 无。直接打开本地文件。 |

因为没有任何东西离开本机，未发表的稿件和保密投稿可以放心使用。

浏览器存储（`localStorage`）只用来记住会议资料、已选的 CCS 概念和界面语言。如果浏览器对本地文件禁止存储（某些隐私模式），工具会提示，并提供 JSON 导出/导入作为替代。

### 2.2 编译导出的项目

| 项目 | 要求 |
|---|---|
| TeX 发行版 | TeX Live 2022+（建议完整安装）、MiKTeX 或 MacTeX |
| 引擎 | **XeLaTeX**——`pdflatex` 会在 WordTeX 原样保留的 Unicode 符号上报错；项目自带的 `latexmkrc` 已自动选择 XeLaTeX |
| 宏包 | `acmart` 及其依赖（libertine、newtxmath 等）、`tabularx`、`multirow`、`xltabular`、`placeins`、`float` |
| 中文 | `xeCJK` 加 *Noto Serif CJK SC*、*SimSun*、*Songti SC* 之一；仅在存在时加载 |

Ubuntu 用 apt 安装时至少需要：`texlive-xetex texlive-latex-extra texlive-fonts-recommended texlive-fonts-extra fonts-linuxlibertine`（中文稿件再加 `texlive-lang-chinese fonts-noto-cjk`）。

XeLaTeX 只在编译时需要；转换本身不需要装 TeX。

### 2.3 无浏览器运行、构建与测试（编辑部平台和开发者）

Node.js 18 以上（推荐 22），Linux / macOS / Windows 均可。`npm ci` 会安装 jsdom、jszip、docx 三个开发依赖，约 200 MB。

---

## 3. 安装

### 3.1 浏览器工具

不需要安装。从 GitHub 最新 Release 下载 `wordtex_studio.html`，双击打开，或在浏览器"文件"菜单里打开。

### 3.2 从源码构建

```bash
git clone https://github.com/SHELLY000/wordtolatexZL
cd wordtolatexZL
npm ci
npm run build          # -> wordtex_studio.html
```

`npm run build` 把 `src/`、`vendor/`、`templates/` 拼装成单文件应用，同样的输入产生逐字节相同的结果。

### 3.3 验证安装

```bash
npm test
# 35 个测试：OMML 单元测试、界面文案测试、示例稿的流水线测试、回归测试

node scripts/headless_run.js wordtex_studio.html examples/sample_manuscript.docx out/
# 产生 out/ui_report.json  out/preview.html  out/project.zip
```

看到 `out/project.zip` 就说明安装完成。装了 TeX Live 的话，`node scripts/regression.js examples/sample_manuscript.docx --compile` 会进一步编译项目并报告页数和 LaTeX 错误数（应为 0）。

### 3.4 可选：本地自动编译

`scripts/autocompile/` 里的脚本会监视一个文件夹，把每个导出的 ZIP 自动编译成真正的 PDF：

| 平台 | 文件 | 用法 |
|---|---|---|
| Windows | `WordTeX-autocompile.bat` + `wordtex-autocompile.ps1` | 两个文件放在同一目录，双击 `.bat`；第一次确认要监视的文件夹（默认"下载"）。也可以把 ZIP 或文件夹拖到 `.bat` 上。 |
| macOS / Linux | `wordtex-autocompile.sh` | `./wordtex-autocompile.sh`（监视 `~/Downloads`）或 `./wordtex-autocompile.sh 论文-LaTeX-Project.zip` |

脚本把 ZIP 解压到纯 ASCII 路径的编译目录，运行 `latexmk -xelatex`，打开 PDF；失败时显示前几行错误并把完整日志存到 ZIP 旁边。需要本机有带 `xelatex`（最好也有 `latexmk`）的 TeX 发行版——TeXstudio 只是编辑器，它背后的 TeX Live / MiKTeX 才是编译器。

---

## 4. 操作指南

左侧面板分三步：**导入**、**校对**、**导出**。

### 4.1 第一步：导入

1. **固定会议资料**——只填一次：会议全称、会议简称（如 `GAITDI 2026`）、会议年份、会议日期（如 `June 03--05, 2026`）、会议地点、ISBN、模板格式（*定稿版 acmsmall*——单栏会议论文集，或 *投稿审稿版 manuscript*——带行号）、版权声明 `\setcopyright`（`acmlicensed`、`acmcopyright`、`rightsretained`、`cc`、`none`）、定稿版是否打印页码（`printfolios=true`）。输入即自动保存；**立即保存** 显式保存，**恢复默认** 重置表单，**下载会议配置** / **导入会议配置** 把设置导出为 JSON 或从 JSON 导入——用于浏览器禁止存储的机器，或在编辑部内共享同一份配置。
2. **上传 Word 文档**——拖入或选择 `.docx`（最大 30 MB）。识别需要几秒；随后文件卡片显示大小和字数，并弹出"Word 文档识别完成"。
3. 点 **识别并校对**。

### 4.2 第二步：校对

**论文信息**——核对论文标题、作者卡片（姓名、电子邮箱、ORCID、机构/院系、城市、国家/地区、"通讯作者"勾选）、摘要、关键词、本文 DOI、CCS 概念（在分组列表中选择，重要程度 500 / 300 / 100；或在"高级"里粘贴 ACM CCS 工具生成的代码）。

**正文全文校对**——每个块都带有类型标签：

| 块标签 | 内容 | 你可以做什么 |
|---|---|---|
| 章节标题 / 章节标题（由加粗推断，请确认） | 标题 | 改文字；用下拉菜单改层级或改成正文段落 |
| 正文段落 | 段落 | 改富文本；改成标题 / 图题表题 / 参考文献条目 |
| 公式（LaTeX，可直接修改） / 含公式的段落 | 公式，或含公式的段落 | 直接改 LaTeX 源码；预览实时重绘，出错的公式标红 |
| 表格 | 表格 | 改单元格文字（合并单元格和单元格内图片在导出时处理） |
| 图片 / 图片或图题 / 图题/表题 | 图片及其图题 | 改图题文字 |
| 图表占位 | Word 原生图表 | 保留占位，或在 Word 里把图表另存为 PNG 后重新上传 |
| 含公式图片的段落 | 旧式公式图片 | ——（按图片或占位框导出） |
| 列表 | 项目符号或编号列表 | 改条目 |
| 参考文献 | 一条文献 | 改文字；文内的 `[n]` 和（作者, 年份）引用在导出时关联 |

**识别概况**——章节、图片、表格、参考文献的数量，完整度百分比，以及检查清单（见第 8 节）。逐条处理带 `!` 的项目，大多数一步就能解决。

点 **确认并导出**，未保存的修改会自动写入。

### 4.3 第三步：导出

- **下载完整 LaTeX 项目压缩包**——第 9 节描述的项目。
- **生成本地 PDF**——打开浏览器打印窗口，选择"另存为 PDF"。这只是预览的近似，权威版式来自 XeLaTeX。
- **图表位置**——*LaTeX 自动优化*（`[!htbp]`，默认）或 *严格保持 Word 原位*（`[H]`）。

### 4.4 编译

```bash
unzip 论文-LaTeX-Project.zip -d paper && cd paper
latexmk main.tex            # latexmkrc 已选择 XeLaTeX
# 或：xelatex main.tex; xelatex main.tex
```

TeXstudio / TeXworks：打开 `main.tex`，引擎选 **XeLaTeX**。如果自动编译脚本（§ 3.4）在运行，下载后几秒 PDF 会自己弹出来。

项目里的 `WORD-CONVERSION-NOTES.txt` 列出了投稿前要复核的内容：公式、图题、已关联的引用、`multirow` 表格和版权栏。

### 4.5 写稿建议（能明显提高识别率）

1. 标题用 Word 内置的"标题 1 / 2 / 3"样式或主办方模板的标题样式；不要只加粗。
2. 公式用 *插入 → 公式*（OMML）输入。公式编辑器 3.0、MathType、WPS 公式是 OLE 图片，无法转换。
3. 图表另存为 PNG 后粘贴；Word 原生图表里没有位图。
4. 图题写成 `Figure 1: …`、表题写成 `Table 1: …`，紧邻图表。
5. 论文信息加标签：`Abstract:`、`Keywords:`；每位作者的姓名、单位、邮箱各占一行。
6. 参考文献放在 *References* 标题下，每条一段，用 `[1]` … 编号或统一用作者–年份格式。
7. 图片用 PNG/JPEG；避免 WMF/EMF/GIF/BMP/TIFF。

### 4.6 批量转换

```bash
node scripts/regression.js submissions/ --compile --out build/ | tee submissions.csv
```

每篇稿件在 `build/<名字>/` 下得到 `ui_report.json`、`preview.html`、`project.zip`、解压后的 `proj/`，加 `--compile` 后还有 `main.pdf` 和 `main.log`。CSV 里最值得按其排序的两列是 `warnings`（检查清单警告数）和 `latex_errors`。

`headless_run.js` 的会议资料通过命令行参数传入（`--conference --short --year --dates --location --isbn`），`--lang en|zh` 决定报告里检查清单和块标签的语言；不传参数时用的是示例值，不是网页里保存的设置。

---

## 5. 浏览器工具说明

### 5.1 布局

| 区域 | 内容 |
|---|---|
| 页眉 | 产品名、隐私提示（本地处理，不上传任何内容）、语言切换（**EN / 中文**） |
| 左侧面板 | *导入* → *校对* → *导出*；当前步骤的表单；**返回** 和步骤按钮（*识别并校对* → *确认并导出* → *重新校对*） |
| 右侧分页模板预览 | 所选 acmart 变体的 US Letter 页面：页眉、标题块、摘要、CCS、关键词、ACM 引用格式行、带渲染公式的正文、按页收集的脚注、第一页的版权栏；缩放 50–114 % |
| 提示条 | 短状态消息（识别完成、文件已下载、错误） |

预览在最后一次修改 120 ms 后重新分页，只有正文真的变了才重新排版；改论文信息只影响首页。

### 5.2 哪些内容会被记住

| 数据 | 存放位置 | 保留期 |
|---|---|---|
| 会议资料 | `localStorage` 键 `ei-typesetter-conference-v1` | 直到清除；也可导出为 JSON |
| 已选 CCS 概念 | `localStorage` 键 `ei-typesetter-ccs-v1` | 直到清除 |
| 界面语言 | `localStorage` 键 `wordtex-lang` | 直到清除；没有时为英文 |
| 论文、修改、图片 | 仅页面内存 | **刷新即丢失——关闭前请先导出** |

### 5.3 与无浏览器运行的一致性

两者按构造就是一致的：`headless_run.js` 在 jsdom 里加载同一个 HTML 文件、驱动同一个 DOM。唯一的差别是环境上的——jsdom 没有图片解码器，所以脚本从文件头读 PNG 尺寸，其他格式按 600 × 400 px 估算 `\includegraphics` 的大小。

---

## 6. 功能范围与已知限制

- 内置模板是 ACM `acmart`。正文生成器与模板无关，但论文信息的宏（`\acmConference`、`\affiliation`、`\ccsdesc`、`acks`）是 ACM 的；其他会议需要一个模板模块。
- 公式编辑器 3.0 / MathType / WPS 公式是 OLE 图片而非 OMML：按占位框导出（计划做 MTEF 解析或服务器端 WMF 渲染）。
- Word 原生图表和 SmartArt 没有位图：占位框。
- 参考文献按作者原有格式输出为 `thebibliography`；自带的 `ACM-Reference-Format.bst` 不会自动套用。
- 从加粗文字提升标题、以及段落级的标题/摘要/关键词识别都是启发式规则；检查清单会标出需要确认的情况。
- 预览按顶层块分页；单个块高过一页（很长的表格）会在预览里溢出，不影响 LaTeX 输出。
- 中文等 CJK 文字需要编译机器上有 `xeCJK` 和 CJK 字体。
- 标题和摘要是纯文本字段：其中的公式不会保留。

---

## 7. 常见问题

### 7.1 上传后提示"未能读取该文档"

**原因**：文件不是有效的 `.docx`（`.doc`、改了扩展名的 PDF、加了密码的文档），或者已损坏。
**处理**：在 Word 里打开，*另存为 → Word 文档 (.docx)*，不加密码；先去掉加密。

### 7.2 "文件超过 30 MB"

**原因**：嵌入的图片太大。
**处理**：Word 里 *文件 → 信息 → 压缩图片*（或降到 220 ppi）后保存。会议论文的插图在印刷尺寸下很少需要超过 300 ppi。

### 7.3 标题被识别成正文段落

**原因**：作者只加粗没用标题样式，而且这些行没有编号、也不在已知的节名之内，保守的提升规则没有触发。
**处理**：在校对面板用下拉菜单把块类型改成 *一级 / 二级 / 三级标题*；或在 Word 里套用"标题 1–3"后重新上传。已经从加粗提升的标题带有"由加粗推断，请确认"标签——确认它们的层级。

### 7.4 公式被红框标出

**原因**：转换出的 LaTeX 无法解析（通常是编辑后括号不配对，或 KaTeX 不认识的写法）。
**处理**：在预览里把鼠标移到公式上看错误信息；在块里修改源码。无法解析的公式数量在检查清单里。注意有些合法 LaTeX（如某些 `\operatorname` 用法）KaTeX 不接受但 XeLaTeX 接受——不影响导出。

### 7.5 检查清单："N 处 MathType/公式编辑器 3.0 对象"

**原因**：公式是公式编辑器 3.0 / MathType / WPS 的 OLE 对象，Word 只保存了 WMF 预览图。
**处理**：用 *插入 → 公式* 重新输入（Word 的 *公式选项 → 转换* 能转一部分），或每个都粘贴为 PNG。在此之前项目照样能编译，每个位置是一个占位框。

### 7.6 检查清单："N 处 Word 原生图表"或"N 张 EMF/WMF/GIF/BMP 图片"

**原因**：图表没有位图；XeLaTeX 读不了图元文件 / GIF / BMP。
**处理**：在 Word 里把每个图表或图片另存为 PNG 替换；或把 PNG 放进导出项目的 `figures/`，替换 `main.tex` 里的 `\fbox{…}` 占位。原始 EMF/WMF 文件也在 `figures/` 里，可用 LibreOffice 或 Inkscape 转换。

### 7.7 检查清单："N 处文内引用未能与参考文献匹配"

**原因**：`[n]` 超出识别到的文献数、范围跨度超过 20，或作者–年份引用的姓氏 + 年份不能唯一匹配一条（拼写错误、译名不同、同一作者同年两篇没有 `a`/`b`）。
**处理**：检查每条文献都被识别了（识别概况里的"参考文献"数量）；用下拉菜单把漏掉的条目改成参考文献；统一拼写。未匹配的引用按纯文本导出，项目仍能编译。

### 7.8 摘要或关键词里吞进了正文

**原因**：缺少或拼错了 *Keywords:* 标签，字段一直延续到长度上限；检查清单会提示摘要或关键词字段过长。
**处理**：在校对面板里修剪该字段，或在 Word 里加上标签后重新上传。上限（6000 / 400 字符）避免了整篇正文丢失。

### 7.9 检查清单："N 位作者缺少国家/地区"

**原因**：`acmart` 要求每个单位都有 `\country{}`；单位行里没有可识别的国家，邮箱域名也没给出线索。
**处理**：在作者卡片里填"国家/地区"。

### 7.10 会议资料没有保存

**原因**：浏览器对本地文件禁止 `localStorage`（隐私窗口、某些加固配置）；会议表单下方的状态行会提示浏览器存储不可用。
**处理**：填好后点 **下载会议配置**；下次用 **导入会议配置** 载入 JSON。或者用任意本地 Web 服务器打开这个文件。

### 7.11 编译出的 PDF 和预览不一样

**这是正常的。** 浏览器预览只是为校对而做的 acmart 版式近似；换行、浮动体位置和页数以 XeLaTeX 为准。用自动编译脚本（§ 3.4）可以在每次导出后几秒内看到真实 PDF。

### 7.12 `pdflatex` 报 "Unicode character … not set up"

**原因**：用 pdfLaTeX 编译了项目。
**处理**：改用 XeLaTeX：`latexmk main.tex`（自带的 `latexmkrc` 会选它）、`build.sh` / `build.bat`，或在编辑器里选 XeLaTeX。直接用 `xelatex` 而 TeX Live 装得不全时，缺少 `libertine` / `newtxmath` 字体会静默丢字——请安装完整方案。

### 7.13 PDF 里没有中文

**原因**：没装 `xeCJK`，或 *Noto Serif CJK SC*、*SimSun*、*Songti SC* 一个都没有。
**处理**：安装 `xeCJK`（TeX Live 的 `collection-langchinese`）和一种中文字体；导言区检测到后会自动加载。

### 7.14 图或表离它的正文很远

**原因**：默认 `[!htbp]` 允许 LaTeX 在本节内移动浮动体。
**处理**：在导出面板选 *严格保持 Word 原位*（`[H]`）；接受页面底部可能出现的留白。

### 7.15 无浏览器运行报 "no project zip captured"

**原因**：识别失败（提示文字会打印到 `stderr`），或稿件超出上面的限制。
**处理**：把同一文件在浏览器里跑一遍看检查清单；文件损坏见 § 7.1。`regression.js` 会把这类文件标记为 `HEADLESS_FAILED` 并继续处理其余文件。

---

## 8. 检查清单说明

识别概况里每项检查一行：`✓` 通过，`!` 需要处理。"完整度"百分比是通过的检查所占比例。

| 检查项（未通过时的提示） | 含义 | 处理 |
|---|---|---|
| 模板结构需要复核 | LaTeX 骨架无效 | 使用内置模板时不会出现 |
| 缺少论文标题 | 没识别到标题 | 手动填写 |
| 请补充作者信息 | 没识别到作者 | 添加作者卡片 |
| 请勾选通讯作者 | 没有卡片勾选 | 在一张卡片上勾"通讯作者" |
| 存在无效 ORCID | 格式或校验位错误 | 更正（16 位数字，末位可为 X） |
| 摘要过短或未识别 | 少于 50 个字符 | 粘贴摘要 |
| 请补充关键词 | 字段为空 | 用 `;` 分隔填写 |
| 请填写并保存会议名称、年份和 ISBN | 会议资料不完整 | 在导入步骤补全表单 |
| 请填写本文 DOI | DOI 为空 | 录用前可留空 |
| 未检测到章节标题 | 一个标题都没有 | 在 Word 里套用标题样式，或改块类型 |
| 未检测到参考文献列表 | 没有 *References* 标题 | 改标题名，或把条目改成参考文献 |
| N 处 Word 公式转换失败 / N 处公式 LaTeX 有语法错误 | OMML 转换出错 / KaTeX 无法解析 | 在块里修改 LaTeX |
| N 处 MathType/公式编辑器 3.0 对象 | OLE 公式按占位框导出 | 重新用 OMML 输入或粘贴 PNG |
| N 处 Word 原生图表 | 图表按占位框导出 | 另存为 PNG |
| N 张 EMF/WMF/GIF/BMP 图片 | 不支持的格式按占位框导出 | 转成 PNG |
| N 张图片位于表格单元格内 | 按单元格宽度嵌入 | 编译后检查尺寸 |
| N 个标题由加粗文字推断 | 从加粗段落提升 | 确认层级 |
| N 处文内引用未能与参考文献匹配 | 按纯文本保留 | 见 § 7.7 |
| N 位作者缺少国家/地区 | `\country{}` 会为空 | 填写国家 |
| 摘要或关键词字段过长 | 漏了标签，字段一直延续 | 修剪或加标签 |
| 未选择 CCS 概念 | 没有 `\ccsdesc` | ACM 会议请选择；其他可忽略 |
| 含中文字符 | 将加载 `xeCJK` | 确认编译机器上有中文字体 |

---

## 9. 导出项目的内容

```
<论文名>-LaTeX-Project.zip
├── main.tex                    # 生成的论文
├── acmart.cls                  # ACM 模板 2.20 及其文件
├── ACM-Reference-Format.bst
├── acmauthoryear.bbx  acmauthoryear.cbx  acmnumeric.bbx  acmnumeric.cbx  acmdatamodel.dbx
├── acm-jdslogo.png  LICENSE  README
├── figures/word-figure-01.png … # 每张不同的图片一个文件（不支持格式的原文件也在）
├── latexmkrc                   # $pdf_mode = 5（XeLaTeX）
├── build.sh  build.bat         # latexmk -xelatex main.tex
└── WORD-CONVERSION-NOTES.txt   # 投稿前要复核的内容
```

解压后可直接在 TeXstudio 里打开 `main.tex`，用 XeLaTeX 编译。

---

## 10. 支持与版本信息

- **仓库**：https://github.com/SHELLY000/wordtolatexZL
- **问题反馈**：https://github.com/SHELLY000/wordtolatexZL/issues
- **当前版本**：0.2.2（2026-09-09）
- **许可证**：MIT（内置组件：mammoth.js BSD-2-Clause、JSZip MIT、KaTeX MIT、acmart LPPL 1.3c，见 `vendor/LICENSES.md`）
- **归档**：Zenodo，https://doi.org/10.5281/zenodo.22692708
- **维护者**：Li Zhou，School of Economics, Wuhan Business University，20200122@wbu.edu.cn，ORCID 0000-0002-4024-2552

引用本软件请同时引用软件本身和配套的 SoftwareX 论文（发表后）；机器可读的引用信息在 `CITATION.cff`。

持续集成在 Ubuntu、Windows、macOS 上以 Node 18、20、22 运行全部测试，构建 `wordtex_studio.html`，并用 XeLaTeX 编译示例项目，任何 LaTeX 错误都会使构建失败。

---

*WordTeX 0.2.2 · MIT License · Copyright © 2026 Li Zhou*
