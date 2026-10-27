import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Allow Google Identity Services (GIS) and Firebase OAuth popups to communicate with window.opener
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '100mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

let runtimeApiKey = process.env.GEMINI_API_KEY || '';

function getActiveApiKey(): string {
  return runtimeApiKey || process.env.GEMINI_API_KEY || '';
}

function getGenAIClient(): GoogleGenAI | null {
  const key = getActiveApiKey();
  if (!key) return null;
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

// Multi-model orchestration pool (ordered for low latency and high quota availability)
const CANDIDATE_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite-preview',
];

const BANNED_AI_FILLER_PATTERNS = [
  /\bas an ai\b/i,
  /\bas a language model\b/i,
  /\bi understand how you feel\b/i,
  /\bhow can i assist you today\b/i,
  /\bhow may i help you\b/i,
  /\bi'm here to help\b/i,
  /\bi am an artificial intelligence\b/i,
];

function sanitizeAndCapBubbles(rawText: string): string {
  const cleaned = rawText
    .replace(/\*[^*]+\*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const bubbles = cleaned
    .split(/\s*\|\|\s*|\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean);

  if (bubbles.length === 0) return cleaned;
  if (bubbles.length <= 3) return bubbles.join(' || ');
  const firstTwo = bubbles.slice(0, 2);
  const thirdCombined = bubbles.slice(2).join(' ');
  return [...firstTwo, thirdCombined].join(' || ');
}

function buildNormalizedContents(
  history: Array<{ role?: string; text?: string }> | undefined,
  prompt: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const rawTurns: Array<{ role: 'user' | 'model'; text: string }> = [];

  if (Array.isArray(history)) {
    for (const item of history.slice(-50)) {
      if (!item || typeof item.text !== 'string' || !item.text.trim()) continue;
      rawTurns.push({
        role: item.role === 'user' ? 'user' : 'model',
        text: item.text.trim(),
      });
    }
  }

  // Merge consecutive turns of the same role so multi-bubble ('model', 'model') messages
  // never violate Gemini's alternating user/model turn requirement
  const mergedTurns: Array<{ role: 'user' | 'model'; text: string }> = [];
  for (const turn of rawTurns) {
    const prev = mergedTurns[mergedTurns.length - 1];
    if (prev && prev.role === turn.role) {
      prev.text = prev.role === 'model' ? `${prev.text} || ${turn.text}` : `${prev.text}\n${turn.text}`;
    } else {
      mergedTurns.push({ ...turn });
    }
  }

  // Ensure multi-turn contents begins with a 'user' message
  while (mergedTurns.length > 0 && mergedTurns[0].role !== 'user') {
    mergedTurns.shift();
  }

  // Append or merge the latest user prompt
  const cleanPrompt = prompt.trim();
  const lastTurn = mergedTurns[mergedTurns.length - 1];
  if (lastTurn && lastTurn.role === 'user') {
    if (lastTurn.text !== cleanPrompt) {
      lastTurn.text = `${lastTurn.text}\n${cleanPrompt}`;
    }
  } else {
    mergedTurns.push({ role: 'user', text: cleanPrompt });
  }

  return mergedTurns.map(t => ({
    role: t.role,
    parts: [{ text: t.text }],
  }));
}

// Track cooldown timestamps for models that hit 429 RESOURCE_EXHAUSTED
const modelCooldownUntil: Record<string, number> = {};

interface ServerTropeCluster {
  id: string;
  label: string;
  keywords: string[];
}

const BANNED_REPETITIVE_TROPES: ServerTropeCluster[] = [
  {
    id: 'hydration_nag',
    label: 'Telling the user to drink water or hydrate',
    keywords: ['drink water', 'hydrate', 'hydration', 'glass of water', 'water intake', 'thirsty'],
  },
  {
    id: 'sleep_nag',
    label: 'Nagging the user to go to sleep, close their eyes, or lecturing about late hours/insomnia',
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
    label: 'Nagging about posture, slouching, or squinting at the screen',
    keywords: ['posture', 'slouch', 'squinting', 'burn out', 'sit up straight'],
  },
  {
    id: 'blitz_cereal_kitchen',
    label: 'Blitzø throwing cereal/spoons, slamming kitchen cabinets, or kitchen chaos',
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
    label: 'Vassago, the auction, Safeword, or Stolas mother locket loop',
    keywords: ['vassago', 'locket', 'safeword', 'auction', 'bluebird', 'heirloom'],
  },
  {
    id: 'coffee_routine',
    label: 'Repeating black coffee or coffee cup count complaints',
    keywords: ['black coffee', 'fourth cup', 'cup number four', 'coffee #4', 'black sludge'],
  },
];

const SERVER_STOP_WORDS = new Set([
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

function extractSemanticTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !SERVER_STOP_WORDS.has(w));
}

function checkSemanticRepetitionOnServer(
  candidate: string,
  pastModelMessages: string[],
  userPrompt: string
): { isRepetitive: boolean; reason?: string } {
  const cleanCandidate = candidate.trim().toLowerCase();
  if (!cleanCandidate) return { isRepetitive: true, reason: 'Empty output' };

  if (BANNED_AI_FILLER_PATTERNS.some(rx => rx.test(cleanCandidate))) {
    return {
      isRepetitive: true,
      reason: 'Contains forbidden generic AI filler phrase',
    };
  }

  const lowerPrompt = userPrompt.toLowerCase();

  // 1. Check banned repetitive tropes unless the user explicitly brought them up in their latest prompt
  for (const cluster of BANNED_REPETITIVE_TROPES) {
    const userAskedAboutTrope = cluster.keywords.some(kw => lowerPrompt.includes(kw));
    if (!userAskedAboutTrope && cluster.keywords.some(kw => cleanCandidate.includes(kw))) {
      return {
        isRepetitive: true,
        reason: `Contains banned repetitive trope (${cluster.label}) not requested by user`,
      };
    }
  }

  // 2. Check exact and high semantic token overlap against recent character messages
  const candidateTokens = extractSemanticTokens(cleanCandidate);
  const candidateSet = new Set(candidateTokens);

  for (const past of pastModelMessages.slice(-30)) {
    const cleanPast = past.trim().toLowerCase();
    if (!cleanPast) continue;

    if (cleanCandidate === cleanPast) {
      return { isRepetitive: true, reason: 'Exact duplicate of a previous message' };
    }

    const pastTokens = extractSemanticTokens(cleanPast);
    if (pastTokens.length < 4 || candidateSet.size < 4) continue;

    let intersection = 0;
    for (const t of pastTokens) {
      if (candidateSet.has(t)) intersection++;
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
        reason: `High semantic similarity with previous message: "${past.slice(0, 70)}"`,
      };
    }
  }

  return { isRepetitive: false };
}

