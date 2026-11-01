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
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal';
import { UnifiedSettingsModal, SettingsTabId } from './components/UnifiedSettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

import {
  DEFAULT_CHARACTERS,
} from './data/characters';
import {
  PRESET_GROUP_ROOMS,
  checkAndUnlockGroupRooms,
} from './data/groupRooms';
import {
  Character,
  Message,
  CallState,
  UserProfile,
  ReplyReference,
  AppThemeConfig,
  DynamicGroupRoom,
  BacklogMessage,
  RelationshipScoreBreakdown,
  StoryItem,
} from './types';
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
  getMergedCharacterMemories,
  buildMemoryPromptBlock,
  getAllCharactersMemories,
  addCharacterMemory,
  removeCharacterMemory,
  clearCharacterMemories,
  extractFactsFromUserMessage,
} from './utils/memory';
import {
  buildDirectivePromptBlock,
  processArchitectCommand,
  getCharacterDirective,
  replaceCharacterMacros,
  getCharacterDefinitionFields,
  buildCharacterCaiDefinitionBlock,
  getLiveTemporalContext,
  buildLiveTemporalPromptBlock,
  DEFAULT_FREQUENCY_PENALTY,
  DEFAULT_PRESENCE_PENALTY,
  MAX_CHAT_HISTORY_MESSAGES,
  deduplicateConsecutiveBubbles,
} from './utils/responseDirector';
import {
  formatBubbleTimestamp,
  orchestrateSequentialBubbles,
} from './utils/semanticOrchestrator';
import { resolveAvatarUrl } from './utils/avatarHelper';
import {
  parseCaiTranscript,
  computeAffinityDeltaFromTranscript,
  getRelationshipTierFromAffinity,
  evaluateTurnAffinityChange,
  buildBondToneInstruction,
} from './utils/caiImporter';
import {
  loadChatsFromIndexedDB,
  saveChatsToIndexedDB,
  peekLegacyLocalStorageChats,
  loadGroupRoomMessagesFromIndexedDB,
  saveGroupRoomMessagesToIndexedDB,
  clearAllChatsInIndexedDB,
} from './utils/idbStorage';
import {
  refreshAndRotateStories,
  rotateCharacterStoryNow,
} from './utils/storiesManager';

// Strict 3 to 4 hour cooldown window for automatic away check-ins (in milliseconds)
const MIN_AWAY_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours
const MAX_AWAY_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

function generateAwayCooldownWindowMs(): number {
  return Math.floor(
    MIN_AWAY_COOLDOWN_MS + Math.random() * (MAX_AWAY_COOLDOWN_MS - MIN_AWAY_COOLDOWN_MS)
  );
}

const BASELINE_RELATIONSHIP_PROMPT_BLOCK = `\n\n[BASELINE RELATIONSHIP & AFFINITY STATE: 0 / STRANGER TIER]:
- Relationship Level: 0 | Affinity: 0 | Affection: 0 | Intimacy: 0 | Trust Score: 0 | Bond: 0 (Tier: Stranger / Neutral).
- Treat the user as a new contact / baseline stranger unless familiarity, trust, or closeness is built organically within the current conversation history. Remove any pre-existing assumed intimacy.`;

/**
 * Clears and resets all saved character relationship levels, affinity scores,
 * affection meters, intimacy meters, trust scores, and bond progression in localStorage back to 0.
 */
