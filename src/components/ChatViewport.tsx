import React, { useRef, useEffect, useState } from 'react';
import {
  Menu,
  Phone,
  Video,
  Sliders,
  Flame,
  Camera,
  ImagePlus,
  Brain,
  ArrowUp,
  CheckCheck,
  Music,
  Sparkles,
  Radio,
  Reply,
  X,
  Search,
  MessageSquare,
  Lock,
  UserPlus,
  UserCheck,
  Link2,
  Trash2,
  MoreVertical,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import {
  Character,
  Message,
  ReplyReference,
  AppThemeConfig,
  DynamicGroupRoom,
  BacklogMessage,
  RelationshipScoreBreakdown,
} from '../types';
import { THEME_DEFINITIONS } from '../data/themes';
import { resolveAvatarUrl, handleAvatarImageError, formatCompactNumber } from '../utils/avatarHelper';
import {
  formatBubbleTimestamp,
  splitResponseIntoBubbles,
} from '../utils/semanticOrchestrator';
import {
  getMergedCharacterMemories,
  extractFactsFromUserMessage,
  addCharacterMemory,
} from '../utils/memory';

interface ChatViewportProps {
  character?: Character;
  activeGroupRoom?: DynamicGroupRoom;
  groupMessages?: BacklogMessage[];
  onSendGroupMessage?: (text: string) => void;
  scoreBreakdown?: RelationshipScoreBreakdown;
  onOpenScoreModal?: () => void;
  allCharacters: Character[];
  messages: Message[];
  isTyping: boolean;
  inputText: string;
  burnerMode: boolean;
  hasServerAi: boolean;
  apiErrorBanner?: string | null;
  onDismissApiError?: () => void;
  onOpenApiSettings?: () => void;
  onRetryLastMessage?: () => void;
  isAway: boolean;
  autoAwayEnabled: boolean;
  replyingTo: ReplyReference | null;
  userCodename: string;
  themeConfig?: AppThemeConfig;
  onOpenCaiImportModal?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
  onDeleteMessage?: (msgId: string) => void;
  regeneratingMsgId?: string | null;
  onSwipeMessageVariant?: (msgId: string, direction: 'prev' | 'next') => void;
  onRegenerateMessageVariant?: (msgId: string) => void;
  isFollowed?: boolean;
  isStoryViewed?: boolean;
  memoriesCount?: number;
  activeMemories?: string[];
  onOpenMemoryVault?: () => void;
  onOpenSharePhoto?: () => void;
  onImageClick?: (url: string, caption?: string, senderName?: string) => void;
  onToggleFollow?: () => void;
  onSetReplyingTo: (reply: ReplyReference | null) => void;
  onSelectCharacter: (id: string) => void;
  onToggleAutoAway: () => void;
  onTriggerAwayMessage: () => void;
  onInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent, memoriesFromViewport?: string[]) => void;
  onToggleBurner: () => void;
  onStartCall: (type: 'audio' | 'video') => void;
  onRequestPhoto: () => void;
  onSendEmoji: (emoji: string) => void;
  onOpenPromptSpec: () => void;
  onOpenStory: () => void;
  onOpenLockedStory?: (char: Character) => void;
  onToggleMobileSidebar: () => void;
}

/**
 * Formats Character.AI-style roleplay actions wrapped in *asterisks* into italicized spans.
 */