// Status check endpoints
app.get('/api/status', (_req, res) => {
  const key = getActiveApiKey();
  res.json({
    status: 'online',
    hasApiKey: Boolean(key && key.trim().length > 5),
    model: CANDIDATE_MODELS[0],
  });
});

app.get('/api/health', (_req, res) => {
  const key = getActiveApiKey();
  res.json({
    status: 'ok',
    hasApiKey: Boolean(key && key.trim().length > 5),
    keySource: runtimeApiKey !== (process.env.GEMINI_API_KEY || '') ? 'custom' : process.env.GEMINI_API_KEY ? 'env' : 'none',
  });
});

app.post('/api/config/apikey', (req, res) => {
  const { apiKey: newKey } = req.body || {};
  if (typeof newKey === 'string' && newKey.trim().length > 10) {
    runtimeApiKey = newKey.trim();
    ai = new GoogleGenAI({
      apiKey: runtimeApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return res.json({
      success: true,
      hasApiKey: true,
      keySource: 'custom',
    });
  }
  return res.status(400).json({ error: 'Invalid Gemini API Key format.' });
});

app.delete('/api/config/apikey', (_req, res) => {
  runtimeApiKey = process.env.GEMINI_API_KEY || '';
  ai = runtimeApiKey
    ? new GoogleGenAI({
        apiKey: runtimeApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;
  return res.json({
    success: true,
    hasApiKey: Boolean(runtimeApiKey && runtimeApiKey.trim().length > 5),
    keySource: runtimeApiKey ? 'env' : 'none',
  });
});

// Core Gemini Response Orchestration Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, systemInstruction, history, memories } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const client = getGenAIClient();
    if (!client) {
      return res.status(200).json({
        text: '',
        fallback: true,
        reason: 'NO_API_KEY',
      });
    }

    const previousModelMessages: string[] = [];
    const previousModelSentences: string[] = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-50)) {
        if (!item || typeof item.text !== 'string' || !item.text.trim()) continue;
        if (item.role !== 'user') {
          previousModelMessages.push(item.text.trim());
          const sentences = item.text
            .split(/(?:\|\||[.!?\n])+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 6);
          previousModelSentences.push(...sentences);
        }
      }
    }

    const uniquePastSentences = Array.from(new Set(previousModelSentences)).slice(-25);
    const contents = buildNormalizedContents(history, prompt);

    const orchestrationDirective = `
[DIRECT-REACTION & SPONTANEOUS DIALOGUE DIRECTIVES]:
1. REACT DIRECTLY TO THE USER'S MESSAGE FIRST:
   - Your very first sentence/bubble MUST react directly to the specific topic, emotion, detail, or question in the user's latest message: "${prompt.slice(0, 240)}".
   - Answer their question or address what they just said before adding your own thoughts, banter, or follow-up question.
2. 100%AUTHENTIC CANON VOICE — FORBID AI FILLER PHRASES:
   - NEVER use generic AI filler phrases such as "As an AI...", "I understand how you feel", "How can I assist you today?", "I'm here to help", or customer-support language.
   - Sound 100% like a real text message sent directly from this character's phone in their distinct canon personality.
3. CLEAN MULTI-BUBBLE PACING (MAXIMUM 2–3 SHORT BUBBLES):
   - Keep replies concise and natural like real mobile texting.
   - If splitting into multiple thoughts, separate them with ' || ', using a MAXIMUM of 2 to 3 short, natural text bubbles per reply so typing delays finish smoothly.
   - NEVER use roleplay asterisks (*sighs*) or third-person narration.
4. ZERO REPETITION OR SCRIPTED LOOPS:
   - Formulate a completely unique, spontaneous reply every turn.
   - Unless the user explicitly brings them up, NEVER mention nagging about drinking water, going to sleep / 6 AM, posture, Blitzø eating cereal/slamming cabinets, or Stolas sighing on the pullout sofa.
${
  uniquePastSentences.length > 0
    ? `5. PREVIOUSLY SENT LINES (DO NOT REPEAT OR PARAPHRASE THESE):
${uniquePastSentences.map((l: string) => `   - "${l}"`).join('\n')}`
    : ''
}`;

    const memoryConstraint =
      Array.isArray(memories) && memories.length > 0
        ? `\n\n[EPISODIC MEMORIES OF THIS USER (UP TO 75 ACTIVE FACTS)]:
You remember these facts about the user (only weave one in if it naturally connects to what they just said):
${memories.slice(0, 75).map((m: string) => `- ${m}`).join('\n')}`
        : '';

    const enhancedSystemInstruction = `${systemInstruction || 'You are an authentic direct messaging participant.'}
${memoryConstraint}
${orchestrationDirective}`;

    const now = Date.now();
    const availableModels = CANDIDATE_MODELS.filter(
      m => !modelCooldownUntil[m] || modelCooldownUntil[m] < now
    );
    const modelsToTry = availableModels.length > 0 ? availableModels : CANDIDATE_MODELS;

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: enhancedSystemInstruction,
            temperature: 0.85,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 400,
          },
        });

        let reply = (response.text || '').trim();
        if (!reply) continue;

        // Post-generation Semantic Deduplication & Anti-Filler Gate
        const semCheck = checkSemanticRepetitionOnServer(reply, previousModelMessages, prompt);
        if (semCheck.isRepetitive) {
          try {
            const rewritePrompt = `${prompt}\n\n[DIRECTOR REWRITE NOTE: Your draft ("${reply.slice(
              0,
              120
            )}") was rejected (${semCheck.reason}). Write a completely fresh, spontaneous in-character text message that reacts directly to the specific topic, emotion, and question in "${prompt.slice(
              0,
              160
            )}". Max 2–3 short bubbles separated by ' || '. Zero AI filler or repeated lines.]`;

            const rewriteContents = buildNormalizedContents(history, rewritePrompt);
            const rewriteResponse = await client.models.generateContent({
              model: modelName,
              contents: rewriteContents,
              config: {
                systemInstruction: enhancedSystemInstruction,
                temperature: 0.85,
                topP: 0.95,
                maxOutputTokens: 400,
              },
            });

            const rewritten = (rewriteResponse.text || '').trim();
            if (rewritten) {
              reply = rewritten;
            }
          } catch {
            // Preserve the primary generated reply if the optional rewrite pass fails
          }
        }

        if (reply) {
          const finalReply = sanitizeAndCapBubbles(reply);
          return res.json({ text: finalReply, model: modelName });
        }
      } catch (modelErr: unknown) {
        const msg = modelErr instanceof Error ? modelErr.message : String(modelErr);
        console.warn(`[EchoVault /api/chat] Model ${modelName} error:`, msg);
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
          modelCooldownUntil[modelName] = Date.now() + 5 * 60 * 1000;
        }
        continue;
      }
    }

    return res.status(200).json({
      text: '',
      fallback: true,
      reason: 'QUOTA_EXHAUSTED_FALLBACK',
    });
  } catch (err) {
    console.error('[EchoVault /api/chat] Unhandled error:', err);
    return res.status(200).json({
      text: '',
      fallback: true,
      reason: 'FALLBACK',
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`PulseDirect server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
