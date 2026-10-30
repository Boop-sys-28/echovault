import React from 'react';

const KNOWN_PORTRAIT_IDS = new Set([
  'gojo',
  'lucy',
  'marin',
  'frieren',
  'levi',
  'makima',
  'loona',
  'leon',
  'stolas',
  'blitzo',
  'vassago',
  'verosika',
  'fizzarolli',
  'alastor',
  'charlie',
  'ada',
  'jill',
  'octavia',
  'millie',
  'moxxie',
  'megumi',
  'spiderman',
  '2b',
  'astarion',
  'jinx',
  'zoro',
  'nightwing',
  'batman',
  'redhood',
  'raven',
  'reze',
  'clarkson',
  'hammond',
  'may',
  'jeremy-clarkson',
  'richard-hammond',
  'james-may',
]);

const NAME_TO_LOCAL_PORTRAIT_ID: Record<string, string> = {
  'satoru gojo': 'gojo',
  gojo: 'gojo',
  'lucy kushinada': 'lucy',
  lucy: 'lucy',
  'marin kitagawa': 'marin',
  marin: 'marin',
  frieren: 'frieren',
  'levi ackerman': 'levi',
  levi: 'levi',
  makima: 'makima',
  loona: 'loona',
  'leon s. kennedy': 'leon',
  'leon kennedy': 'leon',
  leon: 'leon',
  stolas: 'stolas',
  'blitzø': 'blitzo',
  blitzo: 'blitzo',
  vassago: 'vassago',
  'verosika mayday': 'verosika',
  verosika: 'verosika',
  fizzarolli: 'fizzarolli',
  alastor: 'alastor',
  'charlie morningstar': 'charlie',
  charlie: 'charlie',
  'ada wong': 'ada',
  ada: 'ada',
  'jill valentine': 'jill',
  jill: 'jill',
  octavia: 'octavia',
  millie: 'millie',
  moxxie: 'moxxie',
  'megumi fushiguro': 'megumi',
  megumi: 'megumi',
  'spider-man (peter parker)': 'spiderman',
  'spider-man': 'spiderman',
  'peter parker': 'spiderman',
  '2b (yorha no.2 type b)': '2b',
  '2b': '2b',
  'astarion ancunin': 'astarion',
  astarion: 'astarion',
  jinx: 'jinx',
  'roronoa zoro': 'zoro',
  zoro: 'zoro',
  'nightwing (dick grayson)': 'nightwing',
  nightwing: 'nightwing',
  'dick grayson': 'nightwing',
  'batman (bruce wayne)': 'batman',
  batman: 'batman',
  'bruce wayne': 'batman',
  'red hood (jason todd)': 'redhood',
  'red hood': 'redhood',
  'jason todd': 'redhood',
  'raven (rachel roth)': 'raven',
  raven: 'raven',
  'rachel roth': 'raven',
  reze: 'reze',
  'jeremy clarkson': 'clarkson',
  'jeremy clarkson ("jezza")': 'clarkson',
  clarkson: 'clarkson',
  jezza: 'clarkson',
  'richard hammond': 'hammond',
  'richard hammond ("the hamster")': 'hammond',
  hammond: 'hammond',
  'the hamster': 'hammond',
  'james may': 'may',
  'james may ("captain slow")': 'may',
  may: 'may',
  'captain slow': 'may',
};

/**
 * Strips revision parameters, query strings, and proxy wrappers from a Wikia/Fandom URL
 * and proxies it through wsrv.nl with output=png, 300x300 cover framing, and top alignment.
 */
