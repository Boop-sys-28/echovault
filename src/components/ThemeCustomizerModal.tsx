import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  X,
  Type,
  Layout,
  Eye,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { AppThemeConfig, ThemeId, BubbleStyle, Character } from '../types';
import { THEME_DEFINITIONS, DEFAULT_THEME_CONFIG } from '../data/themes';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AppThemeConfig;
  onSaveConfig: (newConfig: AppThemeConfig) => void;
  characters: Character[];
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  characters,
}) => {
  const [config, setConfig] = useState<AppThemeConfig>(currentConfig);
  const [appliedNotice, setAppliedNotice] = useState(false);

  if (!isOpen) return null;

  const activeThemeDef = THEME_DEFINITIONS[config.themeId] || THEME_DEFINITIONS.cyberpunk;
  const previewChar = characters.find(c => c.id === 'gojo') || characters[0];

  const handleApply = () => {
    onSaveConfig(config);
    setAppliedNotice(true);
    setTimeout(() => {
      setAppliedNotice(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setConfig(DEFAULT_THEME_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-5">
      <div className="w-full max-w-4xl bg-[#0f111a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-[#131624]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                UI & Theme Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Live Customizer
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Personalize the app branding, color theme, message bubble style, and preview in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Content: Left Controls + Right Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Controls (7 cols) */}
          <div className="lg:col-span-7 p-4 md:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto">
            {/* App Name & Branding */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-cyan-400" />
                  <span>App Name & Title Branding</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Displayed in sidebar & header</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">
                    App Title (or Custom Alias)
                  </label>
                  <input
                    type="text"
                    value={config.appName}
                    onChange={e => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                    placeholder="e.g. EchoVault"
                    className="w-full bg-[#0a0c13] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Select Color Theme</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.values(THEME_DEFINITIONS).map(theme => {
                  const isSelected = config.themeId === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => setConfig(prev => ({ ...prev, themeId: theme.id }))}
                      className={`p-3 rounded-2xl cursor-pointer border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#181c2c] border-purple-500 shadow-md shadow-purple-900/20'
                          : 'bg-[#121420] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full ${theme.palette.storyRing}`}></span>
                          <h4 className="text-xs font-bold text-white">{theme.name}</h4>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                        {theme.description}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300 font-mono">
                          {theme.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bubble Style Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-pink-400" />
                <span>Message Bubble Styling</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'modern_gradient' as BubbleStyle,
                    label: 'Modern Gradient',
                    sub: 'Vibrant rounded glow',
                  },
                  {
                    id: 'cai_clean' as BubbleStyle,
                    label: 'C.AI Clean Card',
                    sub: 'Charcoal square cards',
                  },
                  {
                    id: 'terminal_monospace' as BubbleStyle,
                    label: 'Matrix Terminal',
                    sub: 'Monospace tech brackets',
                  },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, bubbleStyle: opt.id }))}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      config.bubbleStyle === opt.id
                        ? 'bg-purple-600/25 border-purple-500 text-purple-200'
                        : 'bg-[#0f111a] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[9px] opacity-75 mt-0.5 font-mono">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Font Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Chat Typography Size
                </label>
                <span className="text-[10px] text-slate-400 font-mono capitalize">
                  {config.chatFontSize}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['sm', 'base', 'lg'] as const).map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, chatFontSize: sz }))}
                    className={`py-2 rounded-xl border text-center text-xs font-semibold transition ${
                      config.chatFontSize === sz
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-[#0f111a] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz === 'sm' ? 'Compact (13px)' : sz === 'base' ? 'Standard (14px)' : 'Comfortable (16px)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive UI Preview (5 cols) */}
          <div className="lg:col-span-5 p-4 md:p-6 bg-[#07090f] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  <Eye className="w-4 h-4" />
                  <span>Real-Time UI Preview</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono">
                  Live View
                </span>
              </div>

              {/* Mockup Device Frame */}
              <div className="w-full rounded-2xl border border-white/15 overflow-hidden shadow-2xl bg-[#090b12] flex flex-col">
                {/* Mockup Header */}
                <div className={`p-3 border-b ${activeThemeDef.palette.border} ${activeThemeDef.palette.bgSidebar} flex items-center justify-between`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${activeThemeDef.palette.accent} flex items-center justify-center text-white text-[10px] font-black`}>
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white leading-tight">
                        {config.appName || 'EchoVault'}
                      </h4>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>

                {/* Mockup Story Row */}
                <div className="p-2 border-b border-white/5 bg-black/30 flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full p-0.5 ${activeThemeDef.palette.storyRing} flex-shrink-0`}>
                    <img
                      src={previewChar.avatar}
                      alt={previewChar.name}
                      className="w-full h-full rounded-full object-cover object-top border border-black bg-zinc-900"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white leading-tight">{previewChar.name}</p>
                    <p className="text-[8px] text-slate-400 font-mono truncate">{previewChar.tag}</p>
                  </div>
                </div>

                {/* Mockup Chat Body */}
                <div className={`p-3 space-y-2.5 min-h-[220px] ${activeThemeDef.palette.bgChat} flex flex-col justify-end`}>
                  {/* Incoming Character Message */}
                  <div className="flex items-start gap-1.5 max-w-[88%]">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-white/10 mt-1">
                      <img
                        src={previewChar.avatar}
                        alt=""
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div
                      className={`p-2.5 text-xs leading-relaxed ${activeThemeDef.palette.bubbleChar} ${activeThemeDef.palette.textChar} ${
                        config.bubbleStyle === 'modern_gradient'
                          ? 'rounded-2xl rounded-tl-sm'
                          : config.bubbleStyle === 'cai_clean'
                          ? 'rounded-xl'
                          : 'rounded-md font-mono'
                      }`}
                    >
                      {config.bubbleStyle === 'terminal_monospace' && (
                        <span className="text-[9px] text-emerald-400 block opacity-75">&gt; TRANSMISSION:</span>
                      )}
                      <span>
                        Hey! The new {config.appName} styling looks super crisp. Can you see how clean these bubbles render? ✨
                      </span>
                    </div>
                  </div>

                  {/* Outgoing User Message */}
                  <div className="flex flex-col items-end self-end max-w-[85%]">
                    <div
                      className={`p-2.5 text-xs leading-relaxed ${activeThemeDef.palette.bubbleUser} ${activeThemeDef.palette.textUser} ${
                        config.bubbleStyle === 'modern_gradient'
                          ? 'rounded-2xl rounded-tr-sm'
                          : config.bubbleStyle === 'cai_clean'
                          ? 'rounded-xl'
                          : 'rounded-md font-mono'
                      }`}
                    >
                      {config.bubbleStyle === 'terminal_monospace' && (
                        <span className="text-[9px] text-emerald-300 block opacity-75">&gt; USER_SEND:</span>
                      )}
                      <span>
                        Yeah! The preview is updating in real time. Love this {activeThemeDef.name} look! 🚀
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono mt-0.5">Just now</span>
                  </div>
                </div>

                {/* Mockup Input Field */}
                <div className="p-2 border-t border-white/10 bg-black/40 flex items-center gap-1.5">
                  <div className="flex-1 bg-[#121420] border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-slate-500 font-mono">
                    Type a message to {previewChar.name}...
                  </div>
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${activeThemeDef.palette.accent} flex items-center justify-center text-white text-[10px]`}>
                    ➤
                  </div>
                </div>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Theme: {activeThemeDef.name}</span>
              <span>Style: {config.bubbleStyle}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0c0d14] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
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
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 transition shadow-lg shadow-purple-600/30"
            >
              {appliedNotice ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Theme to App</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
