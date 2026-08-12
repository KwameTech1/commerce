import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const productsSource = readFileSync(join(root, "lib/data/products.ts"), "utf8");
const handles = [...productsSource.matchAll(/handle: "([a-z0-9-]+)"/g)].map(
  (match) => match[1],
);

const SIZE = 800;

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, "ascii");
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function encodePng(width, height, pixelAt) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelAt(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function mix(a, b, t) {
  return a.map((channel, i) => channel + (b[i] - channel) * t);
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function roundedRectContains(x, y, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  if (dx > halfW || dy > halfH) return false;
  if (dx <= halfW - radius || dy <= halfH - radius) return true;
  const cornerDx = dx - (halfW - radius);
  const cornerDy = dy - (halfH - radius);
  return cornerDx * cornerDx + cornerDy * cornerDy <= radius * radius;
}

function render(handle, index) {
  const seed = hashString(handle);
  const hue = seed % 360;
  const palettes = [
    [hue, 55, 42, hue + 18, 60, 32],
    [hue + 40, 45, 48, hue + 60, 55, 30],
    [hue + 200, 50, 45, hue + 220, 60, 28],
  ];
  const [h1, s1, l1, h2, s2, l2] = palettes[index % palettes.length];
  const top = hslToRgb(h1, s1 / 100, l1 / 100);
  const bottom = hslToRgb(h2, s2 / 100, l2 / 100);
  const card = hexToRgb("#ffffff");
  const accent = hslToRgb((hue + 90) % 360, 0.7, 0.85);

  const pixelAt = (x, y) => {
    const t = y / SIZE;
    const base = mix(top, bottom, t);
    const cardTop = SIZE * 0.28;
    const cardBottom = SIZE * 0.78;
    const cardHalfW = SIZE * 0.34;
    const radius = SIZE * 0.06;

    if (
      y >= cardTop &&
      y <= cardBottom &&
      roundedRectContains(
        x,
        y,
        SIZE / 2,
        (cardTop + cardBottom) / 2,
        cardHalfW,
        (cardBottom - cardTop) / 2,
        radius,
      )
    ) {
      const glow =
        1 -
        0.08 *
          Math.abs((y - (cardTop + cardBottom) / 2) / (cardBottom - cardTop));
      return [
        clamp(card[0] * glow),
        clamp(card[1] * glow),
        clamp(card[2] * glow),
      ];
    }

    const barTop = SIZE * 0.38;
    const barHeight = SIZE * 0.05;
    if (
      y >= barTop &&
      y <= barTop + barHeight &&
      x >= SIZE * 0.3 &&
      x <= SIZE * 0.7
    ) {
      return accent;
    }

    return [clamp(base[0]), clamp(base[1]), clamp(base[2])];
  };

  return encodePng(SIZE, SIZE, pixelAt);
}

const outDir = join(root, "public", "products");
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const handle of handles) {
  for (let i = 1; i <= 3; i++) {
    writeFileSync(join(outDir, `${handle}-${i}.png`), render(handle, i));
    count++;
  }
}

console.log(
  `Generated ${count} product images for ${handles.length} products.`,
);
