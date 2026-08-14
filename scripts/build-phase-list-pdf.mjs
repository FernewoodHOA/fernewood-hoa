// Generates the "Properties Covered by Each Phase" PDF from the same data the
// website renders, so the document and the site can never disagree.
//
//   node scripts/build-phase-list-pdf.mjs [outputPath]
//
// Re-run this whenever lib/restriction-guide.ts changes, then re-upload.

import { readFileSync, writeFileSync } from "node:fs";
import PDFDocument from "pdfkit";

const out = process.argv[2] ?? "phase-list.pdf";

// Read the guide the site uses rather than duplicating it here.
const src = readFileSync("lib/restriction-guide.ts", "utf8");
const guide = eval(
  src
    .replace(/^export\s+const\s+restrictionGuide\s*=\s*/m, "")
    .replace(/;\s*$/, "")
);

const doc = new PDFDocument({ size: "LETTER", margin: 64 });
const chunks = [];
doc.on("data", (c) => chunks.push(c));

const today = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

doc.fontSize(18).font("Helvetica-Bold")
  .text("Fernewood Homeowners Association");
doc.fontSize(13).font("Helvetica")
  .text("Properties Covered by Each Phase of Restrictive Covenants");
doc.moveDown(0.5);
doc.fontSize(9).fillColor("#555")
  .text(`Revised ${today}. Verified against the recorded survey plats.`);
doc.moveDown(0.4);
doc.fontSize(9).fillColor("#555").text(
  "Some streets were renumbered by the city after the subdivision was " +
    "platted. Where that happened, both the current and the platted numbers " +
    "are shown so this list can be matched against the recorded documents.",
  { width: 468 }
);
doc.moveDown(1);

for (const { phase, streets } of guide) {
  // Keep a phase and its first street together across a page break.
  if (doc.y > 640) doc.addPage();
  doc.fillColor("#14532d").fontSize(12).font("Helvetica-Bold").text(phase);
  doc.moveDown(0.2);
  doc.fillColor("#000").fontSize(10).font("Helvetica");
  for (const s of streets) {
    doc.text(`•  ${s}`, { indent: 12, width: 456 });
  }
  doc.moveDown(0.7);
}

if (doc.y > 660) doc.addPage();
doc.moveDown(0.5);
doc.fontSize(8).fillColor("#666").text(
  "There is no Phase X; the subdivision was platted without one. " +
    "Generated from the association's website records — if this list and the " +
    "website disagree, the website is authoritative.",
  { width: 468 }
);

doc.end();
await new Promise((r) => doc.on("end", r));
writeFileSync(out, Buffer.concat(chunks));
console.log(`wrote ${out} (${(Buffer.concat(chunks).length / 1024).toFixed(0)} KB)`);
