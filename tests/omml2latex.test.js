// node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const O = require("../src/omml2latex.js");
const w = new JSDOM("").window;
O.setDomImplementation({ DOMParser: w.DOMParser, XMLSerializer: w.XMLSerializer });

const NS = 'xmlns:m="' + O.M_NS + '" xmlns:w="' + O.W_NS + '"';
const r = (t, pr) => "<m:r>" + (pr || "") + '<m:t xml:space="preserve">' + t + "</m:t></m:r>";
const one = (body, inTable) => {
  const para = "<w:p>" + (inTable ? "<m:oMath>" : "<m:oMathPara><m:oMath>") + body + (inTable ? "</m:oMath>" : "</m:oMath></m:oMathPara>") + "</w:p>";
  const doc = "<w:document " + NS + "><w:body>" + (inTable ? "<w:tbl><w:tr><w:tc>" + para + "</w:tc></w:tr></w:tbl>" : para) + "</w:body></w:document>";
  return O.extractEquations(doc)[0];
};

const cases = {
  fraction: ["<m:f><m:num>" + r("a+b") + "</m:num><m:den>" + r("2") + "</m:den></m:f>", "\\frac{a+b}{2}"],
  subscript: ["<m:sSub><m:e>" + r("x") + "</m:e><m:sub>" + r("i") + "</m:sub></m:sSub>", "{x}_{i}"],
  subsup: ["<m:sSubSup><m:e>" + r("health") + "</m:e><m:sub>" + r("i") + "</m:sub><m:sup>" + r("2") + "</m:sup></m:sSubSup>", "{health}_{i}^{2}"],
  greek: [r("α+β≤∞"), "\\alpha+\\beta\\leq\\infty"],
  sum: ["<m:nary><m:naryPr><m:chr m:val=\"∑\"/><m:limLoc m:val=\"undOvr\"/></m:naryPr><m:sub>" + r("n=1") + "</m:sub><m:sup>" + r("4") + "</m:sup><m:e>" + r("x") + "</m:e></m:nary>", "\\sum_{n=1}^{4}{x}"],
  integral: ["<m:nary><m:naryPr><m:limLoc m:val=\"subSup\"/></m:naryPr><m:sub>" + r("0") + "</m:sub><m:sup>" + r("1") + "</m:sup><m:e>" + r("f") + "</m:e></m:nary>", "\\int_{0}^{1}{f}"],
  sqrt: ["<m:rad><m:radPr><m:degHide m:val=\"1\"/></m:radPr><m:deg/><m:e>" + r("x") + "</m:e></m:rad>", "\\sqrt{x}"],
  cuberoot: ["<m:rad><m:deg>" + r("3") + "</m:deg><m:e>" + r("x") + "</m:e></m:rad>", "\\sqrt[3]{x}"],
  delims: ["<m:d><m:dPr><m:begChr m:val=\"[\"/><m:endChr m:val=\"]\"/></m:dPr><m:e>" + r("x") + "</m:e></m:d>", "\\left[ x \\right]"],
  matrix: ["<m:m><m:mr><m:e>" + r("1") + "</m:e><m:e>" + r("0") + "</m:e></m:mr><m:mr><m:e>" + r("0") + "</m:e><m:e>" + r("1") + "</m:e></m:mr></m:m>", "\\begin{matrix} 1 & 0 \\\\ 0 & 1 \\end{matrix}"],
  hat: ["<m:acc><m:accPr><m:chr m:val=\"̂\"/></m:accPr><m:e>" + r("β") + "</m:e></m:acc>", "\\hat{\\beta}"],
  overline: ["<m:bar><m:e>" + r("x") + "</m:e></m:bar>", "\\overline{x}"],
  lim: ["<m:func><m:fName><m:limLow><m:e>" + r("lim", "<m:rPr><m:sty m:val=\"p\"/></m:rPr>") + "</m:e><m:lim>" + r("n→∞") + "</m:lim></m:limLow></m:fName><m:e>" + r("x") + "</m:e></m:func>", "\\lim_{n\\rightarrow\\infty}{x}"],
  sin: ["<m:func><m:fName>" + r("sin", "<m:rPr><m:sty m:val=\"p\"/></m:rPr>") + "</m:fName><m:e>" + r("θ") + "</m:e></m:func>", "\\sin{\\theta}"],
  upright_letters_only: [r("F(6,16)=21817.63", "<m:rPr><m:sty m:val=\"p\"/></m:rPr>"), "\\mathrm{F}(6,16)=21817.63"],
  bold: [r("E", "<m:rPr><m:sty m:val=\"b\"/></m:rPr>"), "\\mathbf{E}"],
  text_run: [r("for all t", "<m:rPr><m:nor/></m:rPr>"), "\\text{for all t}"],
  double_struck: [r("R", "<m:rPr><m:scr m:val=\"double-struck\"/><m:sty m:val=\"p\"/></m:rPr>"), "\\mathbb{R}"],
  eqarr: ["<m:eqArr><m:e>" + r("x&amp;=1") + "</m:e><m:e>" + r("y&amp;=2") + "</m:e></m:eqArr>", "\\begin{aligned} x&=1 \\\\ y&=2 \\end{aligned}"],
  escapes: [r("50%"), "50\\%"],
  underbrace: ["<m:groupChr><m:e>" + r("x+x") + "</m:e></m:groupChr>", "\\underbrace{x+x}"],
  prescript: ["<m:sPre><m:sub>" + r("92") + "</m:sub><m:sup>" + r("238") + "</m:sup><m:e>" + r("U") + "</m:e></m:sPre>", "{}_{92}^{238}{U}"],
};
for (const [name, [body, expected]] of Object.entries(cases)) test("omml: " + name, () => { assert.equal(one(body).latex, expected); });

