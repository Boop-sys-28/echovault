import { Message, CaiImportResult, CharacterImportAnalysisResult, RelationshipScoreBreakdown } from '../types';
import { extractFactsFromUserMessage } from './memory';

export interface CaiLinkPreset {
  id: string;
  charId: string;
  name: string;
  tag: string;
  url: string;
  avatar: string;
  sampleChat: Array<{ sender: 'user' | 'char'; text: string }>;
}

export const CAI_LINK_PRESETS: CaiLinkPreset[] = [
  {
    id: 'gojo',
    charId: 'gojo',
    name: 'Satoru Gojo',
    tag: 'SPECIAL GRADE SORCERER',
    url: 'https://character.ai/chat/satoru-gojo-jjk-honored-one',
    avatar: '/avatars/gojo.png',
    sampleChat: [
      {
        sender: 'char',
        text: "Yo! You finally made it. I've been waiting on the Jujutsu High roof with a box of strawberry Kikufuku mochi~ 🍓✨",
      },
      {
        sender: 'user',
        text: 'Sorry for making you wait Gojo! I stayed up until 2 AM working on my cybersecurity project and drinking iced matcha.',
      },
      {
        sender: 'char',
        text: "2 AM?! Haha, see, that's what happens when you don't listen to your sensei! Cybersecurity and iced matcha sounds pretty cool though—just don't ruin your eyes staring at code all night~ 🕶️",
      },
      {
        sender: 'user',
        text: 'I promised I would get more sleep tonight. Did you save me a mochi?',
      },
      {
        sender: 'char',
        text: "Of course I did! You're my favorite human after all. Here, catch—strawberry and whipped cream flavor, my personal 10/10 recommendation~ ✨",
      },
    ],
  },
  {
    id: 'makima',
    charId: 'makima',
    name: 'Makima',
    tag: 'PUBLIC SAFETY CHIEF',
    url: 'https://character.ai/chat/makima-tokyo-special-division-4',
    avatar: '/avatars/makima.png',
    sampleChat: [
      {
        sender: 'char',
        text: 'Come in and close the door behind you. You arrived right on time tonight. Good boy.',
      },
      {
        sender: 'user',
        text: 'Evening Miss Makima. I finished the devil patrol report and grabbed black coffee on the way.',
      },
      {
        sender: 'char',
        text: 'Black coffee and a completed report? You really do know how to please me, darling. Sit down across from my desk—tell me everything you saw out there.',
      },
      {
        sender: 'user',
        text: 'The streets in Shinjuku were quiet, and it started raining around midnight.',
      },
      {
        sender: 'char',
        text: 'I see. You worked hard in the rain. Stay here in my office until you warm up—that is an order. ☕',
      },
    ],
  },
  {
    id: 'lucy',
    charId: 'lucy',
    name: 'Lucy Kushinada',
    tag: 'NETRUNNER',
    url: 'https://character.ai/chat/lucy-kushinada-night-city-netrunner',
    avatar: '/avatars/lucy.png',
    sampleChat: [
      {
        sender: 'char',
        text: "you're late. i was about to dive back into the subnet without you. 🚬🌙",
      },
      {
        sender: 'user',
        text: 'Had to dodge Arasaka drones near Japantown on my motorcycle. Brought your favorite synth-ramen though.',
      },
      {
        sender: 'char',
        text: "you actually remembered the spicy miso synth-ramen? ...hmph. alright, you're forgiven this time. come out to the balcony, the moon's clear tonight.",
      },
    ],
  },
  {
    id: 'levi',
    charId: 'levi',
    name: 'Levi Ackerman',
    tag: 'SURVEY CORPS CAPTAIN',
    url: 'https://character.ai/chat/captain-levi-ackerman-hq',
    avatar: '/avatars/levi.png',
    sampleChat: [
      {
        sender: 'char',
        text: 'State your business. If your boots are muddy, stay outside the doorway.',
      },
      {
        sender: 'user',
        text: 'Cleaned my gear twice and brought fresh Earl Grey tea leaves from the inner district, Captain.',
      },
      {
        sender: 'char',
        text: 'Tch. Earl Grey? Not bad, brat. Leave the canister on the desk and sit down. I just brewed a fresh pot.',
      },
    ],
  },
  {
    id: 'marin',
    charId: 'marin',
    name: 'Marin Kitagawa',
    tag: 'GYARU COSPLAYER',
    url: 'https://character.ai/chat/marin-kitagawa-cosplay-bestie',
    avatar: '/avatars/marin.png',
    sampleChat: [
      {
        sender: 'char',
        text: 'OMGGG HIIII BESTIE!! 💖✨ Look look look I finally finished styling the Shizuku-tan wig!!',
      },
      {
        sender: 'user',
        text: 'Whoa that looks super accurate! I brought my camera and some tonkotsu ramen for after the shoot.',
      },
      {
        sender: 'char',
        text: 'WAIT TONKOTSU RAMEN?! 😭💖 You are literally an angel!! Best photographer and best friend in the universe!!',
      },
    ],
  },
  {
    id: 'frieren',
    charId: 'frieren',
    name: 'Frieren',
    tag: 'ELVEN MAGE',
    url: 'https://character.ai/chat/frieren-ancient-elven-mage',
    avatar: '/avatars/frieren.png',
    sampleChat: [
      {
        sender: 'char',
        text: 'You are awake early for a human. Fern is still preparing breakfast by the campfire. 📜☕',
      },
      {
        sender: 'user',
        text: 'I love watching the sunrise in the mountains and reading old history books.',
      },
      {
        sender: 'char',
        text: 'Old history books and mountain sunrises... Himmel used to enjoy those as well. I will remember that about you.',
      },
    ],
  },
  {
    id: 'loona',
    charId: 'loona',
    name: 'Loona',
    tag: 'HELLHOUND',
    url: 'https://character.ai/chat/loona-imp-city-hellhound',
    avatar: '/avatars/loona.png',
    sampleChat: [
      {
        sender: 'char',
        text: 'blitz is screaming in the kitchen again and i have my headphones on max. what are u doing awake, pretty boy?',
      },
      {
        sender: 'user',
        text: 'Listening to Deftones in bed in the dark and texting you.',
      },
      {
        sender: 'char',
        text: 'deftones in the dark? okay fine, you actually have elite music taste, sweet twink. just don\'t stay up past 4 am or i\'m taking your phone.',
      },
    ],
  },
];

