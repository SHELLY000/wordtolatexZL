#!/usr/bin/env node
/*
 * Run galleytex_studio.html without a browser (jsdom) on one .docx and capture what the app produced.
 *
 *   node scripts/headless_run.js <app.html> <manuscript.docx> <outdir> [--conference "Name" --short "SHORT" --year 2025] [--lang en|zh]
 *
 * Writes to <outdir>:
 *   ui_report.json   title / authors / abstract / keywords / checklist / block labels as shown in the review panel
 *   preview.html     the rendered preview pane
 *   project.zip      the exported LaTeX project (main.tex + acmart template + figures)
 *
 * This is the same code path a user exercises by hand, so it doubles as the regression harness (scripts/regression.js).
 */
const { JSDOM, VirtualConsole } = require("jsdom");
const NodeZip = require("jszip");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] || "").startsWith("--"));
const opt = (name, dflt) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : dflt; };
const HTML = positional[0] || path.join(__dirname, "..", "galleytex_studio.html");
const DOCX = positional[1] || path.join(__dirname, "..", "examples", "sample_manuscript.docx");
const OUT = positional[2] || "./headless_out";
const LANG = opt("lang", "en");           // interface language of the captured report (checklist, block labels)
fs.mkdirSync(OUT, { recursive: true });

function pngSize(dataUrl) {
  try { const b = Buffer.from(dataUrl.split(",")[1], "base64"); if (b.slice(1, 4).toString() === "PNG") return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; } catch (_) { /* ignore */ }
  return { w: 600, h: 400 };
}

const captured = [];
// Exporting the project clicks an <a download href="blob:…">; jsdom cannot navigate and reports
// "Not implemented: navigation (except hash changes)" with a stack trace on every single run, which reads
// like a failure in the CI log. Drop that one error and let every other page error through unchanged.
const virtualConsole = new VirtualConsole();
virtualConsole.sendTo(console, { omitJSDOMErrors: true });
virtualConsole.on("jsdomError", (error) => {
  if (/Not implemented: navigation/.test(error.message || "")) return;
  console.error("[page]", error.stack || error.message);
});
const dom = new JSDOM(fs.readFileSync(HTML, "utf8"), {
  runScripts: "dangerously",
  url: "http://localhost/",
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    // jsdom stalls the page's own JSZip streams, so the page gets Node's jszip with realm-safe buffers.
    const toBuf = (x) => (x instanceof Buffer ? x : Buffer.from(new Uint8Array(x)));
    const toPage = (ab) => { const u = new window.Uint8Array(ab.byteLength); u.set(new Uint8Array(ab)); return u.buffer; };
    const wrap = (z) => { const g = z.generateAsync.bind(z); z.generateAsync = async (o) => { const r = await g(o); return o && o.type === "arraybuffer" ? toPage(r) : r; }; return z; };
    const Wrapped = function () { return wrap(new NodeZip()); };
    // The bundled acmart template is handed over as a base64 string ({ base64: true }); uploads arrive as ArrayBuffers.
    Wrapped.loadAsync = async (data, options) => wrap(await NodeZip.loadAsync(typeof data === "string" ? data : toBuf(data), options));
    Object.defineProperty(window, "JSZip", { value: Wrapped, writable: false, configurable: false });
    window.TextDecoder = TextDecoder; window.TextEncoder = TextEncoder;
    window.print = () => {};
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.Image = class { constructor() { this.naturalWidth = 0; this.naturalHeight = 0; } set src(v) { this._src = v; const s = pngSize(v); this.naturalWidth = s.w; this.naturalHeight = s.h; setTimeout(() => this.onload && this.onload(), 0); } get src() { return this._src; } };
    window.URL.createObjectURL = (blob) => { captured.push(blob); return "blob:captured"; };
    try { window.localStorage.setItem("galleytex-lang", LANG); } catch (_) { /* storage unavailable */ }
    window.URL.revokeObjectURL = () => {};
  },
});
const { window } = dom;
const doc = window.document;
window.console.error = (...a) => console.error("[page]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (id) => (doc.getElementById(id) || {}).textContent || "";
const val = (id) => (doc.getElementById(id) || {}).value || "";

(async () => {
  await sleep(300);
  const set = (id, v) => { const el = doc.getElementById(id); if (el) { el.value = v; el.dispatchEvent(new window.Event("input", { bubbles: true })); el.dispatchEvent(new window.Event("change", { bubbles: true })); } };
  set("conferenceName", opt("conference", "Example International Conference on Research Software"));
  set("conferenceShort", opt("short", "EXAMPLE 2025"));
  set("conferenceYear", opt("year", "2025"));
  set("conferenceDates", opt("dates", "November 21-23, 2025"));
  set("conferenceLocation", opt("location", "Wuhan, China"));
  set("conferenceIsbn", opt("isbn", "979-8-4007-0000-0/25/11"));
  const saveBtn = doc.getElementById("saveConference"); if (saveBtn) saveBtn.click();

  const buf = fs.readFileSync(DOCX);
  const file = { name: path.basename(DOCX), size: buf.length, arrayBuffer: async () => { const u = new window.Uint8Array(buf.length); u.set(buf); return u.buffer; } };
  const input = doc.getElementById("fileInput");
  Object.defineProperty(input, "files", { value: { 0: file, length: 1, item: () => file }, configurable: true });
  input.dispatchEvent(new window.Event("change", { bubbles: true }));
  for (let i = 0; i < 300; i++) { await sleep(200); const btn = doc.getElementById("nextBtn"); if (btn && !btn.disabled && !/正在|recognising/i.test(text("fileMeta"))) break; }
  await sleep(1200);

  const report = {
    file: path.basename(DOCX),
    fileMeta: text("fileMeta"), qualityScore: text("qualityScore"),
    counts: { sections: text("sectionCount"), figures: text("figureCount"), tables: text("tableCount"), references: text("referenceCount") },
    checks: [...doc.querySelectorAll("#checkList .check-item")].map((n) => (n.classList.contains("warn") ? "! " : "✓ ") + n.textContent.trim().replace(/^[✓!]/, "")),
    title: val("titleInput"), abstract: val("abstractInput"), keywords: val("keywordsInput"),
    authors: [...doc.querySelectorAll("#authorEditor .author-card")].map((card) => { const g = (f) => { const el = card.querySelector('[data-field="' + f + '"]'); return el ? (el.type === "checkbox" ? el.checked : el.value) : undefined; }; return { name: g("name"), email: g("email"), orcid: g("orcid"), institution: g("institution"), city: g("city"), country: g("country"), corresponding: g("corresponding") }; }),
    blocks: [...doc.querySelectorAll("#contentEditor .content-block")].map((b) => { const label = b.querySelector("header b").textContent; const t = b.querySelector(".content-block-value").textContent.replace(/\s+/g, " ").trim(); return label + " | " + t.slice(0, 90) + (t.length > 90 ? "…" : ""); }),
  };
  fs.writeFileSync(path.join(OUT, "ui_report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(OUT, "preview.html"), "<meta charset=utf-8>" + (doc.getElementById("previewStage") || {}).innerHTML);

  doc.getElementById("downloadProject").click();
  for (let i = 0; i < 150 && !captured.length; i++) await sleep(200);
  if (!captured.length) { console.error("no project zip captured; toast:", text("toast")); process.exit(1); }
  fs.writeFileSync(path.join(OUT, "project.zip"), Buffer.from(await captured[0].arrayBuffer()));
  console.log(JSON.stringify({ file: report.file, score: report.qualityScore, counts: report.counts, warnings: report.checks.filter((c) => c.startsWith("!")).length }));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
