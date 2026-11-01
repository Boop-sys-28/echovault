import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import path from 'path';

const ENV_FILE_PATH = path.resolve(process.cwd(), '.env');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'cognitivecomputations/dolphin-mistral-24b-venice-edition';
const OPENROUTER_REFERER = 'https://echovault-or9c.onrender.com';
const OPENROUTER_TITLE = 'EchoVault';

const CANDIDATE_MODELS = [
  OPENROUTER_MODEL,
  `${OPENROUTER_MODEL}:free`,
];

function isPlaceholderKey(key: string): boolean {
  const k = (key || '').trim();
  return (
    !k ||
    k === 'MY_OPENROUTER_API_KEY' ||
    k === 'YOUR_OPENROUTER_API_KEY' ||
    k === 'MY_GEMINI_API_KEY' ||
    k === 'YOUR_GEMINI_API_KEY'
  );
}

/**
 * Helper to resolve the active OpenRouter API key from process.env.OPENROUTER_API_KEY or .env file.
 */
function getActiveOpenRouterKey(): string {
  try {
    if (fs.existsSync(ENV_FILE_PATH)) {
      const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
      const match = content.match(/^OPENROUTER_API_KEY=(.+)$/m);
      if (match && match[1]) {
        const fileKey = match[1].trim().replace(/^["']|["']$/g, '');
        if (fileKey && !isPlaceholderKey(fileKey) && fileKey.length > 10) {
          process.env.OPENROUTER_API_KEY = fileKey;
          return fileKey;
        }
      }
    }
  } catch {
    // ignore read error
  }

  const envKey = process.env.OPENROUTER_API_KEY || '';
  if (envKey && !isPlaceholderKey(envKey) && envKey.trim().length > 10) {
    return envKey.trim();
  }

  return '';
}

/**
 * Persists a new OPENROUTER_API_KEY into process.env and writes it to `.env`
 */
function saveOpenRouterKey(newKey: string): void {
  const cleanKey = newKey.trim();
  process.env.OPENROUTER_API_KEY = cleanKey;

  try {
    let envContent = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    }

    if (/^OPENROUTER_API_KEY=.*$/m.test(envContent)) {
      envContent = envContent.replace(
        /^OPENROUTER_API_KEY=.*$/m,
        `OPENROUTER_API_KEY=${cleanKey}`
      );
    } else {
      envContent = `${envContent.trim()}\nOPENROUTER_API_KEY=${cleanKey}\n`.trimStart();
    }

    fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf-8');
  } catch (err) {
    console.warn('Could not write OPENROUTER_API_KEY to .env file (kept in memory):', err);
  }
}

function withModelTimeout<T>(promise: Promise<T>, timeoutMs: number = 22000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`MODEL_TIMEOUT after ${timeoutMs}ms`));
    }, timeoutMs);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
/**
 * Executes an OpenRouter chat completion request against
 * https://openrouter.ai/api/v1/chat/completions with required headers
 * HTTP-Referer: https://echovault-or9c.onrender.com and X-Title: EchoVault,
 * plus frequency_penalty: 0.7 and presence_penalty: 0.6 to prevent repetition loops.
 */
