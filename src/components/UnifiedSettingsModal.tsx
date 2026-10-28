import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  User,
  Palette,
  Shield,
  Cpu,
  Database,
  X,
  Check,
  Sparkles,
  RotateCcw,
  Type,
  Layout,
  Eye,
  EyeOff,
  Sliders,
  Lock,
  Calculator,
  Flame,
  LogOut,
  Trash2,
  AlertTriangle,
  Download,
  Link2,
  RefreshCw,
  CheckCircle2,
  Brain,
  Users,
  Zap,
  ChevronRight,
  Key,
} from 'lucide-react';
import {
  AppThemeConfig,
  BubbleStyle,
  Character,
  Message,
  ResponseMood,
  ResponsePacing,
  UserProfile,
} from '../types';
import { THEME_DEFINITIONS, DEFAULT_THEME_CONFIG } from '../data/themes';
import {
  MOOD_LABELS,
  PACING_LABELS,
  getCharacterDirective,
  setCharacterDirective,
  saveAllDirectives,
} from '../utils/responseDirector';
import {
  GlobalTypingSpeedPreset,
  getGlobalTypingSpeedPreset,
  setGlobalTypingSpeedPreset,
} from '../utils/semanticOrchestrator';
import {
  getCharacterMemories,
  removeCharacterMemory,
  clearCharacterMemories,
  clearAllCharactersMemories,
  MAX_ACTIVE_MEMORIES,
} from '../utils/memory';

export type SettingsTabId =
  | 'account'
  | 'appearance'
  | 'security'
  | 'intelligence'
  | 'storage';