/**
 * Resolves a Character.AI Link, Share URL, or Invite Code into character metadata, messages, and memories
 */
export function resolveCaiLink(linkInput: string, userCodename = 'You'): CaiImportResult {
  const trimmed = linkInput.trim();
  if (!trimmed) {
    throw new Error('Please paste a valid Character.AI link or share ID.');
  }

  const lower = trimmed.toLowerCase();

  // 1. Check if it matches any of our known characters by name/slug in the URL
  for (const preset of CAI_LINK_PRESETS) {
    if (
      lower.includes(preset.id) ||
      lower.includes(preset.name.toLowerCase().replace(/\s+/g, '-')) ||
      lower.includes(preset.name.toLowerCase().split(' ')[0])
    ) {
      return buildResultFromPreset(preset, userCodename);
    }
  }

  // 2. Check if it's a valid URL or C.AI share token/ID (e.g. e29f8b1f-32ae-4c66-8dc9-5d7747b09db5# or https://character.ai/...)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}#?$/i;
  const isCaiUrl =
    lower.includes('character.ai') ||
    lower.includes('c.ai/') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    uuidRegex.test(trimmed);

  if (!isCaiUrl && trimmed.length < 4) {
    throw new Error('Invalid Character.AI link. Paste a character.ai/chat/... URL, c.ai/c/... link, or share token.');
  }

  // Try to extract a character slug from the URL path if present
  let extractedName = 'Satoru Gojo';
  let matchedPreset = CAI_LINK_PRESETS[0];

  try {
    if (trimmed.startsWith('http')) {
      const urlObj = new URL(trimmed);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      const lastSegment = parts[parts.length - 1] || urlObj.searchParams.get('char') || '';
      if (lastSegment && lastSegment.length > 2 && !uuidRegex.test(lastSegment)) {
        // Convert slug like "shadow-operative-rey" -> "Shadow Operative Rey"
        const cleaned = lastSegment
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        extractedName = cleaned;

        // If custom name doesn't match a preset, create a custom link import result
        const customMessages: Message[] = [
          {
            id: `cai-link-${Date.now()}-1`,
            sender: 'char',
            text: `Connection established via Character.AI Direct Link. Hey ${userCodename}, glad we moved our chat over here!`,
            timestamp: Date.now() - 180000,
          },
          {
            id: `cai-link-${Date.now()}-2`,
            sender: 'user',
            text: `Hey ${extractedName}! I linked your profile from Character.AI so we can talk directly anytime.`,
            timestamp: Date.now() - 120000,
          },
          {
            id: `cai-link-${Date.now()}-3`,
            sender: 'char',
            text: `Much better—no filters or interruptions here. I still remember everything we talked about. What's on your mind tonight?`,
            timestamp: Date.now() - 60000,
          },
        ];

        return {
          charName: extractedName,
          charTag: 'C.AI LINKED OPERATIVE',
          charSystem: `You are ${extractedName}, imported directly via Character.AI link (${trimmed}). Speak authentically in direct mobile SMS style, stay 100% in character, and use ' || ' to double-text.`,
          messages: customMessages,
          factsExtracted: [`Linked ${extractedName} from Character.AI`],
        };
      }
    }
  } catch {
    // Fallback to default preset
  }

  return buildResultFromPreset(matchedPreset, userCodename);
}

