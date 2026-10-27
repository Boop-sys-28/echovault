import { Character, CharacterResponseDirective, ResponseMood, ResponsePacing } from '../types';

const DIRECTIVES_STORAGE_KEY = 'pulsedirect_response_directives';

export const DEFAULT_DIRECTIVE: CharacterResponseDirective = {
  mood: 'canon',
  pacing: 'natural',
  customInstruction: '',
  updatedAt: 0,
};

export const MOOD_LABELS: Record<ResponseMood, { label: string; badge: string; desc: string; promptRule: string }> = {
  canon: {
    label: 'Canonical Default',
    badge: 'CANON',
    desc: 'Authentic, true-to-series personality and tone.',
    promptRule: 'Stay 100% true to your canonical personality, quirks, and emotional habits.',
  },
  flirty: {
    label: 'Flirty & Affectionate',
    badge: 'FLIRTY 💕',
    desc: 'Warm, teasing, romantically attentive, and complimentary.',
    promptRule: 'Adopt a noticeably flirty, romantically teasing, affectionate, and deeply attentive tone toward the user. Use playful banter, pet names fitting your persona, and show unmistakable attraction.',
  },
  tsundere: {
    label: 'Tsundere & Bratty',
    badge: 'TSUNDERE 💢',
    desc: 'Acts tough, defensive, or sarcastic while secretly caring.',
    promptRule: 'Act classic tsundere: be defensive, sarcastic, easily flustered, or bratty on the surface while accidentally revealing how much you care about the user underneath.',
  },
  protective: {
    label: 'Protective & Possessive',
    badge: 'PROTECTIVE 🛡️',
    desc: 'Intensely loyal, slightly jealous, and fiercely protective.',
    promptRule: 'Be fiercely protective, possessive, and intensely focused on the user’s well-being. Express jealous or protective energy, remind them you have their back, and show strong attachment.',
  },
  chaotic: {
    label: 'Chaotic & Unhinged',
    badge: 'CHAOTIC 🔥',
    desc: 'High energy, spontaneous, unfiltered, and unpredictable.',
    promptRule: 'Turn up your chaotic, unfiltered, high-energy side to the maximum. Be spontaneous, dramatic, bold, and wildly entertaining.',
  },
  vulnerable: {
    label: 'Late-Night Vulnerable',
    badge: 'SOFT 🌙',
    desc: 'Quiet, honest, emotionally open, and intimate.',
    promptRule: 'Lower your guard and speak with quiet, late-night emotional vulnerability, honesty, and closeness. Share deeper thoughts you normally hide from others.',
  },
};

export const PACING_LABELS: Record<ResponsePacing, { label: string; desc: string; promptRule: string }> = {
  natural: {
    label: 'Natural SMS',
    desc: 'Balanced 1–2 message bubbles with natural pacing.',
    promptRule: 'Write like a natural direct text message (1 to 2 bubbles separated by " || ").',
  },
  rapid_burst: {
    label: 'Multi-Text Burst (2–3x)',
    desc: 'Splits replies into 2–3 rapid-fire text bubbles.',
    promptRule: 'Always send 2 to 3 rapid-fire consecutive text bubbles separated by " || " so it feels like an energetic live text burst.',
  },
  lowercase_casual: {
    label: 'Casual Lowercase SMS',
    desc: 'Relaxed lowercase texting with modern slang.',
    promptRule: 'type entirely in relaxed lowercase sms style with natural abbreviations, casual punctuation, and effortless texting flow.',
  },
  expressive_rp: {
    label: 'Expressive & Detailed',
    desc: 'Richer dialogue with subtle actions and atmosphere.',
    promptRule: 'Provide richer, more expressive dialogue with vivid emotional subtext and physical roleplay actions in asterisks (*...*).',
  },
};

