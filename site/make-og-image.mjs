// Generates public/og-image.png (1200x630) with no dependencies: draws text with a 5x7 bitmap font, then writes a PNG.
// Usage: node make-og-image.mjs (run from site/; the result is committed, so this only needs re-running to change it).
import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const BG = [10, 10, 10];
const FG = [250, 250, 250];
const ACCENT = [96, 165, 250];

const GLYPHS = {
  G: ['01110', '10001', '10000', '10011', '10001', '10001', '01110'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  '&': ['01100', '10010', '10010', '01100', '10101', '10010', '01101'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

const pixels = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i += 1) {
  pixels[i * 3] = BG[0];
  pixels[i * 3 + 1] = BG[1];
  pixels[i * 3 + 2] = BG[2];
}

function rect(x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y += 1) {
    if (y < 0 || y >= H) continue;
    for (let x = x0; x < x0 + w; x += 1) {
      if (x < 0 || x >= W) continue;
      const i = (y * W + x) * 3;
      pixels[i] = color[0];
      pixels[i + 1] = color[1];
      pixels[i + 2] = color[2];
    }
  }
}

function text(str, x0, y0, scale, color, gap = 1) {
  let x = x0;
  for (const char of str.toUpperCase()) {
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    glyph.forEach((row, ry) => {
      [...row].forEach((cell, rx) => {
        if (cell === '1') rect(x + rx * scale, y0 + ry * scale, scale, scale, color);
      });
    });
    x += (5 + gap) * scale;
  }
  return x;
}

rect(0, 0, W, 8, ACCENT);
text('DOCFORGE', 96, 236, 14, FG);
text('WORD DOCUMENTS FROM STRICT JSON', 96, 392, 5, ACCENT);
text('DOCFORGE.GORDONKIT.COM', 96, 452, 5, [138, 138, 138]);

// PNG encoding
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y += 1) {
  raw[y * (W * 3 + 1)] = 0;
  pixels.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = resolve(dirname(fileURLToPath(import.meta.url)), 'public/og-image.png');
await writeFile(out, png);
console.log(`og-image: ${W}x${H}, ${(png.length / 1024).toFixed(1)} KB`);
