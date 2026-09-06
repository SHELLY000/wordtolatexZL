# Changelog

## 0.2.0 — 2026-09-06

Driven by a regression run over seven real manuscripts (see `validation_results/`). All seven now compile
with XeLaTeX and zero errors (previously 5/7).

### Added
- **Word equations (OMML) → LaTeX** (`src/omml2latex.js`): fractions, sub/superscripts, radicals, n-ary
  operators, delimiters, matrices, accents, functions, equation arrays, upright/bold/blackboard runs. Equations
  are placed back at their exact position (including inside table cells, where they are always inline) and
  numbered equations keep the author's number via `\tag`.
- **Equation proofreading**: equations appear as editable LaTeX source in the review panel and are rendered
  with a bundled KaTeX in the preview; syntax errors are highlighted and counted in the checklist.
- **Heading recovery from any template**: paragraph styles are mapped to heading levels by resolving
  `outlineLvl`/`basedOn` in `styles.xml` (ACM `Head1–3`, Springer, IEEE…), and manually bolded headings
  (`2.1 …`, `I. …`, `A. …`) are promoted with a conservative rule; run-in `Head3` paragraphs are demoted or split.
- **Block type selector** in the review panel (heading level / paragraph / caption / reference entry).
- **Merged table cells** rendered as `\multirow` / `\multicolumn` with `\cline`; ragged-right `X` columns;
  tables longer than 18 rows are emitted as `xltabular` so they break across pages in place.
- **Float placement**: `[!htbp]`, `\FloatBarrier` before every section, relaxed float parameters, and a
  "keep Word position ([H])" switch in the export panel.
- **Citation linking**: `[3]`, `[2, 5]`, `[4–6]` and `(Author et al., 2024)` become `\cite{refN}` when they
  match the recognised reference list.
- **Journal-template front matter**: abstract/keywords boxes and mastheads implemented as Word tables are
  unwrapped or dropped; `<br>`-separated `Keywords:` lines are split.
- **Always compiles**: WMF/EMF images, legacy equation-editor OLE objects and native Word charts become
  visible placeholder boxes at their original positions; `xeCJK` is loaded only when installed; a missing
  country is inferred from the e-mail domain; over-long metadata fields are capped; long titles get a
  running-head short title.
- Headless runner, regression script, unit and pipeline tests, CI workflow, example manuscript.
- Local auto-compile watchers (`scripts/autocompile/`, Windows PowerShell and macOS/Linux shell): every exported
  project ZIP is compiled with XeLaTeX and opened as a PDF; errors and the log are surfaced to the author.
- Full-width ASCII punctuation (`（`, `，`, `：`) is normalised, which also lets `(Bian，2024)`-style citations link.

### Fixed
- "(Corresponding author)" no longer pollutes author names; institution/city/country split uses a country list.
- `CCS CONCEPTS:` lines no longer merge into the abstract; keywords are a single paragraph.
- References heading variants (`Reference`, `Bibliography`, `Works Cited`); `TABLE I.` captions; roman and
  letter heading numbers are stripped; multi-line figure captions are joined.

### Changed
- The single HTML file is now built from `src/`, `vendor/` and `templates/` by `scripts/build.js`.

## 0.1.0

Original single-file offline tool: mammoth-based .docx import, ACM acmart template, metadata form,
block-by-block review panel, paginated preview, LaTeX project export.
