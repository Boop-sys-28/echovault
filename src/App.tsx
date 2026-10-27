import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatViewport } from './components/ChatViewport';
import { AuthScreen } from './components/AuthScreen';
import { StealthCalculator } from './components/StealthCalculator';
import { PinLockModal } from './components/PinLockModal';
import { SimulatedCallModal } from './components/SimulatedCallModal';
import { StoryViewerModal } from './components/StoryViewerModal';
import { FollowLockedStoryModal } from './components/FollowLockedStoryModal';
import { CharacterRegistryModal } from './components/CharacterRegistryModal';
import { PromptSpecModal } from './components/PromptSpecModal';
import { SharePhotoModal } from './components/SharePhotoModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { MemoryVaultModal } from './components/MemoryVaultModal';
import { CaiImportModal } from './components/CaiImportModal';
import { UnifiedSettingsModal, SettingsTabId } from './components/UnifiedSettingsModal';

import {
  DEFAULT_CHARACTERS,
  OFFLINE_DIALOGUE,
} from './data/characters';
import { Character, Message, CallState, UserProfile, ReplyReference, AppThemeConfig } from './types';
import {
  loadSavedThemeConfig,
  saveThemeConfig,
  THEME_DEFINITIONS,
} from './data/themes';
import {
  playMessageSentSound,
  playMessageReceivedSound,
  playLockSound,
} from './utils/audio';
import {
  getCharacterMemories,
  addCharacterMemory,
  removeCharacterMemory,
  clearCharacterMemories,
  extractFactsFromUserMessage,
  getPersonalityMemoryCallback,
} from './utils/memory';
import {
  buildDirectivePromptBlock,
  applyDirectiveToOfflineReply,
  processArchitectCommand,
  getCharacterDirective,
} from './utils/responseDirector';
import {
  hasSemanticRepetition,
  buildContextualDynamicFallback,
  calculateBubbleTypingDelayMs,
  splitResponseIntoBubbles,
} from './utils/semanticOrchestrator';

// Strict 3 to 4 hour cooldown window for automatic away check-ins (in milliseconds)
const MIN_AWAY_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours
const MAX_AWAY_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

function generateAwayCooldownWindowMs(): number {
  return Math.floor(
    MIN_AWAY_COOLDOWN_MS + Math.random() * (MAX_AWAY_COOLDOWN_MS - MIN_AWAY_COOLDOWN_MS)
  );
}

