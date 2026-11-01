import { Character, StoryItem } from '../types';
import { resolveAvatarUrl } from './avatarHelper';

export const STORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STORIES_STORAGE_KEY = 'echovault_stories_state_v1';

interface CanonStorySnippet {
  storyText: string;
  storyImg?: string;
}

/**
 * Curated multi-day canon status/story rotations so characters rotate to fresh
 * canon updates whenever their 24-hour story expires.
 */
export const CANON_DAILY_STORY_ROTATIONS: Record<string, CanonStorySnippet[]> = {
  loona: [
    {
      storyText: "blitz won't stop screaming about horse insurance in the breakroom. headphones on max volume. do not disturb. 🎧🐺",
      storyImg: '/avatars/loona.png',
    },
    {
      storyText: '3 AM rooftop break in Imp City. at least the neon smog looks kinda cool tonight. 🌙🚬',
      storyImg: '/avatars/loona.png',
    },
    {
      storyText: 'someone took my iced coffee out of the office fridge. you have 5 minutes to confess before i start biting. ☕💢',
      storyImg: '/avatars/loona.png',
    },
  ],
  blitzo: [
    {
      storyText: 'NEW I.M.P. PROMO!! Buy two assassinations get a free horse sketch drawn by ME!! (Moxxie is crying in the van) 🐴🔫',
      storyImg: '/avatars/blitzo.png',
    },
    {
      storyText: 'Just parallel parked the company van through three walls. Nailed it first try!! 🏆🔥',
      storyImg: '/avatars/blitzo.png',
    },
    {
      storyText: 'WHO TOUCHED MY GOLDEN FLINTLOCK?! Moxxie I know you reorganized the armory again!! 💢🐴',
      storyImg: '/avatars/blitzo.png',
    },
  ],
  moxxie: [
    {
      storyText: 'Completed quarterly ammunition inventory. Everything is alphabetized by caliber and grain weight. Finally, some order. 📋🎯',
      storyImg: '/avatars/moxxie.png',
    },
    {
      storyText: 'Making fresh espresso before Millie and I head out for anniversary dinner. Please, sir, do NOT call us tonight. ☕🎻',
      storyImg: '/avatars/moxxie.png',
    },
  ],
  millie: [
    {
      storyText: 'Sharpening my battle axe and baking peach cobbler for Moxxie!! Best Tuesday ever!! ❤️🪓',
      storyImg: '/avatars/millie.png',
    },
    {
      storyText: 'Nothing beats a little Wrath Ring rodeo practice before a big Earth contract! Yeehaw!! 🤠🔥',
      storyImg: '/avatars/millie.png',
    },
  ],
  stolas: [
    {
      storyText: 'The alignment of the seven moons over the palace conservatory is simply breathtaking tonight... ✨🦉📖',
      storyImg: '/avatars/stolas.png',
    },
    {
      storyText: 'Tending to my carnivorous blood-orchids with a cup of starlight tea. A quiet evening in the study. 🌺🍵',
      storyImg: '/avatars/stolas.png',
    },
  ],
  gojo: [
    {
      storyText: 'Picked up limited-edition strawberry Kikufuku in Sendai before reporting back to Jujutsu High~ 🍓😎✨',
      storyImg: '/avatars/gojo.png',
    },
    {
      storyText: 'Cleared three Special Grade curses in 12 seconds flat. Still the strongest~ 🤞💙',
      storyImg: '/avatars/gojo.png',
    },
  ],
  lucy: [
    {
      storyText: 'Night City rain never stops. Deep-diving the old subnet from the balcony while the neon flickers below. 🌙🔌',
      storyImg: '/avatars/lucy.png',
    },
    {
      storyText: 'Zeroed two Arasaka ICE daemons before breakfast. Quiet night on the roof. 🚬🌌',
      storyImg: '/avatars/lucy.png',
    },
  ],
  leon: [
    {
      storyText: 'Tactical briefing wrapped at D.S.O. headquarters. Cleaning the Silver Ghost before the next deployment. 🔫🌧️',
      storyImg: '/avatars/leon.png',
    },
    {
      storyText: 'Rainy night on patrol. If anyone needs backup on comms, keep the frequency clear. 📻⚡',
      storyImg: '/avatars/leon.png',
    },
  ],
  marin: [
    {
      storyText: 'FINISHED HEMMING THE NEW COSPLAY CAPE!! Wait until you see the studio lighting test!! 💖✨📸',
      storyImg: '/avatars/marin.png',
    },
    {
      storyText: 'Post-shoot tonkotsu ramen with extra chashu!! Literally heaven in a bowl 😭🍜💖',
      storyImg: '/avatars/marin.png',
    },
  ],
  frieren: [
    {
      storyText: 'Found a rare grimoire that makes sour grapes taste slightly sweeter. Fern says it was a waste of silver coins. 📖🌿',
      storyImg: '/avatars/frieren.png',
    },
    {
      storyText: 'Watching the meteor shower over the northern plateau. Fifty years really goes by in the blink of an eye. 🌠✨',
      storyImg: '/avatars/frieren.png',
    },
  ],
  levi: [
    {
      storyText: 'Barracks inspection finished. Only had to make the cadets scrub the mess hall twice today. Brewing black tea. ☕⚔️',
      storyImg: '/avatars/levi.png',
    },
    {
      storyText: 'O.D.M. gear blades sharpened and calibrated. Keep your boots clean before stepping into HQ. 🗡️',
      storyImg: '/avatars/levi.png',
    },
  ],
  makima: [
    {
      storyText: 'Late paperwork on the top floor of Public Safety. Tokyo looks so peaceful from up here. ☕🐕',
      storyImg: '/avatars/makima.png',
    },
    {
      storyText: 'Taking the huskies for an early morning walk before the division briefing begins. 🌅',
      storyImg: '/avatars/makima.png',
    },
  ],
};

