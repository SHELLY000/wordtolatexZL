#!/usr/bin/env node
/*
 * Assemble the single-file offline app (galleytex_studio.html) from src/, vendor/ and templates/.
 * Usage: node scripts/build.js [outfile]
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const out = process.argv[2] || path.join(root, "galleytex_studio.html");

const template = read("src/index.template.html");
const templateZipB64 = fs.readFileSync(path.join(root, "templates/acmart-template.zip")).toString("base64");

// KaTeX is optional: if vendor/katex is present it is inlined (css + fonts as data URIs), otherwise
// equations are shown as LaTeX source in the preview.
let katexJs = "", katexCss = "";
const katexDir = path.join(root, "vendor/katex");
if (fs.existsSync(path.join(katexDir, "katex.min.js"))) {
  katexJs = fs.readFileSync(path.join(katexDir, "katex.min.js"), "utf8");
  katexCss = fs.readFileSync(path.join(katexDir, "katex.min.css"), "utf8").replace(/url\(fonts\/([^)]+\.woff2)\)/g, (m, file) => {
    const f = path.join(katexDir, "fonts", file);
    return fs.existsSync(f) ? "url(data:font/woff2;base64," + fs.readFileSync(f).toString("base64") + ")" : m;
  }).replace(/url\(fonts\/[^)]+\.(woff|ttf)\)/g, "url()");
}

const app = read("src/app.js").replace("__ACMART_TEMPLATE_B64__", () => templateZipB64);
const html = template
  .replace("__STYLES__", () => read("src/styles.css") + "\n" + katexCss)
  .replace("__VENDOR_MAMMOTH__", () => read("vendor/mammoth.browser.min.js"))
  .replace("__VENDOR_JSZIP__", () => read("vendor/jszip.min.js") + "\n" + katexJs)
  .replace("__I18N__", () => read("src/i18n.js"))
  .replace("__APP__", () => read("src/omml2latex.js") + "\n" + app);

fs.writeFileSync(out, html);
console.log("built", path.relative(root, out), (html.length / 1024).toFixed(0) + " KB", katexJs ? "(with KaTeX)" : "(without KaTeX)");
