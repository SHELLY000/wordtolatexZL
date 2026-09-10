(function () {
  "use strict";

  const conferenceStorageKey = "ei-typesetter-conference-v1";
  let conferenceStorageAvailable = true;
  let conferenceLastSaved = null;
  let paginationTimer;
  let toastTimer;

  const COPYRIGHT_OPTIONS = ["acmlicensed", "acmcopyright", "rightsretained", "cc", "none"];
  const ccsStorageKey = "ei-typesetter-ccs-v1";
  // Conference-relevant subset of the ACM CCS 2012 taxonomy (ids/labels taken from the official SKOS file).
  const CCS_OPTIONS = [
    { group: "ccs.group.ai", id: "10010147.10010178", desc: "Computing methodologies~Artificial intelligence", label: "Artificial intelligence" },
    { group: "ccs.group.ai", id: "10010147.10010178.10010179", desc: "Computing methodologies~Natural language processing", label: "Natural language processing ‹Artificial intelligence›" },
    { group: "ccs.group.ai", id: "10010147.10010178.10010179.10010182", desc: "Computing methodologies~Natural language generation", label: "Natural language generation ‹Artificial intelligence › Natural language processing›" },
    { group: "ccs.group.ai", id: "10010147.10010178.10010179.10010181", desc: "Computing methodologies~Discourse, dialogue and pragmatics", label: "Discourse, dialogue and pragmatics ‹Artificial intelligence › Natural language processing›" },
    { group: "ccs.group.ai", id: "10010147.10010178.10010179.10010183", desc: "Computing methodologies~Speech recognition", label: "Speech recognition ‹Artificial intelligence › Natural language processing›" },
    { group: "ccs.group.ai", id: "10010147.10010178.10010224", desc: "Computing methodologies~Computer vision", label: "Computer vision ‹Artificial intelligence›" },
    { group: "ccs.group.ai", id: "10010147.10010178.10010187", desc: "Computing methodologies~Knowledge representation and reasoning", label: "Knowledge representation and reasoning ‹Artificial intelligence›" },
    { group: "ccs.group.ai", id: "10010147.10010178.10010219.10010221", desc: "Computing methodologies~Intelligent agents", label: "Intelligent agents ‹Artificial intelligence › Distributed artificial intelligence›" },
    { group: "ccs.group.ai", id: "10010147.10010178.10010219.10010220", desc: "Computing methodologies~Multi-agent systems", label: "Multi-agent systems ‹Artificial intelligence › Distributed artificial intelligence›" },
    { group: "ccs.group.ai", id: "10010147.10010257", desc: "Computing methodologies~Machine learning", label: "Machine learning" },
    { group: "ccs.group.ai", id: "10010147.10010257.10010293.10010294", desc: "Computing methodologies~Neural networks", label: "Neural networks ‹Machine learning › Machine learning approaches›" },
    { group: "ccs.group.ai", id: "10010147.10010257.10010258.10010261", desc: "Computing methodologies~Reinforcement learning", label: "Reinforcement learning ‹Machine learning › Learning paradigms›" },
    { group: "ccs.group.ai", id: "10010147.10010257.10010258.10010262.10010277", desc: "Computing methodologies~Transfer learning", label: "Transfer learning ‹Machine learning › Learning paradigms › Multi-task learning›" },
    { group: "ccs.group.ai", id: "10010147.10010371.10010382.10010383", desc: "Computing methodologies~Image processing", label: "Image processing ‹Computer graphics › Image manipulation›" },
    { group: "ccs.group.is", id: "10002951.10003317.10003338.10003341", desc: "Information systems~Language models", label: "Language models ‹Information retrieval › Retrieval models and ranking›" },
    { group: "ccs.group.is", id: "10002951.10003317.10003347.10003350", desc: "Information systems~Recommender systems", label: "Recommender systems ‹Information retrieval › Retrieval tasks and goals›" },
    { group: "ccs.group.is", id: "10002951.10003227.10003351", desc: "Information systems~Data mining", label: "Data mining ‹Information systems applications›" },
    { group: "ccs.group.is", id: "10002951.10003227.10003241.10003244", desc: "Information systems~Data analytics", label: "Data analytics ‹Information systems applications › Decision support systems›" },
    { group: "ccs.group.is", id: "10003120.10003121.10003124.10010870", desc: "Human-centered computing~Natural language interfaces", label: "Natural language interfaces ‹Human computer interaction (HCI) › Interaction paradigms›" },
    { group: "ccs.group.is", id: "10003120.10003121", desc: "Human-centered computing~Human computer interaction (HCI)", label: "Human computer interaction (HCI)" },
    { group: "ccs.group.net", id: "10003033", desc: "Networks", label: "Networks" },
    { group: "ccs.group.net", id: "10003033.10003034", desc: "Networks~Network architectures", label: "Network architectures" },
    { group: "ccs.group.net", id: "10003033.10003039", desc: "Networks~Network protocols", label: "Network protocols" },
    { group: "ccs.group.net", id: "10003033.10003068.10003073.10003074", desc: "Networks~Network resources allocation", label: "Network resources allocation ‹Network algorithms › Control path algorithms›" },
    { group: "ccs.group.net", id: "10003033.10003079", desc: "Networks~Network performance evaluation", label: "Network performance evaluation" },
    { group: "ccs.group.net", id: "10003033.10003079.10011704", desc: "Networks~Network measurement", label: "Network measurement ‹Network performance evaluation›" },
    { group: "ccs.group.net", id: "10003033.10003099", desc: "Networks~Network services", label: "Network services" },
    { group: "ccs.group.net", id: "10003033.10003099.10003100", desc: "Networks~Cloud computing", label: "Cloud computing ‹Network services›" },
    { group: "ccs.group.net", id: "10003033.10003099.10003104", desc: "Networks~Network management", label: "Network management ‹Network services›" },
    { group: "ccs.group.net", id: "10003033.10003099.10003102", desc: "Networks~Programmable networks", label: "Programmable networks ‹Network services›" },
    { group: "ccs.group.net", id: "10003033.10003106.10003113", desc: "Networks~Mobile networks", label: "Mobile networks ‹Network types›" },
    { group: "ccs.group.net", id: "10003033.10003106.10003119", desc: "Networks~Wireless access networks", label: "Wireless access networks ‹Network types›" },
    { group: "ccs.group.net", id: "10003033.10003106.10003110", desc: "Networks~Data center networks", label: "Data center networks ‹Network types›" },
    { group: "ccs.group.net", id: "10003033.10003106.10003112", desc: "Networks~Cyber-physical networks", label: "Cyber-physical networks ‹Network types›" },
    { group: "ccs.group.net", id: "10003033.10003083.10003014", desc: "Networks~Network security", label: "Network security ‹Network properties›" },
    { group: "ccs.group.net", id: "10003033.10003083.10003014.10003017", desc: "Networks~Mobile and wireless security", label: "Mobile and wireless security ‹Network properties › Network security›" },
    { group: "ccs.group.net", id: "10003033.10003083.10003095", desc: "Networks~Network reliability", label: "Network reliability ‹Network properties›" },
    { group: "ccs.group.net", id: "10003033.10003058.10003065", desc: "Networks~Wireless access points, base stations and infrastructure", label: "Wireless access points, base stations and infrastructure ‹Network components›" },
    { group: "ccs.group.hw", id: "10010405.10010432.10010988", desc: "Applied computing~Telecommunications", label: "Telecommunications ‹Physical sciences and engineering›" },
    { group: "ccs.group.hw", id: "10010583.10010588.10011669", desc: "Hardware~Wireless devices", label: "Wireless devices ‹Communication hardware, interfaces and storage›" },
    { group: "ccs.group.hw", id: "10010583.10010588.10003247.10003248", desc: "Hardware~Digital signal processing", label: "Digital signal processing ‹Communication hardware, interfaces and storage › Signal processing systems›" },
    { group: "ccs.group.hw", id: "10003120.10003138.10003139.10010905", desc: "Human-centered computing~Mobile computing", label: "Mobile computing ‹Ubiquitous and mobile computing › Ubiquitous and mobile computing theory, concepts and paradigms›" },
    { group: "ccs.group.hw", id: "10002951.10003227.10003236.10003238", desc: "Information systems~Sensor networks", label: "Sensor networks ‹Information systems applications › Spatial-temporal systems›" },
    { group: "ccs.group.biz", id: "10002951.10003227", desc: "Information systems~Information systems applications", label: "Information systems applications" },
    { group: "ccs.group.biz", id: "10010405.10010406.10003228", desc: "Applied computing~Enterprise information systems", label: "Enterprise information systems ‹Enterprise computing›" },
    { group: "ccs.group.biz", id: "10002951.10003227.10003245", desc: "Information systems~Mobile information processing systems", label: "Mobile information processing systems ‹Information systems applications›" },
    { group: "ccs.group.biz", id: "10002951.10003260.10003304", desc: "Information systems~Web services", label: "Web services ‹World Wide Web›" },
    { group: "ccs.group.biz", id: "10010405.10003550", desc: "Applied computing~Electronic commerce", label: "Electronic commerce" },
    { group: "ccs.group.biz", id: "10010405.10010406", desc: "Applied computing~Enterprise computing", label: "Enterprise computing" },
    { group: "ccs.group.biz", id: "10010405.10010406.10010412", desc: "Applied computing~Business process management", label: "Business process management ‹Enterprise computing›" },
    { group: "ccs.group.biz", id: "10010405.10010406.10010421", desc: "Applied computing~Service-oriented architectures", label: "Service-oriented architectures ‹Enterprise computing›" },
    { group: "ccs.group.biz", id: "10010405.10010489.10010495", desc: "Applied computing~E-learning", label: "E-learning ‹Education›" },
    { group: "ccs.group.biz", id: "10003456.10003457.10003567", desc: "Social and professional topics~Computing and business", label: "Computing and business ‹Professional topics›" },
    { group: "ccs.group.biz", id: "10002978", desc: "Security and privacy", label: "Security and privacy" },
    { group: "ccs.group.biz", id: "10002978.10003029.10011150", desc: "Security and privacy~Privacy protections", label: "Privacy protections ‹Human and societal aspects of security and privacy›" },
    { group: "ccs.group.biz", id: "10002978.10002991.10002995", desc: "Security and privacy~Privacy-preserving protocols", label: "Privacy-preserving protocols ‹Security services›" },
    { group: "ccs.group.biz", id: "10002978.10003022", desc: "Security and privacy~Software and application security", label: "Software and application security" },
  ];

  // Pre-filled conference; anything the user edits (including clearing a field) is saved on top of these.
  const CONFERENCE_DEFAULTS = {
    name: "International Conference on Implementing Generative AI for Telecommunication and Digital Innovation 2026",
    shortName: "GAITDI 2026",
    year: "2026",
    dates: "", location: "", isbn: "",
    format: "acmsmall", copyright: "acmlicensed", folios: false
  };
  // Unicode characters that Word users type directly and that pdflatex rejects (xelatex silently drops the glyph).
  const TEX_SYMBOLS = {
    "α": "\\ensuremath{\\alpha}", "β": "\\ensuremath{\\beta}", "γ": "\\ensuremath{\\gamma}", "δ": "\\ensuremath{\\delta}", "ε": "\\ensuremath{\\varepsilon}", "ϵ": "\\ensuremath{\\epsilon}", "ζ": "\\ensuremath{\\zeta}", "η": "\\ensuremath{\\eta}", "θ": "\\ensuremath{\\theta}", "ϑ": "\\ensuremath{\\vartheta}", "ι": "\\ensuremath{\\iota}", "κ": "\\ensuremath{\\kappa}", "λ": "\\ensuremath{\\lambda}", "μ": "\\ensuremath{\\mu}", "µ": "\\ensuremath{\\mu}", "ν": "\\ensuremath{\\nu}", "ξ": "\\ensuremath{\\xi}", "ο": "o", "π": "\\ensuremath{\\pi}", "ρ": "\\ensuremath{\\rho}", "ϱ": "\\ensuremath{\\varrho}", "σ": "\\ensuremath{\\sigma}", "ς": "\\ensuremath{\\varsigma}", "τ": "\\ensuremath{\\tau}", "υ": "\\ensuremath{\\upsilon}", "φ": "\\ensuremath{\\varphi}", "ϕ": "\\ensuremath{\\phi}", "χ": "\\ensuremath{\\chi}", "ψ": "\\ensuremath{\\psi}", "ω": "\\ensuremath{\\omega}",
    "Γ": "\\ensuremath{\\Gamma}", "Δ": "\\ensuremath{\\Delta}", "Θ": "\\ensuremath{\\Theta}", "Λ": "\\ensuremath{\\Lambda}", "Ξ": "\\ensuremath{\\Xi}", "Π": "\\ensuremath{\\Pi}", "Σ": "\\ensuremath{\\Sigma}", "Υ": "\\ensuremath{\\Upsilon}", "Φ": "\\ensuremath{\\Phi}", "Ψ": "\\ensuremath{\\Psi}", "Ω": "\\ensuremath{\\Omega}", "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H", "Ι": "I", "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O", "Ρ": "P", "Τ": "T", "Χ": "X",
    "≤": "\\ensuremath{\\leq}", "≥": "\\ensuremath{\\geq}", "≠": "\\ensuremath{\\neq}", "≈": "\\ensuremath{\\approx}", "≡": "\\ensuremath{\\equiv}", "±": "\\ensuremath{\\pm}", "∓": "\\ensuremath{\\mp}", "×": "\\ensuremath{\\times}", "÷": "\\ensuremath{\\div}", "·": "\\ensuremath{\\cdot}", "⋅": "\\ensuremath{\\cdot}", "−": "\\ensuremath{-}", "∞": "\\ensuremath{\\infty}", "∑": "\\ensuremath{\\sum}", "∏": "\\ensuremath{\\prod}", "√": "\\ensuremath{\\surd}", "∂": "\\ensuremath{\\partial}", "∇": "\\ensuremath{\\nabla}", "∫": "\\ensuremath{\\int}", "∮": "\\ensuremath{\\oint}",
    "∈": "\\ensuremath{\\in}", "∉": "\\ensuremath{\\notin}", "∋": "\\ensuremath{\\ni}", "⊂": "\\ensuremath{\\subset}", "⊃": "\\ensuremath{\\supset}", "⊆": "\\ensuremath{\\subseteq}", "⊇": "\\ensuremath{\\supseteq}", "∪": "\\ensuremath{\\cup}", "∩": "\\ensuremath{\\cap}", "∅": "\\ensuremath{\\emptyset}", "∀": "\\ensuremath{\\forall}", "∃": "\\ensuremath{\\exists}", "¬": "\\ensuremath{\\neg}", "∧": "\\ensuremath{\\wedge}", "∨": "\\ensuremath{\\vee}", "⊕": "\\ensuremath{\\oplus}", "⊗": "\\ensuremath{\\otimes}", "⊥": "\\ensuremath{\\perp}", "∥": "\\ensuremath{\\parallel}", "∠": "\\ensuremath{\\angle}", "∝": "\\ensuremath{\\propto}", "∼": "\\ensuremath{\\sim}", "≃": "\\ensuremath{\\simeq}", "≅": "\\ensuremath{\\cong}", "≪": "\\ensuremath{\\ll}", "≫": "\\ensuremath{\\gg}",
    "→": "\\ensuremath{\\rightarrow}", "←": "\\ensuremath{\\leftarrow}", "↔": "\\ensuremath{\\leftrightarrow}", "⇒": "\\ensuremath{\\Rightarrow}", "⇐": "\\ensuremath{\\Leftarrow}", "⇔": "\\ensuremath{\\Leftrightarrow}", "↑": "\\ensuremath{\\uparrow}", "↓": "\\ensuremath{\\downarrow}", "↦": "\\ensuremath{\\mapsto}",
    "ℝ": "\\ensuremath{\\mathbb{R}}", "ℕ": "\\ensuremath{\\mathbb{N}}", "ℤ": "\\ensuremath{\\mathbb{Z}}", "ℚ": "\\ensuremath{\\mathbb{Q}}", "ℂ": "\\ensuremath{\\mathbb{C}}", "ℓ": "\\ensuremath{\\ell}", "ℏ": "\\ensuremath{\\hbar}", "°": "\\ensuremath{^{\\circ}}", "′": "\\ensuremath{^{\\prime}}", "″": "\\ensuremath{^{\\prime\\prime}}", "‰": "\\textperthousand{}", "•": "\\textbullet{}", "§": "\\S{}", "¶": "\\P{}", "©": "\\copyright{}", "®": "\\textregistered{}", "™": "\\texttrademark{}", "†": "\\dag{}", "‡": "\\ddag{}",
    "¹": "\\textsuperscript{1}", "²": "\\textsuperscript{2}", "³": "\\textsuperscript{3}", "⁰": "\\textsuperscript{0}", "⁴": "\\textsuperscript{4}", "⁵": "\\textsuperscript{5}", "⁶": "\\textsuperscript{6}", "⁷": "\\textsuperscript{7}", "⁸": "\\textsuperscript{8}", "⁹": "\\textsuperscript{9}", "₀": "\\textsubscript{0}", "₁": "\\textsubscript{1}", "₂": "\\textsubscript{2}", "₃": "\\textsubscript{3}", "₄": "\\textsubscript{4}", "₅": "\\textsubscript{5}", "₆": "\\textsubscript{6}", "₇": "\\textsubscript{7}", "₈": "\\textsubscript{8}", "₉": "\\textsubscript{9}", "½": "1/2", "¼": "1/4", "¾": "3/4",
    "–": "--", "—": "---", "…": "\\ldots{}", "“": "``", "”": "''", "‘": "`", "’": "'", "„": ",,", "\u00a0": "~", "\u202f": "~", "\u2009": "\\,", "\u200b": "", "\ufeff": "", "\u2028": " "
  };
  const TEX_SYMBOL_RE = new RegExp("[" + Object.keys(TEX_SYMBOLS).map((c) => "\\u" + c.codePointAt(0).toString(16).padStart(4, "0")).join("") + "]", "g");
  const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"'（）()]+)/g;

  const $ = (id) => document.getElementById(id);
  const I18N = GalleyTeXI18N, t = I18N.t;
  I18N.setLanguage(I18N.detect());
  I18N.apply(document);
  const state = { step: "import", file: null, templateFile: { name: "built-in acmart template" }, templateText: "", templateZip: null, templateEntries: [], templateMainPath: "main.tex", templateType: "acm", layoutMode: "single", fixedAssetsPromise: null, conference: {}, sourceHtml: "", bodyHtml: "", renderedBodyHtml: "", bodyStatsCache: null, zoom: 82, metadata: {}, authors: [], equations: [], charts: 0, oleObjects: 0, equationsDropped: 0, mathErrors: 0, citeStats: null, floatMode: "auto" };
  const els = {
    fileInput: $("fileInput"), dropZone: $("dropZone"), fileCard: $("fileCard"), fileName: $("fileName"), fileMeta: $("fileMeta"),
    emptyNotice: $("emptyNotice"), next: $("nextBtn"), back: $("backBtn"), paper: $("paper"), body: $("paperBody"),
    title: $("titleInput"), authors: $("authorsInput"), affiliation: $("affiliationInput"), email: $("emailInput"),
    abstract: $("abstractInput"), keywords: $("keywordsInput"), doi: $("doiInput"), ccs: $("ccsInput")
  };

  const labels = {
    import: { panel: "importPanel", next: "next.import" },
    review: { panel: "reviewPanel", next: "next.review" },
    export: { panel: "exportPanel", next: "next.export" }
  };

  document.querySelectorAll(".step").forEach((button) => button.addEventListener("click", () => {
    if (!state.file && button.dataset.step !== "import") return;
    setStep(button.dataset.step);
  }));
  els.fileInput.addEventListener("change", (event) => handleFile(event.target.files[0]));
  bindDropZone(els.dropZone, els.fileInput, handleFile);
  $("removeFile").addEventListener("click", resetWord);
  $("saveConference").addEventListener("click", () => saveConferenceSettings(true));
  $("exportConference").addEventListener("click", exportConferenceSettings);
  $("resetConference").addEventListener("click", () => {
    state.conference = Object.assign({}, CONFERENCE_DEFAULTS);
    fillConferenceForm(state.conference);
    saveConferenceSettings(false);
    applyFixedTemplate(); updatePreview();
    setSaveState("venue.state.restored", { short: CONFERENCE_DEFAULTS.shortName });
    showToast(t("venue.toast.restored"));
  });
  $("importConferenceInput").addEventListener("change", importConferenceSettings);
  ["conferenceName", "conferenceShort", "conferenceYear", "conferenceDates", "conferenceLocation", "conferenceIsbn", "conferenceFormat", "conferenceCopyright", "conferenceFolios"].forEach((id) => ["input", "change"].forEach((type) => $(id).addEventListener(type, () => {
    state.conference = readConferenceForm();
    saveConferenceSettings(false);
    applyFixedTemplate();
    updatePreview();
  })));
  els.next.addEventListener("click", () => {
    if (!state.file) return;
    if (state.step === "import") setStep("review");
    else if (state.step === "review") setStep("export");
    else setStep("review");
  });
  els.back.addEventListener("click", () => setStep(state.step === "export" ? "review" : "import"));
  [els.title, els.authors, els.affiliation, els.email, els.abstract, els.keywords, els.doi, els.ccs].forEach((input) => input.addEventListener("input", () => { autoGrow(input); applyFixedTemplate(); updatePreview(); }));
  $("zoomOut").addEventListener("click", () => setZoom(state.zoom - 8));
  $("zoomIn").addEventListener("click", () => setZoom(state.zoom + 8));
  $("printPdf").addEventListener("click", prepareLocalPdf);
  $("downloadProject").addEventListener("click", downloadLatexProject);
  $("addAuthor").addEventListener("click", () => { state.authors.push(blankAuthor()); renderAuthorEditor(); updatePreview(); });
  $("authorEditor").addEventListener("input", handleAuthorEdit);
  $("authorEditor").addEventListener("change", handleAuthorEdit);
  $("authorEditor").addEventListener("click", handleAuthorAction);
  $("contentEditor").addEventListener("input", scheduleContentEdit);
  $("contentEditor").addEventListener("change", (event) => { if (event.target.classList.contains("block-type")) retagBlock(event.target); });
  if ($("floatMode")) $("floatMode").addEventListener("change", (event) => { state.floatMode = event.target.value; });
  document.querySelectorAll(".lang-switch button").forEach((button) => button.addEventListener("click", () => switchLanguage(button.dataset.lang)));
  markLanguageSwitch();
  initCcsPicker();
  loadConferenceSettings();
  applyFixedTemplate();
  updatePreview();
  loadFixedAssets().catch((error) => console.error(error));

  function setStep(step) {
    flushContentEdit();
    state.step = step;
    Object.values(labels).forEach((item) => $(item.panel).classList.add("hidden"));
    $(labels[step].panel).classList.remove("hidden");
    document.querySelectorAll(".step").forEach((button) => {
      const order = ["import", "review", "export"];
      button.classList.toggle("active", button.dataset.step === step);
      button.classList.toggle("done", order.indexOf(button.dataset.step) < order.indexOf(step));
    });
    els.back.classList.toggle("hidden", step === "import");
    els.next.textContent = t(state.file ? labels[step].next : "next.initial");
    els.next.disabled = !state.file;
    if (step === "export") showToast(t("toast.exportReady"));
  }

  function bindDropZone(zone, input, handler) {
    zone.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && !zone.classList.contains("locked")) input.click(); });
    ["dragenter", "dragover"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); if (!zone.classList.contains("locked")) zone.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((name) => zone.addEventListener(name, (event) => { event.preventDefault(); zone.classList.remove("drag"); }));
    zone.addEventListener("drop", (event) => { if (!zone.classList.contains("locked")) handler(event.dataTransfer.files[0]); });
  }


  function conferenceFormat() { return (state.conference || {}).format === "manuscript" ? "manuscript" : "acmsmall"; }
  function conferenceCopyright() { const value = (state.conference || {}).copyright; return COPYRIGHT_OPTIONS.includes(value) ? value : "acmlicensed"; }
  function cleanDoi(value) { return String(value || "").trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, ""); }

  // Mirrors samples/acmsmall-conf.tex (final single-column proceedings) or samples/acmmanuscript.tex (submission).
  function fixedTemplate() {
    const info = state.conference || {};
    const format = conferenceFormat();
    const year = /^\d{4}$/.test(info.year || "") ? info.year : "";
    const name = texEscape(info.name || "Conference information to be supplied");
    const shortName = texEscape(info.shortName || "Conference");
    const dates = texEscape(info.dates || "");
    const location = texEscape(info.location || "");
    const doi = texEscape(cleanDoi(els.doi && els.doi.value));
    const rights = ["\\setcopyright{" + conferenceCopyright() + "}"];
    if (year) rights.push("\\copyrightyear{" + year + "}", "\\acmYear{" + year + "}");
    if (doi) rights.push("\\acmDOI{" + doi + "}");
    rights.push("\\acmConference[" + shortName + "]{" + name + "}{" + dates + "}{" + location + "}");
    if (info.isbn) rights.push("\\acmISBN{" + texEscape(info.isbn) + "}");
    if (format === "acmsmall" && info.folios) rights.push("\\settopmatter{printfolios=true}");
    const classOptions = format === "manuscript" ? "manuscript,screen,review" : "acmsmall";
    return String.raw`\documentclass[${classOptions}]{acmart}
\usepackage{tabularx}
\usepackage{multirow}
\usepackage{xltabular}
\usepackage{placeins}
\usepackage{float}
\renewcommand{\topfraction}{0.9}\renewcommand{\bottomfraction}{0.8}\renewcommand{\textfraction}{0.05}\renewcommand{\floatpagefraction}{0.75}
\setcounter{topnumber}{4}\setcounter{bottomnumber}{3}\setcounter{totalnumber}{6}
{{CJK}}
${rights.join("\n")}

\begin{document}
{{TITLECMD}}

{{AUTHORS}}
{{SHORTAUTHORS}}
\begin{abstract}
{{ABSTRACT}}
\end{abstract}

{{CCS}}
\keywords{{{KEYWORDS}}}
\maketitle

{{CONTENT}}

\end{document}
`;
  }

  // The status line under the venue form is re-rendered on a language switch, so its key and parameters are kept.
  function setSaveState(key, vars) { state.saveState = { key, vars }; $("conferenceSaveState").textContent = t(key, vars); }

  function markLanguageSwitch() {
    document.querySelectorAll(".lang-switch button").forEach((button) => button.classList.toggle("active", button.dataset.lang === I18N.language()));
  }
  // Switch the interface language and redraw everything that was rendered from strings.
  function switchLanguage(lang) {
    if (lang === I18N.language()) return;
    flushContentEdit();
    I18N.setLanguage(lang);
    I18N.apply(document);
    markLanguageSwitch();
    if (state.saveState) $("conferenceSaveState").textContent = t(state.saveState.key, state.saveState.vars);
    if (state.file && state.fileMetaKey) els.fileMeta.textContent = t(state.fileMetaKey, { size: formatBytes(state.file.size), words: (state.metadata.wordCount || 0).toLocaleString() });
    if (state.recognitionKey) $("recognitionBadge").textContent = t(state.recognitionKey);
    fillCcsSelect(); renderCcsChips();
    renderAuthorEditor();
    if (state.bodyHtml) renderContentEditor();
    applyFixedTemplate();
    els.next.textContent = t(state.file ? labels[state.step].next : "next.initial");
    if (state.file) updateChecks();
  }

  function readConferenceForm() {
    return { name: $("conferenceName").value.trim(), shortName: $("conferenceShort").value.trim(), year: $("conferenceYear").value.trim(), dates: $("conferenceDates").value.trim(), location: $("conferenceLocation").value.trim(), isbn: $("conferenceIsbn").value.trim(), format: $("conferenceFormat").value, copyright: $("conferenceCopyright").value, folios: $("conferenceFolios").checked };
  }

  function loadConferenceSettings() {
    try {
      const probeKey = "__ei_typesetter_storage_test__";
      const probeValue = String(Date.now());
      localStorage.setItem(probeKey, probeValue);
      if (localStorage.getItem(probeKey) !== probeValue) throw new Error("storage unavailable");
      localStorage.removeItem(probeKey);
      const stored = JSON.parse(localStorage.getItem(conferenceStorageKey) || "null");
      state.conference = Object.assign({}, CONFERENCE_DEFAULTS, stored || {});
      fillConferenceForm(state.conference);
      setSaveState(stored ? "venue.state.loaded" : "venue.state.defaults");
    } catch (_) {
      conferenceStorageAvailable = false;
      state.conference = Object.assign({}, CONFERENCE_DEFAULTS);
      fillConferenceForm(state.conference);
      setSaveState("venue.state.noStorageDefaults");
    }
  }

  function fillConferenceForm(info) {
    const map = { conferenceName: "name", conferenceShort: "shortName", conferenceYear: "year", conferenceDates: "dates", conferenceLocation: "location", conferenceIsbn: "isbn" };
    Object.entries(map).forEach(([id, key]) => { $(id).value = info[key] || ""; });
    $("conferenceFormat").value = info.format === "manuscript" ? "manuscript" : "acmsmall";
    $("conferenceCopyright").value = COPYRIGHT_OPTIONS.includes(info.copyright) ? info.copyright : "acmlicensed";
    $("conferenceFolios").checked = !!info.folios;
  }

  function saveConferenceSettings(notifyUser) {
    state.conference = readConferenceForm();
    if (!conferenceStorageAvailable) {
      setSaveState("venue.state.noStorage");
      if (notifyUser) showToast(t("venue.toast.noStorage"));
      return false;
    }
    try {
      localStorage.setItem(conferenceStorageKey, JSON.stringify(state.conference));
      conferenceLastSaved = new Date();
      const savedAt = conferenceLastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setSaveState("venue.state.saved", { time: savedAt });
      if (notifyUser) showToast(t("venue.toast.saved"));
      return true;
    } catch (_) {
      conferenceStorageAvailable = false;
      setSaveState("venue.state.noStorage");
      if (notifyUser) showToast(t("venue.toast.noStorage"));
      return false;
    }
  }

  function exportConferenceSettings() {
    state.conference = readConferenceForm();
    const payload = { format: "ei-typesetter-conference", version: 1, conference: state.conference };
    const name = safeBaseName(state.conference.shortName || state.conference.name || "conference") + t("venue.fileSuffix");
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }), name);
    setSaveState("venue.state.downloaded");
    showToast(t("venue.toast.downloaded"));
  }

  async function importConferenceSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const info = payload && payload.format === "ei-typesetter-conference" ? payload.conference : payload;
      if (!info || typeof info !== "object" || Array.isArray(info)) throw new Error("invalid");
      state.conference = { name: String(info.name || ""), shortName: String(info.shortName || ""), year: String(info.year || ""), dates: String(info.dates || ""), location: String(info.location || ""), isbn: String(info.isbn || ""), format: info.format === "manuscript" ? "manuscript" : "acmsmall", copyright: COPYRIGHT_OPTIONS.includes(info.copyright) ? info.copyright : "acmlicensed", folios: !!info.folios };
      fillConferenceForm(state.conference);
      const stored = saveConferenceSettings(false);
      setSaveState(stored ? "venue.state.imported" : "venue.state.importedNoStorage");
      applyFixedTemplate(); updatePreview();
      showToast(t("venue.toast.imported"));
    } catch (_) { showToast(t("venue.toast.invalid")); }
    event.target.value = "";
  }

  function applyFixedTemplate() {
    state.layoutMode = "single";
    state.templateText = fixedTemplate();
    els.paper.classList.add("single-column");
    const manuscript = conferenceFormat() === "manuscript";
    const label = t(manuscript ? "template.manuscript.label" : "template.acmsmall.label");
    const tag = t(manuscript ? "template.manuscript.tag" : "template.acmsmall.tag");
    $("templateClassName").textContent = label;
    $("templateMainName").textContent = t("template.mainName");
    $("detectedTemplate").textContent = tag;
    $("exportFormatTag").textContent = tag;
    $("previewStatus").textContent = t(state.file ? "preview.generated" : "preview.ready", { label });
    applyTemplatePreview("acm", state.templateText);
  }

  async function loadFixedAssets() {
    if (state.templateZip) return state.templateZip;
    if (!state.fixedAssetsPromise) state.fixedAssetsPromise = JSZip.loadAsync("__ACMART_TEMPLATE_B64__", { base64: true }).then((zip) => {
      state.templateZip = zip;
      state.templateEntries = Object.keys(zip.files).filter((path) => !zip.files[path].dir && safeZipPath(path));
      return zip;
    });
    return state.fixedAssetsPromise;
  }


  function templateLabel(type) { return ({ acm: t("template.manuscript.label"), ieee: "IEEE", llncs: "Springer LNCS" })[type] || t("template.generic"); }

  function applyTemplatePreview(type, text) {
    els.paper.classList.remove("template-acm", "template-ieee", "template-llncs", "template-article", "template-twocolumn");
    els.paper.classList.add("template-" + type);
    const conference = extractLatexArgument(text, "acmConference") || extractLatexArgument(text, "conference") || templateLabel(type);
    els.paper.querySelector(".paper-kicker").textContent = conference.replace(/\\[A-Za-z]+/g, "").replace(/[{}]/g, " ").trim() || templateLabel(type);
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) return showToast(t("toast.notDocx"));
    if (file.size > 30 * 1024 * 1024) return showToast(t("toast.tooLarge"));
    state.file = file;
    els.dropZone.classList.add("hidden");
    els.emptyNotice.classList.add("hidden");
    els.fileCard.classList.remove("hidden");
    els.fileName.textContent = file.name;
    state.fileMetaKey = "file.recognising"; els.fileMeta.textContent = t("file.recognising", { size: formatBytes(file.size) });
    els.next.disabled = true;
    $("previewStatus").textContent = t("preview.parsing");
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Rewrite document.xml before mammoth sees it: Word equations become LaTeX placeholders, native charts
      // become placeholders, and heading styles from any template (ACM Head1…, Springer, IEEE) are mapped by outline level.
      const pre = await preprocessDocx(arrayBuffer);
      const result = await mammoth.convertToHtml({ arrayBuffer: pre.arrayBuffer }, {
        styleMap: [
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => p.subtitle:fresh",
          "p[style-name='Abstract'] => p.abstract-source:fresh",
          "p[style-name='Keywords'] => p.keywords-source:fresh",
          "p[style-name='Caption'] => figcaption:fresh"
        ].concat(pre.styleMap),
        convertImage: mammoth.images.imgElement((image) => image.read("base64").then((data) => {
          const src = "data:" + image.contentType + ";base64," + data;
          return measureImage(src).then((size) => ({ src, "data-w": String(size.width), "data-h": String(size.height) }));
        }))
      });
      state.equations = pre.equations; state.charts = pre.charts; state.oleObjects = pre.oleObjects; state.equationsDropped = pre.failed;
      state.sourceHtml = cleanHtml(restorePlaceholders(inlineFootnotes(result.value), pre));
      const parsed = parseAcademicDocument(state.sourceHtml, file.name);
      state.bodyHtml = parsed.bodyHtml;
      state.metadata = parsed;
      populateFields(parsed);
      updatePreview();
      updateReport(parsed, result.messages);
      state.fileMetaKey = "file.words"; els.fileMeta.textContent = t("file.words", { size: formatBytes(file.size), words: parsed.wordCount.toLocaleString() });
      els.next.disabled = false;
      els.next.textContent = t("next.import");
      applyFixedTemplate();
      showToast(t("toast.recognised"));
    } catch (error) {
      console.error(error);
      showToast(t("toast.unreadable"));
      resetWord();
    }
  }

  // ---------------------------------------------------------------------------
  // docx pre-processing: equations, charts, heading styles
  // ---------------------------------------------------------------------------
  const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const CHART_PLACEHOLDER_RE = /\uE000CHART(\d+)\uE000/g;

  async function preprocessDocx(arrayBuffer) {
    const out = { arrayBuffer, equations: [], charts: 0, oleObjects: 0, failed: 0, styleMap: [] };
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const entry = zip.file("word/document.xml");
      if (!entry) return out;
      let xml = await entry.async("string");
      out.oleObjects = (xml.match(/<w:object[\s>]/g) || []).length;
      // Native charts / SmartArt carry no bitmap; keep their position with a placeholder run.
      const chartPlaceholder = (block) => {
        if (!/<c:chart[\s>]|<dgm:relIds[\s>]/.test(block)) return block;
        out.charts++;
        return '<w:t xml:space="preserve">\uE000CHART' + out.charts + '\uE000</w:t>';
      };
      xml = xml.replace(/<mc:AlternateContent>[\s\S]*?<\/mc:AlternateContent>/g, chartPlaceholder);
      xml = xml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, chartPlaceholder);
      // Word equations (OMML) -> LaTeX, leaving a placeholder run at the equation's position.
      if (/<m:oMath[\s>]/.test(xml) && typeof OMML2LaTeX !== "undefined") {
        try {
          const prepared = OMML2LaTeX.prepareDocumentXml(xml);
          xml = prepared.xml;
          out.equations = prepared.equations;
        } catch (error) { console.error("OMML conversion failed", error); out.failed = (xml.match(/<m:oMath[\s>]/g) || []).length; }
      }
      const stylesEntry = zip.file("word/styles.xml");
      if (stylesEntry) out.styleMap = styleMapFromStyles(await stylesEntry.async("string"));
      zip.file("word/document.xml", xml);
      out.arrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
    } catch (error) { console.error("docx pre-processing failed", error); }
    return out;
  }

  // Map every paragraph style that carries an outline level (directly or via basedOn) to a heading tag,
  // and every "…Caption" style to figcaption. This is what makes ACM's Head1/Head2/Head3 work.
  function styleMapFromStyles(stylesXml) {
    const map = [];
    try {
      const doc = new DOMParser().parseFromString(stylesXml, "application/xml");
      const styles = {};
      [...doc.getElementsByTagNameNS(W_NS, "style")].forEach((st) => {
        if (st.getAttributeNS(W_NS, "type") !== "paragraph" && st.getAttribute("w:type") !== "paragraph") return;
        const id = st.getAttributeNS(W_NS, "styleId") || st.getAttribute("w:styleId");
        const nameEl = st.getElementsByTagNameNS(W_NS, "name")[0];
        const basedEl = st.getElementsByTagNameNS(W_NS, "basedOn")[0];
        const lvlEl = st.getElementsByTagNameNS(W_NS, "outlineLvl")[0];
        styles[id] = { name: nameEl ? (nameEl.getAttributeNS(W_NS, "val") || nameEl.getAttribute("w:val")) : id, basedOn: basedEl ? (basedEl.getAttributeNS(W_NS, "val") || basedEl.getAttribute("w:val")) : null, lvl: lvlEl ? Number(lvlEl.getAttributeNS(W_NS, "val") || lvlEl.getAttribute("w:val")) : null };
      });
      const level = (id, depth) => {
        const st = styles[id]; if (!st || depth > 12) return null;
        if (st.lvl !== null && !Number.isNaN(st.lvl)) return st.lvl;
        const m = /^heading (\d)$/i.exec(st.name || ""); if (m) return Number(m[1]) - 1;
        return st.basedOn ? level(st.basedOn, depth + 1) : null;
      };
      Object.keys(styles).forEach((id) => {
        const st = styles[id]; const name = st.name || "";
        if (!name || /['"]/.test(name) || /^heading \d$/i.test(name)) return; // mammoth handles built-in headings
        if (/caption|图题|表题/i.test(name)) { map.push("p[style-name='" + name + "'] => figcaption:fresh"); return; }
        if (/^(subtitle|abstract|keywords)$/i.test(name)) return;
        if (/^title$/i.test(name)) return;
        if (/title/i.test(name) && !/sub/i.test(name)) { map.push("p[style-name='" + name + "'] => h1.title:fresh"); return; }
        const lvl = level(id, 0);
        if (lvl !== null && lvl >= 0 && lvl <= 5) map.push("p[style-name='" + name + "'] => h" + (lvl + 1) + ":fresh");
      });
    } catch (error) { console.error("styles.xml parsing failed", error); }
    return map;
  }

  // Put the converted equations / chart placeholders back into mammoth's HTML.
  function restorePlaceholders(html, pre) {
    const byId = {};
    (pre.equations || []).forEach((e) => { byId[e.id] = e; });
    html = html.replace(OMML2LaTeX.PLACEHOLDER_RE, (m, id) => {
      const e = byId[id]; if (!e) return "";
      return '<span class="math" data-eq="' + id + '" data-display="' + (e.display ? "1" : "0") + '"' + (e.tag ? ' data-tag="' + escapeHtml(e.tag) + '"' : "") + ">" + escapeHtml(e.latex) + "</span>";
    });
    html = html.replace(CHART_PLACEHOLDER_RE, (m, n) => '<span class="placeholder-chart" data-kind="chart">' + escapeHtml(t("block.chartPlaceholder", { n })) + '</span>');
    return html;
  }

  // "…end of abstract.<br>Keywords: a; b" -> two paragraphs, so the labelled-block extraction sees the label.
  function splitLabelledBreaks(root) {
    const LABEL = /^\s*(abstract|keywords?|index terms?|key words|ccs concepts?|摘要|关键词)\s*[:：]/i;
    const strip = (h) => h.replace(/<[^>]+>/g, "");
    [...root.children].slice(0, 25).forEach((p) => {
      if (p.tagName !== "P" || !p.querySelector("br")) return;
      const parts = p.innerHTML.split(/<br\s*\/?>/i);           // the <br> may sit inside <strong>/<em>; the parser repairs the split tags
      if (!parts.some((h, i) => i > 0 && LABEL.test(strip(h)))) return;
      const frag = document.createDocumentFragment();
      parts.forEach((h) => { const np = document.createElement("p"); np.innerHTML = h; if (np.textContent.trim()) frag.appendChild(np); });
      p.replaceWith(frag);
    });
  }

  // ACM's Head3 (and similar) are run-in headings: the heading style is often left on a whole body paragraph, or the
  // heading and the first sentence share one paragraph. A "heading" that reads like a paragraph is demoted or split.
  function fixRunInHeadings(root) {
    [...root.querySelectorAll("h1, h2, h3, h4")].forEach((h) => {
      const text = h.textContent.replace(/\s+/g, " ").trim();
      const long = text.length > 100 || (text.length > 60 && /[.。!?]$/.test(text));
      if (!long) return;
      const lead = h.firstElementChild;
      const leadText = lead && /^(STRONG|B|EM|I)$/.test(lead.tagName) ? lead.textContent.trim() : "";
      const p = document.createElement("p");
      if (leadText && leadText.length < 100 && leadText.length < text.length - 10) {
        const rest = h.innerHTML.slice(h.innerHTML.indexOf(lead.outerHTML) + lead.outerHTML.length).replace(/^[\s.:：—-]+/, "");
        h.innerHTML = leadText;
        p.innerHTML = rest;
        h.after(p);
      } else {
        p.innerHTML = h.innerHTML;
        h.replaceWith(p);
      }
    });
  }

  // Manually formatted headings: bold Normal paragraphs such as "2.1 Method", "I. INTRODUCTION", "A. Subsection".
  function promoteBoldHeadings(root) {
    const ARABIC = /^(\d+(?:\.\d+)*)[.)]?\s*(?=[A-Za-z\u4e00-\u9fff])/;
    const ROMAN = /^([IVXLC]{1,6})[.)]\s*(?=[A-Za-z])/;
    const LETTER = /^([A-Z])[.)]\s*(?=[A-Za-z])/;
    const KNOWN = /^(acknowledg(e)?ments?|references?|bibliography|works cited|author contributions?|declarations?|conflicts? of interest|funding|data availability|参考文献|致谢)\b/i;
    let lastNumberedLevel = 0, lastLetter = "", seenNumbered = false;
    [...root.querySelectorAll("p")].forEach((p) => {
      if (p.closest("table, li")) return;
      const text = p.textContent.replace(/\s+/g, " ").trim();
      if (!text || text.length > 100 || /[.:;,。；，：]$/.test(text)) return;
      const boldLen = [...p.querySelectorAll("strong, b")].map((s) => s.textContent.replace(/\s+/g, " ").trim()).join("").length;
      if (boldLen < text.length * 0.9) return;
      let level = 0, numbered = false, m;
      if ((m = text.match(ARABIC))) { level = Math.min(3, m[1].split(".").length); numbered = true; lastLetter = ""; }
      else if ((m = text.match(LETTER)) && (m[1] === "A" || m[1] === String.fromCharCode(lastLetter.charCodeAt(0) + 1)) && seenNumbered) { level = 2; numbered = true; lastLetter = m[1]; }
      else if ((m = text.match(ROMAN))) { level = 1; numbered = true; lastLetter = ""; }
      else if (KNOWN.test(text)) level = 1;
      else if (seenNumbered && /^[A-Z][A-Za-z0-9&,\-\u2013\/ ]+$/.test(text) && text.split(" ").length <= 10) level = Math.min(3, lastNumberedLevel + 1);
      if (!level) return;
      if (numbered) { lastNumberedLevel = level; seenNumbered = true; }
      const h = document.createElement("h" + level);
      h.textContent = text;
      h.dataset.src = "bold";
      p.replaceWith(h);
    });
  }

  // Journal templates put the masthead and the abstract/keywords box in tables. Unwrap the useful cells, drop the rest.
  function unwrapLayoutTables(root) {
    const children = [...root.children];
    const firstHeading = children.findIndex((n) => /^H[1-4]$/.test(n.tagName));
    children.slice(0, firstHeading < 0 ? 15 : Math.min(firstHeading, 15)).forEach((node) => {
      if (node.tagName !== "TABLE") return;
      const text = node.textContent.replace(/\s+/g, " ");
      const cells = [...node.querySelectorAll("td, th")];
      const keep = cells.filter((td) => /\b(abstract|keywords?|key words|index terms)\b|摘要|关键词/i.test(td.textContent));
      if (keep.length) {
        const frag = document.createDocumentFragment();
        keep.forEach((td) => { const ps = [...td.querySelectorAll("p")]; (ps.length ? ps : [td]).forEach((el) => { const p = document.createElement("p"); p.innerHTML = el.innerHTML; frag.appendChild(p); }); });
        node.replaceWith(frag);
      } else if (/\b(ISSN|DOI|Vol\.|Open Access|Peer-Reviewed|Received|Accepted|Available online|Article history)\b/i.test(text) && cells.length <= 6) {
        node.remove();
      }
    });
  }

  // mammoth emits footnote marks as <sup><a href="#footnote-N">[N]</a></sup> and dumps every note body
  // into an <ol> at the very end of the document. Move each note body inline next to its mark so that
  // the LaTeX export can emit \footnote{} and the preview can place it at the bottom of the right page.
  function inlineFootnotes(html) {
    const doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html");
    const root = doc.body.firstElementChild;
    const notes = {};
    root.querySelectorAll("li[id^='footnote-'], li[id^='endnote-']").forEach((li) => {
      li.querySelectorAll("a[href^='#footnote-ref-'], a[href^='#endnote-ref-']").forEach((a) => a.remove());
      const paragraphs = [...li.querySelectorAll("p")];
      notes[li.id] = (paragraphs.length ? paragraphs.map((p) => p.innerHTML) : [li.innerHTML]).join(" ").trim();
      const list = li.parentElement;
      li.remove();
      if (list && !list.children.length) list.remove();
    });
    root.querySelectorAll("a[href^='#footnote-'], a[href^='#endnote-']").forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      if (!(id in notes)) return;
      const span = doc.createElement("span");
      span.className = "footnote";
      span.innerHTML = notes[id];
      let target = a;
      while (target.parentElement && target.parentElement.tagName === "SUP" && target.parentElement.childNodes.length === 1) target = target.parentElement;
      target.replaceWith(span);
    });
    return root.innerHTML;
  }

  function cleanHtml(html) {
    const doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html");
    doc.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());
    doc.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        const allowed = ["href", "src", "alt", "colspan", "rowspan", "class", "data-w", "data-h", "data-eq", "data-display", "data-tag", "data-kind", "data-src"];
        if (!allowed.includes(attr.name) || (/^javascript:/i.test(attr.value))) node.removeAttribute(attr.name);
      });
    });
    return doc.body.firstElementChild.innerHTML;
  }

  function parseAcademicDocument(html, filename) {
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    unwrapLayoutTables(wrap);
    splitLabelledBreaks(wrap);
    fixRunInHeadings(wrap);
    promoteBoldHeadings(wrap);
    const nodes = [...wrap.children];
    const titleCandidates = nodes.slice(0, 12).map((node, index) => {
      const text = node.textContent.replace(/\s+/g, " ").trim(); let score = 12 - index;
      if (node.matches("h1.title,.title")) score += 12;
      else if (/^H[1-6]$/.test(node.tagName)) score -= 40; // a real section heading, not the title
      if (text.length >= 18 && text.length <= 260) score += 8;
      if (text.length < 15 && !node.matches("h1,.title")) score -= 10;
      if (looksLikeSectionHeading(text) || /^(abstract|摘要|keywords?|关键词|references|参考文献)$/i.test(text)) score -= 40;
      if (/@|doi\s*:|university|college|institute|department|大学|学院|研究院/i.test(text)) score -= 16;
      return { node, text, score };
    }).filter((item) => item.text.length > 4 && item.text.length < 320).sort((a, b) => b.score - a.score);
    const bestTitle = titleCandidates[0];
    let titleNode = bestTitle && bestTitle.score > 5 ? bestTitle.node : null;
    const title = titleNode ? titleNode.textContent.trim() : filename.replace(/\.docx$/i, "");
    const KEYWORDS_RE = /^(keywords?|index terms?|关键词|key words)\s*[:：.—-]?\s*/i;
    const CCS_RE = /^ccs\s*concepts?\s*[:：.—-]?\s*/i;
    const abstractData = extractLabeledBlock(nodes, /^(abstract|摘要)\s*[:：.—-]?\s*/i, /^(keywords?|index terms?|关键词|key words|ccs\s*concepts?)\s*[:：.—-]?\s*/i, false, 6000);
    const ccsData = extractLabeledBlock(nodes, CCS_RE, KEYWORDS_RE, true, 400);
    const keywordData = extractLabeledBlock(nodes, KEYWORDS_RE, /^(\d+(\.\d+)*[.)]?\s+|[IVX]+[.)]\s+)?(introduction|引言|background|背景)\b/i, true, 400);
    const titleIndex = titleNode ? nodes.indexOf(titleNode) : -1;
    const frontStart = titleIndex + 1;
    const abstractFound = abstractData.startIndex >= 0;
    const frontEnd = abstractFound ? abstractData.startIndex : findFrontMatterEnd(nodes, frontStart);
    const frontLines = frontMatterLines(nodes, frontStart, frontEnd);
    const authorRecords = assembleAuthors(frontLines);
    const remove = new Set();
    if (titleNode) remove.add(titleNode);
    const markRange = (data) => { if (data.startIndex >= 0) for (let i = data.startIndex; i <= data.endIndex; i++) remove.add(nodes[i]); };
    markRange(abstractData); markRange(keywordData); markRange(ccsData);
    // With an abstract present everything between title and abstract is front matter.
    // Without one, only remove the lines actually recognised as author/affiliation/contact info so body text is never lost.
    if (abstractFound) for (let i = frontStart; i < frontEnd; i++) remove.add(nodes[i]);
    else frontLines.forEach((line) => { if (line.consumed) remove.add(line.node); });

    let inReferences = false;
    nodes.forEach((node) => {
      const text = node.textContent.trim();
      if (remove.has(node)) return;
      if (/^H[1-6]$/.test(node.tagName)) { if (REFERENCES_RE.test(text)) inReferences = true; return; }
      if (node.tagName !== "P" || inReferences) return;
      const depth = plainHeadingDepth(text);
      if (depth === 1 && REFERENCES_RE.test(text)) inReferences = true;
      if (depth) {
        const heading = document.createElement("h" + depth);
        heading.innerHTML = node.innerHTML;
        node.replaceWith(heading);
      }
    });
    remove.forEach((node) => node && node.remove());
    classifyImages(wrap);
    wrap.querySelectorAll("img.img-figure").forEach((img, i) => { if (!img.alt) img.alt = "Figure " + (i + 1); });
    const headings = [...wrap.querySelectorAll("h1,h2,h3,h4")];
    const referencesHeading = headings.find((h) => REFERENCES_RE.test(h.textContent.trim()));
    if (referencesHeading) {
      let current = referencesHeading.nextElementSibling;
      while (current && !/^H[1-4]$/.test(current.tagName)) { current.classList.add("reference-entry"); current = current.nextElementSibling; }
    }
    const referenceItems = referencesHeading ? extractReferenceItems(referencesHeading) : [];
    const textOnly = wrap.textContent.replace(/\s+/g, " ").trim();
    return {
      title,
      authors: authorRecords.map((a) => a.name).join("; "),
      affiliation: authorRecords.map(authorAffiliation).filter(Boolean).join("; "),
      email: authorRecords.map((a) => a.email).filter(Boolean).join("; "),
      authorRecords,
      abstract: abstractData.text,
      keywords: keywordData.text,
      ccsText: ccsData.text,
      inferredHeadings: headings.filter((h) => h.dataset.src === "bold").length,
      bodyHtml: wrap.innerHTML,
      wordCount: textOnly ? textOnly.split(/\s+/).length : 0,
      sections: headings.length,
      figures: wrap.querySelectorAll("img.img-figure").length,
      formulaImages: wrap.querySelectorAll("img.img-inline, img.img-display").length,
      tables: wrap.querySelectorAll("table").length,
      references: referenceItems.length,
      referenceItems
    };
  }

  // Plain (non-Heading-style) paragraphs that are clearly section titles: "2 Related Work", "2.1 Data", "Introduction".
  function plainHeadingDepth(text) {
    const value = String(text || "").trim();
    if (!value || value.length > 90 || /[.。;；,，:]$/.test(value)) return 0;
    if (/^(introduction|background|related work|literature review|methodology|methods?|results?|discussion|conclusions?|references?|bibliography|acknowledg(e)?ments?|引言|研究方法|结果|讨论|结论|参考文献|致谢)\s*$/i.test(value)) return 1;
    if (/^[IVXLC]{1,6}[.)]\s+[A-Z]/.test(value)) return 1;
    const numbered = /^(\d+(?:\.\d+)*)[.)]?\s+[A-Z\u4e00-\u9fff]/.exec(value);
    if (!numbered) return 0;
    return Math.min(3, numbered[1].split(".").length);
  }
  const REFERENCES_RE = /^(references?|bibliography|works cited|reference list|参考文献)\s*$/i;

  const CAPTION_RE = /^(fig(?:ure)?\.?|图)\s*(\d+|[IVXLC]+)\b/i;
  const TABLE_CAPTION_RE = /^(table|tab\.|表)\s*(\d+|[IVXLC]+)\b/i;
  const EQUATION_NUMBER_RE = /\(\s*\d{1,3}\s*\)\s*$/;
  const isCaptionNode = (node, re) => {
    if (!node || node.__consumed) return false;
    const text = node.textContent.trim();
    if (re.test(text)) return true;
    const other = re === CAPTION_RE ? TABLE_CAPTION_RE : CAPTION_RE;
    return node.tagName === "FIGCAPTION" && !other.test(text);
  };

  // Decide whether each image is an inline formula, a display formula, or a real figure.
  function classifyImages(root) {
    root.querySelectorAll("img").forEach((img) => {
      img.classList.remove("img-inline", "img-display", "img-figure");
      const block = img.closest("p,li,td,th,figure");
      const w = Number(img.dataset.w) || 0, h = Number(img.dataset.h) || 0;
      const blockText = block ? block.textContent.replace(/\s+/g, " ").trim() : "";
      const textBesides = blockText.replace(EQUATION_NUMBER_RE, "").trim();
      const imagesInBlock = block ? block.querySelectorAll("img").length : 1;
      if (img.closest("td,th,li")) { img.classList.add("img-inline"); return; } // mammoth wraps cell content in <p>, so test the ancestor, not `block`
      if (block && block.tagName === "P" && imagesInBlock === 1 && textBesides) { img.classList.add("img-inline"); return; }
      if (block && block.tagName === "P" && !textBesides) {
        const hasCaption = isCaptionNode(block.nextElementSibling, CAPTION_RE) || isCaptionNode(block.previousElementSibling, CAPTION_RE);
        const numbered = EQUATION_NUMBER_RE.test(blockText);
        const shortWide = h > 0 && h <= 110 && w / h >= 2.2;
        if (!hasCaption && (numbered || shortWide)) {
          img.classList.add("img-display");
          // Wrap a trailing "(1)" equation number so the preview can right-align it like LaTeX does.
          const last = block.lastChild;
          if (numbered && last && last.nodeType === Node.TEXT_NODE && EQUATION_NUMBER_RE.test(last.textContent)) {
            const span = document.createElement("span"); span.className = "eq-number"; span.textContent = last.textContent.trim();
            last.replaceWith(span);
          }
          return;
        }
      }
      img.classList.add("img-figure");
    });
  }

  function measureImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const done = (w, h) => { if (!settled) { settled = true; resolve({ width: w || 0, height: h || 0 }); } };
      setTimeout(() => done(0, 0), 4000);
      img.onload = () => done(img.naturalWidth, img.naturalHeight);
      img.onerror = () => done(0, 0);
      img.src = src;
    });
  }


  // Whole-body scans are cached per bodyHtml so that typing in a metadata field does not re-parse the manuscript twice per keystroke.
  function bodyStats() {
    const html = state.bodyHtml || "";
    if (state.bodyStatsCache && state.bodyStatsCache.html === html) return state.bodyStatsCache;
    const wrap = document.createElement("div"); wrap.innerHTML = html;
    state.bodyStatsCache = {
      html,
      unsupportedImages: [...wrap.querySelectorAll("img")].filter((img) => /^data:image\/(x-emf|x-wmf|emf|wmf|gif|bmp|tiff)/i.test(img.src)).length,
      tableImages: wrap.querySelectorAll("table img").length,
      cjk: cjkCount(wrap.textContent)
    };
    return state.bodyStatsCache;
  }

  function cjkCount(text) { return (String(text || "").match(/[\u4e00-\u9fff]/g) || []).length; }

  function looksLikeSectionHeading(text) {
    const value = String(text || "").trim();
    if (/^\d+(?:\.\d+)*[.)]?\s+\S+/.test(value)) return true;
    if (/^[IVXLC]{1,6}[.)]\s+[A-Z]/.test(value)) return true;
    return /^(introduction|background|literature review|related work|methodology|methods?|results?|discussion|conclusions?|references|acknowledg(e)?ments?|引言|背景|文献综述|研究方法|结果|讨论|结论|参考文献)\s*$/i.test(value);
  }

  function extractReferenceItems(heading) {
    const items = [];
    let node = heading.nextElementSibling;
    while (node && !/^H[1-4]$/.test(node.tagName)) {
      const listItems = [...node.querySelectorAll("li")].map((li) => li.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
      if (listItems.length) items.push(...listItems);
      else {
        const text = node.textContent.replace(/\s+/g, " ").trim();
        if (text) items.push(text);
      }
      node = node.nextElementSibling;
    }
    return items.map((text) => text.replace(/^\s*(?:\[?\d+\]?|\d+[.)])\s*/, "")).filter((text) => text.length > 5);
  }

  // single: the block is one paragraph (keywords, CCS). maxLength: never swallow the body when no heading follows.
  function extractLabeledBlock(nodes, startRegex, stopRegex, single, maxLength) {
    let startIndex = nodes.findIndex((node) => node.tagName !== "TABLE" && startRegex.test(node.textContent.trim()));
    if (startIndex < 0) return { text: "", startIndex: -1, endIndex: -1 };
    const first = nodes[startIndex].textContent.trim().replace(startRegex, "").trim();
    const parts = first ? [first] : [];
    let endIndex = startIndex;
    for (let i = startIndex + 1; i < nodes.length; i++) {
      if (single && parts.length) break;
      const text = nodes[i].textContent.trim();
      if (stopRegex.test(text) || /^H[1-4]$/.test(nodes[i].tagName) || nodes[i].tagName === "TABLE" || looksLikeSectionHeading(text)) break;
      if (maxLength && parts.join(" ").length + text.length > maxLength) break;
      if (text) parts.push(text);
      endIndex = i;
    }
    return { text: parts.join(" "), startIndex, endIndex };
  }

  // ---------------------------------------------------------------------------
  // Front matter (authors / affiliations / e-mails / ORCID) recognition
  // ---------------------------------------------------------------------------
  const AFFILIATION_RE = /(universit|college|institut|laborator|\bschool\b|department|\bdept\b|faculty|academy|\bcent(?:er|re)\b|hospital|corporation|\bcompany\b|co\.,?\s*ltd|\binc\.|\bgroup\b|大学|学院|研究院|研究所|实验室|中心|医院|公司|学校)/i;
  const ADDRESS_RE = /(\b\d{5,6}\b|\b(?:road|street|avenue|rd\.|st\.|ave\.|p\.?\s?o\.?\s?box)\b|\b(?:china|p\.?\s?r\.?\s?china|usa|u\.s\.a\.?|united states|united kingdom|uk|germany|france|japan|korea|india|italy|spain|canada|australia|singapore|taiwan|hong kong|macau|malaysia|thailand|vietnam|indonesia|pakistan|iran|turkey|brazil|mexico|russia|netherlands|sweden|switzerland|belgium|austria|poland|egypt|saudi arabia|uae|new zealand|ireland|norway|denmark|finland|portugal|greece|israel|south africa|nigeria|bangladesh|philippines)\b|中国)/i;
  const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
  const ORCID_RE = /(?:https?:\/\/(?:www\.)?orcid\.org\/)?\b(\d{4}-\d{4}-\d{4}-\d{3}[\dXx])\b/g;
  const CORRESPONDING_MARKERS = /^[*†‡§¶✉]+$/;

  // Text of a node where <sup>/<sub> runs are kept as \uE000…\uE001 tokens so affiliation markers survive.
  function markedText(node) {
    let out = "";
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) out += child.textContent;
      else if (child.nodeType !== Node.ELEMENT_NODE) return;
      else if (/^(sup|sub)$/i.test(child.tagName)) out += "\uE000" + child.textContent.trim() + "\uE001";
      else if (child.tagName === "BR") out += "\n";
      else out += markedText(child);
    });
    return out;
  }

  function findFrontMatterEnd(nodes, start) {
    let i = start;
    for (; i < nodes.length && i < start + 20; i++) {
      const node = nodes[i], text = node.textContent.replace(/\s+/g, " ").trim();
      if (/^H[1-6]$/.test(node.tagName) || text.length > 220) break;
      if (looksLikeSectionHeading(text) && !AFFILIATION_RE.test(text) && !ADDRESS_RE.test(text)) break;
    }
    return i;
  }

  // One entry per visual line; table cells are flattened into lines too.
  function frontMatterLines(nodes, start, end) {
    const lines = [];
    for (let i = start; i < end; i++) {
      const node = nodes[i];
      if (!node) continue;
      const blocks = node.tagName === "TABLE" ? [...node.querySelectorAll("td,th")] : [node];
      blocks.forEach((block) => {
        const paras = block.querySelectorAll("p,li").length ? [...block.querySelectorAll("p,li")] : [block];
        paras.forEach((p) => markedText(p).split("\n").forEach((raw) => {
          // Unicode superscript digits (¹ ² ³) are treated like real superscript runs.
          const text = raw.replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]+/g, (m) => "\uE000" + [...m].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join("") + "\uE001").replace(/\s+/g, " ").trim();
          if (text) lines.push({ node, text, consumed: false });
        }));
      });
    }
    return lines;
  }

  // Strip affiliation markers (superscripts, trailing digits, *, †) from a name/affiliation fragment.
  function splitMarkers(raw) {
    const markers = [];
    let text = raw.replace(/\uE000([^\uE001]*)\uE001/g, (_, m) => { markers.push(...m.split(/[,，;、\s]+/).filter(Boolean)); return " "; });
    text = text.replace(/[*†‡§¶✉]+/g, (m) => { markers.push(...m.split("")); return " "; });
    text = text.replace(/(?<=[A-Za-z\u00C0-\u024F\u4e00-\u9fff.])\s*(\d{1,2}(?:[,，]\s*\d{1,2})*)\s*$/, (_, m) => { markers.push(...m.split(/[,，]\s*/)); return ""; });
    text = text.replace(/^\(?(\d{1,2}|[a-h])[.)]?\s+(?=\S)/i, (_, m) => { markers.push(m); return ""; });
    return { text: text.replace(/\s+/g, " ").trim(), markers: markers.map((m) => m.trim()).filter(Boolean) };
  }

  function looksLikePersonName(text) {
    const t = text.trim();
    if (!t || t.length > 40 || /\d/.test(t)) return false;
    if (AFFILIATION_RE.test(t) || ADDRESS_RE.test(t)) return false;
    if (/^(and|et al\.?|author|authors|corresponding author|通讯作者|作者)$/i.test(t)) return false;
    if (/^[\u4e00-\u9fff·]{2,6}$/.test(t)) return true;
    const words = t.split(/\s+/);
    return words.length <= 5 && words.every((w) => /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F'’.-]*,?$/.test(w));
  }

  function parseFrontLine(rawText) {
    const info = { names: [], emails: [], orcids: [], affiliation: null, markers: [], note: false, kind: "other" };
    let line = rawText;
    line = line.replace(ORCID_RE, (_, id) => { info.orcids.push(normalizeOrcid(id)); return " "; });
    line = line.replace(EMAIL_RE, (m) => { info.emails.push(m); return " "; });
    line = line.replace(/\b(orcid(?:\s*id)?s?|e-?mails?|email\s*address(?:es)?|contact)\s*[:：]?/gi, " ");
    line = line.replace(/电子邮箱|电子邮件|邮箱/g, " ");
    if (/corresponding\s*author|通讯作者/i.test(line) && !/^\s*[*†‡§¶✉]?\s*(corresponding\s*authors?|通讯作者)\s*[:：]/i.test(line)) { info.correspondingHint = true; line = line.replace(/[(（]?\s*(corresponding\s*authors?|通讯作者)\s*[)）]?/gi, " "); }
    line = line.replace(/[()（）\[\]{}]/g, " ").replace(/\s+/g, " ").trim().replace(/^[,;，；:：\s]+|[,;，；:：\s]+$/g, "");
    const plain = line.replace(/\uE000[^\uE001]*\uE001/g, "").replace(/[*†‡§¶✉]/g, "").trim();
    if (!plain) { info.kind = info.emails.length || info.orcids.length ? "contact" : "empty"; return info; }
    if (/^(corresponding author|通讯作者|corresponding)\b/i.test(plain) || /^(received|accepted|revised|published|available online|copyright|©)\b/i.test(plain)) { info.kind = "note"; return info; }
    // Split candidate names. Commas inside superscript tokens must not split.
    const protectedLine = line.replace(/\uE000([^\uE001]*)\uE001/g, (_, m) => "\uE000" + m.replace(/,/g, "\uE002") + "\uE001");
    const pieces = protectedLine.split(/\s*(?:;|；|,|，|、|\band\b|&)\s*/i).map((x) => x.replace(/\uE002/g, ",")).filter((x) => x.replace(/[\uE000\uE001\s*†‡§¶✉]/g, ""));
    const parsedPieces = pieces.map(splitMarkers);
    if (parsedPieces.length && parsedPieces.every((piece) => looksLikePersonName(piece.text))) {
      info.kind = "names";
      info.names = parsedPieces.map((piece) => ({ text: piece.text.replace(/,$/, ""), markers: piece.markers }));
      return info;
    }
    const whole = splitMarkers(line);
    if (AFFILIATION_RE.test(whole.text) || ADDRESS_RE.test(whole.text) || whole.text.length > 25) {
      info.kind = "affiliation";
      info.affiliation = whole.text;
      info.markers = whole.markers;
      info.addressOnly = !AFFILIATION_RE.test(whole.text) && ADDRESS_RE.test(whole.text);
      return info;
    }
    return info;
  }

  function emailNameScore(email, name) {
    const local = email.split("@")[0].toLowerCase().replace(/[^a-z\u4e00-\u9fff]/g, "");
    const tokens = name.toLowerCase().split(/[\s.\-'’,]+/).filter((t) => t.length >= 2);
    let score = 0;
    tokens.forEach((t) => { if (local.includes(t)) score += t.length; });
    if (!score && tokens.length >= 2) { const initials = tokens.map((t) => t[0]).join(""); if (local.startsWith(initials)) score = 1; }
    return score;
  }

  function assembleAuthors(lines) {
    const authors = [];
    const byMarker = {};
    const shared = [];
    const pendingEmails = [], pendingOrcids = [], noteEmails = [];
    let group = [], lastAffiliation = null;
    const newAuthor = (name) => Object.assign(blankAuthor(), { name: name.text, markers: name.markers, affiliationEntry: null, corresponding: name.markers.some((m) => CORRESPONDING_MARKERS.test(m)) });
    lines.forEach((line) => {
      const info = parseFrontLine(line.text);
      if (info.kind === "empty") return;
      line.consumed = true;
      if (info.kind === "note") { noteEmails.push(...info.emails); pendingOrcids.push(...info.orcids); return; }
      if (info.kind === "names") {
        group = info.names.map(newAuthor);
        if (info.correspondingHint) group.forEach((a) => { a.corresponding = true; });
        authors.push(...group);
        info.emails.forEach((e, i) => { if (group.length === 1 || group[i]) group[Math.min(i, group.length - 1)].email = group[Math.min(i, group.length - 1)].email || e; else pendingEmails.push(e); });
        info.orcids.forEach((o, i) => { if (group[i] && !group[i].orcid) group[i].orcid = o; else pendingOrcids.push(o); });
        lastAffiliation = null;
        return;
      }
      if (info.kind === "affiliation") {
        pendingEmails.push(...info.emails); pendingOrcids.push(...info.orcids);
        if (info.addressOnly && lastAffiliation && !info.markers.length) { lastAffiliation.text += ", " + info.affiliation; return; }
        const entry = { text: info.affiliation, markers: info.markers };
        lastAffiliation = entry;
        if (entry.markers.length) { entry.markers.forEach((m) => { byMarker[m] = entry; }); return; }
        const targets = group.filter((a) => !a.affiliationEntry);
        if (targets.length) targets.forEach((a) => { a.affiliationEntry = entry; });
        else shared.push(entry);
        return;
      }
      if (info.kind === "contact") {
        if (group.length === 1) {
          if (info.emails.length && !group[0].email) group[0].email = info.emails.shift();
          if (info.orcids.length && !group[0].orcid) group[0].orcid = info.orcids.shift();
        }
        pendingEmails.push(...info.emails); pendingOrcids.push(...info.orcids);
        return;
      }
      line.consumed = false;
    });
    // Affiliations referenced by markers (superscripts / digits / letters).
    authors.forEach((a) => {
      if (a.affiliationEntry) return;
      const marked = a.markers.map((m) => byMarker[m]).filter(Boolean);
      if (marked.length) { a.affiliationEntry = marked[0]; a.extraAffiliations = marked.slice(1); }
    });
    const markedEntries = [...new Set(Object.values(byMarker))];
    const fallback = shared.length ? shared : markedEntries;
    authors.forEach((a) => { if (!a.affiliationEntry && fallback.length) a.affiliationEntry = fallback[0]; });
    // E-mails from a "*Corresponding author: x@y" note go to the starred author first.
    const starred = authors.filter((a) => a.corresponding);
    noteEmails.forEach((e) => { const target = starred.find((a) => !a.email) || null; if (target) target.email = e; else pendingEmails.push(e); });
    // Remaining e-mails: match by name, then by order.
    const unique = (list) => [...new Set(list)];
    unique(pendingEmails).filter((e) => !authors.some((a) => a.email === e)).forEach((e) => {
      const free = authors.filter((a) => !a.email);
      if (!free.length) return;
      const best = free.map((a) => ({ a, s: emailNameScore(e, a.name) })).sort((x, y) => y.s - x.s)[0];
      (best.s > 0 ? best.a : free[0]).email = e;
    });
    unique(pendingOrcids).filter((o) => !authors.some((a) => a.orcid === o)).forEach((o) => { const free = authors.find((a) => !a.orcid); if (free) free.orcid = o; });
    if (!authors.some((a) => a.corresponding)) { const first = authors.find((a) => a.email); if (first) first.corresponding = true; }
    return authors.map((a) => {
      const parts = splitAffiliation(a.affiliationEntry ? a.affiliationEntry.text : "");
      const extra = (a.extraAffiliations || []).map((e) => splitAffiliation(e.text).institution).filter(Boolean);
      return { name: a.name, email: a.email, orcid: a.orcid, institution: [parts.institution, ...extra].filter(Boolean).join("; "), city: parts.city.replace(/\s*\b\d{5,6}\b\s*/g, " ").trim(), country: parts.country || countryFromEmail(a.email), corresponding: a.corresponding };
    });
  }


  function populateFields(data) {
    els.title.value = data.title;
    els.abstract.value = data.abstract;
    els.keywords.value = data.keywords;
    state.authors = (data.authorRecords || []).map((a) => Object.assign(blankAuthor(), { name: a.name, email: a.email, orcid: a.orcid, institution: a.institution, city: a.city, country: a.country, corresponding: a.corresponding }));
    if (!state.authors.length) state.authors = [blankAuthor()];
    renderAuthorEditor();
    renderContentEditor();
    [els.title, els.abstract].forEach(autoGrow);
  }

  function renderContentEditor() {
    const host = $("contentEditor");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = state.bodyHtml;
    const blocks = [...wrapper.children];
    if (!blocks.length) {
      host.innerHTML = '<div class="content-empty">' + t("review.bodyNone") + '</div>';
      return;
    }
    host.innerHTML = blocks.map((node, index) => {
      const tag = node.tagName.toLowerCase();
      const onlyMath = tag === "p" && node.querySelector("span.math") && !node.textContent.replace(/\s+/g, "").replace(node.querySelector("span.math").textContent.replace(/\s+/g, ""), "").replace(/[()（）\d]/g, "");
      const label = t(/^h[1-6]$/.test(tag) ? (node.dataset.src === "bold" ? "block.headingInferred" : "block.heading") : tag === "table" ? "block.table" : onlyMath ? "block.equation" : node.querySelector("span.math") ? "block.mathParagraph" : node.querySelector("span.placeholder-chart") ? "block.chart" : node.querySelector("img.img-figure") ? "block.figure" : node.querySelector("img.img-inline, img.img-display") ? "block.formulaImages" : tag === "figure" || node.querySelector("img") ? "block.figureOrCaption" : tag === "ul" || tag === "ol" ? "block.list" : node.classList.contains("reference-entry") ? "block.reference" : tag === "figcaption" ? "block.caption" : "block.paragraph");
      const current = /^h[1-3]$/.test(tag) ? tag : tag === "figcaption" ? "figcaption" : node.classList.contains("reference-entry") ? "ref" : tag === "p" ? "p" : "";
      const options = current ? '<select class="block-type" title="' + escapeHtml(t("block.typeTitle")) + '">' + ["h1", "h2", "h3", "p", "figcaption", "ref"].map((v) => '<option value="' + v + '"' + (v === current ? " selected" : "") + ">" + escapeHtml(t("block.type." + v)) + "</option>").join("") + "</select>" : "";
      return '<section class="content-block" data-index="' + index + '"><header class="content-block-head"><b>' + label + '</b>' + options + '<span>' + escapeHtml(t("block.index", { n: index + 1 })) + '</span></header><div class="content-block-value" contenteditable="true" spellcheck="true">' + node.outerHTML + '</div></section>';
    }).join("");
  }

  // The author changed a block's type in the drop-down: re-tag the block, then rebuild the body.
  function retagBlock(select) {
    const value = select.closest(".content-block").querySelector(".content-block-value");
    const node = value.firstElementChild; if (!node) return;
    const type = select.value;
    const tag = type === "ref" ? "p" : type;
    const next = document.createElement(tag);
    next.innerHTML = /^h[1-3]$/.test(tag) ? node.textContent.trim() : node.innerHTML;
    if (type === "ref") next.classList.add("reference-entry");
    node.replaceWith(next);
    handleContentEdit();
    renderContentEditor();
  }

  // Rebuilding the body re-parses and re-typesets the whole manuscript, so keystrokes are batched; exports flush any pending edit first.
  let contentEditTimer = null;
  function scheduleContentEdit() { clearTimeout(contentEditTimer); contentEditTimer = setTimeout(handleContentEdit, 200); }
  function flushContentEdit() { if (contentEditTimer) handleContentEdit(); }
  function handleContentEdit() {
    clearTimeout(contentEditTimer); contentEditTimer = null;
    const html = [...$("contentEditor").querySelectorAll(".content-block-value")].map((editor) => editor.innerHTML.trim()).filter(Boolean).join("\n");
    state.bodyHtml = cleanHtml(html);
    updatePreview();
  }

  function autoGrow(element) {
    if (!element || element.tagName !== "TEXTAREA") return;
    element.style.height = "auto";
    element.style.height = Math.max(42, element.scrollHeight) + "px";
  }

  function blankAuthor() { return { name: "", email: "", orcid: "", institution: "", city: "", country: "", corresponding: false }; }

  const TLD_COUNTRIES = { cn: "China", hk: "Hong Kong", tw: "Taiwan", jp: "Japan", kr: "South Korea", sg: "Singapore", my: "Malaysia", in: "India", au: "Australia", nz: "New Zealand", uk: "United Kingdom", de: "Germany", fr: "France", it: "Italy", es: "Spain", nl: "Netherlands", se: "Sweden", ch: "Switzerland", ca: "Canada", br: "Brazil", mx: "Mexico", ru: "Russia", tr: "Turkey", ir: "Iran", pk: "Pakistan", th: "Thailand", vn: "Vietnam", id: "Indonesia", sa: "Saudi Arabia", ae: "United Arab Emirates", za: "South Africa", eg: "Egypt", pl: "Poland", at: "Austria", be: "Belgium", dk: "Denmark", fi: "Finland", no: "Norway", pt: "Portugal", gr: "Greece", ie: "Ireland", il: "Israel", edu: "USA" };
  function countryFromEmail(email) { const m = /\.([a-z]{2,3})$/i.exec(String(email || "").trim()); return m ? (TLD_COUNTRIES[m[1].toLowerCase()] || "") : ""; }
  const COUNTRY_RE = /^(?:the\s+)?(china|p\.?\s?r\.?\s?china|people's republic of china|usa|u\.s\.a\.?|united states(?: of america)?|united kingdom|uk|u\.k\.|germany|france|japan|korea|south korea|republic of korea|india|italy|spain|canada|australia|singapore|taiwan|hong kong|hong kong sar|macau|malaysia|thailand|vietnam|indonesia|pakistan|iran|turkey|türkiye|brazil|mexico|russia|netherlands|the netherlands|sweden|switzerland|belgium|austria|poland|egypt|saudi arabia|uae|united arab emirates|new zealand|ireland|norway|denmark|finland|portugal|greece|israel|south africa|nigeria|bangladesh|philippines|czech republic|hungary|romania|chile|argentina|colombia|peru|kenya|ghana|morocco|qatar|kuwait|oman|jordan|lebanon|sri lanka|nepal|kazakhstan|uzbekistan|中国|美国|英国|日本|韩国|德国|法国|澳大利亚|加拿大|新加坡)\.?$/i;
  function splitAffiliation(value) {
    const parts = String(value || "").split(/[,，]/).map((x) => x.trim()).filter(Boolean);
    const countryIndex = parts.map((p) => COUNTRY_RE.test(p.replace(/\s*\b\d{5,6}\b\s*/g, "").trim())).lastIndexOf(true);
    if (countryIndex < 0) return { institution: parts.join(", "), city: "", country: "" };
    const country = parts[countryIndex].replace(/\s*\b\d{5,6}\b\s*/g, "").trim();
    const before = parts.slice(0, countryIndex);
    const cityCandidate = before[before.length - 1] || "";
    const isCity = before.length >= 2 && !AFFILIATION_RE.test(cityCandidate) && cityCandidate.replace(/\s*\b\d{5,6}\b\s*/g, "").trim().split(/\s+/).length <= 3;
    return { institution: (isCity ? before.slice(0, -1) : before).join(", ").replace(/\s*\b\d{5,6}\b\s*/g, "").trim(), city: isCity ? cityCandidate.replace(/\s*\b\d{5,6}\b\s*/g, "").trim() : "", country };
  }

  function renderAuthorEditor() {
    if (!state.authors.length) state.authors = [blankAuthor()];
    $("authorEditor").innerHTML = state.authors.map((author, i) => {
      const orcidError = author.orcid && !validOrcid(author.orcid);
      return "<section class=\"author-card " + (orcidError ? "orcid-error" : "") + "\" data-index=\"" + i + "\"><header class=\"author-card-header\"><b>" + escapeHtml(t("author.card", { n: i + 1 })) + "</b><label><input type=\"checkbox\" data-field=\"corresponding\" " + (author.corresponding ? "checked" : "") + ">" + escapeHtml(t("author.corresponding")) + "</label><button type=\"button\" data-action=\"up\" title=\"" + escapeHtml(t("author.up")) + "\">↑</button><button type=\"button\" data-action=\"down\" title=\"" + escapeHtml(t("author.down")) + "\">↓</button><button type=\"button\" data-action=\"remove\" title=\"" + escapeHtml(t("author.remove")) + "\">×</button></header><div class=\"author-fields\"><label>" + escapeHtml(t("author.name")) + "<input data-field=\"name\" value=\"" + escapeHtml(author.name) + "\" placeholder=\"Full name\"></label><label>" + escapeHtml(t("author.email")) + "<input data-field=\"email\" value=\"" + escapeHtml(author.email) + "\" placeholder=\"name@example.com\"></label><label class=\"wide\">ORCID<input data-field=\"orcid\" value=\"" + escapeHtml(author.orcid) + "\" placeholder=\"0000-0000-0000-000X\"></label><span class=\"orcid-hint\">" + escapeHtml(t("author.orcidHint")) + "</span><label class=\"wide\">" + escapeHtml(t("author.institution")) + "<input data-field=\"institution\" value=\"" + escapeHtml(author.institution) + "\" placeholder=\"Institution / Department\"></label><label>" + escapeHtml(t("author.city")) + "<input data-field=\"city\" value=\"" + escapeHtml(author.city) + "\" placeholder=\"City\"></label><label>" + escapeHtml(t("author.country")) + "<input data-field=\"country\" value=\"" + escapeHtml(author.country) + "\" placeholder=\"Country\"></label></div></section>";
    }).join("");
    syncLegacyAuthorFields();
  }

  function handleAuthorEdit(event) {
    const card = event.target.closest(".author-card"), field = event.target.dataset.field;
    if (!card || !field) return;
    const author = state.authors[Number(card.dataset.index)];
    author[field] = field === "corresponding" ? event.target.checked : event.target.value;
    if (field === "orcid") card.classList.toggle("orcid-error", !!author.orcid && !validOrcid(author.orcid));
    syncLegacyAuthorFields(); updatePreview();
  }

  function handleAuthorAction(event) {
    const action = event.target.dataset.action, card = event.target.closest(".author-card");
    if (!action || !card) return;
    const i = Number(card.dataset.index);
    if (action === "remove" && state.authors.length > 1) state.authors.splice(i, 1);
    if (action === "up" && i > 0) [state.authors[i - 1], state.authors[i]] = [state.authors[i], state.authors[i - 1]];
    if (action === "down" && i < state.authors.length - 1) [state.authors[i + 1], state.authors[i]] = [state.authors[i], state.authors[i + 1]];
    renderAuthorEditor(); updatePreview();
  }

  function syncLegacyAuthorFields() {
    const active = state.authors.filter((a) => a.name || a.email || a.institution);
    els.authors.value = active.map((a) => a.name).filter(Boolean).join("; ");
    els.affiliation.value = active.map(authorAffiliation).filter(Boolean).join("; ");
    els.email.value = active.map((a) => a.email).filter(Boolean).join("; ");
  }

  function authorAffiliation(author) { return [author.institution, author.city, author.country].filter(Boolean).join(", "); }

  function updatePreview() {
    const meta = currentMeta();
    const conference = state.conference || {};
    const displayYear = conference.year || "Year";
    const displayShort = conference.shortName || "Conference";
    $("paperTitle").textContent = meta.title || "Untitled Paper";
    $("paperAbstract").textContent = meta.abstract || "Abstract not detected. Add or verify the abstract in the review panel.";
    $("paperKeywords").textContent = meta.keywords ? normalizeKeywords(meta.keywords) : "Keywords not detected";
    const ccsText = ccsPreviewText();
    $("paperCcsBlock").hidden = !ccsText;
    $("paperCcs").textContent = ccsText ? ccsText + "." : "";
    const authorRecords = state.authors.filter((a) => a.name) || [];
    const names = authorRecords.length ? authorRecords.map((a) => a.name) : splitAuthors(meta.authors);
    $("paperAuthors").innerHTML = (authorRecords.length ? authorRecords : [{ name: names[0] || "Author Name", institution: "Affiliation not provided", city: "", country: "", email: "", orcid: "", corresponding: false }]).map((author) => "<div><b>" + escapeHtml(author.name) + (author.corresponding ? "<sup>*</sup>" : "") + "</b><span>" + escapeHtml(authorAffiliation(author) || "Affiliation not provided") + "</span>" + (author.email ? "<span>" + escapeHtml(author.email) + "</span>" : "") + (author.orcid ? "<span>ORCID: " + escapeHtml(author.orcid) + "</span>" : "") + "</div>").join("");
    // The body only changes when the manuscript itself is edited; metadata keystrokes must not re-render (and re-typeset) the whole paper.
    if (state.bodyHtml && state.bodyHtml !== state.renderedBodyHtml) { els.body.innerHTML = state.bodyHtml; renderMathIn(els.body); state.renderedBodyHtml = state.bodyHtml; }
    const firstAuthor = names[0] || "Author";
    const manuscript = conferenceFormat() === "manuscript";
    const copyright = conferenceCopyright();
    const doi = cleanDoi(meta.doi);
    const conferenceLine = [displayShort, conference.dates, conference.location].filter(Boolean).join(", ");
    els.paper.querySelector(".paper-running span:first-child").textContent = manuscript ? "" : conferenceLine;
    els.paper.querySelector(".paper-running span:last-child").textContent = firstAuthor + (names.length > 1 ? " et al." : "");
    els.paper.querySelector(".paper-kicker").textContent = "";
    els.paper.querySelector(".citation-strip").textContent = "ACM Reference Format: " + (meta.authors || "Author Name") + ". " + displayYear + ". " + (meta.title || "Paper Title") + ". In Proceedings of " + (conference.name || "the conference") + " (" + displayShort + "). ACM, New York, NY, USA." + (doi ? " https://doi.org/" + doi : "");
    // First-page rights block, following what acmart actually prints for each \setcopyright value.
    const notices = {
      full: "Permission to make digital or hard copies of all or part of this work for personal or classroom use is granted without fee provided that copies are not made or distributed for profit or commercial advantage and that copies bear this notice and the full citation on the first page. Copyrights for components of this work owned by others than the author(s) must be honored. Abstracting with credit is permitted. To copy otherwise, or republish, to post on servers or to redistribute to lists, requires prior specific permission and/or a fee. Request permissions from permissions@acm.org.",
      retained: "Permission to make digital or hard copies of part or all of this work for personal or classroom use is granted without fee provided that copies are not made or distributed for profit or commercial advantage and that copies bear this notice and the full citation on the first page. Copyrights for third-party components of this work must be honored. For all other uses, contact the owner/author(s)."
    };
    const rightsLine = { acmlicensed: "© " + displayYear + " Copyright held by the owner/author(s). Publication rights licensed to ACM.", acmcopyright: "© " + displayYear + " ACM.", rightsretained: "© " + displayYear + " Copyright held by the owner/author(s).", cc: "© " + displayYear + " Copyright held by the owner/author(s). This work is licensed under a Creative Commons Attribution 4.0 International License.", none: "" }[copyright];
    $("permissionNotice").textContent = copyright === "acmlicensed" || copyright === "acmcopyright" ? notices.full : copyright === "rightsretained" ? notices.retained : "";
    if (manuscript) {
      $("permissionText").textContent = "";
      $("permissionRights").textContent = rightsLine;
      $("permissionIsbn").textContent = "Manuscript submitted to ACM";
      $("permissionDoi").textContent = "";
    } else {
      $("permissionText").textContent = conference.shortName ? conferenceLine : "Conference information not yet entered";
      $("permissionRights").textContent = rightsLine || (copyright === "none" ? displayYear + "." : "");
      $("permissionIsbn").textContent = conference.isbn ? "ACM ISBN " + conference.isbn : "";
      $("permissionDoi").textContent = doi ? "https://doi.org/" + doi : "DOI not yet entered";
    }
    els.paper.querySelector(".paper-footer span:first-child").textContent = manuscript ? "Manuscript submitted to ACM" : "";
    if (state.file) updateChecks();
    schedulePagination();
  }

  // Equations are stored as LaTeX source in <span class="math">; the preview renders them with KaTeX when it is bundled.
  const mathRenderCache = new Map();
  function renderMathIn(root) {
    state.mathErrors = 0;
    root.querySelectorAll("span.math").forEach((span) => {
      const latex = span.textContent.trim();
      const display = span.dataset.display === "1";
      const tag = span.dataset.tag;
      if (typeof katex === "undefined") { span.classList.add("math-source"); return; }
      // Typesetting is memoised per (mode, source): re-rendering the body after an edit only pays for formulas that changed.
      const key = (display ? "D" : "I") + latex;
      let entry = mathRenderCache.get(key);
      if (!entry) {
        try { entry = { html: katex.renderToString(latex, { displayMode: display, throwOnError: true, output: "html", strict: "ignore" }) }; }
        catch (error) { entry = { error: String(error.message || error) }; }
        if (mathRenderCache.size > 3000) mathRenderCache.clear();
        mathRenderCache.set(key, entry);
      }
      if (entry.error) { state.mathErrors++; span.classList.add("math-error"); span.title = entry.error; return; } // keeps the LaTeX source visible
      span.innerHTML = entry.html;
      if (display && tag) { const num = document.createElement("span"); num.className = "eq-number"; num.textContent = "(" + tag + ")"; span.appendChild(num); }
    });
  }

  function updateReport(data, messages) {
    $("sectionCount").textContent = data.sections;
    $("figureCount").textContent = data.figures;
    $("tableCount").textContent = data.tables;
    $("referenceCount").textContent = data.references;
    state.recognitionKey = messages && messages.length ? "review.needsReview" : "review.recognised"; $("recognitionBadge").textContent = t(state.recognitionKey);
    updateChecks();
  }

  function updateChecks() {
    const meta = currentMeta();
    const stats = bodyStats();
    const unsupported = stats.unsupportedImages, unlinked = state.citeStats ? state.citeStats.unlinked : 0, noCountry = state.authors.filter((a) => a.name && !a.country).length;
    // [passed, message when passed, message when failing]; messages are i18n keys resolved with t()
    const checks = [
      [!!state.templateFile && /\\begin\s*\{document\}/.test(state.templateText), t("checks.template.ok"), t("checks.template.warn")],
      [!!meta.title, t("checks.title.ok"), t("checks.title.warn")],
      [!!meta.authors, t("checks.authors.ok"), t("checks.authors.warn")],
      [state.authors.some((a) => a.corresponding), t("checks.corresponding.ok"), t("checks.corresponding.warn")],
      [state.authors.every((a) => !a.orcid || validOrcid(a.orcid)), t("checks.orcid.ok"), t("checks.orcid.warn")],
      [meta.abstract.length >= 50, t("checks.abstract.ok"), t("checks.abstract.warn")],
      [!!meta.keywords, t("checks.keywords.ok"), t("checks.keywords.warn")],
      [!!state.conference.name && !!state.conference.year && !!state.conference.isbn, t("checks.venue.ok"), t("checks.venue.warn")],
      [!!meta.doi, t("checks.doi.ok"), t("checks.doi.warn")],
      [state.metadata.sections > 0, t("checks.sections.ok"), t("checks.sections.warn")],
      [state.metadata.references > 0, t("checks.references.ok"), t("checks.references.warn")],
      [!state.equationsDropped && !(state.mathErrors > 0), (state.equations || []).length ? t("checks.equations.ok", { n: state.equations.length }) : t("checks.equations.none"), state.equationsDropped ? t("checks.equations.dropped", { n: state.equationsDropped }) : t("checks.equations.errors", { n: state.mathErrors })],
      [!state.oleObjects, t("checks.ole.ok"), t("checks.ole.warn", { n: state.oleObjects })],
      [!state.charts, t("checks.charts.ok"), t("checks.charts.warn", { n: state.charts })],
      [unsupported === 0, t("checks.images.ok"), t("checks.images.warn", { n: unsupported })],
      [!stats.tableImages, t("checks.tableImages.ok"), t("checks.tableImages.warn", { n: stats.tableImages })],
      [!(state.metadata.inferredHeadings > 0), t("checks.inferred.ok"), t("checks.inferred.warn", { n: state.metadata.inferredHeadings })],
      [!(unlinked > 0), state.citeStats && state.citeStats.linked ? t("checks.cites.linked", { n: state.citeStats.linked }) : t("checks.cites.pending"), t("checks.cites.warn", { n: unlinked })],
      [state.authors.every((a) => !a.name || a.country), t("checks.country.ok"), t("checks.country.warn", { n: noCountry })],
      [(meta.keywords || "").length < 400 && (meta.abstract || "").length < 6000, t("checks.length.ok"), t("checks.length.warn")],
      [!!meta.ccs, t("checks.ccs.ok"), t("checks.ccs.warn") + (state.metadata.ccsText ? t("checks.ccs.manuscript", { text: state.metadata.ccsText.slice(0, 80) }) : "")],
      [true, cjkCount(meta.title + meta.abstract + meta.keywords) + stats.cjk === 0 ? t("checks.cjk.none") : t("checks.cjk.present"), ""]
    ];
    const passed = checks.filter((item) => item[0]).length;
    $("qualityScore").textContent = t("review.score", { pct: Math.round((passed / checks.length) * 100) });
    $("checkList").innerHTML = checks.map((item) => "<div class=\"check-item " + (item[0] ? "" : "warn") + "\"><i>" + (item[0] ? "✓" : "!") + "</i><span>" + (item[0] ? item[1] : item[2]) + "</span></div>").join("");
  }

  // ---------------------------------------------------------------------------
  // CCS concepts picker
  // ---------------------------------------------------------------------------
  // The concept list is grouped; group names are translated, concept names are the official ACM CCS labels.
  function fillCcsSelect() {
    const select = $("ccsSelect");
    const selected = select.value;
    select.querySelectorAll("optgroup").forEach((g) => g.remove());
    [...new Set(CCS_OPTIONS.map((o) => o.group))].forEach((group) => {
      const optgroup = document.createElement("optgroup"); optgroup.label = t(group);
      CCS_OPTIONS.filter((o) => o.group === group).forEach((o) => { const opt = document.createElement("option"); opt.value = o.id; opt.textContent = o.label; optgroup.appendChild(opt); });
      select.appendChild(optgroup);
    });
    select.value = selected;
  }
  function initCcsPicker() {
    const select = $("ccsSelect");
    fillCcsSelect();
    try { state.ccs = JSON.parse(localStorage.getItem(ccsStorageKey) || "[]").filter((c) => c && c.id && c.desc); } catch (_) { state.ccs = []; }
    $("ccsAdd").addEventListener("click", addCcsConcept);
    select.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); addCcsConcept(); } });
    $("ccsChosen").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-remove]"); if (!button) return;
      state.ccs.splice(Number(button.dataset.remove), 1); persistCcs(); renderCcsChips(); applyFixedTemplate(); updatePreview();
    });
    $("ccsChosen").addEventListener("change", (event) => {
      const sel = event.target.closest("select[data-sig]"); if (!sel) return;
      state.ccs[Number(sel.dataset.sig)].significance = sel.value; persistCcs(); applyFixedTemplate(); updatePreview();
    });
    renderCcsChips();
  }
  function addCcsConcept() {
    const id = $("ccsSelect").value; const option = CCS_OPTIONS.find((o) => o.id === id);
    if (!option) return showToast(t("ccs.toast.select"));
    if (state.ccs.some((c) => c.id === id)) return showToast(t("ccs.toast.duplicate"));
    state.ccs.push({ id: option.id, desc: option.desc, significance: $("ccsSignificance").value });
    $("ccsSelect").value = "";
    persistCcs(); renderCcsChips(); applyFixedTemplate(); updatePreview();
  }
  function persistCcs() { try { localStorage.setItem(ccsStorageKey, JSON.stringify(state.ccs)); } catch (_) { /* storage unavailable */ } }
  function renderCcsChips() {
    const host = $("ccsChosen");
    if (!state.ccs.length) { host.innerHTML = '<div class="content-empty" style="padding:8px">' + escapeHtml(t("ccs.none")) + '</div>'; return; }
    const sigOptions = (value) => ["500", "300", "100"].map((v) => '<option value="' + v + '"' + (v === value ? " selected" : "") + ">" + escapeHtml(t("ccs.sig." + v)) + "</option>").join("");
    host.innerHTML = state.ccs.map((c, i) => {
      const [top, leaf] = c.desc.includes("~") ? c.desc.split("~") : [c.desc, ""];
      return '<div class="ccs-chip"><span>' + escapeHtml(leaf || top) + '<small>' + escapeHtml(top) + ' · ' + escapeHtml(c.id) + '</small></span><select data-sig="' + i + '" style="width:92px;margin:0;padding:4px">' + sigOptions(c.significance) + '</select><button type="button" data-remove="' + i + '" title="' + escapeHtml(t("ccs.remove")) + '">×</button></div>';
    }).join("");
  }
  // \begin{CCSXML} block + \ccsdesc lines, in the exact form the ACM CCS tool emits.
  function ccsLatex() {
    const manual = els.ccs.value.trim();
    if (manual) return manual;
    if (!state.ccs.length) return "";
    const xml = state.ccs.map((c) => "   <concept>\n       <concept_id>" + c.id + "</concept_id>\n       <concept_desc>" + c.desc + "</concept_desc>\n       <concept_significance>" + c.significance + "</concept_significance>\n   </concept>").join("\n");
    const desc = state.ccs.map((c) => "\\ccsdesc[" + c.significance + "]{" + c.desc + "}").join("\n");
    return "\\begin{CCSXML}\n<ccs2012>\n" + xml + "\n</ccs2012>\n\\end{CCSXML}\n\n" + desc;
  }
  function ccsPreviewText() {
    if (els.ccs.value.trim()) return [...els.ccs.value.matchAll(/\\ccsdesc(?:\[\d+\])?\{([^}]*)\}/g)].map((m) => "• " + m[1].replace("~", " → ")).join("; ");
    return state.ccs.map((c) => "• " + c.desc.replace("~", " → ")).join("; ");
  }

  function currentMeta() {
    syncLegacyAuthorFields();
    return { title: els.title.value.trim(), authors: els.authors.value.trim(), affiliation: els.affiliation.value.trim(), email: els.email.value.trim(), abstract: els.abstract.value.trim(), keywords: els.keywords.value.trim(), doi: els.doi.value.trim(), ccs: ccsLatex() };
  }

  function splitAuthors(value) {
    const parts = value.split(/\s*;\s*|\s+and\s+|\s*&\s*|\s*[、，,]\s*/i).filter(Boolean);
    return parts.length ? parts : ["Author Name"];
  }
  function splitEmails(value) { return value.split(/\s*[;,]\s*/).filter(Boolean); }

  function buildLatex() {
    state.templateText = fixedTemplate();
    const meta = currentMeta();
    const parser = document.createElement("div");
    parser.innerHTML = state.bodyHtml;
    imageManifest(parser);
    state.usedLabels = new Set();
    classifyImages(parser);
    // Resolve figure/table captions up front so a caption paragraph that precedes its table is not emitted twice.
    parser.querySelectorAll("img.img-figure").forEach((img) => { img.__caption = adjacentCaption(img.closest("p,figure") || img, CAPTION_RE, true); });
    parser.querySelectorAll("table").forEach((table) => { table.__caption = adjacentCaption(table, TABLE_CAPTION_RE, false); });
    // Heading levels: whatever the shallowest heading in the document is becomes \section, the next \subsection, ...
    const levels = [...new Set([...parser.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => h.tagName))].sort();
    state.headingMap = {};
    levels.forEach((tag, i) => { state.headingMap[tag] = ["section", "subsection", "subsubsection", "paragraph", "subparagraph"][Math.min(i, 4)]; });
    state.tableCounter = 0;
    const bodyTex = linkCitations(nodeToLatex(parser), state.metadata.referenceItems || []);
    return mergeIntoTemplate(state.templateText, meta, bodyTex.trim());
  }

  // Regions where "[3]" / "(Author, 2024)" must never be rewritten: math (\sqrt[3]{x}!), URLs, graphics, labels and existing \cite.
  const CITE_PROTECT_RE = /\\\[[\s\S]*?\\\]|\\begin\{(equation\*?|align\*?|aligned|gather\*?|multline\*?)\}[\s\S]*?\\end\{\1\}|(?<!\\)\$(?:\\.|[^$\\\n])*\$|\\(?:url|href|includegraphics|label|ref|cite)(?:\[[^\]]*\])?\{[^}]*\}/g;
  function outsideProtected(tex, fn) {
    let out = "", last = 0;
    for (const m of tex.matchAll(CITE_PROTECT_RE)) { out += fn(tex.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
    return out + fn(tex.slice(last));
  }

  // "[3]", "[2,5]", "[4-6]" and "(Author et al., 2024)" in the body become \cite{refN} when they match the reference list.
  function linkCitations(tex, items) {
    state.citeStats = { linked: 0, unlinked: 0 };
    const split = tex.indexOf("\\begin{thebibliography}");
    const body = split >= 0 ? tex.slice(0, split) : tex, tail = split >= 0 ? tex.slice(split) : "";
    const n = items.length;
    if (!n) return tex;
    const index = items.map((text, i) => { const m = /^([A-Z][A-Za-z'’\-]+)/.exec(text.replace(/^\W+/, "")); const y = /\b(19|20)\d{2}[a-z]?\b/.exec(text); return { key: "ref" + (i + 1), surname: m ? m[1].toLowerCase() : "", year: y ? y[0] : "" }; });
    const linkBrackets = (seg) => seg.replace(/\[(\d{1,3}(?:\s*[,，–-]\s*\d{1,3})*)\]/g, (m, inner) => {
      const keys = [];
      for (const part of inner.split(/\s*[,，]\s*/)) {
        const range = /^(\d+)\s*[–-]\s*(\d+)$/.exec(part);
        const from = range ? Number(range[1]) : Number(part), to = range ? Number(range[2]) : Number(part);
        if (!(from >= 1 && to >= from && to <= n && to - from < 20)) { state.citeStats.unlinked++; return m; }
        for (let k = from; k <= to; k++) keys.push("ref" + k);
      }
      state.citeStats.linked++;
      return "\\cite{" + keys.join(",") + "}";
    });
    const linkParens = (seg) => seg.replace(/\(([^()]{3,160})\)/g, (m, inner) => {
      const cites = inner.split(/\s*;\s*/);
      const keys = [];
      for (const cite of cites) {
        const c = /^([A-Z][A-Za-z'’\-]+)(?:\s+et al\.?|\s*(?:\\&|&|and)\s+[A-Z][A-Za-z'’\-]+)?\s*,?\s*((?:19|20)\d{2}[a-z]?)$/.exec(cite.trim());
        if (!c) return m;
        const hits = index.filter((e) => e.surname === c[1].toLowerCase() && e.year === c[2]);
        if (hits.length !== 1) { state.citeStats.unlinked++; return m; }
        keys.push(hits[0].key);
      }
      state.citeStats.linked++;
      return "\\cite{" + keys.join(",") + "}";
    });
    return outsideProtected(body, (seg) => linkParens(linkBrackets(seg))) + tail;
  }

  function normalizeKeywords(value) { return String(value || "").split(/\s*[;；,，]\s*/).map((k) => k.trim()).filter(Boolean).join(", "); }

  function mergeIntoTemplate(template, meta, bodyTex) {
    const authorNames = state.authors.filter((a) => a.name).map((a) => a.name);
    const fullTitle = texEscape(meta.title || "Untitled Paper");
    const shortTitle = (meta.title || "").length > 55 ? "[" + texEscape((meta.title || "").slice(0, 52).replace(/\s+\S*$/, "")) + "…]" : "";
    const hasCjk = cjkCount((meta.title || "") + meta.abstract + meta.keywords + bodyTex) > 0;
    const values = {
      TITLE: fullTitle,
      TITLECMD: "\\title" + shortTitle + "{" + fullTitle + "}",
      CJK: hasCjk ? "\\IfFileExists{xeCJK.sty}{\\usepackage{xeCJK}\\IfFontExistsTF{Noto Serif CJK SC}{\\setCJKmainfont{Noto Serif CJK SC}}{\\IfFontExistsTF{SimSun}{\\setCJKmainfont{SimSun}}{\\IfFontExistsTF{Songti SC}{\\setCJKmainfont{Songti SC}}{}}}}{}" : "",
      AUTHORS: authorLatex(meta, state.templateType),
      SHORTAUTHORS: authorNames.length >= 3 ? "\\renewcommand{\\shortauthors}{" + texEscape(authorNames[0]) + " et al.}\n" : "",
      ABSTRACT: texText(meta.abstract || "Abstract not provided."),
      CCS: meta.ccs ? meta.ccs + "\n" : "",
      KEYWORDS: texEscape(normalizeKeywords(meta.keywords) || "keywords not provided"),
      CONTENT: bodyTex
    };
    const out = template.replace(/\{\{(TITLE|TITLECMD|CJK|AUTHORS|SHORTAUTHORS|ABSTRACT|CCS|KEYWORDS|CONTENT)\}\}/g, (_, key) => values[key]);
    return "% Generated locally from the uploaded Word manuscript. Compile with XeLaTeX (latexmk uses the bundled latexmkrc).\n" + out;
  }

  function authorLatex(meta, type) {
    const records = state.authors.filter((a) => a.name);
    const authors = records.length ? records : splitAuthors(meta.authors).map((name, i) => ({ name, email: splitEmails(meta.email)[i] || "", orcid: "", institution: meta.affiliation, city: "", country: inferCountry(meta.affiliation), corresponding: false }));
    if (type === "ieee") return "\\author{" + authors.map((a) => "\\IEEEauthorblockN{" + texEscape(a.name) + (a.corresponding ? "\\textsuperscript{*}" : "") + "}\n\\IEEEauthorblockA{" + texEscape(authorAffiliation(a) || "Institution") + (a.email ? "\\\\\n" + texEscape(a.email) : "") + (a.orcid ? "\\\\\nORCID: " + texEscape(a.orcid) : "") + "}").join("\n\\and\n") + "}";
    if (type === "llncs") return "\\author{" + authors.map((a, i) => texEscape(a.name) + (a.orcid ? "\\orcidID{" + texEscape(normalizeOrcid(a.orcid)) + "}" : "") + "\\inst{" + (i + 1) + "}" + (a.corresponding ? "\\thanks{Corresponding author}" : "")).join(" \\and ") + "}\n\\institute{" + authors.map((a) => texEscape(authorAffiliation(a) || "Institution") + (a.email ? "\\\\\\email{" + texEscape(a.email) + "}" : "")).join(" \\and ") + "}";
    if (type === "acm") return authors.map((a) => "\\author{" + texEscape(a.name) + "}" + (a.corresponding ? "\n\\correspondingauthor" : "") + (a.orcid ? "\n\\orcid{" + texEscape(normalizeOrcid(a.orcid)) + "}" : "") + "\n\\affiliation{%\n  \\institution{" + texEscape(a.institution || "Institution") + "}" + (a.city ? "\n  \\city{" + texEscape(a.city) + "}" : "") + "\n  \\country{" + (texEscape(a.country || countryFromEmail(a.email)) || "\\relax") + "}}" + (a.email ? "\n\\email{" + texEscape(a.email) + "}" : "")).join("\n\n");
    return "\\author{" + authors.map((a) => texEscape(a.name) + (a.corresponding ? "\\thanks{Corresponding author}" : "") + (a.orcid ? " (ORCID: " + texEscape(normalizeOrcid(a.orcid)) + ")" : "")).join(" \\and ") + "\\\\\n\\small " + authors.map((a) => texEscape(authorAffiliation(a))).filter(Boolean).join("; ") + "}";
  }


  function latexCommandRange(text, command) {
    const match = new RegExp("\\\\" + command + "\\b").exec(text);
    if (!match) return null;
    let i = match.index + match[0].length;
    while (/\s/.test(text[i] || "")) i++;
    if (text[i] === "[") { let depth = 1; i++; while (i < text.length && depth) { if (text[i] === "[") depth++; if (text[i] === "]") depth--; i++; } while (/\s/.test(text[i] || "")) i++; }
    if (text[i] !== "{") return null;
    let depth = 1; i++;
    while (i < text.length && depth) { if (text[i] === "{" && text[i - 1] !== "\\") depth++; if (text[i] === "}" && text[i - 1] !== "\\") depth--; i++; }
    return depth === 0 ? { start: match.index, end: i } : null;
  }

  function extractLatexArgument(text, command) { const range = latexCommandRange(text, command); if (!range) return ""; const raw = text.slice(range.start, range.end); const open = raw.indexOf("{"); return open >= 0 ? raw.slice(open + 1, -1) : ""; }

  function nodeToLatex(root) {
    return [...root.childNodes].map((node) => {
      if (node.__consumed) return "";
      if (node.nodeType === Node.TEXT_NODE) return texText(node.textContent);
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const tag = node.tagName.toLowerCase();
      const inner = () => nodeToLatex(node);
      if (/^h[1-6]$/.test(tag)) {
        const title = stripNumber(node.textContent);
        if (REFERENCES_RE.test(title)) return bibliographyToLatex(node);
        if (/^(acknowledg(e)?ments?|致谢)$/i.test(title)) return acksToLatex(node);
        const cmd = state.headingMap[node.tagName] || "section";
        return (cmd === "section" ? "\n\\FloatBarrier" : "") + "\n\\" + cmd + "{" + texEscape(title) + "}\n";
      }
      if (tag === "span" && node.classList.contains("math")) return mathToLatex(node);
      if (tag === "span" && node.classList.contains("placeholder-chart")) return chartPlaceholderToLatex(node);
      if (tag === "p") {
        const display = node.querySelector("img.img-display");
        if (display) return [...node.querySelectorAll("img.img-display")].map(imageToLatex).join("");
        const math = node.querySelector("span.math");
        if (math && math.dataset.display === "1" && !node.textContent.replace(math.textContent, "").replace(/[\s()（）\d]/g, "")) return mathToLatex(math, true);
        return inner().trim() + "\n\n";
      }
      if (tag === "strong" || tag === "b") return "\\textbf{" + inner() + "}";
      if (tag === "em" || tag === "i") return "\\textit{" + inner() + "}";
      if (tag === "sup") return "\\textsuperscript{" + inner() + "}";
      if (tag === "sub") return "\\textsubscript{" + inner() + "}";
      if (tag === "br") return "\\\\\n";
      if (tag === "ul" || tag === "ol") return "\n\\begin{" + (tag === "ul" ? "itemize" : "enumerate") + "}\n" + inner() + "\\end{" + (tag === "ul" ? "itemize" : "enumerate") + "}\n";
      if (tag === "li") return "\\item " + inner().trim() + "\n";
      if (tag === "a") { const href = node.getAttribute("href") || ""; if (!href || /^#/.test(href)) return inner(); if (node.textContent.trim() === href) return "\\url{" + urlEscape(href) + "}"; return "\\href{" + urlEscape(href) + "}{" + inner() + "}"; }
      if (tag === "img") return imageToLatex(node);
      if (tag === "table") return tableToLatex(node);
      if (tag === "figcaption") return "\\begin{center}\\small " + inner().trim() + "\\end{center}\n\n";
      if (tag === "span" && node.classList.contains("footnote")) return "\\footnote{" + inner().trim() + "}";
      return inner();
    }).join("");
  }

  function mathToLatex(span, forceDisplay) {
    const latex = span.textContent.trim();
    if (!latex) return "";
    const display = forceDisplay || span.dataset.display === "1";
    if (!display) return "$" + latex + "$";
    const tag = span.dataset.tag;
    if (tag) return "\n\\begin{equation}\\tag{" + texEscape(tag) + "}\\label{" + uniqueLabel("eq:" + tag.replace(/[^\w.-]/g, "")) + "}\n" + latex + "\n\\end{equation}\n";
    return "\n\\[\n" + latex + "\n\\]\n";
  }

  function chartPlaceholderToLatex(span) {
    const block = span.closest("p");
    const caption = block ? adjacentCaption(block, CAPTION_RE, true) : null;
    const box = "\\fbox{\\parbox{0.85\\linewidth}{\\centering\\small Embedded Word chart could not be exported. Save it as PNG in Word and replace this box.}}";
    if (!caption) return "\n\\begin{center}" + box + "\\end{center}\n";
    return "\n\\begin{figure}[!htbp]\n\\centering\n" + box + "\n\\caption{" + texEscape(caption) + "}\n\\Description{" + texEscape(caption) + "}\n\\end{figure}\n";
  }

  // Caption text for a figure/table taken from the neighbouring "Fig. 1." / "Table 1." paragraph (which is then not repeated in the body).
  function adjacentCaption(block, re, preferNext) {
    const candidates = preferNext ? [block.nextElementSibling, block.previousElementSibling] : [block.previousElementSibling, block.nextElementSibling];
    const node = candidates.find((c) => isCaptionNode(c, re));
    if (!node) return null;
    node.__consumed = true;
    let text = node.textContent.replace(/\s+/g, " ").trim();
    const cont = node.nextElementSibling;
    if (cont && cont.tagName === "P" && !/[.。]$/.test(text) && cont.textContent.trim().length < 80 && /^[a-z(]/.test(cont.textContent.trim()) && !cont.querySelector("img,table")) { text += " " + cont.textContent.replace(/\s+/g, " ").trim(); cont.__consumed = true; }
    return text.replace(re, "").replace(/^[\s.:：\-–—]+/, "").trim();
  }

  const UNSUPPORTED_IMAGE_RE = /\.(wmf|emf|gif|bmp|tif|tiff|svg)$/i;
  function imageToLatex(img) {
    const file = "figures/" + img.dataset.latexName;
    const w = Number(img.dataset.w) || 0, h = Number(img.dataset.h) || 0;
    const pt = (px) => Math.round(px * 72 / 96 * 10) / 10;
    if (img.classList.contains("img-cell")) {
      // inside a tabularx cell: no float environment, never wider than the cell, never taller than ~4 cm
      if (UNSUPPORTED_IMAGE_RE.test(file)) return "\\fbox{\\small [" + file.split(".").pop().toUpperCase() + " image]}";
      return "\\includegraphics[width=\\linewidth,height=" + (h ? Math.min(pt(h), 120) : 120) + "pt,keepaspectratio]{" + file + "}";
    }
    if (UNSUPPORTED_IMAGE_RE.test(file)) {
      // WMF/EMF (typically legacy equation-editor objects) cannot be read by XeLaTeX: emit a visible placeholder so the project still compiles.
      const note = "\\fbox{\\parbox{0.85\\linewidth}{\\centering\\small Image " + texEscape(img.dataset.latexName) + " is in " + file.split(".").pop().toUpperCase() + " format (legacy equation editor or metafile). Convert it to PNG/PDF and replace this box.}}";
      if (img.classList.contains("img-inline")) return "\\fbox{\\small [" + file.split(".").pop().toUpperCase() + " image]}";
      if (img.classList.contains("img-display")) { const block = img.closest("p"); const n = block && /\(\s*(\d{1,3})\s*\)\s*$/.exec(block.textContent.trim()); return "\n\\begin{center}" + note + (n ? "\\hfill(" + n[1] + ")" : "") + "\\end{center}\n"; }
      const caption = img.__caption || img.alt || "Figure caption";
      return "\n\\begin{figure}[!htbp]\n\\centering\n" + note + "\n\\caption{" + texEscape(caption) + "}\n\\Description{" + texEscape(caption) + "}\n\\end{figure}\n";
    }
    if (img.classList.contains("img-inline")) return "\\raisebox{-0.35\\height}{\\includegraphics[height=" + (h ? pt(h) + "pt" : "1em") + "]{" + file + "}}";
    if (img.classList.contains("img-display")) {
      const block = img.closest("p");
      const numbered = !!block && EQUATION_NUMBER_RE.test(block.textContent.trim());
      const size = h ? "height=" + pt(h) + "pt" : "width=0.6\\linewidth";
      return numbered ? "\n\\begin{equation}\n\\includegraphics[" + size + "]{" + file + "}\n\\end{equation}\n" : "\n\\[\n\\includegraphics[" + size + "]{" + file + "}\n\\]\n";
    }
    const caption = img.__caption || img.alt || "Figure caption";
    const widthSpec = !w || pt(w) >= 300 ? "width=\\linewidth" : "width=" + pt(w) + "pt";
    const label = uniqueLabel("fig:" + (img.dataset.latexName || "figure").replace(/\.[^.]+$/, ""));
    return "\n\\begin{figure}[" + floatPlacement() + "]\n\\centering\n\\includegraphics[" + widthSpec + "]{" + file + "}\n\\caption{" + texEscape(caption) + "}\n\\Description{" + texEscape(caption) + "}\n\\label{" + label + "}\n\\end{figure}\n";
  }

  function floatPlacement() { return state.floatMode === "here" ? "H" : "!htbp"; }

  // One figures/word-figure-NN file per distinct image (the same picture pasted twice is stored once); sets data-latex-name on every <img>.
  function imageManifest(root) {
    const bySrc = new Map();
    root.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      let name = bySrc.get(src);
      if (!name) { name = "word-figure-" + String(bySrc.size + 1).padStart(2, "0") + imageExtension(src); bySrc.set(src, name); }
      img.dataset.latexName = name;
    });
    return bySrc;
  }

  // \label{} values must be unique per document: two "(1)" tags or two copies of one image would otherwise collide.
  function uniqueLabel(base) {
    const used = state.usedLabels || (state.usedLabels = new Set());
    let label = base, k = 2;
    while (used.has(label)) label = base + "-" + k++;
    used.add(label);
    return label;
  }

  // Expand rowspan/colspan into a full grid so merged cells map to \multirow / \multicolumn instead of shifting later rows left.
  function tableToLatex(table) {
    const cellText = (cell) => { const clone = cell.cloneNode(true); clone.querySelectorAll(".footnote").forEach((n) => { n.replaceWith(" (" + n.textContent.trim() + ")"); }); clone.querySelectorAll("img").forEach((n) => n.classList.add("img-cell")); return clone; };
    const cellLatex = (cell) => nodeToLatex(cellText(cell)).replace(/\s+/g, " ").trim();
    const grid = [];
    [...table.rows].forEach((row, r) => {
      grid[r] = grid[r] || [];
      let c = 0;
      [...row.cells].forEach((cell) => {
        while (grid[r][c]) c++;
        const rs = Math.max(1, cell.rowSpan || 1), cs = Math.max(1, cell.colSpan || 1);
        for (let i = 0; i < rs; i++) { grid[r + i] = grid[r + i] || []; for (let j = 0; j < cs; j++) grid[r + i][c + j] = i === 0 && j === 0 ? { cell, rs, cs } : { covered: true, i, j, rs, cs }; }
        c += cs;
      });
    });
    const cols = Math.max(1, ...grid.map((g) => g.length));
    const lines = [];
    grid.forEach((g, r) => {
      const parts = [];
      for (let c = 0; c < cols;) {
        const x = g[c];
        if (!x) { parts.push(""); c++; continue; }
        if (x.covered) { if (x.j === 0) { parts.push(x.cs > 1 ? "\\multicolumn{" + x.cs + "}{|l|}{}" : ""); c += x.cs; } else c++; continue; }
        let t = cellLatex(x.cell);
        if (x.rs > 1) t = "\\multirow{" + x.rs + "}{=}{" + t + "}";
        if (x.cs > 1) t = "\\multicolumn{" + x.cs + "}{|l|}{" + t + "}";
        parts.push(t); c += x.cs;
      }
      let rule = "\\hline";
      const next = grid[r + 1];
      if (next) {
        const open = []; let run = null;
        for (let c = 0; c < cols; c++) {
          const cont = next[c] && next[c].covered && next[c].i > 0;
          if (!cont) { if (!run) run = [c + 1, c + 1]; else run[1] = c + 1; } else if (run) { open.push(run); run = null; }
        }
        if (run) open.push(run);
        rule = open.length === 1 && open[0][0] === 1 && open[0][1] === cols ? "\\hline" : open.map((o) => "\\cline{" + o[0] + "-" + o[1] + "}").join("");
      }
      lines.push(parts.join(" & ") + " \\\\ " + rule);
    });
    const caption = table.__caption || "Table caption";
    state.tableCounter = (state.tableCounter || 0) + 1;
    const colSpec = "|" + Array(cols).fill(">{\\raggedright\\arraybackslash}X").join("|") + "|";
    const label = uniqueLabel("tab:table" + state.tableCounter);
    if (grid.length > 18) {
      // long table: break across pages in place instead of blocking every float behind it
      return "\n\\begin{xltabular}{\\linewidth}{" + colSpec + "}\n\\caption{" + texEscape(caption) + "}\\label{" + label + "}\\\\\n\\hline\n" + lines.join("\n") + "\n\\end{xltabular}\n";
    }
    return "\n\\begin{table}[" + floatPlacement() + "]\n\\caption{" + texEscape(caption) + "}\n\\label{" + label + "}\n\\begin{tabularx}{\\linewidth}{" + colSpec + "}\n\\hline\n" + lines.join("\n") + "\n\\end{tabularx}\n\\end{table}\n";
  }

  function collectSectionBody(heading) {
    const nodes = [];
    let node = heading.nextElementSibling;
    while (node && !/^H[1-6]$/.test(node.tagName)) { nodes.push(node); node = node.nextElementSibling; }
    return nodes;
  }

  // References become a thebibliography environment: numbering is automatic, so the "[1]" prefixes are dropped.
  function bibliographyToLatex(heading) {
    const nodes = collectSectionBody(heading);
    const items = [];
    nodes.forEach((node) => {
      node.__consumed = true;
      const listItems = [...node.querySelectorAll("li")];
      (listItems.length ? listItems : [node]).forEach((item) => {
        const text = item.textContent.replace(/\s+/g, " ").trim().replace(/^\s*(?:\[\s*\d+\s*\]|\d+[.)])\s*/, "");
        if (text.length > 5) items.push(text);
      });
    });
    if (!items.length) return "\n\\section*{" + texEscape(stripNumber(heading.textContent)) + "}\n";
    return "\n\\begin{thebibliography}{" + items.length + "}\n" + items.map((text, i) => "\\bibitem{ref" + (i + 1) + "} " + texText(text)).join("\n") + "\n\\end{thebibliography}\n";
  }

  function acksToLatex(heading) {
    const nodes = collectSectionBody(heading);
    const body = nodes.map((node) => nodeToLatex({ childNodes: [node] })).join("");
    nodes.forEach((node) => { node.__consumed = true; });
    return "\n\\begin{acks}\n" + body.trim() + "\n\\end{acks}\n";
  }

  async function downloadLatexProject() {
    if (!state.file) return;
    flushContentEdit();
    const zip = new JSZip();
    try {
      const fixedZip = await loadFixedAssets();
      for (const path of state.templateEntries) zip.file(path, await fixedZip.file(path).async("arraybuffer"));
    } catch (error) {
      console.error(error);
      showToast(t("toast.templateFailed"));
      return;
    }
    zip.file(state.templateMainPath, buildLatex());
    const mainDir = state.templateMainPath.includes("/") ? state.templateMainPath.slice(0, state.templateMainPath.lastIndexOf("/") + 1) : "";
    zip.file(mainDir + "WORD-CONVERSION-NOTES.txt", "Generated locally from Word with the bundled acmart v2.20 template.\nMain file: " + state.templateMainPath + "\nLayout: " + (conferenceFormat() === "manuscript" ? "manuscript (submission/review, line numbers)" : "acmsmall single-column proceedings (samples/acmsmall-conf.tex)") + "\n\nCOMPILE WITH XELATEX: run `latexmk main.tex` (the bundled latexmkrc selects XeLaTeX) or choose XeLaTeX in TeXstudio.\npdflatex fails on Unicode symbols; plain xelatex without libertine/newtxmath installed silently drops some glyphs, so install the full TeX Live scheme.\n\nReview before submission: equations (converted from Word, check the LaTeX), captions, citations (linked to the reference list where they matched), tables with merged cells (multirow), and the rights block.\n");
    zip.file(mainDir + "latexmkrc", "# Compile with XeLaTeX\n$pdf_mode = 5;\n$xelatex = 'xelatex -interaction=nonstopmode -synctex=1 %O %S';\n$clean_ext = 'synctex.gz';\n");
    zip.file(mainDir + "build.bat", "@echo off\r\nlatexmk -xelatex -interaction=nonstopmode main.tex\r\npause\r\n");
    zip.file(mainDir + "build.sh", "#!/bin/sh\nlatexmk -xelatex -interaction=nonstopmode main.tex\n");
    const doc = document.createElement("div"); doc.innerHTML = state.bodyHtml;
    // Same naming as buildLatex(): EMF/WMF originals are still shipped so the author can convert them and drop them into the placeholder.
    imageManifest(doc).forEach((name, src) => { if (src.startsWith("data:")) zip.file(mainDir + "figures/" + name, dataUrlBase64(src), { base64: true }); });
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    downloadBlob(blob, safeBaseName(state.file.name) + "-LaTeX-Project.zip");
    showToast(t("toast.projectGenerated"));
  }


  function prepareLocalPdf() {
    flushContentEdit();
    document.title = safeBaseName((state.file && state.file.name) || "paper") + "-PDF";
    let style = $("dynamicPrintPage");
    if (!style) { style = document.createElement("style"); style.id = "dynamicPrintPage"; document.head.appendChild(style); }
    style.textContent = state.templateType === "llncs" ? "@media print{@page{size:A4;margin:0}.paper{width:8.27in!important;min-height:11.69in!important}}" : "@media print{@page{size:letter;margin:0}}";
    window.print();
  }

  function resetWord() {
    state.file = null; state.sourceHtml = ""; state.bodyHtml = ""; state.metadata = {}; state.authors = [blankAuthor()];
    els.fileInput.value = ""; els.fileCard.classList.add("hidden"); els.dropZone.classList.remove("hidden");
    [els.title, els.authors, els.affiliation, els.email, els.abstract, els.keywords, els.doi, els.ccs].forEach((input) => input.value = "");
    state.equationsDropped = 0; state.equations = []; state.charts = 0; state.oleObjects = 0; state.mathErrors = 0; state.citeStats = null;
    state.renderedBodyHtml = ""; state.bodyStatsCache = null; state.headingMap = {};
    renderAuthorEditor();
    $("paperTitle").textContent = "Your Paper Title"; $("paperAbstract").textContent = "Upload a Word manuscript to generate an ACM formatted preview."; $("paperKeywords").textContent = "conference paper, intelligent typesetting";
    $("paperAuthors").innerHTML = "<div><b>Author Name</b><span>Institution</span><span>City, Country</span><span>author@example.com</span></div>";
    els.body.innerHTML = "<section><h2>1 INTRODUCTION</h2><p>The manuscript body, figures, tables, and references will appear here after upload.</p></section><section><h2>2 DOCUMENT CHECK</h2><p>After recognition, verify paper metadata before exporting.</p></section>";
    $("contentEditor").innerHTML = '<div class="content-empty">' + escapeHtml(t("review.bodyEmpty")) + '</div>';
    state.fileMetaKey = null; state.recognitionKey = null;
    applyFixedTemplate(); updatePreview(); setStep("import");
  }

  function schedulePagination() {
    clearTimeout(paginationTimer);
    paginationTimer = setTimeout(paginatePreview, 120);
  }

  function removeCloneIds(root) {
    if (root.removeAttribute) root.removeAttribute("id");
    root.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  }

  function paginatePreview() {
    const host = $("paginatedPreview");
    const source = els.paper;
    const sourceBody = source.querySelector(".paper-body");
    host.innerHTML = "";
    let pageNumber = 0;
    const createPage = (firstPage) => {
      pageNumber++;
      const page = document.createElement("article");
      page.className = "paper single-column preview-page " + (firstPage ? "first-page" : "continuation-page");
      const running = source.querySelector(".paper-running").cloneNode(true);
      page.appendChild(running);
      if (firstPage) page.appendChild(source.querySelector(".paper-front").cloneNode(true));
      const body = document.createElement("div"); body.className = "paper-body"; page.appendChild(body);
      const notes = document.createElement("div"); notes.className = "page-footnotes"; page.appendChild(notes);
      if (firstPage) page.appendChild(source.querySelector(".permission-block").cloneNode(true));
      const footer = source.querySelector(".paper-footer").cloneNode(true);
      footer.querySelector("span:last-child").textContent = conferenceFormat() === "manuscript" || (state.conference && state.conference.folios) ? pageNumber : "";
      page.appendChild(footer);
      removeCloneIds(page);
      host.appendChild(page);
      return { page, body, notes };
    };
    let footnoteCounter = 0;
    // Replace inline footnote spans with a superscript mark and append the note text to this page's footnote area.
    const placeNode = (node, target) => {
      const clone = node.cloneNode(true);
      target.body.appendChild(clone);
      const added = [];
      clone.querySelectorAll(".footnote").forEach((span) => {
        const number = ++footnoteCounter;
        const entry = document.createElement("p");
        entry.innerHTML = "<sup>" + number + "</sup>" + span.innerHTML;
        target.notes.appendChild(entry);
        added.push(entry);
        const mark = document.createElement("sup");
        mark.className = "footnote-mark";
        mark.textContent = number;
        span.replaceWith(mark);
      });
      return { clone, undo: () => { clone.remove(); added.forEach((entry) => entry.remove()); footnoteCounter -= added.length; } };
    };
    let current = createPage(true);
    [...sourceBody.children].forEach((node) => {
      const placed = placeNode(node, current);
      if (current.page.scrollHeight > current.page.clientHeight + 2 && current.body.children.length > 1) {
        placed.undo();
        current = createPage(false);
        placeNode(node, current);
      }
    });
    host.style.zoom = state.zoom / 100;
  }

  function setZoom(value) { state.zoom = Math.max(50, Math.min(114, value)); $("paginatedPreview").style.zoom = state.zoom / 100; $("zoomValue").textContent = state.zoom + "%"; }
  function formatBytes(bytes) { return bytes < 1024 * 1024 ? Math.round(bytes / 1024) + " KB" : (bytes / 1024 / 1024).toFixed(1) + " MB"; }
  function stripNumber(value) { return value.trim().replace(/^(?:\d+(?:\.\d+)*[.)]?|[IVXLC]{1,6}[.)]|[A-Z][.)])\s+/, ""); }
  function inferCountry(value) { const bits = value.split(/[,;，]/).map((x) => x.trim()).filter(Boolean); return bits[bits.length - 1] || ""; }
  function safeBaseName(name) { return name.replace(/\.docx$/i, "").replace(/[^\w\u4e00-\u9fff.-]+/g, "-").replace(/^-+|-+$/g, "") || "paper"; }
  function safeZipPath(path) { return !!path && !path.startsWith("/") && !path.split("/").includes("..") && !path.includes("\\"); }
  function normalizeOrcid(value) { const raw = String(value || "").replace(/^https?:\/\/orcid\.org\//i, "").replace(/[^0-9X]/gi, "").toUpperCase(); return raw.length === 16 ? raw.match(/.{1,4}/g).join("-") : String(value || "").trim(); }
  function validOrcid(value) {
    const raw = String(value || "").replace(/^https?:\/\/orcid\.org\//i, "").replace(/[^0-9X]/gi, "").toUpperCase();
    if (!/^\d{15}[\dX]$/.test(raw)) return false;
    let total = 0; for (let i = 0; i < 15; i++) total = (total + Number(raw[i])) * 2;
    const check = (12 - (total % 11)) % 11; return raw[15] === (check === 10 ? "X" : String(check));
  }
  function imageExtension(src) { const match = /^data:image\/([a-zA-Z0-9+.-]+);/.exec(src); const type = match ? match[1].toLowerCase() : "png"; return "." + ({ jpeg: "jpg", "svg+xml": "svg", "x-emf": "emf", "x-wmf": "wmf", tiff: "tif" }[type] || type); }
  function dataUrlBase64(url) { return url.split(",")[1] || ""; }
  // Full-width ASCII variants (（ ， ： etc.) are common in Chinese-authored English text; map them to ASCII so that
  // citation linking sees "(Bian, 2024)" and pdfLaTeX does not choke on U+FF08.
  function fullwidthToAscii(text) { return String(text || "").replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, " "); }
  function texEscape(value) {
    // Backslashes are parked in a private-use sentinel first; otherwise the braces of \textbackslash{} would be escaped again by the next step.
    return fullwidthToAscii(value).replace(/\\/g, "\uE003").replace(/([#$%&_{}])/g, "\\$1").replace(/\^/g, "\\textasciicircum{}").replace(/~/g, "\\textasciitilde{}").replace(/\uE003/g, "\\textbackslash{}").replace(TEX_SYMBOL_RE, (c) => TEX_SYMBOLS[c]);
  }
  function urlEscape(url) { return String(url || "").replace(/[{}]/g, "").replace(/\\/g, "/"); }
  // Body text: like texEscape, but bare URLs are wrapped in \url{} so they break across lines instead of overflowing the margin.
  function texText(value) {
    return String(value || "").split(URL_RE).map((part, i) => {
      if (i % 2 === 0) return texEscape(part);
      const trailing = /[.,;:)]+$/.exec(part);
      const url = trailing ? part.slice(0, -trailing[0].length) : part;
      return "\\url{" + urlEscape(url) + "}" + (trailing ? texEscape(trailing[0]) : "");
    }).join("");
  }
  function escapeHtml(value) { return String(value || "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c])); }
  function downloadBlob(blob, name) { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
  function showToast(message) { const toast = $("toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2400); }
})();
