// End-to-end: build the app, run it headlessly on examples/sample_manuscript.docx, inspect the exported main.tex.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const NodeZip = require("jszip");

const root = path.join(__dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wordtex-"));
const app = path.join(tmp, "app.html");

test("pipeline: build + headless conversion of the example manuscript", async () => {
  execFileSync(process.execPath, [path.join(root, "scripts", "build.js"), app], { stdio: "inherit" });
  execFileSync(process.execPath, [path.join(root, "scripts", "headless_run.js"), app, path.join(root, "examples", "sample_manuscript.docx"), tmp], { stdio: "inherit", timeout: 240000 });
  const report = JSON.parse(fs.readFileSync(path.join(tmp, "ui_report.json"), "utf8"));
  assert.equal(report.title, "A Sample Manuscript for WordTeX");
  assert.equal(report.authors.length, 2);
  assert.equal(report.authors[0].name, "Alice Author");
  assert.equal(report.authors[0].corresponding, true);
  assert.equal(report.authors[0].country, "China");
  assert.match(report.keywords, /Word to LaTeX/);
  const zip = await NodeZip.loadAsync(fs.readFileSync(path.join(tmp, "project.zip")));
  const tex = await zip.file("main.tex").async("string");
  assert.match(tex, /\\section\{Introduction\}/);
  assert.match(tex, /\\subsection\{Variables\}/);
  assert.match(tex, /\\begin\{equation\}\\tag\{1\}\\label\{eq:1\}\n\{y\}_\{i\}=\\alpha\+/);
  assert.match(tex, /\\frac\{1\}\{n\}\\sum_\{k=1\}\^\{n\}/);
  assert.match(tex, /\\multirow\{2\}\{=\}\{Controls\}/);
  assert.match(tex, /\\caption\{Variables used in the model\}/);
  assert.match(tex, /\\caption\{A placeholder figure\}/);
  assert.match(tex, /\\cite\{ref1\}/);
  assert.match(tex, /\\cite\{ref2,ref3\}/);
  assert.equal((tex.match(/\\bibitem/g) || []).length, 3);
  assert.ok(zip.file("figures/word-figure-01.png"), "figure exported");
  assert.ok(zip.file("acmart.cls"), "template bundled");
});
