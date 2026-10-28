const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create Brand SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090a0f"/>
      <stop offset="50%" stop-color="#121524"/>
      <stop offset="100%" stop-color="#05060a"/>
    </linearGradient>
    <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)"/>
  <rect width="510" height="510" x="1" y="1" rx="107" fill="none" stroke="url(#vaultGrad)" stroke-width="2" stroke-opacity="0.3"/>

  <!-- Outer Vault Hexagonal Ring -->
  <path d="M 256 68 L 416 160 L 416 352 L 256 444 L 96 352 L 96 160 Z"
        fill="none" stroke="url(#vaultGrad)" stroke-width="14" stroke-linejoin="round" filter="url(#glow)" opacity="0.9"/>

  <!-- Inner Vault Chamber Circle -->
  <circle cx="256" cy="256" r="108" fill="#0d0f1a" stroke="url(#vaultGrad)" stroke-width="8"/>

  <!-- Glowing Sound / Pulse Wave -->
  <path d="M 172 256 L 208 256 L 226 196 L 250 316 L 268 216 L 284 286 L 302 256 L 340 256"
        fill="none" stroke="url(#pulseGrad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>

  <!-- Tech Dots / Accents -->
  <circle cx="256" cy="116" r="6" fill="#a855f7"/>
  <circle cx="256" cy="396" r="6" fill="#06b6d4"/>
  <circle cx="140" cy="256" r="5" fill="#8b5cf6"/>
  <circle cx="372" cy="256" r="5" fill="#6366f1"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('✓ Wrote public/icon.svg');

// 2. Pure Node.js PNG encoder helper
function createPngBuffer(width, height, isMaskable = false) {
  // RGBA buffer
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  let pos = 0;

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.38 : 0.44);
  const cornerRadius = isMaskable ? 0 : width * 0.22;

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color #090a0f to #131627
      const t = (x + y) / (width + height);
      let r = Math.round(9 + (19 - 9) * t);
      let g = Math.round(10 + (22 - 10) * t);
      let b = Math.round(15 + (39 - 15) * t);
      let a = 255;

      // Draw rounded squircle border or maskable full bleed
      if (!isMaskable) {
        // Squircle distance
        const qx = Math.max(0, Math.abs(dx) - (cx - cornerRadius));
        const qy = Math.max(0, Math.abs(dy) - (cy - cornerRadius));
        const cornerDist = Math.sqrt(qx * qx + qy * qy);
        if (cornerDist > cornerRadius) {
          a = 0;
          r = 0;
          g = 0;
          b = 0;
        }
      }

      if (a > 0) {
        // Outer Hexagonal / Circular ring
        const ringDist = Math.abs(dist - radius * 0.88);
        if (ringDist < width * 0.025) {
          // Purple to Cyan gradient
          const gradT = (x / width);
          r = Math.round(168 * (1 - gradT) + 6 * gradT);
          g = Math.round(85 * (1 - gradT) + 182 * gradT);
          b = Math.round(247 * (1 - gradT) + 212 * gradT);
        }

        // Inner circle
        if (dist < radius * 0.55 && dist > radius * 0.50) {
          r = 139;
          g = 92;
          b = 246;
        }

        // Pulse wave in center: line y approximately = cy, with peaks
        const waveX = (dx / (radius * 0.7));
        if (Math.abs(waveX) <= 1) {
          // Synthetic pulse shape
          let waveY = 0;
          if (waveX > -0.7 && waveX < -0.3) waveY = -Math.sin((waveX + 0.5) * Math.PI * 5) * (radius * 0.35);
          else if (waveX >= -0.3 && waveX < 0.2) waveY = Math.sin((waveX) * Math.PI * 4) * (radius * 0.45);
          else if (waveX >= 0.2 && waveX < 0.6) waveY = -Math.sin((waveX - 0.4) * Math.PI * 5) * (radius * 0.25);

          const dWave = Math.abs(dy - waveY);
          if (dWave < width * 0.02) {
            r = 236;
            g = 72;
            b = 153;
          }
        }
      }

      rawData[pos++] = r;
      rawData[pos++] = g;
      rawData[pos++] = b;
      rawData[pos++] = a;
    }
  }

  // Compress raw image data
  const compressedData = zlib.deflateSync(rawData);

  // Helper to create PNG chunks
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);

    // CRC32 calculation
    const toCrc = Buffer.concat([typeBuf, data]);
    const crc = crc32(toCrc);
    crcBuf.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC32 table
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

// Generate PNG sizes
console.log('Generating PNG assets...');
const png192 = createPngBuffer(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('✓ Wrote public/pwa-192x192.png');

const png512 = createPngBuffer(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('✓ Wrote public/pwa-512x512.png');

const pngMaskable512 = createPngBuffer(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);
console.log('✓ Wrote public/pwa-maskable-512x512.png');

const pngApple180 = createPngBuffer(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple180);
console.log('✓ Wrote public/apple-touch-icon.png');

const favicon32 = createPngBuffer(32, 32, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon32);
console.log('✓ Wrote public/favicon.ico');

// 3. Write static manifest.json fallback
const manifestJson = {
  id: "/",
  name: "EchoVault // Direct Messaging Network",
  short_name: "EchoVault",
  description: "Sleek direct messaging platform with stories, privacy lock, and dynamic persona conversations.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#090a0f",
  theme_color: "#090a0f",
  categories: ["social", "entertainment", "productivity"],
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-maskable-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifestJson, null, 2), 'utf-8');
console.log('✓ Wrote public/manifest.json');