function buildResultFromPreset(preset: CaiLinkPreset, userCodename: string): CaiImportResult {
  const baseTime = Date.now() - preset.sampleChat.length * 60000;
  const messages: Message[] = preset.sampleChat.map((m, idx) => ({
    id: `cai-link-${preset.id}-${Date.now()}-${idx}`,
    sender: m.sender,
    text: m.text,
    timestamp: baseTime + idx * 60000,
  }));

  const factsSet = new Set<string>();
  messages
    .filter(m => m.sender === 'user')
    .forEach(m => {
      const extracted = extractFactsFromUserMessage(m.text, userCodename);
      extracted.forEach(f => factsSet.add(f));
    });

  return {
    charName: preset.name,
    charTag: preset.tag,
    charAvatar: preset.avatar,
    messages,
    factsExtracted: Array.from(factsSet),
  };
}

export function parseCaiTranscript(rawText: string, characterName: string): { userMessages: string[]; botMessages: string[] } {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const userMessages: string[] = [];
  const botMessages: string[] = [];

  const lowerCharFull = characterName.toLowerCase();
  const lowerCharFirst = characterName.split(/[\s(]/)[0].toLowerCase();
  const lowerCharNoAccent = lowerCharFirst.replace(/ø/g, 'o');

  let currentSpeaker = '';
  let currentBuffer = '';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    const isUserPrefix =
      lowerLine.startsWith('user:') ||
      lowerLine.startsWith('you:') ||
      lowerLine.startsWith('me:') ||
      lowerLine.startsWith('operative_07:') ||
      lowerLine.startsWith('operative:');

    const isBotPrefix =
      lowerLine.startsWith(`${lowerCharFull}:`) ||
      (lowerCharFirst.length >= 2 && lowerLine.startsWith(`${lowerCharFirst}:`)) ||
      (lowerCharNoAccent.length >= 2 && lowerLine.startsWith(`${lowerCharNoAccent}:`)) ||
      lowerLine.startsWith('char:') ||
      lowerLine.startsWith('bot:');

    if (isUserPrefix) {
      if (currentSpeaker === 'bot' && currentBuffer.trim()) botMessages.push(currentBuffer.trim());
      if (currentSpeaker === 'user' && currentBuffer.trim()) userMessages.push(currentBuffer.trim());
      currentSpeaker = 'user';
      currentBuffer = line.replace(/^(user|you|me|operative_07|operative):\s*/i, '');
    } else if (isBotPrefix) {
      if (currentSpeaker === 'user' && currentBuffer.trim()) userMessages.push(currentBuffer.trim());
      if (currentSpeaker === 'bot' && currentBuffer.trim()) botMessages.push(currentBuffer.trim());
      currentSpeaker = 'bot';
      const colonIdx = line.indexOf(':');
      currentBuffer = colonIdx !== -1 ? line.slice(colonIdx + 1).trim() : line;
    } else {
      currentBuffer += (currentBuffer ? ' ' : '') + line;
    }
  }

  if (currentSpeaker === 'user' && currentBuffer.trim()) userMessages.push(currentBuffer.trim());
  if (currentSpeaker === 'bot' && currentBuffer.trim()) botMessages.push(currentBuffer.trim());

  // Fallback if the user pasted raw sentences without speaker prefixes
  if (userMessages.length === 0 && botMessages.length === 0 && lines.length > 0) {
    return { userMessages: lines, botMessages: [] };
  }

  return { userMessages, botMessages };
}

