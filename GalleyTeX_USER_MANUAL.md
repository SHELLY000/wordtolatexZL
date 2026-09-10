# GalleyTeX User Manual

**Version 0.2.2** · Word (.docx) → LaTeX manuscript typesetting with author-in-the-loop proofreading

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Requirements](#2-system-requirements)
3. [Installation](#3-installation)
4. [Functional Modules](#4-functional-modules)
5. [API Reference](#5-api-reference)
6. [Operation Guide](#6-operation-guide)
7. [GalleyTeX Studio (Browser Tool)](#7-galleytex-studio-browser-tool)
8. [Validation and Accuracy](#8-validation-and-accuracy)
9. [Troubleshooting](#9-troubleshooting)
10. [Support and Version Information](#10-support-and-version-information)
11. [Appendix](#11-appendix)

---

## 1. Introduction

### 1.1 Overview

GalleyTeX turns a Word manuscript into a LaTeX project that compiles, and lets the author check and correct the result without knowing LaTeX. It is written for the situation most small conferences and starting journals are in:

- **Authors write in Word** and do not know LaTeX
- **Production runs on LaTeX** — the venue template (here ACM `acmart`) exists only as a `.cls`

Editorial offices caught between the two either re-key manuscripts or run a converter and hand-fix its output. Existing converters (Pandoc, Writer2LaTeX, commercial add-ins) stop at a `.tex` file: they do not target a venue template, do not tell the author what was lost, and give a non-LaTeX author nothing they can correct.

GalleyTeX closes that loop. Conversion runs entirely in the browser. Every recognised block — headings, paragraphs, **equations as editable LaTeX**, tables, figures, references — is shown next to a template-formatted preview; the author fixes what the converter got wrong through ordinary text editing and a block-type drop-down; a checklist names what still needs attention; and the exported project **always compiles**, because anything GalleyTeX cannot convert (legacy equation-editor objects, native Word charts, metafile images) becomes a visible placeholder at the right position instead of a build error.

### 1.2 Key Features

- **Word equations (OMML) → LaTeX** — fractions, sub/superscripts, pre-scripts, radicals, n-ary operators with limits, delimiters, matrices, accents, over/underlines, braces, functions, equation arrays; upright / bold / blackboard / script / fraktur runs; equations are put back at their exact position, including inside table cells, and numbered equations keep the author's number via `\tag`
- **Equation proofreading** — every equation is shown as editable LaTeX source and rendered live with a bundled KaTeX; syntax errors are highlighted and counted
- **Heading recovery from any template** — paragraph styles are mapped to heading levels through `outlineLvl` / `basedOn` in `styles.xml` (built-in *Heading 1–3*, ACM *Head1–3*, Springer, IEEE …); manually bolded headings (`2.1 …`, `I. …`, `A. …`, *Introduction*, *References*) are promoted with a conservative rule and flagged for confirmation
- **Front matter** — title, authors, affiliations, e-mails, ORCID iDs, corresponding-author markers, abstract, keywords and CCS concepts are recognised, including journal templates that put the masthead or the abstract box in a table
- **Tables** — merged cells become `\multirow` / `\multicolumn` with `\cline`; ragged-right `X` columns; tables longer than 18 rows are emitted as `xltabular` so they break across pages; images inside cells are kept
- **Figures and float control** — `figure` environments with `\caption`, `\Description` and `\label`; `[!htbp]` with relaxed float parameters and a `\FloatBarrier` before every section, or a strict "keep the Word position" (`[H]`) mode
- **Citation linking** — `[3]`, `[2, 5]`, `[4–6]` and `(Author et al., 2024)` become `\cite{refN}` when they match the recognised reference list; the list becomes `thebibliography`
- **Always compiles** — WMF/EMF images, Equation Editor 3.0 / MathType OLE objects and native charts become placeholder boxes; `xeCJK` is loaded only when installed; a missing country is inferred from the e-mail domain; over-long metadata fields are capped
- **Venue settings that persist** — conference name, dates, ISBN, `\setcopyright` choice and template variant are entered once and remembered in the browser (and can be exported / imported as JSON)
- **Zero-install browser front end** — `galleytex_studio.html`, one 1.6 MB file that runs offline with no server, no upload and no network access
- **Bilingual interface** — English by default, Simplified Chinese with one click; the choice is remembered, and manuscript recognition understands both languages regardless of the interface language
- **Headless runner and regression harness** — the same page driven by Node/jsdom for editorial platforms, batch runs and CI, with optional XeLaTeX compilation and a one-line-per-manuscript CSV

### 1.3 Technical Architecture

| Layer | Technology |
|---|---|
| Application | Vanilla JavaScript (ES2020), single IIFE in `src/app.js`; interface strings in `src/i18n.js` (English / Chinese); no framework, no CDN, no network calls |
| Equation converter | `src/omml2latex.js` — UMD module, runs in the browser and in Node |
| .docx reading | mammoth.js (BSD-2) for `.docx → HTML`; JSZip (MIT) to rewrite `word/document.xml` beforehand |
| Equation preview | KaTeX (MIT), bundled with its fonts as data URIs |
| LaTeX target | ACM `acmart` 2.20 (LPPL 1.3c), bundled as a base64 ZIP; compiled with **XeLaTeX** |
| Build | `scripts/build.js` inlines `src/`, `vendor/` and `templates/` into one HTML file |
| Headless harness | Node ≥ 18 + jsdom (`scripts/headless_run.js`, `scripts/regression.js`) |
| Tests | `node --test` — 35 unit, pipeline, regression and interface-string tests |
| Continuous integration | GitHub Actions — Ubuntu, Windows, macOS × Node 18, 20, 22; build artifact; XeLaTeX compile of the example |
| License | MIT (third-party licences in `vendor/LICENSES.md`) |

### 1.4 Two Ways to Run It

|  | Intended for | How to run |
|---|---|---|
| **`galleytex_studio.html`** | Authors and editors; no install | Open the file in a browser. Everything runs locally; nothing is uploaded. |
| **`scripts/headless_run.js`** | Editorial platforms, batch conversion, CI | `node scripts/headless_run.js galleytex_studio.html paper.docx out/` — same code path, no browser |

Both paths execute the same application code: the headless runner loads the very same HTML file in jsdom, so a manuscript converts identically whether an author does it by hand or a platform does it on a server.

---

## 2. System Requirements

### 2.1 Browser Tool

| Item | Requirement |
|---|---|
| Browser | Chrome 105+, Edge 105+, Firefox 126+, Safari 16.4+ (the code uses regular-expression look-behind, `String.matchAll`, CSS `:has()` and the `zoom` property) |
| Resolution | 1280 × 720 minimum; the layout stacks vertically below 900 px width |
| Memory | Images are held in memory as base64; manuscripts of a few hundred pages with many photographs benefit from 8 GB |
| Manuscript | `.docx` only (Word 2007 or later, or exported from LibreOffice / WPS), at most 30 MB |
| Network | **Not required.** The page performs no network requests. |
| Installation | None. Open the local file directly. |

Because nothing leaves the machine, the tool is safe for unpublished manuscripts and confidential submissions.

Browser storage (`localStorage`) is used only to remember the venue settings, the chosen CCS concepts and the interface language. When a browser blocks storage for local files (some private-browsing modes), the tool says so and offers a JSON export/import instead.

### 2.2 Headless Runner, Build and Tests

| Item | Minimum | Recommended |
|---|---|---|
| Node.js | 18 | 22 |
| Operating system | Linux, macOS, Windows | any of the three (all CI-tested) |
| Disk | 200 MB including `node_modules` | — |

**Development dependencies** (installed by `npm ci`):

| Package | Version | Needed for |
|---|---|---|
| jsdom | ^24 | headless runner, pipeline tests |
| jszip | ^3.10 | reading the exported project in tests and the regression script |
| docx | ^9 | generating `examples/sample_manuscript.docx` |

### 2.3 Compiling the Exported Project

| Item | Requirement |
|---|---|
| TeX distribution | TeX Live 2022+ (full scheme recommended), MiKTeX or MacTeX |
| Engine | **XeLaTeX** — `pdflatex` fails on the Unicode symbols GalleyTeX passes through; the bundled `latexmkrc` selects XeLaTeX automatically |
| Packages | `acmart` dependencies (libertine, newtxmath, …) plus `tabularx`, `multirow`, `xltabular`, `placeins`, `float` |
| Chinese text | `xeCJK` and one of *Noto Serif CJK SC*, *SimSun*, *Songti SC*; loaded only when present |

XeLaTeX is only needed to compile; conversion itself needs no TeX installation.

---

## 3. Installation

### 3.1 Browser Tool

No installation. Download `galleytex_studio.html` from the latest GitHub release and double-click it, or open it from the browser's File menu.

### 3.2 From Source

```bash
git clone https://github.com/SHELLY000/wordtolatexZL
cd wordtolatexZL
npm ci
npm run build          # -> galleytex_studio.html
```

`npm run build` assembles the single-file app from `src/`, `vendor/` and `templates/`. The result is byte-for-byte reproducible from the same inputs.

### 3.3 Verify the Installation

```bash
npm test
# 35 tests: OMML unit tests, interface-string tests, pipeline test on
# examples/sample_manuscript.docx, regression test on a synthetic WordprocessingML manuscript

node scripts/headless_run.js galleytex_studio.html examples/sample_manuscript.docx out/
# out/ui_report.json  out/preview.html  out/project.zip
```

If `out/project.zip` is produced, the installation is complete. With TeX Live installed, `node scripts/regression.js examples/sample_manuscript.docx --compile` additionally compiles the project and reports the page count and the number of LaTeX errors (expected: 0).

### 3.4 Optional: Local Auto-Compile

`scripts/autocompile/` contains folder watchers that turn every exported ZIP into a real PDF:

| Platform | Files | Usage |
|---|---|---|
| Windows | `GalleyTeX-autocompile.bat` + `galleytex-autocompile.ps1` | Keep both in one folder, double-click the `.bat`; confirm the watched folder once (default *Downloads*). A ZIP or folder can also be dropped onto the `.bat`. |
| macOS / Linux | `galleytex-autocompile.sh` | `./galleytex-autocompile.sh` (watches `~/Downloads`) or `./galleytex-autocompile.sh paper-LaTeX-Project.zip` |

The watcher unpacks the ZIP into an ASCII-only build directory, runs `latexmk -xelatex`, opens the PDF, and on failure shows the first error lines and saves the full log next to the ZIP. Requires a TeX distribution with `xelatex` (and preferably `latexmk`).

---

## 4. Functional Modules

| Module | File | Purpose |
|---|---|---|
| Equation converter | `src/omml2latex.js` | OMML → LaTeX; placeholder injection into `document.xml` |
| Pre-processing | `src/app.js` → `preprocessDocx`, `styleMapFromStyles` | rewrite `document.xml` before mammoth; map template heading styles |
| Structure recovery | `src/app.js` → `parseAcademicDocument` and passes | title, authors, abstract, keywords, headings, captions, references |
| Review UI | `src/app.js` → `renderContentEditor`, `retagBlock`, `renderMathIn`, `updateChecks`; `src/i18n.js` | block editing, block-type selector, KaTeX rendering, checklist; interface strings |
| LaTeX generation | `src/app.js` → `buildLatex`, `nodeToLatex`, `tableToLatex`, `imageToLatex`, `linkCitations`, `mergeIntoTemplate` | acmart project |
| Export | `src/app.js` → `downloadLatexProject`, `prepareLocalPdf` | project ZIP, browser-printed PDF |
| Harness | `scripts/build.js`, `scripts/headless_run.js`, `scripts/regression.js` | bundle, headless conversion, batch statistics |

### 4.1 `omml2latex.js` — Equation Converter

Converts Office Math Markup (`<m:oMath>`) into LaTeX. Coverage:

| OMML element | LaTeX |
|---|---|
| `f` (fraction: bar, no bar, linear, skewed) | `\frac{}{}`, `\genfrac{}{}{0pt}{}{}{}`, `{}/{}`, `{}^{}\!/\!{}_{}` |
| `sSub`, `sSup`, `sSubSup`, `sPre` | `{x}_{i}`, `{x}^{2}`, `{x}_{i}^{2}`, `{}_{92}^{238}{U}` |
| `rad` (with or without degree) | `\sqrt{}`, `\sqrt[3]{}` |
| `nary` (∑ ∏ ∫ ∬ ∭ ∮ ⋃ ⋂ ⋁ ⋀ ⨁ ⨂ …) with `limLoc` | `\sum_{}^{}{}`, `\int\limits`, `\bigcup`, … |
| `d` (delimiters incl. separators) | `\left( … \middle| … \right)`; ⟨⟩ ⌊⌋ ⌈⌉ ‖ mapped |
| `m` (matrix) | `\begin{matrix} … \end{matrix}` |
| `acc` (accents), `bar`, `borderBox`, `phant`, `groupChr` | `\hat \tilde \bar \vec \dot \ddot …`, `\overline`/`\underline`, `\boxed`, `\phantom`, `\underbrace`/`\overbrace` |
| `limLow`, `limUpp`, `func` | `\lim_{}`, `\overset`, `\sin`, `\log`, …; unknown names → `\operatorname{}` |
| `eqArr` | `\begin{aligned} … \end{aligned}` |
| Run styles `sty` = b / bi / p, `scr` = script / fraktur / double-struck / sans-serif / monospace, `nor` | `\mathbf`, `\boldsymbol`, `\mathrm` (letters only), `\mathcal`, `\mathfrak`, `\mathbb`, `\mathsf`, `\mathtt`, `\text{}` |
| 55 Greek letters, ≈ 140 mathematical symbols, combining accents | control sequences |

Placement rules: an `oMathPara`, a paragraph that contains nothing but one equation, or an equation followed by a bare `(n)` is set as **display** math; an equation inside a table cell is always **inline** (`\[ \]` inside a `tabular` breaks the row). A trailing `(n)` becomes `\begin{equation}\tag{n}\label{eq:n}`, and the literal number — which Word often splits over several runs or a SEQ field — is removed. Plain Word text runs inside a formula and *normal text* runs are escaped for text mode (`\_`, `\%`, `\textbackslash{}`, …).

`prepareDocumentXml` replaces every equation in `document.xml` by a private-use placeholder run (`\uE000EQn\uE000`) so that mammoth keeps its position; the application later swaps the placeholder for `<span class="math">` holding the LaTeX source.

### 4.2 Pre-Processing

Before mammoth sees the file, `preprocessDocx` opens the `.docx` with JSZip and rewrites `word/document.xml`:

- every `<m:oMath>` is converted and replaced by a placeholder (§ 4.1)
- every native chart / SmartArt drawing (`<c:chart>`, `<dgm:relIds>`) becomes a `\uE000CHARTn\uE000` placeholder
- legacy OLE objects (`<w:object>`, i.e. Equation Editor 3.0 / MathType / WPS formulas) are counted

`styleMapFromStyles` reads `word/styles.xml` and maps every paragraph style that carries an outline level — directly or through the `basedOn` chain — to a heading tag (`h1`…`h6`), every style whose name contains *Caption* (or its Chinese equivalent) to `figcaption`, and every *Title*-like style to the paper title. This is what makes ACM's `Head1`/`Head2`/`Head3`, Springer's and IEEE's heading styles work without configuration.

### 4.3 Structure Recovery

`parseAcademicDocument` runs a sequence of passes over mammoth's HTML:

| Pass | What it does |
|---|---|
| `unwrapLayoutTables` | Journal templates that put the masthead or the abstract/keywords box in a table: cells containing *Abstract* / *Keywords* are unwrapped into paragraphs; masthead tables (ISSN, DOI, *Received*, *Article history* …) are dropped |
| `splitLabelledBreaks` | `…end of abstract.<br>Keywords: a; b` becomes two paragraphs so the label is seen |
| `fixRunInHeadings` | ACM run-in `Head3`: a "heading" that reads like a paragraph is demoted, or split at its bold lead-in |
| `promoteBoldHeadings` | A paragraph that is ≥ 90 % bold, ≤ 100 characters, without trailing punctuation, and either numbered (`2.1`, `I.`, `A.`) or a known section name (*Introduction*, *References*, *Acknowledgements* …) becomes a heading, tagged *inferred from bold* |
| Title scoring | The best candidate among the first 12 blocks (style, position, length, absence of affiliation words) |
| Labelled blocks | *Abstract*, *Keywords* / *Index Terms* / *Key words*, *CCS Concepts* (and their Chinese equivalents), with stop conditions (next label, first heading, a table) and length caps (6 000 / 400 characters) so a missing label never swallows the body |
| Front matter | Author lines are split into names, affiliation markers (superscripts, `*` `†` `‡` `§` `¶` `✉`), e-mails, ORCID iDs and affiliations; affiliations are split into institution / city / country with a country list; e-mails are matched to names |
| Plain headings | Un-styled paragraphs such as `2 Related Work`, `2.1 Data`, `IV. Results` or `Conclusion` become headings |
| Captions | `Fig. 1.` / `Figure 1:` / `Table 1:` / `TABLE I.` paragraphs (and their Chinese equivalents) adjacent to an image or table |
| Images | Each image is classified as inline formula image, display formula image (numbered or short-and-wide) or figure |
| References | Heading variants *References*, *Reference*, *Bibliography*, *Works Cited*, *Reference list* (and the Chinese equivalent); each following paragraph or list item is one entry |
| Footnotes | mammoth's footnote list is inlined next to its reference mark |

### 4.4 Review UI

- **One block per top-level element** (heading, paragraph, equation, table, figure, caption, list, reference entry), each with a label, an index, a type selector and an editable area. Edits are batched (200 ms) and written back to the document model.
- **Type selector** — heading level 1/2/3, paragraph, caption, reference entry. Retagging rebuilds the body.
- **Equations** — shown as LaTeX source on a light-blue background; the preview re-renders with KaTeX as you type, memoised per formula. A formula KaTeX cannot parse is outlined in red in the preview with the error as tooltip, and counted in the checklist; its source stays visible.
- **Author cards** — name, e-mail, ORCID (format and checksum validated), institution, city, country, corresponding flag; reorder / add / remove.
- **Checklist** (`updateChecks`) — 22 items covering metadata completeness, unconverted content, inferred headings, unmatched citations, missing countries and over-long fields; the *quality score* is the percentage of items passed (Appendix B).
- **Interface language** — every label, message and checklist line is taken from `src/i18n.js` (`t(key, vars)`); static markup carries `data-i18n` attributes. Switching language redraws the panel without losing the manuscript or pending edits. The chart-placeholder text embedded in the body is fixed at recognition time in the language then active.

### 4.5 LaTeX Generation

`buildLatex` walks the (edited) HTML and emits the body; `mergeIntoTemplate` fills the acmart skeleton.

| Element | LaTeX |
|---|---|
| Headings | Relative levels: the shallowest heading present becomes `\section`, the next `\subsection`, then `\subsubsection`, `\paragraph`; `\FloatBarrier` before every `\section`; *Acknowledgements* → `\begin{acks}`; *References* → `\begin{thebibliography}` |
| Paragraph text | `texText`: LaTeX specials escaped, ≈ 165 Unicode symbols mapped (Greek → `\ensuremath{\alpha}`, `≤` → `\leq`, `–` → `--`, curly quotes → `` `` '' ``, NBSP → `~`, full-width punctuation → ASCII), bare URLs → `\url{}` |
| Inline formatting | `\textbf`, `\textit`, `\textsuperscript`, `\textsubscript`, `\footnote`, `\href` |
| Lists | `itemize` / `enumerate` |
| Equations | `$…$`, `\[…\]`, `\begin{equation}\tag{n}\label{eq:n}`; labels made unique per export |
| Figures | `\begin{figure}[!htbp]` (or `[H]`) with `\includegraphics[width=…]` (natural width in pt, or `\linewidth` when ≥ 300 pt), `\caption`, `\Description`, `\label{fig:…}` |
| Inline / display formula images | `\raisebox{-0.35\height}{\includegraphics[height=…]}`; `\begin{equation}\includegraphics…` for numbered ones |
| Tables | `\begin{table}` + `tabularx` with ragged-right `X` columns; rowspan/colspan expanded to a grid → `\multirow{n}{=}{}` / `\multicolumn{n}{|l|}{}` / `\cline`; > 18 rows → `xltabular` in place; cell images → `\includegraphics[width=\linewidth,height≤120pt,keepaspectratio]` |
| Citations | `[n]`, `[a, b]`, `[a–b]` and `(Surname, 2024)` / `(Surname et al., 2024; Other and Third, 2023)` → `\cite{refN}` when the number is within range or surname + year match exactly one entry; never applied inside math, `\url`, `\includegraphics`, `\label`, `\ref`, `\cite` |
| Placeholders | `\fbox{\parbox{0.85\linewidth}{…}}` for WMF/EMF/GIF/BMP/TIFF/SVG images, native charts and OLE objects, with the caption if one was found |

Preamble (from `fixedTemplate`): `\documentclass[acmsmall]{acmart}` (final, single column) or `[manuscript,screen,review]` (submission with line numbers); `tabularx`, `multirow`, `xltabular`, `placeins`, `float`; relaxed float parameters; conditional `xeCJK` with font fallback; `\setcopyright`, `\copyrightyear`, `\acmYear`, `\acmDOI`, `\acmConference[short]{name}{dates}{location}`, `\acmISBN`, optional `\settopmatter{printfolios=true}`; `\title[short]{…}` with an automatic short title above 55 characters; `\author` / `\affiliation{\institution \city \country}` / `\email` / `\orcid` / `\correspondingauthor`; `\begin{abstract}`, `\ccsdesc`, `\keywords`, `\maketitle`.

### 4.6 Export

- **LaTeX project ZIP** — `<manuscript>-LaTeX-Project.zip` (Appendix E). Each distinct picture is stored once under `figures/`.
- **Local PDF** — the browser's print dialog on the paginated preview (US Letter). This is a *preview* rendering, not LaTeX output; use the auto-compile watcher or `latexmk` for the real PDF.
- **Float mode** — *LaTeX-optimised* (`[!htbp]`, same or next page, within the section) or *strict Word position* (`[H]`).

### 4.7 Harness

- `scripts/build.js` — bundles the app (§ 3.2).
- `scripts/headless_run.js` — loads the HTML in jsdom, fills the venue form, uploads one `.docx`, waits for recognition, captures the review-panel state as `ui_report.json`, the preview as `preview.html`, and the exported ZIP as `project.zip`.
- `scripts/regression.js` — runs the headless runner over a folder, counts what each `main.tex` contains, optionally compiles with `latexmk -xelatex`, and prints one CSV line per manuscript (§ 7.3).

---

## 5. API Reference

### 5.1 `omml2latex.js`

The module is UMD: `require("./src/omml2latex.js")` in Node, `window.OMML2LaTeX` in the browser.

```javascript
const O = require("./src/omml2latex.js");
const { JSDOM } = require("jsdom");
const w = new JSDOM("").window;
O.setDomImplementation({ DOMParser: w.DOMParser, XMLSerializer: w.XMLSerializer });
```

| Function | Description |
|---|---|
| `setDomImplementation({ DOMParser, XMLSerializer })` | Required in Node; the browser globals are picked up automatically |
| `ommlToLatex(node)` | LaTeX string for one `<m:oMath>` / `<m:oMathPara>` element |
| `convertParagraph(wP)` | `[{ id, latex, display, tag, node }]` for one `<w:p>` |
| `extractEquations(documentXml)` | `[{ id, latex, display, tag, wrapped, context }]` for a whole `document.xml`; `wrapped` is the equation with its `$…$` / `\[…\]` / `equation` wrapper, `context` the first 80 characters of surrounding text |
| `prepareDocumentXml(documentXml)` | `{ xml, equations }` — `document.xml` with every equation replaced by a placeholder run and, for numbered equations, the literal `(n)` removed |
| `wrapLatex(eq)` | The wrapper used by the two functions above |
| `PLACEHOLDER_RE` | `/\uE000EQ(\d+)\uE000/g` — matches the placeholders in text |
| `M_NS`, `W_NS` | The OMML and WordprocessingML namespace URIs |

Equation object:

| Field | Type | Meaning |
|---|---|---|
| `id` | number | 1-based index in document order |
| `latex` | string | LaTeX source without wrapper |
| `display` | boolean | display (`true`) or inline; always `false` inside table cells |
| `tag` | string \| null | The author's equation number, e.g. `"1"`, `"3a"`, `"2.1"` |

### 5.2 `scripts/headless_run.js`

```
node scripts/headless_run.js <app.html> <manuscript.docx> <outdir>
        [--conference "Name"] [--short "SHORT 2025"] [--year 2025]
        [--dates "November 21-23, 2025"] [--location "Wuhan, China"] [--isbn "979-8-…"]
        [--lang en|zh]
```

| Argument | Default |
|---|---|
| `app.html` | `galleytex_studio.html` next to the repository root |
| `manuscript.docx` | `examples/sample_manuscript.docx` |
| `outdir` | `./headless_out` |
| `--conference`, `--short`, `--year`, `--dates`, `--location`, `--isbn` | example venue values |
| `--lang` | `en` (default) or `zh`; language of the checklist and block labels in `ui_report.json` |

Outputs in `outdir`:

| File | Content |
|---|---|
| `ui_report.json` | `file`, `fileMeta`, `qualityScore`, `counts{sections, figures, tables, references}`, `checks[]` (prefixed `✓ ` / `! `), `title`, `abstract`, `keywords`, `authors[]` (`name, email, orcid, institution, city, country, corresponding`), `blocks[]` (`"<label> | <first 90 characters>"`) |
| `preview.html` | The rendered preview pane |
| `project.zip` | The exported LaTeX project |

Exit status 0 on success; 1 with the page's toast text on `stderr` if no project was produced. One JSON summary line (`file, score, counts, warnings`) is printed to `stdout`.

### 5.3 `scripts/regression.js`

```
node scripts/regression.js [dir-or-files...] [--compile] [--app galleytex_studio.html] [--out regression_out]
```

Default input: `tests/fixtures/`. Prints a CSV header and one line per manuscript:

| Column | Meaning |
|---|---|
| `file` | manuscript file name |
| `pages`, `latex_errors` | from the XeLaTeX log (only with `--compile`; blank otherwise; `HEADLESS_FAILED` if conversion failed) |
| `sections` | `\section` / `\subsection` / `\subsubsection` count |
| `display_eq`, `inline_eq` | display and inline equations in `main.tex` |
| `tables`, `multirow` | `table`/`xltabular` environments; `\multirow` cells |
| `figures`, `placeholders` | `figure` environments; placeholder boxes |
| `cites`, `bibitems` | `\cite` commands; `\bibitem` entries |
| `keywords_chars` | length of the keywords field (a large value means the body was swallowed) |
| `score`, `warnings` | checklist score; number of failed checklist items |

### 5.4 `scripts/build.js`

```
node scripts/build.js [outfile]        # default: galleytex_studio.html
```

Replaces `__STYLES__`, `__VENDOR_MAMMOTH__`, `__VENDOR_JSZIP__` and `__APP__` in `src/index.template.html`, and `__ACMART_TEMPLATE_B64__` in `src/app.js`. If `vendor/katex/` is absent the app still builds; equations are then shown as source in the preview.

### 5.5 `src/i18n.js`

```javascript
const I18N = require("./src/i18n.js");        // window.GalleyTeXI18N in the browser
I18N.setLanguage("zh");                       // "en" | "zh"; persisted in localStorage["galleytex-lang"]
I18N.t("checks.equations.ok", { n: 3 });      // the Chinese counterpart of "3 Word equations converted to LaTeX"
I18N.apply(document);                         // re-translate data-i18n / -placeholder / -title / -aria hooks
```

`DICT` holds both tables; `detect()` returns the stored choice or `"en"`; unknown keys fall back to English and then to the key itself.

### 5.6 `examples/make_sample.js`

Regenerates `examples/sample_manuscript.docx` with the `docx` package and injects one OMML equation into the result. Run it after changing the fixture; `tests/pipeline.test.js` asserts on its content.

---

## 6. Operation Guide

The interface opens in English; the two-button language switch in the page header (**EN** and the button labelled in Chinese) changes it to Simplified Chinese and back at any time without losing the manuscript. The three steps of the left-hand panel are **Import**, **Proofread** and **Export**; control names below are quoted as they appear in the English interface.

### 6.1 Step 1 — Import

1. **Venue details** — fill in once: full conference name, short name (e.g. `GAITDI 2026`), year, dates (`June 03--05, 2026`), location, ISBN, template variant (*acmsmall* — final single-column proceedings — or *manuscript* — submission version with line numbers), `\setcopyright` value (`acmlicensed`, `acmcopyright`, `rightsretained`, `cc`, `none`) and whether page numbers are printed in the final version (`printfolios=true`). Values are saved automatically as you type; **Save now** saves explicitly, **Restore defaults** resets the form, and **Download venue settings** / **Import venue settings** export or import the settings as a JSON file — for machines where browser storage is blocked, or for sharing one configuration across an editorial team.
2. **Upload the Word document** — drop or choose the `.docx` (at most 30 MB). Recognition takes a few seconds; the file card then shows the size and word count and a toast confirms that recognition finished.
3. Click **Recognise and proofread**.

### 6.2 Step 2 — Proofread

**Paper metadata** — check the title, the author cards (name, e-mail, ORCID, institution, city, country, *corresponding author* flag), the abstract, the keywords, the paper's DOI, and the CCS concepts (pick from the grouped list with a significance of 500 / 300 / 100, or paste the code generated by the ACM CCS tool under *Advanced*).

**Body proofreading** — every block is listed with a type label:

| Block label | Content | What you can do |
|---|---|---|
| Section heading / Section heading (inferred from bold text — please confirm) | heading | edit the text; change the level or turn it into a paragraph with the drop-down |
| Body paragraph | paragraph | edit rich text; change it into a heading / caption / reference entry |
| Equation (LaTeX, editable) / Paragraph with equations | equation, or paragraph containing equations | edit the LaTeX source directly; the preview re-renders, errors are outlined in red |
| Table | table | edit cell text (merged cells and cell images are handled on export) |
| Figure / Figure or caption / Caption | figure and its caption | edit the caption text |
| Chart placeholder | native Word chart | leave it, or replace the chart by a PNG in Word and upload again |
| Paragraph with formula images | legacy formula pictures | — (exported as images or placeholders) |
| List | bulleted or numbered list | edit the items |
| Reference entry | one bibliography entry | edit; in-text `[n]` and (Author, year) citations are linked on export |

**Recognition summary** — counts of sections, figures, tables and references, the quality score, and the checklist (Appendix B). Work through every item marked `!`; most are one click away.

Click **Confirm and export**. Pending edits are flushed automatically.

### 6.3 Step 3 — Export

- **Download the complete LaTeX project (ZIP)** — the project described in Appendix E.
- **Generate a local PDF** — opens the browser's print dialog for the preview; choose *Save as PDF*. This is an approximation; the authoritative layout comes from XeLaTeX.
- **Figure and table placement** — *LaTeX-optimised* (`[!htbp]`, default) or *Keep the Word position* (`[H]`).

### 6.4 Compile

```bash
unzip paper-LaTeX-Project.zip -d paper && cd paper
latexmk main.tex            # latexmkrc selects XeLaTeX
# or: xelatex main.tex; xelatex main.tex
```

TeXstudio / TeXworks: open `main.tex` and select **XeLaTeX** as the engine. With the auto-compile watcher (§ 3.4) running, the PDF opens by itself a few seconds after the download.

`WORD-CONVERSION-NOTES.txt` inside the project lists what to review before submission: equations, captions, linked citations, `multirow` tables and the rights block.

### 6.5 Writing the Word Manuscript for Best Results

1. Use Word's built-in *Heading 1 / 2 / 3* styles or the venue template's heading styles; do not merely bold a line.
2. Insert equations with *Insert → Equation* (OMML). Equation Editor 3.0, MathType and WPS formulas are OLE pictures and cannot be converted.
3. Paste charts as PNG; native Word charts contain no bitmap.
4. Write captions as `Figure 1: …` / `Table 1: …` immediately next to the figure or table.
5. Label the front matter: `Abstract:`, `Keywords:`, and put each author's name, affiliation and e-mail on their own lines.
6. Put references under a heading *References*, one entry per paragraph, numbered `[1]` … or in author–year style consistently.
7. Keep images as PNG/JPEG; avoid WMF/EMF/GIF/BMP/TIFF.

### 6.6 Batch Conversion

```bash
node scripts/regression.js submissions/ --compile --out build/ | tee submissions.csv
```

Each manuscript ends up in `build/<name>/` with `ui_report.json`, `preview.html`, `project.zip`, the unpacked `proj/` and — with `--compile` — `main.pdf` and `main.log`. The CSV columns are described in § 5.3; `warnings` and `latex_errors` are the two columns to sort by.

---

## 7. GalleyTeX Studio (Browser Tool)

### 7.1 Opening the Tool

Double-click `galleytex_studio.html`, or open it from the browser's File menu. No installation, no server, no command line, and no network connection is required. **All processing happens locally in the browser; nothing is uploaded anywhere** — the page header carries a permanent reminder to that effect.

### 7.2 Layout

| Area | Content |
|---|---|
| Header | product name, the privacy reminder *Processed locally — nothing is uploaded*, and the language switch (**EN** / Chinese) |
| Left panel — three steps | *Import* → *Proofread* → *Export*; the current step's form; **Back** and the step button (*Recognise and proofread* → *Confirm and export* → *Back to proofreading*) |
| Right panel — paginated template preview | US Letter pages in the chosen acmart variant: running head, title block, abstract, CCS, keywords, ACM reference format line, body with rendered equations, footnotes collected per page, rights block on page 1; zoom 50–114 % |
| Toast | short status messages (recognition finished, file downloaded, errors) |

The preview re-paginates 120 ms after the last change and is re-typeset only when the body actually changed; metadata edits touch the front matter only.

### 7.3 What Is Remembered

| Data | Where | Lifetime |
|---|---|---|
| Venue settings | `localStorage` key `ei-typesetter-conference-v1` | until cleared; also exportable as JSON |
| Chosen CCS concepts | `localStorage` key `ei-typesetter-ccs-v1` | until cleared |
| Interface language | `localStorage` key `galleytex-lang` | until cleared; English when absent |
| The manuscript, edits, images | page memory only | lost on reload — export before closing |

### 7.4 Accuracy Relative to the Headless Runner

Identical by construction: the headless runner loads the same HTML file in jsdom and drives the same DOM. The only differences are environmental — jsdom has no image decoder, so the runner reads PNG dimensions from the file header and assumes 600 × 400 px for other formats when sizing `\includegraphics`.

### 7.5 When to Use the Headless Runner Instead

- Converting many manuscripts at once, or on a server without a browser
- Producing the CSV statistics used for validation and CI
- Compiling with XeLaTeX as part of the same run (`--compile`)

---

## 8. Validation and Accuracy

### 8.1 Real Manuscripts

Seven real conference/journal manuscripts (economics and education; English with occasional Chinese) were converted with the original single-file tool (0.1.0) and with 0.2.0. They cannot be redistributed; `validation_results/` records what made each one difficult and the measurements before and after.

| Manuscript | Word heading style | Equations | Tables | Special content |
|---|---|---|---|---|
| m01 | ACM template, automatic numbering | 39 OMML (23 display, 16 inline, many inside table cells) | 5, merged cells | — |
| m02 | built-in Heading 1/2, typed `I.` / `A.` numbers | — | 1 | 3 footnotes |
| m03 | built-in Heading 1/2, typed `2.1` numbers | — | 1 | author–year (APA) citations |
| m04 | ACM template, typed numbers | 1 OMML | 5, 19 vertical merges | Chinese characters in references |
| m05 | ACM template, automatic numbering | 3 Equation Editor 3.0 OLE objects | 5, 41 vertical merges | — |
| m06 | none — bolded paragraphs | — | 3 | 1 native chart; heading *Reference* |
| m07 | none — bold paragraphs with roman numerals | — | 3 data + 2 layout tables | published-journal template: masthead and abstract in tables |

| Metric | 0.1.0 | 0.2.0 |
|---|---|---|
| Manuscripts compiling with XeLaTeX, 0 errors | 5 / 7 | **7 / 7** |
| Section headings recovered (m01, m05, m06, m07) | 2, 2, 16, 1 | 19, 23, 35, 23 |
| Word equations converted (m01, m04) | 0 / 40 | **40 / 40** |
| Merged cells rendered with `\multirow` | 0 | 23 |
| In-text citations linked to `\cite` | 0 | 94 |
| Keywords field of m06 | 10 292 characters (the paper body) | 84 |
| Unconvertible content (WMF / OLE / charts) | build fails | placeholder box, build succeeds, author warned |

`validation_results/manuscripts_v0.2.0.csv` is the direct output of `node scripts/regression.js <folder> --compile`.

### 8.2 Equation Conversion Against Pandoc

The 39 equations of m01 were also converted with Pandoc. After normalisation the two agree in 29 cases; the remaining 10 are runs the author set upright in Word, which GalleyTeX keeps as `\mathrm{}` and Pandoc ignores.

### 8.3 Regression Tests

`npm test` runs 35 tests on every push, on three operating systems and three Node versions:

| Suite | Cases | What is checked |
|---|---|---|
| `tests/omml2latex.test.js` | 28 | one case per OMML construct (fraction, scripts, radicals, n-ary, delimiters, matrix, accents, limits, functions, run styles, arrays, escapes); numbered equations; table-cell inlining; placeholder injection; text-mode escaping; split equation numbers |
| `tests/pipeline.test.js` | 1 | build the app, convert `examples/sample_manuscript.docx` headlessly, assert title, authors, corresponding flag, country, keywords, `\section`/`\subsection`, `\tag{1}`, `\frac`/`\sum`, `\multirow`, captions, `\cite{ref1}`, `\cite{ref2,ref3}`, three `\bibitem`s, the exported figure and the bundled `acmart.cls` |
| `tests/regressions.test.js` | 1 | a synthetic manuscript written as raw WordprocessingML covering the 0.2.1 fixes: backslash escaping, `[n]` inside math, text runs inside formulas, split equation numbers, images in table cells, figure de-duplication and label uniqueness, URLs in the abstract |
| `tests/i18n.test.js` | 5 | English is the default; both string tables have the same keys and the same `{placeholders}`; every `data-i18n` hook in the template and every `t("key")` in the application resolves |

A fourth CI job installs TeX Live, compiles the example project with XeLaTeX and fails on any LaTeX error.

### 8.4 Scope and Limitations

- The bundled template is ACM `acmart`. The body generator is template-agnostic, but the front-matter macros (`\acmConference`, `\affiliation`, `\ccsdesc`, `acks`) are ACM's; other venues need a template module.
- Equation Editor 3.0 / MathType / WPS formulas are OLE pictures, not OMML: exported as placeholders (an MTEF parser or server-side WMF rendering is planned).
- Native Word charts and SmartArt contain no bitmap: placeholders.
- References are exported as `thebibliography` in the author's own formatting; the bundled `ACM-Reference-Format.bst` is not applied automatically.
- Heading promotion from bold text and the paragraph-level title / abstract / keywords recognition are heuristics; the checklist flags the cases that need confirmation.
- The preview paginates by top-level block; a single block taller than a page (a very long table) overflows the preview page. It does not affect the LaTeX output.
- Chinese and other CJK text requires `xeCJK` and a CJK font on the compiling machine.
- Title and abstract are plain-text fields: equations inside them are not preserved.

---

## 9. Troubleshooting

### 9.1 "The document could not be read" After Upload

**Cause:** the file is not a valid `.docx` (a `.doc`, a renamed PDF, a password-protected document), or it is corrupted.

**Fix:** open it in Word and *Save as → Word Document (.docx)* without a password; remove the encryption first.

### 9.2 "The file exceeds 30 MB"

**Cause:** embedded images are too large.

**Fix:** in Word, *File → Info → Compress Pictures* (or reduce to 220 ppi), then save. Figures for a conference paper rarely need more than 300 ppi at their printed size.

### 9.3 Headings Appear as Paragraphs

**Cause:** the author bolded the lines instead of applying heading styles, and the lines are not numbered or not among the known section names, so the conservative promotion rule did not fire.

**Fix:** in the review panel, set the block's type to *Level-1 / 2 / 3 heading* with the drop-down; or apply *Heading 1–3* in Word and re-upload. Headings that *were* promoted from bold text are labelled *inferred from bold text* — confirm their level.

### 9.4 An Equation Is Outlined in Red

**Cause:** the converted LaTeX does not parse (typically an unbalanced brace after editing, or a construct KaTeX does not know).

**Fix:** hover the equation in the preview to read the error; correct the source in the block. The count of unparsable equations is in the checklist. Note that some valid LaTeX (e.g. certain `\operatorname` uses) is rejected by KaTeX but accepted by XeLaTeX — the export is unaffected.

### 9.5 Checklist: "N MathType / Equation Editor 3.0 objects"

**Cause:** the formulas are Equation Editor 3.0 / MathType / WPS OLE objects; Word stores only a WMF preview picture.

**Fix:** re-enter them with *Insert → Equation* (Word can convert some with *Equation Options → Convert*), or paste each as PNG. Until then the project compiles with a placeholder box at each position.

### 9.6 Checklist: "N native Word charts" or "N EMF/WMF/GIF/BMP images"

**Cause:** no bitmap for charts; XeLaTeX cannot read metafiles / GIF / BMP.

**Fix:** save each chart or image as PNG in Word and replace it, or drop the PNG into `figures/` of the exported project and replace the `\fbox{…}` placeholder in `main.tex`. The original EMF/WMF files are included in `figures/` so they can be converted with LibreOffice or Inkscape.

### 9.7 Checklist: "N in-text citations could not be matched"

**Cause:** a `[n]` beyond the number of recognised references, a range wider than 20, or an author–year citation whose surname + year does not match exactly one entry (typos, different transliteration, two papers by the same author in the same year without `a`/`b`).

**Fix:** check that every reference entry was recognised (the *References* count in the recognition summary); retag missed entries with the drop-down; harmonise spelling. Unmatched citations are exported as plain text, so the project still compiles.

### 9.8 Abstract or Keywords Contain the Paper Body

**Cause:** the *Keywords:* label was missing or misspelt, so the block ran on until the length cap; the checklist reports that the abstract or keywords field is over-long.

**Fix:** trim the field in the review panel, or add the labels in Word and re-upload. The caps (6 000 / 400 characters) prevent the whole body from being lost.

### 9.9 Checklist: "N authors without a country"

**Cause:** `acmart` requires `\country{}` for every affiliation; the affiliation line had no recognisable country and the e-mail domain gave no hint.

**Fix:** fill in the *Country* field of the author card.

### 9.10 Venue Settings Are Not Saved

**Cause:** the browser blocks `localStorage` for local files (private windows, some hardened profiles); the status line under the venue form says that browser storage is unavailable.

**Fix:** enter the settings and click **Download venue settings**; next time, load the JSON with **Import venue settings**. Or serve the file from any local web server.

### 9.11 The Compiled PDF Differs From the Preview

**Expected.** The browser preview approximates acmart's layout for proofreading; line breaks, float placement and page count come from XeLaTeX. Use the auto-compile watcher (§ 3.4) to see the real PDF within seconds of each export.

### 9.12 `pdflatex` Fails With "Unicode character … not set up"

**Cause:** the project was compiled with pdfLaTeX.

**Fix:** use XeLaTeX: `latexmk main.tex` (the bundled `latexmkrc` selects it), `build.sh` / `build.bat`, or choose XeLaTeX in the editor. With plain `xelatex` and an incomplete TeX Live, missing `libertine` / `newtxmath` fonts silently drop glyphs — install the full scheme.

### 9.13 Chinese Characters Are Missing in the PDF

**Cause:** `xeCJK` is not installed, or none of *Noto Serif CJK SC*, *SimSun*, *Songti SC* is available.

**Fix:** install `xeCJK` (TeX Live collection `collection-langchinese`) and a CJK font; the preamble loads them automatically when present.

### 9.14 A Figure or Table Is Far From Its Text

**Cause:** the default `[!htbp]` placement lets LaTeX move floats within the section.

**Fix:** choose *Keep the Word position* in the export panel (`[H]`); accept possible white space at page ends.

### 9.15 Headless Runner: "no project zip captured"

**Cause:** recognition failed (see the toast text printed to `stderr`), or the manuscript exceeds the limits above.

**Fix:** run the same file in the browser to see the checklist; for a corrupted file see § 9.1. `regression.js` marks such files `HEADLESS_FAILED` and continues with the rest.

---

## 10. Support and Version Information

### 10.1 Contact

- **Repository:** https://github.com/SHELLY000/wordtolatexZL
- **Issue tracker:** https://github.com/SHELLY000/wordtolatexZL/issues

### 10.2 Version

- **Current version:** 0.2.2
- **Released:** 2026-09-09
- **License:** MIT (bundled components: mammoth.js BSD-2-Clause, JSZip MIT, KaTeX MIT, acmart LPPL 1.3c — see `vendor/LICENSES.md`)

### 10.3 Authors

| Name | Affiliation |
|---|---|
| Li Zhou (maintainer, contact) | School of Economics, Wuhan Business University, Wuhan 430056, Hubei, China — 20200122@wbu.edu.cn — ORCID 0000-0002-4024-2552 |

### 10.4 Citation

If you use GalleyTeX in published work, please cite both the software and the accompanying SoftwareX article once it is published. Machine-readable metadata is in `CITATION.cff`.

### 10.5 Testing

```bash
npm test
```

Continuous integration runs the suite on Ubuntu, Windows and macOS across Node 18, 20 and 22, builds `galleytex_studio.html` as an artifact, and compiles the example project with XeLaTeX, failing on any LaTeX error.

---

## 11. Appendix

### A. Public API (`omml2latex.js`)

`ommlToLatex`, `convertParagraph`, `extractEquations`, `prepareDocumentXml`, `wrapLatex`, `setDomImplementation`, `PLACEHOLDER_RE`, `M_NS`, `W_NS`

Command-line entry points: `scripts/build.js`, `scripts/headless_run.js`, `scripts/regression.js`, `examples/make_sample.js`; npm scripts `build`, `test`, `regression`, `run`.

### B. Checklist Glossary

The recognition summary shows one line per check: `✓` passed, `!` needs attention. The quality score is the percentage of checks passed.

| Check (as reported when failing) | Meaning | Action |
|---|---|---|
| Template structure needs review | the LaTeX skeleton is invalid | cannot occur with the bundled template |
| Paper title missing | no title recognised | type it in |
| Author information missing | no author recognised | add an author card |
| No corresponding author — tick one | no card has the flag | tick *Corresponding author* on one card |
| Invalid ORCID | format or checksum wrong | correct it (16 digits, the last may be X) |
| Abstract too short or not recognised | fewer than 50 characters | paste the abstract |
| Keywords missing | field empty | add them, separated by `;` |
| Enter and save the venue name, year and ISBN | venue settings incomplete | complete the form in the Import step |
| Paper DOI not set | DOI field empty | optional before acceptance |
| No section headings detected | no heading at all | apply heading styles in Word or retag blocks |
| No reference list detected | no *References* heading | rename the heading or retag entries |
| N Word equations failed to convert / N equations with LaTeX syntax errors | OMML conversion threw / KaTeX cannot parse | edit the LaTeX in the block |
| N MathType / Equation Editor 3.0 objects | OLE formulas exported as placeholders | re-enter as OMML or paste PNG |
| N native Word charts | charts exported as placeholders | save as PNG |
| N EMF/WMF/GIF/BMP images | unsupported formats exported as placeholders | convert to PNG |
| N images inside table cells | embedded at cell width | check the size after compiling |
| N headings were inferred from bold text | promoted from bold paragraphs | confirm their level |
| N in-text citations could not be matched | left as plain text | see § 9.7 |
| N authors without a country / region | `\country{}` would be empty | fill in the country |
| The abstract or keywords field is over-long | a label was missed and the field ran on | trim or relabel |
| No CCS concepts selected | no `\ccsdesc` | pick concepts (ACM venues) or ignore |
| Chinese characters present | `xeCJK` will be loaded | make sure a CJK font is installed on the compiling machine |

### C. Repository Layout

```
wordtolatexZL/
├── galleytex_studio.html         # single-file offline app (build output)
├── src/
│   ├── app.js                  # application (IIFE)
│   ├── omml2latex.js           # OMML → LaTeX (UMD)
│   ├── i18n.js                 # interface strings, English / Chinese (UMD)
│   ├── styles.css
│   └── index.template.html     # page skeleton with __STYLES__ / __VENDOR_* / __APP__ slots
├── vendor/                     # mammoth.js, JSZip, KaTeX (+ fonts); LICENSES.md
├── templates/acmart-template.zip
├── scripts/
│   ├── build.js                # bundle
│   ├── headless_run.js         # jsdom driver
│   ├── regression.js           # batch CSV, optional --compile
│   └── autocompile/            # Windows / macOS / Linux folder watchers
├── examples/                   # sample_manuscript.docx and its generator
├── tests/                      # omml2latex, i18n, pipeline, regressions; fixtures/ (git-ignored .docx)
├── validation_results/         # seven real manuscripts, before/after CSVs
├── docs/                       # ARCHITECTURE.md, Chinese quick-reference manual
├── GalleyTeX_USER_MANUAL.md      # this manual
├── .github/workflows/ci.yml
├── package.json  package-lock.json
├── CHANGELOG.md  CITATION.cff  LICENSE  README.md  README_START_HERE.md
```

### D. Browser Compatibility (GalleyTeX Studio)

| Browser | Version | Support |
|---|---|---|
| Chrome | 105+ | Full |
| Edge | 105+ | Full |
| Firefox | 126+ | Full (121–125: preview zoom control inactive) |
| Safari | 16.4+ | Full |
| Internet Explorer | — | Not supported |

### E. Exported Project Layout

```
<manuscript>-LaTeX-Project.zip
├── main.tex                    # generated manuscript
├── acmart.cls                  # ACM template 2.20 and its files
├── ACM-Reference-Format.bst
├── acmauthoryear.bbx  acmauthoryear.cbx  acmnumeric.bbx  acmnumeric.cbx  acmdatamodel.dbx
├── acm-jdslogo.png  LICENSE  README
├── figures/word-figure-01.png … # one file per distinct picture (originals of unsupported formats included)
├── latexmkrc                   # $pdf_mode = 5 (XeLaTeX)
├── build.sh  build.bat         # latexmk -xelatex main.tex
└── WORD-CONVERSION-NOTES.txt   # what to review before submission
```

### F. Text Escaping Summary

| Input | LaTeX |
|---|---|
| `# $ % & _ { }` | `\# \$ \% \& \_ \{ \}` |
| `\` `^` `~` | `\textbackslash{}` `\textasciicircum{}` `\textasciitilde{}` |
| α … ω, Γ … Ω | `\ensuremath{\alpha}` … |
| ≤ ≥ ≠ ≈ ± × ÷ ∞ ∑ ∫ ∈ ⊂ ∪ → ⇒ … | `\ensuremath{\leq}` … |
| ² ³ ₁ ₂ | `\textsuperscript{2}` `\textsubscript{1}` |
| – — … “ ” ‘ ’ | `--` `---` `\ldots{}` `` ` `` `` '' `` `` ` `` `'` |
| NBSP, thin space, zero-width space, BOM | `~` `\,` (removed) |
| full-width punctuation (U+FF01–U+FF5E) and ideographic space | ASCII equivalents |
| `https://…` / `www.…` | `\url{…}` |

---

*GalleyTeX 0.2.2 · MIT License · Copyright © 2026 Li Zhou*
