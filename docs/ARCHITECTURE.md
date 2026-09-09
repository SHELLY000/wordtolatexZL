# Architecture

WordTeX is a single-page application (no server) plus a Node harness that drives the same page without a browser.

## Pipeline

1. **Pre-processing (`preprocessDocx`)** — the `.docx` is opened with JSZip. `word/document.xml` is rewritten:
   every `<m:oMath>` is converted with `omml2latex.js` and replaced by a placeholder run (`\uE000EQn\uE000`);
   every native chart / SmartArt drawing becomes a `\uE000CHARTn\uE000` run; OLE objects are counted.
   `word/styles.xml` is read to map every paragraph style with an outline level (directly or through the
   `basedOn` chain) to a heading tag, and every `*Caption` style to `figcaption`.
2. **mammoth.js** converts the patched document to HTML with that style map.
3. **Placeholder restoration** turns the placeholders into `<span class="math" data-display data-tag>` (text = LaTeX
   source) and `<span class="placeholder-chart">`.
4. **Structure passes (`parseAcademicDocument`)** — `unwrapLayoutTables` (journal masthead / abstract boxes),
   `splitLabelledBreaks` (`<br>Keywords:`), `fixRunInHeadings` (ACM run-in `Head3`), `promoteBoldHeadings`
   (numbered/roman/lettered bold paragraphs), title scoring, labelled blocks (abstract / CCS / keywords with
   stop conditions and length caps), front-matter author parsing, plain numbered headings, captions, references.
5. **Review panel** — one editable block per top-level element with a type label and a type selector; edits are
   written back to `state.bodyHtml` (batched, 200 ms; flushed before step changes and exports).
6. **Preview** — the body is re-rendered only when `state.bodyHtml` changed (metadata edits touch the front
   matter only); `renderMathIn` renders `span.math` with KaTeX, memoised per formula (errors are marked and
   counted, the source stays visible); the whole-body scans behind the checklist are cached in `bodyStats()`;
   the preview is paginated (debounced).
7. **LaTeX generation (`buildLatex`)** — `nodeToLatex` walks the HTML: headings (with `\FloatBarrier`), math spans
   (`$…$`, `\[…\]`, `\begin{equation}\tag{n}`), tables (`tableToLatex`: rowspan/colspan grid → `multirow` /
   `multicolumn` / `cline`, `xltabular` for long tables), figures (`[!htbp]` or `[H]`), footnotes, lists,
   images inside table cells (`\includegraphics` sized to the cell, no float), placeholders for unsupported
   images/charts, `thebibliography` from the reference list; `linkCitations` rewrites `[n]` / author–year
   citations to `\cite` outside math, `\url`, `\includegraphics`, `\label`, `\ref` and `\cite` arguments;
   `imageManifest` stores each distinct picture once and `uniqueLabel` keeps `\label{}`s unique; `mergeIntoTemplate` fills the acmart template
   (packages, float parameters, conditional `xeCJK`, short title, authors with inferred countries).
8. **Export** — the project ZIP contains `main.tex`, the acmart class files (decoded from the inlined base64 with
   `JSZip.loadAsync(…, { base64: true })`), figures, `latexmkrc` and build scripts.

## Invariants

- The exported project must compile: anything unconvertible becomes a visible placeholder, optional packages are
  loaded conditionally, mandatory macros are never empty.
- The author never sees a raw compiler error: the checklist names the problem and the block.
- Equations are stored as LaTeX source in the DOM so that editing, preview and export share one representation.

## Files

- `src/app.js` — application (IIFE); `src/omml2latex.js` — UMD module usable in Node and the browser.
- `scripts/build.js` — inlines `src/`, `vendor/` (mammoth, JSZip, KaTeX + fonts as data URIs) and the template zip.
- `scripts/headless_run.js` — jsdom driver used by the tests and the regression script.
