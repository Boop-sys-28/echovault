import React, { useState, useRef } from 'react';
import {
  Zap,
  UserPlus,
  Search,
  Calculator,
  Lock,
  MessageSquare,
  LogOut,
  Trash2,
  Settings,
  X,
  Users,
} from 'lucide-react';
import { Character, Message, UserProfile, DynamicGroupRoom } from '../types';
import { resolveAvatarUrl, handleAvatarImageError, formatCompactNumber } from '../utils/avatarHelper';

interface SidebarProps {
  characters: Character[];
  activeCharId: string;
  activeGroupRoomId?: string;
  groupRooms?: DynamicGroupRoom[];
  userAffinityMap?: Record<string, number>;
  activeConversationIds: string[];
  chats: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  userProfile: UserProfile | null;
  followedCharIds: string[];
  viewedStoryIds: string[];
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectCharacter: (id: string) => void;
  onSelectGroupRoom?: (roomId: string) => void;
  onDeleteChat?: (charId: string) => void;
  onClearAllChats?: () => void;
  onOpenStory: (charId: string) => void;
  onOpenLockedStory: (char: Character) => void;
  onOpenDiscovery: () => void;
  onOpenSettings: () => void;
  onTriggerStealth: () => void;
  onLock: () => void;
  liveClock: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  appName?: string;
  appSubtitle?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  characters,
  activeCharId,
  activeGroupRoomId = '',
  groupRooms = [],
  userAffinityMap = {},
  activeConversationIds,
  chats,
  unreadCounts,
  userProfile,
  followedCharIds,
  viewedStoryIds,
  onLogout,
  searchQuery,
  onSearchChange,
  onSelectCharacter,
  onSelectGroupRoom,
  onDeleteChat,
  onClearAllChats,
  onOpenStory,
  onOpenLockedStory,
  onOpenDiscovery,
  onOpenSettings,
  onTriggerStealth,
  onLock,
  liveClock,
  isMobileOpen,
  onCloseMobile,
  appName = 'EchoVault',
}) => {
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const displayAppName =
    !appName || appName.toUpperCase() === 'PULSEDIRECT' ? 'EchoVault' : appName;

  // Characters with stories
  const storyChars = characters.filter(c => !!c.storyImg);

  // Filtered active conversations
  const filteredIds = activeConversationIds.filter(id => {
    const char = characters.find(c => c.id === id);
    if (!char) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return char.name.toLowerCase().includes(q) || char.tag.toLowerCase().includes(q);
  });

  // Smooth touch swipe-left gesture to close sidebar drawer on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (deltaX < -55 && isMobileOpen) {
      onCloseMobile();
    }
    touchStartXRef.current = null;
  };

  return (
    <aside
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed md:relative inset-y-0 left-0 w-[85vw] max-w-[320px] md:w-80 lg:w-84 flex-shrink-0 bg-[#0d0f17]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col h-full z-40 transition-transform duration-300 ease-out ${
        isMobileOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Clean Modern App Header */}
      <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-600/25 text-white flex-shrink-0">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent truncate">
            {displayAppName}
          </h1>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onOpenDiscovery}
            title="Browse Characters"
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            title="Settings Hub"
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-purple-300 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onCloseMobile}
            title="Close menu"
            className="md:hidden p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stories Carousel */}
      <div className="px-3.5 py-3 border-b border-white/10 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[11px] font-semibold text-slate-400">
            Stories
          </span>
        </div>
        <div className="flex items-center space-x-3.5 overflow-x-auto no-scrollbar touch-pan-x pb-1 px-0.5">
          {storyChars.map(char => {
            const isFollowed = followedCharIds.includes(char.id);
            const isViewed = viewedStoryIds.includes(char.id);

            return (
              <div
                key={char.id}
                onClick={() => {
                  if (isFollowed) {
                    onOpenStory(char.id);
                  } else {
                    onOpenLockedStory(char);
                  }
                }}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                title={
                  !isFollowed
                    ? `Follow ${char.name} to unlock story`
                    : isViewed
                    ? `Viewed story of ${char.name} (Click to re-watch)`
                    : `View new story from ${char.name}`
                }
              >
                <div
                  className={`relative w-12 h-12 rounded-full p-0.5 transition transform group-hover:scale-105 shadow-md ${
                    !isFollowed
                      ? 'border-2 border-dashed border-amber-400/80 bg-zinc-900 shadow-amber-500/10'
                      : isViewed
                      ? 'bg-zinc-600/90 ring-1 ring-zinc-500/40 shadow-none border border-zinc-600/60'
                      : 'story-gradient shadow-pink-500/15'
                  }`}
                >
                  <img
                    src={resolveAvatarUrl(char.avatarUrl || char.avatar, char.id)}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleAvatarImageError(e, char.name, char.themeAccent)}
                    className={`w-full h-full rounded-full object-cover object-top border-2 border-[#0d0f17] bg-[#161a2b] ${
                      !isFollowed ? 'brightness-75' : isViewed ? 'brightness-90' : ''
                    }`}
                  />
                  {!isFollowed && (
                    <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-zinc-950 shadow-md">
                      <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-300 mt-1 max-w-[56px] truncate font-medium flex items-center justify-center gap-0.5">
                  {!isFollowed && <Lock className="w-2 h-2 text-amber-400" />}
                  <span className={isViewed && isFollowed ? 'text-slate-400' : ''}>
                    {char.name.split(' ')[0]}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#131622]/90 border border-white/10 rounded-2xl pl-9 pr-3.5 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {/* Dynamic Group Rooms Section */}
        {groupRooms.length > 0 && (
          <div className="mb-3 pb-2 border-b border-white/10">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-indigo-400" />
                <span>Group Channels ({groupRooms.filter(r => r.isUnlocked).length}/{groupRooms.length})</span>
              </span>
            </div>
            <div className="space-y-1 mt-1">
              {groupRooms.map(room => {
                const isRoomActive = activeGroupRoomId === room.id;
                const inviterChar = room.unlockedBy ? characters.find(c => c.id === room.unlockedBy) : undefined;
                const thresholdSummary = room.memberIds
                  .map(mid => {
                    const cfg = room.memberConfigs[mid];
                    const ch = characters.find(c => c.id === mid);
                    const cur = userAffinityMap[mid] || 0;
                    return cfg ? `${ch?.name.split(' ')[0] || mid}: ${cur}/${cfg.requiredAffinity}` : null;
                  })
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      if (room.isUnlocked && onSelectGroupRoom) {
                        onSelectGroupRoom(room.id);
                        onCloseMobile();
                      }
                    }}
                    title={
                      room.isUnlocked
                        ? `${room.name} (Invited by ${inviterChar?.name || room.unlockedBy})`
                        : `Locked Group Channel — Reach required affinity with any member to receive an invite: ${thresholdSummary}`
                    }
                    className={`p-2.5 rounded-2xl flex items-center justify-between transition ${
                      !room.isUnlocked
                        ? 'opacity-65 bg-white/[0.02] border border-dashed border-white/10 cursor-not-allowed'
                        : isRoomActive
                        ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-transparent border border-indigo-500/40 shadow-sm cursor-pointer'
                        : 'hover:bg-white/[0.04] border border-transparent cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="relative w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                        {room.isUnlocked ? (
                          <Users className="w-4 h-4 text-indigo-300" />
                        ) : (
                          <Lock className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="text-xs font-semibold text-slate-100 truncate">
                            {room.name}
                          </h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                              room.isUnlocked
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {room.isUnlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {room.isUnlocked
                            ? `Invited by ${inviterChar?.name.split(' ')[0] || room.unlockedBy || 'Member'}`
                            : thresholdSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeConversationIds.length > 0 && (
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold text-slate-400">
              Messages ({activeConversationIds.length})
            </span>
            {onClearAllChats && (
              <div>
                {confirmClearAll ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllChats();
                        setConfirmClearAll(false);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold hover:bg-rose-500/30 transition cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(true)}
                    className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                    title="Clear all conversations"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {filteredIds.map(id => {
          const char = characters.find(c => c.id === id);
          if (!char) return null;

          const history = chats[id] || [];
          const lastMsg = history[history.length - 1];
          const isActive = !activeGroupRoomId && activeCharId === id;

          let preview = 'No messages yet';
          if (lastMsg) {
            preview = (lastMsg.sender === 'user' ? 'You: ' : '') + lastMsg.text;
          }

          return (
            <div
              key={id}
              onClick={() => {
                onSelectCharacter(id);
                onCloseMobile();
              }}
              className={`p-2.5 rounded-2xl cursor-pointer flex items-center justify-between transition group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-transparent border border-purple-500/35 shadow-sm'
                  : 'hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-[#161a2b]">
                  <img
                    src={resolveAvatarUrl(char.avatarUrl || char.avatar, char.id)}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleAvatarImageError(e, char.name, char.themeAccent)}
                    className="w-full h-full rounded-full object-cover object-top group-hover:scale-105 transition"
                  />
                  {char.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0d0f17]"></span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-white' : 'text-slate-100'
                        }`}
                      >
                        {char.name}
                      </h4>
                      <span
                        title={`${(char.userCount || 1200).toLocaleString()} operatives chatted`}
                        className="inline-flex items-center gap-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded-full border border-zinc-700/50 flex-shrink-0"
                      >
                        <Users className="w-2.5 h-2.5 text-purple-400" />
                        <span>{formatCompactNumber(char.userCount || 1200)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {lastMsg?.timestamp && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(lastMsg.timestamp).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      )}
                      {(unreadCounts[id] || 0) > 0 && (
                        <span className="min-w-4 h-4 px-1.5 rounded-full bg-purple-500 text-white font-semibold text-[10px] flex items-center justify-center flex-shrink-0">
                          {unreadCounts[id]}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{preview}</p>
                </div>
              </div>

              {onDeleteChat && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(id);
                  }}
                  title={`Delete chat with ${char.name}`}
                  className="ml-2 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition flex-shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {activeConversationIds.length === 0 && (
          <div className="p-6 text-center text-slate-500 my-8 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto flex items-center justify-center text-slate-400">
              <MessageSquare className="w-5 h-5 text-purple-400/70" />
            </div>
            <p className="text-xs font-semibold text-slate-300">No Active Chats</p>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
              Select a character from the directory to start a conversation.
            </p>
          </div>
        )}

        {activeConversationIds.length > 0 && filteredIds.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-xs">
            No conversations matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* User Status Footer with Safe-Area Inset */}
      <div className="px-3.5 py-3 pb-safe border-t border-white/10 bg-[#090a0f]/80 backdrop-blur-md flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          title="Open Account & Settings Hub"
          className="flex items-center space-x-2.5 min-w-0 text-left hover:opacity-90 transition cursor-pointer"
        >
          {userProfile?.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.codename}
              referrerPolicy="no-referrer"
              onError={(e) => handleAvatarImageError(e, userProfile.codename || 'Operative')}
              className="w-8 h-8 rounded-full border border-purple-500/40 flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border border-purple-500/30 flex-shrink-0 bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">
              {userProfile?.codename ? userProfile.codename[0].toUpperCase() : 'O'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {userProfile ? userProfile.codename : 'Operative_07'}
            </p>
            <p className="text-[10px] text-slate-400 truncate tabular-nums">
              {userProfile?.email || liveClock}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onOpenSettings}
            title="Settings Hub"
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-purple-300 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onTriggerStealth}
            title="Stealth Calculator (Esc x2)"
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
          </button>
          <button
            onClick={onLock}
            title="Lock Session (Ctrl+L)"
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
