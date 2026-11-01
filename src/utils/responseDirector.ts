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

export type DayPhase = 'Morning' | 'Afternoon' | 'Evening' | 'Late Night';

export interface LiveTemporalContext {
  dayOfWeek: string;
  dateFormatted: string;
  isoDate: string;
  time12Hour: string;
  time24Hour: string;
  phaseOfDay: DayPhase;
  phaseDescription: string;
  timeZone: string;
  isWeekend: boolean;
  timestampMs: number;
}

/**
 * Computes the user's live real-world temporal context (day of the week, full date,
 * 12-hour & 24-hour clock time, and phase of day: Morning / Afternoon / Evening / Late Night).
 */
export function getLiveTemporalContext(now: Date = new Date()): LiveTemporalContext {
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;

  const time12Hour = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const hours24 = String(now.getHours()).padStart(2, '0');
  const minutes24 = String(now.getMinutes()).padStart(2, '0');
  const time24Hour = `${hours24}:${minutes24}`;

  const hour = now.getHours();
  let phaseOfDay: DayPhase;
  let phaseDescription: string;

  if (hour >= 5 && hour < 12) {
    phaseOfDay = 'Morning';
    phaseDescription =
      'Morning hours (05:00–11:59) — early daylight, coffee/breakfast routines, waking up, or starting the day’s schedule.';
  } else if (hour >= 12 && hour < 17) {
    phaseOfDay = 'Afternoon';
    phaseDescription =
      'Afternoon hours (12:00–16:59) — midday activity, lunch or mid-shift pace, peak daytime energy.';
  } else if (hour >= 17 && hour < 22) {
    phaseOfDay = 'Evening';
    phaseDescription =
      'Evening hours (17:00–21:59) — sunset/dusk into night, winding down from work, dinner, or evening hangouts.';
  } else {
    phaseOfDay = 'Late Night';
    phaseDescription =
      'Late Night / after-hours (22:00–04:59) — quiet nocturnal hours, late-night scrolling, exhaustion, insomnia, or night-owl energy.';
  }

  let timeZone = 'Local Time';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
  } catch {
    // ignore
  }

  const dayNum = now.getDay();
  const isWeekend = dayNum === 0 || dayNum === 6;

  return {
    dayOfWeek,
    dateFormatted,
    isoDate,
    time12Hour,
    time24Hour,
    phaseOfDay,
    phaseDescription,
    timeZone,
    isWeekend,
    timestampMs: now.getTime(),
  };
}

/**
 * Builds the authoritative real-world temporal synchronization block injected into
 * every character generation's systemInstruction so dialogue naturally reflects the exact live time.
 */
export function buildLiveTemporalPromptBlock(
  charName: string = 'Character',
  userName: string = 'You',
  now: Date = new Date()
): string {
  const t = getLiveTemporalContext(now);
  const safeChar = (charName || 'Character').trim();
  const safeUser = (userName || 'You').trim();

  return `\n\n[LIVE REAL-WORLD TEMPORAL SYNCHRONIZATION — ACTIVE CLOCK & PHASE OF DAY]:
- Current Day of the Week: ${t.dayOfWeek} (${t.isWeekend ? 'Weekend' : 'Weekday'})
- Current Calendar Date: ${t.dateFormatted} (${t.isoDate})
- Current Local Time (12-Hour / 24-Hour): ${t.time12Hour} / ${t.time24Hour} (${t.timeZone})
- Current Phase of Day: ${t.phaseOfDay} — ${t.phaseDescription}
- TEMPORAL DIALOGUE SYNCHRONIZATION RULES (MANDATORY):
  1. You (${safeChar}) and ${safeUser} are texting in real time right now on ${t.dayOfWeek}, ${t.dateFormatted} at ${t.time12Hour} (${t.time24Hour}, ${t.phaseOfDay}).
  2. Ensure your dialogue, greetings, environmental cues, and *asterisk* actions naturally reflect that it is currently **${t.phaseOfDay}** (${t.time12Hour} / ${t.time24Hour}) on a **${t.dayOfWeek}**.
  3. NEVER contradict the live clock or phase of day (for example, do NOT say "Good night" or act like it is 2:00 AM when it is ${t.phaseOfDay} at ${t.time12Hour}, and do NOT act like it is bright morning when it is Late Night).
  4. If ${safeUser} asks for the current time, day, or date—or if the conversation touches on schedules, meals, sleep, work shifts, or weekend/weekday plans—anchor your response directly to **${t.dayOfWeek}, ${t.dateFormatted} at ${t.time12Hour} (${t.time24Hour} — ${t.phaseOfDay})** in your authentic canon voice.`;
}