export function resolveAvatarUrl(url?: string, charId?: string): string {
  if (url && url.startsWith('https://wsrv.nl/')) {
    try {
      const parsed = new URL(url);
      const inner = parsed.searchParams.get('url');
      if (inner && (inner.includes('wikia.nocookie.net') || inner.includes('fandom.com'))) {
        const cleanInner = inner
          .replace(/^https?:\/\/i0\.wp\.com\//i, 'http://')
          .replace(/^https:\/\//i, 'http://')
          .split('/revision/')[0]
          .split('?')[0];
        return `https://wsrv.nl/?url=${encodeURIComponent(cleanInner)}&output=png&w=300&h=300&fit=cover&a=top`;
      }
      if (inner && (inner.includes('wikimedia.org') || inner.includes('wikipedia.org'))) {
        const cleanInner = inner.split('?')[0];
        return `https://wsrv.nl/?url=${encodeURIComponent(cleanInner)}&output=png&w=300&h=300&fit=cover&a=top`;
      }
    } catch {
      // ignore URL parse error
    }
    return url;
  }

  if (
    url &&
    (url.includes('static.wikia.nocookie.net') ||
      url.includes('vignette.wikia.nocookie.net') ||
      url.includes('fandom.com'))
  ) {
    // Strip any i0.wp.com wrapper, trailing /revision/latest..., or query params
    const stripped = url
      .replace(/^https?:\/\/i0\.wp\.com\//i, 'http://')
      .split('/revision/')[0]
      .split('?')[0];

    // Normalize upstream protocol to http:// so wsrv.nl fetches from Fandom without TLS JA3 challenge
    const rawUrl = stripped.replace(/^https:\/\//i, 'http://');
    return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&output=png&w=300&h=300&fit=cover&a=top`;
  }

  if (url && (url.includes('wikimedia.org') || url.includes('wikipedia.org'))) {
    const rawUrl = url.split('?')[0];
    return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&output=png&w=300&h=300&fit=cover&a=top`;
  }

  if (charId && KNOWN_PORTRAIT_IDS.has(charId)) {
    if (!url || url.endsWith('.svg') || url.includes('dicebear.com')) {
      return `/avatars/${charId}.png`;
    }
  }

  if (!url) {
    const defaultRawUrl =
      'http://static.wikia.nocookie.net/jujutsu-kaisen/images/e/ef/Satoru_Gojo_%28Anime_2%29.png';
    return `https://wsrv.nl/?url=${encodeURIComponent(defaultRawUrl)}&output=png&w=300&h=300&fit=cover&a=top`;
  }

  if (url.startsWith('/avatars/') && url.endsWith('.svg')) {
    return url.replace(/\.svg$/i, '.png');
  }

  return url;
}

/**
 * Builds a clean, stylized SVG character portrait with anime/cyberpunk head-and-shoulders
 * silhouette, glowing eyes, hair layers, and neon rim lighting as the final offline fallback.
 */
export function buildFallbackAvatarDataUri(
  name: string = 'Character',
  accentColor: string = '#8B5CF6'
): string {
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(accentColor) ? accentColor : '#8B5CF6';
  const cleanName = name.replace(/\([^)]*\)/g, '').replace(/["']/g, '').trim() || 'Operative';
  // Deterministic hash for subtle portrait hair/eye variation per character
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash * 31 + cleanName.charCodeAt(i)) | 0;
  }
  const hairVariant = Math.abs(hash) % 3;

  const hairPath =
    hairVariant === 0
      ? 'M68 38 C32 42 26 78 30 118 C36 92 48 76 62 70 C74 82 90 84 106 72 C120 78 130 94 136 118 C140 78 134 40 98 38 Z'
      : hairVariant === 1
      ? 'M84 30 L96 42 L114 34 L108 52 L130 50 L118 68 L136 78 L116 86 C112 66 98 56 84 56 C70 56 56 66 52 86 L32 78 L50 68 L38 50 L60 52 L54 34 L72 42 Z'
      : 'M84 34 C46 34 32 64 34 132 L50 132 C48 96 56 72 84 68 C112 72 120 96 118 132 L134 132 C136 64 122 34 84 34 Z';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 168">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${safeColor}" stop-opacity="0.45"/>
        <stop offset="50%" stop-color="#141829" stop-opacity="0.96"/>
        <stop offset="100%" stop-color="#090a0f" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="suit" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e243b"/>
        <stop offset="100%" stop-color="#0b0d16"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="38%" r="52%">
        <stop offset="0%" stop-color="${safeColor}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${safeColor}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="168" height="168" rx="84" fill="#090a0f"/>
    <rect width="168" height="168" rx="84" fill="url(#bg)"/>
    <circle cx="84" cy="68" r="62" fill="url(#glow)"/>
    <!-- Shoulders & High-Collar Cyber Jacket -->
    <path d="M22 168 C26 130 50 116 84 116 C118 116 142 130 146 168 Z" fill="url(#suit)" stroke="${safeColor}" stroke-opacity="0.55" stroke-width="2"/>
    <path d="M54 118 L68 148 L84 134 L100 148 L114 118" fill="none" stroke="${safeColor}" stroke-opacity="0.8" stroke-width="2.2"/>
    <!-- Neck & Head -->
    <rect x="74" y="98" width="20" height="24" rx="8" fill="#cbd5e1"/>
    <path d="M54 68 C54 46 68 38 84 38 C100 38 114 46 114 68 C114 90 100 108 84 108 C68 108 54 90 54 68 Z" fill="#e2e8f0"/>
    <!-- Glowing Anime Eyes -->
    <ellipse cx="71" cy="74" rx="5.5" ry="3.2" fill="#0f172a"/>
    <ellipse cx="97" cy="74" rx="5.5" ry="3.2" fill="#0f172a"/>
    <circle cx="71" cy="74" r="2.3" fill="${safeColor}"/>
    <circle cx="97" cy="74" r="2.3" fill="${safeColor}"/>
    <circle cx="72.2" cy="73" r="0.9" fill="#ffffff"/>
    <circle cx="98.2" cy="73" r="0.9" fill="#ffffff"/>
    <!-- Subtle Expression -->
    <path d="M78 91 Q84 94 90 91" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
    <!-- Stylized Anime Hair Silhouette -->
    <path d="${hairPath}" fill="#1e1b4b" stroke="${safeColor}" stroke-opacity="0.75" stroke-width="2"/>
    <!-- Outer Ring Frame -->
    <circle cx="84" cy="84" r="80" fill="none" stroke="${safeColor}" stroke-opacity="0.65" stroke-width="3"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Multi-stage `onError` handler for character avatar & story `<img>` elements:
 * 1. If a local PNG portrait exists in `/avatars/<id>.png` for this character, try loading it first.
 * 2. Next, try loading a direct CDN illustrated character portrait (DiceBear Adventurer / Unavatar CDN).
 * 3. Finally, fall back to a clean SVG character portrait illustration.
 */
export function handleAvatarImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  name: string = 'Character',
  accentColor: string = '#8B5CF6'
): void {
  const img = e.currentTarget;
  const normalizedName = name.trim().toLowerCase();
  const matchedLocalId =
    NAME_TO_LOCAL_PORTRAIT_ID[normalizedName] ||
    NAME_TO_LOCAL_PORTRAIT_ID[normalizedName.replace(/\s*\([^)]*\)\s*/g, '').trim()];

  // Stage 1: Try local high-res PNG portrait if available in /public/avatars/
  if (
    matchedLocalId &&
    !img.dataset.triedLocalPortrait &&
    !img.src.endsWith(`/avatars/${matchedLocalId}.png`)
  ) {
    img.dataset.triedLocalPortrait = 'true';
    img.src = `/avatars/${matchedLocalId}.png`;
    return;
  }

  // Stage 2: Try direct illustrated character portrait CDN (CORS-safe, no-referrer compatible)
  if (!img.dataset.triedDirectCdn) {
    img.dataset.triedDirectCdn = 'true';
    const seed = encodeURIComponent(name.trim() || 'Character');
    img.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=0d0f17,161a2b,1e1b4b`;
    return;
  }

  // Stage 3: Clean SVG portrait fallback
  if (!img.dataset.fallbackApplied) {
    img.dataset.fallbackApplied = 'true';
    img.src = buildFallbackAvatarDataUri(name, accentColor);
  }
}

/**
 * Formats an engagement or user count into a compact human-readable string (e.g. 14250 -> "14.2k", 9420 -> "9.4k", 850 -> "850").
 */
export function formatCompactNumber(count: number = 1200): string {
  const safeCount = Number.isFinite(count) && count >= 0 ? Math.round(count) : 1200;
  if (safeCount >= 1_000_000) {
    const millions = Math.floor((safeCount / 1_000_000) * 10) / 10;
    return `${millions.toFixed(1).replace(/\.0$/, '')}m`;
  }
  if (safeCount >= 1_000) {
    const thousands = Math.floor((safeCount / 1_000) * 10) / 10;
    return `${thousands.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(safeCount);
}
