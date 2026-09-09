// Regressions fixed in 0.2.1, checked end-to-end on a synthetic manuscript written as raw WordprocessingML
// (the `docx` package cannot emit OMML, split runs or images inside table cells).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const NodeZip = require("jszip");

const root = path.join(__dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wordtex-reg-"));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const p = (text, style) => "<w:p>" + (style ? '<w:pPr><w:pStyle w:val="' + style + '"/></w:pPr>' : "") + '<w:r><w:t xml:space="preserve">' + text + "</w:t></w:r></w:p>";
const drawing = (i) => '<w:r><w:drawing><wp:inline><wp:extent cx="914400" cy="914400"/><wp:docPr id="' + i + '" name="pic' + i + '"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + i + '" name="pic' + i + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
const mr = (t) => "<m:r><m:t>" + t + "</m:t></m:r>";
const cuberoot = "<m:oMath><m:rad><m:radPr><m:degHide m:val=\"0\"/></m:radPr><m:deg>" + mr("3") + "</m:deg><m:e>" + mr("x") + "</m:e></m:rad></m:oMath>";
const numbered = "<w:p><m:oMathPara><m:oMath>" + mr("E=m") + "<m:sSup><m:e>" + mr("c") + "</m:e><m:sup>" + mr("2") + "</m:sup></m:sSup></m:oMath></m:oMathPara><w:r><w:tab/></w:r><w:r><w:t>(</w:t></w:r><w:r><w:t>1</w:t></w:r><w:r><w:t>)</w:t></w:r></w:p>";
const mixed = '<w:p><w:r><w:t xml:space="preserve">Rate </w:t></w:r><m:oMath>' + mr("r=") + "<w:r><w:t>x_max %</w:t></w:r></m:oMath><w:r><w:t xml:space=\"preserve\"> is used.</w:t></w:r></w:p>";

const body = [
  p("A Regression Manuscript", "Title"),
  p("Alice Smith, Bob Jones"),
  p("Department of Testing, Test University, Beijing, China"),
  p("alice@test.edu.cn; bob@test.edu.cn"),
  p("Abstract: This abstract has a URL https://example.org/x and a backslash C:\\Temp\\out."),
  p("Keywords: converter; latex; test"),
  p("1 Introduction", "Heading1"),
  p("Prior work [1] and [2,3] showed the path C:\\path\\file matters, see also [4]."),
  '<w:p><w:r><w:t xml:space="preserve">The cube root </w:t></w:r>' + cuberoot + '<w:r><w:t xml:space="preserve"> is inline.</w:t></w:r></w:p>',
  numbered,
  mixed,
  p("2 Data", "Heading1"),
  "<w:tbl><w:tblGrid><w:gridCol/><w:gridCol/></w:tblGrid><w:tr><w:tc><w:p><w:r><w:t>Name</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Picture</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>Row</w:t></w:r></w:p></w:tc><w:tc><w:p>" + drawing(1) + "</w:p></w:tc></w:tr></w:tbl>",
  p("Table 1. A table with a picture in it."),
  "<w:p>" + drawing(2) + "</w:p>",
  p("Fig. 1. The same picture again as a figure."),
  "<w:p>" + drawing(3) + "</w:p>",
  p("Fig. 2. And a third copy."),
  p("References", "Heading1"),
  p("[1] Smith, A. 2020. First paper. Journal."),
  p("[2] Jones, B. 2021. Second paper. Journal."),
  p("[3] Lee, C. 2022. Third paper. Journal."),
  p("[4] Wu, D. 2023. Fourth paper. Journal."),
].join("");

async function makeDocx(file) {
  const zip = new NodeZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/document.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + "><w:body>" + body + "</w:body></w:document>");
  zip.file("word/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style></w:styles>');
  zip.file("word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  zip.file("word/media/image1.png", PNG);
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer" }));
}

test("regressions: escaping, citation linking, equation numbers, table images, figure de-duplication", async () => {
  const app = path.join(tmp, "app.html"), docx = path.join(tmp, "regressions.docx");
  await makeDocx(docx);
  execFileSync(process.execPath, [path.join(root, "scripts", "build.js"), app], { stdio: "inherit" });
  execFileSync(process.execPath, [path.join(root, "scripts", "headless_run.js"), app, docx, tmp], { stdio: "inherit", timeout: 240000 });
  const report = JSON.parse(fs.readFileSync(path.join(tmp, "ui_report.json"), "utf8"));
  const zip = await NodeZip.loadAsync(fs.readFileSync(path.join(tmp, "project.zip")));
  const tex = await zip.file("main.tex").async("string");

  // texEscape: \textbackslash{} must not have its braces escaped again
  assert.match(tex, /C:\\textbackslash\{\}path\\textbackslash\{\}file/);
  assert.doesNotMatch(tex, /\\textbackslash\\\{/);
  // citation linking must not touch math
  assert.match(tex, /\$\\sqrt\[3\]\{x\}\$/);
  assert.doesNotMatch(tex, /\\sqrt\\cite/);
  assert.match(tex, /\\cite\{ref2,ref3\}/);
  // plain text run inside a formula is escaped
  assert.match(tex, /\\text\{x\\_max \\%\}/);
  // the split "(1)" is gone from the review block (it was shown twice: literal + \tag)
  const eq = report.blocks.find((b) => /E=m\{c\}\^\{2\}/.test(b));
  assert.ok(eq, "numbered equation block present");
  assert.doesNotMatch(eq, /\(1\)/);
  assert.match(tex, /\\begin\{equation\}\\tag\{1\}\\label\{eq:1\}/);
  // image in a table cell is kept, sized to the cell, without a float environment
  assert.match(tex, /Row & \\includegraphics\[width=\\linewidth,height=[\d.]+pt,keepaspectratio\]\{figures\/word-figure-01\.png\}/);
  assert.ok(report.checks.some((c) => /表格单元格内/.test(c)), "checklist mentions the table image");
  // one file per distinct image, labels de-duplicated
  assert.deepEqual(Object.keys(zip.files).filter((f) => /^figures\/.+/.test(f)), ["figures/word-figure-01.png"]);
  assert.match(tex, /\\label\{fig:word-figure-01\}/);
  assert.match(tex, /\\label\{fig:word-figure-01-2\}/);
  // abstract goes through texText: bare URLs are wrapped
  assert.match(tex, /\\url\{https:\/\/example\.org\/x\}/);
});
