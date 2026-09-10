# WordTeX

Word (.docx) → LaTeX manuscript typesetting with author-in-the-loop proofreading, for
journals and conferences whose authors write in Word and whose production runs on LaTeX.

[![CI](https://github.com/SHELLY000/wordtolatexZL/actions/workflows/ci.yml/badge.svg)](https://github.com/SHELLY000/wordtolatexZL/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22692708.svg)](https://doi.org/10.5281/zenodo.22692708)

## Why

Most authors submitting to small conferences and starting journals write in Word and do not
know LaTeX. Editorial offices that typeset in LaTeX therefore either re-key manuscripts or
run a converter and hand-fix its output. Existing converters (Pandoc, Writer2LaTeX,
commercial add-ins) stop at a `.tex` file: they do not target a journal template, do not
tell the author what was lost, and give a non-LaTeX author nothing they can correct.

WordTeX closes that loop. It converts the manuscript in the browser, shows the author every
recognised block — headings, paragraphs, **equations as editable LaTeX**, tables, figures,
references — next to a template-formatted preview, lets them fix what the converter got wrong
without knowing LaTeX, and exports a project that **always compiles**: content it cannot
convert (legacy equation-editor objects, native Word charts, metafile images) becomes a
visible placeholder at the right position instead of a build error.

## Two ways to run it

| | For | How |
|---|---|---|
| **`wordtex_studio.html`** | Authors and editors, no install | Open the file in a browser. Everything runs locally; nothing is uploaded. |
| **`scripts/headless_run.js`** | Editorial platforms, batch runs, CI | `node scripts/headless_run.js wordtex_studio.html paper.docx out/` — same code path, no browser. |

The single HTML file is built from `src/`, `vendor/` and `templates/` (`npm run build`); it
bundles mammoth.js, JSZip, KaTeX and the ACM `acmart` template (see `vendor/LICENSES.md`).

## Install

Nothing to install for the web app: download `wordtex_studio.html` from the latest release
and open it. For the headless runner, tests and builds:

```bash
git clone https://github.com/SHELLY000/wordtolatexZL
cd wordtolatexZL && npm ci
npm run build        # -> wordtex_studio.html
npm test             # 35 unit, interface-string, pipeline and regression tests (needs Node 18+)
```

XeLaTeX (TeX Live) is only needed to compile the exported projects.

## Quick start

The full manual is `WordTeX_USER_MANUAL.md`. The interface is English by default; the **EN / 中文** switch
in the header changes it to Simplified Chinese.

1. Open `wordtex_studio.html`, fill in the conference/journal details once (they are remembered).
2. Upload the `.docx`. The left panel lists the recognised title, authors, abstract, keywords
   and every body block with its type; the right panel shows the template preview.
3. Correct anything that is wrong: edit text or LaTeX in a block, change a block's type with
   the drop-down (heading level / paragraph / caption / reference entry), fix author fields.
   The checklist tells you what still needs attention (unconverted objects, unmatched
   citations, headings inferred from bold text, missing countries, …).
4. Export the LaTeX project (`main.tex` + template + figures) and compile it with
   `latexmk main.tex` (XeLaTeX), or hand the ZIP to the editorial office.

**Local auto-compile.** `scripts/autocompile/` contains a Windows (`.bat` + PowerShell) and a
macOS/Linux (`.sh`) watcher: start it once, and every project ZIP the app saves to your
Downloads folder is unpacked, compiled with XeLaTeX and opened as a PDF — the real LaTeX
output, not the browser preview — with errors and the full log shown when compilation fails.
Requires TeX Live / MiKTeX / MacTeX with `xelatex`.

Headless:

```bash
node scripts/headless_run.js wordtex_studio.html examples/sample_manuscript.docx out/
#   out/ui_report.json  recognised metadata, checklist, block labels
#   out/project.zip     the LaTeX project
node scripts/regression.js my_manuscripts/ --compile      # one CSV line per manuscript
```

## How it works

```
.docx ──► pre-processing (JSZip)            ──► mammoth.js ──► HTML ──► structure passes ──► review panel
          • OMML equations → LaTeX placeholders                          • layout tables unwrapped         • editable blocks
          • native charts → placeholders                                 • heading styles by outline level • KaTeX preview
          • styles.xml → heading level map                               • bold headings promoted          • checklist
                                                                         • front matter / authors           │
                                                                         • captions, references             ▼
                                                                                                    LaTeX generator
                                                                                                    • acmart template
                                                                                                    • multirow tables
                                                                                                    • float placement
                                                                                                    • \cite linking
                                                                                                    • placeholders
```

| Module | File | What it does |
|---|---|---|
| Equation converter | `src/omml2latex.js` | OMML → LaTeX (fractions, scripts, radicals, n-ary, delimiters, matrices, accents, functions, arrays); placeholder injection into `document.xml` |
| Pre-processing | `src/app.js` → `preprocessDocx`, `styleMapFromStyles` | rewrites `document.xml`, maps template heading styles (`Head1`… → `h1`…) by `outlineLvl`/`basedOn` |
| Structure recovery | `src/app.js` → `parseAcademicDocument`, `promoteBoldHeadings`, `unwrapLayoutTables`, `fixRunInHeadings` | title/authors/abstract/keywords, headings from styles or bold text, journal layout tables, captions, references |
| Review UI | `src/app.js` → `renderContentEditor`, `retagBlock`, `renderMathIn`; `src/i18n.js` | block-by-block editing, type drop-down, KaTeX rendering with error marking; English / Chinese interface strings |
| LaTeX generation | `src/app.js` → `buildLatex`, `nodeToLatex`, `tableToLatex`, `imageToLatex`, `linkCitations` | acmart project with `multirow` tables, `xltabular` long tables, float control, `\cite` linking, placeholders |
| Build & test | `scripts/build.js`, `scripts/headless_run.js`, `scripts/regression.js`, `tests/` | single-file bundle, jsdom runner, regression CSV, unit/pipeline tests |
| Local auto-compile | `scripts/autocompile/` | folder watchers (Windows PowerShell, macOS/Linux shell) that compile every exported ZIP with XeLaTeX and open the PDF |

## Validation

Seven real manuscripts (economics and education; ACM Word template, built-in styles, manual
bold headings, a published-journal template) were converted before and after this version;
see `validation_results/`.

| | before (0.1.0) | after (0.2.0) |
|---|---|---|
| Compiles with XeLaTeX, 0 errors | 5 / 7 | 7 / 7 |
| Headings recovered on the four hard manuscripts | 2, 2, 16, 1 | 19, 23, 35, 23 |
| Word equations converted | 0 / 40 | 40 / 40 |
| Merged table cells rendered correctly | none | `\multirow` (23 cells) |
| In-text citations linked | 0 | 94 |

The 39 equations of the first manuscript agree with Pandoc's conversion in 29 cases after
normalisation; the remaining 10 are runs the author set upright in Word, which WordTeX keeps
as `\mathrm{}` and Pandoc ignores.

## Limitations

- Equation editor 3.0 / MathType / WPS OLE objects are not OMML; they are placed as placeholders
  (server-side WMF rendering or an MTEF parser are planned).
- Native Word charts have no bitmap in the file; they become placeholders.
- Heading promotion from bold text is a heuristic and is flagged for confirmation in the checklist.
- The bundled template is ACM `acmart`; other templates require a template module (the generator
  is template-agnostic, the front-matter macros are not).
- Chinese text needs `xeCJK` and a CJK font on the compiling machine; the preamble loads them
  only when present.

## Cite

See `CITATION.cff`. If you use WordTeX in a paper, please cite the software and the SoftwareX
article once it is published.

**Contact.** Li Zhou (corresponding author), School of Economics, Wuhan Business University,
Wuhan 430056, Hubei, China — 20200122@wbu.edu.cn — ORCID 0000-0002-4024-2552.

## License

MIT for WordTeX itself. Bundled third-party components keep their own licenses
(`vendor/LICENSES.md`); the ACM template is LPPL.
