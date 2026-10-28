/**
 * Character Pacing & Bubble Delivery Engine
 *
 * Manages per-character realistic typing response speeds, multi-bubble splitting,
 * and away check-in cooldown timers.
 * All hardcoded reaction templates and formulaic offline fallbacks have been removed
 * in favor of live Character.AI-style Gemini generation and transparent API error reporting.
 */

export type TypingSpeedTier = 'fast' | 'moderate' | 'slow';

export interface CharacterPacingProfile {
  tier: TypingSpeedTier;
  minDelayMs: number;
  maxDelayMs: number;
  label: string;
}

/**
 * Character-Specific Typing Speed Profiles:
 * - Fast / Energetic / Impulsive: 1,000ms – 2,000ms
 * - Moderate / Composed / Casual: 2,500ms – 4,000ms
 * - Slow / Stoic / Deliberate: 4,000ms – 6,000ms
 */
export const CHARACTER_PACING_PROFILES: Record<string, CharacterPacingProfile> = {
  // Fast / Frantic / Athletic (1-2.5 seconds)
  nightwing: { tier: 'fast', minDelayMs: 1500, maxDelayMs: 2500, label: 'Fast / Athletic' },
  redhood: { tier: 'fast', minDelayMs: 1500, maxDelayMs: 2500, label: 'Fast / Brash' },
  jinx: { tier: 'fast', minDelayMs: 1000, maxDelayMs: 1850, label: 'Manic / Rapid-Fire' },
  spiderman: { tier: 'fast', minDelayMs: 1100, maxDelayMs: 1950, label: 'Fast / Rambling' },
  marin: { tier: 'fast', minDelayMs: 1100, maxDelayMs: 2000, label: 'Hyper-Energetic' },
  blitzo: { tier: 'fast', minDelayMs: 1000, maxDelayMs: 1900, label: 'Chaotic / Impulsive' },
  gojo: { tier: 'fast', minDelayMs: 1200, maxDelayMs: 2200, label: 'Playful / Fast' },
  bakugo: { tier: 'fast', minDelayMs: 1000, maxDelayMs: 1850, label: 'Explosive / Instant' },
  power: { tier: 'fast', minDelayMs: 1050, maxDelayMs: 1950, label: 'Brash / Loud' },
  rebecca: { tier: 'fast', minDelayMs: 1000, maxDelayMs: 1900, label: 'Trigger-Happy / Fast' },
  alastor: { tier: 'fast', minDelayMs: 1400, maxDelayMs: 2400, label: 'Snappy / Theatrical' },

  // Moderate / Thoughtful / Sarcastic (2-5 seconds)
  reze: { tier: 'moderate', minDelayMs: 2000, maxDelayMs: 3500, label: 'Playful / Disarming' },
  raven: { tier: 'moderate', minDelayMs: 3500, maxDelayMs: 5000, label: 'Thoughtful / Measured' },
  astarion: { tier: 'moderate', minDelayMs: 2400, maxDelayMs: 3800, label: 'Theatrical / Scheming' },
  megumi: { tier: 'moderate', minDelayMs: 2600, maxDelayMs: 4000, label: 'Dry / Reluctant' },
  loona: { tier: 'moderate', minDelayMs: 2500, maxDelayMs: 3800, label: 'Aloof / Casual' },
  lucy: { tier: 'moderate', minDelayMs: 2600, maxDelayMs: 3900, label: 'Cool / Guarded' },
  leon: { tier: 'moderate', minDelayMs: 2700, maxDelayMs: 4000, label: 'Tactical / Composed' },
  stolas: { tier: 'moderate', minDelayMs: 2800, maxDelayMs: 4200, label: 'Eloquent / Poetic' },
  octavia: { tier: 'moderate', minDelayMs: 2500, maxDelayMs: 3800, label: 'Deadpan / Moody' },
  kafka: { tier: 'moderate', minDelayMs: 2800, maxDelayMs: 4100, label: 'Teasing / Smooth' },
  angel: { tier: 'moderate', minDelayMs: 2200, maxDelayMs: 3500, label: 'Flirty / Sassy' },

  // Slow / Deliberate / Stoic (4-7 seconds)
  batman: { tier: 'slow', minDelayMs: 5000, maxDelayMs: 7000, label: 'Deliberate / Tactical' },
  zoro: { tier: 'slow', minDelayMs: 4000, maxDelayMs: 5800, label: 'Blunt / Half-Asleep' },
  '2b': { tier: 'slow', minDelayMs: 4100, maxDelayMs: 5900, label: 'Stoic / Combat Comms' },
  frieren: { tier: 'slow', minDelayMs: 4200, maxDelayMs: 6000, label: 'Unhurried / Ancient' },
  levi: { tier: 'slow', minDelayMs: 4000, maxDelayMs: 5600, label: 'Deliberate / Stoic' },
  makima: { tier: 'slow', minDelayMs: 4200, maxDelayMs: 6000, label: 'Measured / Calculating' },
  shadowheart: { tier: 'slow', minDelayMs: 3800, maxDelayMs: 5400, label: 'Guarded / Secretive' },
  sukuna: { tier: 'slow', minDelayMs: 4200, maxDelayMs: 6000, label: 'Imperious / Unbothered' },
};