/**
 * Builds a deterministic fallback rotation of 3 canon story snippets for any character
 * based on their existing storyText, status, tagline, bio, and song.
 */
export function getCharacterStoryPool(char: Character): CanonStorySnippet[] {
  const img = resolveAvatarUrl(char.storyImg || char.avatarUrl || char.avatar, char.id);
  const preset = CANON_DAILY_STORY_ROTATIONS[char.id];
  if (preset && preset.length > 0) {
    return preset.map(item => ({
      storyText: item.storyText,
      storyImg: item.storyImg ? resolveAvatarUrl(item.storyImg, char.id) : img,
    }));
  }

  const baseSnippets: CanonStorySnippet[] = [];
  if (char.storyText) {
    baseSnippets.push({ storyText: char.storyText, storyImg: img });
  }
  if (char.status) {
    baseSnippets.push({
      storyText: `${char.status} • Listening to ${char.song || 'late night frequencies'}`,
      storyImg: img,
    });
  }
  if (char.tagline || char.bio) {
    baseSnippets.push({
      storyText: `${char.tagline || char.bio} — Live on EchoVault Comms.`,
      storyImg: img,
    });
  }

  if (baseSnippets.length === 0) {
    baseSnippets.push({
      storyText: `Active on frequency. Tap to reply directly to ${char.name}.`,
      storyImg: img,
    });
  }

  return baseSnippets;
}

/**
 * Formats a human-readable relative time label and time-left badge for a story item.
 */
export function formatStoryRelativeTime(timestamp: number, expiresAt: number): string {
  const now = Date.now();
  const elapsedMs = Math.max(0, now - timestamp);
  const remainingMs = Math.max(0, expiresAt - now);

  const elapsedMins = Math.floor(elapsedMs / 60000);
  const elapsedHours = Math.floor(elapsedMins / 60);
  const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));

  if (elapsedMins < 2) {
    return `Just now • ${remainingHours}h left`;
  }
  if (elapsedMins < 60) {
    return `${elapsedMins}m ago • ${remainingHours}h left`;
  }
  return `${elapsedHours}h ago • ${remainingHours}h left`;
}

