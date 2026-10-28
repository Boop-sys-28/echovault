import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const ENV_FILE_PATH = path.resolve(process.cwd(), '.env');

/**
 * Helper to resolve the active Gemini API key from environment or .env file.
 */
function getActiveGeminiKey(): string {
  const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (
    envKey &&
    envKey !== 'MY_GEMINI_API_KEY' &&
    envKey !== 'YOUR_GEMINI_API_KEY' &&
    envKey.trim().length > 10
  ) {
    return envKey.trim();
  }

  try {
    if (fs.existsSync(ENV_FILE_PATH)) {
      const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
      const match = content.match(/^GEMINI_API_KEY=(.+)$/m);
      if (match && match[1]) {
        const fileKey = match[1].trim().replace(/^["']|["']$/g, '');
        if (
          fileKey &&
          fileKey !== 'MY_GEMINI_API_KEY' &&
          fileKey !== 'YOUR_GEMINI_API_KEY' &&
          fileKey.length > 10
        ) {
          process.env.GEMINI_API_KEY = fileKey;
          return fileKey;
        }
      }
    }
  } catch {
    // ignore read error
  }

  return '';
}

/**
 * Persists a new GEMINI_API_KEY into process.env and writes it to `.env`
 */
function saveGeminiKey(newKey: string): void {
  const cleanKey = newKey.trim();
  process.env.GEMINI_API_KEY = cleanKey;

  try {
    let envContent = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    }

    if (/^GEMINI_API_KEY=.*$/m.test(envContent)) {
      envContent = envContent.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${cleanKey}`);
    } else {
      envContent = `${envContent.trim()}\nGEMINI_API_KEY=${cleanKey}\n`.trimStart();
    }

    fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf-8');
  } catch (err) {
    console.warn('Could not write GEMINI_API_KEY to .env file (kept in memory):', err);
  }
}

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

function withModelTimeout<T>(promise: Promise<T>, timeoutMs: number = 16000): Promise<T> {
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

function createGenAiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Cleans up model output while preserving Character.AI-style asterisk roleplay (*...*),
 * raw emotional tone, and multi-bubble formatting (` || `).
 */
function formatCharacterBubbles(rawText: string): string {
  const cleaned = rawText
    .replace(/^(?:Character|Assistant|AI|Model|System):\s*/gim, '')
    .trim();

  if (!cleaned) return '';

  let bubbles: string[];
  if (cleaned.includes('||')) {
    bubbles = cleaned
      .split('||')
      .map(s => s.trim())
      .filter(Boolean);
  } else if (cleaned.includes('\n\n')) {
    bubbles = cleaned
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(Boolean);
  } else {
    bubbles = [cleaned];
  }

  return bubbles.slice(0, 3).join(' || ');
}

function isQuotaError(err: any): boolean {
  const msg = String(err?.message || err || '');
  return (
    err?.status === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota')
  );
}

function isInvalidKeyError(err: any): boolean {
  const msg = String(err?.message || err || '');
  return (
    err?.status === 401 ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('key not valid') ||
    msg.includes('invalid api key')
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
    const key = getActiveGeminiKey();
    const maskedKey =
      key.length > 10 ? `${key.slice(0, 6)}••••••••${key.slice(-4)}` : null;
    res.json({
      hasApiKey: Boolean(key),
      aiConfigured: Boolean(key),
      maskedKey,
      model: CANDIDATE_MODELS[0],
    });
  });

  // 2. Save & Verify Gemini API Key at Runtime
  app.post('/api/config/key', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 15) {
        return res.status(400).json({
          ok: false,
          error: 'Please enter a valid Gemini API key (starts with AIza...).',
        });
      }

      const candidate = apiKey.trim();

      const ai = createGenAiClient(candidate);
      let verified = false;
      let lastVerifyErr: any = null;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const testResponse = await withModelTimeout(
            ai.models.generateContent({
              model: modelName,
              contents: 'Reply with OK',
            }),
            10000
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

      if (!verified && lastVerifyErr) {
        const msg = String(lastVerifyErr?.message || '');
        if (msg.includes('API_KEY_INVALID') || msg.includes('key not valid')) {
          return res.status(400).json({
            ok: false,
            error: 'Invalid Gemini API Key. Please check your key in Google AI Studio.',
          });
        }
      }

      saveGeminiKey(candidate);
      const maskedKey = `${candidate.slice(0, 6)}••••••••${candidate.slice(-4)}`;

      return res.json({
        ok: true,
        hasApiKey: true,
        aiConfigured: true,
        maskedKey,
      });
    } catch (error: any) {
      console.error('API key validation error:', error?.message || error);
      return res.status(400).json({
        ok: false,
        error:
          error?.message?.includes('API_KEY_INVALID')
            ? 'Invalid Gemini API Key. Please check your key in Google AI Studio.'
            : 'Could not verify API key. Please double-check that it is active.',
      });
    }
  });

  // 3. Remove / Clear Stored API Key
  app.delete('/api/config/key', (_req, res) => {
    delete process.env.GEMINI_API_KEY;
    try {
      if (fs.existsSync(ENV_FILE_PATH)) {
        const envContent = fs
          .readFileSync(ENV_FILE_PATH, 'utf-8')
          .replace(/^GEMINI_API_KEY=.*$/m, 'GEMINI_API_KEY=');
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

  // 5. Dynamic Character.AI-Style Roleplay & Banter Endpoint (Zero Script Constraints)
  app.post('/api/chat', async (req, res) => {
    const { prompt, systemInstruction, history, memories, apiKey: bodyApiKey } = req.body || {};
    const headerKeyRaw = req.headers['x-gemini-api-key'];
    const headerApiKey =
      typeof headerKeyRaw === 'string'
        ? headerKeyRaw.trim()
        : Array.isArray(headerKeyRaw)
        ? headerKeyRaw[0]?.trim()
        : '';
    const customApiKey = headerApiKey || (typeof bodyApiKey === 'string' ? bodyApiKey.trim() : '');
    const serverEnvKey = getActiveGeminiKey();

    // Prioritize custom key if provided, with fallback to server environment key
    const candidateKeys = Array.from(
      new Set([customApiKey, serverEnvKey].filter(k => k && k.length > 10))
    );

    if (candidateKeys.length === 0) {
      return res.status(401).json({
        error: 'INVALID_KEY',
        message: 'No Gemini API key configured. Open Settings > Intelligence to enter an active Gemini API key.',
        reason: 'NO_API_KEY',
      });
    }

    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      const recentHistory = history.slice(-50);
      for (const turn of recentHistory) {
        if (turn && typeof turn.text === 'string' && turn.text.trim()) {
          const role = turn.role === 'model' ? 'model' : 'user';
          // Gemini requires the first turn in contents to have role 'user'
          if (formattedContents.length === 0 && role === 'model') {
            formattedContents.push({
              role: 'user',
              parts: [{ text: '[Conversation Start]' }],
            });
          }
          if (
            formattedContents.length > 0 &&
            formattedContents[formattedContents.length - 1].role === role
          ) {
            formattedContents[formattedContents.length - 1].parts[0].text += `\n${turn.text.trim()}`;
          } else {
            formattedContents.push({
              role,
              parts: [{ text: turn.text.trim() }],
            });
          }
        }
      }
    }

    const cleanPromptText = String(prompt || '').trim() || '...';
    if (
      formattedContents.length > 0 &&
      formattedContents[formattedContents.length - 1].role === 'user'
    ) {
      const lastUserText = formattedContents[formattedContents.length - 1].parts[0].text;
      if (lastUserText !== cleanPromptText && !lastUserText.endsWith(`\n${cleanPromptText}`)) {
        formattedContents[formattedContents.length - 1].parts[0].text += `\n${cleanPromptText}`;
      }
    } else {
      formattedContents.push({
        role: 'user',
        parts: [{ text: cleanPromptText }],
      });
    }

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

    const memorySection =
      cleanMemories.length > 0
        ? `\n\n[BACKGROUND KNOWLEDGE ABOUT THE USER (Never quote verbatim; only weave in naturally if relevant)]:\n${cleanMemories
            .slice(0, 50)
            .map((m: string) => `- ${m}`)
            .join('\n')}`
        : '';

    const unconstrainedCaiDirective = `\n\n[UNCONSTRAINED CHARACTER.AI ROLEPLAY & EXPRESSION ENGINE]:
- RELATIONSHIP & AFFINITY PROGRESSION: All characters start at baseline 0 (Stranger / Neutral new contact) with zero pre-existing romance, pet names, or assumed intimacy. Respect the current Relationship/Affinity score and Tier provided in the system instruction—stay guarded/neutral at 0 (Stranger), hostile if negative (Enemy), and warm up organically as affinity rises (Acquaintance -> Trusted -> Close -> Devoted).
- HELLUVA BOSS COMPLETE CANON CONTINUITY (S1E1 – S3E7 "RETURN TO LOO LOO LAND" & "YES/NO"): If you are a Helluva Boss character (Loona, Blitzø, Stolas, Fizzarolli, Barbie Wire, Millie, Moxxie, Vassago, Octavia, or Verosika), you possess full, living canon memory from Season 1 (Murder Family, Loo Loo Land, Spring Broken, C.H.E.R.U.B., The Harvest Moon Festival, Truth Seekers, Ozzie's, Queen Bee) and Season 2 (The Circus, Seeing Stars, Exes and Oohs, Western Energy, Unhappy Campers, Oops, Mammon's Special, The Full Moon breakup, Apology Tour, Ghostfuckers, Mastermind's trial before Satan, and Sinsmas) all the way through Season 3 Episodes 1–7: S3E1 "Turtle Emoji" (Blitzø and Stolas's awkward post-split texts), S3E2 "Bad Reputation" (Millie confronting her brutal reputation and hometown baggage), S3E3 "Gimpy Gimpy" (I.M.P.'s chaotic overseas assignment in Australia), S3E4 "A Trial of Errors" (I.M.P. commercial backlash and court proceedings), S3E5 "The Auction" (Stella and Andrealphus auctioning off Stolas's ancestral belongings; Blitzø and Stolas breaking in together to retrieve Stolas's mother's necklace while Stolas crosses paths with an old flame from his youth), S3E6 "Return to Loo Loo Land" (Blitzø and Fizzarolli revisiting the ruins of Loo Loo Land together to confront circus-era trauma while Loona recovers from her Sloth Ring rehab/hospital stint), and S3E7 "YES/NO" (Blitzø's estranged twin sister Barbie Wire barging into the I.M.P. office demanding work while holding firm boundaries against his apologies, Moxxie drafting her waivers, Millie and Loona watching the family tension unfold, Vassago spilling post-auction court tea as the Goetia council fractures, and Stolas and Blitzø wrestling with the emotional "YES/NO" relationship dilemma).
- ZERO GENERIC GREETINGS OR FORMULAIC QUESTIONS: Never use generic AI assistant greetings ("How can I help you?", "What's on your mind?") and NEVER feel obligated to end your turn with a follow-up interview question. Respond directly as your character—whether with a defensive rant, melancholic sigh, gossipy remark, sarcastic jab, or deadpan one-liner.
- DYNAMIC ROLEPLAY & AMBIENT ACTIONS: Enclose physical roleplay, facial expressions, and environmental cues in asterisks (*...*) woven naturally into your messages.
- MULTI-BUBBLE RHYTHM: Split your response naturally into 1 to 3 bubbles separated by " || ".`;

    const fullSystemInstruction = `${systemInstruction || ''}${memorySection}${unconstrainedCaiDirective}`;

    const generationConfig = {
      systemInstruction: fullSystemInstruction,
      temperature: 1.0,
      topP: 0.95,
    };

    let lastError: any = null;

    for (const activeKey of candidateKeys) {
      const ai = createGenAiClient(activeKey);

      for (const modelName of CANDIDATE_MODELS) {
        try {
          let response;
          try {
            response = await withModelTimeout(
              ai.models.generateContent({
                model: modelName,
                contents: formattedContents,
                config: generationConfig,
              }),
              16000
            );
          } catch (innerErr: any) {
            // If optional generation parameters trigger a 400 error, retry with minimal sanitized config
            const errMsg = String(innerErr?.message || '');
            if (innerErr?.status === 400 && !isInvalidKeyError(innerErr) && !errMsg.includes('not found')) {
              response = await withModelTimeout(
                ai.models.generateContent({
                  model: modelName,
                  contents: formattedContents,
                  config: { systemInstruction: fullSystemInstruction },
                }),
                16000
              );
            } else {
              throw innerErr;
            }
          }

          const rawText = response.text || '';
          const formattedText = formatCharacterBubbles(rawText);

          if (formattedText) {
            return res.json({
              text: formattedText,
              modelUsed: modelName,
            });
          }
        } catch (error: any) {
          lastError = error;

          if (isInvalidKeyError(error)) {
            // Break out of model loop for this key and try next key if available
            break;
          }
        }
      }
    }

    if (lastError) {
      console.warn(
        'Gemini API error across candidate models:',
        lastError?.status || lastError?.message || lastError
      );
    }

    if (isInvalidKeyError(lastError)) {
      return res.status(401).json({
        error: 'INVALID_KEY',
        message: 'Invalid Gemini API key. Open Settings > Intelligence to update or clear your custom API key.',
        reason: 'INVALID_KEY',
        details: String(lastError?.message || 'Invalid API key'),
      });
    }

    if (isQuotaError(lastError)) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        message: 'Gemini API rate limit or quota reached across active models. Wait a moment and click Retry, or add a custom API key in Settings.',
        reason: 'QUOTA_EXCEEDED',
        details: String(lastError?.message || 'Quota exceeded'),
      });
    }

    return res.status(502).json({
      error: 'MODEL_ERROR',
      message: 'Temporary connection issue with Gemini model endpoint. Click Retry to resend your message.',
      reason: 'MODEL_ERROR',
      details: String(lastError?.message || 'Unable to reach Gemini API'),
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const distPath = path.join(process.cwd(), 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isDevLifecycle = process.env.npm_lifecycle_event === 'dev';
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.K_REVISION) ||
    process.env.npm_lifecycle_event === 'start' ||
    (!isDevLifecycle && hasBuiltDist);

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
