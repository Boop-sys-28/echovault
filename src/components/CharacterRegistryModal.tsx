import React, { useState } from 'react';
import { X, Users, MessageSquare, Music, UserPlus, UserCheck } from 'lucide-react';
import { Character, Universe } from '../types';
import { resolveAvatarUrl, handleAvatarImageError } from '../utils/avatarHelper';

interface CharacterRegistryModalProps {
  isOpen: boolean;
  characters: Character[];
  followedCharIds: string[];
  onToggleFollow: (charId: string) => void;
  onClose: () => void;
  onSelectCharacter: (charId: string) => void;
}

export const CharacterRegistryModal: React.FC<CharacterRegistryModalProps> = ({
  isOpen,
  characters,
  followedCharIds,
  onToggleFollow,
  onClose,
  onSelectCharacter,
}) => {
  const [filter, setFilter] = useState<'all' | 'dc' | 'helluva' | 'anime' | 're'>('all');

  if (!isOpen) return null;

  const isAnimeUniverse = (u: Universe) =>
    ['jujutsu', 'cyberpunk', 'romcom', 'frieren', 'aot', 'csm', 'anime'].includes(u);

  const isDcUniverse = (u: Universe) =>
    u === 'DC Universe' || u === 'dc' || u === 'marvel';

  const isHelluvaUniverse = (u: Universe) =>
    u === 'helluva' || u === 'hellaverse';

  const isReUniverse = (u: Universe) =>
    u === 're' || u === 'resident_evil';

  const filtered = characters.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'dc') return isDcUniverse(c.universe);
    if (filter === 'helluva') return isHelluvaUniverse(c.universe);
    if (filter === 're') return isReUniverse(c.universe);
    if (filter === 'anime') return isAnimeUniverse(c.universe);
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#131622] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Operative & Character Registry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any DC hero, anime icon, HelluvaVerse operative, or tactical agent to start a fresh chat.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 py-3 border-b border-white/10 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              filter === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            All Characters ({characters.length})
          </button>
          <button
            onClick={() => setFilter('dc')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              filter === 'dc'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            DC & Comics ({characters.filter(c => isDcUniverse(c.universe)).length})
          </button>
          <button
            onClick={() => setFilter('anime')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              filter === 'anime'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            Anime & Manga ({characters.filter(c => isAnimeUniverse(c.universe)).length})
          </button>
          <button
            onClick={() => setFilter('helluva')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              filter === 'helluva'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            HelluvaVerse ({characters.filter(c => isHelluvaUniverse(c.universe)).length})
          </button>
          <button
            onClick={() => setFilter('re')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              filter === 're'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            Resident Evil ({characters.filter(c => isReUniverse(c.universe)).length})
          </button>
        </div>

        {/* Character Grid */}
        <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
          {filtered.map(char => (
            <div
              key={char.id}
              className="p-3 bg-[#0d0f17] border border-white/5 rounded-2xl flex items-center justify-between hover:border-purple-500/40 hover:bg-[#151928] transition group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-[#161a2b]">
                  <img
                    src={resolveAvatarUrl(char.avatar, char.id)}
                    alt={char.name}
                    onError={(e) => handleAvatarImageError(e, char.name, char.themeAccent)}
                    className="w-full h-full rounded-full object-cover object-top group-hover:scale-105 transition"
                  />
                  {char.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black"></span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white truncate">{char.name}</h4>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                      {char.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{char.status}</p>
                  <p className="text-[10px] text-pink-400 font-mono truncate flex items-center gap-1 mt-0.5">
                    <Music className="w-2.5 h-2.5" />
                    <span>{char.song}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleFollow(char.id)}
                  title={followedCharIds.includes(char.id) ? 'Unfollow' : 'Follow to unlock stories'}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1 transition ${
                    followedCharIds.includes(char.id)
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {followedCharIds.includes(char.id) ? (
                    <>
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span className="hidden sm:inline">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
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
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs text-white font-semibold rounded-xl flex items-center gap-1 shadow-md shadow-purple-600/20 transition"
                >
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
