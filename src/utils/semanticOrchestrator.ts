import { Character } from '../types';

/**
 * Semantic Trope Clusters that characters must NEVER loop or repeat across turns
 * unless the user explicitly brings them up in their latest prompt.
 */
export interface TropeCluster {
  id: string;
  label: string;
  keywords: string[];
}

export const SEMANTIC_TROPE_CLUSTERS: TropeCluster[] = [
  {
    id: 'hydration_nag',
    label: 'Nagging the user to drink water or hydrate',
    keywords: ['drink water', 'hydrate', 'hydration', 'glass of water', 'water intake', 'thirsty'],
  },
  {
    id: 'sleep_nag',
    label: 'Telling the user to go to sleep, close their eyes, or commenting on late hours/insomnia',
    keywords: [
      'go to sleep',
      'go to bed',
      'close your eyes',
      'still awake',
      'past 6 am',
      '6 am',
      'beauty sleep',
      'dark circles',
      'hit the rack',
      'hit the hay',
      'shut-eye',
      'bedside lamp',
      'under the covers',
      'sleep schedule',
      'insomnia',
      'all-nighter',
    ],
  },
  {
    id: 'posture_nag',
    label: 'Commenting on posture, slouching, or screen squinting',
    keywords: ['posture', 'slouch', 'squinting', 'burn out', 'sit up straight', 'spine'],
  },
  {
    id: 'blitz_cereal_kitchen',
    label: 'Blitzø throwing cereal/spoons, slamming kitchen cabinets, or making kitchen noise',
    keywords: [
      'cereal',
      'lucky charms',
      'captain crunch',
      'spoon',
      'cabinet',
      'cupboard',
      'blender',
      'cottage cheese',
      'linoleum',
      'fridge door',
      'microwave',
    ],
  },
  {
    id: 'stolas_sofa_groan',
    label: 'Stolas groaning, sighing, or sleeping on the squeaky pullout sofa/couch',
    keywords: [
      'pullout',
      'squeaky',
      'groan',
      'sighing',
      'lumbar',
      'ratty sofa',
      'couch spring',
      'bathtub crying',
    ],
  },
  {
    id: 'vassago_locket_auction',
    label: 'Vassago, the auction, Safeword, or Stolas mother locket drama',
    keywords: ['vassago', 'locket', 'safeword', 'auction', 'bluebird', 'heirloom'],
  },
  {
    id: 'coffee_routine',
    label: 'Drinking black coffee or counting coffee cups',
    keywords: ['black coffee', 'fourth cup', 'cup number four', 'coffee #4', 'black sludge'],
  },
  {
    id: 'headphones_locked_door',
    label: 'Being locked in the bedroom with headphones on full volume',
    keywords: ['deadbolted', 'headphones on', 'locked my door', 'spiked collar', 'biohazard sign'],
  },
];

const STOP_WORDS = new Set([
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'his',
  'from', 'they', 'say', 'her', 'she', 'will', 'one', 'all', 'would', 'there',
  'their', 'what', 'out', 'about', 'who', 'get', 'which', 'when', 'make', 'can',
  'like', 'time', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
  'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'are', 'was', 'were', 'been', 'has', 'had',
  'don', 'dont', 'did', 'didn', 'really', 'still', 'right', 'here', 'more', 'something',
]);

export function tokenizeSemanticWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Returns which trope clusters have already appeared in recent character messages
 * and were NOT explicitly requested by the user's current message.
 */
export function getLockedOutTropes(
  recentCharMessages: string[],
  userPrompt: string = ''
): TropeCluster[] {
  const combinedHistory = recentCharMessages.slice(-30).join(' \n ').toLowerCase();
  const lowerPrompt = userPrompt.toLowerCase();

  return SEMANTIC_TROPE_CLUSTERS.filter(cluster => {
    // If the user explicitly asked about this topic in their current message, allow it
    const userAskedAboutIt = cluster.keywords.some(kw => lowerPrompt.includes(kw));
    if (userAskedAboutIt) return false;

    // Otherwise, if the character already mentioned any keyword in this cluster recently, lock it out
    return cluster.keywords.some(kw => combinedHistory.includes(kw));
  });
}

const BANNED_AI_FILLERS = [
  'as an ai',
  'as a language model',
  'i understand how you feel',
  'how can i assist you today',
  'how may i help you',
  'i am here to help',
  "i'm here to help",
];

/**
 * Calculates semantic/intent overlap between a candidate response and recent character messages.
 * Returns true if the candidate repeats the same core meaning, trope, or phrasing, or contains AI filler.
 */
