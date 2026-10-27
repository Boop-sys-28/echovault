export type Universe =
  | 'helluva'
  | 're'
  | 'jujutsu'
  | 'cyberpunk'
  | 'frieren'
  | 'aot'
  | 'csm'
  | 'romcom'
  | 'anime';

export interface UserProfile {
  id: string;
  username: string;
  codename: string;
  email?: string;
  avatarUrl?: string;
  provider?: 'local' | 'google' | 'guest';
  avatarColor: string;
  createdAt: number;
}

export interface RegisteredUserAccount extends UserProfile {
  email: string;
  password: string;
}

export interface CharacterMemory {
  charId: string;
  facts: string[];
  lastUpdated: number;
}

export interface PhotoPreset {
  id: string;
  label: string;
  category: string;
  url: string;
  caption: string;
}

export interface Character {
  id: string;
  name: string;
  tag: string;
  universe: Universe;
  avatar: string;
  storyImg?: string;
  storyText?: string;
  storyTime?: string;
  song: string;
  status: string;
  system: string;
  online?: boolean;
}

export interface ReplyReference {
  id: string;
  sender: 'user' | 'char';
  text: string;
  senderName: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'char';
  text: string;
  image?: string;
  timestamp: number;
  replyTo?: ReplyReference;
}

export interface CallState {
  isOpen: boolean;
  type: 'audio' | 'video';
  charId: string;
  phase: 'calling' | 'declined' | 'ended';
  statusText: string;
  subtitle: string;
}

export type ThemeId =
  | 'cyberpunk'
  | 'cai_classic'
  | 'midnight_oled'
  | 'sakura_bloom'
  | 'matrix_terminal';

export type BubbleStyle = 'modern_gradient' | 'cai_clean' | 'terminal_monospace';

export interface AppThemeConfig {
  themeId: ThemeId;
  appName: string;
  appSubtitle: string;
  bubbleStyle: BubbleStyle;
  accentGlow: boolean;
  chatFontSize: 'sm' | 'base' | 'lg';
}

export interface CaiImportResult {
  charName: string;
  charTag?: string;
  charSystem?: string;
  charAvatar?: string;
  messages: Message[];
  factsExtracted: string[];
}

export type ResponseMood =
  | 'canon'
  | 'flirty'
  | 'tsundere'
  | 'protective'
  | 'chaotic'
  | 'vulnerable';

export type ResponsePacing =
  | 'natural'
  | 'rapid_burst'
  | 'lowercase_casual'
  | 'expressive_rp';

export interface CharacterResponseDirective {
  mood: ResponseMood;
  pacing: ResponsePacing;
  customInstruction: string;
  systemOverride?: string;
  updatedAt: number;
}


