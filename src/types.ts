export type Universe =
  | 'helluva'
  | 'hellaverse'
  | 're'
  | 'resident_evil'
  | 'jujutsu'
  | 'cyberpunk'
  | 'frieren'
  | 'aot'
  | 'csm'
  | 'romcom'
  | 'anime'
  | 'marvel'
  | 'DC Universe'
  | 'dc'
  | 'scifi'
  | 'fantasy'
  | string;

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
  fullName?: string;
  tagline?: string;
  tag: string;
  universe: Universe;
  avatar: string;
  storyImg?: string;
  storyText?: string;
  storyTime?: string;
  song: string;
  status: string;
  themeAccent?: string;
  system: string;
  online?: boolean;
  relationshipLevel?: number;
  affinity?: number;
  affection?: number;
  trustScore?: number;
  bond?: number;
  relationshipTier?: 'Stranger' | 'Neutral' | string;
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

export interface GroupMemberInviteConfig {
  characterId: string;
  requiredAffinity: number;
  inviteDmText: string;       // In-character DM they send you when threshold is reached
  groupAddSystemText: string; // The action line displayed in the group backlog
}

export interface BacklogMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarUrl?: string;
  text: string;
  timestamp: string;
  isSystemDivider?: boolean;
}

export interface DynamicGroupRoom {
  id: string;
  name: string;
  memberIds: string[];
  isUnlocked: boolean;
  unlockedBy?: string;        // The character who actually invited you
  memberConfigs: Record<string, GroupMemberInviteConfig>;
  baseBacklog: BacklogMessage[];
}

export interface RelationshipScoreBreakdown {
  affinity: number;          // Current affinity score (-100 to +100)
  tier: 'Enemy' | 'Stranger' | 'Acquaintance' | 'Trusted' | 'Close' | 'Devoted';
  positiveTriggersCount: number;
  negativeTriggersCount: number;
  importedHistorySummary?: string;
  lastAnalysisTimestamp?: string;
}

export interface CharacterImportAnalysisResult {
  delta: number;             // e.g. +25 or -15
  reason: string;
  importedMessageCount: number;
}

