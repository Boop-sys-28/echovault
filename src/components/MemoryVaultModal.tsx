import React, { useState } from 'react';
import { Brain, X, Plus, Trash2, Sparkles, Check, BookmarkCheck } from 'lucide-react';
import { Character } from '../types';

interface MemoryVaultModalProps {
  character: Character;
  memories: string[];
  onAddMemory: (fact: string) => void;
  onRemoveMemory: (index: number) => void;
  onClearMemories: () => void;
  onClose: () => void;
}

export const MemoryVaultModal: React.FC<MemoryVaultModalProps> = ({
  character,
  memories,
  onAddMemory,
  onRemoveMemory,
  onClearMemories,
  onClose,
}) => {
  const [newFact, setNewFact] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddMemory(newFact.trim());
    setNewFact('');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-[#0d0f17]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#131622]/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{character.name}'s Memory Vault</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Active episodic memories & facts {character.name} remembers about you
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Add custom fact form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Teach or Remind {character.name} Something New:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder={`e.g. "My favorite food is sweet matcha crepe" or "I practice Jujutsu"`}
                className="flex-1 bg-[#131622] border border-white/10 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                disabled={!newFact.trim()}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-purple-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
            {justAdded && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Memory stored in {character.name}'s neural bank!</span>
              </p>
            )}
          </form>

          {/* Active Memory List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-purple-400" />
                <span>Stored Memories ({memories.length} / 75)</span>
              </span>
              {memories.length > 0 && (
                <button
                  type="button"
                  onClick={onClearMemories}
                  className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {memories.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white/5 border border-white/5 text-slate-400 text-xs">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
                <p className="font-semibold text-slate-300">No specific facts recorded yet.</p>
                <p className="text-[11px] mt-1 text-slate-500 max-w-xs mx-auto">
                  As you chat with {character.name}, they will automatically note down your preferences, hobbies, sleep habits, and secrets!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {memories.map((fact, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-2xl bg-[#161a2b] border border-white/5 hover:border-purple-500/30 transition flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{fact}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveMemory(index)}
                      title="Forget this memory"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 transition flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-purple-400" />
            <span>
              {character.name} recalls these facts in ongoing chats, away check-ins, and smart dialogue responses!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#090a0f] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