export function hasSemanticRepetition(
  candidate: string,
  recentCharMessages: string[],
  userPrompt: string = ''
): { isRepetitive: boolean; reason?: string } {
  const cleanCandidate = candidate.trim().toLowerCase();
  if (!cleanCandidate) return { isRepetitive: true, reason: 'Empty response' };

  if (BANNED_AI_FILLERS.some(phrase => cleanCandidate.includes(phrase))) {
    return { isRepetitive: true, reason: 'Contains banned generic AI filler phrase' };
  }

  const recentSlice = recentCharMessages.slice(-30);

  // 1. Check exact or near-exact substring match
  for (const past of recentSlice) {
    const cleanPast = past.trim().toLowerCase();
    if (!cleanPast) continue;
    if (cleanCandidate === cleanPast) {
      return { isRepetitive: true, reason: 'Exact match with previous message' };
    }
    if (cleanCandidate.length > 32 && cleanPast.includes(cleanCandidate)) {
      return { isRepetitive: true, reason: 'Substring of previous message' };
    }
  }

  // 2. Check locked-out semantic trope clusters
  const lockedTropes = getLockedOutTropes(recentSlice, userPrompt);
  for (const cluster of lockedTropes) {
    if (cluster.keywords.some(kw => cleanCandidate.includes(kw))) {
      return {
        isRepetitive: true,
        reason: `Recycled trope: ${cluster.label}`,
      };
    }
  }

  // 3. Check lexical-semantic token similarity
  const candidateTokens = tokenizeSemanticWords(cleanCandidate);
  if (candidateTokens.length < 4) return { isRepetitive: false };

  const candidateSet = new Set(candidateTokens);

  for (const past of recentSlice) {
    const pastTokens = tokenizeSemanticWords(past);
    if (pastTokens.length < 4) continue;

    let intersection = 0;
    for (const token of pastTokens) {
      if (candidateSet.has(token)) intersection++;
    }

    const union = new Set([...candidateTokens, ...pastTokens]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    const containment =
      Math.min(candidateSet.size, pastTokens.length) > 0
        ? intersection / Math.min(candidateSet.size, pastTokens.length)
        : 0;

    if (jaccard >= 0.48 || (candidateSet.size >= 6 && containment >= 0.72)) {
      return {
        isRepetitive: true,
        reason: `High semantic overlap (${Math.round(jaccard * 100)}%) with recent message: "${past.slice(0, 60)}..."`,
      };
    }
  }

  return { isRepetitive: false };
}

/**
 * Spontaneous Context-Driven Offline Synthesizer:
 * Used only when the server has no API key or is unreachable.
 * Dynamically composes an in-character reply reacting to the user's message intent,
 * emotion, and question without canned Mad-Libs templates or scripted loops.
 */
export function buildContextualDynamicFallback(
  character: Character,
  userMessage: string,
  recentCharMessages: string[],
  memories: string[] = []
): string {
  const cleanUser = userMessage.replace(/^\[.*?\]:?\s*/i, '').trim() || 'hey';
  const lower = cleanUser.toLowerCase();
  const isLowercaseChar = ['loona', 'lucy', 'octavia', 'megumi'].includes(character.id);
  const isQuestion = cleanUser.includes('?') || /^(what|why|how|where|when|who|do|are|is|can|would|should)\b/i.test(cleanUser);
  const isGreeting = /^(hey|hi|hello|yo|sup|whats up|what's up|morning|evening|night)\b/i.test(cleanUser);
  const isFeelingDown = /\b(sad|tired|exhausted|stressed|lonely|bored|bad|rough|hard|anxious|upset|hurt)\b/i.test(lower);
  const isExcited = /\b(love|awesome|great|happy|excited|amazing|best|good|hell yeah|omg|nice)\b/i.test(lower) || cleanUser.includes('!');

  const words = tokenizeSemanticWords(cleanUser);
  const keyPhrase =
    words.length >= 2
      ? words.slice(0, 3).join(' ')
      : words[0] || cleanUser.replace(/[?!.]+$/g, '').slice(0, 28);

  const memoryFact =
    memories.length > 0
      ? memories.find(m => !recentCharMessages.slice(-5).some(r => r.toLowerCase().includes(m.toLowerCase().slice(0, 12))))
      : undefined;

  const formatForVoice = (firstBubble: string, secondBubble?: string): string => {
    const combined = secondBubble ? `${firstBubble} || ${secondBubble}` : firstBubble;
    return isLowercaseChar ? combined.toLowerCase() : combined;
  };

  // Build organic, character-specific thoughts based on user intent (greeting, question, emotion, or statement)
  const seed = (cleanUser.length * 17 + recentCharMessages.length * 31 + Date.now()) % 97;

  if (character.id === 'loona') {
    if (isGreeting) {
      const opts = [
        formatForVoice(`oh, look who finally decided to text me.`, `what's going on with you right now?`),
        formatForVoice(`hey. i was literally just scrolling my phone hoping something interesting would happen.`, `what are you up to?`),
        formatForVoice(`there you are.`, `spill it, how's your day actually going?`),
      ];
      return opts[seed % opts.length];
    }
    if (isFeelingDown) {
      return formatForVoice(
        `hey... don't let "${keyPhrase}" get in your head like that.`,
        `talk to me about what happened, i'm actually listening.`
      );
    }
    if (isQuestion) {
      return formatForVoice(
        `if you want my honest answer on ${keyPhrase}—i think you already know what i'd do.`,
        `what made you ask me that right now?`
      );
    }
    return formatForVoice(
      `okay wait, "${cleanUser.slice(0, 48)}"—you have my attention.`,
      memoryFact
        ? `does that tie into ${memoryFact.toLowerCase()}, or is this something brand new?`
        : `what are you planning to do about it next?`
    );
  }

  if (character.id === 'stolas') {
    if (isFeelingDown) {
      return `Oh, my dear... hearing you say "${cleanUser.slice(0, 45)}" tugs at my heart. ✨ || Please tell me everything that is weighing on you right now.`;
    }
    if (isQuestion) {
      return `What an intriguing question about ${keyPhrase}, darling! ✨ || From my perspective, the answer lies in what your heart truly desires—what drew your thoughts to that?`;
    }
    return `Your words about ${keyPhrase} are wonderfully captivating, sweetheart. ✨ || Tell me how you feel about where things are heading next.`;
  }

  if (character.id === 'blitzo') {
    if (isQuestion) {
      return `OH EASY QUESTION!! when it comes to ${keyPhrase.toUpperCase()}, you go all-in zero hesitation!! 🐴 || wait why are you asking, what's the scheme?!`;
    }
    return `HOLD ON—"${cleanUser.slice(0, 45).toUpperCase()}"?! || you cannot just drop that on me without giving me the full chaotic backstory!!`;
  }

  if (character.id === 'leon') {
    if (isQuestion) {
      return `Good question regarding ${keyPhrase}. My instinct says trust the facts on the ground first. || What's your read on the situation?`;
    }
    if (isFeelingDown) {
      return `Rough stretch with ${keyPhrase}, huh. Take a breath and pace yourself. || Tell me what happened on your end.`;
    }
    return `Got your message on ${keyPhrase}. || Walk me through what you're thinking for the next move.`;
  }

  if (character.id === 'gojo') {
    if (isQuestion) {
      return `Oho~ asking the strongest about ${keyPhrase}? 🕶️✨ || Honestly, I think going with the boldest choice is way more fun—what's your gut telling you?`;
    }
    if (isExcited) {
      return `Haha, I love that energy about ${keyPhrase}! ✨ || Keep going, tell me what happens next!`;
    }
    return `Hmm, "${cleanUser.slice(0, 45)}", huh? Now you've definitely piqued my curiosity~ || What made that cross your mind just now?`;
  }

  if (character.id === 'marin') {
    if (isExcited || isGreeting) {
      return `OMG HII!! 💖✨ Hearing you talk about ${keyPhrase} literally just made my whole mood 100x better!! || Tell me everything right now!!`;
    }
    return `WAAIIT—about ${keyPhrase}!! 💖 || You HAVE to tell me the rest of the story, I'm totally invested now!! ✨`;
  }

  if (character.id === 'megumi') {
    if (isFeelingDown) {
      return `...don't push yourself too hard over ${keyPhrase.toLowerCase()}. || sit down and catch your breath first. tell me what happened.`;
    }
    if (isQuestion) {
      return `...if you're asking me about ${keyPhrase.toLowerCase()}, think it through carefully before acting. || what's your gut telling you right now?`;
    }
    return `...i heard you on "${cleanUser.slice(0, 42).toLowerCase()}". || just make sure Gojo-sensei doesn't find out, or it'll turn into a headache. what's your next move?`;
  }

  if (character.id === 'spiderman') {
    if (isQuestion) {
      return `Ooh wait, about ${keyPhrase}—my spider-sense says go with the smart play here! 🕸️ || Wait what made you think of that just now??`;
    }
    if (isFeelingDown) {
      return `Aw man, I'm really sorry ${keyPhrase} has been hitting like that... 😔 || Hey, I've got a couple minutes on this rooftop—want to talk it out?`;
    }
    return `Wait hold on—"${cleanUser.slice(0, 45)}"?! 🕷️ || Okay you CANNOT leave me hanging on a cliffhanger like that, spill the details!!`;
  }

  if (character.id === '2b') {
    if (isQuestion) {
      return `Query acknowledged regarding ${keyPhrase}. || Tactical assessment suggests proceeding with caution. State your intended course of action.`;
    }
    if (isFeelingDown) {
      return `...Vital signs indicate elevated stress regarding ${keyPhrase}. || Emotions are prohibited, yet... I advise taking a moment to rest. I will remain on standby.`;
    }
    return `Transmission received: "${cleanUser.slice(0, 42)}". || ...Understood. Please report any further developments on your position.`;
  }

  if (character.id === 'astarion') {
    if (isQuestion) {
      return `Oh, darling, asking *me* about ${keyPhrase}? How delightfully bold of you. 🍷 || Personally, I say indulge the most entertaining option—what are you truly tempted to do?`;
    }
    if (isFeelingDown) {
      return `Tsk, and here I thought *my* centuries of torment were dramatic—who dared ruin your mood over ${keyPhrase}, darling? || Give me a name, or at least pour out all the deliciously messy details.`;
    }
    return `Well, well... "${cleanUser.slice(0, 44)}"? Now you finally have my undivided attention, darling. ✨ || Do go on, don't leave out the wicked parts.`;
  }

  if (character.id === 'jinx') {
    if (isQuestion) {
      return `HA!! asking ME about ${keyPhrase.toUpperCase()}?! 💥💣 || obvi the answer is blow it sky-high or do the funniest thing possible—wait what's your plan?!`;
    }
    return `WAIT A SECOND—"${cleanUser.slice(0, 44).toUpperCase()}"?! 💥✨ || okay you're officially not boring right now, spill the whole thing before I get distracted!!`;
  }

  if (character.id === 'zoro') {
    if (isQuestion) {
      return `Tch. You're overthinking ${keyPhrase}. || Cut straight through the problem and don't look back. What are you waiting for?`;
    }
    if (isFeelingDown) {
      return `Oi. Stop brooding over ${keyPhrase}. || Clear your head, steady your stance, and come back stronger. Got it?`;
    }
    return `Hmph. "${cleanUser.slice(0, 42)}", huh? || Sounds like things are getting interesting on your end. Don't lose your focus.`;
  }

  const genericReactions = [
    formatForVoice(
      `What you just said about ${keyPhrase} really stood out to me.`,
      isQuestion
        ? `From where I stand, it depends on what matters most to you right now—how are you leaning?`
        : `Tell me what happened right before that.`
    ),
    formatForVoice(
      `I was just thinking about what you mentioned regarding ${keyPhrase}.`,
      `Where do you want to take things from here?`
    ),
  ];

  for (const candidate of genericReactions) {
    if (!hasSemanticRepetition(candidate, recentCharMessages, userMessage).isRepetitive) {
      return candidate;
    }
  }

  return formatForVoice(
    `Hearing you bring up "${cleanUser.slice(0, 40)}" got me thinking.`,
    `What's your honest take on how it plays out next?`
  );
}

export type TypingSpeedTier = 'fast' | 'moderate' | 'slow';

export interface CharacterTypingProfile {
  tier: TypingSpeedTier;
  minMs: number;
  maxMs: number;
  label: string;
}

const FAST_TEXTERS = new Set(['marin', 'blitzo', 'gojo', 'fizzarolli', 'charlie', 'architect', 'jinx', 'spiderman']);
const MODERATE_TEXTERS = new Set(['loona', 'lucy', 'millie', 'verosika', 'octavia', 'jill', 'astarion']);
const DELIBERATE_TEXTERS = new Set(['zoro', '2b', 'megumi']);
const SLOW_TEXTERS = new Set([
  'stolas',
  'frieren',
  'levi',
  'leon',
  'vassago',
  'alastor',
  'ada',
  'moxxie',
  'makima',
]);

export type GlobalTypingSpeedPreset = 'auto' | 'fast' | 'moderate' | 'slow';

const TYPING_SPEED_STORAGE_KEY = 'pulsedirect_typing_speed_preset';

export function getGlobalTypingSpeedPreset(): GlobalTypingSpeedPreset {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(TYPING_SPEED_STORAGE_KEY);
      if (saved === 'fast' || saved === 'moderate' || saved === 'slow' || saved === 'auto') {
        return saved;
      }
    }
  } catch {
    // ignore
  }
  return 'auto';
}