/**
 * Replaces Character.ai template macros ({{char}}, {{user}}, <BOT>, <USER>,
 * plus live temporal macros {{time}}, {{time24}}, {{date}}, {{day}}, {{weekday}}, {{phase}})
 * with the active character's name, active user's handle/codename, and live clock values.
 */
export function replaceCharacterMacros(
  rawText: string,
  charName: string,
  userName: string = 'You',
  now: Date = new Date()
): string {
  if (!rawText) return '';
  const safeChar = (charName || 'Character').trim();
  const safeUser = (userName || 'You').trim();
  const t = getLiveTemporalContext(now);
  return rawText
    .replace(/\{\{\s*char\s*\}\}/gi, safeChar)
    .replace(/\{\{\s*user\s*\}\}/gi, safeUser)
    .replace(/<\s*BOT\s*>/gi, safeChar)
    .replace(/<\s*USER\s*>/gi, safeUser)
    .replace(/\{\{\s*time\s*\}\}/gi, `${t.time12Hour} (${t.time24Hour})`)
    .replace(/\{\{\s*time12\s*\}\}/gi, t.time12Hour)
    .replace(/\{\{\s*time24\s*\}\}/gi, t.time24Hour)
    .replace(/\{\{\s*(?:day|weekday)\s*\}\}/gi, t.dayOfWeek)
    .replace(/\{\{\s*date\s*\}\}/gi, t.dateFormatted)
    .replace(/\{\{\s*phase\s*\}\}/gi, t.phaseOfDay);
}

/**
 * Returns the raw (with {{char}} and {{user}} macros intact) and resolved
 * scenario and mesExamples for a character, taking into account any per-character
 * overrides saved in Response Behavior Director.
 */
export function getCharacterDefinitionFields(
  char: Character,
  userName: string = 'You',
  now: Date = new Date()
): {
  rawScenario: string;
  rawMesExamples: string;
  resolvedScenario: string;
  resolvedMesExamples: string;
} {
  const all = loadAllDirectives();
  const specific = all[char.id];

  const rawScenario =
    (specific?.scenarioOverride !== undefined && specific.scenarioOverride.trim() !== ''
      ? specific.scenarioOverride
      : char.scenario) || '';

  const rawMesExamples =
    (specific?.mesExamplesOverride !== undefined && specific.mesExamplesOverride.trim() !== ''
      ? specific.mesExamplesOverride
      : char.mesExamples) || '';

  return {
    rawScenario,
    rawMesExamples,
    resolvedScenario: replaceCharacterMacros(rawScenario, char.name, userName, now),
    resolvedMesExamples: replaceCharacterMacros(rawMesExamples, char.name, userName, now),
  };
}

/**
 * Builds the Character.ai Definition block (Scenario, Dialogue Examples with {{char}}/{{user}}
 * replaced, and Roleplay Directives) to be injected into the Gemini systemInstruction.
 */
export function buildCharacterCaiDefinitionBlock(
  char: Character,
  userName: string = 'You',
  now: Date = new Date()
): string {
  const { resolvedScenario, resolvedMesExamples } = getCharacterDefinitionFields(char, userName, now);
  const t = getLiveTemporalContext(now);
  const sections: string[] = [];

  if (resolvedScenario.trim()) {
    sections.push(
      `[CHARACTER.AI SCENARIO & CURRENT SETTING (LIVE TIME: ${t.dayOfWeek}, ${t.dateFormatted} — ${t.time12Hour} / ${t.time24Hour} ${t.phaseOfDay})]:\n${resolvedScenario.trim()}`
    );
  }

  if (resolvedMesExamples.trim()) {
    sections.push(
      `[CHARACTER.AI DIALOGUE EXAMPLES (mesExamples — VOICE, CADENCE & FORMATTING REFERENCE)]:\nThe following example exchanges demonstrate how ${char.name} speaks, acts in *asterisks*, and formats replies with ${userName}. Mirror this exact vocal personality, emotional rhythm, and roleplay style without repeating these example lines verbatim (and adapt any time-of-day references to the current live time: ${t.dayOfWeek} ${t.time12Hour} / ${t.time24Hour} ${t.phaseOfDay}):\n${resolvedMesExamples.trim()}`
    );
  }

  sections.push(
    `[CHARACTER.AI ROLEPLAY & EXPRESSION DIRECTIVES]:\n- Adopt ${char.name}'s unmistakable voice, vocabulary, and emotional cadence as shown in the persona and dialogue examples above.\n- Weave expressive physical actions, micro-expressions, and environmental atmosphere in *asterisks* naturally alongside spoken dialogue, synchronized with the current real-world time (${t.dayOfWeek}, ${t.dateFormatted} at ${t.time12Hour} / ${t.time24Hour} — ${t.phaseOfDay}).\n- Address ${userName} organically based on your current scenario and affinity tier.\n- Split multi-part thoughts into 1 to 3 natural message bubbles separated by " || ".`
  );

  return `\n\n${sections.join('\n\n')}`;
}

