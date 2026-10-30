import React, { useState } from 'react';
import { X, Users, MessageSquare, UserPlus, UserCheck, Search } from 'lucide-react';
import { Character, Universe } from '../types';
import { resolveAvatarUrl, handleAvatarImageError, formatCompactNumber } from '../utils/avatarHelper';

interface CharacterRegistryModalProps {
  isOpen: boolean;
  characters: Character[];
  followedCharIds: string[];
  onToggleFollow: (charId: string) => void;
  onClose: () => void;
  onSelectCharacter: (charId: string) => void;
}

type CategoryFilter =
  | 'all'
  | 'motorsport'
  | 'music'
  | 'statesmen'
  | 'anime'
  | 'helluva'
  | 'dc'
  | 'gaming'
  | 're';

export const CharacterRegistryModal: React.FC<CharacterRegistryModalProps> = ({
  isOpen,
  characters,
  followedCharIds,
  onToggleFollow,
  onClose,
  onSelectCharacter,
}) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const isAnimeUniverse = (u: Universe) =>
    ['jujutsu', 'cyberpunk', 'romcom', 'frieren', 'aot', 'csm', 'anime', 'Anime & Manga'].includes(u);

  const isDcUniverse = (u: Universe) =>
    ['DC Universe', 'DC & Comics', 'dc', 'marvel'].includes(u);

  const isHelluvaUniverse = (u: Universe) =>
    ['helluva', 'hellaverse', 'HelluvaVerse'].includes(u);

  const isGamingUniverse = (u: Universe) =>
    ['Gaming Legends', 'scifi', 'fantasy', 're', 'resident_evil'].includes(u);

  const isReUniverse = (u: Universe, id?: string) =>
    ['re', 'resident_evil'].includes(u) ||
    ['leon', 'ada', 'jill', 'claire-redfield', 'chris-redfield', 'albert-wesker'].includes(id || '');

  const isMotorsportUniverse = (u: Universe) =>
    ['Motorsport', 'motorsport', 'Top Gear', 'Automotive Icons', 'Formula 1'].includes(u);

  const isMusicUniverse = (u: Universe) =>
    ['Music Legends', 'Retro Icons', 'music', 'Music'].includes(u);

  const isStatesmenUniverse = (u: Universe) =>
    [
      'Statesmen & Strategists',
      'Statesmen & Global Leaders',
      'Global Leaders',
      'Statesmen',
    ].includes(u);

  const filtered = characters.filter(c => {
    const matchesCategory =
      filter === 'all'
        ? true
        : filter === 'motorsport'
        ? isMotorsportUniverse(c.universe)
        : filter === 'music'
        ? isMusicUniverse(c.universe)
        : filter === 'statesmen'
        ? isStatesmenUniverse(c.universe)
        : filter === 'anime'
        ? isAnimeUniverse(c.universe)
        : filter === 'helluva'
        ? isHelluvaUniverse(c.universe)
        : filter === 'dc'
        ? isDcUniverse(c.universe)
        : filter === 'gaming'
        ? isGamingUniverse(c.universe)
        : filter === 're'
        ? isReUniverse(c.universe, c.id)
        : true;

    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.codename || '').toLowerCase().includes(q) ||
      (c.bio || '').toLowerCase().includes(q) ||
      (c.role || c.tag || '').toLowerCase().includes(q) ||
      (c.tagline || c.status || '').toLowerCase().includes(q) ||
      String(c.universe).toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 select-none">
      <div className="w-[95vw] max-w-5xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-[#131622] border border-white/10 p-4 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">Operative & Character Registry</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Browse {characters.length} characters across Motorsport, Music Legends, Statesmen & Strategists, Anime, HelluvaVerse, DC, and Gaming.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close character registry"
            className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-white/5 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="pt-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search operatives by name, codename, role, or category..."
              className="w-full bg-[#0d0f17] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 touch-pan-x pb-1 px-1 w-full">
            {[
              { id: 'all' as CategoryFilter, label: 'All Characters', count: characters.length },
              {
                id: 'motorsport' as CategoryFilter,
                label: 'Motorsport',
                count: characters.filter(c => isMotorsportUniverse(c.universe)).length,
              },
              {
                id: 'music' as CategoryFilter,
                label: 'Music Legends',
                count: characters.filter(c => isMusicUniverse(c.universe)).length,
              },
              {
                id: 'statesmen' as CategoryFilter,
                label: 'Statesmen & Strategists',
                count: characters.filter(c => isStatesmenUniverse(c.universe)).length,
              },
              {
                id: 'anime' as CategoryFilter,
                label: 'Anime & Manga',
                count: characters.filter(c => isAnimeUniverse(c.universe)).length,
              },
              {
                id: 'helluva' as CategoryFilter,
                label: 'HelluvaVerse',
                count: characters.filter(c => isHelluvaUniverse(c.universe)).length,
              },
              {
                id: 'dc' as CategoryFilter,
                label: 'DC & Comics',
                count: characters.filter(c => isDcUniverse(c.universe)).length,
              },
              {
                id: 'gaming' as CategoryFilter,
                label: 'Gaming Legends',
                count: characters.filter(c => isGamingUniverse(c.universe)).length,
              },
              {
                id: 're' as CategoryFilter,
                label: 'Resident Evil',
                count: characters.filter(c => isReUniverse(c.universe, c.id)).length,
              },
            ].map(tab => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                      : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none font-semibold ${
                      isActive
                        ? 'bg-purple-700/70 text-purple-100'
                        : 'bg-zinc-900/80 text-zinc-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Character Grid */}
        <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
          {filtered.map(char => (
            <div
              key={char.id}
              className="p-3.5 bg-[#0d0f17] border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/40 hover:bg-[#151928] transition group min-w-0"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                {/* Left Column: Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={resolveAvatarUrl(char.avatarUrl || char.avatar, char.id)}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => handleAvatarImageError(e, char.name, char.themeAccent)}
                    className="w-12 h-12 rounded-full shrink-0 object-cover object-top ring-2 ring-purple-500/30 bg-[#161a2b] group-hover:scale-105 transition"
                  />
                  {char.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black"></span>
                  )}
                </div>

                {/* Middle Column: Stacked Info */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">
                      {char.name}
                    </h4>
                    {char.codename && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 shrink-0">
                        {char.codename}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1 min-w-0">
                    <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 max-w-full truncate">
                      {char.role || char.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50 shrink-0">
                      <Users className="w-3 h-3 text-purple-400" />
                      {formatCompactNumber(char.userCount || 1200)} chats
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate block mt-0.5">
                    {char.bio || char.tagline || char.status}
                  </p>
                  {char.scenario && (
                    <p
                      className="text-[11px] text-purple-300/80 truncate block mt-0.5"
                      title={char.scenario.replace(/\{\{char\}\}/gi, char.name).replace(/\{\{user\}\}/gi, 'You')}
                    >
                      <span className="text-purple-400 font-semibold">Scenario:</span>{' '}
                      {char.scenario.replace(/\{\{char\}\}/gi, char.name).replace(/\{\{user\}\}/gi, 'You')}
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-500 truncate block mt-0.5 flex items-center gap-1">
                    <span className="shrink-0">🎵</span>
                    <span className="truncate">{char.song}</span>
                  </p>
                </div>
              </div>

              {/* Right Column: Action Buttons (stacks cleanly on narrow screens, side-by-side on wider viewports) */}
              <div className="shrink-0 flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                <button
                  type="button"
                  onClick={() => onToggleFollow(char.id)}
                  title={followedCharIds.includes(char.id) ? 'Unfollow' : 'Follow to unlock stories'}
                  className={`flex-1 sm:flex-initial justify-center px-2.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1 transition cursor-pointer ${
                    followedCharIds.includes(char.id)
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {followedCharIds.includes(char.id) ? (
                    <>
                      <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3 shrink-0" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCharacter(char.id);
                    onClose();
                  }}
                  className="flex-1 sm:flex-initial justify-center px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs text-white font-semibold rounded-xl flex items-center gap-1 shadow-md shadow-purple-600/20 transition cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  <span>Chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

