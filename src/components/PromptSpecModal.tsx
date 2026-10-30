import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  RotateCcw,
  CheckCircle,
  MessageSquare,
  Zap,
  BookOpen,
  Code2,
  Eye,
  EyeOff,
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
  replaceCharacterMacros,
  getCharacterDefinitionFields,
} from '../utils/responseDirector';

interface PromptSpecModalProps {
  isOpen: boolean;
  character?: Character;
  userCodename?: string;
  onClose: () => void;
  onUpdateCharacterDefinitions?: (
    charId: string,
    updates: {
      system?: string;
      scenario?: string;
      mesExamples?: string;
    }
  ) => void;
}

export const PromptSpecModal: React.FC<PromptSpecModalProps> = ({
  isOpen,
  character,
  userCodename = 'Operative_07',
  onClose,
  onUpdateCharacterDefinitions,
}) => {
  const [directive, setDirective] = useState<CharacterResponseDirective>(DEFAULT_DIRECTIVE);
  const [systemText, setSystemText] = useState('');
  const [scenarioText, setScenarioText] = useState('');
  const [mesExamplesText, setMesExamplesText] = useState('');
  const [showMacroPreview, setShowMacroPreview] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (character && isOpen) {
      const loaded = getCharacterDirective(character.id);
      const { rawScenario, rawMesExamples } = getCharacterDefinitionFields(character, userCodename);
      setDirective(loaded);
      setSystemText(loaded.systemOverride || character.system);
      setScenarioText(rawScenario);
      setMesExamplesText(rawMesExamples);
      setShowMacroPreview(false);
    }
  }, [character, isOpen, userCodename]);

  if (!isOpen || !character) return null;

  const insertTokenIntoScenario = (token: string) => {
    setScenarioText(prev => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}${token}`);
  };

  const insertTokenIntoExamples = (token: string) => {
    setMesExamplesText(prev => {
      if (token === '<START>') {
        return `${prev ? `${prev.trimEnd()}\n` : ''}<START>\n{{user}}: \n{{char}}: `;
      }
      return `${prev}${prev.endsWith(' ') || prev.endsWith('\n') || !prev ? '' : ' '}${token}`;
    });
  };

  const handleSave = () => {
    const targetId = applyToAll ? '__global__' : character.id;
    setCharacterDirective(targetId, {
      mood: directive.mood,
      pacing: directive.pacing,
      customInstruction: directive.customInstruction,
      systemOverride: systemText.trim(),
      scenarioOverride: scenarioText.trim(),
      mesExamplesOverride: mesExamplesText.trim(),
    });

    // Also persist character-specific scenario & mesExamples on the character's directive
    if (applyToAll) {
      setCharacterDirective(character.id, {
        mood: directive.mood,
        pacing: directive.pacing,
        customInstruction: directive.customInstruction,
        systemOverride: systemText.trim(),
        scenarioOverride: scenarioText.trim(),
        mesExamplesOverride: mesExamplesText.trim(),
      });
    }

    if (onUpdateCharacterDefinitions) {
      onUpdateCharacterDefinitions(character.id, {
        system: systemText.trim() || character.system,
        scenario: scenarioText.trim(),
        mesExamples: mesExamplesText.trim(),
      });
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
    setScenarioText(character.scenario || '');
    setMesExamplesText(character.mesExamples || '');
  };

  const resolvedScenarioPreview = replaceCharacterMacros(
    scenarioText,
    character.name,
    userCodename
  );
  const resolvedExamplesPreview = replaceCharacterMacros(
    mesExamplesText,
    character.name,
    userCodename
  );

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
                <span>Character.ai Definition & Director</span>
                <span className="text-[11px] font-mono text-cyan-300 font-normal">
                  · {character.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Configure scenario, &#123;&#123;char&#125;&#125; / &#123;&#123;user&#125;&#125; dialogue examples, and live response behavior
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-white/10 cursor-pointer"
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
              <span>01. Response Mood & Vibe</span>
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
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
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
              <span>02. Texting Style & Pacing</span>
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
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
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

          {/* 3. Character.ai Scenario (scenario) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>03. Scenario & Current Setting (scenario)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => insertTokenIntoScenario('{{char}}')}
                  className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-mono text-purple-300 transition cursor-pointer"
                >
                  + &#123;&#123;char&#125;&#125;
                </button>
                <button
                  type="button"
                  onClick={() => insertTokenIntoScenario('{{user}}')}
                  className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-mono text-cyan-300 transition cursor-pointer"
                >
                  + &#123;&#123;user&#125;&#125;
                </button>
              </div>
            </div>
            <textarea
              value={scenarioText}
              onChange={e => setScenarioText(e.target.value)}
              rows={2}
              placeholder="Describe the current context and circumstances of the conversation using {{char}} and {{user}}..."
              className="w-full bg-[#090b12] border border-white/15 rounded-xl p-3 font-mono text-[11px] text-white leading-relaxed focus:outline-none focus:border-purple-500 transition placeholder:text-slate-600 select-text"
            />
          </div>

          {/* 4. Character.ai Dialogue Examples (mesExamples) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>04. Dialogue Examples (mesExamples)</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertTokenIntoExamples('<START>')}
                  className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-mono text-emerald-300 transition cursor-pointer"
                >
                  + &lt;START&gt;
                </button>
                <button
                  type="button"
                  onClick={() => insertTokenIntoExamples('{{char}}:')}
                  className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-mono text-purple-300 transition cursor-pointer"
                >
                  + &#123;&#123;char&#125;&#125;:
                </button>
                <button
                  type="button"
                  onClick={() => insertTokenIntoExamples('{{user}}:')}
                  className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-mono text-cyan-300 transition cursor-pointer"
                >
                  + &#123;&#123;user&#125;&#125;:
                </button>
                <button
                  type="button"
                  onClick={() => setShowMacroPreview(prev => !prev)}
                  className="px-2.5 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-[10px] font-semibold text-purple-200 flex items-center gap-1 transition cursor-pointer"
                >
                  {showMacroPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showMacroPreview ? 'Hide Preview' : 'Preview Resolved'}</span>
                </button>
              </div>
            </div>
            <textarea
              value={mesExamplesText}
              onChange={e => setMesExamplesText(e.target.value)}
              rows={4}
              placeholder={`<START>\n{{user}}: Hey, what are you up to?\n{{char}}: *glances at the screen* Just taking a breather, {{user}}.`}
              className="w-full bg-[#090b12] border border-white/15 rounded-2xl p-3 font-mono text-[11px] text-slate-200 leading-relaxed focus:outline-none focus:border-purple-500 transition placeholder:text-slate-600 select-text"
            />
            <p className="text-[10px] text-slate-400">
              Variables <code className="text-purple-300 font-mono">&#123;&#123;char&#125;&#125;</code> ({character.name}) and{' '}
              <code className="text-cyan-300 font-mono">&#123;&#123;user&#125;&#125;</code> ({userCodename}) are dynamically replaced and injected into the Gemini system instruction.
            </p>

            {showMacroPreview && (
              <div className="p-3 rounded-2xl bg-[#070910] border border-cyan-500/30 space-y-2 text-[11px]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  Live Macro Replacement Preview (Sent to Gemini API)
                </div>
                {resolvedScenarioPreview && (
                  <div>
                    <span className="text-slate-400 font-semibold">Scenario: </span>
                    <span className="text-slate-200 font-mono">{resolvedScenarioPreview}</span>
                  </div>
                )}
                {resolvedExamplesPreview && (
                  <pre className="text-slate-200 font-mono whitespace-pre-wrap leading-relaxed border-t border-white/10 pt-2">
                    {resolvedExamplesPreview}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* 5. Custom Live Instruction */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>05. Live Roleplay Directive Rule (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Supports &#123;&#123;char&#125;&#125; &amp; &#123;&#123;user&#125;&#125;</span>
            </div>
            <input
              type="text"
              value={directive.customInstruction}
              onChange={e =>
                setDirective(prev => ({ ...prev, customInstruction: e.target.value }))
              }
              placeholder="e.g. {{char}} acts slightly jealous and teases {{user}} about texting late at night..."
              className="w-full bg-[#090b12] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition placeholder:text-slate-600 select-text"
            />
          </div>

          {/* 6. Core Character Persona Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                06. Core Character Persona &amp; Backstory
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
              Apply this Mood &amp; Texting Style to <strong>all characters</strong> globally
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0b0d14] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              {savedToast ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Definitions Updated!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Character Definition</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