/**
 * Builds the additional prompt directive block injected into the character's system prompt
 */
export function buildDirectivePromptBlock(
  charId: string,
  charName: string = 'Character',
  userName: string = 'You'
): string {
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
    const resolvedRule = replaceCharacterMacros(active.customInstruction.trim(), charName, userName);
    parts.push(`[LIVE DIRECTOR INSTRUCTION - MUST OBEY]: ${resolvedRule}`);
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

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_MODEL = 'cognitivecomputations/dolphin-mistral-24b-venice-edition';
export const OPENROUTER_REFERER = 'https://echovault-or9c.onrender.com';
export const OPENROUTER_TITLE = 'EchoVault';
export const DEFAULT_FREQUENCY_PENALTY = 0.7;
export const DEFAULT_PRESENCE_PENALTY = 0.6;
export const MAX_CHAT_HISTORY_MESSAGES = 15;

export interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Normalizes a message string for similarity and repetition comparison.
 */
export function normalizeTextForRepetitionCheck(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/^(?:character|assistant|ai|model|system):\s*/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes a similarity score (0.0 to 1.0) between two response strings using
 * normalized word-level and bigram Jaccard overlap plus substring containment.
 */
export function computeResponseSimilarity(a: string, b: string): number {
  const normA = normalizeTextForRepetitionCheck(a);
  const normB = normalizeTextForRepetitionCheck(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  if (normA.length >= 24 && normB.length >= 24) {
    if (normA.includes(normB) || normB.includes(normA)) {
      return 0.92;
    }
  }

  const wordsA = normA.split(' ').filter(w => w.length > 2);
  const wordsB = normB.split(' ').filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let wordIntersection = 0;
  setA.forEach(w => {
    if (setB.has(w)) wordIntersection++;
  });
  const wordUnion = new Set([...wordsA, ...wordsB]).size;
  const wordJaccard = wordUnion > 0 ? wordIntersection / wordUnion : 0;

  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < wordsA.length - 1; i++) {
    bigramsA.add(`${wordsA[i]} ${wordsA[i + 1]}`);
  }
  for (let i = 0; i < wordsB.length - 1; i++) {
    bigramsB.add(`${wordsB[i]} ${wordsB[i + 1]}`);
  }

  if (bigramsA.size === 0 || bigramsB.size === 0) {
    return wordJaccard;
  }

  let bigramIntersection = 0;
  bigramsA.forEach(bg => {
    if (bigramsB.has(bg)) bigramIntersection++;
  });
  const bigramUnion = new Set([...bigramsA, ...bigramsB]).size;
  const bigramJaccard = bigramUnion > 0 ? bigramIntersection / bigramUnion : 0;

  return Math.max(wordJaccard * 0.75 + bigramJaccard * 0.25, bigramJaccard);
}

/**
 * Checks whether a candidate response is identical or nearly identical to any of the
 * recent assistant/character messages.
 */
export function isNearDuplicateResponse(
  candidate: string,
  recentAssistantMessages: string[],
  threshold: number = 0.62
): boolean {
  const cleanCandidate = (candidate || '').trim();
  if (!cleanCandidate || !Array.isArray(recentAssistantMessages) || recentAssistantMessages.length === 0) {
    return false;
  }

  const candidateBubbles = cleanCandidate
    .split('||')
    .map(s => s.trim())
    .filter(Boolean);

  for (const prev of recentAssistantMessages.slice(-4)) {
    if (!prev || !prev.trim()) continue;
    if (computeResponseSimilarity(cleanCandidate, prev) >= threshold) {
      return true;
    }

    const prevBubbles = prev
      .split('||')
      .map(s => s.trim())
      .filter(Boolean);

    // If all bubbles in candidate match bubbles in a recent assistant reply, flag as duplicate
    if (
      candidateBubbles.length > 0 &&
      candidateBubbles.every(cb =>
        prevBubbles.some(pb => computeResponseSimilarity(cb, pb) >= threshold)
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Removes duplicate bubbles within a response and strips individual bubbles or
 * repeated *asterisk* descriptions that are nearly identical to recent assistant messages.
 */
export function deduplicateConsecutiveBubbles(
  rawReplyText: string,
  recentAssistantMessages: string[] = []
): string {
  const rawBubbles = (rawReplyText || '')
    .split('||')
    .map(b => b.trim())
    .filter(Boolean);

  if (rawBubbles.length === 0) return '';

  const recentBubbles = recentAssistantMessages
    .slice(-3)
    .flatMap(m => (m || '').split('||').map(s => s.trim()).filter(Boolean));

  const recentActions = recentAssistantMessages
    .slice(-3)
    .flatMap(m => {
      const matches = (m || '').match(/\*[^*]{10,}\*/g);
      return matches ? matches.map(a => a.trim()) : [];
    });

  const uniqueBubbles: string[] = [];

  for (const bubble of rawBubbles) {
    let cleanedBubble = bubble;

    // Strip repeated *asterisk* descriptions if they already appeared in recent assistant messages
    const actionMatches = cleanedBubble.match(/\*[^*]{10,}\*/g);
    if (actionMatches && recentActions.length > 0) {
      for (const act of actionMatches) {
        const isRepeatedAction = recentActions.some(
          ra => computeResponseSimilarity(act, ra) >= 0.65
        );
        if (isRepeatedAction) {
          cleanedBubble = cleanedBubble.replace(act, '').replace(/\s{2,}/g, ' ').trim();
        }
      }
    }

    if (!cleanedBubble) continue;

    const duplicatesInternal = uniqueBubbles.some(
      ub => computeResponseSimilarity(cleanedBubble, ub) >= 0.65
    );
    if (duplicatesInternal) continue;

    const duplicatesRecent = recentBubbles.some(
      rb => computeResponseSimilarity(cleanedBubble, rb) >= 0.65
    );
    if (duplicatesRecent && rawBubbles.length > 1) {
      continue;
    }

    uniqueBubbles.push(cleanedBubble);
  }

  if (uniqueBubbles.length === 0) {
    return rawBubbles[0];
  }

  return uniqueBubbles.slice(0, 3).join(' || ');
}

/**
 * Executes an OpenRouter chat completion request using
 * https://openrouter.ai/api/v1/chat/completions and model
 * cognitivecomputations/dolphin-mistral-24b-venice-edition
 * with frequency_penalty: 0.7 and presence_penalty: 0.6.
 */
export async function requestOpenRouterCompletion(params: {
  apiKey: string;
  systemInstruction: string;
  messages: OpenRouterChatMessage[];
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  model?: string;
}): Promise<{ text: string; modelUsed: string }> {
  const activeModel = params.model || OPENROUTER_MODEL;
  const recentContextMessages = params.messages.slice(-MAX_CHAT_HISTORY_MESSAGES);
  const fullMessages: OpenRouterChatMessage[] = [
    ...(params.systemInstruction
      ? [{ role: 'system' as const, content: params.systemInstruction }]
      : []),
    ...recentContextMessages,
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey.trim()}`,
      'HTTP-Referer': OPENROUTER_REFERER,
      'X-Title': OPENROUTER_TITLE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: activeModel,
      messages: fullMessages,
      temperature: params.temperature ?? 0.95,
      top_p: params.topP ?? 0.95,
      frequency_penalty: params.frequencyPenalty ?? DEFAULT_FREQUENCY_PENALTY,
      presence_penalty: params.presencePenalty ?? DEFAULT_PRESENCE_PENALTY,
    }),
  });

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errMsg =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      `OpenRouter HTTP ${response.status}`;
    const err: any = new Error(String(errMsg));
    err.status = response.status;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content.trim() : '';
  return {
    text,
    modelUsed: data?.model || activeModel,
  };
}
