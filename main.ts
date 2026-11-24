import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "entry.txt"), "utf8");

function fail(message) {
  console.error("invalid entry: " + message);
  process.exit(1);
}

const points = [...source];
if (points.length < 1 || points.length > 8) {
  fail("must be 1 to 8 characters, got " + points.length);
}
if (source !== source.trim()) {
  fail("leading or trailing whitespace");
}
if (/[\u0000-\u001F\u007F]/.test(source)) {
  fail("control character");
}
if (/[\u200B\u200C\u200D\uFEFF\uFFFD]/.test(source)) {
  fail("forbidden invisible character");
}
if (source.includes("\uFE0F")) {
  fail("variation selector-16 (U+FE0F) is not allowed");
}
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const segments = [...segmenter.segment(source)];
if (segments.length !== 1) {
  fail("must be exactly one grapheme cluster, got " + segments.length);
}
if (!/^\p{Extended_Pictographic}$/u.test(source)) {
  fail("must be exactly one emoji, no words");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) {
  fail("MAKEFUN_OUTPUT_DIR is not set");
}
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, source, "utf8");
if (readFileSync(outPath, "utf8") !== source) {
  fail("output did not round-trip");
}
console.log("wrote entry: " + source);