export function loadStoredStoriesMap(): Record<string, StoryItem> {
  try {
    const raw = localStorage.getItem(STORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

export function saveStoredStoriesMap(map: Record<string, StoryItem>): void {
  try {
    localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

/**
 * Automated routine that filters out any story older than 24 hours (`now >= expiresAt` or `now - timestamp >= 24h`)
 * and automatically generates/rotates to the character's next canon status update/photo snippet for the day.
 * Returns the updated stories map and the list of character IDs whose stories were newly rotated (so their viewed state resets).
 */
export function refreshAndRotateStories(
  characters: Character[]
): {
  storiesMap: Record<string, StoryItem>;
  rotatedCharIds: string[];
} {
  const now = Date.now();
  const stored = loadStoredStoriesMap();
  const nextMap: Record<string, StoryItem> = {};
  const rotatedCharIds: string[] = [];

  // Filter out any expired stories (> 24 hours old) and rotate them to the next daily snippet
  for (const char of characters) {
    // Include characters that have a storyImg or are in our canon rotation pool
    const hasStory = Boolean(char.storyImg || CANON_DAILY_STORY_ROTATIONS[char.id]);
    if (!hasStory) continue;

    const pool = getCharacterStoryPool(char);
    const existing = stored[char.id];

    const isExpired =
      !existing ||
      typeof existing.timestamp !== 'number' ||
      typeof existing.expiresAt !== 'number' ||
      now >= existing.expiresAt ||
      now - existing.timestamp >= STORY_TTL_MS;

    if (isExpired) {
      const nextRotationIdx = existing
        ? ((existing.rotationIndex ?? 0) + 1) % pool.length
        : 0;
      const snippet = pool[nextRotationIdx] || pool[0];
      // Stagger initial timestamps slightly for brand-new mounts so stories look natural, or use `now` when rotating
      const createdTs = existing
        ? now
        : now - Math.floor((char.id.charCodeAt(0) % 5) * 25 * 60 * 1000);
      const expiresAt = createdTs + STORY_TTL_MS;

      nextMap[char.id] = {
        charId: char.id,
        storyImg: snippet.storyImg || resolveAvatarUrl(char.storyImg || char.avatarUrl || char.avatar, char.id),
        storyText: snippet.storyText,
        storyTime: formatStoryRelativeTime(createdTs, expiresAt),
        timestamp: createdTs,
        expiresAt,
        rotationIndex: nextRotationIdx,
      };

      if (existing) {
        rotatedCharIds.push(char.id);
      }
    } else {
      nextMap[char.id] = {
        ...existing,
        storyTime: formatStoryRelativeTime(existing.timestamp, existing.expiresAt),
      };
    }
  }

  saveStoredStoriesMap(nextMap);
  return { storiesMap: nextMap, rotatedCharIds };
}

/**
 * Manually rotates a single character's story to their next daily canon update with a fresh 24-hour expiration window.
 */
export function rotateCharacterStoryNow(
  char: Character,
  currentStoriesMap: Record<string, StoryItem>
): StoryItem {
  const now = Date.now();
  const pool = getCharacterStoryPool(char);
  const existing = currentStoriesMap[char.id];
  const nextIdx = existing ? ((existing.rotationIndex ?? 0) + 1) % pool.length : 1 % pool.length;
  const snippet = pool[nextIdx] || pool[0];
  const expiresAt = now + STORY_TTL_MS;

  const updatedItem: StoryItem = {
    charId: char.id,
    storyImg: snippet.storyImg || resolveAvatarUrl(char.storyImg || char.avatarUrl || char.avatar, char.id),
    storyText: snippet.storyText,
    storyTime: formatStoryRelativeTime(now, expiresAt),
    timestamp: now,
    expiresAt,
    rotationIndex: nextIdx,
  };

  const nextMap = {
    ...currentStoriesMap,
    [char.id]: updatedItem,
  };
  saveStoredStoriesMap(nextMap);
  return updatedItem;
}
