// Builds examples/sample_manuscript.docx: built-in heading styles, abstract/keywords, a merged-cell table,
// a figure with caption, numeric citations, a reference list, and one Word (OMML) equation injected afterwards.
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun, AlignmentType } = require("docx");
const png = fs.readFileSync(__dirname + "/sample_figure.png");
const cell = (t, o = {}) => new TableCell({ children: [new Paragraph(t)], width: { size: 2200, type: WidthType.DXA }, ...o });
const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ text: "A Sample Manuscript for GalleyTeX", heading: HeadingLevel.TITLE }),
      new Paragraph("Alice Author* (Corresponding author)"),
      new Paragraph("School of Economics, Example University, Wuhan, China, alice@example.edu.cn"),
      new Paragraph("Bob Writer"),
      new Paragraph("Department of Computing, Sample Institute of Technology, Atlanta, USA, bob@example.edu"),
      new Paragraph({ children: [new TextRun({ text: "Abstract: ", bold: true }), new TextRun("This short document exercises the GalleyTeX pipeline: built-in heading styles, an equation, a table with merged cells, a figure with a caption, numeric citations and a reference list.")] }),
      new Paragraph({ children: [new TextRun({ text: "Keywords: ", bold: true }), new TextRun("Word to LaTeX; typesetting; regression test")] }),
      new Paragraph({ text: "1 Introduction", heading: HeadingLevel.HEADING_1 }),
      new Paragraph("Converting Word manuscripts to LaTeX is tedious [1]. This document is a fixture for the regression tests [2, 3]. The model is given in Equation (1)."),
      new Paragraph({ text: "EQUATION_PLACEHOLDER" }),
      new Paragraph({ text: "2 Data", heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: "2.1 Variables", heading: HeadingLevel.HEADING_2 }),
      new Paragraph("Table 1 lists the variables."),
      new Paragraph("Table 1: Variables used in the model"),
      new Table({ columnWidths: [2200, 2200, 2200], rows: [
        new TableRow({ children: [cell("Group"), cell("Variable"), cell("Unit")] }),
        new TableRow({ children: [cell("Controls", { rowSpan: 2 }), cell("income"), cell("yuan")] }),
        new TableRow({ children: [cell("cpi"), cell("index")] }),
      ] }),
      new Paragraph("Figure 1 shows the placeholder image."),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: png, transformation: { width: 300, height: 180 } })] }),
      new Paragraph("Figure 1: A placeholder figure"),
      new Paragraph({ text: "3 Conclusion", heading: HeadingLevel.HEADING_1 }),
      new Paragraph("Everything above should survive the round trip."),
      new Paragraph({ text: "References", heading: HeadingLevel.HEADING_1 }),
      new Paragraph("[1] Smith, J. (2020). Word to LaTeX conversion. Journal of Examples, 1(1), 1-10."),
      new Paragraph("[2] Lee, K. (2021). Regression tests for document tools. Proceedings of Nowhere, 11-20."),
      new Paragraph("[3] Zhou, L. (2022). Typesetting for small journals. Example Press."),
    ],
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync("sample_manuscript.docx", buf); console.log("written", buf.length); });
