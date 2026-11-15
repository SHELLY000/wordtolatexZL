/*
 * WPS Equation.KSEE3 OLE → LaTeX, from its embedded Equation Native stream.
 * Format reference: https://rtf2latex2e.sourceforge.net/MTEF3.html
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../vendor/cfb.min.js"), require("./omml2latex.js"));
  } else root.WpsEquations = factory(root.CFB, root.OMML2LaTeX);
})(typeof self !== "undefined" ? self : this, function (CFB, omml) {
  "use strict";

  const OLE_NS = "urn:schemas-microsoft-com:office:office";
  const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
  const DELIMITERS = [
    ["\\langle", "\\rangle", 0x2329, 0x232a], ["(", ")", 40, 41],
    ["\\{", "\\}", 123, 125], ["[", "]", 91, 93], ["|", "|", 0xec07, 0xec08],
    ["\\|", "\\|", 0x2016, 0x2016], ["\\lfloor", "\\rfloor", 0x230a, 0x230b],
    ["\\lceil", "\\rceil", 0x2308, 0x2309], ["\\{", "\\{", 123, 123],
    ["\\}", "\\}", 125, 125], ["\\}", "\\{", 125, 123], ["\\{", ")", 123, 41],
    ["(", "\\}", 40, 125]
  ];
  const ACCENTS = {
    2: "\\dot", 3: "\\ddot", 4: "\\dddot", 8: "\\tilde", 9: "\\hat",
    10: "\\not", 11: "\\vec", 12: "\\overleftarrow", 13: "\\overleftrightarrow",
    16: "\\bar", 17: "\\overline"
  };
  const PRIMES = { 5: "'", 6: "''", 18: "'''" };
  const OPERATORS = {
    21: "\\int", 22: "\\iint", 23: "\\iiint", 24: "\\int", 25: "\\iint", 26: "\\iiint",
    29: "\\sum", 30: "\\sum", 31: "\\prod", 32: "\\prod",
    33: "\\coprod", 34: "\\coprod", 35: "\\bigcup", 36: "\\bigcup", 37: "\\bigcap", 38: "\\bigcap"
  };

  function readMtef(bytes) {
    if (bytes[0] !== 3 || bytes.length <= 5) throw new Error("Expected an MTEF v3 equation");
    let offset = 5;
    function read() {
      if (offset >= bytes.length) throw new Error("Truncated MTEF equation");
      return bytes[offset++];
    }
    function skip(count) {
      if (offset + count > bytes.length) throw new Error("Truncated MTEF record");
      offset += count;
    }
    function read16() { const low = read(); return low + 256 * read(); }
    function ruler() {
      if (read() !== 7) throw new Error("Invalid MTEF ruler");
      skip(3 * read());
    }
    function records(depth) {
      if (depth > 64) throw new Error("MTEF equation is nested too deeply");
      const result = [];
      for (;;) {
        const tag = read();
        if (tag === 0) return result;
        const type = tag & 15;
        const flags = tag >> 4;
        if ((flags & 8) && type >= 1 && type <= 6 && read16() === 0x8080) skip(4);
        switch (type) {
          case 1:
            if (flags & 4) skip(2);
            if (flags & 2) ruler();
            result.push({ type, children: flags & 1 ? [] : records(depth + 1) });
            break;
          case 2: {
            const face = read() - 128;
            const code = read16();
            result.push({ type, face, code, children: flags & 2 ? records(depth + 1) : [] });
            break;
          }
          case 3: {
            const selector = read(), variation = read();
            read();
            result.push({ type, selector, variation, children: records(depth + 1) });
            break;
          }
          case 4:
            skip(2);
            if (flags & 2) ruler();
            result.push({ type, children: records(depth + 1) });
            break;
          case 5: {
            skip(3);
            const rows = read(), cols = read();
            const boundaries = Math.ceil((rows + 1) / 4) + Math.ceil((cols + 1) / 4);
            if (Array.from({ length: boundaries }, read).some(Boolean)) throw new Error("MTEF matrix partition lines are unsupported");
            result.push({ type, rows, cols, children: records(depth + 1) });
            break;
          }
          case 6: result.push({ type, accent: read() }); break;
          case 8: skip(2); while (read() !== 0) { /* font name */ } break;
          case 9: {
            const size = read();
            skip(size === 100 ? 3 : size === 101 ? 2 : 1);
            break;
          }
          case 10: case 11: case 12: case 13: case 14:
            break;
          default: throw new Error("Unsupported MTEF record " + type);
        }
      }
    }
    const equation = records(0);
    if (bytes.subarray(offset).some(Boolean)) throw new Error("Unexpected data after MTEF equation");
    return equation;
  }

  function character(node) {
    const { code, face } = node;
    if (code === 0xeb02) return "\\,";
    if (code < 32 || (code >= 0xd800 && code <= 0xf8ff) || face < 0) throw new Error("Unsupported MTEF character " + code);
    let ch = String.fromCharCode(code);
    // Some MTEF v3 writers encode Greek glyphs using Adobe Symbol's ASCII positions.
    if ((face === 4 || face === 5) && /^[A-Za-z]$/.test(ch)) {
      const greek = "αβχδεφγηιϕκλμνοπθρστυϖωξψζ";
      ch = greek[ch.toLowerCase().charCodeAt(0) - 97];
      if (face === 5) ch = ch.toUpperCase();
    }
    let latex = omml.charToLatex(ch === "〉" ? "⟩" : ch === "〈" ? "⟨" : ch);
    if (face === 7 && /^[A-Za-z]$/.test(ch)) latex = "\\mathbf{" + latex + "}";
    for (const child of node.children) {
      if (child.type !== 6) throw new Error("Invalid MTEF embellishment");
      if (PRIMES[child.accent]) latex += PRIMES[child.accent];
      else if (ACCENTS[child.accent]) latex = ACCENTS[child.accent] + "{" + latex + "}";
      else throw new Error("Unsupported MTEF embellishment " + child.accent);
    }
    return latex;
  }

  function scripts(sub, sup) {
    return (sub ? "_{" + sub + "}" : "") + (sup ? "^{" + sup + "}" : "");
  }

  function template(node) {
    const { selector, variation, children } = node;
    const slots = children.filter((child) => child.type === 1).map(render);
    const [first = "", second = "", third = ""] = slots;
    if (selector < DELIMITERS.length && variation <= 2 && slots.length === 1) {
      const [left, right] = DELIMITERS[selector];
      return "\\left" + (variation === 2 ? "." : left) + " " + first + " \\right" + (variation === 1 ? "." : right);
    }
    switch (selector) {
      case 13:
        if (variation === 0 && first && !second) return "\\sqrt{" + first + "}";
        if (variation === 1 && first && second) return "\\sqrt[" + second + "]{" + first + "}";
        break;
      case 14: case 41:
        if (slots.length !== 2) break;
        if (selector === 41 && variation === 1) return "{" + first + "}/{" + second + "}";
        if (selector === 41 && (variation === 0 || variation === 2)) return "{}^{" + first + "}\\!/\\!{}_{" + second + "}";
        if (selector === 14 && variation <= 1) return (variation === 0 ? "\\frac{" : "\\tfrac{") + first + "}{" + second + "}";
        break;
      case 15: case 44:
        if (variation <= 2 && slots.length === 2) return (selector === 44 ? "{}" : "") + scripts(variation === 0 ? "" : first, variation === 1 ? "" : second);
        break;
      case 16: case 17: {
        if (slots.length !== 1) break;
        const bar = selector === 16 ? "\\underline" : "\\overline";
        if (variation === 0) return bar + "{" + first + "}";
        if (variation === 1) return bar + "{" + bar + "{" + first + "}}";
        break;
      }
      case 27: case 28:
        if (variation === 0 && slots.length === 2) return (selector === 27 ? "\\overbrace{" : "\\underbrace{") + first + "}" +
          (selector === 27 ? scripts("", second) : scripts(second, ""));
        break;
      case 39:
        if (variation <= 2 && slots.length === 3) return "\\mathop{" + first + "}" + scripts(second, third);
        break;
    }
    if (OPERATORS[selector] && variation <= (selector === 21 ? 5 : selector <= 23 ? 3 : 2) && slots.length === 3) {
      const symbol = children.find((child) => child.type === 2);
      const operator = symbol ? character(symbol) : OPERATORS[selector];
      const limits = selector >= 24 && selector <= 26 ? "\\limits"
        : selector >= 30 && selector % 2 === 0 ? "\\nolimits" : "";
      // Some WPS lower-only operators put their sole limit in slot two.
      return operator + limits + scripts(third || second, third ? second : "") + "{" + first + "}";
    }
    throw new Error("Unsupported MTEF template " + selector + ":" + variation);
  }

  function render(node) {
    if (node.type === 1) return renderList(node.children);
    if (node.type === 2) return character(node);
    if (node.type === 3) return template(node);
    if (node.type === 4) return "\\begin{gathered}" + node.children.map(render).join(" \\\\ ") + "\\end{gathered}";
    if (node.type === 5) {
      if (!node.rows || !node.cols || node.rows * node.cols !== node.children.length) throw new Error("Invalid MTEF matrix dimensions");
      const rows = [];
      const cells = node.children.map(render);
      for (let i = 0; i < cells.length; i += node.cols) rows.push(cells.slice(i, i + node.cols).join(" & "));
      return "\\begin{matrix}" + rows.join(" \\\\ ") + "\\end{matrix}";
    }
    throw new Error("Unexpected MTEF record " + node.type);
  }

  function isFunctionLetter(node) {
    return node && node.type === 2 && node.face === 2 && !node.children.length && /^[A-Za-z]$/.test(String.fromCharCode(node.code));
  }

  function renderList(nodes) {
    const tokens = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const delimiter = node.type === 3 && DELIMITERS[node.selector];
      if (delimiter && !node.children.some((child) => child.type === 2)) {
        // WPS can write the template's stretch glyphs just after its END tag.
        const [, , left, right] = delimiter;
        const glyphs = node.variation === 1 ? [left] : node.variation === 2 ? [right] : [left, right];
        if (glyphs.every((code, j) => nodes[i + j + 1]?.type === 2 && nodes[i + j + 1].face === 22 &&
          nodes[i + j + 1].code === code && !nodes[i + j + 1].children.length)) i += glyphs.length;
      }
      if (isFunctionLetter(node)) {
        let word = String.fromCharCode(node.code);
        while (isFunctionLetter(nodes[i + 1])) word += String.fromCharCode(nodes[++i].code);
        tokens.push(omml.isMathFunction(word) ? "\\" + word : "\\mathrm{" + word + "}");
      } else {
        const token = render(node);
        if (token.startsWith("_") || token.startsWith("^")) {
          // An MTEF script record applies to the preceding atom, if present.
          tokens.push("{" + (tokens.pop() || "") + "}" + token);
        } else tokens.push(token);
      }
    }
    return omml.joinTokens(tokens);
  }

  function toLatex(bytes) {
    // CFB also reads ZIP containers. Only compound binary files can be equation objects here.
    const signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    if (bytes.length < 512 || !signature.every((byte, i) => bytes[i] === byte)) throw new Error("Invalid equation compound file");
    const compound = CFB.read(bytes, { type: "array" });
    const entry = CFB.find(compound, "/Equation Native");
    if (!entry || !entry.content || entry.content.length < 28) throw new Error("Equation Native stream missing");
    const stream = Uint8Array.from(entry.content);
    const header = new DataView(stream.buffer);
    const start = header.getUint16(0, true), length = header.getUint32(8, true);
    if (start < 28 || length > stream.length - start) throw new Error("Invalid Equation Native stream length");
    const latex = renderList(readMtef(stream.subarray(start, start + length)));
    if (!latex.trim()) throw new Error("Empty MTEF equation");
    return latex;
  }

  async function readDocument(zip, objects) {
    const equations = new Map();
    const entries = new Map();
    for (const object of objects) {
      if (object.parentNode?.namespaceURI !== omml.W_NS || object.parentNode.localName !== "r") continue;
      const ole = object.getElementsByTagNameNS(OLE_NS, "OLEObject")[0];
      if (!ole || !/^Equation\.KSEE3$/i.test(ole.getAttribute("ProgID"))) continue;
      entries.set(object, ole.getAttributeNS(REL_NS, "id"));
    }
    const rels = zip.file("word/_rels/document.xml.rels");
    if (!entries.size || !rels) return equations;
    const relationships = omml.parseXml(await rels.async("string"));
    const targets = new Map();
    for (const relationship of relationships.getElementsByTagNameNS(PACKAGE_REL_NS, "Relationship")) {
      if (relationship.getAttribute("Type") !== REL_NS + "/oleObject" || relationship.getAttribute("TargetMode") === "External") continue;
      try {
        const target = new URL(relationship.getAttribute("Target"), "https://docx.invalid/word/document.xml");
        if (target.origin === "https://docx.invalid") targets.set(relationship.getAttribute("Id"), decodeURIComponent(target.pathname.slice(1)));
      } catch (_) { /* An invalid relationship cannot resolve to a document part. */ }
    }

    const convertedParts = new Map();
    for (const [object, id] of entries) {
      const path = targets.get(id);
      if (!path) continue;
      if (!convertedParts.has(path)) {
        const part = zip.file(path);
        try { convertedParts.set(path, part ? toLatex(await part.async("uint8array")) : null); }
        catch (error) { console.warn("WPS equation kept as a preview:", error.message); convertedParts.set(path, null); }
      }
      const latex = convertedParts.get(path);
      if (latex) equations.set(object, latex);
    }
    return equations;
  }

  return { toLatex, readDocument };
});