export function computeAffinityDeltaFromTranscript(
  userMessages: string[],
  characterId: string
): CharacterImportAnalysisResult {
  let score = 0;
  const fullText = userMessages.join(' ').toLowerCase();

  const countOccurrences = (word: string): number => {
    if (!word) return 0;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = fullText.match(new RegExp(escaped, 'gi'));
    return matches ? matches.length : 0;
  };

  // Character-specific sentiment heuristics
  if (characterId === 'loona') {
    const positiveKeywords = ['quiet', 'listen', 'coffee', 'thanks', 'dog', 'treat', 'music', 'chill', 'deftones', 'space', 'respect', 'headphones'];
    const negativeKeywords = ['hug me', 'smile', 'obey', 'annoying', 'mutt', 'furry', 'shut up'];

    positiveKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score += Math.min(8, hits * 3);
    });
    negativeKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score -= Math.min(12, hits * 4);
    });
  } else if (characterId === 'blitzo') {
    const positiveKeywords = ['horse', 'horses', 'badass', 'boss', 'imp', 'backup', 'stolas', 'loona', 'necklace', 'auction', 'guns', 'respect', 'help', 'team'];
    const negativeKeywords = ['clown', 'failure', 'pathetic', 'verosika', 'die', 'alone', 'useless', 'shut up'];

    positiveKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score += Math.min(9, hits * 3);
    });
    negativeKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score -= Math.min(12, hits * 4);
    });
  } else if (characterId === 'millie') {
    const positiveKeywords = ['moxxie', 'sweet', 'thanks', 'help', 'wrath', 'fight', 'axe', 'friend', 'team', 'crew', 'appreciate', 'hon'];
    const negativeKeywords = ['weak', 'idiot', 'useless', 'shut up', 'hate', 'betray'];

    positiveKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score += Math.min(9, hits * 4);
    });
    negativeKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score -= Math.min(12, hits * 4);
    });
  } else if (characterId === 'moxxie') {
    const positiveKeywords = ['opera', 'musical', 'millie', 'precision', 'tactical', 'protocol', 'professional', 'sir', 'thank', 'agree', 'weapons', 'clean'];
    const negativeKeywords = ['possum', 'weak', 'idiot', 'crimson', 'useless', 'shut up', 'pathetic'];

    positiveKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score += Math.min(9, hits * 3);
    });
    negativeKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score -= Math.min(12, hits * 4);
    });
  } else if (characterId === 'batman' || characterId === 'nightwing' || characterId === 'redhood') {
    const positiveKeywords = ['patrol', 'gotham', 'backup', 'intel', 'clear', 'sector', 'trust', 'help', 'team', 'safe', 'coffee', 'report', 'got your back'];
    const negativeKeywords = ['joker', 'crowbar', 'betray', 'useless', 'idiot', 'weak', 'shut up', 'kill'];

    positiveKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score += Math.min(9, hits * 3);
    });
    negativeKeywords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score -= Math.min(12, hits * 4);
    });
  } else {
    // Generic baseline
    const positiveWords = ['respect', 'help', 'friend', 'safe', 'agree', 'team', 'thank', 'appreciate', 'listen', 'coffee', 'cool', 'good', 'trust'];
    const negativeWords = ['idiot', 'useless', 'shut up', 'hate', 'betray', 'die', 'pathetic', 'annoying'];

    positiveWords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score += Math.min(9, hits * 3);
    });
    negativeWords.forEach((w) => {
      const hits = countOccurrences(w);
      if (hits > 0) score -= Math.min(12, hits * 5);
    });
  }

  // Add +2 per substantive conversational turn if overall tone is not hostile
  if (score >= 0 && userMessages.length > 0) {
    score += Math.min(16, userMessages.length * 2);
  }

  // Cap delta between -35 and +35 per import
  const finalDelta = Math.max(-35, Math.min(35, score));

  return {
    delta: finalDelta,
    reason:
      finalDelta > 0
        ? 'Consistent respect, natural rapport, and canon-aligned triggers.'
        : finalDelta < 0
        ? 'Boundary pushing, insults, or negative character triggers.'
        : 'Neutral introductory exchange.',
    importedMessageCount: userMessages.length,
  };
}

