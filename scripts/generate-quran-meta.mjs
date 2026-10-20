#!/usr/bin/env node
// Builds src/lib/quran/quran-meta.json from Tanzil's metadata file (no Quran text).
// Source: https://tanzil.net/res/text/metadata/quran-data.js — Tanzil.net, CC BY 3.0.
// Usage: node scripts/generate-quran-meta.mjs /path/to/quran-data.js
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const src = process.argv[2];
if (!src) {
  console.error('usage: generate-quran-meta.mjs <quran-data.js>');
  process.exit(1);
}

// The file is plain data assignments; evaluate it in an empty sandbox.
const sandbox = {};
vm.runInNewContext(`${readFileSync(src, 'utf8')}\nthis.QuranData = QuranData;`, sandbox, {
  timeout: 1000,
});
const { Sura, Juz, Page } = sandbox.QuranData;

const pages = Page.slice(1, 605).map(([s, a]) => [s, a]); // pages[i] = first ayah on page i+1
if (pages.length !== 604) throw new Error(`expected 604 pages, got ${pages.length}`);

const cmp = (a, b) => a[0] - b[0] || a[1] - b[1];
const pageOf = (s, a) => {
  let p = 0;
  for (let i = 0; i < pages.length; i++) if (cmp(pages[i], [s, a]) <= 0) p = i;
  return p + 1;
};

const surahs = Sura.slice(1, 115).map(([, ayahs, , , ar, tname, ename, type], i) => ({
  n: i + 1,
  ar,
  en: tname,
  meaning: ename,
  ayahs,
  startPage: pageOf(i + 1, 1),
  type: type === 'Meccan' ? 'meccan' : 'medinan',
}));

const juz = Juz.slice(1, 31).map(([s, a], i) => ({
  n: i + 1,
  surah: s,
  ayah: a,
  startPage: pageOf(s, a),
}));

const out = {
  source: 'Tanzil.net quran-data.js v1.0 — Creative Commons Attribution 3.0',
  mushaf: 'madani-604',
  surahs,
  juz,
  pages,
};
const dest = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../src/lib/quran/quran-meta.json',
);
writeFileSync(dest, JSON.stringify(out) + '\n');
console.log(`wrote ${dest}: ${surahs.length} surahs, ${juz.length} juz, ${pages.length} pages`);
