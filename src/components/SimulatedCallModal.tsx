import React, { useEffect } from 'react';
import { MicOff, PhoneOff, Volume2, Video } from 'lucide-react';
import { Character, CallState } from '../types';
import { resolveAvatarUrl, handleAvatarImageError } from '../utils/avatarHelper';

interface SimulatedCallModalProps {
  callState: CallState;
  character?: Character;
  onEndCall: () => void;
}

export const SimulatedCallModal: React.FC<SimulatedCallModalProps> = ({
  callState,
  character,
  onEndCall,
}) => {
  useEffect(() => {
    // Ring tone simulation could be added here
  }, [callState.isOpen]);

  if (!callState.isOpen || !character) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-zinc-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8 select-none">
      {/* Top Details */}
      <div className="flex flex-col items-center mt-12 space-y-4 text-center">
        <div className="relative">
          <div className="w-28 h-28 rounded-full p-1 story-gradient animate-pulse shadow-2xl shadow-purple-600/20">
            <img
              src={resolveAvatarUrl(character.avatarUrl || character.avatar, character.id)}
              alt={character.name}
              referrerPolicy="no-referrer"
              onError={(e) => handleAvatarImageError(e, character.name, character.themeAccent)}
              className="w-full h-full rounded-full object-cover object-top border-2 border-zinc-950 bg-[#1a1e2e]"
            />
          </div>
          {callState.type === 'video' && (
            <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-cyan-500 text-zinc-950 shadow-md">
              <Video className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">{character.name}</h2>
          <p className="text-xs font-mono text-cyan-400 flex items-center justify-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            {callState.statusText}
          </p>
        </div>
      </div>

      {/* Subtitle / Ambient Audio Status */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
        <p className="text-xs text-slate-300 leading-relaxed italic font-mono">
          {callState.subtitle}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-6 mb-8">
        <button
          className="w-14 h-14 rounded-full bg-white/10 text-slate-300 flex items-center justify-center text-lg hover:bg-white/20 transition"
          title="Mute Microphone"
        >
          <MicOff className="w-5 h-5" />
        </button>

        <button
          onClick={onEndCall}
          className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center text-xl hover:bg-rose-500 shadow-xl shadow-rose-600/40 transition transform active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        <button
          className="w-14 h-14 rounded-full bg-white/10 text-slate-300 flex items-center justify-center text-lg hover:bg-white/20 transition"
          title="Speaker"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
