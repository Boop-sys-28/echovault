/**
 * Character Episodic Memory System
 * Stores, extracts, and recalls key facts about the user across conversations.
 */

const STORAGE_PREFIX = 'pulsedirect_memory_';
export const MAX_ACTIVE_MEMORIES = 75;

export function getCharacterMemories(charId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${charId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_ACTIVE_MEMORIES);
      if (Array.isArray(parsed.facts)) return parsed.facts.slice(0, MAX_ACTIVE_MEMORIES);
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveCharacterMemories(charId: string, facts: string[]): void {
  try {
    const cleanFacts = Array.from(new Set(facts.map(f => f.trim()).filter(Boolean))).slice(
      0,
      MAX_ACTIVE_MEMORIES
    );
    localStorage.setItem(`${STORAGE_PREFIX}${charId}`, JSON.stringify(cleanFacts));
  } catch {
    // quota
  }
}

export function addCharacterMemory(charId: string, newFact: string): string[] {
  const current = getCharacterMemories(charId);
  const trimmed = newFact.trim();
  if (!trimmed || current.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }
  const updated = [trimmed, ...current].slice(0, MAX_ACTIVE_MEMORIES);
  saveCharacterMemories(charId, updated);
  return updated;
}

export function removeCharacterMemory(charId: string, index: number): string[] {
  const current = getCharacterMemories(charId);
  const updated = current.filter((_, idx) => idx !== index);
  saveCharacterMemories(charId, updated);
  return updated;
}

export function clearCharacterMemories(charId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${charId}`);
  } catch {
    // ignore
  }
}

export function getAllCharactersMemories(charIds: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const id of charIds) {
    const facts = getCharacterMemories(id);
    if (facts.length > 0) {
      result[id] = facts;
    }
  }
  return result;
}

export function clearAllCharactersMemories(charIds: string[]): void {
  try {
    for (const id of charIds) {
      localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * Intelligent client-side fact extraction from user messages.
 * Automatically notes down preferences, sleep schedules, names, pets, and secrets.
 */
export function extractFactsFromUserMessage(text: string, userCodename?: string): string[] {
  const extracted: string[] = [];
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Name / Identity
  const nameMatch = clean.match(/(?:my name is|call me|i am|i'm)\s+([A-Za-z0-9_-]{2,20})/i);
  if (nameMatch && !['tired', 'sleepy', 'bored', 'fine', 'good', 'okay', 'back', 'here', 'going', 'eating'].includes(nameMatch[1].toLowerCase())) {
    extracted.push(`User goes by the name or alias "${nameMatch[1]}"`);
  } else if (userCodename && userCodename !== 'Anonymous' && userCodename !== 'Ghost') {
    extracted.push(`User's transmission handle is "${userCodename}"`);
  }

  // Favorites & Food
  if (lower.includes('my favorite food') || lower.includes('favorite drink')) {
    extracted.push(`Shared: "${clean.slice(0, 80)}"`);
  } else if (lower.match(/(?:i love|i like|i really like|craving|eating)\s+(ramen|coffee|crepes|sweets|mochi|sushi|pizza|tea|boba|chocolate|ice cream|burgers)/i)) {
    const itemMatch = lower.match(/(ramen|coffee|crepes|sweets|mochi|sushi|pizza|tea|boba|chocolate|ice cream|burgers)/i);
    if (itemMatch) {
      extracted.push(`Loves or frequently craves ${itemMatch[1]}`);
    }
  }

  // Pets & Animals
  const petMatch = clean.match(/(?:i have a|got a|my)\s+(cat|dog|puppy|kitten|bird|bunny|pet)(?:\s+named\s+([A-Za-z0-9_-]+))?/i);
  if (petMatch) {
    if (petMatch[2]) {
      extracted.push(`Has a ${petMatch[1]} named ${petMatch[2]}`);
    } else {
      extracted.push(`Has a ${petMatch[1]}`);
    }
  }

  // Sleep habits & Work
  if (lower.includes("can't sleep") || lower.includes("insomnia") || lower.includes("awake at") || lower.includes("sleep schedule")) {
    extracted.push("Struggles with late-night sleep schedule or insomnia");
  }
  if (lower.match(/(?:wake up early|exam tomorrow|work tomorrow|early meeting|test tomorrow)/i)) {
    extracted.push("Has an early morning commitment or test coming up");
  }

  // Hobbies & Skills
  if (lower.match(/(?:i play|i practice|i train in|learning)\s+([A-Za-z\s]{3,25})/i)) {
    const hobby = lower.match(/(?:i play|i practice|i train in|learning)\s+([A-Za-z\s]{3,25})/i);
    if (hobby && hobby[1]) {
      extracted.push(`Practices or enjoys: ${hobby[1].trim()}`);
    }
  }

  // Explicit user memory cue: "remember that ...", "don't forget ...", "keep in mind ..."
  const explicit = clean.match(/(?:remember that|don't forget that|keep in mind that|note that)\s+(.+)/i);
  if (explicit && explicit[1]) {
    extracted.push(`User explicitly asked to remember: "${explicit[1].trim().slice(0, 100)}"`);
  }

  return extracted;
}

/**
 * Injects memory context into smart offline simulation dialogue.
 */
export function getPersonalityMemoryCallback(charId: string, memory: string): string {
  switch (charId) {
    case 'gojo':
      return `Wait a second, kid... I remember you told me that ${memory.toLowerCase()}. Don't think the strongest forgets anything~ 🕶️✨ || So what's the update on that?`;
    case 'lucy':
      return `...still thinking about what you told me earlier about ${memory.toLowerCase()}. don't let it get you killed out here.`;
    case 'marin':
      return `WAITTTTT A MINUTE!! 💖 You mentioned earlier that ${memory.toLowerCase()}!! OMGGG I literally haven't stopped thinking about it!! ✨ Tell me everything!!`;
    case 'frieren':
      return `I recall you mentioned earlier that ${memory.toLowerCase()}... It reminds me of something Himmel once said during our travels.`;
    case 'levi':
      return `I remember you said ${memory.toLowerCase()}. Did you take care of it yet, or are you still slacking off? Clean up your mess.`;
    case 'makima':
      return `I haven't forgotten what you told me about ${memory.toLowerCase()}. I keep careful note of the things you share with me.`;
    case 'loona':
      return `u told me earlier that ${memory.toLowerCase()}... whatever. not like i was paying attention or care. || just make sure u don't do something stupid.`;
    case 'leon':
      return `Keep in mind what you told me earlier about ${memory.toLowerCase()}. In this line of work, staying consistent keeps you alive.`;
    case 'stolas':
      return `My sweet dear, my mind drifted back to what you confided in me: that ${memory.toLowerCase()}. Such gentle thoughts carry me through lonely nights. ✨`;
    case 'blitzo':
      return `WAIT HOLD ON!! Didn't you tell me ${memory.toLowerCase()}?! Because if that's true I have TWELVE questions and three of them involve horses!! 🐴💥`;
    default:
      return `I still remember what you told me earlier about ${memory.toLowerCase()}. How is that going for you?`;
  }
}
