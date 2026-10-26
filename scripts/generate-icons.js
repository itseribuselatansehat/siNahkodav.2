import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 72, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: 2 (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);

    // CRC32
    let c = -1;
    for (let i = 4; i < 8 + len; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    c = (c ^ -1) >>> 0;
    buf.writeUInt32BE(c, 8 + len);
    return buf;
  }

  // Precompute CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }

  // Raw image data with scanline filter bytes
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const offset = y * scanlineLength;
    rawData[offset] = 0; // filter byte: none

    for (let x = 0; x < width; x++) {
      const pxOffset = offset + 1 + x * 3;
      // Draw gradient or circular emblem
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      const isCross = (Math.abs(x - cx) < width * 0.08 && Math.abs(y - cy) < height * 0.25) ||
                      (Math.abs(y - cy) < height * 0.08 && Math.abs(x - cx) < width * 0.25);

      if (isCross) {
        // Red cross
        rawData[pxOffset] = 239;
        rawData[pxOffset + 1] = 68;
        rawData[pxOffset + 2] = 68;
      } else if (dist < width * 0.35) {
        // White center circle
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
      } else {
        // Royal Blue gradient background
        const blend = y / height;
        rawData[pxOffset] = Math.round(29 * (1 - blend) + 2 * blend);
        rawData[pxOffset + 1] = Math.round(78 * (1 - blend) + 132 * blend);
        rawData[pxOffset + 2] = Math.round(216 * (1 - blend) + 199 * blend);
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, 37, 99, 235));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, 37, 99, 235));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 37, 99, 235));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, 37, 99, 235));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPNG(32, 32, 37, 99, 235));

console.log('PWA icons successfully generated in public/ directory!');
