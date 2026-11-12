#!/usr/bin/env node
/*
 * Regression run over a set of manuscripts.
 *
 *   node scripts/regression.js [dir-or-files...] [--compile] [--app galleytex_studio.html] [--out regression_out]
 *
 * Convert each Word manuscript and print its results as CSV. With --compile, latexmk, XeLaTeX and pdfinfo
 * must be available. A failed conversion or requested compilation causes a nonzero exit after all rows are written.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const NodeZip = require("jszip");

const args = process.argv.slice(2);
const flag = (n) => args.includes("--" + n);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : d; };
const APP = path.resolve(opt("app", path.join(__dirname, "..", "galleytex_studio.html")));
const OUT = path.resolve(opt("out", "regression_out"));
const inputs = args.filter((a, i) => !a.startsWith("--") && !["app", "out"].includes((args[i - 1] || "").replace(/^--/, "")));
const targets = (inputs.length ? inputs : [path.join(__dirname, "..", "examples", "sample_manuscript.docx")]).flatMap((t) => fs.statSync(t).isDirectory() ? fs.readdirSync(t).filter((f) => /\.docx$/i.test(f)).map((f) => path.join(t, f)) : [t]);
if (!targets.length) { console.error("no .docx files found"); process.exit(1); }

const count = (s, re) => (s.match(re) || []).length;
const csv = (fields) => fields.map((field) => {
  const text = String(field);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}).join(",");

function compileProject(proj) {
  const build = spawnSync("latexmk", ["-norc", "-xelatex", "-no-shell-escape", "-halt-on-error", "-interaction=nonstopmode", "main.tex"], {
    cwd: proj, encoding: "utf8", timeout: 300000, maxBuffer: 5 * 1024 * 1024
  });
  fs.writeFileSync(path.join(proj, "latexmk.log"), [build.stdout, build.stderr, build.error?.message].filter(Boolean).join("\n"));
  const logPath = path.join(proj, "main.log");
  const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, "latin1") : "";
  const errors = log ? count(log, /^!/gm) : "";
  if (build.error) return { pages: "", errors, status: build.error.code === "ENOENT" ? "LATEXMK_NOT_FOUND" : "LATEXMK_EXEC_FAILED" };
  if (build.status !== 0 || errors > 0) return { pages: "", errors, status: "COMPILE_FAILED" };
  if (!log) return { pages: "", errors, status: "MISSING_LATEX_LOG" };
  if (!fs.existsSync(path.join(proj, "main.pdf"))) return { pages: "", errors, status: "MISSING_PDF" };
  const pdf = spawnSync("pdfinfo", ["main.pdf"], { cwd: proj, encoding: "utf8", timeout: 30000, env: { ...process.env, LC_ALL: "C" } });
  const pages = Number(/^Pages:\s+(\d+)\s*$/m.exec(pdf.stdout || "")?.[1]);
  if (pdf.error?.code === "ENOENT") return { pages: "", errors, status: "PDFINFO_NOT_FOUND" };
  if (pdf.status !== 0 || !(pages > 0)) return { pages: "", errors, status: "INVALID_PDF" };
  return { pages, errors, status: "OK" };
}

console.log("file,pages,latex_errors,sections,display_eq,inline_eq,tables,multirow,figures,placeholders,cites,bibitems,keywords_chars,score,warnings,status");
(async () => {
  for (const docx of targets) {
    const dir = path.join(OUT, path.basename(docx, path.extname(docx)));
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const run = spawnSync(process.execPath, [path.join(__dirname, "headless_run.js"), APP, docx, dir], { encoding: "utf8" });
    if (run.status !== 0 || !fs.existsSync(path.join(dir, "project.zip"))) {
      console.error(run.error?.message || run.stderr || `Conversion failed for ${path.basename(docx)}`);
      console.log(csv([path.basename(docx), ...Array(14).fill(""), "HEADLESS_FAILED"]));
      process.exitCode = 1;
      continue;
    }
    const summary = JSON.parse(run.stdout.trim().split("\n").pop());
    const zip = await NodeZip.loadAsync(fs.readFileSync(path.join(dir, "project.zip")));
    const proj = path.join(dir, "proj"); fs.mkdirSync(proj, { recursive: true });
    for (const name of Object.keys(zip.files)) { if (zip.files[name].dir) continue; const p = path.join(proj, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, await zip.files[name].async("nodebuffer")); }
    const tex = fs.readFileSync(path.join(proj, "main.tex"), "utf8");
    const { pages, errors, status } = flag("compile") ? compileProject(proj) : { pages: "", errors: "", status: "NOT_REQUESTED" };
    if (flag("compile") && status !== "OK") {
      console.error(`${path.basename(docx)}: ${status} (see ${path.join(proj, "latexmk.log")})`);
      process.exitCode = 1;
    }
    const kw = /\\keywords\{([\s\S]*?)\}\n/.exec(tex);
    console.log(csv([path.basename(docx), pages, errors, count(tex, /\\(?:sub)*section\{/g), count(tex, /\\begin\{equation\}/g) + count(tex, /\\\[\n/g), count(tex, /\$[^$\n]+\$/g),
      count(tex, /\\begin\{(?:table|xltabular)\}/g), count(tex, /\\multirow/g), count(tex, /\\begin\{figure\}/g), count(tex, /\\fbox/g), count(tex, /\\cite\{/g), count(tex, /\\bibitem/g),
      kw ? kw[1].length : 0, summary.score, summary.warnings, status]));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
