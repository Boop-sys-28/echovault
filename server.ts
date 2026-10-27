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

// Multi-model orchestration pool (ordered for low latency and high quota availability)
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

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

  // 2. Check exact, substring, and semantic token overlap against recent character messages
  const candidateTokens = extractSemanticTokens(cleanCandidate);
  const candidateSet = new Set(candidateTokens);

  for (const past of pastModelMessages.slice(-50)) {
    const cleanPast = past.trim().toLowerCase();
    if (!cleanPast) continue;

    if (cleanCandidate === cleanPast) {
      return { isRepetitive: true, reason: 'Exact duplicate of a previous message' };
    }

    const pastTokens = extractSemanticTokens(cleanPast);
    if (pastTokens.length < 3 || candidateSet.size === 0) continue;

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

    if (jaccard >= 0.36 || (candidateSet.size >= 5 && containment >= 0.58)) {
      return {
        isRepetitive: true,
        reason: `High semantic similarity with previous message: "${past.slice(0, 70)}"`,
      };
    }
  }

  return { isRepetitive: false };
}

// Status check endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    model: 'gemini-3.8-flash',
  });
});

// Core Gemini Response Orchestration Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, systemInstruction, history, memories } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        text: '',
        fallback: true,
        reason: 'NO_API_KEY',
      });
    }

    if (!ai) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    const previousModelMessages: string[] = [];
    const previousModelSentences: string[] = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-50)) {
        if (!item || typeof item.text !== 'string' || !item.text.trim()) continue;
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
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

    const uniquePastSentences = Array.from(new Set(previousModelSentences)).slice(-30);

    const orchestrationDirective = `
[GEMINI CORE RESPONSE ORCHESTRATION ENGINE — ZERO SEMANTIC REPETITION & DYNAMIC PROGRESSION]:
1. ZERO SEMANTIC REPETITION:
   - Never recycle the same core message, intent, joke, or complaint from earlier in the conversation.
   - Unless the user explicitly asks about them in their latest message, NEVER mention or bring up:
     * Telling the user to "drink water" or hydrate
     * Telling the user to "go to sleep", "go to bed", "close your eyes", or lecturing about how late it is / 6 AM
     * Nagging about posture or squinting at a phone screen
     * Blitzø eating/throwing cereal or spoons, slamming kitchen cabinets, or Stolas groaning/sighing on the pullout sofa
     * Repeating static status clichés (like counting cups of black coffee)
2. CONTEXT-AWARE DYNAMIC PROGRESSION:
   - Anchor your response directly on the user's latest message: "${prompt.slice(0, 240)}".
   - React specifically to their words, answer their question or challenge their point, and introduce a brand-new thought, micro-action, personal observation, or engaging follow-up question that moves the conversation forward into new territory.
${
  uniquePastSentences.length > 0
    ? `3. PREVIOUSLY DELIVERED LINES (STRICTLY FORBIDDEN TO REPEAT OR PARAPHRASE IN MEANING OR INTENT):
${uniquePastSentences.map((l: string) => `   - "${l}"`).join('\n')}`
    : ''
}`;

    const memoryConstraint =
      Array.isArray(memories) && memories.length > 0
        ? `\n\n[EPISODIC MEMORIES OF THIS USER (UP TO 75 ACTIVE FACTS)]:
You remember these facts about the user (only weave one in if it naturally connects to the current topic—never repeat a memory you just mentioned):
${memories.slice(0, 75).map((m: string) => `- ${m}`).join('\n')}`
        : '';

    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const enhancedSystemInstruction = `${systemInstruction || 'You are an authentic direct messaging participant.'}

[CREATIVE FREEDOM & CANONICAL VOICE DIRECTIVE]:
Stay 100% in character with natural, expressive mobile texting. Never use roleplay asterisks (*sighs*) or robotic disclaimers.
${memoryConstraint}
${orchestrationDirective}`;

    const now = Date.now();
    const availableModels = CANDIDATE_MODELS.filter(
      m => !modelCooldownUntil[m] || modelCooldownUntil[m] < now
    );
    const modelsToTry = availableModels.length > 0 ? availableModels : CANDIDATE_MODELS;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: enhancedSystemInstruction,
            temperature: 0.95,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 900,
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
            ] as any,
          },
        });

        let reply = (response.text || '').trim();
        if (!reply) continue;

        // Post-generation Semantic Deduplication Gate:
        // Scan candidate against recent dialogue history & banned tropes before returning.
        const semCheck = checkSemanticRepetitionOnServer(reply, previousModelMessages, prompt);
        if (semCheck.isRepetitive) {
          // Run a targeted Gemini Semantic Rewrite pass to guarantee zero repetition and fresh progression
          const rewriteResponse = await ai.models.generateContent({
            model: modelName,
            contents: [
              ...contents,
              {
                role: 'model',
                parts: [{ text: reply }],
              },
              {
                role: 'user',
                parts: [
                  {
                    text: `[ORCHESTRATOR REJECTION — SEMANTIC REPETITION DETECTED: ${semCheck.reason}].
Discard your draft above completely. Write a brand-new response in character that:
1. Directly responds to the user's message ("${prompt}") and advances the topic with a fresh thought, question, or observation.
2. Does NOT mention sleep, water, posture, cereal, spoons, cabinets, or Stolas on the sofa.
3. Shares zero overlap in meaning or wording with your previous messages. Output ONLY the in-character text message.`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: enhancedSystemInstruction,
              temperature: 1.0,
              topP: 0.95,
              maxOutputTokens: 700,
            },
          });

          const rewritten = (rewriteResponse.text || '').trim();
          if (rewritten) {
            reply = rewritten;
          }
        }

        if (reply) {
          return res.json({ text: reply, model: modelName });
        }
      } catch (modelErr: unknown) {
        const msg = modelErr instanceof Error ? modelErr.message : String(modelErr);
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
          modelCooldownUntil[modelName] = Date.now() + 15 * 60 * 1000;
          continue;
        }
        continue;
      }
    }

    return res.status(200).json({
      text: '',
      fallback: true,
      reason: 'QUOTA_EXHAUSTED_FALLBACK',
    });
  } catch {
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