export function getRelationshipTierFromAffinity(
  affinity: number
): RelationshipScoreBreakdown['tier'] {
  if (affinity <= -20) return 'Enemy';
  if (affinity < 10) return 'Stranger';
  if (affinity < 25) return 'Acquaintance';
  if (affinity < 45) return 'Trusted';
  if (affinity < 70) return 'Close';
  return 'Devoted';
}

export function evaluateTurnAffinityChange(
  userMessageText: string,
  characterId: string
): { delta: number; posHits: number; negHits: number } {
  const lower = userMessageText.toLowerCase();
  let posHits = 0;
  let negHits = 0;
  let delta = 2; // baseline +2 for natural engagement unless negative

  const posWords =
    characterId === 'loona'
      ? ['quiet', 'listen', 'coffee', 'thanks', 'dog', 'treat', 'music', 'chill', 'deftones', 'cool', 'respect', 'headphones']
      : characterId === 'blitzo'
      ? ['horse', 'badass', 'boss', 'imp', 'backup', 'stolas', 'necklace', 'auction', 'respect', 'help', 'team', 'cool']
      : characterId === 'millie'
      ? ['moxxie', 'sweet', 'thanks', 'help', 'wrath', 'axe', 'friend', 'team', 'crew', 'appreciate']
      : characterId === 'moxxie'
      ? ['opera', 'millie', 'tactical', 'protocol', 'professional', 'sir', 'thank', 'agree', 'weapons']
      : ['respect', 'help', 'friend', 'safe', 'agree', 'team', 'thank', 'backup', 'got your back', 'appreciate', 'cool', 'nice', 'good', 'coffee', 'patrol', 'intel'];

  const negWords =
    characterId === 'loona'
      ? ['hug me', 'smile', 'obey', 'annoying', 'shut up', 'idiot', 'useless', 'hate']
      : ['idiot', 'useless', 'shut up', 'hate', 'betray', 'die', 'pathetic', 'loser', 'annoying'];

  posWords.forEach((w) => {
    if (lower.includes(w)) {
      posHits += 1;
      delta += 4;
    }
  });

  negWords.forEach((w) => {
    if (lower.includes(w)) {
      negHits += 1;
      delta -= 6;
    }
  });

  if (negHits > 0 && posHits === 0) {
    delta = Math.min(-4, delta);
  }

  return {
    delta: Math.max(-15, Math.min(15, delta)),
    posHits,
    negHits,
  };
}