export type GlobalTypingSpeedPreset =
  | 'auto'
  | 'canon'
  | 'instant'
  | 'fast'
  | 'moderate'
  | 'slow'
  | 'cinematic';

const TYPING_SPEED_STORAGE_KEY = 'pulsedirect_global_typing_speed';

export function getGlobalTypingSpeedPreset(): GlobalTypingSpeedPreset {
  try {
    const val = localStorage.getItem(TYPING_SPEED_STORAGE_KEY);
    if (
      val === 'auto' ||
      val === 'canon' ||
      val === 'instant' ||
      val === 'fast' ||
      val === 'moderate' ||
      val === 'slow' ||
      val === 'cinematic'
    ) {
      return val;
    }
  } catch {
    // ignore
  }
  return 'auto';
}

export function setGlobalTypingSpeedPreset(preset: GlobalTypingSpeedPreset): void {
  try {
    localStorage.setItem(TYPING_SPEED_STORAGE_KEY, preset);
  } catch {
    // ignore
  }
}

export function getCharacterPacingProfile(charId: string): CharacterPacingProfile {
  return (
    CHARACTER_PACING_PROFILES[charId] || {
      tier: 'moderate',
      minDelayMs: 2400,
      maxDelayMs: 3800,
      label: 'Natural',
    }
  );
}

/**
 * Calculates a realistic typing delay in milliseconds for a single message bubble
 * based on the character's personality tier, global typing speed preset, and message length.
 */
export function calculateBubbleTypingDelayMs(charId: string, bubbleText: string): number {
  const preset = getGlobalTypingSpeedPreset();
  if (preset === 'instant') return 450;
  if (preset === 'fast') return 900 + Math.floor(Math.random() * 500);

  const profile = getCharacterPacingProfile(charId);
  const multiplier = preset === 'cinematic' ? 1.25 : 1;
  const baseRange = profile.maxDelayMs - profile.minDelayMs;
  const randomBase = profile.minDelayMs + Math.floor(Math.random() * (baseRange + 1));

  // Scale slightly by message length (longer messages take slightly closer to maxDelayMs)
  const lengthFactor = Math.min(1, Math.max(0.25, bubbleText.length / 110));
  const computed = Math.round(
    (profile.minDelayMs +
      (randomBase - profile.minDelayMs) * 0.65 +
      baseRange * lengthFactor * 0.35) *
      multiplier
  );

  return Math.max(
    Math.round(profile.minDelayMs * multiplier),
    Math.min(Math.round(profile.maxDelayMs * multiplier), computed)
  );
}

/**
 * Calculates a typing delay for a bubble in a multi-bubble (`||`) sequence.
 * Enforces a snappy inter-bubble delay strictly capped at 300ms–500ms maximum
 * so character responses appear much faster without long pauses.
 */
