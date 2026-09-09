# Changelog

## 0.2.2 — 2026-09-09

### Added
- **Bilingual interface.** The page opens in English; the **EN / 中文** switch in the header changes to Simplified
  Chinese and back at any time, without losing the manuscript or pending edits. The choice is stored in
  `localStorage["wordtex-lang"]`. All strings live in `src/i18n.js` (`t(key, vars)`, `data-i18n` hooks in the
  template); manuscript recognition understands both languages regardless of the interface language.
- `scripts/headless_run.js --lang en|zh` selects the language of the captured checklist and block labels.
- `tests/i18n.test.js`: both tables complete, placeholders consistent, every template hook and `t()` key defined.
- `WordTeX_USER_MANUAL.md`: full English user manual (requirements, installation, modules, API, operation guide,
  validation, troubleshooting, checklist glossary).

### Changed
- Product name in the interface is now *WordTeX*; the default venue details are unchanged.
- Chart placeholders embedded in the body take the language active at recognition time.

## 0.2.1 — 2026-09-09

Code review of the 0.2.0 bundle. Every item below is covered by `tests/regressions.test.js` (a synthetic
manuscript written as raw WordprocessingML) or by new cases in `tests/omml2latex.test.js`.

### Fixed
- `texEscape` escaped its own `\textbackslash{}`: any backslash in body text (`C:\path\file`) came out as
  `\textbackslash\{\}`. Backslashes are now parked in a sentinel until the brace pass is done.
- `linkCitations` rewrote `[n]` inside math: `\sqrt[3]{x}` became `\sqrt\cite{ref3}{x}`. Citation linking
  now skips `$…$`, `\[…\]`, `equation`/`align`/`gather`/`multline` environments and the arguments of `\url`,
  `\href`, `\includegraphics`, `\label`, `\ref` and `\cite`.
- Plain Word text runs (`<w:r>`) inside an OMML formula were dropped into `\text{}` verbatim, so `_`, `%`, `&`,
  `{}` broke the compile; "normal text" runs used math-only commands (`\backslash`, `\hat{}`) inside `\text{}`.
  Both now use text-mode escapes.
- A numbered equation whose "(1)" Word had split into several runs (`(`, `1`, `)`, a tab or a SEQ field) kept
  the literal number next to `\tag{1}`, so the preview showed "(1) (1)". All plain runs outside the math are
  now removed (runs that are not plain text, e.g. footnote references, are kept).
- Images inside table cells were deleted silently. They are kept as `\includegraphics[width=\linewidth,
  height=…,keepaspectratio]` (no float inside `tabularx`), listed in the checklist, and shown in the preview.
- Duplicate `\label{}`s: two equations tagged "(1)" or the same picture used twice produced multiply-defined
  labels; labels are now made unique per export. The same picture used several times is stored once in the ZIP.
- `resetWord` did not clear `charts`, `oleObjects`, `citeStats` and `equations`, so the checklist could show the
  previous manuscript's numbers after "remove file"; `state.floatMode` is now initialised.
- URLs in the abstract are wrapped in `\url{}` like URLs in the body.

### Changed
- The bundled acmart template is decoded with `JSZip.loadAsync(base64, { base64: true })` instead of
  `fetch("data:…")`, which fails under a strict Content-Security-Policy and in some `file://` contexts (and
  needed a `fetch` stub in the headless runner, now removed).
- Performance while proofreading: edits in the review panel are batched (200 ms) and flushed before step
  changes and exports; metadata keystrokes no longer re-render and re-typeset the whole body; KaTeX output is
  memoised per formula; the whole-body scans behind the checklist are cached per body; pagination is
  debounced at 120 ms instead of 20 ms.
- Failed KaTeX renders keep the LaTeX source visible in the preview (previously the span was emptied).

### Removed
- Dead code: `countWordEquations`, `downloadStandaloneHtml` (fetched a non-existent `styles.css`),
  `detectTemplateType`, `replaceAuthorArea`, `replaceDocumentBody`, `replaceLatexEnvironment`,
  `replaceLatexCommand`, `removeLatexCommand`, `countFollowingParagraphs`, the unused `flag` helper and a
  duplicate `¬` symbol entry.

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
