import React from 'react';
import { Lock, UserPlus, X, Sparkles } from 'lucide-react';
import { Character } from '../types';
import { resolveAvatarUrl, handleAvatarImageError } from '../utils/avatarHelper';

interface FollowLockedStoryModalProps {
  isOpen: boolean;
  character: Character | null;
  onClose: () => void;
  onFollowAndUnlock: (charId: string) => void;
}

export const FollowLockedStoryModal: React.FC<FollowLockedStoryModalProps> = ({
  isOpen,
  character,
  onClose,
  onFollowAndUnlock,
}) => {
  if (!isOpen || !character) return null;

  const usernameHandle = character.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  return (
    <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#131622] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Locked Avatar */}
        <div className="relative mt-2">
          <div className="w-20 h-20 rounded-full p-1 border-2 border-dashed border-amber-400/80 shadow-xl shadow-amber-500/10 flex items-center justify-center">
            <img
              src={resolveAvatarUrl(character.avatar, character.id)}
              alt={character.name}
              onError={(e) => handleAvatarImageError(e, character.name, character.themeAccent)}
              className="w-full h-full rounded-full object-cover object-top border-2 border-[#131622] bg-[#161a2b] brightness-75"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 p-2 rounded-full bg-amber-500 text-zinc-950 shadow-lg font-bold">
            <Lock className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        </div>

        {/* Text Details */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            Protected Story
          </span>
          <h3 className="text-base font-bold text-white mt-2">
            Follow {character.name} to View Story
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
            @{usernameHandle} only shares their late-night stories, photos, and updates with approved operatives.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onFollowAndUnlock(character.id)}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Follow @{usernameHandle} & Unlock Story</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono pt-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Unlocks immediate access to all stories & photos</span>
        </div>
      </div>
    </div>
  );
};