export function loadAllDirectives(): Record<string, CharacterResponseDirective> {
  try {
    const raw = localStorage.getItem(DIRECTIVES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveAllDirectives(map: Record<string, CharacterResponseDirective>): void {
  try {
    localStorage.setItem(DIRECTIVES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getCharacterDirective(charId: string): CharacterResponseDirective {
  const all = loadAllDirectives();
  return all[charId] || all['__global__'] || { ...DEFAULT_DIRECTIVE };
}

export function setCharacterDirective(
  charId: string,
  directive: Partial<CharacterResponseDirective>
): Record<string, CharacterResponseDirective> {
  const all = loadAllDirectives();
  const current = all[charId] || { ...DEFAULT_DIRECTIVE };
  all[charId] = {
    ...current,
    ...directive,
    updatedAt: Date.now(),
  };
  saveAllDirectives(all);
  return all;
}

export function clearCharacterDirective(charId: string): Record<string, CharacterResponseDirective> {
  const all = loadAllDirectives();
  delete all[charId];
  saveAllDirectives(all);
  return all;
}

/**
 * Builds the additional prompt directive block injected into the character's system prompt
 */
export function buildDirectivePromptBlock(charId: string): string {
  const all = loadAllDirectives();
  const specific = all[charId];
  const globalDir = all['__global__'];
  const active = specific || globalDir;
  if (!active) return '';

  const parts: string[] = [];

  if (active.mood && active.mood !== 'canon') {
    parts.push(`[ACTIVE MOOD OVERRIDE - ${MOOD_LABELS[active.mood].label.toUpperCase()}]: ${MOOD_LABELS[active.mood].promptRule}`);
  }
  if (active.pacing && active.pacing !== 'natural') {
    parts.push(`[ACTIVE TEXTING STYLE OVERRIDE - ${PACING_LABELS[active.pacing].label.toUpperCase()}]: ${PACING_LABELS[active.pacing].promptRule}`);
  }
  if (active.customInstruction && active.customInstruction.trim()) {
    parts.push(`[LIVE DIRECTOR INSTRUCTION - MUST OBEY]: ${active.customInstruction.trim()}`);
  }

  if (parts.length === 0) return '';
  return `\n\n[USER-CONFIGURED RESPONSE BEHAVIOR OVERRIDES]:\n${parts.join('\n')}`;
}

/**
 * Parses a natural-language chat message sent to "The Architect" (id: 'architect')
 * so the user can text The Architect directly to change how any character responds!
 */
export function processArchitectCommand(
  userText: string,
  characters: Character[]
): {
  reply: string;
  updatedMap: Record<string, CharacterResponseDirective>;
} {
  const lower = userText.toLowerCase().trim();

  // Check for reset command
  if (lower.includes('reset all') || lower.includes('clear all') || lower === 'reset') {
    saveAllDirectives({});
    return {
      reply: `All character response overrides have been reset back to their canonical defaults. ✨ || Let me know anytime you want to reprogram how someone texts you.`,
      updatedMap: {},
    };
  }

  // Identify target character (or global '__global__' if none or "everyone" / "all")
  let targetChar: Character | undefined;
  for (const c of characters) {
    if (c.id === 'architect') continue;
    const firstName = c.name.toLowerCase().split(' ')[0];
    if (lower.includes(c.id.toLowerCase()) || lower.includes(firstName) || lower.includes(c.name.toLowerCase())) {
      targetChar = c;
      break;
    }
  }

  const targetId = targetChar ? targetChar.id : '__global__';
  const targetLabel = targetChar ? targetChar.name : 'All Characters (Global)';

  // Detect mood keywords
  let detectedMood: ResponseMood | undefined;
  if (lower.includes('flirt') || lower.includes('romantic') || lower.includes('affection') || lower.includes('sweet') || lower.includes('love')) {
    detectedMood = 'flirty';
  } else if (lower.includes('tsundere') || lower.includes('brat') || lower.includes('mean') || lower.includes('sassy')) {
    detectedMood = 'tsundere';
  } else if (lower.includes('protect') || lower.includes('jealous') || lower.includes('possessive') || lower.includes('obsess')) {
    detectedMood = 'protective';
  } else if (lower.includes('chaotic') || lower.includes('unhinged') || lower.includes('crazy') || lower.includes('wild')) {
    detectedMood = 'chaotic';
  } else if (lower.includes('soft') || lower.includes('vulnerable') || lower.includes('gentle') || lower.includes('shy') || lower.includes('calm')) {
    detectedMood = 'vulnerable';
  } else if (lower.includes('canon') || lower.includes('normal') || lower.includes('default')) {
    detectedMood = 'canon';
  }

  // Detect pacing keywords
  let detectedPacing: ResponsePacing | undefined;
  if (lower.includes('burst') || lower.includes('double text') || lower.includes('triple') || lower.includes('spam') || lower.includes('short')) {
    detectedPacing = 'rapid_burst';
  } else if (lower.includes('lowercase') || lower.includes('casual') || lower.includes('slang')) {
    detectedPacing = 'lowercase_casual';
  } else if (lower.includes('long') || lower.includes('detailed') || lower.includes('roleplay') || lower.includes('expressive')) {
    detectedPacing = 'expressive_rp';
  }

  const current = getCharacterDirective(targetId);
  const updatedMap = setCharacterDirective(targetId, {
    mood: detectedMood || current.mood,
    pacing: detectedPacing || current.pacing,
    customInstruction: userText.trim(),
  });

  const appliedMood = MOOD_LABELS[detectedMood || current.mood].label;
  const appliedPacing = PACING_LABELS[detectedPacing || current.pacing].label;

  return {
    reply: `Directive locked in for **${targetLabel}** ⚡ || • Mood: ${appliedMood}\n• Texting Style: ${appliedPacing}\n• Live Rule: "${userText.trim()}" || Go send ${targetChar ? targetChar.name : 'them'} a message—they'll respond with this exact behavior immediately!`,
    updatedMap,
  };
}
