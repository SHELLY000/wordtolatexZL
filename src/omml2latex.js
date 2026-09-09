/*
 * omml2latex.js — prototype OMML (Word equation) → LaTeX converter.
 *
 * Works in the browser (uses DOMParser / XMLSerializer) and in Node (pass a DOMParser
 * implementation such as jsdom's or @xmldom/xmldom's via `setDomImplementation`).
 *
 * Public API
 *   ommlToLatex(node)              -> LaTeX string for an <m:oMath> / <m:oMathPara> element
 *   convertParagraph(wP)           -> [{ id, latex, display, tag, node }] for one <w:p>
 *   extractEquations(documentXml)  -> [{ id, latex, display, tag, context }] for a whole document.xml
 *   prepareDocumentXml(documentXml)-> { xml, equations }  document.xml with every equation replaced by a
 *                                     placeholder run "\uE000EQ<n>\uE000" so mammoth keeps the position;
 *                                     swap the placeholders back for <span class="math"> / $…$ afterwards.
 *   PLACEHOLDER_RE                 -> regex matching the placeholders in text
 *
 * Integration sketch for the EI typesetting tool (inside handleFile, before mammoth):
 *   const zip = await JSZip.loadAsync(arrayBuffer);
 *   const xml = await zip.file("word/document.xml").async("string");
 *   const { xml: patched, equations } = OMML2LaTeX.prepareDocumentXml(xml);
 *   zip.file("word/document.xml", patched);
 *   const patchedBuffer = await zip.generateAsync({ type: "arraybuffer" });
 *   const result = await mammoth.convertToHtml({ arrayBuffer: patchedBuffer }, options);
 *   // then in the HTML: replace /\uE000EQ(\d+)\uE000/g with
 *   //   <span class="math" data-eq="$1" data-display="…" data-latex="…">rendered by KaTeX</span>
 *   // and in nodeToLatex(): emit $latex$ / \begin{equation}…\end{equation} from data-latex.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OMML2LaTeX = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const M_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math";
  const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const PLACEHOLDER_RE = /\uE000EQ(\d+)\uE000/g;

  let dom = { DOMParser: typeof DOMParser !== "undefined" ? DOMParser : null, XMLSerializer: typeof XMLSerializer !== "undefined" ? XMLSerializer : null };
  function setDomImplementation(impl) { dom = Object.assign({}, dom, impl); }

  // ---------------------------------------------------------------------------
  // Symbol tables
  // ---------------------------------------------------------------------------
  const GREEK = {
    "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "ε": "varepsilon", "ϵ": "epsilon", "ζ": "zeta", "η": "eta", "θ": "theta",
    "ϑ": "vartheta", "ι": "iota", "κ": "kappa", "λ": "lambda", "μ": "mu", "µ": "mu", "ν": "nu", "ξ": "xi", "π": "pi", "ϖ": "varpi", "ρ": "rho",
    "ϱ": "varrho", "σ": "sigma", "ς": "varsigma", "τ": "tau", "υ": "upsilon", "φ": "varphi", "ϕ": "phi", "χ": "chi", "ψ": "psi", "ω": "omega",
    "Γ": "Gamma", "Δ": "Delta", "∆": "Delta", "Θ": "Theta", "Λ": "Lambda", "Ξ": "Xi", "Π": "Pi", "Σ": "Sigma", "Υ": "Upsilon", "Φ": "Phi", "Ψ": "Psi", "Ω": "Omega",
    "Α": "mathrm{A}", "Β": "mathrm{B}", "Ε": "mathrm{E}", "Ζ": "mathrm{Z}", "Η": "mathrm{H}", "Ι": "mathrm{I}", "Κ": "mathrm{K}", "Μ": "mathrm{M}",
    "Ν": "mathrm{N}", "Ο": "mathrm{O}", "Ρ": "mathrm{P}", "Τ": "mathrm{T}", "Χ": "mathrm{X}"
  };
  const SYMBOLS = {
    "∞": "\\infty", "∂": "\\partial", "∇": "\\nabla", "∑": "\\sum", "∏": "\\prod", "∫": "\\int", "∬": "\\iint", "∭": "\\iiint", "∮": "\\oint",
    "√": "\\surd", "∝": "\\propto", "∠": "\\angle", "∈": "\\in", "∉": "\\notin", "∋": "\\ni", "∪": "\\cup", "∩": "\\cap", "⊂": "\\subset",
    "⊃": "\\supset", "⊆": "\\subseteq", "⊇": "\\supseteq", "⊄": "\\not\\subset", "∅": "\\emptyset", "∀": "\\forall", "∃": "\\exists",
    "∄": "\\nexists", "¬": "\\neg", "∧": "\\wedge", "∨": "\\vee", "⊕": "\\oplus", "⊗": "\\otimes", "⊙": "\\odot", "⊖": "\\ominus",
    "⊥": "\\perp", "∥": "\\parallel", "≤": "\\leq", "≥": "\\geq", "≠": "\\neq", "≈": "\\approx", "≡": "\\equiv", "≢": "\\not\\equiv",
    "≅": "\\cong", "≃": "\\simeq", "≪": "\\ll", "≫": "\\gg", "±": "\\pm", "∓": "\\mp", "×": "\\times", "÷": "\\div", "·": "\\cdot",
    "⋅": "\\cdot", "∙": "\\bullet", "∘": "\\circ", "∗": "\\ast", "⋆": "\\star", "→": "\\rightarrow", "←": "\\leftarrow",
    "↔": "\\leftrightarrow", "⇒": "\\Rightarrow", "⇐": "\\Leftarrow", "⇔": "\\Leftrightarrow", "↑": "\\uparrow", "↓": "\\downarrow",
    "↦": "\\mapsto", "⟶": "\\longrightarrow", "⟵": "\\longleftarrow", "⟹": "\\Longrightarrow", "⟺": "\\Longleftrightarrow",
    "…": "\\ldots", "⋯": "\\cdots", "⋮": "\\vdots", "⋱": "\\ddots", "′": "'", "″": "''", "‴": "'''", "°": "^{\\circ}", "ℏ": "\\hbar",
    "ℓ": "\\ell", "ℜ": "\\Re", "ℑ": "\\Im", "ℵ": "\\aleph", "ℝ": "\\mathbb{R}", "ℕ": "\\mathbb{N}", "ℤ": "\\mathbb{Z}", "ℚ": "\\mathbb{Q}",
    "ℂ": "\\mathbb{C}", "ℙ": "\\mathbb{P}", "∣": "\\mid", "∤": "\\nmid", "⊢": "\\vdash", "⊨": "\\models", "⌊": "\\lfloor", "⌋": "\\rfloor",
    "⌈": "\\lceil", "⌉": "\\rceil", "⟨": "\\langle", "⟩": "\\rangle", "〈": "\\langle", "〉": "\\rangle", "‖": "\\|", "≺": "\\prec", "≻": "\\succ",
    "⪯": "\\preceq", "⪰": "\\succeq", "∼": "\\sim", "≜": "\\triangleq", "≔": "\\coloneqq", "≐": "\\doteq", "∴": "\\therefore", "∵": "\\because",
    "−": "-", "‐": "-", "–": "-", "—": "-", "ⅆ": "\\mathrm{d}", "ⅇ": "\\mathrm{e}", "ⅈ": "\\mathrm{i}", "ⅉ": "\\mathrm{j}", "ⅅ": "\\mathrm{D}",
    "△": "\\triangle", "□": "\\square", "◊": "\\diamond", "★": "\\bigstar", "†": "\\dagger", "‡": "\\ddagger", "§": "\\S", "¶": "\\P",
    "ℰ": "\\mathcal{E}", "ℒ": "\\mathcal{L}", "ℋ": "\\mathcal{H}", "ℱ": "\\mathcal{F}", "𝒩": "\\mathcal{N}",
    "‰": "\\text{\\textperthousand}", "∁": "\\complement", "⊤": "\\top", "⊥": "\\bot"
  };
  // characters that are special in LaTeX
  const ESCAPES = { "%": "\\%", "&": "\\&", "#": "\\#", "$": "\\$", "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\sim", "\\": "\\backslash", "^": "\\hat{}" };
  // inside \text{...} (text mode) \backslash and \hat{} are not allowed, so text runs use the text-mode commands
  const TEXT_ESCAPES = { "%": "\\%", "&": "\\&", "#": "\\#", "$": "\\$", "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}", "\\": "\\textbackslash{}", "^": "\\textasciicircum{}" };
  function textModeEscape(text) { return Array.from(text).map((ch) => TEXT_ESCAPES[ch] || ch).join(""); }
  const FUNCTIONS = ["sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "coth", "log", "ln", "lg", "exp",
    "max", "min", "sup", "inf", "lim", "liminf", "limsup", "det", "dim", "gcd", "hom", "ker", "arg", "deg", "Pr"];
  const NARY = { "∑": "\\sum", "∏": "\\prod", "∐": "\\coprod", "∫": "\\int", "∬": "\\iint", "∭": "\\iiint", "∮": "\\oint", "∯": "\\oint",
    "∰": "\\oint", "⋃": "\\bigcup", "⋂": "\\bigcap", "⋁": "\\bigvee", "⋀": "\\bigwedge", "⨁": "\\bigoplus", "⨂": "\\bigotimes", "⨄": "\\biguplus", "⨆": "\\bigsqcup" };
  const DELIMS = { "(": "(", ")": ")", "[": "[", "]": "]", "{": "\\{", "}": "\\}", "|": "|", "‖": "\\|", "⟨": "\\langle", "⟩": "\\rangle",
    "〈": "\\langle", "〉": "\\rangle", "⌊": "\\lfloor", "⌋": "\\rfloor", "⌈": "\\lceil", "⌉": "\\rceil", "": "." };
  const ACCENTS = { "\u0302": "\\hat", "\u0303": "\\tilde", "\u0304": "\\bar", "\u0305": "\\overline", "\u0306": "\\breve", "\u0307": "\\dot",
    "\u0308": "\\ddot", "\u20DB": "\\dddot", "\u030C": "\\check", "\u0300": "\\grave", "\u0301": "\\acute", "\u20D7": "\\vec", "\u20D6": "\\overleftarrow",
    "\u20E1": "\\overleftrightarrow", "\u20D1": "\\vec", "\u20D0": "\\overleftarrow", "\u0332": "\\underline" };

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------
  const isM = (n) => n && n.nodeType === 1 && (n.namespaceURI === M_NS || n.prefix === "m");
  const isW = (n) => n && n.nodeType === 1 && (n.namespaceURI === W_NS || n.prefix === "w");
  function kids(el, name) { const out = []; for (let c = el.firstChild; c; c = c.nextSibling) if (isM(c) && c.localName === name) out.push(c); return out; }
  function kid(el, name) { return kids(el, name)[0] || null; }
  function prop(el, prName, name, fallback) {
    const pr = kid(el, prName); if (!pr) return fallback;
    const p = kid(pr, name); if (!p) return fallback;
    const v = p.getAttributeNS ? (p.getAttributeNS(M_NS, "val") || p.getAttribute("m:val") || p.getAttribute("val")) : p.getAttribute("m:val");
    return v === null || v === "" ? (p.hasAttribute && (p.hasAttribute("m:val") || p.hasAttributeNS(M_NS, "val")) ? "" : fallback) : v;
  }

  // ---------------------------------------------------------------------------
  // Text runs
  // ---------------------------------------------------------------------------
  function normalizeChar(ch) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x1D400 && cp <= 0x1D7FF) return ch.normalize("NFKC"); // mathematical alphanumerics -> base letters
    return ch;
  }
  function charToLatex(ch, textMode) {
    if (GREEK[ch]) return "\\" + GREEK[ch];
    if (SYMBOLS[ch]) return SYMBOLS[ch];
    if (ESCAPES[ch]) return textMode && ch === "~" ? "\\textasciitilde{}" : ESCAPES[ch];
    return ch;
  }
  // Join tokens, inserting a space after a control word when a letter follows.
  function joinTokens(tokens) {
    let out = "";
    for (const t of tokens) {
      if (!t) continue;
      if (/\\[A-Za-z]+$/.test(out) && /^[A-Za-z]/.test(t)) out += " ";
      out += t;
    }
    return out;
  }
  function runToLatex(r, ctx) {
    let text = "";
    for (let c = r.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1 && c.localName === "t") text += c.textContent;
    }
    if (!text) return "";
    const pr = kid(r, "rPr");
    const sty = pr ? prop(r, "rPr", "sty", "i") : "i";      // p | b | i | bi
    const nor = pr && kid(pr, "nor") !== null;               // "normal text" toggle
    const scr = pr ? prop(r, "rPr", "scr", "roman") : "roman";
    const chars = Array.from(text).map(normalizeChar);
    if (nor) return "\\text{" + textModeEscape(chars.join("")) + "}";
    const trimmed = text.trim();
    if (FUNCTIONS.includes(trimmed) && (sty === "p" || ctx.inFName)) return "\\" + trimmed;
    const tokens = [];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (/\s/.test(ch)) {
        const prev = tokens.length ? tokens[tokens.length - 1] : "";
        const next = chars[i + 1] || "";
        if (/[A-Za-z0-9]$/.test(prev) && /[A-Za-z0-9]/.test(next)) tokens.push("\\ ");
        continue;
      }
      tokens.push(charToLatex(ch, false));
    }
    let body = joinTokens(tokens);
    if (!body) return "";
    const wrap = { b: "\\mathbf", bi: "\\boldsymbol", p: "\\mathrm" }[sty];
    const scriptWrap = { script: "\\mathcal", fraktur: "\\mathfrak", "double-struck": "\\mathbb", "sans-serif": "\\mathsf", monospace: "\\mathtt" }[scr];
    // Wrap only the letter groups (not digits/operators): \mathrm{F}(6,16)=21817.63 rather than \mathrm{F(6,16)=21817.63}
    const wrapLetters = (cmd) => body.replace(/(\\[A-Za-z]+)|([A-Za-z]+)/g, (m, ctrl, letters) => (ctrl ? ctrl : cmd + "{" + letters + "}"));
    if (scriptWrap) body = wrapLetters(scriptWrap);
    else if (wrap) body = wrapLetters(wrap);
    return body;
  }

  // ---------------------------------------------------------------------------
  // Structure conversion
  // ---------------------------------------------------------------------------
  function convChildren(el, ctx) {
    const parts = [];
    for (let c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      if (isM(c)) { if (/Pr$/.test(c.localName) || c.localName === "ctrlPr") continue; parts.push(conv(c, ctx)); }
      else if (isW(c) && c.localName === "r") { const t = c.textContent; if (t.trim()) parts.push("\\text{" + textModeEscape(t) + "}"); }
      else if (c.firstChild) parts.push(convChildren(c, ctx)); // w:ins, w:smartTag, etc.
    }
    return joinTokens(parts);
  }
  const arg = (el, name, ctx) => { const a = kid(el, name); return a ? convChildren(a, ctx) : ""; };
  const braced = (s) => "{" + s + "}";

  function conv(el, ctx) {
    ctx = ctx || {};
    switch (el.localName) {
      case "oMathPara": return kids(el, "oMath").map((m) => convChildren(m, ctx)).join(" \\\\ ");
      case "oMath": case "e": case "sub": case "sup": case "num": case "den": case "deg": case "lim": case "fName": case "box":
        return convChildren(el, ctx);
      case "r": return runToLatex(el, ctx);
      case "f": {
        const type = prop(el, "fPr", "type", "bar");
        const num = arg(el, "num", ctx), den = arg(el, "den", ctx);
        if (type === "noBar") return "\\genfrac{}{}{0pt}{}" + braced(num) + braced(den);
        if (type === "lin") return braced(num) + "/" + braced(den);
        if (type === "skw") return "{}^{" + num + "}\\!/\\!{}_{" + den + "}";
        return "\\frac" + braced(num) + braced(den);
      }
      case "sSub": return braced(arg(el, "e", ctx)) + "_" + braced(arg(el, "sub", ctx));
      case "sSup": return braced(arg(el, "e", ctx)) + "^" + braced(arg(el, "sup", ctx));
      case "sSubSup": return braced(arg(el, "e", ctx)) + "_" + braced(arg(el, "sub", ctx)) + "^" + braced(arg(el, "sup", ctx));
      case "sPre": return "{}_" + braced(arg(el, "sub", ctx)) + "^" + braced(arg(el, "sup", ctx)) + braced(arg(el, "e", ctx));
      case "rad": {
        const hide = prop(el, "radPr", "degHide", "0"); const deg = arg(el, "deg", ctx);
        return (hide === "1" || hide === "on" || hide === "true" || !deg) ? "\\sqrt" + braced(arg(el, "e", ctx)) : "\\sqrt[" + deg + "]" + braced(arg(el, "e", ctx));
      }
      case "nary": {
        const chr = prop(el, "naryPr", "chr", "∫");
        const op = NARY[chr] || SYMBOLS[chr] || "\\int";
        const limLoc = prop(el, "naryPr", "limLoc", "");
        const subHide = ["1", "on", "true"].includes(prop(el, "naryPr", "subHide", "0"));
        const supHide = ["1", "on", "true"].includes(prop(el, "naryPr", "supHide", "0"));
        let s = op;
        if (limLoc === "undOvr" && /int|oint/.test(op)) s += "\\limits";
        if (limLoc === "subSup" && !/int|oint/.test(op)) s += "\\nolimits";
        const sub = subHide ? "" : arg(el, "sub", ctx), sup = supHide ? "" : arg(el, "sup", ctx);
        if (sub) s += "_" + braced(sub);
        if (sup) s += "^" + braced(sup);
        return s + braced(arg(el, "e", ctx));
      }
      case "d": {
        const beg = prop(el, "dPr", "begChr", "("), end = prop(el, "dPr", "endChr", ")"), sep = prop(el, "dPr", "sepChr", "|");
        const L = DELIMS[beg] !== undefined ? DELIMS[beg] : charToLatex(beg), R = DELIMS[end] !== undefined ? DELIMS[end] : charToLatex(end);
        const S = DELIMS[sep] !== undefined ? DELIMS[sep] : charToLatex(sep);
        const es = kids(el, "e").map((e) => convChildren(e, ctx));
        return "\\left" + L + " " + es.join(" \\middle" + S + " ") + " \\right" + R;
      }
      case "m": {
        const rows = kids(el, "mr").map((mr) => kids(mr, "e").map((e) => convChildren(e, ctx)).join(" & "));
        return "\\begin{matrix} " + rows.join(" \\\\ ") + " \\end{matrix}";
      }
      case "acc": {
        const chr = prop(el, "accPr", "chr", "\u0302");
        const cmd = ACCENTS[chr] || ACCENTS[chr.normalize("NFD").slice(-1)] || "\\hat";
        return cmd + braced(arg(el, "e", ctx));
      }
      case "bar": return (prop(el, "barPr", "pos", "top") === "bot" ? "\\underline" : "\\overline") + braced(arg(el, "e", ctx));
      case "borderBox": return "\\boxed" + braced(arg(el, "e", ctx));
      case "phant": return "\\phantom" + braced(arg(el, "e", ctx));
      case "groupChr": {
        const chr = prop(el, "groupChrPr", "chr", "\u23DF"), pos = prop(el, "groupChrPr", "pos", "bot");
        const body = braced(arg(el, "e", ctx));
        if (chr === "\u23DF" || chr === "\u23DD") return "\\underbrace" + body;
        if (chr === "\u23DE" || chr === "\u23DC") return "\\overbrace" + body;
        return (pos === "top" ? "\\overset" : "\\underset") + braced(charToLatex(chr)) + body;
      }
      case "limLow": {
        const base = arg(el, "e", ctx), lim = arg(el, "lim", ctx);
        if (/^\\(lim|max|min|sup|inf|liminf|limsup|det|gcd|Pr|arg)$/.test(base.trim()) || /^\\operatorname/.test(base)) return base + "_" + braced(lim);
        return "\\underset" + braced(lim) + braced(base);
      }
      case "limUpp": return "\\overset" + braced(arg(el, "lim", ctx)) + braced(arg(el, "e", ctx));
      case "func": {
        const fn = kid(el, "fName");
        let name = fn ? convChildren(fn, Object.assign({}, ctx, { inFName: true })) : "";
        if (name && !/^\\/.test(name) && /^[A-Za-z]+$/.test(name)) name = FUNCTIONS.includes(name) ? "\\" + name : "\\operatorname{" + name + "}";
        return name + braced(arg(el, "e", ctx));
      }
      case "eqArr": {
        const rows = kids(el, "e").map((e) => convChildren(e, ctx).replace(/\\&/g, "&"));
        return "\\begin{aligned} " + rows.join(" \\\\ ") + " \\end{aligned}";
      }
      default:
        if (/Pr$/.test(el.localName) || el.localName === "ctrlPr") return "";
        return convChildren(el, ctx);
    }
  }

  function ommlToLatex(node) { return conv(node, {}).replace(/\s+$/, "").replace(/^\s+/, ""); }

  // ---------------------------------------------------------------------------
  // Paragraph / document level
  // ---------------------------------------------------------------------------
  const insideMath = (n) => { for (let a = n.parentNode; a && a.nodeType === 1; a = a.parentNode) if (isM(a)) return true; return false; };
  // A run holding nothing but text / tabs / field markers (no footnote references, drawings, deleted text, ...).
  const isPlainTextRun = (r) => Array.from(r.childNodes).every((n) => n.nodeType !== 1 || (isW(n) && /^(rPr|t|tab|fldChar|instrText|softHyphen|noBreakHyphen)$/.test(n.localName)));
  function mathNodesOf(wP) {
    const out = [];
    (function walk(n) {
      for (let c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType !== 1) continue;
        if (isM(c) && (c.localName === "oMathPara" || c.localName === "oMath")) out.push(c);
        else if (!isM(c)) walk(c);
      }
    })(wP);
    return out;
  }
  function otherText(wP, mathNodes) {
    let t = "";
    (function walk(n) {
      for (let c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType !== 1 || mathNodes.includes(c) || isM(c)) continue;
        if (c.localName === "t") t += c.textContent; else walk(c);
      }
    })(wP);
    return t;
  }
  const EQNUM_RE = /^\s*[\(（]\s*([0-9]+[a-z]?(?:[.\-][0-9]+)?)\s*[\)）]\s*$/;
  let counter = 0;
  function convertParagraph(wP) {
    const nodes = mathNodesOf(wP);
    if (!nodes.length) return [];
    const rest = otherText(wP, nodes);
    const numbered = nodes.length === 1 && EQNUM_RE.test(rest);
    const paraIsMathOnly = nodes.length === 1 && rest.trim() === "";
    const inTableCell = (function up(n) { return n ? (isW(n) && n.localName === "tc" ? true : up(n.parentNode)) : false; })(wP.parentNode);
    return nodes.map((node) => {
      // equations inside table cells are always set inline: \[ \] inside a tabular cell breaks the row layout
      const display = !inTableCell && (node.localName === "oMathPara" || numbered || paraIsMathOnly);
      return { id: ++counter, node, latex: ommlToLatex(node), display, tag: numbered ? rest.match(EQNUM_RE)[1] : null };
    });
  }
  function wrapLatex(eq) {
    if (!eq.display) return "$" + eq.latex + "$";
    if (eq.tag) return "\\begin{equation}\\tag{" + eq.tag + "}\\label{eq:" + eq.tag + "}\n" + eq.latex + "\n\\end{equation}";
    return "\\[\n" + eq.latex + "\n\\]";
  }
  function parseXml(xml) {
    if (!dom.DOMParser) throw new Error("No DOMParser available; call setDomImplementation({ DOMParser, XMLSerializer })");
    return new dom.DOMParser().parseFromString(xml, "application/xml");
  }
  function paragraphsOf(doc) {
    const all = doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS(W_NS, "p") : doc.getElementsByTagName("w:p");
    return Array.from(all);
  }
  function extractEquations(documentXml) {
    counter = 0;
    const doc = parseXml(documentXml);
    const out = [];
    for (const p of paragraphsOf(doc)) {
      const eqs = convertParagraph(p);
      if (!eqs.length) continue;
      const context = otherText(p, eqs.map((e) => e.node)).trim().slice(0, 80);
      eqs.forEach((e) => out.push({ id: e.id, latex: e.latex, display: e.display, tag: e.tag, wrapped: wrapLatex(e), context }));
    }
    return out;
  }
  // Replace each equation with a placeholder run so mammoth preserves its position in the HTML.
  function prepareDocumentXml(documentXml) {
    counter = 0;
    const doc = parseXml(documentXml);
    const equations = [];
    for (const p of paragraphsOf(doc)) {
      const eqs = convertParagraph(p);
      for (const e of eqs) {
        equations.push({ id: e.id, latex: e.latex, display: e.display, tag: e.tag, wrapped: wrapLatex(e) });
        const r = doc.createElementNS(W_NS, "w:r");
        const t = doc.createElementNS(W_NS, "w:t");
        t.setAttribute("xml:space", "preserve");
        t.appendChild(doc.createTextNode("\uE000EQ" + e.id + "\uE000"));
        r.appendChild(t);
        // A numbered equation: the paragraph's whole non-math text is just "(1)" (that is what set `tag`), but Word usually splits it
        // over several runs ("(", "1", ")", a tab, or a SEQ field), so drop every plain run outside the math rather than looking for one that matches.
        if (e.tag) {
          for (const w of Array.from(p.getElementsByTagNameNS(W_NS, "r"))) { if (!insideMath(w) && isPlainTextRun(w)) w.parentNode.removeChild(w); }
        }
        e.node.parentNode.replaceChild(r, e.node);
      }
    }
    const xml = new dom.XMLSerializer().serializeToString(doc);
    return { xml, equations };
  }

  return { ommlToLatex, convertParagraph, extractEquations, prepareDocumentXml, wrapLatex, setDomImplementation, PLACEHOLDER_RE, M_NS, W_NS };
});
