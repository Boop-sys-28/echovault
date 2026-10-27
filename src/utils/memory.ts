/**
 * Character Episodic Memory System
 * Stores, extracts, and recalls key facts about the user across conversations.
 * Strictly filters out internal system metadata strings so they are never stored or quoted.
 */

const STORAGE_PREFIX = 'pulsedirect_memory_';
export const MAX_ACTIVE_MEMORIES = 75;

function isInternalSystemFact(fact: string): boolean {
  const lower = fact.toLowerCase();
  return (
    lower.includes('transmission handle is') ||
    lower.includes('operative_') ||
    lower.startsWith('shared: "') ||
    lower.startsWith('user explicitly asked to remember:')
  );
}

export function getCharacterMemories(charId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${charId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const list: string[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.facts)
        ? parsed.facts
        : [];
      return list
        .map(f => String(f).trim())
        .filter(f => f.length > 0 && !isInternalSystemFact(f))
        .slice(0, MAX_ACTIVE_MEMORIES);
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

export function saveCharacterMemories(charId: string, facts: string[]): void {
  try {
    const cleanFacts = Array.from(
      new Set(
        facts
          .map(f => f.trim())
          .filter(f => f.length > 0 && !isInternalSystemFact(f))
      )
    ).slice(0, MAX_ACTIVE_MEMORIES);
    localStorage.setItem(`${STORAGE_PREFIX}${charId}`, JSON.stringify(cleanFacts));
  } catch {
    // quota
  }
}

export function addCharacterMemory(charId: string, newFact: string): string[] {
  const current = getCharacterMemories(charId);
  const trimmed = newFact.trim();
  if (
    !trimmed ||
    isInternalSystemFact(trimmed) ||
    current.some(f => f.toLowerCase() === trimmed.toLowerCase())
  ) {
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
 * Notes down genuine user-stated facts (names, pets, favorite foods, hobbies)
 * without ever injecting internal system handles or metadata strings.
 */
export function extractFactsFromUserMessage(text: string, _userCodename?: string): string[] {
  const extracted: string[] = [];
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Explicit name introduction by user in chat
  const nameMatch = clean.match(/(?:my name is|call me)\s+([A-Za-z0-9_-]{2,20})/i);
  if (
    nameMatch &&
    ![
      'tired',
      'sleepy',
      'bored',
      'fine',
      'good',
      'okay',
      'back',
      'here',
      'going',
      'eating',
      'late',
      'ready',
    ].includes(nameMatch[1].toLowerCase())
  ) {
    extracted.push(`Preferred name is ${nameMatch[1]}`);
  }

  // Favorites & Food
  const foodMatch = lower.match(
    /(?:i love|i like|i really like|craving|eating|my favorite food is|my favorite drink is)\s+(ramen|coffee|crepes|sweets|mochi|sushi|pizza|tea|boba|chocolate|ice cream|burgers|tacos|pasta|matcha)/i
  );
  if (foodMatch && foodMatch[1]) {
    extracted.push(`Likes ${foodMatch[1]}`);
  }

  // Pets & Animals
  const petMatch = clean.match(
    /(?:i have a|got a|my)\s+(cat|dog|puppy|kitten|bird|bunny|pet)(?:\s+named\s+([A-Za-z0-9_-]+))?/i
  );
  if (petMatch) {
    if (petMatch[2]) {
      extracted.push(`Has a ${petMatch[1]} named ${petMatch[2]}`);
    } else {
      extracted.push(`Has a ${petMatch[1]}`);
    }
  }

  // Sleep habits & Work
  if (
    lower.includes("can't sleep") ||
    lower.includes('insomnia') ||
    lower.includes('awake at') ||
    lower.includes('sleep schedule')
  ) {
    extracted.push('Often stays up late or has trouble sleeping');
  }
  if (lower.match(/(?:wake up early|exam tomorrow|work tomorrow|early meeting|test tomorrow)/i)) {
    extracted.push('Has an early morning schedule or upcoming exam/shift');
  }

  // Hobbies & Skills
  const hobby = lower.match(/(?:i play|i practice|i train in|learning)\s+([A-Za-z\s]{3,25})/i);
  if (hobby && hobby[1]) {
    extracted.push(`Enjoys ${hobby[1].trim()}`);
  }

  return extracted;
}