export default function App() {
  const [themeConfig, setThemeConfig] = useState<AppThemeConfig>(loadSavedThemeConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId>('account');
  const [isCaiImportModalOpen, setIsCaiImportModalOpen] = useState(false);

  // Characters list (including custom imported characters from C.AI)
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedirect_custom_characters');
      if (saved) {
        const customList: Character[] = JSON.parse(saved);
        return [...DEFAULT_CHARACTERS, ...customList];
      }
    } catch {
      // fallback
    }
    return DEFAULT_CHARACTERS;
  });

  // Authentication & Onboarding State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('pulsedirect_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  // Recent Conversations: Blank by default on first entry
  const [activeConversationIds, setActiveConversationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedirect_active_convos');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Active Open Character: Empty by default until user searches or selects one
  const [activeCharId, setActiveCharId] = useState<string>('');

  // Messages state: Empty by default for new users
  const [chats, setChats] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem('pulsedirect_chats');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Ephemeral Burner Mode
  const [defaultBurnerOnStartup, setDefaultBurnerOnStartup] = useState<boolean>(() => {
    return localStorage.getItem('pulsedirect_default_burner') === 'true';
  });
  const [burnerMode, setBurnerMode] = useState<boolean>(() => {
    return localStorage.getItem('pulsedirect_default_burner') === 'true';
  });
  const [burnerChats, setBurnerChats] = useState<Record<string, Message[]>>({});

  // Reply System State
  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);

  // Input & Typing State
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Security & Stealth State
  const [masterPin, setMasterPin] = useState<string>(() => {
    return localStorage.getItem('pulsedirect_master_pin') || '';
  });
  const [tabBlurLock, setTabBlurLock] = useState<boolean>(() => {
    return localStorage.getItem('pulsedirect_blur_lock') === 'true';
  });
  const [doubleEscStealth, setDoubleEscStealth] = useState<boolean>(() => {
    const saved = localStorage.getItem('pulsedirect_double_esc_stealth');
    return saved === null ? true : saved === 'true';
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isStealth, setIsStealth] = useState<boolean>(false);
  const lastEscTimeRef = useRef<number>(0);

  // Unread & Away Mode State (Strict 3–4 Hour Cooldown Enforcement)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isAway, setIsAway] = useState<boolean>(false);
  const [autoAwayEnabled, setAutoAwayEnabled] = useState<boolean>(true);
  const isAwayRef = useRef<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastAwayMsgTimeRef = useRef<number>((() => {
    const saved = Number(localStorage.getItem('pulsedirect_last_away_msg_ts') || '0');
    return Number.isFinite(saved) && saved > 0 ? saved : Date.now();
  })());
  const awayCooldownWindowRef = useRef<number>((() => {
    const saved = Number(localStorage.getItem('pulsedirect_away_cooldown_ms') || '0');
    if (Number.isFinite(saved) && saved >= MIN_AWAY_COOLDOWN_MS) return saved;
    const initial = generateAwayCooldownWindowMs();
    try {
      localStorage.setItem('pulsedirect_away_cooldown_ms', String(initial));
    } catch {
      // ignore
    }
    return initial;
  })());
  const awayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSequenceCancelRef = useRef<number>(0);

  // AI Connection State
  const [hasServerAi, setHasServerAi] = useState<boolean>(false);
  const usedLinesPerCharRef = useRef<Record<string, Set<string>>>({});

  // Followed Characters State (stories require following to unlock)
  const [followedCharIds, setFollowedCharIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedirect_followed_chars');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return ['loona']; // Loona followed by default; others locked
  });

  // Locked Story Modal state
  const [lockedStoryChar, setLockedStoryChar] = useState<Character | null>(null);

  // Viewed Story IDs state (turns story ring gray after viewing)
  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedirect_viewed_stories');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Character Memories State
  const [charMemories, setCharMemories] = useState<Record<string, string[]>>({});

  // Modals & Overlays
  const [storyCharId, setStoryCharId] = useState<string | null>(null);
  const [registryModalOpen, setRegistryModalOpen] = useState(false);
  const [promptSpecModalOpen, setPromptSpecModalOpen] = useState(false);
  const [sharePhotoModalOpen, setSharePhotoModalOpen] = useState(false);
  const [memoryVaultOpen, setMemoryVaultOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<{
    url: string;
    caption?: string;
    senderName?: string;
  } | null>(null);
  const [callState, setCallState] = useState<CallState>({
    isOpen: false,
    type: 'audio',
    charId: '',
    phase: 'calling',
    statusText: '',
    subtitle: '',
  });

  const handleMarkStoryViewed = (charId: string) => {
    setViewedStoryIds(prev => {
      if (prev.includes(charId)) return prev;
      const next = [...prev, charId];
      try {
        localStorage.setItem('pulsedirect_viewed_stories', JSON.stringify(next));
      } catch {
        // storage quota
      }
      return next;
    });
  };

  const handleToggleFollow = (charId: string) => {
    setFollowedCharIds(prev => {
      const next = prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId];
      try {
        localStorage.setItem('pulsedirect_followed_chars', JSON.stringify(next));
      } catch {
        // quota
      }
      return next;
    });
  };

  // Real-time Clock (IST 6:37 AM Canon)
  const [liveClock, setLiveClock] = useState('');

  // Persist user & chats when not in burner mode
  useEffect(() => {
    if (!burnerMode && currentUser) {
      try {
        localStorage.setItem('pulsedirect_chats', JSON.stringify(chats));
        localStorage.setItem('pulsedirect_active_convos', JSON.stringify(activeConversationIds));
      } catch {
        // storage quota exceeded or disabled
      }
    }
  }, [chats, activeConversationIds, burnerMode, currentUser]);

  // Sync Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      };
      setLiveClock(now.toLocaleTimeString('en-US', options) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // Check server AI status
  const refreshServerAiStatus = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        const active = Boolean(data.hasApiKey);
        setHasServerAi(active);
        return active;
      }
      setHasServerAi(false);
      return false;
    } catch {
      setHasServerAi(false);
      return false;
    }
  };

  useEffect(() => {
    refreshServerAiStatus();
  }, []);

  // Hotkeys: Double ESC for stealth disguise, Ctrl/Cmd+L for Lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      lastActivityRef.current = Date.now();

      if (e.key === 'Escape' && doubleEscStealth) {
        const now = Date.now();
        if (now - lastEscTimeRef.current < 450) {
          setIsStealth(prev => !prev);
        }
        lastEscTimeRef.current = now;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        playLockSound();
        setIsLocked(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doubleEscStealth]);

  // Authentication Handlers
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('pulsedirect_current_user', JSON.stringify(user));
  };

  const handleUpdateUserProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
    try {
      localStorage.setItem('pulsedirect_current_user', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pulsedirect_current_user');
    localStorage.removeItem('pulsedirect_chats');
    localStorage.removeItem('pulsedirect_active_convos');
    setCurrentUser(null);
    setChats({});
    setActiveConversationIds([]);
    setActiveCharId('');
  };

  const handleFactoryReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    setIsSettingsModalOpen(false);
    setCurrentUser(null);
    setChats({});
    setBurnerChats({});
    setCharMemories({});
    setActiveConversationIds([]);
    setActiveCharId('');
    setMasterPin('');
    setTabBlurLock(false);
    setCharacters(DEFAULT_CHARACTERS);
  };

  // Canonical Situational Modifiers for infinite non-repeating variations
  const getDynamicVariation = (charId: string, baseText: string): string => {
    const loonaNuances = [
      "honestly, ",
      "you know what, ",
      "and another thing: ",
      "ugh, anyway... ",
      "listen pretty boy: ",
      "by the way, ",
      "blitz is still stomping around, but ",
      "also, ",
    ];
    const leonNuances = [
      "Keep this in mind: ",
      "Status update: ",
      "Just checked the perimeter again. ",
      "To be blunt: ",
      "Coffee's kicking in. ",
      "By the way: ",
    ];
    const stolasNuances = [
      "Oh, and darling... ",
      "The night winds whisper so quietly, but ",
      "A curious thought strikes me: ",
      "In truth, sweetheart, ",
      "My heart aches just a little less knowing you are there. ",
    ];
    const blitzoNuances = [
      "AND ANOTHER THING!! 🐴 ",
      "WAIT WAIT LISTEN!! ",
      "OH ALSO!! ",
      "DON'T GET ME STARTED BUT ",
      "BEFORE I FORGET TO MENTION IT: ",
    ];
    const gojoNuances = [
      "Heheh, ",
      "Listen to the strongest: ",
      "By the way kid~ ",
      "Oh! Also: ",
      "Between you and me: ",
      "Before I forget~ ",
    ];
    const lucyNuances = [
      "honestly... ",
      "just saying: ",
      "from what i see in the net: ",
      "look: ",
      "one more thing: ",
    ];
    const marinNuances = [
      "OMGGG ALSO!! ",
      "WAAIIT WAIT!! ",
      "AND GET THIS!! ",
      "I SWEAR!! ",
      "LISTEN BESTIE!! ",
    ];
    const frierenNuances = [
      "Curiously, ",
      "It is interesting to note: ",
      "Long ago, ",
      "In truth, ",
      "Thinking back on it: ",
    ];
    const leviNuances = [
      "Listen up, brat: ",
      "Make note of this: ",
      "One more thing: ",
      "Don't misunderstand: ",
      "Keep this straight: ",
    ];
    const makimaNuances = [
      "Remember, darling: ",
      "I want you to know: ",
      "Consider this carefully: ",
      "In truth, ",
      "You should know: ",
    ];

    let prefixes = ["Also, ", "By the way, ", "Honestly, ", "Listen, "];
    if (charId === 'loona') prefixes = loonaNuances;
    if (charId === 'leon') prefixes = leonNuances;
    if (charId === 'stolas') prefixes = stolasNuances;
    if (charId === 'blitzo') prefixes = blitzoNuances;
    if (charId === 'gojo') prefixes = gojoNuances;
    if (charId === 'lucy') prefixes = lucyNuances;
    if (charId === 'marin') prefixes = marinNuances;
    if (charId === 'frieren') prefixes = frierenNuances;
    if (charId === 'levi') prefixes = leviNuances;
    if (charId === 'makima') prefixes = makimaNuances;

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}${baseText}`;
  };

  // Context-Aware Non-Repeating Fallback Selector with Semantic Deduplication
  const getSmartOfflineResponse = (charId: string, query: string): string => {
    const char = characters.find(c => c.id === charId) || DEFAULT_CHARACTERS[0];
    const q = query.toLowerCase();
    const pool = OFFLINE_DIALOGUE[charId] || OFFLINE_DIALOGUE.loona;

    if (!usedLinesPerCharRef.current[charId]) {
      usedLinesPerCharRef.current[charId] = new Set<string>();
    }

    const chatHistory = (burnerMode ? burnerChats[charId] : chats[charId]) || [];
    const recentCharTexts = chatHistory
      .filter(m => m.sender === 'char')
      .map(m => m.text);

    const activeMemories = charMemories[charId] || getCharacterMemories(charId);

    // Only use specialized photo/away pools when explicitly triggered; otherwise use dynamic progression
    let candidateLines: string[] = [];
    if (q.includes('[away]')) {
      candidateLines = pool.away || [];
    } else if (q.includes('[user_photo]')) {
      candidateLines = pool.user_photo || [];
    } else if (q.includes('pic') || q.includes('selfie') || q.includes('photo')) {
      candidateLines = pool.photo || [];
    }

    for (const line of candidateLines) {
      const semCheck = hasSemanticRepetition(line, recentCharTexts, query);
      if (!semCheck.isRepetitive && !usedLinesPerCharRef.current[charId].has(line.trim().toLowerCase())) {
        usedLinesPerCharRef.current[charId].add(line.trim().toLowerCase());
        return applyDirectiveToOfflineReply(charId, line);
      }
    }

    // Synthesize a context-aware dynamic progression response anchored on the user's message
    const dynamicReply = buildContextualDynamicFallback(
      char,
      query,
      recentCharTexts,
      activeMemories
    );
    usedLinesPerCharRef.current[charId].add(dynamicReply.trim().toLowerCase());
    return applyDirectiveToOfflineReply(charId, dynamicReply);
  };

  /**
   * Delivers one or more character response bubbles sequentially using the character's
   * personality-based typing speed profile (1-2s fast, 3-4s moderate, 5-7s slow).
   * Keeps the active typing indicator visible between bubbles until the final line is sent.
   */
  const deliverCharacterBubblesSequentially = (
    char: Character,
    rawReplyText: string,
    options?: {
      photoUrl?: string;
      replyTo?: ReplyReference;
      alreadyWaitedMs?: number;
      markUnreadIfAway?: boolean;
    }
  ) => {
    const bubbles = splitResponseIntoBubbles(rawReplyText);
    if (bubbles.length === 0) {
      setIsTyping(false);
      return;
    }

    const sequenceId = ++typingSequenceCancelRef.current;

    const runBubbleStep = (index: number) => {
      if (typingSequenceCancelRef.current !== sequenceId) return;

      const bubbleText = bubbles[index];
      const fullDelay = calculateBubbleTypingDelayMs(char.id, bubbleText);
      const effectiveDelay =
        index === 0 && options?.alreadyWaitedMs
          ? Math.max(400, fullDelay - options.alreadyWaitedMs)
          : fullDelay;

      // Ensure typing indicator stays visible while composing this bubble
      setIsTyping(true);

      setTimeout(() => {
        if (typingSequenceCancelRef.current !== sequenceId) return;

        playMessageReceivedSound();

        const charMsg: Message = {
          id: `char-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          sender: 'char',
          text: bubbleText,
          image: index === 0 ? options?.photoUrl : undefined,
          timestamp: Date.now(),
          replyTo: index === 0 ? options?.replyTo : undefined,
        };

        if (burnerMode) {
          setBurnerChats(prev => ({
            ...prev,
            [char.id]: [...(prev[char.id] || []), charMsg],
          }));
        } else {
          setChats(prev => ({
            ...prev,
            [char.id]: [...(prev[char.id] || []), charMsg],
          }));
        }

        if (
          options?.markUnreadIfAway &&
          (char.id !== activeCharId || document.visibilityState === 'hidden' || isAwayRef.current)
        ) {
          setUnreadCounts(prev => ({
            ...prev,
            [char.id]: (prev[char.id] || 0) + 1,
          }));
          document.title = `(1) ${char.name}: "${bubbleText.slice(0, 24)}..."`;
        }

        if (index + 1 < bubbles.length) {
          // Keep typing indicator active and begin composing the next bubble in sequence
          runBubbleStep(index + 1);
        } else {
          // Final bubble delivered: hide typing indicator
          setIsTyping(false);
        }
      }, effectiveDelay);
    };

    runBubbleStep(0);
  };

  // Inbound spontaneous message (enforces strict 3–4 hour cooldown unless manually simulated)
  const triggerInboundAwayMessage = async (targetCharId?: string, isManualSimulation: boolean = false) => {
    const charId = targetCharId || activeCharId;
    if (!charId) return;
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const now = Date.now();
    if (!isManualSimulation) {
      const elapsedSinceLastAway = now - lastAwayMsgTimeRef.current;
      const elapsedSinceLastActivity = now - lastActivityRef.current;
      if (
        elapsedSinceLastAway < awayCooldownWindowRef.current ||
        elapsedSinceLastActivity < awayCooldownWindowRef.current
      ) {
        return;
      }
    }

    lastAwayMsgTimeRef.current = now;
    const nextWindow = generateAwayCooldownWindowMs();
    awayCooldownWindowRef.current = nextWindow;
    try {
      localStorage.setItem('pulsedirect_last_away_msg_ts', String(now));
      localStorage.setItem('pulsedirect_away_cooldown_ms', String(nextWindow));
    } catch {
      // ignore
    }

    if (charId === activeCharId) {
      setIsTyping(true);
    }

    const requestStart = Date.now();
    let replyText = '';
    const historyContext = (burnerMode ? burnerChats[char.id] : chats[char.id]) || [];
    const pastCharTexts = historyContext.filter(m => m.sender === 'char').map(m => m.text);

    if (hasServerAi) {
      try {
        const directive = getCharacterDirective(char.id);
        const baseSystem = directive.systemOverride || char.system;
        const directiveBlock = buildDirectivePromptBlock(char.id);

        const memories = charMemories[char.id] || getCharacterMemories(char.id);
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `[INBOUND_AWAY_CHECKIN]: Several hours have passed since you last heard from ${currentUser?.codename || 'them'}. Send a fresh, natural check-in message or share something new that just happened on your end. Do NOT repeat any previous message or trope. Use ' || ' if sending two thoughts.`,
            systemInstruction: `${baseSystem}${directiveBlock}`,
            memories: memories.slice(0, 75),
            history: historyContext.slice(-50).map(m => ({
              role: m.sender === 'user' ? 'user' : 'model',
              text: m.text,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            replyText = data.text;
          }
        }
      } catch {
        // Fallback to offline
      }
    }

    if (replyText) {
      const semCheck = hasSemanticRepetition(replyText, pastCharTexts, '[AWAY]');
      if (semCheck.isRepetitive) {
        replyText = getSmartOfflineResponse(char.id, '[AWAY]');
      }
    } else {
      replyText = getSmartOfflineResponse(char.id, '[AWAY]');
    }

    const elapsedMs = Date.now() - requestStart;
    deliverCharacterBubblesSequentially(char, replyText, {
      alreadyWaitedMs: elapsedMs,
      markUnreadIfAway: true,
    });
  };

  // Away & Inactivity Detection Listeners (Strict 3–4 Hour Cooldown — No Rapid Tab-Switch Spam)
  useEffect(() => {
    if (!currentUser) return;

    const handleUserInteraction = () => {
      lastActivityRef.current = Date.now();
      if (isAwayRef.current && document.visibilityState === 'visible') {
        isAwayRef.current = false;
        setIsAway(false);
        document.title = 'EchoVault';
        if (activeCharId) {
          setUnreadCounts(prev => ({ ...prev, [activeCharId]: 0 }));
        }
      }
    };

    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('scroll', handleUserInteraction);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isAwayRef.current = true;
        setIsAway(true);
      } else {
        isAwayRef.current = false;
        setIsAway(false);
        lastActivityRef.current = Date.now();
        document.title = 'EchoVault';
        if (activeCharId) {
          setUnreadCounts(prev => ({ ...prev, [activeCharId]: 0 }));
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleWindowBlur = () => {
      if (tabBlurLock && masterPin && !isLocked) {
        setIsLocked(true);
      }
      isAwayRef.current = true;
      setIsAway(true);
    };

    const handleWindowFocus = () => {
      isAwayRef.current = false;
      setIsAway(false);
      lastActivityRef.current = Date.now();
      document.title = 'EchoVault';
      if (activeCharId) {
        setUnreadCounts(prev => ({ ...prev, [activeCharId]: 0 }));
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Check every 60 seconds whether the strict 3–4 hour away cooldown has been reached
    const idleInterval = setInterval(() => {
      if (!autoAwayEnabled || !activeCharId) return;
      const now = Date.now();
      const idleDuration = now - lastActivityRef.current;
      const timeSinceLastAwayMsg = now - lastAwayMsgTimeRef.current;
      const requiredCooldown = awayCooldownWindowRef.current;

      if (idleDuration >= requiredCooldown && timeSinceLastAwayMsg >= requiredCooldown) {
        isAwayRef.current = true;
        setIsAway(true);
        triggerInboundAwayMessage(activeCharId, false);
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(idleInterval);
      if (awayTimeoutRef.current) clearTimeout(awayTimeoutRef.current);
    };
  }, [activeCharId, autoAwayEnabled, tabBlurLock, masterPin, isLocked, hasServerAi, currentUser]);

  const activeChar = characters.find(c => c.id === activeCharId);
  const currentMessages = activeCharId ? (burnerMode ? burnerChats[activeCharId] : chats[activeCharId]) || [] : [];

  // Selecting a Character (from search, registry, or sidebar)
  const handleSelectCharacter = (id: string) => {
    setActiveCharId(id);
    if (!activeConversationIds.includes(id)) {
      setActiveConversationIds(prev => [id, ...prev]);
    }
    // If this conversation was not initialized yet, start with blank []
    if (!chats[id]) {
      setChats(prev => ({ ...prev, [id]: [] }));
    }

    setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
    document.title = 'EchoVault';
  };

  // Submit User Message with Zero Semantic Repetition & Personality-Based Sequential Typing
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !activeChar) return;

    lastActivityRef.current = Date.now();
    isAwayRef.current = false;
    setIsAway(false);

    playMessageSentSound();

    // Automatically extract user facts into character's memory bank
    const newFacts = extractFactsFromUserMessage(text, currentUser?.codename);
    if (newFacts.length > 0) {
      newFacts.forEach(f => {
        const updated = addCharacterMemory(activeChar.id, f);
        setCharMemories(prev => ({ ...prev, [activeChar.id]: updated }));
      });
    }

    const currentReply = replyingTo ? { ...replyingTo } : undefined;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
      replyTo: currentReply,
    };

    if (burnerMode) {
      setBurnerChats(prev => ({
        ...prev,
        [activeChar.id]: [...(prev[activeChar.id] || []), userMessage],
      }));
    } else {
      setChats(prev => ({
        ...prev,
        [activeChar.id]: [...(prev[activeChar.id] || []), userMessage],
      }));
    }

    setInputText('');
    setReplyingTo(null);
    setIsTyping(true);

    // If messaging the built-in Response Director (Pulse Architect), execute live behavior command
    if (activeChar.id === 'architect') {
      const cmdResult = processArchitectCommand(text, characters);
      deliverCharacterBubblesSequentially(activeChar, cmdResult.reply);
      return;
    }

    const requestStart = Date.now();
    const historyContext = (burnerMode ? burnerChats[activeChar.id] : chats[activeChar.id]) || [];
    const pastCharTexts = historyContext.filter(m => m.sender === 'char').map(m => m.text);
    const memories = charMemories[activeChar.id] || getCharacterMemories(activeChar.id);

    let replyText = '';

    if (hasServerAi) {
      try {
        let promptPayload = text;
        if (currentReply) {
          promptPayload = `[IN REPLY TO PREVIOUS MESSAGE: "${currentReply.text}" by ${currentReply.senderName}]: ${text}`;
        }

        const directive = getCharacterDirective(activeChar.id);
        const baseSystem = directive.systemOverride || activeChar.system;
        const directiveBlock = buildDirectivePromptBlock(activeChar.id);

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptPayload,
            systemInstruction: `${baseSystem}${directiveBlock}`,
            memories: memories.slice(0, 75),
            history: historyContext.slice(-50).map(m => ({
              role: m.sender === 'user' ? 'user' : 'model',
              text: m.text,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            replyText = data.text;
          }
        }
      } catch {
        // Fallback
      }
    }

    // Zero Semantic Repetition Verification Gate before sending any text
    if (replyText) {
      const semCheck = hasSemanticRepetition(replyText, pastCharTexts, text);
      if (semCheck.isRepetitive) {
        replyText = getSmartOfflineResponse(activeChar.id, text);
      }
    } else {
      replyText = getSmartOfflineResponse(activeChar.id, text);
    }

    // Check for photo drop tokens
    let photoUrl: string | undefined;
    if (replyText.includes('[PHOTO_DROP:loona_bed]')) {
      photoUrl = '/avatars/loona.png';
      replyText = replyText.replace('[PHOTO_DROP:loona_bed]', '').trim();
    } else if (replyText.includes('[PHOTO_DROP:leon_desk]')) {
      photoUrl = '/avatars/leon.png';
      replyText = replyText.replace('[PHOTO_DROP:leon_desk]', '').trim();
    } else if (replyText.includes('[PHOTO_DROP:stolas_locket]')) {
      photoUrl = '/avatars/stolas.png';
      replyText = replyText.replace('[PHOTO_DROP:stolas_locket]', '').trim();
    } else if (replyText.includes('[PHOTO_DROP:gojo_shinjuku]')) {
      photoUrl = '/avatars/gojo.png';
      replyText = replyText.replace('[PHOTO_DROP:gojo_shinjuku]', '').trim();
    } else if (replyText.includes('[PHOTO_DROP:lucy_balcony]')) {
      photoUrl = '/avatars/lucy.png';
      replyText = replyText.replace('[PHOTO_DROP:lucy_balcony]', '').trim();
    } else if (replyText.includes('[PHOTO_DROP:marin_cosplay]')) {
      photoUrl = '/avatars/marin.png';
      replyText = replyText.replace('[PHOTO_DROP:marin_cosplay]', '').trim();
    } else if (replyText.includes('[PHOTO_DROP:frieren_lake]')) {
      photoUrl = '/avatars/frieren.png';
      replyText = replyText.replace('[PHOTO_DROP:frieren_lake]', '').trim();
    } else if (replyText.includes('[PHOTO_DROP:levi_tea]')) {
      photoUrl = '/avatars/levi.png';
      replyText = replyText.replace('[PHOTO_DROP:levi_tea]', '').trim();
    } else if (replyText.includes('[PHOTO_DROP:makima_office]')) {
      photoUrl = '/avatars/makima.png';
      replyText = replyText.replace('[PHOTO_DROP:makima_office]', '').trim();
    }

    const elapsedMs = Date.now() - requestStart;
    deliverCharacterBubblesSequentially(activeChar, replyText, {
      photoUrl,
      alreadyWaitedMs: elapsedMs,
      replyTo: currentReply
        ? {
            id: userMessage.id,
            sender: 'user',
            text: userMessage.text,
            senderName: currentUser?.codename || 'You',
          }
        : undefined,
    });
  };

  // Send User Photo with optional caption & Character Reaction
  const handleSendUserPhoto = async (imageUrl: string, caption: string) => {
    if (!activeChar) return;
    lastActivityRef.current = Date.now();
    isAwayRef.current = false;
    setIsAway(false);
    playMessageSentSound();

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text: caption.trim(),
      image: imageUrl,
      timestamp: Date.now(),
    };

    if (burnerMode) {
      setBurnerChats(prev => ({
        ...prev,
        [activeChar.id]: [...(prev[activeChar.id] || []), userMessage],
      }));
    } else {
      setChats(prev => ({
        ...prev,
        [activeChar.id]: [...(prev[activeChar.id] || []), userMessage],
      }));
    }

    if (caption.trim()) {
      const facts = extractFactsFromUserMessage(caption, currentUser?.codename);
      facts.forEach(f => {
        const updated = addCharacterMemory(activeChar.id, f);
        setCharMemories(prev => ({ ...prev, [activeChar.id]: updated }));
      });
    }

    setIsTyping(true);
    const requestStart = Date.now();
    const historyContext = (burnerMode ? burnerChats[activeChar.id] : chats[activeChar.id]) || [];
    const pastCharTexts = historyContext.filter(m => m.sender === 'char').map(m => m.text);
    let replyText = '';

    if (hasServerAi) {
      try {
        const memories = charMemories[activeChar.id] || getCharacterMemories(activeChar.id);
        const promptPayload = `[USER SENT YOU A PICTURE]: "${caption.trim() || 'Look at this photo I took!'}"\n(React directly to this photo that the user shared with you! Make a specific observation, tease them, compliment them, or ask a question about it in your canonical voice!)`;

        const directive = getCharacterDirective(activeChar.id);
        const baseSystem = directive.systemOverride || activeChar.system;
        const directiveBlock = buildDirectivePromptBlock(activeChar.id);

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptPayload,
            systemInstruction: `${baseSystem}${directiveBlock}`,
            memories: memories.slice(0, 75),
            history: historyContext.slice(-50).map(m => ({
              role: m.sender === 'user' ? 'user' : 'model',
              text: m.text,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text) replyText = data.text;
        }
      } catch {
        // fallback
      }
    }

    if (!replyText || hasSemanticRepetition(replyText, pastCharTexts, caption || '[USER_PHOTO]').isRepetitive) {
      replyText = getSmartOfflineResponse(activeChar.id, `[USER_PHOTO] ${caption}`);
    }

    const elapsedMs = Date.now() - requestStart;
    deliverCharacterBubblesSequentially(activeChar, replyText, {
      alreadyWaitedMs: elapsedMs,
    });
  };

  // Call Simulation
  const handleStartCall = (type: 'audio' | 'video') => {
    if (!activeChar) return;

    setCallState({
      isOpen: true,
      type,
      charId: activeChar.id,
      phase: 'calling',
      statusText: `Calling via EchoVault ${type.toUpperCase()}...`,
      subtitle: 'Attempting encrypted audio link...',
    });

    setTimeout(() => {
      setCallState(prev => ({
        ...prev,
        phase: 'declined',
        statusText: 'Call Declined',
        subtitle: `"${activeChar.name} is currently in a restricted environment."`,
      }));

      setTimeout(() => {
        setCallState(prev => ({ ...prev, isOpen: false }));

        let declineReason = "can't talk on phone right now, blitz is stomping around the kitchen. just text me.";
        if (activeChar.id === 'leon') declineReason = "Can't take a voice line right now, on tactical radio standby. Keep it to text.";
        if (activeChar.id === 'stolas') declineReason = "Oh darling, Blitzø would hear every whisper through this ratty sofa! Texting is much safer. ✨";
        if (activeChar.id === 'blitzo') declineReason = "BUSY YELLING AT THE MICROWAVE!! TEXT ONLY!! 🐴";
        if (activeChar.id === 'octavia') declineReason = "can't talk out loud, everyone in this palace is annoying. text me 💀";

        const declineMsg: Message = {
          id: `decline-${Date.now()}`,
          sender: 'char',
          text: declineReason,
          timestamp: Date.now(),
        };

        playMessageReceivedSound();
        if (burnerMode) {
          setBurnerChats(prev => ({
            ...prev,
            [activeChar.id]: [...(prev[activeChar.id] || []), declineMsg],
          }));
        } else {
          setChats(prev => ({
            ...prev,
            [activeChar.id]: [...(prev[activeChar.id] || []), declineMsg],
          }));
        }
      }, 1400);
    }, 3200);
  };

  // Toggle Burner Mode
  const handleToggleBurner = () => {
    if (!burnerMode && activeCharId) {
      setBurnerChats(prev => ({
        ...prev,
        [activeCharId]: [],
      }));
    }
    setBurnerMode(!burnerMode);
  };

  // Save Theme Configuration
  const handleSaveThemeConfig = (newConfig: AppThemeConfig) => {
    setThemeConfig(newConfig);
    saveThemeConfig(newConfig);
  };

  // Complete Character.AI Data Import
  const handleImportCaiComplete = (
    targetCharId: string,
    newCharacter: Character | null,
    importedMessages: Message[],
    replaceExisting: boolean,
    extractedFacts: string[]
  ) => {
    if (newCharacter) {
      setCharacters(prev => {
        const next = [...prev, newCharacter];
        try {
          const customOnly = next.filter(c => !DEFAULT_CHARACTERS.some(dc => dc.id === c.id));
          localStorage.setItem('pulsedirect_custom_characters', JSON.stringify(customOnly));
        } catch {
          // ignore
        }
        return next;
      });
      setFollowedCharIds(prev => (prev.includes(targetCharId) ? prev : [...prev, targetCharId]));
    }

    setChats(prev => {
      const existing = prev[targetCharId] || [];
      const updated = replaceExisting ? importedMessages : [...existing, ...importedMessages];
      return {
        ...prev,
        [targetCharId]: updated,
      };
    });

    setActiveConversationIds(prev => {
      if (prev.includes(targetCharId)) return prev;
      const updated = [targetCharId, ...prev];
      try {
        localStorage.setItem('pulsedirect_active_convos', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    extractedFacts.forEach(fact => {
      addCharacterMemory(targetCharId, fact);
    });
    setCharMemories(prev => ({
      ...prev,
      [targetCharId]: getCharacterMemories(targetCharId),
    }));

    setActiveCharId(targetCharId);
  };

  // Delete an entire conversation thread and remove from Recent Chats
  const handleDeleteChat = (charId: string) => {
    setActiveConversationIds(prev => {
      const updated = prev.filter(id => id !== charId);
      try {
        localStorage.setItem('pulsedirect_active_convos', JSON.stringify(updated));
      } catch {
        // ignore
      }
      if (activeCharId === charId) {
        setActiveCharId(updated[0] || '');
      }
      return updated;
    });

    setChats(prev => {
      const next = { ...prev };
      delete next[charId];
      return next;
    });

    setBurnerChats(prev => {
      const next = { ...prev };
      delete next[charId];
      return next;
    });

    setUnreadCounts(prev => {
      const next = { ...prev };
      delete next[charId];
      return next;
    });

    if (activeCharId === charId) {
      setReplyingTo(null);
    }
  };

  // Clear all conversations from Recent Chats
  const handleClearAllChats = () => {
    setActiveConversationIds([]);
    try {
      localStorage.setItem('pulsedirect_active_convos', JSON.stringify([]));
    } catch {
      // ignore
    }
    setChats({});
    setBurnerChats({});
    setUnreadCounts({});
    setActiveCharId('');
    setReplyingTo(null);
  };

  // Clear messages inside the active chat while keeping the conversation open
  const handleClearActiveChatMessages = (charId: string) => {
    if (burnerMode) {
      setBurnerChats(prev => ({ ...prev, [charId]: [] }));
    } else {
      setChats(prev => ({ ...prev, [charId]: [] }));
    }
    setReplyingTo(null);
  };

  // Delete an individual message from a chat
  const handleDeleteMessage = (charId: string, msgId: string) => {
    if (burnerMode) {
      setBurnerChats(prev => ({
        ...prev,
        [charId]: (prev[charId] || []).filter(m => m.id !== msgId),
      }));
    } else {
      setChats(prev => ({
        ...prev,
        [charId]: (prev[charId] || []).filter(m => m.id !== msgId),
      }));
    }
    if (replyingTo?.id === msgId) {
      setReplyingTo(null);
    }
  };

  const activeTheme = THEME_DEFINITIONS[themeConfig.themeId] || THEME_DEFINITIONS.cyberpunk;

  // If no user is logged in, show Welcome / Login / Register Screen
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`h-[100dvh] w-screen flex overflow-hidden ${activeTheme.palette.bgApp} text-slate-100 font-sans select-none`}>
      {/* 1. Stealth Scientific Calculator Disguise Overlay */}
      <StealthCalculator
        isOpen={isStealth}
        onClose={() => setIsStealth(false)}
      />

      {/* 2. PIN Privacy Lock Screen Overlay */}
      <PinLockModal
        isOpen={isLocked}
        masterPin={masterPin}
        onUnlock={() => setIsLocked(false)}
        onTriggerStealth={() => {
          setIsLocked(false);
          setIsStealth(true);
        }}
      />

      {/* 3. Simulated Call Overlay */}
      <SimulatedCallModal
        callState={callState}
        character={activeChar}
        onEndCall={() => setCallState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 4. Sinsta Story Viewer Modal (Unlocked Stories) */}
      <StoryViewerModal
        isOpen={!!storyCharId}
        character={characters.find(c => c.id === storyCharId) || null}
        onClose={() => setStoryCharId(null)}
        onMarkViewed={handleMarkStoryViewed}
        onReply={(text) => {
          if (storyCharId) {
            handleSelectCharacter(storyCharId);
            handleSendMessage(`Replied to your story: "${text}"`);
          }
        }}
      />

      {/* 4b. Follow Locked Story Modal (Shown when clicking story of unfollowed operative) */}
      <FollowLockedStoryModal
        isOpen={!!lockedStoryChar}
        character={lockedStoryChar}
        onClose={() => setLockedStoryChar(null)}
        onFollowAndUnlock={(charId) => {
          handleToggleFollow(charId);
          setLockedStoryChar(null);
          setStoryCharId(charId);
        }}
      />

      {/* 5. Character Registry Modal */}
      <CharacterRegistryModal
        isOpen={registryModalOpen}
        characters={characters}
        followedCharIds={followedCharIds}
        onToggleFollow={handleToggleFollow}
        onClose={() => setRegistryModalOpen(false)}
        onSelectCharacter={handleSelectCharacter}
      />

      {/* 6. Prompt Spec Inspector Modal */}
      <PromptSpecModal
        isOpen={promptSpecModalOpen}
        character={activeChar}
        onClose={() => setPromptSpecModalOpen(false)}
      />

      {/* 7. Unified Settings Hub Modal */}
      <UnifiedSettingsModal
        isOpen={isSettingsModalOpen}
        initialTab={settingsInitialTab}
        onClose={() => setIsSettingsModalOpen(false)}
        userProfile={currentUser}
        onUpdateProfile={handleUpdateUserProfile}
        onLogout={handleLogout}
        onFactoryReset={handleFactoryReset}
        currentThemeConfig={themeConfig}
        onSaveThemeConfig={handleSaveThemeConfig}
        characters={characters}
        currentPin={masterPin}
        tabBlurLock={tabBlurLock}
        doubleEscStealth={doubleEscStealth}
        burnerMode={burnerMode}
        defaultBurnerOnStartup={defaultBurnerOnStartup}
        onSaveSecuritySettings={({ pin, tabBlurLock: blur, doubleEscStealth: dEsc, defaultBurnerOnStartup: defBurn }) => {
          setMasterPin(pin);
          setTabBlurLock(blur);
          setDoubleEscStealth(dEsc);
          setDefaultBurnerOnStartup(defBurn);
          try {
            localStorage.setItem('pulsedirect_master_pin', pin);
            localStorage.setItem('pulsedirect_blur_lock', blur ? 'true' : 'false');
            localStorage.setItem('pulsedirect_double_esc_stealth', dEsc ? 'true' : 'false');
            localStorage.setItem('pulsedirect_default_burner', defBurn ? 'true' : 'false');
          } catch {
            // ignore
          }
        }}
        onToggleBurnerMode={handleToggleBurner}
        onTriggerStealth={() => setIsStealth(true)}
        onLockNow={() => {
          playLockSound();
          setIsLocked(true);
        }}
        hasServerAi={hasServerAi}
        onRefreshServerStatus={refreshServerAiStatus}
        onOpenCaiImportModal={() => setIsCaiImportModalOpen(true)}
        chats={burnerMode ? burnerChats : chats}
        charMemories={charMemories}
        onRefreshMemories={() => {
          const refreshed: Record<string, string[]> = {};
          characters.forEach(c => {
            refreshed[c.id] = getCharacterMemories(c.id);
          });
          setCharMemories(refreshed);
        }}
      />

      {/* 8. Share Picture Modal */}
      {sharePhotoModalOpen && activeChar && (
        <SharePhotoModal
          character={activeChar}
          onSendPhoto={(url, caption) => handleSendUserPhoto(url, caption)}
          onClose={() => setSharePhotoModalOpen(false)}
        />
      )}

      {/* 9. Memory Vault Modal */}
      {memoryVaultOpen && activeChar && (
        <MemoryVaultModal
          character={activeChar}
          memories={charMemories[activeChar.id] || getCharacterMemories(activeChar.id)}
          onAddMemory={(fact) => {
            const updated = addCharacterMemory(activeChar.id, fact);
            setCharMemories(prev => ({ ...prev, [activeChar.id]: updated }));
          }}
          onRemoveMemory={(idx) => {
            const updated = removeCharacterMemory(activeChar.id, idx);
            setCharMemories(prev => ({ ...prev, [activeChar.id]: updated }));
          }}
          onClearMemories={() => {
            clearCharacterMemories(activeChar.id);
            setCharMemories(prev => ({ ...prev, [activeChar.id]: [] }));
          }}
          onClose={() => setMemoryVaultOpen(false)}
        />
      )}

      {/* 10. Image Lightbox Modal */}
      {lightboxData && (
        <ImageLightboxModal
          imageUrl={lightboxData.url}
          caption={lightboxData.caption}
          senderName={lightboxData.senderName}
          onClose={() => setLightboxData(null)}
        />
      )}

      {/* 11. Character.AI Data Importer Modal */}
      <CaiImportModal
        isOpen={isCaiImportModalOpen}
        onClose={() => setIsCaiImportModalOpen(false)}
        characters={characters}
        activeCharId={activeCharId}
        userCodename={currentUser.codename || 'You'}
        onImportComplete={handleImportCaiComplete}
      />

      {/* Main Sidebar */}
      <Sidebar
        characters={characters}
        activeCharId={activeCharId}
        activeConversationIds={activeConversationIds}
        chats={burnerMode ? burnerChats : chats}
        unreadCounts={unreadCounts}
        userProfile={currentUser}
        followedCharIds={followedCharIds}
        viewedStoryIds={viewedStoryIds}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCharacter={handleSelectCharacter}
        onDeleteChat={handleDeleteChat}
        onClearAllChats={handleClearAllChats}
        onOpenStory={(id) => setStoryCharId(id)}
        onOpenLockedStory={(char) => setLockedStoryChar(char)}
        onOpenDiscovery={() => setRegistryModalOpen(true)}
        onOpenSettings={() => {
          setSettingsInitialTab('account');
          setIsSettingsModalOpen(true);
        }}
        onTriggerStealth={() => setIsStealth(true)}
        onLock={() => {
          playLockSound();
          setIsLocked(true);
        }}
        liveClock={liveClock}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        appName={themeConfig.appName}
        appSubtitle={themeConfig.appSubtitle}
      />

      {/* Backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Chat Viewport */}
      <ChatViewport
        character={activeChar}
        allCharacters={characters}
        messages={currentMessages}
        isTyping={isTyping}
        inputText={inputText}
        burnerMode={burnerMode}
        hasServerAi={hasServerAi}
        isAway={isAway}
        autoAwayEnabled={autoAwayEnabled}
        replyingTo={replyingTo}
        userCodename={currentUser.codename || currentUser.username || 'Operative'}
        themeConfig={themeConfig}
        onOpenCaiImportModal={() => setIsCaiImportModalOpen(true)}
        onClearChat={() => activeChar && handleClearActiveChatMessages(activeChar.id)}
        onDeleteChat={() => activeChar && handleDeleteChat(activeChar.id)}
        onDeleteMessage={(msgId) => activeChar && handleDeleteMessage(activeChar.id, msgId)}
        isFollowed={activeChar ? followedCharIds.includes(activeChar.id) : true}
        isStoryViewed={activeChar ? viewedStoryIds.includes(activeChar.id) : false}
        memoriesCount={activeChar ? (charMemories[activeChar.id] || getCharacterMemories(activeChar.id)).length : 0}
        onOpenMemoryVault={() => setMemoryVaultOpen(true)}
        onOpenSharePhoto={() => setSharePhotoModalOpen(true)}
        onImageClick={(url, caption, senderName) => setLightboxData({ url, caption, senderName })}
        onToggleFollow={() => activeChar && handleToggleFollow(activeChar.id)}
        onSetReplyingTo={setReplyingTo}
        onSelectCharacter={handleSelectCharacter}
        onToggleAutoAway={() => setAutoAwayEnabled(prev => !prev)}
        onTriggerAwayMessage={() => triggerInboundAwayMessage(undefined, true)}
        onInputChange={setInputText}
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        onToggleBurner={handleToggleBurner}
        onStartCall={handleStartCall}
        onRequestPhoto={() => handleSendMessage('send me a selfie / photo right now')}
        onSendEmoji={(emoji) => handleSendMessage(emoji)}
        onOpenPromptSpec={() => setPromptSpecModalOpen(true)}
        onOpenStory={() => {
          if (activeChar?.storyImg) {
            setStoryCharId(activeChar.id);
          }
        }}
        onOpenLockedStory={(char) => setLockedStoryChar(char)}
        onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
      />
    </div>
  );
}