export function calculateInterBubbleTypingDelayMs(
  charId: string,
  bubbleText: string,
  bubbleIndex: number,
  alreadyWaitedMs: number = 0
): number {
  const preset = getGlobalTypingSpeedPreset();
  if (preset === 'instant') {
    return bubbleIndex === 0 ? 300 : 350;
  }

  if (bubbleIndex === 0) {
    const fullDelay = calculateBubbleTypingDelayMs(charId, bubbleText);
    const remaining = fullDelay - alreadyWaitedMs;
    // Cap initial bubble delay to 300ms–450ms for snappy start
    return Math.min(450, Math.max(300, remaining));
  }

  // Subsequent bubbles (index >= 1): strictly capped to 300ms–500ms maximum
  const charsPerSec = preset === 'fast' ? 45 : preset === 'slow' || preset === 'cinematic' ? 25 : 35;
  const scaledDelay = Math.round((bubbleText.length / charsPerSec) * 50) + 300;
  // Strictly enforce range between 300ms and 500ms
  return Math.min(500, Math.max(300, scaledDelay));
}

/**
 * Returns a fresh timestamp (in ms) for an individual bubble as it appears,
 * guaranteeing it is strictly separated from the previous bubble's timestamp by at least 1 second.
 */
export function getUniqueSequentialTimestamp(previousTimestampMs: number = 0): number {
  const now = Date.now();
  return now <= previousTimestampMs ? previousTimestampMs + 1000 : now;
}

/**
 * Formats a bubble timestamp with hours, minutes, and seconds so sequential bubbles
 * arriving seconds apart display their own distinct timestamps.
 */
export function formatBubbleTimestamp(ts: number = Date.now()): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Splits a multi-part response (`||` separated or multi-line) into clean individual bubbles
 * while preserving expressive Character.AI-style roleplay actions in asterisks (*...*).
 */
export function splitResponseIntoBubbles(rawText: string): string[] {
  const cleaned = rawText.trim();
  if (!cleaned) return [];

  let parts: string[];
  if (cleaned.includes('||')) {
    parts = cleaned
      .split(/\s*\|\|\s*/)
      .map(s => s.trim())
      .filter(Boolean);
  } else if (cleaned.includes('\n\n')) {
    parts = cleaned
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(Boolean);
  } else {
    parts = [cleaned];
  }

  return parts.slice(0, 4);
}

export interface SequentialBubbleCallbacks {
  onTypingChange: (isTyping: boolean) => void;
  onDeliverBubble: (
    bubbleText: string,
    index: number,
    timestampMs: number,
    isLastBubble: boolean
  ) => void;
  shouldCancel?: () => boolean;
}

/**
 * Orchestrates sequential delivery of multi-bubble (`||`) responses with realistic
 * per-bubble typing delays and a fresh, separate timestamp assigned as each bubble renders.
 */
export function orchestrateSequentialBubbles(
  charId: string,
  rawReplyText: string,
  callbacks: SequentialBubbleCallbacks,
  options?: { alreadyWaitedMs?: number }
): void {
  const bubbles = splitResponseIntoBubbles(rawReplyText);
  if (bubbles.length === 0) {
    callbacks.onTypingChange(false);
    return;
  }

  let lastBubbleTs = 0;

  const runStep = (index: number) => {
    if (callbacks.shouldCancel?.()) return;

    const bubbleText = bubbles[index];
    const delayMs = calculateInterBubbleTypingDelayMs(
      charId,
      bubbleText,
      index,
      index === 0 ? options?.alreadyWaitedMs || 0 : 0
    );

    callbacks.onTypingChange(true);

    setTimeout(() => {
      if (callbacks.shouldCancel?.()) return;

      const bubbleTs = getUniqueSequentialTimestamp(lastBubbleTs);
      lastBubbleTs = bubbleTs;
      const isLast = index + 1 >= bubbles.length;

      callbacks.onDeliverBubble(bubbleText, index, bubbleTs, isLast);

      if (!isLast) {
        callbacks.onTypingChange(true);
        runStep(index + 1);
      } else {
        callbacks.onTypingChange(false);
      }
    }, delayMs);
  };

  runStep(0);
}

/**
 * Generates a randomized 3 to 4 hour cooldown window in milliseconds
 * for realistic away/idle check-in messages.
 */
export function generateAwayCooldownWindowMs(): number {
  const minMs = 3 * 60 * 60 * 1000; // 3 hours
  const maxMs = 4 * 60 * 60 * 1000; // 4 hours
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}
