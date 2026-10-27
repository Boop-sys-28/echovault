import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  RotateCcw,
  CheckCircle,
  MessageSquare,
  Zap,
} from 'lucide-react';
import {
  Character,
  CharacterResponseDirective,
  ResponseMood,
  ResponsePacing,
} from '../types';
import {
  MOOD_LABELS,
  PACING_LABELS,
  getCharacterDirective,
  setCharacterDirective,
  clearCharacterDirective,
  DEFAULT_DIRECTIVE,
} from '../utils/responseDirector';

interface PromptSpecModalProps {
  isOpen: boolean;
  character?: Character;
  onClose: () => void;
  onUpdateCharacterSystem?: (charId: string, newSystem: string) => void;
}

export const PromptSpecModal: React.FC<PromptSpecModalProps> = ({
  isOpen,
  character,
  onClose,
  onUpdateCharacterSystem,
}) => {
  const [directive, setDirective] = useState<CharacterResponseDirective>(DEFAULT_DIRECTIVE);
  const [systemText, setSystemText] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (character && isOpen) {
      const loaded = getCharacterDirective(character.id);
      setDirective(loaded);
      setSystemText(loaded.systemOverride || character.system);
    }
  }, [character, isOpen]);

  if (!isOpen || !character) return null;

  const handleSave = () => {
    const targetId = applyToAll ? '__global__' : character.id;
    setCharacterDirective(targetId, {
      mood: directive.mood,
      pacing: directive.pacing,
      customInstruction: directive.customInstruction,
      systemOverride: systemText.trim(),
    });

    if (onUpdateCharacterSystem && systemText.trim()) {
      onUpdateCharacterSystem(character.id, systemText.trim());
    }

    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    clearCharacterDirective(character.id);
    setDirective(DEFAULT_DIRECTIVE);
    setSystemText(character.system);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-5 select-none">
      <div className="w-full max-w-2xl bg-[#10131f]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-[#151828]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-600/30 flex-shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-bold text-white truncate flex items-center gap-2">
                <span>Response Behavior Director</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {character.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Customize how {character.name} responds to your text messages in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Mood / Vibe Override */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>1. Response Mood & Vibe</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(MOOD_LABELS) as ResponseMood[]).map(moodKey => {
                const info = MOOD_LABELS[moodKey];
                const isSelected = directive.mood === moodKey;
                return (
                  <button
                    key={moodKey}
                    type="button"
                    onClick={() => setDirective(prev => ({ ...prev, mood: moodKey }))}
                    className={`p-2.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-purple-600/25 border-purple-400 text-white shadow-md shadow-purple-900/20'
                        : 'bg-[#0b0d15] border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{info.label}</span>
                    </div>
                    <p className="text-[10px] opacity-75 mt-0.5 line-clamp-2 leading-snug">
                      {info.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Texting Style & Pacing */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Texting Style & Pacing</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PACING_LABELS) as ResponsePacing[]).map(pacingKey => {
                const info = PACING_LABELS[pacingKey];
                const isSelected = directive.pacing === pacingKey;
                return (
                  <button
                    key={pacingKey}
                    type="button"
                    onClick={() => setDirective(prev => ({ ...prev, pacing: pacingKey }))}
                    className={`p-2.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-900/20'
                        : 'bg-[#0b0d15] border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{info.label}</div>
                    <p className="text-[10px] opacity-75 mt-0.5 leading-snug">{info.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Custom Live Instruction */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Live Behavior Rule (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Instant override</span>
            </div>
            <input
              type="text"
              value={directive.customInstruction}
              onChange={e =>
                setDirective(prev => ({ ...prev, customInstruction: e.target.value }))
              }
              placeholder={`e.g. Act slightly jealous, call me by a nickname, or ask about my night...`}
              className="w-full bg-[#090b12] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition placeholder:text-slate-600 select-text"
            />
          </div>

          {/* 4. Core Character Persona Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                4. Core Character Persona & Backstory
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Editable</span>
            </div>
            <textarea
              value={systemText}
              onChange={e => setSystemText(e.target.value)}
              rows={4}
              className="w-full bg-[#090a0f] border border-white/10 rounded-2xl p-3 font-mono text-[11px] text-slate-300 leading-relaxed focus:outline-none focus:border-purple-500 transition select-text"
            />
          </div>

          {/* Global Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={e => setApplyToAll(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-500"
            />
            <span className="text-xs text-slate-300">
              Apply this Mood & Texting Style to <strong>all characters</strong> globally
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0b0d14] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition"
            >
              {savedToast ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Behavior Updated!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Response Behavior</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
