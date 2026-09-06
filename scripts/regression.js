#!/usr/bin/env node
/*
 * Regression run over a set of manuscripts.
 *
 *   node scripts/regression.js [dir-or-files...] [--compile] [--app wordtex_studio.html] [--out regression_out]
 *
 * For every .docx: run the app headlessly, unzip the exported project, count what main.tex contains, and (with --compile,
 * when latexmk/xelatex are installed) compile it and report errors and pages. Prints one CSV line per manuscript, which is
 * the format used in validation_results/manuscripts.csv.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const NodeZip = require("jszip");

const args = process.argv.slice(2);
const flag = (n) => args.includes("--" + n);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : d; };
const APP = path.resolve(opt("app", path.join(__dirname, "..", "wordtex_studio.html")));
const OUT = path.resolve(opt("out", "regression_out"));
const inputs = args.filter((a, i) => !a.startsWith("--") && !["app", "out"].includes((args[i - 1] || "").replace(/^--/, "")));
const targets = (inputs.length ? inputs : [path.join(__dirname, "..", "tests", "fixtures")]).flatMap((t) => fs.statSync(t).isDirectory() ? fs.readdirSync(t).filter((f) => /\.docx$/i.test(f)).map((f) => path.join(t, f)) : [t]);
if (!targets.length) { console.error("no .docx files found"); process.exit(1); }

const count = (s, re) => (s.match(re) || []).length;
console.log("file,pages,latex_errors,sections,display_eq,inline_eq,tables,multirow,figures,placeholders,cites,bibitems,keywords_chars,score,warnings");
(async () => {
  for (const docx of targets) {
    const dir = path.join(OUT, path.basename(docx, path.extname(docx)));
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const run = spawnSync(process.execPath, [path.join(__dirname, "headless_run.js"), APP, docx, dir], { encoding: "utf8" });
    if (run.status !== 0 || !fs.existsSync(path.join(dir, "project.zip"))) { console.log([path.basename(docx), "", "HEADLESS_FAILED"].join(",")); continue; }
    const summary = JSON.parse(run.stdout.trim().split("\n").pop());
    const zip = await NodeZip.loadAsync(fs.readFileSync(path.join(dir, "project.zip")));
    const proj = path.join(dir, "proj"); fs.mkdirSync(proj, { recursive: true });
    for (const name of Object.keys(zip.files)) { if (zip.files[name].dir) continue; const p = path.join(proj, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, await zip.files[name].async("nodebuffer")); }
    const tex = fs.readFileSync(path.join(proj, "main.tex"), "utf8");
    let pages = "", errors = "";
    if (flag("compile")) {
      try { execFileSync("latexmk", ["-xelatex", "-interaction=nonstopmode", "main.tex"], { cwd: proj, stdio: "ignore", timeout: 300000 }); } catch (_) { /* errors are read from the log */ }
      const log = fs.existsSync(path.join(proj, "main.log")) ? fs.readFileSync(path.join(proj, "main.log"), "latin1") : "";
      errors = count(log, /^!/gm); const m = /Output written on .*?\((\d+) page/.exec(log); pages = m ? m[1] : 0;
    }
    const kw = /\\keywords\{([\s\S]*?)\}\n/.exec(tex);
    console.log([path.basename(docx), pages, errors, count(tex, /\\(?:sub)*section\{/g), count(tex, /\\begin\{equation\}/g) + count(tex, /\\\[\n/g), count(tex, /\$[^$\n]+\$/g),
      count(tex, /\\begin\{(?:table|xltabular)\}/g), count(tex, /\\multirow/g), count(tex, /\\begin\{figure\}/g), count(tex, /\\fbox/g), count(tex, /\\cite\{/g), count(tex, /\\bibitem/g),
      kw ? kw[1].length : 0, summary.score.replace(/,/g, " "), summary.warnings].join(","));
  }
})();