function clearAndResetStoredRelationshipProgression(): Record<string, number> {
  const baselineMap: Record<string, number> = {};
  DEFAULT_CHARACTERS.forEach(c => {
    baselineMap[c.id] = 0;
  });

  try {
    const keysToRemove: string[] = [
      'pulsedirect_relationship_levels',
      'pulsedirect_relationships',
      'pulsedirect_affinity',
      'pulsedirect_affection',
      'pulsedirect_intimacy',
      'pulsedirect_bond',
      'pulsedirect_trust_scores',
      'pulsedirect_followed_chars',
      'pulsedirect_group_rooms',
      'pulsedirect_score_breakdowns',
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const lower = k.toLowerCase();
      if (
        lower.startsWith('pulsedirect_affinity_') ||
        lower.startsWith('pulsedirect_relationship_') ||
        lower.startsWith('pulsedirect_affection_') ||
        lower.startsWith('pulsedirect_intimacy_') ||
        lower.startsWith('pulsedirect_bond_') ||
        lower.startsWith('pulsedirect_trust_') ||
        lower.startsWith('pulsedirect_messages_imp_') ||
        lower.startsWith('pulsedirect_messages_batfamily_') ||
        lower.includes('affinity') ||
        lower.includes('affection') ||
        lower.includes('intimacy') ||
        lower.includes('relationship') ||
        lower.includes('bond_score') ||
        lower.includes('trust_score')
      ) {
        keysToRemove.push(k);
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('pulsedirect_relationship_levels', JSON.stringify(baselineMap));
  } catch {
    // ignore storage errors
  }

  return baselineMap;
}

function buildBaselineScoreBreakdowns(): Record<string, RelationshipScoreBreakdown> {
  const map: Record<string, RelationshipScoreBreakdown> = {};
  DEFAULT_CHARACTERS.forEach(c => {
    map[c.id] = {
      affinity: 0,
      tier: 'Stranger',
      positiveTriggersCount: 0,
      negativeTriggersCount: 0,
    };
  });
  return map;
}

/**
 * Retrieves the custom Gemini API key only if explicitly entered by the user.
 * If no custom key was explicitly entered, returns an empty string so that
 * the x-gemini-api-key header is omitted, allowing server.ts to use process.env.GEMINI_API_KEY directly.
 */
function getExplicitCustomApiKey(): string {
  try {
    const raw =
      localStorage.getItem('custom_gemini_api_key') ||
      localStorage.getItem('pulsedirect_custom_gemini_key') ||
      '';
    const trimmed = raw.trim();
    const legacyDefaultKeys = [
      'AQ.Ab8RN6J3YDA2B2UyD5u6nbL-gwPwngVmsE_UvBg8R4chB5ewVw',
      'AQ.Ab8RN6KeetZWTWlQXdP_5ZwaCZsFG0P5lVOKVbsOcg20CExwBA',
      'AQ.Ab8RN6K4pHZaYJMWUHLx_dTwv9WjFpfo4zs91jGAwNQQucCm_w',
    ];
    if (trimmed && legacyDefaultKeys.includes(trimmed)) {
      localStorage.removeItem('custom_gemini_api_key');
      localStorage.removeItem('pulsedirect_custom_gemini_key');
      return '';
    }
    return trimmed;
  } catch {
    return '';
  }
}

export default function App() {
  const [themeConfig, setThemeConfig] = useState<AppThemeConfig>(loadSavedThemeConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId>('account');
  const [isCaiImportModalOpen, setIsCaiImportModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // Baseline 0 relationship progression state for all characters
  const [relationshipLevels, setRelationshipLevels] = useState<Record<string, number>>(() => {
    try {
      const initialized = localStorage.getItem('pulsedirect_baseline_v2_init') === 'true';
      if (!initialized) {
        const map = clearAndResetStoredRelationshipProgression();
        localStorage.setItem('pulsedirect_baseline_v2_init', 'true');
        return map;
      }
      const saved = localStorage.getItem('pulsedirect_relationship_levels');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: Record<string, number> = {};
        DEFAULT_CHARACTERS.forEach(c => {
          merged[c.id] = typeof parsed[c.id] === 'number' ? parsed[c.id] : 0;
        });
        return merged;
      }
    } catch {
      // fallback
    }
    return clearAndResetStoredRelationshipProgression();
  });

  // Detailed relationship score breakdowns per character
  const [scoreBreakdowns, setScoreBreakdowns] = useState<Record<string, RelationshipScoreBreakdown>>(() => {
    try {
      const saved = localStorage.getItem('pulsedirect_score_breakdowns');
      if (saved) {
        return { ...buildBaselineScoreBreakdowns(), ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return buildBaselineScoreBreakdowns();
  });

  // Dynamic Group Rooms State (starts locked at baseline 0 until a member's affinity threshold is reached)
  const [groupRooms, setGroupRooms] = useState<DynamicGroupRoom[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedirect_group_rooms');
      if (saved) {
        const parsed: DynamicGroupRoom[] = JSON.parse(saved);
        return PRESET_GROUP_ROOMS.map(preset => {
          const match = parsed.find(p => p.id === preset.id);
          return match
            ? { ...preset, isUnlocked: Boolean(match.isUnlocked), unlockedBy: match.unlockedBy }
            : { ...preset, isUnlocked: false, unlockedBy: undefined };
        });
      }
    } catch {
      // fallback
    }
    return PRESET_GROUP_ROOMS.map(room => ({ ...room, isUnlocked: false, unlockedBy: undefined }));
  });
  const [activeGroupRoomId, setActiveGroupRoomId] = useState<string>('');
  const [groupRoomMessages, setGroupRoomMessages] = useState<Record<string, BacklogMessage[]>>({});
  const [groupTypingSenderName, setGroupTypingSenderName] = useState<string | null>(null);

  // Characters list (including custom imported characters from C.AI and persisted operative_user_counts)
  const [characters, setCharacters] = useState<Character[]>(() => {
    let savedUserCounts: Record<string, number> = {};
    try {
      const rawCounts = localStorage.getItem('operative_user_counts');
      if (rawCounts) {
        savedUserCounts = JSON.parse(rawCounts);
      }
    } catch {
      // ignore
    }

    const baseWithCounts = DEFAULT_CHARACTERS.map(c => {
      const count = typeof savedUserCounts[c.id] === 'number' ? savedUserCounts[c.id] : (c.userCount ?? 1200);
      savedUserCounts[c.id] = count;
      const resolvedAvatar = resolveAvatarUrl(c.avatarUrl || c.avatar, c.id);
      const resolvedStory = c.storyImg ? resolveAvatarUrl(c.storyImg, c.id) : resolvedAvatar;
      return {
        ...c,
        avatar: resolvedAvatar,
        avatarUrl: resolvedAvatar,
        storyImg: resolvedStory,
        userCount: count,
        interactionCount: count,
      };
    });

    try {
      localStorage.setItem('operative_user_counts', JSON.stringify(savedUserCounts));
      const saved = localStorage.getItem('pulsedirect_custom_characters');
      if (saved) {
        const customList: Character[] = JSON.parse(saved);
        const defaultIds = new Set(DEFAULT_CHARACTERS.map(c => c.id));
        const normalizedCustom = customList
          .filter(c => c && !defaultIds.has(c.id))
          .map(c => {
            const count = typeof savedUserCounts[c.id] === 'number' ? savedUserCounts[c.id] : (c.userCount ?? 850);
            const resolvedAvatar = resolveAvatarUrl(c.avatarUrl || c.avatar, c.id);
            return {
              ...c,
              avatar: resolvedAvatar,
              avatarUrl: resolvedAvatar,
              storyImg: c.storyImg ? resolveAvatarUrl(c.storyImg, c.id) : resolvedAvatar,
              relationshipLevel: 0,
              affinity: 0,
              affection: 0,
              trustScore: 0,
              bond: 0,
              relationshipTier: 'Stranger',
              userCount: count,
              interactionCount: count,
            };
          });
        localStorage.setItem('pulsedirect_custom_characters', JSON.stringify(normalizedCustom));
        return [...baseWithCounts, ...normalizedCustom];
      }
    } catch {
      // fallback
    }
    return baseWithCounts;
  });

  const incrementOperativeUserCount = (charId: string) => {
    setCharacters(prev => {
      const next = prev.map(c => {
        if (c.id !== charId) return c;
        const updatedCount = (c.userCount ?? 1200) + 1;
        return {
          ...c,
          userCount: updatedCount,
          interactionCount: updatedCount,
        };
      });
      try {
        const raw = localStorage.getItem('operative_user_counts');
        const map: Record<string, number> = raw ? JSON.parse(raw) : {};
        const target = next.find(c => c.id === charId);
        if (target) {
          map[charId] = target.userCount ?? 1201;
          localStorage.setItem('operative_user_counts', JSON.stringify(map));
        }
      } catch {
        // ignore
      }
      return next;
    });
  };

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

  // Messages state: Empty by default for new users; peeks any unmigrated legacy localStorage chats synchronously and then hydrates from IndexedDB
  const [chats, setChats] = useState<Record<string, Message[]>>(() =>
    peekLegacyLocalStorageChats()
  );
  const [idbHydrated, setIdbHydrated] = useState<boolean>(false);

  // One-time automatic migration from localStorage -> IndexedDB and initial IndexedDB hydration
  useEffect(() => {
    let cancelled = false;
    loadChatsFromIndexedDB()
      .then((loadedChats) => {
        if (cancelled) return;
        if (loadedChats && Object.keys(loadedChats).length > 0) {
          setChats((prev) => {
            const merged: Record<string, Message[]> = { ...loadedChats };
            for (const [charId, currList] of Object.entries(prev)) {
              if (!Array.isArray(currList) || currList.length === 0) continue;
              const existing = merged[charId] || [];
              if (existing.length === 0) {
                merged[charId] = currList;
              } else {
                const seen = new Set(existing.map((m) => m.id));
                const combined = [...existing];
                for (const m of currList) {
                  if (m && m.id && !seen.has(m.id)) {
                    seen.add(m.id);
                    combined.push(m);
                  }
                }
                combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                merged[charId] = combined;
              }
            }
            return merged;
          });
        }
        setIdbHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setIdbHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  // AI Connection & Error Banner State
  const [hasServerAi, setHasServerAi] = useState<boolean>(false);
  const [apiErrorBanner, setApiErrorBanner] = useState<string | null>(null);
  const [lastFailedMessageText, setLastFailedMessageText] = useState<string | null>(null);
  const [regeneratingMsgId, setRegeneratingMsgId] = useState<string | null>(null);

  // Followed Characters State (starts at 0 / empty so no character has pre-existing bond status)
  const [followedCharIds, setFollowedCharIds] = useState<string[]>([]);

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

  // 24-Hour Expiring Stories State (tracks timestamp & expiresAt, auto-rotates expired stories on mount)
  const [activeStoriesMap, setActiveStoriesMap] = useState<Record<string, StoryItem>>(() => {
    const { storiesMap } = refreshAndRotateStories(DEFAULT_CHARACTERS);
    return storiesMap;
  });

  // Automated routine on app mount (and periodic check) that filters out any story older than 24 hours
  // and rotates expired stories to their next canon status update/photo snippet for the day
  useEffect(() => {
    const runStoryExpirationSweep = () => {
      const { storiesMap, rotatedCharIds } = refreshAndRotateStories(characters);
      setActiveStoriesMap(storiesMap);

      // Sync active 24h story fields onto character objects so any viewer modal reflects the rotated snippet
      setCharacters(prev =>
        prev.map(c => {
          const item = storiesMap[c.id];
          if (!item) return c;
          return {
            ...c,
            storyImg: item.storyImg,
            storyText: item.storyText,
            storyTime: item.storyTime,
            storyTimestamp: item.timestamp,
            storyExpiresAt: item.expiresAt,
          };
        })
      );

      // If any character's story rotated to a fresh daily update, clear their viewed flag so the neon ring pulses
      if (rotatedCharIds.length > 0) {
        setViewedStoryIds(prev => {
          const rotatedSet = new Set(rotatedCharIds);
          const filtered = prev.filter(id => !rotatedSet.has(id));
          try {
            localStorage.setItem('pulsedirect_viewed_stories', JSON.stringify(filtered));
          } catch {
            // ignore
          }
          return filtered;
        });
      }
    };

    runStoryExpirationSweep();
    const interval = setInterval(runStoryExpirationSweep, 60000);
    return () => clearInterval(interval);
  }, [characters.length]);

  const handleRotateCharacterStory = (charId: string) => {
    const targetChar = characters.find(c => c.id === charId);
    if (!targetChar) return;
    const rotatedItem = rotateCharacterStoryNow(targetChar, activeStoriesMap);
    setActiveStoriesMap(prev => ({
      ...prev,
      [charId]: rotatedItem,
    }));
    setCharacters(prev =>
      prev.map(c =>
        c.id === charId
          ? {
              ...c,
              storyImg: rotatedItem.storyImg,
              storyText: rotatedItem.storyText,
              storyTime: rotatedItem.storyTime,
              storyTimestamp: rotatedItem.timestamp,
              storyExpiresAt: rotatedItem.expiresAt,
            }
          : c
      )
    );
  };

  // Character Memories State (initialized from localStorage across all characters)
  const [charMemories, setCharMemories] = useState<Record<string, string[]>>(() => {
    try {
      return getAllCharactersMemories(DEFAULT_CHARACTERS.map(c => c.id));
    } catch {
      return {};
    }
  });

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
  const callTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearCallTimers = () => {
    callTimersRef.current.forEach(t => clearTimeout(t));
    callTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearCallTimers();
    };
  }, []);

  /**
   * Direct message dispatcher used by checkAndUnlockGroupRooms when a character's
   * requiredAffinity threshold is reached and they invite the user to a group room.
   */
  const sendDirectMessageFromCharacter = (senderId: string, text: string) => {
    const inviteMsg: Message = {
      id: `invite-dm-${senderId}-${Date.now()}`,
      sender: 'char',
      text,
      timestamp: Date.now(),
    };

    playMessageReceivedSound();

    if (burnerMode) {
      setBurnerChats(prev => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), inviteMsg],
      }));
    } else {
      setChats(prev => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), inviteMsg],
      }));
    }

    setActiveConversationIds(prev => (prev.includes(senderId) ? prev : [senderId, ...prev]));

    if (senderId !== activeCharId || activeGroupRoomId) {
      setUnreadCounts(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));
    }
  };

  /**
   * Updates a character's affinity score and checks if any DynamicGroupRoom should unlock.
   */
  const applyCharacterAffinityUpdate = (
    charId: string,
    delta: number,
    options?: {
      posHits?: number;
      negHits?: number;
      importedSummary?: string;
    }
  ) => {
    const currentAffinity = relationshipLevels[charId] ?? 0;
    const nextAffinity = Math.max(-100, Math.min(100, currentAffinity + delta));
    const nextTier = getRelationshipTierFromAffinity(nextAffinity);

    const nextAffinityMap: Record<string, number> = {
      ...relationshipLevels,
      [charId]: nextAffinity,
    };

    setRelationshipLevels(nextAffinityMap);
    try {
      localStorage.setItem('pulsedirect_relationship_levels', JSON.stringify(nextAffinityMap));
      localStorage.setItem('pulsedirect_bond_scores', JSON.stringify(nextAffinityMap));
    } catch {
      // ignore
    }

    setScoreBreakdowns(prev => {
      const existing = prev[charId] || {
        affinity: 0,
        bondScore: 0,
        tier: 'Stranger',
        positiveTriggersCount: 0,
        negativeTriggersCount: 0,
      };
      const updated: RelationshipScoreBreakdown = {
        affinity: nextAffinity,
        bondScore: nextAffinity,
        tier: nextTier,
        positiveTriggersCount: existing.positiveTriggersCount + (options?.posHits ?? (delta > 0 ? 1 : 0)),
        negativeTriggersCount: existing.negativeTriggersCount + (options?.negHits ?? (delta < 0 ? 1 : 0)),
        importedHistorySummary: options?.importedSummary ?? existing.importedHistorySummary,
        lastAnalysisTimestamp: options?.importedSummary
          ? new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : existing.lastAnalysisTimestamp,
      };
      const nextMap = {
        ...prev,
        [charId]: updated,
      };
      try {
        localStorage.setItem('pulsedirect_score_breakdowns', JSON.stringify(nextMap));
      } catch {
        // ignore
      }
      return nextMap;
    });

    // Check if any DynamicGroupRoom threshold is now reached
    const evaluatedRooms = checkAndUnlockGroupRooms(
      nextAffinityMap,
      groupRooms,
      sendDirectMessageFromCharacter
    );

    setGroupRooms(evaluatedRooms);
    try {
      localStorage.setItem('pulsedirect_group_rooms', JSON.stringify(evaluatedRooms));
    } catch {
      // ignore
    }

    // Sync any newly unlocked room's persisted backlog from IndexedDB into state
    evaluatedRooms.forEach(room => {
      if (room.isUnlocked) {
        loadGroupRoomMessagesFromIndexedDB(room.id).then(parsed => {
          if (parsed && parsed.length > 0) {
            setGroupRoomMessages(prev => ({ ...prev, [room.id]: parsed }));
          }
        });
      }
    });
  };

  /**
   * Resets a single character's affinity back to 0 (Stranger tier)
   */
  const handleResetCharacterAffinity = (charId: string) => {
    const nextAffinityMap: Record<string, number> = {
      ...relationshipLevels,
      [charId]: 0,
    };
    setRelationshipLevels(nextAffinityMap);
    try {
      localStorage.setItem('pulsedirect_relationship_levels', JSON.stringify(nextAffinityMap));
    } catch {
      // ignore
    }
    setScoreBreakdowns(prev => {
      const next = {
        ...prev,
        [charId]: {
          affinity: 0,
          tier: 'Stranger' as const,
          positiveTriggersCount: 0,
          negativeTriggersCount: 0,
        },
      };
      try {
        localStorage.setItem('pulsedirect_score_breakdowns', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  /**
   * Handles importing a Character.AI past conversation transcript from ScoreBreakdownModal
   */
  const handleImportTranscriptForActiveChar = (rawTranscript: string) => {
    if (!activeChar) return;
    const { userMessages, botMessages } = parseCaiTranscript(rawTranscript, activeChar.name);
    const analysis = computeAffinityDeltaFromTranscript(userMessages, activeChar.id);

    // Extract user facts from transcript user messages
    userMessages.forEach(msg => {
      const facts = extractFactsFromUserMessage(msg, currentUser?.codename || 'You');
      facts.forEach(f => {
        const updated = addCharacterMemory(activeChar.id, f);
        setCharMemories(prev => ({ ...prev, [activeChar.id]: updated }));
      });
    });

    // Also append imported messages into the chat history if non-empty
    if (userMessages.length > 0 || botMessages.length > 0) {
      const maxLen = Math.max(userMessages.length, botMessages.length);
      const reconstructed: Message[] = [];
      const baseTs = Date.now() - maxLen * 120000;
      for (let i = 0; i < maxLen; i++) {
        if (i < userMessages.length && userMessages[i]) {
          reconstructed.push({
            id: `cai-tr-u-${Date.now()}-${i}`,
            sender: 'user',
            text: userMessages[i],
            timestamp: baseTs + i * 120000,
          });
        }
        if (i < botMessages.length && botMessages[i]) {
          reconstructed.push({
            id: `cai-tr-b-${Date.now()}-${i}`,
            sender: 'char',
            text: botMessages[i],
            timestamp: baseTs + i * 120000 + 30000,
          });
        }
      }

      if (reconstructed.length > 0) {
        if (burnerMode) {
          setBurnerChats(prev => ({
            ...prev,
            [activeChar.id]: [...(prev[activeChar.id] || []), ...reconstructed],
          }));
        } else {
          setChats(prev => ({
            ...prev,
            [activeChar.id]: [...(prev[activeChar.id] || []), ...reconstructed],
          }));
        }
      }
    }

    const summaryText = `${analysis.delta >= 0 ? '+' : ''}${analysis.delta} Affinity (${analysis.importedMessageCount} msgs): ${analysis.reason}`;
    applyCharacterAffinityUpdate(activeChar.id, analysis.delta, {
      posHits: analysis.delta > 0 ? Math.max(1, Math.round(analysis.delta / 3)) : 0,
      negHits: analysis.delta < 0 ? Math.max(1, Math.round(Math.abs(analysis.delta) / 3)) : 0,
      importedSummary: summaryText,
    });
  };

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

  // Real-time Clock (12-hour format)
  const [liveClock, setLiveClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  );

  // Persist chat logs exclusively to IndexedDB (and lightweight active_convos index to localStorage) when not in burner mode
  useEffect(() => {
    if (!burnerMode && currentUser && idbHydrated) {
      saveChatsToIndexedDB(chats);
      try {
        localStorage.setItem('pulsedirect_active_convos', JSON.stringify(activeConversationIds));
      } catch {
        // storage quota exceeded or disabled
      }
    }
  }, [chats, activeConversationIds, burnerMode, currentUser, idbHydrated]);

  // Sync Clock (12-hour format)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      };
      setLiveClock(now.toLocaleTimeString('en-US', options));
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
        const active = Boolean(data.hasApiKey || data.aiConfigured);
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
    // If a previously hardcoded default key is lingering in localStorage, clear it
    try {
      const current = localStorage.getItem('custom_gemini_api_key');
      const legacyDefaultKeys = [
        'AQ.Ab8RN6J3YDA2B2UyD5u6nbL-gwPwngVmsE_UvBg8R4chB5ewVw',
        'AQ.Ab8RN6KeetZWTWlQXdP_5ZwaCZsFG0P5lVOKVbsOcg20CExwBA',
        'AQ.Ab8RN6K4pHZaYJMWUHLx_dTwv9WjFpfo4zs91jGAwNQQucCm_w',
      ];
      if (current && legacyDefaultKeys.includes(current.trim())) {
        localStorage.removeItem('custom_gemini_api_key');
        localStorage.removeItem('pulsedirect_custom_gemini_key');
      }
    } catch {
      // ignore
    }
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
      const rawAccounts = localStorage.getItem('pulsedirect_registered_users');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        if (Array.isArray(accounts)) {
          const syncedAccounts = accounts.map((acc: Record<string, unknown>) => {
            if (
              acc.id === updated.id ||
              (updated.email &&
                typeof acc.email === 'string' &&
                acc.email.toLowerCase() === updated.email.toLowerCase())
            ) {
              return {
                ...acc,
                username: updated.username,
                codename: updated.codename,
                avatarColor: updated.avatarColor,
              };
            }
            return acc;
          });
          localStorage.setItem('pulsedirect_registered_users', JSON.stringify(syncedAccounts));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pulsedirect_current_user');
    localStorage.removeItem('pulsedirect_chats');
    localStorage.removeItem('pulsedirect_active_convos');
    clearAllChatsInIndexedDB();
    setCurrentUser(null);
    setChats({});
    setActiveConversationIds([]);
    setActiveCharId('');
    setActiveGroupRoomId('');
  };

  const handleFactoryReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    clearAllChatsInIndexedDB();
    setIsSettingsModalOpen(false);
    setCurrentUser(null);
    setChats({});
    setBurnerChats({});
    setCharMemories({});
    setActiveConversationIds([]);
    setActiveCharId('');
    setActiveGroupRoomId('');
    setMasterPin('');
    setTabBlurLock(false);
    setCharacters(DEFAULT_CHARACTERS);
    setRelationshipLevels(clearAndResetStoredRelationshipProgression());
    setScoreBreakdowns(buildBaselineScoreBreakdowns());
    setGroupRooms(PRESET_GROUP_ROOMS.map(room => ({ ...room, isUnlocked: false, unlockedBy: undefined })));
  };

  /**
   * Delivers one or more character response bubbles sequentially using the semantic
   * bubble orchestrator and character's typing speed profile.
   * Assigns an updated, separate timestamp to each individual bubble as it appears.
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
    const sequenceId = ++typingSequenceCancelRef.current;
    const currentChatHistory = (burnerMode ? burnerChats[char.id] : chats[char.id]) || [];
    const recentCharMsgs = currentChatHistory
      .filter(m => m.sender === 'char' && m.text)
      .slice(-4)
      .map(m => m.text);
    const deduplicatedReplyText =
      deduplicateConsecutiveBubbles(rawReplyText, recentCharMsgs) || rawReplyText;

    orchestrateSequentialBubbles(
      char.id,
      deduplicatedReplyText,
      {
        shouldCancel: () => typingSequenceCancelRef.current !== sequenceId,
        onTypingChange: (typing) => setIsTyping(typing),
        onDeliverBubble: (bubbleText, index, bubbleTimestampMs) => {
          playMessageReceivedSound();

          const charMsg: Message = {
            id: `char-${bubbleTimestampMs}-${index}-${Math.random().toString(36).substring(2, 6)}`,
            sender: 'char',
            text: bubbleText,
            variants: [bubbleText],
            activeVariantIndex: 0,
            variations: [bubbleText],
            activeVariationIndex: 0,
            image: index === 0 ? options?.photoUrl : undefined,
            timestamp: bubbleTimestampMs,
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
        },
      },
      { alreadyWaitedMs: options?.alreadyWaitedMs }
    );
  };

  /**
   * Builds the full character system instruction combining `system`, `systemInstruction`,
   * Character.ai `scenario` & `mesExamples` (with {{char}} and {{user}} variable replacement),
   * live real-world temporal synchronization (day of week, date, 12h/24h time, and phase of day),
   * live relationship bondScore/tier context, Response Director overrides, AND all extracted
   * episodic memories from MemoryVaultModal / localStorage for the character.
   */
  const buildFullCharacterSystemPrompt = (char: Character, explicitMemories?: string[]): string => {
    const now = new Date();
    const userName = currentUser?.codename || currentUser?.username || 'You';
    const directive = getCharacterDirective(char.id);
    const rawPrimarySystem = directive.systemOverride || char.system || char.systemInstruction || '';
    const primarySystem = replaceCharacterMacros(rawPrimarySystem, char.name, userName, now);
    const rawExtraSystem =
      !directive.systemOverride &&
      char.systemInstruction &&
      char.system &&
      !char.system.includes(char.systemInstruction)
        ? `\n\n[ADDITIONAL CANON LORE & CONTINUITY]:\n${char.systemInstruction}`
        : '';
    const extraSystem = replaceCharacterMacros(rawExtraSystem, char.name, userName, now);
    const caiDefinitionBlock = buildCharacterCaiDefinitionBlock(char, userName, now);
    const liveTemporalBlock = buildLiveTemporalPromptBlock(char.name, userName, now);
    const currentAffinity = relationshipLevels[char.id] ?? 0;
    const currentTier = getRelationshipTierFromAffinity(currentAffinity);
    const bondToneGuidance = buildBondToneInstruction(currentAffinity, char.name);
    const dynamicRelationshipBlock = `\n\n[CURRENT RELATIONSHIP & BOND PROGRESSION]:
- Current Bond Score: ${currentAffinity} / 100 (Status Tier: ${currentTier}).
- ${bondToneGuidance}
- Baseline started at 0 (Stranger). Let this ${currentTier} bond tier subtly shape your warmth, banter, and emotional openness while staying 100% true to your canon personality.`;
    const directiveBlock = buildDirectivePromptBlock(char.id, char.name, userName);
    const memoryVaultBlock = buildMemoryPromptBlock(
      char.id,
      explicitMemories ?? charMemories[char.id]
    );
    return `${primarySystem}${extraSystem}${caiDefinitionBlock}${liveTemporalBlock}${BASELINE_RELATIONSHIP_PROMPT_BLOCK}${dynamicRelationshipBlock}${memoryVaultBlock}${directiveBlock}`;
  };

  /**
   * Helper that posts to /api/chat with automatic client-side exponential backoff retry
   * on transient 429 / 502 / 503 / network errors.
   */
  const postChatWithBackoff = async (
    payload: Record<string, unknown>,
    customKey: string,
    maxRetries: number = 2
  ): Promise<{ ok: boolean; status: number; data: any }> => {
    let lastStatus = 500;
    let lastData: any = {};
    const trimmedKey = (customKey || '').trim();
    const liveTemporalContext = getLiveTemporalContext(new Date());
    const cappedHistory = Array.isArray(payload.history)
      ? payload.history.slice(-MAX_CHAT_HISTORY_MESSAGES)
      : payload.history;
    const enrichedPayload = {
      ...payload,
      history: cappedHistory,
      frequencyPenalty: DEFAULT_FREQUENCY_PENALTY,
      presencePenalty: DEFAULT_PRESENCE_PENALTY,
      temporalContext: payload.temporalContext || liveTemporalContext,
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delayMs = Math.min(4000, 750 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250));
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        // If no custom key is explicitly entered by the user, do not send the x-gemini-api-key header
        if (trimmedKey) {
          headers['x-gemini-api-key'] = trimmedKey;
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(enrichedPayload),
        });
        const data = await res.json().catch(() => ({}));
        lastStatus = res.status;
        lastData = data;

        if (res.ok && data?.text && String(data.text).trim()) {
          return { ok: true, status: res.status, data };
        }
        // Do not retry on invalid API key (401)
        if (res.status === 401 || data?.error === 'INVALID_KEY') {
          return { ok: false, status: res.status, data };
        }
      } catch (err) {
        lastData = { error: 'NETWORK_ERROR', message: String(err) };
      }
    }

    return { ok: false, status: lastStatus, data: lastData };
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

    try {
      const currentRelLevel = relationshipLevels[char.id] ?? 0;
      const customStoredKey = getExplicitCustomApiKey();

      const memories = getMergedCharacterMemories(char.id, charMemories[char.id]);
      const userName = currentUser?.codename || currentUser?.username || 'You';
      const defFields = getCharacterDefinitionFields(char, userName);
      const { ok, data } = await postChatWithBackoff(
        {
          prompt: `[INBOUND_AWAY_CHECKIN]: Several hours have passed since you last heard from ${userName}. Send a spontaneous, natural check-in text or share something new happening on your end in your canon voice (current relationship/affinity level: ${currentRelLevel} - ${getRelationshipTierFromAffinity(currentRelLevel)}). Max 2 short bubbles separated by ' || '.`,
          systemInstruction: buildFullCharacterSystemPrompt(char, memories),
          charName: char.name,
          userName,
          scenario: defFields.resolvedScenario,
          mesExamples: defFields.resolvedMesExamples,
          memories: memories.slice(0, 75),
          history: historyContext.slice(-15).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        },
        customStoredKey
      );

      if (ok && data.text && String(data.text).trim()) {
        replyText = String(data.text).trim();
        setApiErrorBanner(null);
        if (!hasServerAi) setHasServerAi(true);
      } else {
        setIsTyping(false);
        setApiErrorBanner(data?.message || data?.error || '⚠️ Gemini API quota / connection error');
        return;
      }
    } catch {
      setIsTyping(false);
      setApiErrorBanner('⚠️ Gemini API quota / connection error');
      return;
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
  const activeGroupRoom = groupRooms.find(r => r.id === activeGroupRoomId && r.isUnlocked);
  const currentMessages = activeCharId ? (burnerMode ? burnerChats[activeCharId] : chats[activeCharId]) || [] : [];

  // Selecting a Character (from search, registry, or sidebar)
  const handleSelectCharacter = (id: string) => {
    setActiveGroupRoomId('');
    setActiveCharId(id);
    // Sync memories from localStorage for this character
    const storedMemories = getCharacterMemories(id);
    setCharMemories(prev => ({
      ...prev,
      [id]: getMergedCharacterMemories(id, prev[id] || storedMemories),
    }));
    if (!activeConversationIds.includes(id)) {
      setActiveConversationIds(prev => [id, ...prev]);
      incrementOperativeUserCount(id);
    }

    const selectedChar = characters.find(c => c.id === id);
    const initialGreetingMsg: Message[] = selectedChar?.greeting
      ? [
          {
            id: `greeting-${id}`,
            sender: 'char',
            text: selectedChar.greeting,
            variants: [selectedChar.greeting],
            activeVariantIndex: 0,
            variations: [selectedChar.greeting],
            activeVariationIndex: 0,
            timestamp: Date.now(),
          },
        ]
      : [];

    if (!chats[id] || (chats[id].length === 0 && initialGreetingMsg.length > 0)) {
      setChats(prev => ({ ...prev, [id]: initialGreetingMsg }));
    }
    if (burnerMode && (!burnerChats[id] || (burnerChats[id].length === 0 && initialGreetingMsg.length > 0))) {
      setBurnerChats(prev => ({ ...prev, [id]: initialGreetingMsg }));
    }

    setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
    document.title = 'EchoVault';
  };

  // Selecting an Unlocked Group Room
  const handleSelectGroupRoom = (roomId: string) => {
    const room = groupRooms.find(r => r.id === roomId);
    if (!room || !room.isUnlocked) return;
    setActiveGroupRoomId(roomId);
    if (!groupRoomMessages[roomId]) {
      setGroupRoomMessages(prev => ({ ...prev, [roomId]: room.baseBacklog }));
      loadGroupRoomMessagesFromIndexedDB(roomId).then(saved => {
        if (saved && saved.length > 0) {
          setGroupRoomMessages(prev => ({ ...prev, [roomId]: saved }));
        }
      });
    }
  };

  // Sending a Message in an Unlocked Dynamic Group Room (with Group Banter Interjections in I.M.P. Comms)
  const handleSendGroupMessage = async (text: string) => {
    if (!text.trim() || !activeGroupRoom) return;
    playMessageSentSound();

    const userMsg: BacklogMessage = {
      id: `${activeGroupRoom.id}-u-${Date.now()}`,
      senderId: 'user',
      senderName: currentUser?.codename || 'Operative_07',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };

    const currentRoomHistory = [...(groupRoomMessages[activeGroupRoom.id] || activeGroupRoom.baseBacklog), userMsg];
    setGroupRoomMessages(prev => ({
      ...prev,
      [activeGroupRoom.id]: currentRoomHistory,
    }));
    saveGroupRoomMessagesToIndexedDB(activeGroupRoom.id, currentRoomHistory);

    setInputText('');

    // Choose a primary member from the group room to respond
    const lowerText = text.toLowerCase();
    const responderId =
      activeGroupRoom.memberIds.find(mid => {
        const ch = characters.find(c => c.id === mid);
        return (
          lowerText.includes(mid) ||
          (ch && lowerText.includes(ch.name.toLowerCase().split(' ')[0].replace(/ø/g, 'o')))
        );
      }) ||
      activeGroupRoom.unlockedBy ||
      activeGroupRoom.memberIds[Math.floor(Math.random() * activeGroupRoom.memberIds.length)];

    const responderChar = characters.find(c => c.id === responderId);
    if (!responderChar) {
      setIsTyping(false);
      setGroupTypingSenderName(null);
      return;
    }

    setGroupTypingSenderName(responderChar.name);
    setIsTyping(true);

    // Increment bond score slightly with the responding group member
    applyCharacterAffinityUpdate(responderChar.id, 2, { posHits: 1, negHits: 0 });

    const roomId = activeGroupRoom.id;
    const sequenceId = ++typingSequenceCancelRef.current;
    const requestStart = Date.now();

    /**
     * Triggers a spontaneous secondary banter interjection from Blitzø, Moxxie, Millie, or Loona
     * in I.M.P. Emergency Comms (or another member in unlocked group channels) reacting to what was just said.
     */
    const maybeTriggerGroupBanterInterjection = async (
      primaryChar: Character,
      primaryReplyText: string
    ) => {
      if (typingSequenceCancelRef.current !== sequenceId) return;

      // In I.M.P. Emergency Comms, prioritize Blitzø, Moxxie, or Millie (or Loona) for chaotic office banter
      const isImpRoom = roomId === 'imp_comms';
      const shouldInterject = isImpRoom ? Math.random() < 0.85 : Math.random() < 0.55;
      if (!shouldInterject) {
        setGroupTypingSenderName(null);
        return;
      }

      const impBanterCandidates = isImpRoom
        ? ['blitzo', 'moxxie', 'millie', 'loona'].filter(id => id !== primaryChar.id)
        : activeGroupRoom.memberIds.filter(id => id !== primaryChar.id);

      if (impBanterCandidates.length === 0) {
        setGroupTypingSenderName(null);
        return;
      }

      const interjectorId =
        impBanterCandidates[Math.floor(Math.random() * impBanterCandidates.length)];
      const interjectorChar = characters.find(c => c.id === interjectorId);
      if (!interjectorChar) {
        setGroupTypingSenderName(null);
        return;
      }

      // Brief pause before secondary character starts typing their interjection
      await new Promise(r => setTimeout(r, 950));
      if (typingSequenceCancelRef.current !== sequenceId) return;

      setGroupTypingSenderName(interjectorChar.name);
      setIsTyping(true);

      const userName = currentUser?.codename || currentUser?.username || 'Operative_07';
      const customStoredKey = getExplicitCustomApiKey();
      const interjectorMemories = getMergedCharacterMemories(
        interjectorChar.id,
        charMemories[interjectorChar.id]
      );
      const defFields = getCharacterDefinitionFields(interjectorChar, userName);

      // Canon fallback interjections in case API quota is temporarily exhausted
      const canonImpInterjections: Record<string, string[]> = {
        blitzo: [
          `OH SHUT UP ${primaryChar.name.toUpperCase()}!! Nobody asked for a lecture on company policy while I'm cleaning my flintlock!! 🐴🔫`,
          `WAIT A SECOND—are we talking about a new hit or is Moxxie crying about the budget again?! Because I'm in!! 🔥`,
          `Damn right!! That's why I run this circus—keep that energy up and maybe I won't dock everyone's pay!! 🏆`,
        ],
        moxxie: [
          `Sir, please! And ${primaryChar.name}, could we FOR ONCE keep this emergency tactical frequency strictly professional?! 📋💢`,
          `*adjusts bowtie exasperatedly* I swear, nobody in this office reads the operational safety memos I laminated...`,
          `Actually, I have to agree with ${userName} on that point—assuming nobody sets the company van on fire again.`,
        ],
        millie: [
          `Hahaha!! Oh c'mon ${primaryChar.name}, don't be so dramatic! Let's go grab snacks after this contract! ❤️🪓`,
          `Ooooh I like the sound of that!! Moxxie, honey, grab the extra battle axes—this is gonna be fun!! 🔥🤠`,
          `*giggles* Y'all are wild on comms today, I love this crew so much!! ❤️`,
        ],
        loona: [
          `*groans loudly* can you guys NOT blow up my phone while i'm trying to scroll sinsta at the reception desk?! 🎧🙄`,
          `lol ${primaryChar.name} really thought they ate with that one. whatever, just don't make me file paperwork.`,
        ],
      };

      let interjectionText = '';
      try {
        const { ok, data } = await postChatWithBackoff(
          {
            prompt: `[GROUP BANTER INTERJECTION IN "${activeGroupRoom.name}"]: ${userName} said: "${text.trim()}", and ${primaryChar.name} just replied: "${primaryReplyText}". Chime in unprompted as ${interjectorChar.name} with a short, witty 1-bubble canon reaction or chaotic office banter directly responding to them! Do NOT use '||'.`,
            systemInstruction: buildFullCharacterSystemPrompt(interjectorChar, interjectorMemories),
            charName: interjectorChar.name,
            userName,
            scenario: defFields.resolvedScenario,
            mesExamples: defFields.resolvedMesExamples,
            memories: interjectorMemories.slice(0, 50),
            history: [
              { role: 'user', text: `${userName}: ${text.trim()}` },
              { role: 'model', text: `${primaryChar.name}: ${primaryReplyText}` },
            ],
          },
          customStoredKey,
          1
        );

        if (ok && data?.text && String(data.text).trim()) {
          interjectionText = String(data.text).split('||')[0].trim();
        }
      } catch {
        // fallback below
      }

      if (!interjectionText) {
        const pool = canonImpInterjections[interjectorChar.id] || [
          `*chimes in on comms* Classic ${primaryChar.name}. Keep the line clear, team.`,
        ];
        interjectionText = pool[Math.floor(Math.random() * pool.length)];
      }

      if (typingSequenceCancelRef.current !== sequenceId) return;

      orchestrateSequentialBubbles(
        interjectorChar.id,
        interjectionText,
        {
          shouldCancel: () => typingSequenceCancelRef.current !== sequenceId,
          onTypingChange: (typing) => {
            setIsTyping(typing);
            if (!typing) setGroupTypingSenderName(null);
          },
          onDeliverBubble: (bubbleText, idx, bubbleTs) => {
            playMessageReceivedSound();
            const banterMsg: BacklogMessage = {
              id: `${roomId}-banter-${bubbleTs}-${idx}`,
              senderId: interjectorChar.id,
              senderName: interjectorChar.name,
              avatarUrl: interjectorChar.avatarUrl || interjectorChar.avatar,
              text: bubbleText,
              timestamp: formatBubbleTimestamp(bubbleTs),
            };
            setGroupRoomMessages(prev => {
              const updatedList = [...(prev[roomId] || currentRoomHistory), banterMsg];
              saveGroupRoomMessagesToIndexedDB(roomId, updatedList);
              return {
                ...prev,
                [roomId]: updatedList,
              };
            });
          },
        }
      );
    };

    try {
      const customStoredKey = getExplicitCustomApiKey();
      const responderMemories = getMergedCharacterMemories(
        responderChar.id,
        charMemories[responderChar.id]
      );
      const userName = currentUser?.codename || currentUser?.username || 'Operative_07';
      const defFields = getCharacterDefinitionFields(responderChar, userName);
      const { ok, data } = await postChatWithBackoff(
        {
          prompt: `[GROUP CHANNEL "${activeGroupRoom.name}"]: ${userName} just said to the group: "${text.trim()}". Reply in-character as ${responderChar.name} in 1-2 short bubbles separated by ' || '.`,
          systemInstruction: buildFullCharacterSystemPrompt(responderChar, responderMemories),
          charName: responderChar.name,
          userName,
          scenario: defFields.resolvedScenario,
          mesExamples: defFields.resolvedMesExamples,
          memories: responderMemories.slice(0, 75),
          history: currentRoomHistory
            .filter(m => !m.isSystemDivider)
            .slice(-15)
            .map(m => ({
              role: m.senderId === 'user' ? 'user' : 'model',
              text: `${m.senderName}: ${m.text}`,
            })),
        },
        customStoredKey
      );

      if (ok && data.text) {
        const primaryReplyRaw = String(data.text);
        const elapsedMs = Date.now() - requestStart;

        orchestrateSequentialBubbles(
          responderChar.id,
          primaryReplyRaw,
          {
            shouldCancel: () => typingSequenceCancelRef.current !== sequenceId,
            onTypingChange: (typing) => {
              setIsTyping(typing);
              if (!typing) {
                setGroupTypingSenderName(null);
                maybeTriggerGroupBanterInterjection(responderChar, primaryReplyRaw);
              }
            },
            onDeliverBubble: (bubbleText, idx, bubbleTs) => {
              playMessageReceivedSound();
              const botMsg: BacklogMessage = {
                id: `${roomId}-b-${bubbleTs}-${idx}`,
                senderId: responderChar.id,
                senderName: responderChar.name,
                avatarUrl: responderChar.avatarUrl || responderChar.avatar,
                text: bubbleText,
                timestamp: formatBubbleTimestamp(bubbleTs),
              };
              setGroupRoomMessages(prev => {
                const updatedList = [...(prev[roomId] || currentRoomHistory), botMsg];
                saveGroupRoomMessagesToIndexedDB(roomId, updatedList);
                return {
                  ...prev,
                  [roomId]: updatedList,
                };
              });
            },
          },
          { alreadyWaitedMs: elapsedMs }
        );
      } else {
        setIsTyping(false);
        setGroupTypingSenderName(null);
      }
    } catch {
      setIsTyping(false);
      setGroupTypingSenderName(null);
    }
  };

  // Submit User Message with Spontaneous Context-Driven AI Generation & Sequential Typing
  const handleSendMessage = async (
    text: string,
    isRetry: boolean = false,
    viewportMemories?: string[]
  ) => {
    if (!text.trim() || !activeChar) return;

    lastActivityRef.current = Date.now();
    isAwayRef.current = false;
    setIsAway(false);

    const currentReply = replyingTo ? { ...replyingTo } : undefined;
    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
      replyTo: currentReply,
    };

    const existingChatList = (burnerMode ? burnerChats[activeChar.id] : chats[activeChar.id]) || [];

    // Ensure any facts from past user messages in this conversation are also indexed in localStorage
    existingChatList
      .filter(m => m.sender === 'user' && m.text)
      .slice(-20)
      .forEach(m => {
        const pastFacts = extractFactsFromUserMessage(m.text, currentUser?.codename);
        pastFacts.forEach(pf => addCharacterMemory(activeChar.id, pf));
      });

    if (!isRetry) {
      playMessageSentSound();
      incrementOperativeUserCount(activeChar.id);

      // 1. Append user message to chat log FIRST so it remains preserved even if API errors or an invite DM is sent
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

      // 2. Evaluate live turn affinity change and check group room unlock thresholds
      const turnEval = evaluateTurnAffinityChange(text, activeChar.id);
      applyCharacterAffinityUpdate(activeChar.id, turnEval.delta, {
        posHits: turnEval.posHits,
        negHits: turnEval.negHits,
      });

      // 3. Automatically extract user facts into character's memory bank synchronously BEFORE building systemInstruction
      const newFacts = extractFactsFromUserMessage(text, currentUser?.codename);
      if (newFacts.length > 0) {
        newFacts.forEach(f => {
          addCharacterMemory(activeChar.id, f);
        });
      }
    }

    // Retrieve all merged memories from MemoryVaultModal state + localStorage for activeChar
    const activeMemories = getMergedCharacterMemories(activeChar.id, [
      ...(viewportMemories || []),
      ...(charMemories[activeChar.id] || []),
    ]);
    setCharMemories(prev => ({ ...prev, [activeChar.id]: activeMemories }));

    setIsTyping(true);
    setApiErrorBanner(null);

    // If messaging the built-in Response Director (Pulse Architect), execute live behavior command
    if (activeChar.id === 'architect') {
      const cmdResult = processArchitectCommand(text, characters);
      deliverCharacterBubblesSequentially(activeChar, cmdResult.reply);
      return;
    }

    const requestStart = Date.now();
    // Exclude the trailing retried message if isRetry is true so prompt isn't duplicated
    const historyContext =
      isRetry &&
      existingChatList.length > 0 &&
      existingChatList[existingChatList.length - 1].sender === 'user' &&
      existingChatList[existingChatList.length - 1].text === text.trim()
        ? existingChatList.slice(0, -1)
        : existingChatList;

    let replyText = '';

    try {
      let promptPayload = text.trim();
      if (currentReply) {
        promptPayload = `[Replying directly to "${currentReply.text}" from ${currentReply.senderName}]: ${text.trim()}`;
      }

      const customStoredKey = getExplicitCustomApiKey();

      // Build systemInstruction with all extracted memories injected directly inside it
      const systemInstructionWithMemories = buildFullCharacterSystemPrompt(
        activeChar,
        activeMemories
      );

      const userName = currentUser?.codename || currentUser?.username || 'You';
      const defFields = getCharacterDefinitionFields(activeChar, userName);

      const { ok, data } = await postChatWithBackoff(
        {
          prompt: promptPayload,
          systemInstruction: systemInstructionWithMemories,
          charName: activeChar.name,
          userName,
          scenario: defFields.resolvedScenario,
          mesExamples: defFields.resolvedMesExamples,
          memories: activeMemories.slice(0, 75),
          history: historyContext.slice(-15).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        },
        customStoredKey
      );

      if (ok && data.text && String(data.text).trim()) {
        replyText = String(data.text).trim();
        setApiErrorBanner(null);
        setLastFailedMessageText(null);
        if (!hasServerAi) setHasServerAi(true);
      } else {
        setIsTyping(false);
        setLastFailedMessageText(text.trim());
        const errMessage =
          data?.message ||
          (data?.error === 'QUOTA_EXCEEDED'
            ? '⚠️ Quota reached across candidate models. Click Retry or add a custom key in API Settings.'
            : data?.error === 'INVALID_KEY'
            ? '⚠️ Invalid Gemini API key. Open API Settings to update your key.'
            : data?.error || '⚠️ Model connection error. Click Retry to resend.');
        setApiErrorBanner(errMessage);
        return;
      }
    } catch {
      setIsTyping(false);
      setLastFailedMessageText(text.trim());
      setApiErrorBanner('⚠️ Network / model connection error. Click Retry to resend.');
      return;
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
      const facts = extractFactsFromUserMessage(caption);
      facts.forEach(f => {
        const updated = addCharacterMemory(activeChar.id, f);
        setCharMemories(prev => ({ ...prev, [activeChar.id]: updated }));
      });
    }

    setIsTyping(true);
    const requestStart = Date.now();
    const historyContext = (burnerMode ? burnerChats[activeChar.id] : chats[activeChar.id]) || [];
    let replyText = '';

    try {
      const memories = getMergedCharacterMemories(activeChar.id, charMemories[activeChar.id]);
      const promptPayload = `[USER SENT YOU A PICTURE]: "${caption.trim() || 'Look at this photo I took!'}"`;
      const customStoredKey = getExplicitCustomApiKey();

      const userName = currentUser?.codename || currentUser?.username || 'You';
      const defFields = getCharacterDefinitionFields(activeChar, userName);

      const { ok, data } = await postChatWithBackoff(
        {
          prompt: promptPayload,
          image: imageUrl,
          systemInstruction: buildFullCharacterSystemPrompt(activeChar, memories),
          charName: activeChar.name,
          userName,
          scenario: defFields.resolvedScenario,
          mesExamples: defFields.resolvedMesExamples,
          memories: memories.slice(0, 75),
          history: historyContext.slice(-15).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        },
        customStoredKey
      );

      if (ok && data.text && String(data.text).trim()) {
        replyText = String(data.text).trim();
        setApiErrorBanner(null);
        if (!hasServerAi) setHasServerAi(true);
      } else {
        setIsTyping(false);
        setApiErrorBanner(data?.message || data?.error || '⚠️ Groq API quota / connection error');
        return;
      }
    } catch {
      setIsTyping(false);
      setApiErrorBanner('⚠️ Groq API quota / connection error');
      return;
    }

    const elapsedMs = Date.now() - requestStart;
    deliverCharacterBubblesSequentially(activeChar, replyText, {
      alreadyWaitedMs: elapsedMs,
    });
  };

  // Call Simulation
  const handleStartCall = (type: 'audio' | 'video') => {
    if (!activeChar) return;
    clearCallTimers();

    setCallState({
      isOpen: true,
      type,
      charId: activeChar.id,
      phase: 'calling',
      statusText: `Calling via EchoVault ${type.toUpperCase()}...`,
      subtitle: 'Attempting encrypted audio link...',
    });

    const t1 = setTimeout(() => {
      setCallState(prev => ({
        ...prev,
        phase: 'declined',
        statusText: 'Call Declined',
        subtitle: `"${activeChar.name} is currently in a restricted environment."`,
      }));

      const t2 = setTimeout(() => {
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
      callTimersRef.current.push(t2);
    }, 3200);
    callTimersRef.current.push(t1);
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

    // Also compute affinity delta from imported user messages
    const userMsgs = importedMessages.filter(m => m.sender === 'user').map(m => m.text);
    if (userMsgs.length > 0) {
      const analysis = computeAffinityDeltaFromTranscript(userMsgs, targetCharId);
      applyCharacterAffinityUpdate(targetCharId, analysis.delta, {
        importedSummary: `${analysis.delta >= 0 ? '+' : ''}${analysis.delta} Affinity (${analysis.importedMessageCount} msgs): ${analysis.reason}`,
      });
    }

    setActiveGroupRoomId('');
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
    clearAllChatsInIndexedDB();
    setChats({});
    setBurnerChats({});
    setUnreadCounts({});
    setActiveCharId('');
    setActiveGroupRoomId('');
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

  // Rewind conversation to a selected message pivot point
  const handleRewindToMessage = async (
    charId: string,
    msgId: string,
    mode: 'regenerate' | 'edit' = 'regenerate'
  ) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    // 1. Immediately cancel any pending sequential typing bubbles or active indicators
    typingSequenceCancelRef.current += 1;
    setIsTyping(false);
    setRegeneratingMsgId(null);
    setApiErrorBanner(null);

    const currentList = (burnerMode ? burnerChats[charId] : chats[charId]) || [];
    const targetIdx = currentList.findIndex(
      m => m.id === msgId || msgId.startsWith(`${m.id}-part-`)
    );
    if (targetIdx === -1) return;

    const targetMsg = currentList[targetIdx];

    // Option A ('edit'): Slice right before the selected user message and restore its text to the input box
    if (mode === 'edit' && targetMsg.sender === 'user') {
      const truncatedBefore = currentList.slice(0, targetIdx);
      setInputText(targetMsg.text || '');
      setReplyingTo(targetMsg.replyTo || null);

      if (burnerMode) {
        setBurnerChats(prev => ({
          ...prev,
          [charId]: truncatedBefore,
        }));
      } else {
        setChats(prev => {
          const next = {
            ...prev,
            [charId]: truncatedBefore,
          };
          saveChatsToIndexedDB(next);
          return next;
        });
      }
      return;
    }

    // Option B ('regenerate' - default): Slice up to and including the selected message
    const truncatedInclusive = currentList.slice(0, targetIdx + 1);
    setReplyingTo(null);

    if (burnerMode) {
      setBurnerChats(prev => ({
        ...prev,
        [charId]: truncatedInclusive,
      }));
    } else {
      setChats(prev => {
        const next = {
          ...prev,
          [charId]: truncatedInclusive,
        };
        saveChatsToIndexedDB(next);
        return next;
      });
    }

    // If the rewind target is a user message, automatically trigger a clean re-generation of the AI character's response from that exact pivot point
    if (targetMsg.sender === 'user') {
      if (char.id === 'architect') {
        const cmdResult = processArchitectCommand(targetMsg.text, characters);
        deliverCharacterBubblesSequentially(char, cmdResult.reply);
        return;
      }

      setIsTyping(true);
      const requestStart = Date.now();
      const historyBeforePivot = truncatedInclusive.slice(0, -1);

      try {
        let promptPayload = (targetMsg.text || '').trim();
        if (targetMsg.image) {
          promptPayload = `[USER SENT YOU A PICTURE]: "${promptPayload || 'Look at this photo I took!'}"`;
        } else if (targetMsg.replyTo) {
          promptPayload = `[Replying directly to "${targetMsg.replyTo.text}" from ${targetMsg.replyTo.senderName}]: ${promptPayload}`;
        }

        const customStoredKey = getExplicitCustomApiKey();
        const activeMemories = getMergedCharacterMemories(char.id, charMemories[char.id]);
        const systemInstructionWithMemories = buildFullCharacterSystemPrompt(char, activeMemories);
        const userName = currentUser?.codename || currentUser?.username || 'You';
        const defFields = getCharacterDefinitionFields(char, userName);

        const { ok, data } = await postChatWithBackoff(
          {
            prompt: promptPayload,
            image: targetMsg.image,
            systemInstruction: systemInstructionWithMemories,
            charName: char.name,
            userName,
            scenario: defFields.resolvedScenario,
            mesExamples: defFields.resolvedMesExamples,
            memories: activeMemories.slice(0, 75),
            history: historyBeforePivot.slice(-15).map(m => ({
              role: m.sender === 'user' ? 'user' : 'model',
              text: m.text,
            })),
          },
          customStoredKey
        );

        if (ok && data.text && String(data.text).trim()) {
          let replyText = String(data.text).trim();
          setApiErrorBanner(null);
          setLastFailedMessageText(null);
          if (!hasServerAi) setHasServerAi(true);

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
          deliverCharacterBubblesSequentially(char, replyText, {
            photoUrl,
            alreadyWaitedMs: elapsedMs,
          });
        } else {
          setIsTyping(false);
          setLastFailedMessageText((targetMsg.text || '').trim());
          setApiErrorBanner(
            data?.message ||
              data?.error ||
              '⚠️ Model connection error while regenerating after rewind. Click Retry to resend.'
          );
        }
      } catch {
        setIsTyping(false);
        setLastFailedMessageText((targetMsg.text || '').trim());
        setApiErrorBanner('⚠️ Network / model connection error while regenerating after rewind.');
      }
    }
  };

  // Swipe between existing character message variations (< 1/2 > or < 2/3 >)
  const handleSwipeMessageVariant = (
    charId: string,
    msgId: string,
    direction: 'prev' | 'next'
  ) => {
    const updateList = (list: Message[]) =>
      list.map(m => {
        if (m.id !== msgId) return m;
        const variations =
          m.variations && m.variations.length > 0
            ? m.variations
            : m.variants && m.variants.length > 0
            ? m.variants
            : [m.text];
        const rawIdx =
          typeof m.activeVariationIndex === 'number'
            ? m.activeVariationIndex
            : typeof m.activeVariantIndex === 'number'
            ? m.activeVariantIndex
            : 0;
        const currentIdx = Math.min(Math.max(0, rawIdx), variations.length - 1);
        const nextIdx =
          direction === 'prev'
            ? Math.max(0, currentIdx - 1)
            : Math.min(variations.length - 1, currentIdx + 1);
        return {
          ...m,
          variants: variations,
          activeVariantIndex: nextIdx,
          variations,
          activeVariationIndex: nextIdx,
          text: variations[nextIdx] ?? m.text,
        };
      });

    if (burnerMode) {
      setBurnerChats(prev => ({
        ...prev,
        [charId]: updateList(prev[charId] || []),
      }));
    } else {
      setChats(prev => ({
        ...prev,
        [charId]: updateList(prev[charId] || []),
      }));
    }
  };

  // Generate a new alternate reply variation branch for a character message and swipe to it (< 2/2 > or < 2/3 >)
  const handleRegenerateMessageVariant = async (charId: string, msgId: string) => {
    if (regeneratingMsgId) return;
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const currentList = (burnerMode ? burnerChats[charId] : chats[charId]) || [];
    const targetIdx = currentList.findIndex(m => m.id === msgId);
    if (targetIdx === -1) return;

    const targetMsg = currentList[targetIdx];
    const existingVariants =
      targetMsg.variations && targetMsg.variations.length > 0
        ? targetMsg.variations
        : targetMsg.variants && targetMsg.variants.length > 0
        ? targetMsg.variants
        : [targetMsg.text];

    // Find the preceding user message to use as the prompt, and slice history before it
    let promptText = 'Continue your reply in character with a fresh angle.';
    let promptImage: string | undefined;
    let historyBeforePrompt = currentList.slice(0, targetIdx);

    for (let i = targetIdx - 1; i >= 0; i--) {
      if (currentList[i].sender === 'user') {
        promptText = currentList[i].text;
        promptImage = currentList[i].image;
        if (promptImage) {
          promptText = `[USER SENT YOU A PICTURE]: "${promptText || 'Look at this photo I took!'}"`;
        } else if (currentList[i].replyTo) {
          promptText = `[Replying directly to "${currentList[i].replyTo?.text}" from ${currentList[i].replyTo?.senderName}]: ${promptText}`;
        }
        historyBeforePrompt = currentList.slice(0, i);
        break;
      }
    }

    setRegeneratingMsgId(msgId);
    setApiErrorBanner(null);

    try {
      const customStoredKey = getExplicitCustomApiKey();
      const memories = getMergedCharacterMemories(char.id, charMemories[char.id]);
      const userName = currentUser?.codename || currentUser?.username || 'You';
      const defFields = getCharacterDefinitionFields(char, userName);
      const systemInstructionWithMemories = buildFullCharacterSystemPrompt(char, memories);

      const { ok, data } = await postChatWithBackoff(
        {
          prompt: promptText,
          image: promptImage,
          systemInstruction: systemInstructionWithMemories,
          charName: char.name,
          userName,
          scenario: defFields.resolvedScenario,
          mesExamples: defFields.resolvedMesExamples,
          isRegenerate: true,
          previousVariants: existingVariants,
          memories: memories.slice(0, 75),
          history: historyBeforePrompt.slice(-15).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        },
        customStoredKey
      );

      if (ok && data.text && String(data.text).trim()) {
        let newVariantText = String(data.text).trim();
        // Clean any photo drop tag if present
        newVariantText = newVariantText.replace(/\[PHOTO_DROP:[^\]]+\]/g, '').trim();
        const nextVariants = [...existingVariants, newVariantText];
        const nextIdx = nextVariants.length - 1;

        playMessageReceivedSound();

        const applyVariant = (list: Message[]) =>
          list.map(m =>
            m.id === msgId
              ? {
                  ...m,
                  variants: nextVariants,
                  activeVariantIndex: nextIdx,
                  variations: nextVariants,
                  activeVariationIndex: nextIdx,
                  text: newVariantText,
                  timestamp: Date.now(),
                }
              : m
          );

        if (burnerMode) {
          setBurnerChats(prev => ({
            ...prev,
            [charId]: applyVariant(prev[charId] || []),
          }));
        } else {
          setChats(prev => ({
            ...prev,
            [charId]: applyVariant(prev[charId] || []),
          }));
        }
      } else {
        setApiErrorBanner(
          data?.message || data?.error || '⚠️ Failed to generate new reply variation. Please retry.'
        );
      }
    } catch {
      setApiErrorBanner('⚠️ Network error while generating reply variation.');
    } finally {
      setRegeneratingMsgId(null);
    }
  };

  // Update character card definition fields (system, scenario, mesExamples) in state
  const handleUpdateCharacterDefinitions = (
    charId: string,
    updates: { system?: string; scenario?: string; mesExamples?: string }
  ) => {
    setCharacters(prev =>
      prev.map(c => (c.id === charId ? { ...c, ...updates } : c))
    );
  };

  const activeTheme = THEME_DEFINITIONS[themeConfig.themeId] || THEME_DEFINITIONS.cyberpunk;

  // Lookup group room info for activeChar if they belong to a preset group room
  const activeCharGroupRoom = activeChar
    ? groupRooms.find(room => Boolean(room.memberConfigs[activeChar.id]))
    : undefined;
  const activeCharGroupThreshold = activeChar && activeCharGroupRoom
    ? activeCharGroupRoom.memberConfigs[activeChar.id].requiredAffinity
    : 30;

  const activeCharScoreData: RelationshipScoreBreakdown = activeChar
    ? scoreBreakdowns[activeChar.id] || {
        affinity: relationshipLevels[activeChar.id] ?? 0,
        tier: getRelationshipTierFromAffinity(relationshipLevels[activeChar.id] ?? 0),
        positiveTriggersCount: 0,
        negativeTriggersCount: 0,
      }
    : {
        affinity: 0,
        tier: 'Stranger',
        positiveTriggersCount: 0,
        negativeTriggersCount: 0,
      };

  // If no user is logged in, show Welcome / Login / Register Screen
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`h-[100dvh] w-screen flex overflow-hidden ${activeTheme.palette.bgApp} text-slate-100 font-sans select-none relative`}>
      {/* PWA Network Connectivity & Offline Mode Indicator */}
      <OfflineIndicator />

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
        onEndCall={() => {
          clearCallTimers();
          setCallState(prev => ({ ...prev, isOpen: false }));
        }}
      />

      {/* 4. Sinsta Story Viewer Modal (Unlocked 24h Stories) */}
      <StoryViewerModal
        isOpen={!!storyCharId}
        character={characters.find(c => c.id === storyCharId) || null}
        storyItem={storyCharId ? activeStoriesMap[storyCharId] || null : null}
        onClose={() => setStoryCharId(null)}
        onMarkViewed={handleMarkStoryViewed}
        onRotateStory={handleRotateCharacterStory}
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
        userCodename={currentUser.codename || currentUser.username || 'You'}
        onUpdateCharacterDefinitions={handleUpdateCharacterDefinitions}
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
        onClearApiError={() => setApiErrorBanner(null)}
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
          memories={getMergedCharacterMemories(activeChar.id, charMemories[activeChar.id])}
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

      {/* 12. Relationship Score Breakdown & Transcript Analyzer Modal */}
      {activeChar && (
        <ScoreBreakdownModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          characterName={activeChar.name}
          characterId={activeChar.id}
          scoreData={activeCharScoreData}
          requiredGroupAffinity={activeCharGroupThreshold}
          groupRoomName={activeCharGroupRoom?.name}
          isGroupRoomUnlocked={activeCharGroupRoom?.isUnlocked}
          onImportTranscript={handleImportTranscriptForActiveChar}
          onResetAffinity={() => handleResetCharacterAffinity(activeChar.id)}
        />
      )}

      {/* Main Sidebar */}
      <Sidebar
        characters={characters}
        activeCharId={activeCharId}
        activeGroupRoomId={activeGroupRoomId}
        groupRooms={groupRooms}
        userAffinityMap={relationshipLevels}
        activeConversationIds={activeConversationIds}
        chats={burnerMode ? burnerChats : chats}
        unreadCounts={unreadCounts}
        userProfile={currentUser}
        followedCharIds={followedCharIds}
        viewedStoryIds={viewedStoryIds}
        activeStoriesMap={activeStoriesMap}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCharacter={handleSelectCharacter}
        onSelectGroupRoom={handleSelectGroupRoom}
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
        activeGroupRoom={activeGroupRoom}
        groupMessages={activeGroupRoom ? groupRoomMessages[activeGroupRoom.id] || activeGroupRoom.baseBacklog : []}
        groupTypingSenderName={groupTypingSenderName}
        onSendGroupMessage={handleSendGroupMessage}
        scoreBreakdown={activeCharScoreData}
        onOpenScoreModal={() => setIsScoreModalOpen(true)}
        allCharacters={characters}
        messages={currentMessages}
        isTyping={isTyping}
        inputText={inputText}
        burnerMode={burnerMode}
        hasServerAi={hasServerAi}
        apiErrorBanner={apiErrorBanner}
        onDismissApiError={() => setApiErrorBanner(null)}
        onOpenApiSettings={() => {
          setSettingsInitialTab('intelligence');
          setIsSettingsModalOpen(true);
        }}
        onRetryLastMessage={
          lastFailedMessageText
            ? () => handleSendMessage(lastFailedMessageText, true)
            : undefined
        }
        isAway={isAway}
        autoAwayEnabled={autoAwayEnabled}
        replyingTo={replyingTo}
        userCodename={currentUser.codename || currentUser.username || 'Operative'}
        themeConfig={themeConfig}
        onOpenCaiImportModal={() => setIsCaiImportModalOpen(true)}
        onClearChat={() => activeChar && handleClearActiveChatMessages(activeChar.id)}
        onDeleteChat={() => activeChar && handleDeleteChat(activeChar.id)}
        onDeleteMessage={(msgId) => activeChar && handleDeleteMessage(activeChar.id, msgId)}
        onRewindToMessage={(msgId, mode) =>
          activeChar && handleRewindToMessage(activeChar.id, msgId, mode)
        }
        regeneratingMsgId={regeneratingMsgId}
        onSwipeMessageVariant={(msgId, dir) =>
          activeChar && handleSwipeMessageVariant(activeChar.id, msgId, dir)
        }
        onRegenerateMessageVariant={(msgId) =>
          activeChar && handleRegenerateMessageVariant(activeChar.id, msgId)
        }
        isFollowed={activeChar ? followedCharIds.includes(activeChar.id) : true}
        isStoryViewed={activeChar ? viewedStoryIds.includes(activeChar.id) : false}
        memoriesCount={
          activeChar
            ? getMergedCharacterMemories(activeChar.id, charMemories[activeChar.id]).length
            : 0
        }
        activeMemories={
          activeChar
            ? getMergedCharacterMemories(activeChar.id, charMemories[activeChar.id])
            : []
        }
        onOpenMemoryVault={() => setMemoryVaultOpen(true)}
        onOpenSharePhoto={() => setSharePhotoModalOpen(true)}
        onImageClick={(url, caption, senderName) => setLightboxData({ url, caption, senderName })}
        onToggleFollow={() => activeChar && handleToggleFollow(activeChar.id)}
        onSetReplyingTo={setReplyingTo}
        onSelectCharacter={handleSelectCharacter}
        onToggleAutoAway={() => setAutoAwayEnabled(prev => !prev)}
        onTriggerAwayMessage={() => triggerInboundAwayMessage(undefined, true)}
        onInputChange={setInputText}
        onSubmit={(e, memoriesFromViewport) => {
          e.preventDefault();
          handleSendMessage(inputText, false, memoriesFromViewport);
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