test("display equation followed by (1) keeps the author's number as \\tag", () => {
  const doc = "<w:document " + NS + "><w:body><w:p><m:oMath>" + r("x") + "</m:oMath><w:r><w:t>(1)</w:t></w:r></w:p></w:body></w:document>";
  const e = O.extractEquations(doc)[0];
  assert.equal(e.display, true); assert.equal(e.tag, "1");
  assert.match(e.wrapped, /\\begin\{equation\}\\tag\{1\}\\label\{eq:1\}/);
});
test("equations inside table cells are always inline", () => { const e = one("<m:sSub><m:e>" + r("control") + "</m:e><m:sub>" + r("1") + "</m:sub></m:sSub>", true); assert.equal(e.display, false); assert.equal(e.wrapped, "${control}_{1}$"); });
test("prepareDocumentXml replaces every equation with a placeholder run", () => {
  const doc = "<w:document " + NS + "><w:body><w:p><w:r><w:t>a </w:t></w:r><m:oMath>" + r("x") + "</m:oMath><w:r><w:t> b</w:t></w:r></w:p><w:p><m:oMathPara><m:oMath>" + r("y") + "</m:oMath></m:oMathPara></w:p></w:body></w:document>";
  const out = O.prepareDocumentXml(doc);
  assert.equal(out.equations.length, 2);
  assert.equal((out.xml.match(O.PLACEHOLDER_RE) || []).length, 2);
  assert.ok(!/<m:oMath/.test(out.xml));
});

// --- 0.2.1 regressions -------------------------------------------------------------------------
test("plain Word text runs inside a formula are escaped for text mode", () => {
  // <w:r> inside <m:oMath> (tracked changes, smart tags, pasted text) used to land in \text{} verbatim
  const doc = "<w:document " + NS + "><w:body><w:p><m:oMath>" + r("r=") + "<w:r><w:t>x_max % of {n}</w:t></w:r></m:oMath></w:p></w:body></w:document>";
  assert.equal(O.extractEquations(doc)[0].latex, "r=\\text{x\\_max \\% of \\{n\\}}");
});
test("'normal text' runs use text-mode escapes (no \\backslash / \\hat{} inside \\text{})", () => {
  assert.equal(one(r("a\\b^2 ~ 50%", "<m:rPr><m:nor/></m:rPr>")).latex, "\\text{a\\textbackslash{}b\\textasciicircum{}2 \\textasciitilde{} 50\\%}");
});
test("an equation number split over several runs is removed completely", () => {
  // Word typically writes "\t(1)" as four runs; only whole-run matches used to be dropped, leaving "(1)" next to \tag{1}
  const doc = "<w:document " + NS + "><w:body><w:p><m:oMath>" + r("E=mc^2") + "</m:oMath>" +
    "<w:r><w:tab/></w:r><w:r><w:t>(</w:t></w:r><w:r><w:t>1</w:t></w:r><w:r><w:t>)</w:t></w:r>" +
    "<w:r><w:footnoteReference w:id=\"1\"/></w:r></w:p></w:body></w:document>";
  const out = O.prepareDocumentXml(doc);
  assert.equal(out.equations[0].tag, "1");
  assert.ok(!/<w:t>[(1)]<\/w:t>/.test(out.xml), "no literal ( 1 ) runs left");
  assert.ok(!/<w:tab\/>/.test(out.xml), "the tab before the number is gone too");
  assert.ok(/footnoteReference/.test(out.xml), "runs that are not plain text are kept");
});

// --- malformed input ---------------------------------------------------------------------------
test("a document.xml that is not well-formed is rejected, not serialised back as a parsererror stub", () => {
  // DOMParser signals XML errors by returning a <parsererror> document rather than throwing; serialising it
  // used to overwrite the manuscript with the error message, so mammoth then failed with an opaque TypeError.
  const bad = "<w:document " + NS + "><w:body><w:p><w:r><w:t>Smith & Jones</w:t></w:r></w:p>" +
    "<w:p><m:oMath>" + r("x") + "</m:oMath></w:p></w:body></w:document>";
  assert.throws(() => O.prepareDocumentXml(bad), /not well-formed/);
  assert.throws(() => O.extractEquations(bad), /not well-formed/);
});
