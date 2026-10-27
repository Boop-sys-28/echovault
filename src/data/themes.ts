import { AppThemeConfig, ThemeId, BubbleStyle } from '../types';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  badge: string;
  description: string;
  palette: {
    bgApp: string;
    bgSidebar: string;
    bgChat: string;
    bgCard: string;
    accent: string;
    accentText: string;
    border: string;
    bubbleUser: string;
    bubbleChar: string;
    textUser: string;
    textChar: string;
    storyRing: string;
  };
}

export const THEME_DEFINITIONS: Record<ThemeId, ThemeDefinition> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'PulseDirect Cyberpunk',
    badge: 'DEFAULT // NEON NOIR',
    description: 'Electric cyan and vivid violet accents against deep dark titanium slate.',
    palette: {
      bgApp: 'bg-[#090a0f]',
      bgSidebar: 'bg-[#0d0f17]',
      bgChat: 'bg-[#090a0f]',
      bgCard: 'bg-[#131622]',
      accent: 'from-purple-600 to-pink-500',
      accentText: 'text-cyan-400',
      border: 'border-white/10',
      bubbleUser: 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-md shadow-purple-600/20',
      bubbleChar: 'bg-[#181c2c] border border-white/10',
      textUser: 'text-white',
      textChar: 'text-slate-100',
      storyRing: 'story-gradient',
    },
  },
  cai_classic: {
    id: 'cai_classic',
    name: 'C.AI Classic Slate',
    badge: 'CHARACTER.AI CLEAN',
    description: 'Minimalist charcoal dark mode with cool steel contrast and distraction-free styling.',
    palette: {
      bgApp: 'bg-[#18181b]',
      bgSidebar: 'bg-[#121215]',
      bgChat: 'bg-[#1a1a20]',
      bgCard: 'bg-[#22232c]',
      accent: 'from-blue-600 to-indigo-600',
      accentText: 'text-blue-400',
      border: 'border-zinc-800/80',
      bubbleUser: 'bg-[#2b2d3d] border border-zinc-700/60 shadow-sm',
      bubbleChar: 'bg-[#22232e] border border-zinc-800',
      textUser: 'text-zinc-100',
      textChar: 'text-zinc-200',
      storyRing: 'bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400',
    },
  },
  midnight_oled: {
    id: 'midnight_oled',
    name: 'Midnight Obsidian OLED',
    badge: '100% PURE BLACK',
    description: 'Pitch-black power saving theme for OLED screens with luxury amber and crimson fire.',
    palette: {
      bgApp: 'bg-[#000000]',
      bgSidebar: 'bg-[#050505]',
      bgChat: 'bg-[#000000]',
      bgCard: 'bg-[#0c0c0c]',
      accent: 'from-amber-500 to-red-600',
      accentText: 'text-amber-400',
      border: 'border-zinc-800/90',
      bubbleUser: 'bg-gradient-to-r from-red-600 to-amber-600 shadow-md shadow-red-900/30',
      bubbleChar: 'bg-[#0e0e0e] border border-zinc-800',
      textUser: 'text-white',
      textChar: 'text-zinc-100',
      storyRing: 'bg-gradient-to-tr from-red-500 via-amber-500 to-yellow-400',
    },
  },
  sakura_bloom: {
    id: 'sakura_bloom',
    name: 'Tokyo Sakura Night',
    badge: 'CHERRY BLOSSOM NOIR',
    description: 'Night plum canvas with delicate pastel rose, cherry blossom magenta, and soft glows.',
    palette: {
      bgApp: 'bg-[#120d18]',
      bgSidebar: 'bg-[#181120]',
      bgChat: 'bg-[#140e1a]',
      bgCard: 'bg-[#201528]',
      accent: 'from-pink-500 to-rose-600',
      accentText: 'text-pink-400',
      border: 'border-pink-900/30',
      bubbleUser: 'bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 shadow-md shadow-pink-900/20',
      bubbleChar: 'bg-[#1f1527] border border-pink-500/20',
      textUser: 'text-white',
      textChar: 'text-pink-100',
      storyRing: 'bg-gradient-to-tr from-pink-500 via-rose-400 to-purple-500',
    },
  },
  matrix_terminal: {
    id: 'matrix_terminal',
    name: 'Matrix Cyber Terminal',
    badge: 'HACKER PHOSPHOR',
    description: 'CRT terminal aesthetic with phosphor emerald green lines and monospace vibe.',
    palette: {
      bgApp: 'bg-[#040a06]',
      bgSidebar: 'bg-[#07120a]',
      bgChat: 'bg-[#050d07]',
      bgCard: 'bg-[#0b1c10]',
      accent: 'from-emerald-500 to-teal-600',
      accentText: 'text-emerald-400',
      border: 'border-emerald-900/40',
      bubbleUser: 'bg-[#0c2816] border border-emerald-500/40 text-emerald-100 shadow-sm shadow-emerald-950',
      bubbleChar: 'bg-[#06150b] border border-emerald-800/40 text-emerald-200',
      textUser: 'text-emerald-50 font-mono',
      textChar: 'text-emerald-300 font-mono',
      storyRing: 'bg-gradient-to-tr from-emerald-500 via-green-400 to-teal-300',
    },
  },
};

export const DEFAULT_THEME_CONFIG: AppThemeConfig = {
  themeId: 'cyberpunk',
  appName: 'EchoVault',
  appSubtitle: '',
  bubbleStyle: 'modern_gradient',
  accentGlow: true,
  chatFontSize: 'base',
};

export const THEME_STORAGE_KEY = 'pulsedirect_app_theme_config';

export function loadSavedThemeConfig(): AppThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const migratedName =
        !parsed.appName || parsed.appName.toUpperCase() === 'PULSEDIRECT'
          ? 'EchoVault'
          : parsed.appName;
      return {
        ...DEFAULT_THEME_CONFIG,
        ...parsed,
        appName: migratedName,
        appSubtitle: '',
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_THEME_CONFIG;
}

export function saveThemeConfig(config: AppThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}
