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
]);

/**
 * Normalizes any character avatar or story image path so legacy `.svg` paths
 * automatically resolve to the high-resolution `.png` character portraits in `/public/avatars/`.
 */
export function resolveAvatarUrl(url?: string, charId?: string): string {
  if (charId && KNOWN_PORTRAIT_IDS.has(charId)) {
    if (!url || url.endsWith('.svg') || url.includes('dicebear.com')) {
      return `/avatars/${charId}.png`;
    }
  }

  if (!url) {
    return '/avatars/gojo.png';
  }

  if (url.startsWith('/avatars/') && url.endsWith('.svg')) {
    return url.replace(/\.svg$/i, '.png');
  }

  return url;
}

/**
 * Builds a sleek fallback avatar data URI if an external or custom image URL fails to load.
 */
export function buildFallbackAvatarDataUri(name: string = 'CH', accentColor: string = '#8B5CF6'): string {
  const initials =
    name
      .replace(/\([^)]*\)/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() || '')
      .join('') || 'CH';

  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(accentColor) ? accentColor : '#8B5CF6';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#151928"/>
        <stop offset="100%" stop-color="#090a0f"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#bg)"/>
    <circle cx="60" cy="60" r="56" fill="none" stroke="${safeColor}" stroke-opacity="0.45" stroke-width="3"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#F8FAFC" font-family="system-ui, sans-serif" font-weight="700" font-size="38">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Graceful `onError` handler for character avatar & story `<img>` elements.
 */
export function handleAvatarImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  name: string = 'Character',
  accentColor: string = '#8B5CF6'
): void {
  const img = e.currentTarget;

  if (img.src.includes('.svg') && !img.dataset.triedPng) {
    img.dataset.triedPng = 'true';
    img.src = img.src.replace(/\.svg(\?.*)?$/i, '.png');
    return;
  }

  if (!img.dataset.fallbackApplied) {
    img.dataset.fallbackApplied = 'true';
    img.src = buildFallbackAvatarDataUri(name, accentColor);
  }
}
