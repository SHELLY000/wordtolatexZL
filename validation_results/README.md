# Validation results

Seven real conference/journal manuscripts (economics, education; English with occasional Chinese) were run
through the tool before (v0.1.0) and after (v0.2.0) the changes described in `CHANGELOG.md`. The manuscripts
themselves are not redistributed; the file names describe what made each one difficult.

| Manuscript | Word heading style | Equations | Tables | Special content |
|---|---|---|---|---|
| m01 | ACM template, automatic numbering | 39 OMML (23 display, 16 inline, many inside table cells) | 5, merged cells | — |
| m02 | built-in Heading 1/2, IEEE-style "I." / "A." typed numbers | — | 1 | 3 footnotes |
| m03 | built-in Heading 1/2, "2.1" typed numbers | — | 1 | author–year (APA) citations |
| m04 | ACM template, typed numbers | 1 OMML | 5, 19 vertical merges | Chinese characters in references |
| m05 | ACM template, automatic numbering | 3 WPS/Equation Editor 3.0 OLE objects (WMF previews) | 5, 41 vertical merges | — |
| m06 | none — manually bolded paragraphs | — | 3 | 1 native Word chart; references heading "Reference" |
| m07 | none — bold paragraphs with roman numerals | — | 3 data + 2 layout tables | published-journal template: masthead and abstract in tables |

## Summary (v0.1.0 → v0.2.0)

| Metric | v0.1.0 | v0.2.0 |
|---|---|---|
| Manuscripts compiling with XeLaTeX, 0 errors | 5 / 7 | **7 / 7** |
| Section headings recovered (m01, m05, m06, m07) | 2, 2, 16, 1 | 19, 23, 35, 23 |
| Word equations converted to LaTeX (m01, m04) | 0 / 40 | **40 / 40** |
| Merged cells rendered with `\multirow` (m01, m04, m05) | 0 | 23 |
| In-text citations linked to `\cite` | 0 | 94 across the seven manuscripts |
| Keywords field for m06 | 10,292 characters (the paper body) | 84 |
| Unconvertible content (WMF/OLE/charts) | breaks the build | placeholder box, build succeeds, author warned |

`manuscripts_v0.2.0.csv` is the direct output of `node scripts/regression.js <folder> --compile`;
the baseline file was compiled from the same measurements taken on the original single-file tool.
