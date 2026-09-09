# WordTeX 用户手册 / User manual

（中文速查。完整英文手册见仓库根目录 `WordTeX_USER_MANUAL.md`。）

界面默认为英文；点页面右上角的 **EN / 中文** 切换为中文，选择会保存在浏览器里。下文按中文界面描述。

## 1. 界面

- **导入**：会议/期刊资料表单 + Word 上传。
- **校对**：论文信息（标题、作者卡片、摘要、关键词、DOI、CCS）、正文全文校对（逐块）、识别概况与检查清单。
- **导出**：LaTeX 项目 ZIP、本地 PDF（浏览器打印，仅供预览）、图表位置开关。

## 2. 校对面板里能做什么

| 块类型 | 显示 | 你可以 |
|---|---|---|
| 章节标题 | 标题文字；来自加粗推断的会标注 | 改文字；用下拉菜单改层级或改成正文 |
| 正文段落 | 富文本 | 改文字；把某段改成标题/图题/参考文献 |
| 公式 / 含公式的段落 | `$…$` 内的 LaTeX 源码（浅蓝底） | 直接改 LaTeX；预览实时渲染，出错标红 |
| 表格 | 可编辑表格 | 改单元格文字（合并单元格在导出时自动处理；单元格内的图片会按单元格宽度嵌入） |
| 图片 / 图题 | 图片与相邻图题 | 改图题文字 |
| 图表占位 | 橙色占位框 | 原生图表无法导出：在 Word 里另存为 PNG 后重新上传，或保留占位 |
| 参考文献 | 逐条 | 改文字；正文的 [n] 和 (作者, 年份) 会自动关联 |

## 3. 检查清单的含义

| 提示 | 含义 | 处理 |
|---|---|---|
| 已转换 N 处 Word 公式 | OMML 公式全部转成 LaTeX | 在预览里核对 |
| N 处公式 LaTeX 有语法错误 | KaTeX 无法渲染 | 在对应块里修改源码 |
| MathType/公式编辑器 3.0 对象 | 旧式公式不是 OMML，只有 WMF 预览图 | 在 Word 里重新用"插入公式"输入，或提供 PNG |
| Word 原生图表 | 图表没有位图 | 另存为图片 |
| N 张图片位于表格单元格内 | 已按单元格宽度嵌入 LaTeX 表格 | 导出后检查尺寸 |
| 标题由加粗文字推断 | 作者没用标题样式 | 确认层级 |
| 文内引用未能匹配 | 编号超出文献数或作者/年份不匹配 | 导出后检查 |
| 作者缺少国家 | acmart 必填 | 在作者卡片补填 |

## 4. 导出与编译

ZIP 内含 `main.tex`、acmart 模板、`figures/`、`latexmkrc`、`build.sh`/`build.bat`。用 XeLaTeX 编译：

```bash
latexmk main.tex        # latexmkrc 已选择 XeLaTeX
```

中文字符会触发 `xeCJK`（仅在已安装时加载），需要系统有中文字体（Noto Serif CJK SC / SimSun / Songti SC）。

**图表位置**：默认"LaTeX 自动优化"（同页或次页，不出章节）；选"严格保持 Word 原位"则图表出现在作者放置的位置（页面底部可能留白）。

## 5. 作者写稿建议（能明显提高识别率）

1. 标题用 Word 内置的"标题 1 / 2 / 3"样式，或主办方模板的标题样式；不要只加粗。
2. 公式用 Word 的"插入 → 公式"（OMML），不要用公式编辑器 3.0 / MathType。
3. 图表另存为 PNG 后插入，不要用 Word 原生图表。
4. 图题写成 "Figure 1: …"、表题写成 "Table 1: …"，紧邻图表。
5. 参考文献放在 "References" 标题下，每条一段。

## English summary

Open `wordtex_studio.html`, enter the venue details, upload the `.docx`, correct the recognised blocks (text, LaTeX
of equations, block types, author fields), read the checklist, export the LaTeX project and compile with XeLaTeX
(`latexmk main.tex`). Content that cannot be converted (legacy equation-editor objects, native charts, WMF images)
is exported as placeholder boxes so the project always compiles.