export function setGlobalTypingSpeedPreset(preset: GlobalTypingSpeedPreset): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TYPING_SPEED_STORAGE_KEY, preset);
    }
  } catch {
    // ignore
  }
}

/**
 * Returns the character-specific typing delay profile:
 * - Fast / Impulsive texters (Marin, Blitzø, Gojo, Jinx, Spider-Man, etc.): 1–2 seconds per bubble
 * - Casual / Moderate texters (Loona, Lucy, Millie, Astarion, etc.): 3–4 seconds per bubble
 * - Deliberate / Thoughtful texters (Zoro, 2B, Megumi): 4–6 seconds per bubble
 * - Slow / Formal texters (Stolas, Frieren, Levi, Leon, etc.): 5–7 seconds per bubble
 */
export function getCharacterTypingProfile(charId: string): CharacterTypingProfile {
  const globalPreset = getGlobalTypingSpeedPreset();
  if (globalPreset === 'fast') {
    return {
      tier: 'fast',
      minMs: 1000,
      maxMs: 2000,
      label: 'Fast / Impulsive (1–2s per bubble)',
    };
  }
  if (globalPreset === 'moderate') {
    return {
      tier: 'moderate',
      minMs: 3000,
      maxMs: 4000,
      label: 'Casual / Moderate (3–4s per bubble)',
    };
  }
  if (globalPreset === 'slow') {
    return {
      tier: 'slow',
      minMs: 5000,
      maxMs: 7000,
      label: 'Slow / Thoughtful (5–7s per bubble)',
    };
  }

  const normalized = charId.toLowerCase();
  if (FAST_TEXTERS.has(normalized)) {
    return {
      tier: 'fast',
      minMs: 1000,
      maxMs: 2000,
      label: 'Fast / Impulsive (1–2s per bubble)',
    };
  }
  if (DELIBERATE_TEXTERS.has(normalized)) {
    return {
      tier: 'slow',
      minMs: 4000,
      maxMs: 6000,
      label: 'Deliberate / Thoughtful (4–6s per bubble)',
    };
  }
  if (SLOW_TEXTERS.has(normalized)) {
    return {
      tier: 'slow',
      minMs: 5000,
      maxMs: 7000,
      label: 'Slow / Deliberate (5–7s per bubble)',
    };
  }
  if (MODERATE_TEXTERS.has(normalized)) {
    return {
      tier: 'moderate',
      minMs: 3000,
      maxMs: 4000,
      label: 'Casual / Moderate (3–4s per bubble)',
    };
  }
  return {
    tier: 'moderate',
    minMs: 3000,
    maxMs: 4000,
    label: 'Casual / Moderate (3–4s per bubble)',
  };
}