interface UnifiedSettingsModalProps {
  isOpen: boolean;
  initialTab?: SettingsTabId;
  onClose: () => void;
  // Account & Profile
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onFactoryReset: () => void;
  // Theme & Appearance
  currentThemeConfig: AppThemeConfig;
  onSaveThemeConfig: (newConfig: AppThemeConfig) => void;
  characters: Character[];
  // Security & Privacy
  currentPin: string;
  tabBlurLock: boolean;
  doubleEscStealth: boolean;
  burnerMode: boolean;
  defaultBurnerOnStartup: boolean;
  onSaveSecuritySettings: (settings: {
    pin: string;
    tabBlurLock: boolean;
    doubleEscStealth: boolean;
    defaultBurnerOnStartup: boolean;
  }) => void;
  onToggleBurnerMode: () => void;
  onTriggerStealth: () => void;
  onLockNow: () => void;
  // AI Engine & Intelligence
  hasServerAi: boolean;
  onRefreshServerStatus: () => Promise<boolean>;
  onOpenCaiImportModal: () => void;
  onClearApiError?: () => void;
  // Storage & Memory Vault
  chats: Record<string, Message[]>;
  charMemories: Record<string, string[]>;
  onRefreshMemories: () => void;
}

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
  isOpen,
  initialTab = 'account',
  onClose,
  userProfile,
  onUpdateProfile,
  onLogout,
  onFactoryReset,
  currentThemeConfig,
  onSaveThemeConfig,
  characters,
  currentPin,
  tabBlurLock,
  doubleEscStealth,
  burnerMode,
  defaultBurnerOnStartup,
  onSaveSecuritySettings,
  onToggleBurnerMode,
  onTriggerStealth,
  onLockNow,
  hasServerAi,
  onRefreshServerStatus,
  onOpenCaiImportModal,
  onClearApiError,
  chats,
  onRefreshMemories,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // --- Tab 1: Account & Profile State ---
  const [editUsername, setEditUsername] = useState(userProfile.username || 'Operative_07');
  const [editCodename, setEditCodename] = useState(userProfile.codename || 'Operative_07');
  const [accountPin, setAccountPin] = useState(currentPin);
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);

  useEffect(() => {
    setEditUsername(userProfile.username || 'Operative_07');
    setEditCodename(userProfile.codename || 'Operative_07');
    setAccountPin(currentPin);
  }, [userProfile, currentPin, isOpen]);

  // --- Tab 2: Appearance & Theme Studio State ---
  const [themeDraft, setThemeDraft] = useState<AppThemeConfig>(currentThemeConfig);
  const [themeSavedToast, setThemeSavedToast] = useState(false);

  useEffect(() => {
    setThemeDraft(currentThemeConfig);
  }, [currentThemeConfig, isOpen]);

  // --- Tab 3: Privacy, Security & Disguise State ---
  const [secPin, setSecPin] = useState(currentPin);
  const [showSecPin, setShowSecPin] = useState(false);
  const [secBlurLock, setSecBlurLock] = useState(tabBlurLock);
  const [secDoubleEsc, setSecDoubleEsc] = useState(doubleEscStealth);
  const [secDefaultBurner, setSecDefaultBurner] = useState(defaultBurnerOnStartup);
  const [secSavedToast, setSecSavedToast] = useState(false);

  useEffect(() => {
    setSecPin(currentPin);
    setSecBlurLock(tabBlurLock);
    setSecDoubleEsc(doubleEscStealth);
    setSecDefaultBurner(defaultBurnerOnStartup);
  }, [currentPin, tabBlurLock, doubleEscStealth, defaultBurnerOnStartup, isOpen]);

  // --- Tab 4: AI Engine & Intelligence State ---
  const DEFAULT_USER_GEMINI_KEY =
    'AQ.Ab8RN6KeetZWTWlQXdP_5ZwaCZsFG0P5lVOKVbsOcg20CExwBA';
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      const saved =
        localStorage.getItem('custom_gemini_api_key') ??
        localStorage.getItem('pulsedirect_custom_gemini_key');
      if (saved !== null) return saved;
      localStorage.setItem('custom_gemini_api_key', DEFAULT_USER_GEMINI_KEY);
      localStorage.setItem('pulsedirect_custom_gemini_key', DEFAULT_USER_GEMINI_KEY);
      return DEFAULT_USER_GEMINI_KEY;
    } catch {
      return DEFAULT_USER_GEMINI_KEY;
    }
  });
  const [showCustomApiKey, setShowCustomApiKey] = useState<boolean>(false);
  const [apiKeySavedStatus, setApiKeySavedStatus] = useState<'saved' | 'reset' | null>(null);
  const [typingPreset, setTypingPreset] = useState<GlobalTypingSpeedPreset>(() =>
    getGlobalTypingSpeedPreset()
  );
  const [selectedTargetChar, setSelectedTargetChar] = useState<string>('__global__');
  const [dirMood, setDirMood] = useState<ResponseMood>('canon');
  const [dirPacing, setDirPacing] = useState<ResponsePacing>('natural');
  const [dirCustomRule, setDirCustomRule] = useState<string>('');
  const [aiSavedToast, setAiSavedToast] = useState(false);
  const [checkingEngine, setCheckingEngine] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const storedKey =
        localStorage.getItem('custom_gemini_api_key') ??
        localStorage.getItem('pulsedirect_custom_gemini_key') ??
        DEFAULT_USER_GEMINI_KEY;
      setCustomApiKey(storedKey);
    } catch {
      // ignore
    }
    setTypingPreset(getGlobalTypingSpeedPreset());
    const currentDir = getCharacterDirective(selectedTargetChar);
    setDirMood(currentDir.mood);
    setDirPacing(currentDir.pacing);
    setDirCustomRule(currentDir.customInstruction || '');
  }, [isOpen, selectedTargetChar]);

  // --- Tab 5: Storage & Memory Vault State ---
  const [storageRefreshTick, setStorageRefreshTick] = useState(0);
  const [confirmClearAllMemories, setConfirmClearAllMemories] = useState(false);
  const [exportToast, setExportToast] = useState(false);

  // Compute localStorage breakdown
  const storageStats = useMemo(() => {
    let totalBytes = 0;
    let chatBytes = 0;
    let memoryBytes = 0;
    let customCharBytes = 0;
    let settingsBytes = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || '';
        const bytes = (key.length + val.length) * 2; // UTF-16 estimate
        totalBytes += bytes;

        if (key.includes('chats') || key.includes('convos')) {
          chatBytes += bytes;
        } else if (key.startsWith('pulsedirect_memory_')) {
          memoryBytes += bytes;
        } else if (key.includes('custom_characters')) {
          customCharBytes += bytes;
        } else {
          settingsBytes += bytes;
        }
      }
    } catch {
      // ignore
    }

    const maxBytes = 5 * 1024 * 1024; // 5 MB standard localStorage quota
    const percentUsed = Math.min(100, Math.max(0.5, (totalBytes / maxBytes) * 100));

    return {
      totalKB: (totalBytes / 1024).toFixed(1),
      chatKB: (chatBytes / 1024).toFixed(1),
      memoryKB: (memoryBytes / 1024).toFixed(1),
      customCharKB: (customCharBytes / 1024).toFixed(1),
      settingsKB: (settingsBytes / 1024).toFixed(1),
      percentUsed,
    };
  }, [isOpen, chats, storageRefreshTick]);

  // Collect all character memories for inspection
  const allMemoriesList = useMemo(() => {
    const list: Array<{ char: Character; facts: string[] }> = [];
    for (const c of characters) {
      const facts = getCharacterMemories(c.id);
      if (facts.length > 0) {
        list.push({ char: c, facts });
      }
    }
    return list;
  }, [characters, isOpen, storageRefreshTick]);

  const totalFactsCount = useMemo(
    () => allMemoriesList.reduce((acc, item) => acc + item.facts.length, 0),
    [allMemoriesList]
  );

  if (!isOpen) return null;

  // Handlers for Tab 1: Account
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = editUsername.trim() || 'Operative_07';
    const cleanCode = editCodename.trim() || cleanUser;
    onUpdateProfile({
      ...userProfile,
      username: cleanUser,
      codename: cleanCode,
    });
    onSaveSecuritySettings({
      pin: accountPin.trim(),
      tabBlurLock: secBlurLock,
      doubleEscStealth: secDoubleEsc,
      defaultBurnerOnStartup: secDefaultBurner,
    });
    setSecPin(accountPin.trim());
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 1800);
  };

  const handleQuickSwitchSession = (presetName: string, color: string) => {
    onUpdateProfile({
      id: `session-${Date.now()}`,
      username: presetName,
      codename: presetName,
      avatarColor: color,
      createdAt: Date.now(),
    });
    setEditUsername(presetName);
    setEditCodename(presetName);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 1500);
  };

  // Handlers for Tab 2: Appearance
  const activeThemeDef = THEME_DEFINITIONS[themeDraft.themeId] || THEME_DEFINITIONS.cyberpunk;
  const previewChar = characters.find(c => c.id === 'gojo') || characters[0];

  const handleApplyTheme = () => {
    onSaveThemeConfig(themeDraft);
    setThemeSavedToast(true);
    setTimeout(() => setThemeSavedToast(false), 1800);
  };

  const handleResetTheme = () => {
    setThemeDraft(DEFAULT_THEME_CONFIG);
    onSaveThemeConfig(DEFAULT_THEME_CONFIG);
  };

  // Handlers for Tab 3: Security
  const handleSaveSecurity = () => {
    onSaveSecuritySettings({
      pin: secPin.trim(),
      tabBlurLock: secBlurLock,
      doubleEscStealth: secDoubleEsc,
      defaultBurnerOnStartup: secDefaultBurner,
    });
    setAccountPin(secPin.trim());
    setSecSavedToast(true);
    setTimeout(() => setSecSavedToast(false), 1800);
  };

  // Handlers for Tab 4: AI Engine & Intelligence
  const handleSaveIntelligence = () => {
    setGlobalTypingSpeedPreset(typingPreset);
    setCharacterDirective(selectedTargetChar, {
      mood: dirMood,
      pacing: dirPacing,
      customInstruction: dirCustomRule.trim(),
    });
    setAiSavedToast(true);
    setTimeout(() => setAiSavedToast(false), 1800);
  };

  const handleResetAllDirectives = () => {
    saveAllDirectives({});
    setGlobalTypingSpeedPreset('auto');
    setTypingPreset('auto');
    setDirMood('canon');
    setDirPacing('natural');
    setDirCustomRule('');
    setAiSavedToast(true);
    setTimeout(() => setAiSavedToast(false), 1800);
  };

  const handleTestEngineStatus = async () => {
    setCheckingEngine(true);
    await onRefreshServerStatus();
    setTimeout(() => setCheckingEngine(false), 400);
  };

  const handleSaveCustomApiKey = () => {
    const trimmed = customApiKey.trim();
    try {
      if (trimmed) {
        localStorage.setItem('custom_gemini_api_key', trimmed);
        localStorage.setItem('pulsedirect_custom_gemini_key', trimmed);
      } else {
        localStorage.removeItem('custom_gemini_api_key');
        localStorage.removeItem('pulsedirect_custom_gemini_key');
      }
    } catch {
      // ignore storage errors
    }
    onClearApiError?.();
    setApiKeySavedStatus(trimmed ? 'saved' : 'reset');
    setTimeout(() => setApiKeySavedStatus(null), 2200);
  };

  const handleResetCustomApiKey = () => {
    setCustomApiKey('');
    try {
      localStorage.removeItem('custom_gemini_api_key');
      localStorage.removeItem('pulsedirect_custom_gemini_key');
    } catch {
      // ignore storage errors
    }
    onClearApiError?.();
    setApiKeySavedStatus('reset');
    setTimeout(() => setApiKeySavedStatus(null), 2200);
  };

  // Handlers for Tab 5: Storage & Memory Vault
  const handleExportBackupJson = () => {
    const memoriesDump: Record<string, string[]> = {};
    characters.forEach(c => {
      const m = getCharacterMemories(c.id);
      if (m.length > 0) memoriesDump[c.id] = m;
    });

    const payload = {
      app: themeDraft.appName || 'EchoVault',
      exportedAt: new Date().toISOString(),
      userProfile,
      themeConfig: currentThemeConfig,
      conversations: chats,
      episodicMemories: memoriesDump,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `echovault-backup-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportToast(true);
    setTimeout(() => setExportToast(false), 2000);
  };

  const tabs: Array<{
    id: SettingsTabId;
    label: string;
    shortLabel: string;
    sub: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'account',
      label: 'Account & Profile',
      shortLabel: 'Account',
      sub: 'Identity, session & reset',
      icon: User,
    },
    {
      id: 'appearance',
      label: 'Appearance & Theme',
      shortLabel: 'Themes',
      sub: 'Colors, bubbles & live view',
      icon: Palette,
    },
    {
      id: 'security',
      label: 'Privacy & Disguise',
      shortLabel: 'Privacy',
      sub: 'PIN lock, stealth & burner',
      icon: Shield,
    },
    {
      id: 'intelligence',
      label: 'AI & Intelligence',
      shortLabel: 'AI Engine',
      sub: 'Pacing, directives & C.AI',
      icon: Cpu,
    },
    {
      id: 'storage',
      label: 'Storage & Vault',
      shortLabel: 'Storage',
      sub: 'Memories & JSON backup',
      icon: Database,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 md:p-6 select-none">
      {/* Main Glassmorphism Hub Container */}
      <div className="w-full max-w-5xl bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/40 flex flex-col max-h-[90dvh] relative">
        {/* Top Ambient Glow */}
        <div className="absolute -top-24 left-1/3 w-96 h-36 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-600/25 flex-shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>Settings Hub</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono hidden sm:inline-block">
                  {themeDraft.appName || 'EchoVault'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Manage your profile, visual studio, privacy shields, response orchestration, and memory vaults
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex-shrink-0"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Horizontal Scrollable Tab Bar (Visible < md) */}
        <div className="md:hidden flex items-center gap-1.5 px-3 py-2.5 border-b border-white/10 bg-zinc-900/50 overflow-x-auto scrollbar-none flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Body Layout: Left Sidebar (Desktop) + Right Content Pane */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Desktop Vertical Navigation Sidebar */}
          <nav className="hidden md:flex md:w-60 lg:w-64 border-r border-white/10 bg-zinc-950/60 p-3 flex-col justify-between flex-shrink-0 overflow-y-auto">
            <div className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full p-2.5 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-transparent border border-purple-500/40 text-white shadow-sm'
                        : 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                          isSelected
                            ? 'bg-purple-500/25 text-purple-300'
                            : 'bg-white/[0.04] text-slate-400 group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{tab.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{tab.sub}</div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 flex-shrink-0 transition ${
                        isSelected ? 'text-purple-400 translate-x-0.5' : ' opacity-0 group-hover:opacity-60'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Active Session Mini Card in Left Nav Footer */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 mt-4">
              <div className="flex items-center gap-2.5">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.codename}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-purple-500/40 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                    {(userProfile.codename || 'O')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {userProfile.codename || 'Operative_07'}
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                    <span className="truncate">{userProfile.email || 'Session Active'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>

          {/* Right Tab Content Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* =========================================================
                TAB 1: ACCOUNT & PROFILE MANAGEMENT
            ========================================================= */}
            {activeTab === 'account' && (
              <div className="space-y-6 max-w-2xl">
                {/* Current Operative Identity Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-zinc-900/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.codename}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover border border-purple-500/40 shadow-lg shadow-purple-600/25 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-xl font-extrabold text-white shadow-lg shadow-purple-600/25 flex-shrink-0">
                        {(userProfile.codename || userProfile.username || 'O')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          {userProfile.codename || 'Operative_07'}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                          {userProfile.provider === 'google' ? 'Google Verified' : 'Verified Profile'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {userProfile.email ? (
                          <>
                            {userProfile.provider === 'google' ? 'Google Account:' : 'Email:'}{' '}
                            <span className="text-slate-200 font-mono">{userProfile.email}</span>
                          </>
                        ) : (
                          <>Account Handle: <span className="text-slate-200 font-mono">@{userProfile.username || 'Operative_07'}</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs font-semibold text-slate-200 hover:text-rose-300 flex items-center justify-center gap-1.5 transition cursor-pointer self-start sm:self-center"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>

                {/* Edit Profile & Quick PIN Form */}
                <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Update Profile & Credentials</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1.5">
                        Account Username
                      </label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={e => setEditUsername(e.target.value)}
                        placeholder="Operative_07"
                        className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1.5">
                        Display Alias / Call-Sign
                      </label>
                      <input
                        type="text"
                        value={editCodename}
                        onChange={e => setEditCodename(e.target.value)}
                        placeholder="Operative_07"
                        className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 flex items-center justify-between mb-1.5">
                      <span>Quick Master PIN (Optional)</span>
                      <span className="text-[10px] text-slate-500 font-mono">4–8 digits for screen lock</span>
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={accountPin}
                      onChange={e => setAccountPin(e.target.value)}
                      placeholder="Leave blank for no PIN lock"
                      className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-semibold text-white shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {profileSavedToast ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Profile Saved!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Profile Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Session Switcher */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Quick Session Switcher</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">Instant profile hot-swap</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { name: 'Operative_07', desc: 'Standard Operative', color: 'purple' },
                      { name: 'user_google', desc: 'Google Linked Profile', color: 'cyan' },
                      { name: 'Night_Caller', desc: 'Secondary Alias', color: 'pink' },
                    ].map(preset => {
                      const isCurrent = userProfile.username === preset.name;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleQuickSwitchSession(preset.name, preset.color)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                            isCurrent
                              ? 'bg-purple-500/15 border-purple-500/50 text-white'
                              : 'bg-zinc-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{preset.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{preset.desc}</div>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Danger Zone: Delete Account & Factory Reset */}
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Danger Zone — Delete Account & Factory Reset</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Permanently purges all user credentials, active chat threads, custom characters, and character memory vaults from localStorage and returns to the welcome screen.
                      </p>
                    </div>
                  </div>

                  {!showDeletePrompt ? (
                    <button
                      type="button"
                      onClick={() => setShowDeletePrompt(true)}
                      className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-xs font-bold text-rose-300 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account & Factory Reset...</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-black/50 border border-rose-500/40 space-y-3">
                      <label className="text-xs text-rose-200 block font-medium">
                        Type <span className="font-mono font-bold text-rose-400">DELETE</span> below to confirm permanent data wipe:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={e => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="flex-1 bg-zinc-950 border border-rose-500/40 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-400"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={deleteConfirmText.trim() !== 'DELETE'}
                            onClick={() => {
                              if (deleteConfirmText.trim() === 'DELETE') {
                                onFactoryReset();
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              deleteConfirmText.trim() === 'DELETE'
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer'
                                : 'bg-rose-950/40 text-rose-400/40 border border-rose-500/20 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Confirm Factory Reset</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeletePrompt(false);
                              setDeleteConfirmText('');
                            }}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 2: APPEARANCE & THEME STUDIO
            ========================================================= */}
            {activeTab === 'appearance' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Controls (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* App Title Branding */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Application Title / Alias</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Sidebar & Header</span>
                    </div>
                    <input
                      type="text"
                      value={themeDraft.appName}
                      onChange={e => setThemeDraft(prev => ({ ...prev, appName: e.target.value }))}
                      placeholder="EchoVault"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  {/* Theme Presets */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>Color Theme Presets</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.values(THEME_DEFINITIONS).map(theme => {
                        const isSelected = themeDraft.themeId === theme.id;
                        return (
                          <div
                            key={theme.id}
                            onClick={() => setThemeDraft(prev => ({ ...prev, themeId: theme.id }))}
                            className={`p-3 rounded-2xl cursor-pointer border transition flex flex-col justify-between ${
                              isSelected
                                ? 'bg-purple-500/15 border-purple-500 shadow-md shadow-purple-950/30'
                                : 'bg-zinc-900/70 border-white/10 hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full ${theme.palette.storyRing}`} />
                                <h4 className="text-xs font-bold text-white">{theme.name}</h4>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                              {theme.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bubble Style & Font Scaling */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Layout className="w-3.5 h-3.5 text-pink-400" />
                        <span>Bubble Shape</span>
                      </label>
                      <div className="space-y-1.5">
                        {[
                          { id: 'modern_gradient' as BubbleStyle, label: 'Modern Gradient', sub: 'Rounded glass glow' },
                          { id: 'cai_clean' as BubbleStyle, label: 'C.AI Clean Card', sub: 'Minimalist slate cards' },
                          { id: 'terminal_monospace' as BubbleStyle, label: 'Matrix Terminal', sub: 'Monospace cyber frame' },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setThemeDraft(prev => ({ ...prev, bubbleStyle: opt.id }))}
                            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                              themeDraft.bubbleStyle === opt.id
                                ? 'bg-purple-600/20 border-purple-500 text-white'
                                : 'bg-zinc-900/70 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-semibold">{opt.label}</div>
                              <div className="text-[10px] opacity-75">{opt.sub}</div>
                            </div>
                            {themeDraft.bubbleStyle === opt.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Message Font Scale</span>
                      </label>
                      <div className="space-y-1.5">
                        {[
                          { id: 'sm' as const, label: 'Compact (13px)', sub: 'High-density view' },
                          { id: 'base' as const, label: 'Standard (14px)', sub: 'Balanced readability' },
                          { id: 'lg' as const, label: 'Comfortable (16px)', sub: 'Larger relaxed text' },
                        ].map(sz => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => setThemeDraft(prev => ({ ...prev, chatFontSize: sz.id }))}
                            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                              themeDraft.chatFontSize === sz.id
                                ? 'bg-indigo-600/20 border-indigo-400 text-white'
                                : 'bg-zinc-900/70 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-semibold">{sz.label}</div>
                              <div className="text-[10px] opacity-75">{sz.sub}</div>
                            </div>
                            {themeDraft.chatFontSize === sz.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Save / Reset Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleResetTheme}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Defaults</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyTheme}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {themeSavedToast ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Theme Applied!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply Appearance</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Live Interactive Preview (5 cols) */}
                <div className="lg:col-span-5 flex flex-col">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Interactive Live Preview</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono">
                      Real-Time
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/15 overflow-hidden shadow-xl bg-[#090b12] flex flex-col flex-1">
                    {/* Preview Header */}
                    <div
                      className={`p-3 border-b ${activeThemeDef.palette.border} ${activeThemeDef.palette.bgSidebar} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${activeThemeDef.palette.accent} flex items-center justify-center text-white`}
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                        </div>
                        <span className="text-xs font-extrabold text-white">
                          {themeDraft.appName || 'EchoVault'}
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>

                    {/* Preview Messages */}
                    <div
                      className={`p-3.5 space-y-3 flex-1 ${activeThemeDef.palette.bgChat} flex flex-col justify-end min-h-[210px]`}
                    >
                      <div className="flex items-start gap-2 max-w-[88%]">
                        <img
                          src={previewChar.avatar}
                          alt={previewChar.name}
                          className="w-6 h-6 rounded-full object-cover object-top border border-white/10 mt-1 flex-shrink-0"
                        />
                        <div
                          className={`p-2.5 ${
                            themeDraft.chatFontSize === 'sm'
                              ? 'text-[11px]'
                              : themeDraft.chatFontSize === 'lg'
                              ? 'text-sm'
                              : 'text-xs'
                          } leading-relaxed ${activeThemeDef.palette.bubbleChar} ${activeThemeDef.palette.textChar} ${
                            themeDraft.bubbleStyle === 'modern_gradient'
                              ? 'rounded-2xl rounded-tl-sm'
                              : themeDraft.bubbleStyle === 'cai_clean'
                              ? 'rounded-xl'
                              : 'rounded-md font-mono'
                          }`}
                        >
                          Hey {userProfile.codename || 'there'}! The {activeThemeDef.name} palette looks super clean in {themeDraft.appName || 'EchoVault'}. ✨
                        </div>
                      </div>

                      <div className="flex flex-col items-end self-end max-w-[85%]">
                        <div
                          className={`p-2.5 ${
                            themeDraft.chatFontSize === 'sm'
                              ? 'text-[11px]'
                              : themeDraft.chatFontSize === 'lg'
                              ? 'text-sm'
                              : 'text-xs'
                          } leading-relaxed ${activeThemeDef.palette.bubbleUser} ${activeThemeDef.palette.textUser} ${
                            themeDraft.bubbleStyle === 'modern_gradient'
                              ? 'rounded-2xl rounded-tr-sm'
                              : themeDraft.bubbleStyle === 'cai_clean'
                              ? 'rounded-xl'
                              : 'rounded-md font-mono'
                          }`}
                        >
                          Love how smooth the live preview updates! 🚀
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">
                          {new Date().toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 3: PRIVACY, SECURITY & DISGUISE
            ========================================================= */}
            {activeTab === 'security' && (
              <div className="space-y-5 max-w-2xl">
                {/* Master PIN Configuration */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Master Vault PIN Lock</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">Shortcut: Ctrl+L / Cmd+L</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Set a 4–8 digit PIN to lock your screen againstshoulder-surfing or shared device access.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <input
                        type={showSecPin ? 'text' : 'password'}
                        maxLength={8}
                        value={secPin}
                        onChange={e => setSecPin(e.target.value)}
                        placeholder="Enter 4–8 digit Master PIN (blank to disable)"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecPin(!showSecPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showSecPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLockNow();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Lock Screen Now</span>
                    </button>
                  </div>
                </div>

                {/* Privacy & Disguise Toggles */}
                <div className="space-y-3">
                  {/* Auto-Lock on Tab Blur */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span>Auto-Lock on Tab Blur</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Automatically engages the PIN lock screen when switching tabs or minimizing the browser (requires Master PIN).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={secBlurLock}
                      onChange={e => setSecBlurLock(e.target.checked)}
                      className="accent-purple-500 w-4 h-4 rounded cursor-pointer flex-shrink-0"
                    />
                  </div>

                  {/* Stealth Calculator Mode */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Double-ESC Stealth Scientific Calculator</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Pressing <span className="font-mono text-slate-300">Esc × 2</span> rapidly disguises EchoVault as a working scientific calculator.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={secDoubleEsc}
                        onChange={e => setSecDoubleEsc(e.target.checked)}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer flex-shrink-0"
                      />
                    </div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onTriggerStealth();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Launch Stealth Calculator Disguise Now</span>
                      </button>
                    </div>
                  </div>

                  {/* Burner / Ephemeral Chat Preferences */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>Ephemeral Burner Mode (Active Session)</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          When active, messages are held only in volatile RAM and never written to browser storage.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onToggleBurnerMode}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          burnerMode
                            ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {burnerMode ? 'Burner ON 🔥' : 'Standard Storage'}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-4">
                      <span className="text-[11px] text-slate-400">
                        Start every new session in Ephemeral Burner Mode by default
                      </span>
                      <input
                        type="checkbox"
                        checked={secDefaultBurner}
                        onChange={e => setSecDefaultBurner(e.target.checked)}
                        className="accent-orange-500 w-4 h-4 rounded cursor-pointer flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSecurity}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {secSavedToast ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Security Settings Saved!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Privacy & Security</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 4: AI ENGINE & INTELLIGENCE
            ========================================================= */}
            {activeTab === 'intelligence' && (
              <div className="space-y-5 max-w-3xl">
                {/* Gemini API Configuration Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-zinc-900/60 border border-purple-500/30 space-y-3.5 shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-purple-400" />
                        <span>Gemini API Configuration</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Enter your personal Gemini API key, or clear the field to revert to the server default.
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                        customApiKey.trim()
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {customApiKey.trim() ? 'Custom Key Active' : 'Server Default'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showCustomApiKey ? 'text' : 'password'}
                      value={customApiKey}
                      onChange={e => setCustomApiKey(e.target.value)}
                      placeholder="AIzaSy... (Leave empty to use server default)"
                      className="w-full bg-zinc-950/90 border border-white/15 rounded-xl pl-3.5 pr-10 py-2.5 text-base sm:text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomApiKey(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                      title={showCustomApiKey ? 'Hide API Key' : 'Show API Key'}
                    >
                      {showCustomApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSaveCustomApiKey}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Key</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetCustomApiKey}
                        className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset to Server Default</span>
                      </button>
                    </div>

                    {apiKeySavedStatus && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {apiKeySavedStatus === 'saved'
                            ? 'Personal Gemini API key saved!'
                            : 'Reverted to server default key!'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Connection & Orchestration Status */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          hasServerAi ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        {hasServerAi
                          ? 'Cloud Orchestration Active (Multi-Model Pool)'
                          : 'Smart Contextual Dynamic Engine Active'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      Zero Semantic Repetition Gate • 50-Turn Deep Context Window • 75-Fact Memory Injection
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestEngineStatus}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingEngine ? 'animate-spin text-purple-400' : ''}`} />
                    <span>Verify Connection</span>
                  </button>
                </div>

                {/* Typing Speed / Pacing Preset Selector */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Multi-Bubble Typing Speed Pacing</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">Sequential || bubbles</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: 'auto' as GlobalTypingSpeedPreset,
                        label: 'Character Default',
                        desc: 'Per-persona speed (1–7s)',
                      },
                      {
                        id: 'fast' as GlobalTypingSpeedPreset,
                        label: 'Fast / Impulsive',
                        desc: '1–2s rapid burst bubbles',
                      },
                      {
                        id: 'moderate' as GlobalTypingSpeedPreset,
                        label: 'Casual / Moderate',
                        desc: '3–4s natural cadence',
                      },
                      {
                        id: 'slow' as GlobalTypingSpeedPreset,
                        label: 'Thoughtful / Slow',
                        desc: '5–7s deliberate pauses',
                      },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTypingPreset(opt.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          typingPreset === opt.id
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-zinc-900/70 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{opt.label}</span>
                          {typingPreset === opt.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <div className="text-[10px] opacity-75 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response Behavior Director */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        <span>Response Behavior Director</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Customize emotional mood, texting format, and custom behavioral rules globally or per character.
                      </p>
                    </div>

                    <select
                      value={selectedTargetChar}
                      onChange={e => setSelectedTargetChar(e.target.value)}
                      className="bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="__global__">🌍 All Characters (Global)</option>
                      {characters
                        .filter(c => c.id !== 'architect')
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Mood Presets */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      Personality Mood Override
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(MOOD_LABELS) as ResponseMood[]).map(moodKey => {
                        const m = MOOD_LABELS[moodKey];
                        const isSelected = dirMood === moodKey;
                        return (
                          <button
                            key={moodKey}
                            type="button"
                            onClick={() => setDirMood(moodKey)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-400 text-white'
                                : 'bg-zinc-900/60 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="text-xs font-bold">{m.label}</div>
                            <div className="text-[10px] opacity-75 line-clamp-1 mt-0.5">{m.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Texting Format Pacing */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      Texting Style & Formatting
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Object.keys(PACING_LABELS) as ResponsePacing[]).map(pKey => {
                        const p = PACING_LABELS[pKey];
                        const isSelected = dirPacing === pKey;
                        return (
                          <button
                            key={pKey}
                            type="button"
                            onClick={() => setDirPacing(pKey)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600/20 border-purple-400 text-white'
                                : 'bg-zinc-900/60 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="text-xs font-bold">{p.label}</div>
                            <div className="text-[10px] opacity-75 mt-0.5">{p.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Live Instruction */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Custom Director Prompt Rule (Optional)
                    </label>
                    <input
                      type="text"
                      value={dirCustomRule}
                      onChange={e => setDirCustomRule(e.target.value)}
                      placeholder="e.g., Always call me by my nickname and ask curious follow-up questions..."
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleResetAllDirectives}
                      className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Directives</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveIntelligence}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {aiSavedToast ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Directives Saved!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save AI Directives</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Character.AI Link Importer Shortcut */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-indigo-950/30 border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      <span>Character.AI Link & Transcript Importer</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Import custom characters, share links, or chat logs directly into EchoVault with automatic memory extraction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCaiImportModal();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 self-start sm:self-center"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Open C.AI Importer</span>
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 5: STORAGE & MEMORY VAULT
            ========================================================= */}
            {activeTab === 'storage' && (
              <div className="space-y-5 max-w-3xl">
                {/* LocalStorage Usage Meter */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-purple-400" />
                      <span>Browser Vault Storage Usage</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-purple-300">
                      {storageStats.totalKB} KB / 5,120 KB
                    </span>
                  </div>

                  {/* Usage Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${storageStats.percentUsed}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-white/5">
                      <div className="text-[10px] text-slate-400">Chat Logs</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{storageStats.chatKB} KB</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-white/5">
                      <div className="text-[10px] text-slate-400">Memory Vaults</div>
                      <div className="text-xs font-bold text-purple-300 font-mono mt-0.5">{storageStats.memoryKB} KB</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-white/5">
                      <div className="text-[10px] text-slate-400">Custom Profiles</div>
                      <div className="text-xs font-bold text-cyan-300 font-mono mt-0.5">{storageStats.customCharKB} KB</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-white/5">
                      <div className="text-[10px] text-slate-400">System Config</div>
                      <div className="text-xs font-bold text-slate-300 font-mono mt-0.5">{storageStats.settingsKB} KB</div>
                    </div>
                  </div>
                </div>

                {/* Export / Backup Conversation Logs as JSON */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Export & Backup Vault Data (JSON)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Download a complete portable JSON snapshot of your conversations, character memories, and theme settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackupJson}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 self-start sm:self-center"
                  >
                    {exportToast ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Backup Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Export JSON Backup</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Global Character Episodic Memories Inspector */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-pink-400" />
                        <span>Global Episodic Memory Vaults ({totalFactsCount} Active Facts)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Each character stores up to {MAX_ACTIVE_MEMORIES} personal facts about you for long-term context continuity.
                      </p>
                    </div>

                    {totalFactsCount > 0 && (
                      <div>
                        {!confirmClearAllMemories ? (
                          <button
                            type="button"
                            onClick={() => setConfirmClearAllMemories(true)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear All Memories</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                clearAllCharactersMemories(characters.map(c => c.id));
                                onRefreshMemories();
                                setStorageRefreshTick(t => t + 1);
                                setConfirmClearAllMemories(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
                            >
                              Confirm Purge All
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmClearAllMemories(false)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white text-xs transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {allMemoriesList.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center space-y-1.5">
                      <Brain className="w-6 h-6 text-slate-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">No Episodic Memories Recorded Yet</p>
                      <p className="text-[11px] text-slate-500">
                        As you chat with characters and share your name, hobbies, or preferences, facts will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {allMemoriesList.map(({ char, facts }) => (
                        <div
                          key={char.id}
                          className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={char.avatar}
                                alt={char.name}
                                className="w-7 h-7 rounded-full object-cover object-top border border-white/10"
                              />
                              <div>
                                <h5 className="text-xs font-bold text-white">{char.name}</h5>
                                <span className="text-[10px] text-purple-300 font-mono">
                                  {facts.length} / {MAX_ACTIVE_MEMORIES} facts stored
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                clearCharacterMemories(char.id);
                                onRefreshMemories();
                                setStorageRefreshTick(t => t + 1);
                              }}
                              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Clear</span>
                            </button>
                          </div>

                          <div className="space-y-1">
                            {facts.map((fact, idx) => (
                              <div
                                key={`${char.id}-fact-${idx}`}
                                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300"
                              >
                                <span className="truncate">{fact}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeCharacterMemory(char.id, idx);
                                    onRefreshMemories();
                                    setStorageRefreshTick(t => t + 1);
                                  }}
                                  className="text-slate-500 hover:text-rose-400 transition flex-shrink-0 cursor-pointer"
                                  title="Delete fact"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
