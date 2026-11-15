const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const JSZip = require("jszip");
const CFB = require("../vendor/cfb.min.js");
const WpsEquations = require("../src/wps-equations.js");

const root = path.resolve(__dirname, "..");
const char = (text, face = 3) => {
  const code = text.charCodeAt(0);
  return [2, 128 + face, code & 255, code >> 8];
};
const line = (...children) => [1, ...children.flat(), 0];
const emptyLine = [0x11];
const template = (selector, variant, ...children) => [3, selector, variant, 0, ...children.flat(), 0];

function equationObject(children, version = 3) {
  const mtef = Buffer.from([version, 1, 1, 3, 0, 10, ...line(children), 0]);
  const header = Buffer.alloc(28);
  header.writeUInt16LE(28);
  header.writeUInt32LE(0x20000, 2);
  header.writeUInt32LE(mtef.length, 8);
  const cfb = CFB.utils.cfb_new();
  CFB.utils.cfb_add(cfb, "Equation Native", Buffer.concat([header, mtef]));
  return CFB.write(cfb, { type: "buffer" });
}

test("WPS Equation Native preserves integral limits and stretched bracket glyphs", () => {
  const lower = template(21, 1, line(char("x")), line(char("0", 8)), emptyLine, char("∫", 6));
  const both = template(21, 2, line(char("x")), line(char("1", 8)), line(char("0", 8)), char("∫", 6));
  const bracket = template(3, 0, line(char("a")));
  const slanted = template(41, 0, line(char("a")), line(char("b")));
  assert.equal(WpsEquations.toLatex(equationObject(lower)), "\\int_{0}{x}");
  assert.equal(WpsEquations.toLatex(equationObject(both)), "\\int_{0}^{1}{x}");
  assert.equal(WpsEquations.toLatex(equationObject([...bracket, ...char("[", 22), ...char("]", 22)])), "\\left[ a \\right]");
  assert.equal(WpsEquations.toLatex(equationObject(slanted)), "{}^{a}\\!/\\!{}_{b}");
  assert.throws(() => WpsEquations.toLatex(equationObject(char("x"), 5)), /MTEF v3/);
});

test("pipeline: WPS equations and OMML export together, with a fallback for an unsupported WPS object", async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "galleytex-wps-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const app = path.join(tmp, "app.html");
  const docx = path.join(tmp, "wps-and-word.docx");
  const zip = await JSZip.loadAsync(fs.readFileSync(path.join(root, "examples", "sample_manuscript.docx")));
  const documentPath = "word/document.xml";
  const relsPath = "word/_rels/document.xml.rels";
  const typesPath = "[Content_Types].xml";
  const object = (n) => '<w:object><v:shape><v:imagedata r:id="rIdWpsPreview"/></v:shape>' +
    '<o:OLEObject ProgID="Equation.KSEE3" Type="Embed" r:id="rIdWps' + n + '"/></w:object>';
  const paragraphs = '<w:p><w:r><w:t xml:space="preserve">Before </w:t>' + object(1) +
    '<w:t xml:space="preserve"> after.</w:t></w:r></w:p>' +
    '<w:p><w:r>' + object(1) + '</w:r><w:r><w:t>(2)</w:t></w:r></w:p>' +
    '<w:p><w:r>' + object(2) + '</w:r><w:r><w:t>(3)</w:t></w:r></w:p>';
  const xml = (await zip.file(documentPath).async("string")).replace(/<w:p><m:oMath(?=[\s>])/, paragraphs + "$&");
  assert.ok(xml.includes(paragraphs));
  zip.file(documentPath, xml);
  const relationship = (id, kind, target) => '<Relationship Id="' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/' +
    kind + '" Target="' + target + '"/>';
  zip.file(relsPath, (await zip.file(relsPath).async("string")).replace("</Relationships>",
    relationship("rIdWps1", "oleObject", "embeddings/formula.bin") +
    relationship("rIdWps2", "oleObject", "embeddings/unsupported.bin") +
    relationship("rIdWpsPreview", "image", "media/equation.wmf") + "</Relationships>"));
  zip.file(typesPath, (await zip.file(typesPath).async("string")).replace("</Types>",
    '<Default Extension="wmf" ContentType="image/x-wmf"/>' +
    '<Default Extension="bin" ContentType="application/vnd.openxmlformats-officedocument.oleObject"/></Types>'));
  const fraction = template(14, 0, line(char("a")), line(char("b")));
  const sub = template(15, 1, line(char("i")), emptyLine);
  zip.file("word/embeddings/formula.bin", equationObject([...char("x"), ...sub, ...char("=", 6), ...fraction]));
  zip.file("word/embeddings/unsupported.bin", equationObject(char("x"), 5));
  zip.file("word/media/equation.wmf", Buffer.from("0100090000030c0000000000030000000000030000000000", "hex"));
  fs.writeFileSync(docx, await zip.generateAsync({ type: "nodebuffer" }));

  execFileSync(process.execPath, [path.join(root, "scripts", "build.js"), app], { timeout: 30000 });
  execFileSync(process.execPath, [path.join(root, "scripts", "headless_run.js"), app, docx, tmp], { timeout: 30000 });
  const report = JSON.parse(fs.readFileSync(path.join(tmp, "ui_report.json"), "utf8"));
  assert.ok(report.checks.some((check) => /3 Word equations converted to LaTeX/.test(check)));
  assert.ok(report.checks.some((check) => /1 embedded OLE objects could not be converted/.test(check)));
  const project = await JSZip.loadAsync(fs.readFileSync(path.join(tmp, "project.zip")));
  const tex = await project.file("main.tex").async("string");
  assert.match(tex, /Before\s+\$\{x\}_\{i\}=\\frac\{a\}\{b\}\$\s+after\./);
  assert.match(tex, /\\begin\{equation\}\\tag\{1\}/);
  assert.match(tex, /\\begin\{equation\}\\tag\{2\}\\label\{eq:2\}\n\{x\}_\{i\}=\\frac\{a\}\{b\}/);
  assert.equal((tex.match(/legacy equation editor or metafile/g) || []).length, 1);
});