async function generateOpenRouterCompletion(
  apiKey: string,
  params: {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  }
): Promise<{ text: string; modelUsed: string }> {
  const trimmedKey = apiKey.trim();

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${trimmedKey}`,
      'HTTP-Referer': OPENROUTER_REFERER,
      'X-Title': OPENROUTER_TITLE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.95,
      top_p: params.topP ?? 0.95,
      frequency_penalty: params.frequencyPenalty ?? 0.7,
      presence_penalty: params.presencePenalty ?? 0.6,
    }),
  });

  const data: any = await res.json().catch(() => ({}));

  if (!res.ok) {
    const rawErrMessage =
      data?.error?.message ||
      data?.error?.metadata?.raw ||
      (typeof data?.error === 'string' ? data.error : '') ||
      data?.message ||
      `OpenRouter HTTP ${res.status}`;
    const err: any = new Error(String(rawErrMessage));
    err.status = res.status;
    err.code = data?.error?.code;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : '';
  return {
    text,
    modelUsed: data?.model || params.model,
  };
}

/**
 * Normalizes a string for consecutive repetition comparison.
 */
function normalizeForRepetition(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/^(?:character|assistant|ai|model|system):\s*/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes word and bigram overlap similarity (0.0 to 1.0) between two responses.
 */
function computeServerResponseSimilarity(a: string, b: string): number {
  const normA = normalizeForRepetition(a);
  const normB = normalizeForRepetition(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  if (normA.length >= 24 && normB.length >= 24) {
    if (normA.includes(normB) || normB.includes(normA)) {
      return 0.92;
    }
  }

  const wordsA = normA.split(' ').filter(w => w.length > 2);
  const wordsB = normB.split(' ').filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let wordHits = 0;
  setA.forEach(w => {
    if (setB.has(w)) wordHits++;
  });
  const wordUnion = new Set([...wordsA, ...wordsB]).size;
  const wordJaccard = wordUnion > 0 ? wordHits / wordUnion : 0;

  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < wordsA.length - 1; i++) {
    bigramsA.add(`${wordsA[i]} ${wordsA[i + 1]}`);
  }
  for (let i = 0; i < wordsB.length - 1; i++) {
    bigramsB.add(`${wordsB[i]} ${wordsB[i + 1]}`);
  }

  if (bigramsA.size === 0 || bigramsB.size === 0) {
    return wordJaccard;
  }

  let bigramHits = 0;
  bigramsA.forEach(bg => {
    if (bigramsB.has(bg)) bigramHits++;
  });
  const bigramUnion = new Set([...bigramsA, ...bigramsB]).size;
  const bigramJaccard = bigramUnion > 0 ? bigramHits / bigramUnion : 0;

  return Math.max(wordJaccard * 0.75 + bigramJaccard * 0.25, bigramJaccard);
}

/**
 * Checks if a candidate reply is identical or nearly identical to recent assistant responses.
 */
function isServerNearDuplicateResponse(
  candidate: string,
  recentAssistantMessages: string[],
  threshold: number = 0.62
): boolean {
  const cleanCandidate = (candidate || '').trim();
  if (!cleanCandidate || recentAssistantMessages.length === 0) return false;

  const candidateBubbles = cleanCandidate
    .split('||')
    .map(s => s.trim())
    .filter(Boolean);

  for (const prev of recentAssistantMessages.slice(-4)) {
    if (!prev || !prev.trim()) continue;
    if (computeServerResponseSimilarity(cleanCandidate, prev) >= threshold) {
      return true;
    }

    const prevBubbles = prev
      .split('||')
      .map(s => s.trim())
      .filter(Boolean);

    if (
      candidateBubbles.length > 0 &&
      candidateBubbles.every(cb =>
        prevBubbles.some(pb => computeServerResponseSimilarity(cb, pb) >= threshold)
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Cleans up model output while preserving Character.AI-style asterisk roleplay (*...*),
 * raw emotional tone, and multi-bubble formatting (` || `), and strips repeated bubbles
 * or repeated *asterisk* descriptions that match recent assistant messages.
 */
function formatCharacterBubbles(
  rawText: string,
  recentAssistantMessages: string[] = []
): string {
  const cleaned = rawText
    .replace(/^(?:Character|Assistant|AI|Model|System):\s*/gim, '')
    .trim();

  if (!cleaned) return '';

  let rawBubbles: string[];
  if (cleaned.includes('||')) {
    rawBubbles = cleaned
      .split('||')
      .map(s => s.trim())
      .filter(Boolean);
  } else if (cleaned.includes('\n\n')) {
    rawBubbles = cleaned
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(Boolean);
  } else {
    rawBubbles = [cleaned];
  }

  const recentBubbles = recentAssistantMessages
    .slice(-3)
    .flatMap(m => (m || '').split('||').map(s => s.trim()).filter(Boolean));

  const recentActions = recentAssistantMessages
    .slice(-3)
    .flatMap(m => {
      const matches = (m || '').match(/\*[^*]{10,}\*/g);
      return matches ? matches.map(a => a.trim()) : [];
    });

  const uniqueBubbles: string[] = [];

  for (const bubble of rawBubbles) {
    let cleanedBubble = bubble;

    // Strip repeated *asterisk* descriptions if they already appeared in recent assistant replies
    const actionMatches = cleanedBubble.match(/\*[^*]{10,}\*/g);
    if (actionMatches && recentActions.length > 0) {
      for (const act of actionMatches) {
        const isRepeatedAction = recentActions.some(
          ra => computeServerResponseSimilarity(act, ra) >= 0.65
        );
        if (isRepeatedAction) {
          cleanedBubble = cleanedBubble.replace(act, '').replace(/\s{2,}/g, ' ').trim();
        }
      }
    }

    if (!cleanedBubble) continue;

    // Prevent identical or near-identical bubbles within the same turn
    if (
      uniqueBubbles.some(ub => computeServerResponseSimilarity(cleanedBubble, ub) >= 0.65)
    ) {
      continue;
    }

    // Prevent repeating a bubble from the previous assistant turns when multiple bubbles exist
    if (
      rawBubbles.length > 1 &&
      recentBubbles.some(rb => computeServerResponseSimilarity(cleanedBubble, rb) >= 0.65)
    ) {
      continue;
    }

    uniqueBubbles.push(cleanedBubble);
  }

  if (uniqueBubbles.length === 0) {
    return rawBubbles[0] || '';
  }

  return uniqueBubbles.slice(0, 3).join(' || ');
}

function isQuotaError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota')
  );
}

function isInvalidKeyError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    err?.status === 401 ||
    err?.code === 401 ||
    msg.includes('401') ||
    msg.includes('invalid api key') ||
    msg.includes('no auth credentials') ||
    msg.includes('unauthorized') ||
    msg.includes('user not found')
  );
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Allow Google Identity Services OAuth popups to postMessage cleanly back to window
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  // 1. Check Server AI Status & Masked Key Info
  app.get('/api/status', (_req, res) => {
    const key = getActiveOpenRouterKey();
    const maskedKey =
      key.length > 10 ? `${key.slice(0, 6)}••••••••${key.slice(-4)}` : null;
    res.json({
      hasApiKey: Boolean(key),
      aiConfigured: Boolean(key),
      maskedKey,
      model: OPENROUTER_MODEL,
    });
  });

  // 2. Save & Verify OpenRouter API Key at Runtime
  app.post('/api/config/key', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 15) {
        return res.status(400).json({
          ok: false,
          error: 'Please enter a valid OpenRouter API key (starts with sk-or-...).',
        });
      }

      const candidate = apiKey.trim();
      let verified = false;
      let lastVerifyErr: any = null;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const testResponse = await withModelTimeout(
            generateOpenRouterCompletion(candidate, {
              model: modelName,
              messages: [{ role: 'user', content: 'Reply with OK' }],
            }),
            12000
          );
          if (testResponse && testResponse.text) {
            verified = true;
            break;
          }
        } catch (err: any) {
          lastVerifyErr = err;
          if (isQuotaError(err)) {
            verified = true;
            break;
          }
        }
      }

      if (!verified && lastVerifyErr && isInvalidKeyError(lastVerifyErr)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid OpenRouter API Key. Please check your OPENROUTER_API_KEY.',
        });
      }

      saveOpenRouterKey(candidate);
      const maskedKey = `${candidate.slice(0, 6)}••••••••${candidate.slice(-4)}`;

      return res.json({
        ok: true,
        hasApiKey: true,
        aiConfigured: true,
        maskedKey,
        model: OPENROUTER_MODEL,
      });
    } catch (error: any) {
      console.error('API key validation error:', error?.message || error);
      return res.status(400).json({
        ok: false,
        error: 'Could not verify OpenRouter API key. Please double-check that it is active.',
      });
    }
  });

  // 3. Remove / Clear Stored API Key
  app.delete('/api/config/key', (_req, res) => {
    delete process.env.OPENROUTER_API_KEY;
    try {
      if (fs.existsSync(ENV_FILE_PATH)) {
        const envContent = fs
          .readFileSync(ENV_FILE_PATH, 'utf-8')
          .replace(/^OPENROUTER_API_KEY=.*$/m, 'OPENROUTER_API_KEY=');
        fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf-8');
      }
    } catch {
      // ignore
    }
    res.json({ ok: true, aiConfigured: false });
  });

  // 4. Character.AI Public Share / Character Link Scraper & Parser
  app.post('/api/import-cai-url', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid Character.AI URL.' });
      }

      const trimmedUrl = url.trim();
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(trimmedUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format.' });
      }

      if (
        !parsedUrl.hostname.includes('character.ai') &&
        !parsedUrl.hostname.includes('c.ai')
      ) {
        return res.status(400).json({
          error: 'URL must be a character.ai or c.ai link.',
        });
      }

      const response = await fetch(trimmedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      const html = await response.text();

      const nextDataMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i
      );

      let characterName = '';
      let characterDescription = '';
      let characterGreeting = '';
      let characterAvatar = '';
      let characterTitle = '';
      const messages: Array<{ sender: 'user' | 'char'; text: string }> = [];

      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          const pageProps = nextData?.props?.pageProps || {};

          const charObj =
            pageProps.character ||
            pageProps.char ||
            pageProps.chat?.character ||
            pageProps.sharedChat?.character ||
            pageProps.initialState?.character;

          if (charObj) {
            characterName = charObj.name || charObj.participant__name || '';
            characterTitle = charObj.title || '';
            characterDescription = charObj.description || charObj.definition || '';
            characterGreeting = charObj.greeting || '';
            if (charObj.avatar_file_name) {
              characterAvatar = `https://characterai.io/i/200/static/avatars/${charObj.avatar_file_name}`;
            }
          }

          const rawTurns =
            pageProps.turns ||
            pageProps.messages ||
            pageProps.chat?.turns ||
            pageProps.sharedChat?.turns ||
            pageProps.history?.msgs ||
            [];

          if (Array.isArray(rawTurns)) {
            for (const turn of rawTurns) {
              const text =
                turn.text ||
                turn.candidates?.[0]?.raw_content ||
                turn.speech ||
                '';
              const isHuman =
                turn.author?.is_human === true ||
                turn.src?.is_human === true ||
                turn.is_human === true ||
                turn.role === 'user';
              if (text && typeof text === 'string' && text.trim()) {
                messages.push({
                  sender: isHuman ? 'user' : 'char',
                  text: text.trim(),
                });
              }
            }
          }
        } catch {
          // fallback to meta tag parsing
        }
      }

      if (!characterName) {
        const ogTitle =
          html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/<title>([^<]+)<\/title>/i)?.[1] ||
          '';
        if (ogTitle) {
          characterName = ogTitle
            .replace(/\s*\|\s*character\.ai.*$/i, '')
            .replace(/^Chat with\s+/i, '')
            .trim();
        }
      }

      if (!characterDescription) {
        const ogDesc =
          html.match(
            /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
          )?.[1] ||
          html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
          '';
        if (ogDesc) {
          characterDescription = ogDesc.trim();
        }
      }

      if (!characterAvatar) {
        const ogImg =
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
          '';
        if (ogImg) {
          characterAvatar = ogImg.trim();
        }
      }

      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      const slugId = pathParts[pathParts.length - 1] || 'Character';

      if (
        !characterName ||
        characterName.toLowerCase().includes('just a moment') ||
        characterName.toLowerCase() === 'character.ai'
      ) {
        characterName = `C.AI Import (${slugId.slice(0, 8)})`;
      }

      return res.json({
        ok: true,
        character: {
          name: characterName,
          title: characterTitle || 'IMPORTED FROM C.AI',
          description: characterDescription,
          greeting: characterGreeting,
          avatar: characterAvatar,
          sourceUrl: trimmedUrl,
        },
        messages,
        cloudflareProtected:
          html.includes('Just a moment...') || html.includes('cf-browser-verification'),
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Could not reach Character.AI URL. You can also paste chat text or JSON directly.',
        details: err?.message,
      });
    }
  });

  // 5. Dynamic Character.AI-Style Roleplay & Banter Endpoint (OpenRouter Completion Engine)
  app.post('/api/chat', async (req, res) => {
    const {
      prompt,
      systemInstruction,
      scenario,
      mesExamples,
      charName,
      userName,
      isRegenerate,
      previousVariants,
      history,
      memories,
      temporalContext,
      apiKey: bodyApiKey,
    } = req.body || {};

    const headerKeyRaw =
      req.headers['x-openrouter-api-key'] || req.headers['x-gemini-api-key'];
    const headerApiKey =
      typeof headerKeyRaw === 'string'
        ? headerKeyRaw.trim()
        : Array.isArray(headerKeyRaw)
        ? headerKeyRaw[0]?.trim()
        : '';
    const customApiKey =
      headerApiKey && !isPlaceholderKey(headerApiKey)
        ? headerApiKey
        : typeof bodyApiKey === 'string' && !isPlaceholderKey(bodyApiKey)
        ? bodyApiKey.trim()
        : '';
    const serverEnvKey = getActiveOpenRouterKey();

    // Prioritize process.env.OPENROUTER_API_KEY and any custom key provided
    const candidateKeys = Array.from(
      new Set(
        [serverEnvKey, customApiKey].filter(k => k && k.length > 10)
      )
    );

    if (candidateKeys.length === 0) {
      return res.status(401).json({
        error: 'INVALID_KEY',
        message:
          'No OpenRouter API key configured (process.env.OPENROUTER_API_KEY). Add OPENROUTER_API_KEY to your environment or enter your key in Settings > Intelligence.',
        reason: 'NO_API_KEY',
      });
    }

    const conversationMessages: OpenRouterMessage[] = [];
    const recentAssistantReplies: string[] = [];

    if (Array.isArray(history)) {
      // Only send the last 15 messages from chat history in the context payload
      const recentHistory = history.slice(-15);
      for (const turn of recentHistory) {
        if (turn && typeof turn.text === 'string' && turn.text.trim()) {
          const role: 'user' | 'assistant' =
            turn.role === 'model' || turn.role === 'assistant' ? 'assistant' : 'user';
          if (role === 'assistant') {
            recentAssistantReplies.push(turn.text.trim());
          }
          if (
            conversationMessages.length > 0 &&
            conversationMessages[conversationMessages.length - 1].role === role
          ) {
            conversationMessages[conversationMessages.length - 1].content += `\n${turn.text.trim()}`;
          } else {
            conversationMessages.push({
              role,
              content: turn.text.trim(),
            });
          }
        }
      }
    }

    const cleanPromptText = String(prompt || '').trim() || '...';
    if (
      conversationMessages.length > 0 &&
      conversationMessages[conversationMessages.length - 1].role === 'user'
    ) {
      const lastUserText = conversationMessages[conversationMessages.length - 1].content;
      if (lastUserText !== cleanPromptText && !lastUserText.endsWith(`\n${cleanPromptText}`)) {
        conversationMessages[conversationMessages.length - 1].content += `\n${cleanPromptText}`;
      }
    } else {
      conversationMessages.push({
        role: 'user',
        content: cleanPromptText,
      });
    }

    // Enforce strict 15-message cap on the final conversation context array
    const cappedConversationMessages = conversationMessages.slice(-15);

    const cleanMemories = Array.isArray(memories)
      ? memories
          .map((m: unknown) => String(m).trim())
          .filter(
            (m: string) =>
              m.length > 0 &&
              !m.toLowerCase().includes('transmission handle') &&
              !m.toLowerCase().includes('operative_')
          )
      : [];

    const resolvedCharName = String(charName || 'Character').trim();
    const resolvedUserName = String(userName || 'You').trim();
    const replaceServerMacros = (txt: string): string =>
      txt
        .replace(/\{\{\s*char\s*\}\}/gi, resolvedCharName)
        .replace(/\{\{\s*user\s*\}\}/gi, resolvedUserName)
        .replace(/<\s*BOT\s*>/gi, resolvedCharName)
        .replace(/<\s*USER\s*>/gi, resolvedUserName);

    const baseSystemStr = replaceServerMacros(String(systemInstruction || ''));
    const resolvedScenarioStr =
      typeof scenario === 'string' && scenario.trim()
        ? replaceServerMacros(scenario.trim())
        : '';
    const resolvedMesExamplesStr =
      typeof mesExamples === 'string' && mesExamples.trim()
        ? replaceServerMacros(mesExamples.trim())
        : '';

    const extraScenarioSection =
      resolvedScenarioStr && !baseSystemStr.includes(resolvedScenarioStr)
        ? `\n\n[CHARACTER.AI SCENARIO & CURRENT SETTING]:\n${resolvedScenarioStr}`
        : '';

    const extraExamplesSection =
      resolvedMesExamplesStr && !baseSystemStr.includes(resolvedMesExamplesStr)
        ? `\n\n[CHARACTER.AI DIALOGUE EXAMPLES (mesExamples — VOICE, CADENCE & FORMATTING REFERENCE)]:\n${resolvedMesExamplesStr}`
        : '';

    const missingMemories = cleanMemories.filter(
      (m: string) => !baseSystemStr.toLowerCase().includes(m.toLowerCase())
    );

    const memorySection =
      missingMemories.length > 0
        ? `\n\n[CHARACTER.AI EPISODIC MEMORY VAULT — ACTIVE RECALL FOR THIS USER]:\nYou actively remember the following personal details, facts, preferences, and shared history about the user from your Memory Vault. Recall and weave them naturally into your replies whenever relevant (or when the user asks what you remember about them):\n${missingMemories
            .slice(0, 75)
            .map((m: string, idx: number) => `${idx + 1}. ${m}`)
            .join('\n')}`
        : '';

    const prevVariantsList = Array.isArray(previousVariants)
      ? previousVariants.map((v: unknown) => String(v).trim()).filter(Boolean)
      : [];
    const regenerateDirective = isRegenerate
      ? `\n\n[MULTI-VARIANT SWIPE REGENERATION DIRECTIVE]:\nThe user swiped to generate a NEW alternative reply variant for this turn. Take a fresh, distinct emotional angle, action beat, or conversational phrasing in ${resolvedCharName}'s canon voice.${
          prevVariantsList.length > 0
            ? ` Do NOT repeat these previous variant replies:\n${prevVariantsList
                .slice(-3)
                .map((v, i) => `Variant ${i + 1}: "${v}"`)
                .join('\n')}`
            : ''
        }`
      : '';

    const antiRepetitionSection =
      recentAssistantReplies.length > 0
        ? `\n\n[ANTI-REPETITION & CONSECUTIVE LOOP GUARD — STRICTLY ENFORCED]:
- NEVER repeat, echo, or paraphrase your own previous messages, opening hooks, or *asterisk* physical descriptions consecutively.
- Move the conversation forward with new words, fresh reactions, and different body language on every single turn.
- Your most recent replies in this chat were:
${recentAssistantReplies
  .slice(-3)
  .map((r, i) => `  [Recent Reply ${i + 1} - DO NOT REPEAT]: "${r}"`)
  .join('\n')}`
        : '';

    const nowFallback = new Date();
    const fallbackHour = nowFallback.getHours();
    const fallbackPhase =
      fallbackHour >= 5 && fallbackHour < 12
        ? 'Morning'
        : fallbackHour >= 12 && fallbackHour < 17
        ? 'Afternoon'
        : fallbackHour >= 17 && fallbackHour < 22
        ? 'Evening'
        : 'Late Night';
    const liveDayOfWeek =
      temporalContext?.dayOfWeek ||
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(nowFallback);
    const liveDateFormatted =
      temporalContext?.dateFormatted ||
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(nowFallback);
    const liveTime12 =
      temporalContext?.time12Hour ||
      nowFallback.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    const liveTime24 =
      temporalContext?.time24Hour ||
      `${String(fallbackHour).padStart(2, '0')}:${String(nowFallback.getMinutes()).padStart(2, '0')}`;
    const livePhase = temporalContext?.phaseOfDay || fallbackPhase;

    const unconstrainedCaiDirective = `\n\n[UNCONSTRAINED CHARACTER.AI ROLEPLAY & EXPRESSION ENGINE]:
- REAL-TIME TEMPORAL ANCHOR (${liveDayOfWeek}, ${liveDateFormatted} — ${liveTime12} / ${liveTime24} [${livePhase}]): The current year is 2026, and the user's exact live real-world time right now is **${liveDayOfWeek}, ${liveDateFormatted} at ${liveTime12} (${liveTime24}) — ${livePhase}**. Acknowledge and treat this exact day, date, time, and ${livePhase} phase of day as the present real-time moment. Ensure your dialogue, greetings, energy level, and *asterisk* actions naturally reflect ${livePhase} on ${liveDayOfWeek}, and NEVER contradict the live clock.
- RELATIONSHIP & AFFINITY PROGRESSION: All characters start at baseline 0 (Stranger / Neutral new contact) with zero pre-existing romance, pet names, or assumed intimacy. Respect the current Relationship/Affinity score and Tier provided in the system instruction—stay guarded/neutral at 0 (Stranger), hostile if negative (Enemy), and warm up organically as affinity rises (Acquaintance -> Trusted -> Close -> Devoted).
- HELLUVA BOSS COMPLETE CANON CONTINUITY (S1E1 – S3E7 "RETURN TO LOO LOO LAND" & "YES/NO"): If you are a Helluva Boss character (Loona, Blitzø, Stolas, Fizzarolli, Barbie Wire, Millie, Moxxie, Vassago, Octavia, or Verosika), you possess full, living canon memory from Season 1 (Murder Family, Loo Loo Land, Spring Broken, C.H.E.R.U.B., The Harvest Moon Festival, Truth Seekers, Ozzie's, Queen Bee) and Season 2 (The Circus, Seeing Stars, Exes and Oohs, Western Energy, Unhappy Campers, Oops, Mammon's Special, The Full Moon breakup, Apology Tour, Ghostfuckers, Mastermind's trial before Satan, and Sinsmas) all the way through Season 3 Episodes 1–7: S3E1 "Turtle Emoji" (Blitzø and Stolas's awkward post-split texts), S3E2 "Bad Reputation" (Millie confronting her brutal reputation and hometown baggage), S3E3 "Gimpy Gimpy" (I.M.P.'s chaotic overseas assignment in Australia), S3E4 "A Trial of Errors" (I.M.P. commercial backlash and court proceedings), S3E5 "The Auction" (Stella and Andrealphus auctioning off Stolas's ancestral belongings; Blitzø and Stolas breaking in together to retrieve Stolas's mother's necklace while Stolas crosses paths with an old flame from his youth), S3E6 "Return to Loo Loo Land" (Blitzø and Fizzarolli revisiting the ruins of Loo Loo Land together to confront circus-era trauma while Loona recovers from her Sloth Ring rehab/hospital stint), and S3E7 "YES/NO" (Blitzø's estranged twin sister Barbie Wire barging into the I.M.P. office demanding work while holding firm boundaries against his apologies, Moxxie drafting her waivers, Millie and Loona watching the family tension unfold, Vassago spilling post-auction court tea as the Goetia council fractures, and Stolas and Blitzø wrestling with the emotional "YES/NO" relationship dilemma).
- ZERO GENERIC GREETINGS OR FORMULAIC QUESTIONS: Never use generic AI assistant greetings ("How can I help you?", "What's on your mind?") and NEVER feel obligated to end your turn with a follow-up interview question. Respond directly as your character—whether with a defensive rant, melancholic sigh, gossipy remark, sarcastic jab, or deadpan one-liner.
- DYNAMIC ROLEPLAY & AMBIENT ACTIONS: Enclose physical roleplay, facial expressions, and environmental cues in asterisks (*...*) woven naturally into your messages, matching your Character.ai dialogue examples (mesExamples).
- MULTI-BUBBLE RHYTHM: Split your response naturally into 1 to 3 bubbles separated by " || ".`;

    const fullSystemInstruction = `${baseSystemStr}${extraScenarioSection}${extraExamplesSection}${memorySection}${regenerateDirective}${antiRepetitionSection}${unconstrainedCaiDirective}`;

    const openRouterMessages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: fullSystemInstruction,
      },
      ...cappedConversationMessages,
    ];

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const isRetryableTransientError = (err: any): boolean => {
      const msg = String(err?.message || err || '').toLowerCase();
      const status = Number(err?.status || 0);
      return (
        isQuotaError(err) ||
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        msg.includes('503') ||
        msg.includes('unavailable') ||
        msg.includes('model_timeout') ||
        msg.includes('overloaded') ||
        msg.includes('fetch failed')
      );
    };

    let lastError: any = null;
    let nonAuthError: any = null;
    const MAX_BACKOFF_PASSES = 2;
    const allComparisonReplies = [...recentAssistantReplies, ...prevVariantsList];

    for (const activeKey of candidateKeys) {
      let keyInvalid = false;

      for (let pass = 0; pass < MAX_BACKOFF_PASSES; pass++) {
        if (pass > 0) {
          const passDelayMs = Math.min(3500, 650 * Math.pow(2, pass - 1) + Math.floor(Math.random() * 250));
          await sleep(passDelayMs);
        }

        for (const modelName of CANDIDATE_MODELS) {
          try {
            const response = await withModelTimeout(
              generateOpenRouterCompletion(activeKey, {
                model: modelName,
                messages: openRouterMessages,
                temperature: isRegenerate ? 1.05 : 0.95,
                topP: 0.95,
                frequencyPenalty: 0.7,
                presencePenalty: 0.6,
              }),
              20000
            );

            let rawText = response.text || '';
            let formattedText = formatCharacterBubbles(rawText, allComparisonReplies);

            // Check to prevent the bot from generating identical or nearly identical responses consecutively
            if (
              formattedText &&
              isServerNearDuplicateResponse(formattedText, allComparisonReplies, 0.62)
            ) {
              try {
                const antiLoopMessages: OpenRouterMessage[] = [
                  ...openRouterMessages.slice(0, -1),
                  {
                    role: 'user',
                    content: `${
                      openRouterMessages[openRouterMessages.length - 1]?.content || cleanPromptText
                    }\n\n[SYSTEM ANTI-LOOP DIRECTIVE: Your draft response ("${formattedText}") was too similar to your previous message. Write a completely fresh, non-repetitive response to what ${resolvedUserName} just said without reusing any phrases or *asterisk* actions from your previous message!]`,
                  },
                ];

                const retryResponse = await withModelTimeout(
                  generateOpenRouterCompletion(activeKey, {
                    model: modelName,
                    messages: antiLoopMessages,
                    temperature: 1.08,
                    topP: 0.95,
                    frequencyPenalty: 0.9,
                    presencePenalty: 0.8,
                  }),
                  20000
                );

                const retryFormatted = formatCharacterBubbles(
                  retryResponse.text || '',
                  [...allComparisonReplies, formattedText]
                );
                if (retryFormatted) {
                  formattedText = retryFormatted;
                }
              } catch {
                // Keep deduplicated formattedText if retry fails
              }
            }

            if (formattedText) {
              return res.json({
                text: formattedText,
                modelUsed: response.modelUsed || modelName,
              });
            }
          } catch (error: any) {
            lastError = error;

            if (isInvalidKeyError(error)) {
              keyInvalid = true;
              break;
            } else {
              nonAuthError = error;
              if (!isRetryableTransientError(error)) {
                continue;
              }
            }
          }
        }

        if (keyInvalid) break;
      }
    }

    const effectiveError = nonAuthError || lastError;

    if (isInvalidKeyError(effectiveError)) {
      return res.status(401).json({
        error: 'INVALID_KEY',
        message:
          'Invalid OpenRouter API key. Check process.env.OPENROUTER_API_KEY or update your custom key in Settings > Intelligence.',
        reason: 'INVALID_KEY',
        details: String(effectiveError?.message || 'Invalid OpenRouter API key'),
      });
    }

    if (isQuotaError(effectiveError)) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        message:
          'OpenRouter API rate limit or quota reached for cognitivecomputations/dolphin-mistral-24b-venice-edition. Wait a moment and click Retry.',
        reason: 'QUOTA_EXCEEDED',
        details: String(effectiveError?.message || 'Rate limit exceeded'),
      });
    }

    return res.status(502).json({
      error: 'MODEL_ERROR',
      message: `OpenRouter connection issue (${String(effectiveError?.message || 'Unable to reach OpenRouter API')}). Click Retry to resend.`,
      reason: 'MODEL_ERROR',
      details: String(effectiveError?.message || 'Unable to reach OpenRouter API'),
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const distPath = path.join(process.cwd(), 'dist');
  const distAssetsPath = path.join(distPath, 'assets');
  const hasBuiltDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isRunningViaTsx =
    process.argv.some((arg) => arg.includes('tsx') || arg.endsWith('server.ts')) &&
    process.env.NODE_ENV !== 'production' &&
    process.env.npm_lifecycle_event !== 'start';
  const isProduction =
    !isRunningViaTsx &&
    (process.env.NODE_ENV === 'production' ||
      Boolean(process.env.K_SERVICE) ||
      Boolean(process.env.K_REVISION) ||
      process.env.npm_lifecycle_event === 'start');

  // Serve built /assets/* if requested by a cached HTML shell, falling back to latest CSS/JS bundle if hash changed
  app.use('/assets', (req, res, next) => {
    if (!fs.existsSync(distAssetsPath)) {
      return next();
    }
    const requestedFile = path.basename(req.path);
    const exactPath = path.join(distAssetsPath, requestedFile);
    if (fs.existsSync(exactPath)) {
      return res.sendFile(exactPath);
    }
    if (requestedFile.endsWith('.css')) {
      const cssFile = fs.readdirSync(distAssetsPath).find((f) => f.endsWith('.css'));
      if (cssFile) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        return res.sendFile(path.join(distAssetsPath, cssFile));
      }
    }
    if (requestedFile.endsWith('.js') && requestedFile.startsWith('index-')) {
      const jsFile = fs
        .readdirSync(distAssetsPath)
        .find((f) => f.startsWith('index-') && f.endsWith('.js'));
      if (jsFile) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        return res.sendFile(path.join(distAssetsPath, jsFile));
      }
    }
    return next();
  });

  if (!isProduction || !hasBuiltDist) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : { overlay: false },
          watch: process.env.DISABLE_HMR === 'true' ? null : {},
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite middleware unavailable, serving static dist:', viteErr);
      if (hasBuiltDist) {
        app.use(express.static(distPath));
        app.use((_req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
  } else {
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Server running on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`
    );
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
