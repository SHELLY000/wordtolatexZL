# Regression fixtures

Drop real `.docx` manuscripts in this folder (they are git-ignored) and run

```bash
npm run regression            # headless conversion + main.tex statistics
node scripts/regression.js tests/fixtures --compile   # also compiles with XeLaTeX if latexmk is installed
```

The seven manuscripts used for the validation reported in `validation_results/` were conference
submissions and could not be redistributed; `examples/sample_manuscript.docx` is a synthetic
stand-in that exercises the same features (heading styles, an OMML equation, a merged-cell table,
a figure with caption, numeric citations, a reference list) and is used by `npm test`.
