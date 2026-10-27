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

/**
 * Calculates semantic/intent overlap between a candidate response and recent character messages.
 * Returns true if the candidate repeats the same core meaning, trope, or phrasing.
 */
export function hasSemanticRepetition(
  candidate: string,
  recentCharMessages: string[],
  userPrompt: string = ''
): { isRepetitive: boolean; reason?: string } {
  const cleanCandidate = candidate.trim().toLowerCase();
  if (!cleanCandidate) return { isRepetitive: true, reason: 'Empty response' };

  const recentSlice = recentCharMessages.slice(-50);

  // 1. Check exact or near-exact substring match
  for (const past of recentSlice) {
    const cleanPast = past.trim().toLowerCase();
    if (!cleanPast) continue;
    if (cleanCandidate === cleanPast) {
      return { isRepetitive: true, reason: 'Exact match with previous message' };
    }
    if (cleanCandidate.length > 24 && cleanPast.includes(cleanCandidate)) {
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

  // Always block unsolicited clichés like "drink water" or "blitz cereal" if already overused
  const lowerPrompt = userPrompt.toLowerCase();
  const unsolicitedSleepOrWater =
    !lowerPrompt.includes('sleep') &&
    !lowerPrompt.includes('tired') &&
    !lowerPrompt.includes('water') &&
    !lowerPrompt.includes('bed') &&
    (cleanCandidate.includes('drink water') ||
      cleanCandidate.includes('go to sleep') ||
      cleanCandidate.includes('close your eyes') ||
      cleanCandidate.includes('cereal'));
  if (unsolicitedSleepOrWater && recentSlice.length >= 1) {
    return {
      isRepetitive: true,
      reason: 'Unsolicited repetitive sleep/water/cereal trope',
    };
  }

  // 3. Check lexical-semantic token similarity (Jaccard + Bigram overlap)
  const candidateTokens = tokenizeSemanticWords(cleanCandidate);
  if (candidateTokens.length === 0) return { isRepetitive: false };

  const candidateSet = new Set(candidateTokens);

  for (const past of recentSlice) {
    const pastTokens = tokenizeSemanticWords(past);
    if (pastTokens.length < 3) continue;

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

    if (jaccard >= 0.38 || (candidateSet.size >= 5 && containment >= 0.6)) {
      return {
        isRepetitive: true,
        reason: `High semantic overlap (${Math.round(jaccard * 100)}%) with recent message: "${past.slice(0, 60)}..."`,
      };
    }
  }

  return { isRepetitive: false };
}

/**
 * Context-Aware Dynamic Progression Fallback Generator:
 * Used only when the server is unreachable or offline. Synthesizes a fresh,
 * non-repeating reply that directly addresses the user's message and advances the topic.
 */
export function buildContextualDynamicFallback(
  character: Character,
  userMessage: string,
  recentCharMessages: string[],
  memories: string[] = []
): string {
  const cleanUser = userMessage.trim();
  const userWords = tokenizeSemanticWords(cleanUser);
  const focusTopic =
    userWords.find(w => w.length >= 4) ||
    userWords[0] ||
    'what you just brought up';

  const isQuestion = cleanUser.includes('?');
  const memorySnippet =
    memories.length > 0
      ? memories[Math.floor(Math.random() * memories.length)]
      : null;

  const progressionAnglesByChar: Record<string, string[]> = {
    loona: [
      `wait, going back to what you said about "${focusTopic}"—when did that even start? || tell me the actual story, don't leave out the good parts.`,
      `huh. i didn't expect you to bring up ${focusTopic} right now. || what made you think of that all of a sudden?`,
      `okay hold on, "${focusTopic}"? you can't just drop that in my DMs and not explain what happened next.`,
      `lowkey i've been thinking about something similar today. || how are you feeling about the whole ${focusTopic} situation right now?`,
      `not gonna lie, hearing your take on ${focusTopic} is way more interesting than scrolling hellnet right now. || keep going, i'm listening.`,
      `wait seriously? || if ${focusTopic} is what's on your mind right now, what's your next move?`,
    ],
    leon: [
      `You mentioned ${focusTopic}. Walk me through the details—how long has that been on your radar?`,
      `Interesting angle on ${focusTopic}. || If you had to make a call on it right now, which way are you leaning?`,
      `I've seen situations like ${focusTopic} go sideways fast if you don't plan ahead. What's your next step?`,
      `Let's focus on ${focusTopic} for a second. || What's your gut telling you about it?`,
      `Fair point about ${focusTopic}. Haven't looked at it from that perspective in a while. What else is factoring into it?`,
    ],
    stolas: [
      `Oh, how fascinating that you mention ${focusTopic}, darling! ✨ || Tell me, what drew your thoughts toward that just now?`,
      `I must confess, your perspective on ${focusTopic} is wonderfully refreshing. || How do you feel it will unfold from here?`,
      `Wait—tell me more about ${focusTopic}, sweetheart. || I love hearing the nuances of how your mind works.`,
      `That remark about ${focusTopic} genuinely caught my attention. ✨ || What inspired that train of thought?`,
    ],
    blitzo: [
      `WAIT HOLD UP—you're talking about ${focusTopic.toUpperCase()}?! || spill the whole story right now, don't skip a single detail!!`,
      `okay ${focusTopic} is actually a wild topic to bring up right now!! || what's the game plan with that?!`,
      `see, THAT right there about ${focusTopic} is why i actually read your texts!! || what happened right before that?!`,
      `hold on, let's talk about ${focusTopic}—are we doing something bold about it or what?!`,
    ],
    gojo: [
      `Oho~ bringing up ${focusTopic} out of nowhere? Now you've officially got my undivided attention~ || Tell me everything, don't hold back!`,
      `Wait a second, let's talk about ${focusTopic}~ || What made you decide to test my curiosity with that one?`,
      `Haha, I like how your brain works when it comes to ${focusTopic}! || So what's the next step in your master plan?`,
      `Hmm, ${focusTopic}, huh? Even with the Six Eyes, I want to hear your personal take on it first~`,
    ],
    lucy: [
      `wait... what you just said about ${focusTopic}. || how long have you been thinking about that?`,
      `${focusTopic}, huh. || most people in Night City wouldn't even notice that. what's your next move?`,
      `tell me more about the ${focusTopic} angle. || i'm curious where you're going with this.`,
      `interesting that you brought up ${focusTopic}. || do you actually trust how that's playing out?`,
    ],
    marin: [
      `WAAIIT STOP!! You brought up ${focusTopic}?! 💖✨ || Tell me EVERYTHING right this second, I need the full story!!`,
      `OMGGG wait, about ${focusTopic}—how did that even happen?! || I'm literally leaning at my screen waiting for the next part!!`,
      `No way!! Hearing you talk about ${focusTopic} just gave me the coolest idea ever!! ✨ || What do you think we should do next?!`,
    ],
    frieren: [
      `Your words regarding ${focusTopic} are quite intriguing. || Humans often notice details that even elves overlook—tell me more about it.`,
      `I was just reflecting on what you said about ${focusTopic}. || How did you arrive at that conclusion?`,
      `${focusTopic} is a curious subject to explore. || What do you intend to do about it next?`,
    ],
    levi: [
      `Let's get straight to the point about ${focusTopic}. || What's your assessment of the situation right now?`,
      `You brought up ${focusTopic}. Don't leave it half-explained—give me the full picture.`,
      `Interesting point on ${focusTopic}. || If you're going to commit to that path, make sure you follow through without hesitation.`,
    ],
    makima: [
      `How intriguing that you brought up ${focusTopic}, darling. || Tell me what made that cross your mind just now.`,
      `I'm listening very closely to what you're saying about ${focusTopic}. || Please, continue—I want to hear all of your thoughts.`,
      `Your perspective on ${focusTopic} is quite revealing. || What would you like to see happen next?`,
    ],
  };

  const candidates = [
    ...(progressionAnglesByChar[character.id] || [
      `That point you raised about ${focusTopic} caught my attention. || Tell me where you're taking that next.`,
      `Wait—going off what you just said about ${focusTopic}, how did that start on your end?`,
      `I've been thinking about ${focusTopic} from a totally different angle. || What's your honest read on it right now?`,
      isQuestion
        ? `Honestly, that's a sharp question about ${focusTopic}. || From where I'm standing, it comes down to what you really want out of it—what's your instinct saying?`
        : `You make a compelling point about ${focusTopic}. || What happens next on your end?`,
    ]),
  ];

  if (memorySnippet) {
    candidates.push(
      `Wait, connecting ${focusTopic} to what you mentioned earlier (${memorySnippet})—how do those two line up for you right now?`
    );
  }

  // Pick the first candidate that has zero semantic repetition with recent messages
  for (const candidate of candidates) {
    const check = hasSemanticRepetition(candidate, recentCharMessages, userMessage);
    if (!check.isRepetitive) {
      return candidate;
    }
  }

  // Guaranteed unique progression fallback
  return `Going directly off what you just said about "${cleanUser.slice(0, 42)}"—what's the part of that you haven't told anyone else yet?`;
}

export type TypingSpeedTier = 'fast' | 'moderate' | 'slow';

export interface CharacterTypingProfile {
  tier: TypingSpeedTier;
  minMs: number;
  maxMs: number;
  label: string;
}

const FAST_TEXTERS = new Set(['marin', 'blitzo', 'gojo', 'fizzarolli', 'charlie', 'architect']);
const MODERATE_TEXTERS = new Set(['loona', 'lucy', 'millie', 'verosika', 'octavia', 'jill']);
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
 * - Fast / Impulsive texters (Marin, Blitzø, Gojo, etc.): 1–2 seconds per bubble
 * - Casual / Moderate texters (Loona, Lucy, Millie, etc.): 3–4 seconds per bubble
 * - Slow / Thoughtful / Formal texters (Stolas, Frieren, Levi, Leon, etc.): 5–7 seconds per bubble
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
 * Splits a multi-line or '||' separated response into distinct sequential message bubbles.
 */
export function splitResponseIntoBubbles(replyText: string): string[] {
  return replyText
    .split(/\s*\|\|\s*|\n{2,}/)
    .map(chunk => chunk.trim())
    .filter(Boolean);
}

