# WordTeX — 从这里开始 / Start here

## 给作者和编辑（不用装任何东西）

双击打开 `wordtex_studio.html`（约 1.6 MB，离线运行，文件不会上传到任何地方）。界面默认为英文，点右上角的 **EN / 中文** 可切换为中文（会记住选择）。中文手册见 `docs/USER_MANUAL_zh.md`，完整英文手册见 `WordTeX_USER_MANUAL.md`。

1. 第一次使用先填会议/期刊资料（名称、年份、ISBN、模板格式），点"立即保存"，以后自动沿用。
2. 上传 Word 稿件（.docx）。左侧会列出识别到的标题、作者、摘要、关键词和正文的每一个块；右侧是套好模板的预览。
3. 校对：
   - 每个块都能直接改文字；**公式以 LaTeX 源码显示，可以直接修改**，预览用 KaTeX 渲染，写错的公式会标红；
   - 块类型识别错了（比如把标题当成正文），用块头部的下拉菜单改；
   - 标注"由加粗推断"的标题，请确认层级；
   - 检查清单会告诉你哪些内容无法转换（旧式公式编辑器对象、Word 原生图表、WMF 图片），它们在导出的项目里是占位框，项目照样能编译。
4. 导出 LaTeX 项目压缩包，用 XeLaTeX 编译（`latexmk main.tex`，或在 TeXstudio 里选 XeLaTeX），或者直接交给编辑部。
   装了 TeX Live 的机器可以先双击 `scripts/autocompile/WordTeX-autocompile.bat`（macOS/Linux 用 `.sh`）：
   之后每次导出 ZIP 都会自动编译并打开真正的 LaTeX PDF，出错时显示错误和日志。

## 给编辑部平台和开发者

```bash
npm ci
npm run build                                  # 从 src/ vendor/ templates/ 拼出 wordtex_studio.html
npm test                                       # 35 个测试（公式转换、界面文案、端到端、回归）
node scripts/headless_run.js wordtex_studio.html paper.docx out/     # 无浏览器转换，输出 ui_report.json 和 project.zip
node scripts/regression.js manuscripts/ --compile                    # 批量回归，一篇一行 CSV，可选 XeLaTeX 编译
```

## 目录

| 位置 | 内容 |
|---|---|
| `wordtex_studio.html` | 单文件离线应用（构建产物） |
| `src/` | 应用逻辑 `app.js`、公式转换器 `omml2latex.js`、界面文案 `i18n.js`（英/中）、样式、页面模板 |
| `vendor/` | mammoth.js、JSZip、KaTeX（各自许可证见 `vendor/LICENSES.md`） |
| `templates/` | 内置的 ACM acmart 模板包 |
| `scripts/` | 构建、无头运行、回归统计；`scripts/autocompile/` 本机自动编译（Windows / macOS / Linux） |
| `tests/` | 单元测试和端到端测试；`tests/fixtures/` 放本地回归稿件（不入库） |
| `examples/` | 合成的示例稿件 `sample_manuscript.docx` 及其生成脚本 |
| `validation_results/` | 七篇真实稿件改进前后的统计 |
| `docs/` | `USER_MANUAL_zh.md` 中文手册（安装、操作、常见问题、检查清单）、`ARCHITECTURE.md` 架构说明；根目录 `WordTeX_USER_MANUAL.md` 为完整英文手册（含模块、API、验证） |

## 发布前请改的地方

- 第一次发布后在 Zenodo 取 DOI，填回 `CITATION.cff` 和 README 的徽章。