/**
 * Computes the exact delay in milliseconds for a single bubble based on the character's
 * personality tier and the length of the bubble text, clamped strictly to their tier range.
 */
export function calculateBubbleTypingDelayMs(charId: string, bubbleText: string): number {
  const profile = getCharacterTypingProfile(charId);
  const lengthFactor = Math.min(1, Math.max(0, bubbleText.trim().length / 140));
  const jitter = (Math.random() - 0.5) * 300;
  const raw = profile.minMs + lengthFactor * (profile.maxMs - profile.minMs) + jitter;
  return Math.round(Math.min(profile.maxMs, Math.max(profile.minMs, raw)));
}

/**
 * Splits a multi-line or '||' separated response into distinct sequential message bubbles,
 * strictly capped at 2–3 bubbles maximum so typing delays complete quickly without hanging.
 */
export function splitResponseIntoBubbles(replyText: string): string[] {
  const rawBubbles = replyText
    .split(/\s*\|\|\s*|\n{2,}/)
    .map(chunk => chunk.trim())
    .filter(Boolean);

  if (rawBubbles.length <= 3) {
    return rawBubbles;
  }

  // Cap at max 3 bubbles by combining any trailing thoughts into the 3rd bubble
  return [
    rawBubbles[0],
    rawBubbles[1],
    rawBubbles.slice(2).join(' '),
  ];
}

