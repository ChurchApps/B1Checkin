const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "src", "i18n", "locales");
const flatten = (obj, prefix = "") => Object.entries(obj).flatMap(([k, v]) => (typeof v === "object" && v !== null ? flatten(v, prefix + k + ".") : [prefix + k]));
// Languages legitimately differ in which CLDR plural forms they need, so compare base keys.
const normalize = keys => [...new Set(keys.map(k => k.replace(/_(zero|one|two|few|many|other)$/, "")))].sort();

const en = normalize(flatten(JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"))));
let ok = true;
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".json")) continue;
  try {
    const keys = normalize(flatten(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"))));
    const missing = en.filter(k => !keys.includes(k));
    const extra = keys.filter(k => !en.includes(k));
    if (missing.length || extra.length) {
      console.log(`${file}: MISMATCH missing=[${missing.join(", ")}] extra=[${extra.join(", ")}]`);
      ok = false;
    } else {
      console.log(`${file}: OK (${keys.length} keys)`);
    }
  } catch (e) {
    console.log(`${file}: PARSE ERROR ${e.message}`);
    ok = false;
  }
}
process.exit(ok ? 0 : 1);
