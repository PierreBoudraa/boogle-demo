const words = require("an-array-of-french-words");
const fs = require("fs");
const path = require("path");

const filtered = Array.from(
  new Set(
    words
      .map((w) => w.toUpperCase())
      .filter((w) => /^[A-Z]+$/.test(w)) // enlève accents, tirets, apostrophes, espaces
      .filter((w) => w.length >= 2 && w.length <= 8)
  )
).sort();

const dossier = path.join(__dirname, "..", "data");
fs.mkdirSync(dossier, { recursive: true });
fs.writeFileSync(path.join(dossier, "mots.json"), JSON.stringify(filtered));

console.log(`${filtered.length} mots écrits dans data/mots.json`);