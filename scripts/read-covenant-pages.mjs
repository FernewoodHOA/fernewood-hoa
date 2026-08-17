// Decodes the scanned covenant pages so they can be read.
// The pages are CCITT fax-compressed images with no text layer; pdf.js knows
// how to decode that, sharp writes the result out as PNG.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const dir =
  "C:/Users/jared/AppData/Local/Temp/claude/C--Users-jared-OneDrive-Desktop-Claude-Code/7d201f44-0b1b-4b30-9bae-57d73efbf122/scratchpad/covenants";
const out = `${dir}/pages`;
mkdirSync(out, { recursive: true });

const file = process.argv[2] ?? "Restrictive Covenants Phase I.pdf";
const from = Number(process.argv[3] ?? 1);
const to = Number(process.argv[4] ?? 4);

const data = new Uint8Array(readFileSync(`${dir}/${file}`));
const doc = await pdfjs.getDocument({
  data,
  disableWorker: true,
  // JBIG2-compressed scans need pdf.js's WASM decoder.
  wasmUrl: "file:///C:/Users/jared/dev/fernewood-hoa/node_modules/pdfjs-dist/wasm/",
}).promise;
console.log(`${file}: ${doc.numPages} pages`);

for (let n = from; n <= Math.min(to, doc.numPages); n++) {
  const page = await doc.getPage(n);
  const ops = await page.getOperatorList();

  // Find the image this page draws.
  let name = null;
  for (let i = 0; i < ops.fnArray.length; i++) {
    if (
      ops.fnArray[i] === pdfjs.OPS.paintImageXObject ||
      ops.fnArray[i] === pdfjs.OPS.paintImageMaskXObject
    ) {
      name = ops.argsArray[i][0];
      break;
    }
  }
  if (!name) {
    console.log(`page ${n}: no image found`);
    continue;
  }

  const img = await new Promise((resolve) => {
    try {
      page.objs.get(name, resolve);
    } catch {
      resolve(null);
    }
  });
  if (!img) {
    console.log(`page ${n}: image "${name}" unavailable`);
    continue;
  }

  const { width, height, data: bytes } = img;
  const rowBytes = Math.ceil(width / 8);
  let raw;
  let channels = 1;

  if (bytes.length === rowBytes * height) {
    // 1 bit per pixel, packed. Expand to 8-bit grey; a set bit means ink.
    raw = Buffer.alloc(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = (bytes[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
        raw[y * width + x] = bit ? 255 : 0;
      }
    }
  } else if (bytes.length === width * height * 4) {
    raw = Buffer.from(bytes);
    channels = 4;
  } else if (bytes.length === width * height * 3) {
    raw = Buffer.from(bytes);
    channels = 3;
  } else {
    raw = Buffer.from(bytes);
  }

  const path = `${out}/p${String(n).padStart(2, "0")}.png`;
  // Scale down: these scans are ~2500px wide, more than needed to read.
  await sharp(raw, { raw: { width, height, channels } })
    .resize({ width: 1500 })
    .png()
    .toFile(path);
  console.log(`page ${n}: ${width}x${height} -> ${path}`);
}

// ---------------------------------------------------------------------------
// Why this exists
//
// The recorded covenants are scans with no text layer, stored as JBIG2 images,
// so they cannot be searched or copied from — a resident asking "are
// greenhouses allowed?" would otherwise have to read 29 pages.
//
// Rendering needs three things that are easy to get wrong:
//   * pdf.js's WASM decoder (JBIG2), hence the wasmUrl above
//   * unpacking 1-bit-per-pixel output; treating it as 8-bit throws a
//     "memory area too small" error from sharp
//   * bit polarity: a set bit is white, not ink, or every page comes out as
//     a negative
//
// Article/section map for Phase I (document page, add 3 for the PDF page):
//   4.4  Construction Requirements      p6
//   4.13 Movable Structures/Outbuildings p7
//   5.2  Factors to be Considered       p10
//   5.3  Guidelines (materials, drainage, fences) p10-12
//   5.4  Variances                      p13