function renderRoleplayText(text: string): React.ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-purple-200/85 font-normal">
          {part}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const ChatViewport: React.FC<ChatViewportProps> = ({
  character,
  activeGroupRoom,
  groupMessages = [],
  onSendGroupMessage,
  scoreBreakdown,
  onOpenScoreModal,
  allCharacters,
  messages,
  isTyping,
  inputText,
  burnerMode,
  apiErrorBanner,
  onDismissApiError,
  onOpenApiSettings,
  onRetryLastMessage,
  autoAwayEnabled,
  replyingTo,
  userCodename,
  themeConfig,
  onOpenCaiImportModal,
  onClearChat,
  onDeleteChat,
  onDeleteMessage,
  regeneratingMsgId = null,
  onSwipeMessageVariant,
  onRegenerateMessageVariant,
  isFollowed = true,
  isStoryViewed = false,
  memoriesCount = 0,
  activeMemories = [],
  onOpenMemoryVault,
  onOpenSharePhoto,
  onImageClick,
  onToggleFollow,
  onSetReplyingTo,
  onSelectCharacter,
  onToggleAutoAway,
  onTriggerAwayMessage,
  onInputChange,
  onSubmit,
  onToggleBurner,
  onStartCall,
  onRequestPhoto,
  onOpenPromptSpec,
  onOpenStory,
  onOpenLockedStory,
  onToggleMobileSidebar,
}) => {
  const feedEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [emptySearch, setEmptySearch] = useState('');
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const activeTheme = THEME_DEFINITIONS[themeConfig?.themeId || 'cyberpunk'] || THEME_DEFINITIONS.cyberpunk;
  const bubbleStyle = themeConfig?.bubbleStyle || 'modern_gradient';
  const fontSizeClass =
    themeConfig?.chatFontSize === 'sm'
      ? 'text-xs'
      : themeConfig?.chatFontSize === 'lg'
      ? 'text-sm md:text-base'
      : 'text-xs md:text-sm';

  const userBubbleShape =
    bubbleStyle === 'modern_gradient'
      ? 'bubble-user text-white'
      : bubbleStyle === 'cai_clean'
      ? `${activeTheme.palette.bubbleUser} ${activeTheme.palette.textUser} rounded-xl`
      : `${activeTheme.palette.bubbleUser} ${activeTheme.palette.textUser} rounded-md font-mono border border-emerald-500/40`;

  const charBubbleShape =
    bubbleStyle === 'modern_gradient'
      ? 'bubble-char text-slate-100'
      : bubbleStyle === 'cai_clean'
      ? `${activeTheme.palette.bubbleChar} ${activeTheme.palette.textChar} rounded-xl`
      : `${activeTheme.palette.bubbleChar} ${activeTheme.palette.textChar} rounded-md font-mono border border-emerald-800/40`;

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, groupMessages, isTyping]);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(msgId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 1800);
    }
  };

  // Render Unlocked Dynamic Group Room Viewport
  if (activeGroupRoom) {
    const roomMembers = activeGroupRoom.memberIds
      .map(id => allCharacters.find(c => c.id === id))
      .filter((c): c is Character => Boolean(c));
    const inviter = activeGroupRoom.unlockedBy
      ? allCharacters.find(c => c.id === activeGroupRoom.unlockedBy)
      : undefined;

    return (
      <main className="flex-1 flex flex-col h-full bg-[#090a0f] relative min-w-0">
        <header className="sticky top-0 shrink-0 px-3 py-2.5 md:px-5 md:py-3 border-b border-white/10 bg-[#0d0f17]/85 backdrop-blur-xl flex items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition flex-shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
              {roomMembers.map(member => (
                <img
                  key={member.id}
                  src={resolveAvatarUrl(member.avatarUrl || member.avatar, member.id)}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onClick={() => onSelectCharacter(member.id)}
                  onError={(e) => handleAvatarImageError(e, member.name, member.themeAccent)}
                  title={`Open DM with ${member.name}`}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[#0d0f17] object-cover object-top bg-[#161a2b] cursor-pointer hover:scale-105 transition"
                />
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white truncate">
                  {activeGroupRoom.name}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1 flex-shrink-0">
                  <Users className="w-2.5 h-2.5" />
                  <span>{roomMembers.length} Members</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {inviter
                  ? `Authorized by ${inviter.name} • Active Encrypted Comms`
                  : roomMembers.map(m => m.name.split(' ')[0]).join(', ')}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 relative">
          {groupMessages.map(msg => {
            if (msg.isSystemDivider) {
              return (
                <div key={msg.id} className="flex items-center justify-center my-3">
                  <div className="px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-[11px] text-indigo-200 font-medium shadow-sm">
                    {renderRoleplayText(msg.text)}
                    <span className="ml-2 text-[10px] text-indigo-400/80 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            }

            const isUser = msg.senderId === 'user';
            const senderChar = allCharacters.find(c => c.id === msg.senderId);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} msg-pop`}
              >
                {!isUser && (
                  <img
                    src={resolveAvatarUrl(msg.avatarUrl || senderChar?.avatarUrl || senderChar?.avatar || '', msg.senderId)}
                    alt={msg.senderName}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => handleAvatarImageError(e, msg.senderName, senderChar?.themeAccent)}
                    onClick={() => senderChar && onSelectCharacter(senderChar.id)}
                    className="w-8 h-8 rounded-full object-cover object-top border border-white/15 bg-[#161a2b] flex-shrink-0 mt-1 cursor-pointer"
                  />
                )}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                  {!isUser && (
                    <span className="text-[11px] font-bold text-indigo-300 mb-0.5 px-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2.5 ${fontSizeClass} leading-relaxed break-words ${
                      isUser ? userBubbleShape : charBubbleShape
                    }`}
                  >
                    {renderRoleplayText(msg.text)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1 tabular-nums">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex flex-col items-start msg-pop">
              <div className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bubble-char">
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-1"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-2"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-3"></span>
              </div>
              <span className="text-[10px] text-slate-500 px-2 mt-1">
                Channel member is typing...
              </span>
            </div>
          )}

          <div ref={feedEndRef} />
        </div>

        <footer className="sticky bottom-0 shrink-0 px-3 pt-2.5 pb-[env(safe-area-inset-bottom)] pb-safe md:px-5 md:py-3.5 border-t border-white/10 bg-[#0d0f17]/90 backdrop-blur-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim() && onSendGroupMessage) {
                onSendGroupMessage(inputText);
              }
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative flex items-center min-w-0">
              <input
                type="text"
                placeholder={`Transmit to ${activeGroupRoom.name}...`}
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                className="w-full bg-[#131622]/90 border border-white/10 rounded-2xl py-2.5 px-4 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 transition"
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white flex-shrink-0 shadow-md shadow-purple-600/25 transition transform active:scale-95 cursor-pointer"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </footer>
      </main>
    );
  }

  // If no character is currently selected, render the Fresh Chat Discovery Viewport
  if (!character) {
    const filteredChars = allCharacters.filter(c => {
      if (!emptySearch.trim()) return true;
      const q = emptySearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q) ||
        (c.codename || '').toLowerCase().includes(q) ||
        (c.bio || '').toLowerCase().includes(q) ||
        String(c.universe).toLowerCase().includes(q)
      );
    });

    return (
      <main className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-y-auto p-4 sm:p-6 md:p-8 select-none min-w-0">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition flex-shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-white truncate">
                Welcome, {userCodename}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Select a character below to start a new conversation.
              </p>
            </div>
          </div>
        </div>

        {/* Search Characters */}
        <div className="max-w-md mb-4 px-4 sm:px-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, codename, or universe..."
              value={emptySearch}
              onChange={(e) => setEmptySearch(e.target.value)}
              className="w-full bg-[#131622]/90 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition"
            />
          </div>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 max-w-6xl pb-6">
          {filteredChars.map(char => (
            <div
              key={char.id}
              onClick={() => onSelectCharacter(char.id)}
              className="p-4 bg-[#0d0f17]/90 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 rounded-2xl cursor-pointer transition transform hover:-translate-y-0.5 shadow-lg group flex flex-col justify-between min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-start space-x-3 mb-3 min-w-0">
                  <div className="w-12 h-12 rounded-full p-0.5 story-gradient flex-shrink-0 overflow-hidden">
                    <img
                      src={resolveAvatarUrl(char.avatarUrl || char.avatar, char.id)}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => handleAvatarImageError(e, char.name, char.themeAccent)}
                      className="w-full h-full rounded-full object-cover object-top border-2 border-[#0d0f17] bg-[#161a2b]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition">
                        {char.name}
                      </h4>
                      {char.codename && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 shrink-0">
                          {char.codename}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1 min-w-0">
                      <span className="text-[11px] text-slate-400 truncate max-w-full block">
                        {char.tag}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50 shrink-0">
                        <Users className="w-3 h-3 text-purple-400" />
                        {formatCompactNumber(char.userCount || 1200)} chats
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 truncate mb-4 leading-relaxed">
                  {char.bio || char.tagline || char.status}
                </p>
              </div>

              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-white/[0.05] group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 text-xs font-semibold text-slate-200 group-hover:text-white border border-white/10 group-hover:border-transparent transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const formatTime = (ts: number) => {
    return formatBubbleTimestamp(ts);
  };

  // Ensure any message containing `||` is split into individual bubbles with separate, increasing timestamps
  interface RenderedMessageItem extends Message {
    sourceMsgId: string;
    isLastPartOfMsg: boolean;
  }

  const renderedMessages: RenderedMessageItem[] = [];
  let lastRenderedTs = 0;
  for (const msg of messages) {
    const parts = msg.text.includes('||') ? splitResponseIntoBubbles(msg.text) : [msg.text];
    parts.forEach((partText, partIdx) => {
      const rawTs = partIdx === 0 ? msg.timestamp : msg.timestamp + partIdx * 2000;
      const distinctTs = rawTs <= lastRenderedTs ? lastRenderedTs + 1500 : rawTs;
      lastRenderedTs = distinctTs;
      renderedMessages.push({
        ...msg,
        id: partIdx === 0 ? msg.id : `${msg.id}-part-${partIdx}`,
        sourceMsgId: msg.id,
        isLastPartOfMsg: partIdx === parts.length - 1,
        text: partText,
        image: partIdx === 0 ? msg.image : undefined,
        replyTo: partIdx === 0 ? msg.replyTo : undefined,
        timestamp: distinctTs,
      });
    });
  }

  const handleAvatarClick = () => {
    if (!character.storyImg) return;
    if (isFollowed) {
      onOpenStory();
    } else if (onOpenLockedStory) {
      onOpenLockedStory(character);
    }
  };

  const currentAffinity = scoreBreakdown?.affinity ?? 0;
  const currentTier = scoreBreakdown?.tier ?? 'Stranger';

  return (
    <main className="flex-1 flex flex-col h-full bg-[#090a0f] relative min-w-0">
      {/* Sleek Glassmorphic Header */}
      <header className="sticky top-0 shrink-0 px-3 py-2.5 md:px-5 md:py-3 border-b border-white/10 bg-[#0d0f17]/85 backdrop-blur-xl flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition flex-shrink-0 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className={`relative flex-shrink-0 cursor-pointer ${character.storyImg ? 'hover:scale-105 transition' : ''}`}
            onClick={handleAvatarClick}
            title={
              character.storyImg
                ? !isFollowed
                  ? `Follow ${character.name} to view story`
                  : isStoryViewed
                  ? `Viewed story of ${character.name} (Click to re-watch)`
                  : `View new story from ${character.name}`
                : character.name
            }
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full p-0.5 transition ${
                character.storyImg
                  ? !isFollowed
                    ? 'border-2 border-dashed border-amber-400/80 bg-zinc-900'
                    : isStoryViewed
                    ? 'bg-zinc-600/90 ring-1 ring-zinc-500/40 border border-zinc-600/60'
                    : 'story-gradient'
                  : 'bg-[#1a1e2e]'
              }`}
            >
              <img
                src={resolveAvatarUrl(character.avatarUrl || character.avatar, character.id)}
                alt={character.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => handleAvatarImageError(e, character.name, character.themeAccent)}
                className={`w-full h-full rounded-full object-cover object-top border-2 border-[#090a0f] bg-[#1a1e2e] ${
                  character.storyImg && !isFollowed
                    ? 'brightness-75'
                    : isStoryViewed
                    ? 'brightness-90'
                    : ''
                }`}
              />
            </div>
            {character.storyImg && !isFollowed && (
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-amber-500 text-zinc-950 shadow-md">
                <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
            )}
            {character.online && (isFollowed || !character.storyImg) && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#090a0f]"></span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {character.name}
              </h2>
              {onToggleFollow && (
                <button
                  type="button"
                  onClick={onToggleFollow}
                  className={`text-[11px] px-2 py-0.5 rounded-lg font-medium transition flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                    isFollowed
                      ? 'bg-white/[0.06] text-slate-300 border border-white/10 hover:bg-white/[0.1]'
                      : 'bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50'
                  }`}
                >
                  {isFollowed ? (
                    <>
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span className="hidden sm:inline">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      <span className="hidden sm:inline">Follow</span>
                    </>
                  )}
                </button>
              )}

              {/* Relationship Score & Diagnostics Badge */}
              {onOpenScoreModal && (
                <button
                  type="button"
                  onClick={onOpenScoreModal}
                  title="Inspect Relationship Diagnostics & Import C.AI Transcript"
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-semibold transition flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <Activity className="w-3 h-3 text-indigo-400" />
                  <span>{currentTier}</span>
                  <span className={currentAffinity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ({currentAffinity > 0 ? `+${currentAffinity}` : currentAffinity})
                  </span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate mt-0.5">
              <span className="inline-flex items-center gap-1 text-zinc-300 font-medium flex-shrink-0">
                <Users className="w-3 h-3 text-purple-400" />
                <span>{formatCompactNumber(character.userCount || 1200)} operatives chatted • {character.online ? 'Active' : 'Idle'}</span>
              </span>
              <span className="text-slate-600 flex-shrink-0">•</span>
              <span className="inline-flex items-center gap-1 truncate min-w-0">
                <Music className="w-3 h-3 text-purple-400 flex-shrink-0" />
                <span className="truncate">{character.song}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Streamlined Header Actions */}
        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
          <button
            onClick={onOpenPromptSpec}
            title="Response Behavior Director"
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-300 hover:text-cyan-300 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {onOpenMemoryVault && (
            <button
              onClick={onOpenMemoryVault}
              title={`Memories (${memoriesCount})`}
              className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-300 hover:text-purple-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              {memoriesCount > 0 && (
                <span className="text-[10px] font-semibold text-purple-300 tabular-nums">
                  {memoriesCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => onStartCall('audio')}
            title="Voice Call"
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => onStartCall('video')}
            title="Video Call"
            className="hidden sm:inline-flex p-2 rounded-xl hover:bg-white/[0.06] text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* More / Chat Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDeleteMenu(prev => !prev)}
              title="More Options"
              className={`p-2 rounded-xl transition cursor-pointer ${
                showDeleteMenu
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'hover:bg-white/[0.06] text-slate-300 hover:text-white'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showDeleteMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#121521]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1">
                {onOpenScoreModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenScoreModal();
                      setShowDeleteMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs text-indigo-300 hover:bg-indigo-500/15 flex items-center gap-2.5 font-medium transition cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Status & Score Inspector</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onOpenPromptSpec();
                    setShowDeleteMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-cyan-300 hover:bg-cyan-500/15 flex items-center gap-2.5 font-medium transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Response Behavior Director</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onStartCall('video');
                    setShowDeleteMenu(false);
                  }}
                  className="sm:hidden w-full px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>Video Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTriggerAwayMessage();
                    setShowDeleteMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Simulate Check-In DM</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleAutoAway();
                    setShowDeleteMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:bg-white/10 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Auto Check-In DMs</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${autoAwayEnabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-500'}`}>
                    {autoAwayEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleBurner();
                    setShowDeleteMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:bg-white/10 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Burner Mode</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${burnerMode ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-500'}`}>
                    {burnerMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                {(onClearChat || onDeleteChat) && (
                  <div className="border-t border-white/10 my-1 pt-1 space-y-1">
                    {onClearChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onClearChat();
                          setShowDeleteMenu(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Clear Messages</span>
                      </button>
                    )}
                    {onDeleteChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteChat();
                          setShowDeleteMenu(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-rose-300 hover:bg-rose-500/20 flex items-center gap-2.5 font-semibold transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete Conversation</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 relative">
        {/* Empty Conversation Starter */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center my-auto space-y-3">
            <div className="w-16 h-16 rounded-full p-0.5 story-gradient flex items-center justify-center shadow-xl overflow-hidden">
              <img
                src={resolveAvatarUrl(character.avatarUrl || character.avatar, character.id)}
                alt={character.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => handleAvatarImageError(e, character.name, character.themeAccent)}
                className="w-full h-full rounded-full object-cover object-top border-2 border-[#090a0f] bg-[#161a2b]"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {character.id === 'architect'
                  ? 'Response Director'
                  : character.name}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                {character.id === 'architect'
                  ? 'Tell me how you want any character (or all characters) to respond to your messages and I will update their live behavior.'
                  : 'Start the conversation with a message below or tap a quick prompt.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 justify-center max-w-md">
              {(character.id === 'architect'
                ? [
                    'make loona more flirty and affectionate',
                    'make gojo double text in rapid bursts',
                    'make all characters extra protective',
                    'status',
                  ]
                : [
                    `hey ${character.name.toLowerCase()}, what's on your mind?`,
                    'what are you up to right now?',
                    'send me a photo / selfie',
                    'tell me something nobody else knows',
                  ]
              ).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onInputChange(suggestion)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>

            {onOpenCaiImportModal && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCaiImportModal}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import Character.AI Link</span>
                </button>
                {onOpenScoreModal && (
                  <button
                    type="button"
                    onClick={onOpenScoreModal}
                    className="px-4 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Import Transcript & Check Score</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {renderedMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isHighlighted = highlightedMsgId === msg.id;

          return (
            <div
              key={msg.id}
              id={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} msg-pop group transition-all duration-300 rounded-2xl ${
                isHighlighted ? 'bg-purple-500/20 p-1 ring-1 ring-purple-400/50' : ''
              }`}
            >
              {!isUser && (
                <img
                  src={resolveAvatarUrl(character.avatarUrl || character.avatar, character.id)}
                  alt={character.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => handleAvatarImageError(e, character.name, character.themeAccent)}
                  onClick={handleAvatarClick}
                  className="w-8 h-8 rounded-full object-cover object-top border border-white/15 bg-[#161a2b] flex-shrink-0 mt-1 cursor-pointer"
                />
              )}
              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] min-w-0`}>
                {/* Message Bubble with Reply & Delete Reference */}
                <div className="relative group max-w-full">
                {/* Floating Reply & Delete Action Bar */}
                <div
                  className={`absolute -top-3 ${
                    isUser ? 'right-2' : 'left-2'
                  } opacity-0 group-hover:opacity-100 flex items-center gap-1 transition z-10`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSetReplyingTo({
                        id: msg.id,
                        sender: msg.sender,
                        text: msg.text,
                        senderName: isUser ? userCodename : character.name,
                      });
                    }}
                    title="Reply"
                    className="p-1.5 rounded-xl bg-[#131622]/95 backdrop-blur-md border border-white/15 text-slate-300 hover:text-cyan-400 shadow-lg transition cursor-pointer"
                  >
                    <Reply className="w-3 h-3" />
                  </button>
                  {onDeleteMessage && (
                    <button
                      type="button"
                      onClick={() => onDeleteMessage(msg.id)}
                      title="Delete message"
                      className="p-1.5 rounded-xl bg-[#131622]/95 backdrop-blur-md border border-white/15 text-slate-300 hover:text-rose-400 shadow-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {msg.image ? (
                  <div className="rounded-2xl overflow-hidden border border-white/10 max-w-xs shadow-xl bg-[#131622]">
                    {msg.replyTo && (
                      <div
                        onClick={() => scrollToMessage(msg.replyTo!.id)}
                        className="p-2.5 bg-black/30 border-b border-white/10 text-[11px] text-slate-300 cursor-pointer hover:bg-black/50 transition"
                      >
                        <span className="font-semibold text-purple-300 block">
                          Replying to {msg.replyTo.senderName}
                        </span>
                        <span className="truncate block opacity-80">{msg.replyTo.text}</span>
                      </div>
                    )}
                    <img
                      src={msg.image}
                      alt="Shared media"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => handleAvatarImageError(e, isUser ? userCodename : character.name, character.themeAccent)}
                      onClick={() => onImageClick?.(msg.image!, msg.text, isUser ? userCodename : character.name)}
                      className="w-full h-auto object-cover max-h-64 hover:scale-[1.02] transition cursor-pointer"
                      title="Click to view full image"
                    />
                    {msg.text && (
                      <p className="p-3 text-xs text-white bg-[#131622] leading-relaxed">
                        {renderRoleplayText(msg.text)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className={`px-4 py-2.5 ${fontSizeClass} leading-relaxed break-words ${
                      isUser ? userBubbleShape : charBubbleShape
                    }`}
                  >
                    {msg.replyTo && (
                      <div
                        onClick={() => scrollToMessage(msg.replyTo!.id)}
                        className="mb-1.5 px-2.5 py-1.5 rounded-xl bg-black/25 border border-white/10 text-[11px] text-slate-200 cursor-pointer hover:bg-black/40 transition flex flex-col text-left"
                      >
                        <span className="font-semibold text-purple-300 leading-tight">
                          {msg.replyTo.senderName}
                        </span>
                        <span className="truncate opacity-80 leading-tight mt-0.5">
                          {msg.replyTo.text}
                        </span>
                      </div>
                    )}
                    {bubbleStyle === 'terminal_monospace' && (
                      <span className="text-[9px] opacity-70 block mb-0.5">
                        {isUser ? '> USER:' : `> ${character.name.toUpperCase()}:`}
                      </span>
                    )}
                    {renderRoleplayText(msg.text)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 px-1 flex-wrap">
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {formatTime(msg.timestamp)}
                </span>
                {isUser && <CheckCheck className="w-3 h-3 text-purple-400" />}

                {/* Character.ai Multi-Variant Swipe Indicator (< 1/2 >) & Regenerate Control */}
                {!isUser && msg.isLastPartOfMsg && (onSwipeMessageVariant || onRegenerateMessageVariant) && (() => {
                  const variantsList =
                    msg.variants && msg.variants.length > 0 ? msg.variants : [msg.text];
                  const totalVariants = variantsList.length;
                  const activeVariantIdx =
                    typeof msg.activeVariantIndex === 'number'
                      ? Math.min(Math.max(0, msg.activeVariantIndex), totalVariants - 1)
                      : 0;
                  const isRegeneratingThis = regeneratingMsgId === msg.sourceMsgId;

                  return (
                    <div className="inline-flex items-center gap-1 ml-1 select-none">
                      <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300">
                        <button
                          type="button"
                          disabled={activeVariantIdx <= 0 || isRegeneratingThis}
                          onClick={() => onSwipeMessageVariant?.(msg.sourceMsgId, 'prev')}
                          title="Previous reply variant"
                          aria-label="Previous reply variant"
                          className="p-0.5 rounded hover:bg-white/10 hover:text-cyan-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="px-1 text-[10px] font-mono tabular-nums text-slate-300">
                          {activeVariantIdx + 1}/{totalVariants}
                        </span>
                        <button
                          type="button"
                          disabled={isRegeneratingThis}
                          onClick={() => {
                            if (activeVariantIdx < totalVariants - 1) {
                              onSwipeMessageVariant?.(msg.sourceMsgId, 'next');
                            } else {
                              onRegenerateMessageVariant?.(msg.sourceMsgId);
                            }
                          }}
                          title={
                            activeVariantIdx < totalVariants - 1
                              ? 'Next reply variant'
                              : 'Generate new reply variant'
                          }
                          aria-label={
                            activeVariantIdx < totalVariants - 1
                              ? 'Next reply variant'
                              : 'Generate new reply variant'
                          }
                          className="p-0.5 rounded hover:bg-white/10 hover:text-cyan-300 disabled:opacity-40 transition cursor-pointer"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {onRegenerateMessageVariant && (
                        <button
                          type="button"
                          disabled={isRegeneratingThis}
                          onClick={() => onRegenerateMessageVariant(msg.sourceMsgId)}
                          title="Regenerate reply variant"
                          aria-label="Regenerate reply variant"
                          className="p-1 rounded-lg bg-white/[0.04] hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 text-slate-400 hover:text-purple-300 disabled:opacity-40 transition cursor-pointer"
                        >
                          <RotateCw
                            className={`w-2.5 h-2.5 ${isRegeneratingThis ? 'animate-spin text-purple-300' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
              </div>
            </div>
          );
        })}

        {/* Active Typing Indicator */}
        {isTyping && (
          <div className="flex flex-col items-start msg-pop">
            <div className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bubble-char">
              <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-1"></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-2"></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-3"></span>
            </div>
            <span className="text-[10px] text-slate-500 px-2 mt-1">
              {character.name} is typing...
            </span>
          </div>
        )}

        <div ref={feedEndRef} />
      </div>

      {/* Sleek Responsive Input Footer with Safe-Area Inset */}
      <footer className="sticky bottom-0 shrink-0 px-3 pt-2.5 pb-[env(safe-area-inset-bottom)] pb-safe md:px-5 md:py-3.5 border-t border-white/10 bg-[#0d0f17]/90 backdrop-blur-2xl">
        {/* Live Gemini API Error / Quota Toast Banner */}
        {apiErrorBanner && (
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 mb-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold truncate">{apiErrorBanner}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onRetryLastMessage && (
                <button
                  type="button"
                  onClick={onRetryLastMessage}
                  className="px-2.5 py-1 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/40 text-[11px] font-semibold text-indigo-100 transition cursor-pointer"
                >
                  Retry
                </button>
              )}
              {onOpenApiSettings && (
                <button
                  type="button"
                  onClick={onOpenApiSettings}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-[11px] font-semibold text-amber-100 transition cursor-pointer"
                >
                  API Settings
                </button>
              )}
              {onDismissApiError && (
                <button
                  type="button"
                  onClick={onDismissApiError}
                  className="p-1 text-amber-300 hover:text-white transition cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reply Quote Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3.5 py-2 mb-2 bg-[#131622] border border-white/10 rounded-2xl text-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <Reply className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0 truncate text-slate-300 text-xs">
                Replying to <span className="font-semibold text-purple-300">{replyingTo.senderName}</span>:{' '}
                <span className="text-slate-400 truncate">"{replyingTo.text.slice(0, 45)}"</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSetReplyingTo(null)}
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              title="Cancel Reply"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            if (character && inputText.trim()) {
              const extracted = extractFactsFromUserMessage(inputText, userCodename);
              extracted.forEach((f) => addCharacterMemory(character.id, f));
              const latestMemories = getMergedCharacterMemories(character.id, activeMemories);
              onSubmit(e, latestMemories);
            } else {
              onSubmit(e, activeMemories);
            }
          }}
          className="flex items-center gap-2"
        >
          {/* Request Photo Button */}
          <button
            type="button"
            onClick={onRequestPhoto}
            title="Request Photo"
            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-pink-400 transition flex-shrink-0 border border-white/10 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Share Photo Button */}
          {onOpenSharePhoto && (
            <button
              type="button"
              onClick={onOpenSharePhoto}
              title={`Send Photo to ${character.name}`}
              className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-purple-300 transition flex-shrink-0 border border-white/10 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
          )}

          {/* Text Input */}
          <div className="flex-1 relative flex items-center min-w-0">
            <input
              ref={inputRef}
              type="text"
              placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : `Message ${character.name}...`}
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full bg-[#131622]/90 border border-white/10 rounded-2xl py-2.5 px-4 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white flex-shrink-0 shadow-md shadow-purple-600/25 transition transform active:scale-95 cursor-pointer"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </footer>
    </main>
  );
};
