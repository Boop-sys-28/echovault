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
  if (!charId) return [];
  try {
    const candidateKeys = [
      `${STORAGE_PREFIX}${charId}`,
      `character_memories_${charId}`,
      `memories_${charId}`,
      `cai_memories_${charId}`,
    ];
    const combined: string[] = [];

    for (const key of candidateKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const list: unknown[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.facts)
          ? parsed.facts
          : Array.isArray(parsed?.memories)
          ? parsed.memories
          : [];
        for (const item of list) {
          const str = typeof item === 'string' ? item.trim() : String((item as any)?.fact || (item as any)?.text || '').trim();
          if (str.length > 0 && !isInternalSystemFact(str)) {
            combined.push(str);
          }
        }
      } catch {
        // ignore malformed entry
      }
    }

    return Array.from(new Set(combined)).slice(0, MAX_ACTIVE_MEMORIES);
  } catch {
    // ignore storage errors
  }
  return [];
}

export function getMergedCharacterMemories(charId: string, stateMemories?: string[]): string[] {
  const stored = getCharacterMemories(charId);
  const merged: string[] = [];
  const seenLower = new Set<string>();

  for (const item of [...(stateMemories || []), ...stored]) {
    const trimmed = String(item || '').trim();
    if (!trimmed || isInternalSystemFact(trimmed)) continue;
    const lower = trimmed.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      merged.push(trimmed);
    }
  }

  return merged.slice(0, MAX_ACTIVE_MEMORIES);
}

/**
 * Builds the episodic memory block to be injected directly into the character's systemInstruction.
 */
