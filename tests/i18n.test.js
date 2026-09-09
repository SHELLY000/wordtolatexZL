// Interface strings: both languages complete, placeholders consistent, English is the default.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const I18N = require("../src/i18n.js");

const { DICT, DEFAULT } = I18N;
const langs = Object.keys(DICT);

test("i18n: English is the default and both languages exist", () => {
  assert.equal(DEFAULT, "en");
  assert.deepEqual(langs.sort(), ["en", "zh"]);
  assert.equal(I18N.detect(), "en"); // no localStorage in Node
});

test("i18n: every key exists in every language with the same {placeholders}", () => {
  const keys = new Set(langs.flatMap((l) => Object.keys(DICT[l])));
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join(",");
  for (const key of keys) for (const lang of langs) {
    assert.ok(key in DICT[lang], `${key} missing in ${lang}`);
    assert.equal(vars(DICT[lang][key]), vars(DICT[DEFAULT][key]), `placeholders differ for ${key} in ${lang}`);
  }
});

test("i18n: t() substitutes variables and falls back to English", () => {
  I18N.setLanguage("zh");
  assert.equal(I18N.t("checks.equations.ok", { n: 3 }), "已转换 3 处 Word 公式为 LaTeX");
  I18N.setLanguage("xx");
  assert.equal(I18N.language(), "en");
  assert.equal(I18N.t("checks.equations.ok", { n: 3 }), "3 Word equations converted to LaTeX");
  assert.equal(I18N.t("no.such.key"), "no.such.key");
});

test("i18n: every data-i18n key in the page template is defined", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "src", "index.template.html"), "utf8");
  const used = [...html.matchAll(/data-i18n(?:-placeholder|-title|-aria)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(used.length > 60, "template carries i18n hooks");
  for (const key of used) assert.ok(key in DICT.en, `template key ${key} missing`);
});

test("i18n: every t(\"key\") in app.js is defined", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "src", "app.js"), "utf8");
  const used = new Set([...app.matchAll(/\bt\("([a-zA-Z0-9.]+)"/g)].map((m) => m[1]));
  const prefixes = ["block.type.", "ccs.sig."]; // built dynamically: t("block.type." + v), t("ccs.sig." + v)
  for (const key of used) if (!prefixes.some((p) => key === p.slice(0, -1) || key.startsWith(p))) assert.ok(key in DICT.en, `app.js key ${key} missing`);
  assert.ok(used.size > 80, "app.js uses the string table");
});
