import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { Character } from '../types';

interface StoryViewerModalProps {
  isOpen: boolean;
  character: Character | null;
  onClose: () => void;
  onReply: (text: string) => void;
  onMarkViewed?: (charId: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  character,
  onClose,
  onReply,
  onMarkViewed,
}) => {
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen || !character?.id) {
      setProgress(0);
      setReplyText('');
      return;
    }

    if (onMarkViewed) {
      onMarkViewed(character.id);
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isOpen, character?.id, onMarkViewed]);

  if (!isOpen || !character || !character.storyImg) return null;

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;
    onReply(replyText.trim());
    setReplyText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-md h-[86vh] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Progress Bar */}
        <div className="absolute top-3 inset-x-4 z-20 flex gap-1.5">
          <div className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Story Header */}
        <div className="absolute top-6 inset-x-4 z-20 flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center space-x-2.5">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-9 h-9 rounded-full object-cover object-top border border-white/40 shadow-sm bg-[#1a1e2e]"
            />
            <div>
              <h4 className="text-xs font-bold leading-tight drop-shadow">{character.name}</h4>
              <span className="text-[10px] text-zinc-300 font-mono drop-shadow">
                {character.storyTime || 'Just now'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center transition border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Background */}
        <div className="relative flex-1 w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
          <img
            src={character.storyImg}
            alt="Story Media"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40"></div>

          <div className="absolute bottom-16 inset-x-6 text-white text-center">
            <p className="text-sm font-medium leading-relaxed drop-shadow-md bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              "{character.storyText}"
            </p>
          </div>
        </div>

        {/* Reply Bar */}
        <form onSubmit={handleSendReply} className="p-3 bg-zinc-950 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            placeholder="Reply to story..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500 transition"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center text-xs transition shadow-md shadow-purple-600/30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