export function buildMemoryPromptBlock(charId: string, stateMemories?: string[]): string {
  const memories = getMergedCharacterMemories(charId, stateMemories);
  if (memories.length === 0) return '';
  return `\n\n[CHARACTER.AI EPISODIC MEMORY VAULT — ACTIVE RECALL FOR THIS USER]:
You actively remember the following ${memories.length} key facts, personal details, preferences, and shared history about the user from your Memory Vault and conversation history. Keep these facts in mind and weave them naturally into your replies whenever relevant (or when the user asks what you remember about them):
${memories.map((m, idx) => `${idx + 1}. ${m}`).join('\n')}`;
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
 * Notes down genuine user-stated facts (names, pets, favorite foods, hobbies, work, location, memories)
 * without ever injecting internal system handles or metadata strings.
 */
export function extractFactsFromUserMessage(text: string, _userCodename?: string): string[] {
  const extracted: string[] = [];
  const clean = text.trim();
  if (!clean) return extracted;
  const lower = clean.toLowerCase();

  // 1. Explicit "remember that..." or "don't forget..." requests
  const rememberMatch = clean.match(
    /(?:remember that|don't forget that|dont forget that|keep in mind that|please remember)\s+([^.!?]{4,100})/i
  );
  if (rememberMatch && rememberMatch[1]) {
    extracted.push(`User noted: ${rememberMatch[1].trim()}`);
  }

  // 2. Explicit name introduction by user in chat
  const nameMatch = clean.match(/(?:my name is|call me|i'm called|i am called)\s+([A-Za-z0-9_-]{2,22})/i);
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
      'sorry',
      'just',
      'really',
      'very',
      'so',
    ].includes(nameMatch[1].toLowerCase())
  ) {
    extracted.push(`Preferred name is ${nameMatch[1]}`);
  }

  // 3. Explicit favorite things ("my favorite X is Y")
  const favExplicit = clean.match(/my favorite\s+([a-zA-Z\s]{2,20})\s+is\s+([^.,!?]{2,45})/i);
  if (favExplicit && favExplicit[1] && favExplicit[2]) {
    extracted.push(`Favorite ${favExplicit[1].trim().toLowerCase()} is ${favExplicit[2].trim()}`);
  }

  // 4. General likes / loves / cravings / drinks / music
  const foodOrLikeMatch = clean.match(
    /(?:i love|i really like|craving|drinking|eating|listening to|watching)\s+([A-Za-z0-9\s'-]{2,35}?)(?=[.,!?]|$|\s+(?:and|right now|today|tonight|because|while|with))/i
  );
  if (foodOrLikeMatch && foodOrLikeMatch[1]) {
    const item = foodOrLikeMatch[1].trim();
    if (
      item.length >= 3 &&
      !['you', 'this', 'that', 'it', 'him', 'her', 'them', 'nothing', 'something'].includes(item.toLowerCase())
    ) {
      extracted.push(`Enjoys/mentioned ${item}`);
    }
  }

  // 5. Dislikes, fears, & allergies
  const allergyMatch = clean.match(/(?:i'm allergic to|i am allergic to)\s+([^.,!?]{2,35})/i);
  if (allergyMatch && allergyMatch[1]) {
    extracted.push(`Allergic to ${allergyMatch[1].trim()}`);
  }

  const dislikeMatch = clean.match(/(?:i hate|i can't stand|i despise|i'm afraid of|i am afraid of)\s+([^.,!?]{3,35})/i);
  if (dislikeMatch && dislikeMatch[1]) {
    const target = dislikeMatch[1].trim();
    if (!['you', 'this', 'it', 'that'].includes(target.toLowerCase())) {
      extracted.push(`Dislikes or fears ${target}`);
    }
  }

  // 6. Pets & Animals
  const petMatch = clean.match(
    /(?:i have a|got a|my)\s+(cat|dog|puppy|kitten|bird|bunny|rabbit|hamster|snake|ferret|pet)(?:\s+named\s+([A-Za-z0-9_-]+))?/i
  );
  if (petMatch) {
    if (petMatch[2]) {
      extracted.push(`Has a ${petMatch[1].toLowerCase()} named ${petMatch[2]}`);
    } else {
      extracted.push(`Has a ${petMatch[1].toLowerCase()}`);
    }
  }

  // 7. Occupation, major, or project
  const workMatch = clean.match(
    /(?:i work as a|i work as an|i'm a|i am a|working on my|studying)\s+([A-Za-z0-9\s-]{3,35}?)(?=[.,!?]|$|\s+(?:and|at|in|right now|tonight|today))/i
  );
  if (workMatch && workMatch[1]) {
    const role = workMatch[1].trim();
    if (
      ![
        'little',
        'bit',
        'lot',
        'fan',
        'friend',
        'stranger',
        'human',
        'person',
        'mess',
        'idiot',
        'loser',
      ].includes(role.toLowerCase().split(' ')[0])
    ) {
      extracted.push(`Background/activity: ${role}`);
    }
  }

  // 8. Location or hometown
  const locationMatch = clean.match(/(?:i live in|i'm from|i am from)\s+([A-Za-z\s]{2,30}?)(?=[.,!?]|$)/i);
  if (locationMatch && locationMatch[1]) {
    extracted.push(`Lives in / from ${locationMatch[1].trim()}`);
  }

  // 9. Birthday
  const bdayMatch = clean.match(/my birthday is\s+([A-Za-z0-9\s,]{3,25}?)(?=[.!?]|$)/i);
  if (bdayMatch && bdayMatch[1]) {
    extracted.push(`Birthday is ${bdayMatch[1].trim()}`);
  }

  // 10. Sleep habits & schedule
  if (
    lower.includes("can't sleep") ||
    lower.includes('insomnia') ||
    lower.includes('awake at') ||
    lower.includes('stayed up') ||
    lower.includes('sleep schedule')
  ) {
    extracted.push('Often stays up late or has trouble sleeping');
  }
  if (lower.match(/(?:wake up early|exam tomorrow|work tomorrow|early meeting|test tomorrow|shift tomorrow)/i)) {
    extracted.push('Has an early morning schedule or upcoming exam/shift');
  }

  // 11. Hobbies & Skills
  const hobby = clean.match(/(?:i play|i practice|i train in|learning)\s+([A-Za-z0-9\s]{3,25}?)(?=[.,!?]|$)/i);
  if (hobby && hobby[1]) {
    extracted.push(`Practices/plays ${hobby[1].trim()}`);
  }

  return Array.from(new Set(extracted));
}
