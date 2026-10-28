import React, { useState } from 'react';
import {
  Link2,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Brain,
  PlusCircle,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Character, Message, CaiImportResult } from '../types';
import { resolveCaiLink, CAI_LINK_PRESETS, CaiLinkPreset } from '../utils/caiImporter';
import { handleAvatarImageError } from '../utils/avatarHelper';

interface CaiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  activeCharId: string;
  userCodename: string;
  onImportComplete: (
    targetCharId: string,
    newCharacter: Character | null,
    messages: Message[],
    replaceExisting: boolean,
    extractedFacts: string[]
  ) => void;
}

export const CaiImportModal: React.FC<CaiImportModalProps> = ({
  isOpen,
  onClose,
  characters,
  activeCharId,
  userCodename,
  onImportComplete,
}) => {
  const [linkInput, setLinkInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>(activeCharId || 'gojo');
  const [isNewChar, setIsNewChar] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharTag, setNewCharTag] = useState('C.AI LINKED');
  const [replaceExisting, setReplaceExisting] = useState(false);

  const [parseResult, setParseResult] = useState<CaiImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResolveLink = (urlToResolve: string) => {
    setErrorMsg(null);
    setParseResult(null);
    try {
      const res = resolveCaiLink(urlToResolve, userCodename);
      setParseResult(res);

      // Auto-match existing character if possible
      const matchedChar = characters.find(
        c =>
          c.name.toLowerCase().includes(res.charName.toLowerCase()) ||
          res.charName.toLowerCase().includes(c.name.toLowerCase())
      );

      if (matchedChar) {
        setSelectedTarget(matchedChar.id);
        setIsNewChar(false);
      } else {
        setIsNewChar(true);
        setNewCharName(res.charName);
        if (res.charTag) setNewCharTag(res.charTag);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resolve Character.AI link. Please check the URL.');
    }
  };

  const handleSelectPreset = (preset: CaiLinkPreset) => {
    setLinkInput(preset.url);
    handleResolveLink(preset.url);
  };

  const handleSubmitImport = () => {
    if (!parseResult || parseResult.messages.length === 0) return;

    let customChar: Character | null = null;
    let finalCharId = selectedTarget;

    if (isNewChar) {
      const generatedId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      finalCharId = generatedId;
      customChar = {
        id: generatedId,
        name: newCharName.trim() || parseResult.charName || 'Custom C.AI',
        tag: newCharTag.trim() || 'C.AI LINKED',
        universe: 'anime',
        avatar: parseResult.charAvatar || '/avatars/gojo.png',
        storyImg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        storyText: 'Connected via Character.AI Direct Link ✨',
        storyTime: 'Just now',
        song: 'C.AI Synthwave Lofi',
        status: 'Synced from Character.AI link',
        system:
          parseResult.charSystem ||
          `You are ${newCharName.trim() || parseResult.charName}. Continue chatting with the user based on your synced Character.AI memories.`,
        online: true,
      };
    }

    onImportComplete(
      finalCharId,
      customChar,
      parseResult.messages,
      replaceExisting,
      parseResult.factsExtracted
    );

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0f111a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-zinc-900 to-purple-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Character.AI Direct Link Sync
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  URL / Share Link
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Paste any Character.AI character link or share URL to sync chats & memories directly
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

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Direct URL Input Bar */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Character.AI Chat or Profile Link</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={linkInput}
                  onChange={e => {
                    setLinkInput(e.target.value);
                    if (e.target.value.trim().length > 6) {
                      handleResolveLink(e.target.value);
                    } else {
                      setParseResult(null);
                      setErrorMsg(null);
                    }
                  }}
                  placeholder="https://character.ai/chat/... or c.ai/c/..."
                  className="w-full bg-[#090b12] border border-white/15 rounded-2xl pl-10 pr-3 py-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 transition placeholder:text-slate-600"
                />
              </div>
              <button
                type="button"
                onClick={() => handleResolveLink(linkInput)}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition shadow-md shadow-cyan-500/20 flex items-center gap-1.5 flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Connect Link</span>
              </button>
            </div>
          </div>

          {/* Quick-Select Character.AI Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick-Connect Character.AI Links
              </span>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Link Sync</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CAI_LINK_PRESETS.map(preset => {
                const isCurrent = linkInput === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                      isCurrent
                        ? 'bg-blue-600/20 border-cyan-400 text-white shadow-sm'
                        : 'bg-[#131624] border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <img
                      src={preset.avatar}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleAvatarImageError(e, preset.name)}
                      className="w-7 h-7 rounded-full object-cover object-top border border-white/15 flex-shrink-0 bg-zinc-900"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate leading-tight">{preset.name}</p>
                      <p className="text-[9px] text-cyan-400 font-mono truncate flex items-center gap-0.5">
                        <ExternalLink className="w-2.5 h-2.5 inline" /> c.ai/chat
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resolved Link Preview */}
          {parseResult && (
            <div className="bg-[#131625] border border-cyan-500/30 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Link Connected: {parseResult.messages.length} synced messages ready
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">
                  Character: {parseResult.charName}
                </span>
              </div>

              {/* Character Destination & Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Sync Into Character:
                  </label>
                  <select
                    value={isNewChar ? '__new__' : selectedTarget}
                    onChange={e => {
                      if (e.target.value === '__new__') {
                        setIsNewChar(true);
                        setNewCharName(parseResult.charName);
                      } else {
                        setIsNewChar(false);
                        setSelectedTarget(e.target.value);
                      }
                    }}
                    className="w-full bg-[#090b12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <optgroup label="Existing Characters">
                      {characters.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.tag})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Custom Character">
                      <option value="__new__">+ Create New Character from Link</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Sync Mode:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReplaceExisting(false)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                        !replaceExisting
                          ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500/50'
                          : 'bg-[#090b12] text-slate-400 border-white/10'
                      }`}
                    >
                      Append to Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplaceExisting(true)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                        replaceExisting
                          ? 'bg-rose-600/30 text-rose-200 border-rose-500/50'
                          : 'bg-[#090b12] text-slate-400 border-white/10'
                      }`}
                    >
                      Replace Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* If New Character Selected */}
              {isNewChar && (
                <div className="p-3 bg-[#0a0c14] border border-purple-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-purple-300 font-bold">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Linked Character Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Character Name"
                      value={newCharName}
                      onChange={e => setNewCharName(e.target.value)}
                      className="bg-[#131622] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Title or Tag"
                      value={newCharTag}
                      onChange={e => setNewCharTag(e.target.value)}
                      className="bg-[#131622] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Extracted Memory Highlights */}
              {parseResult.factsExtracted.length > 0 && (
                <div className="p-3 bg-[#0a0c14] border border-cyan-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Brain className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-bold text-cyan-300">
                      {parseResult.factsExtracted.length} Episodic Memories Synced from Link:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {parseResult.factsExtracted.map((fact, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 font-mono"
                      >
                        {fact}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Preview */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Synced Chat Preview:
                </label>
                <div className="space-y-1.5 max-h-28 overflow-y-auto p-2.5 bg-[#090b12] rounded-xl border border-white/5">
                  {parseResult.messages.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="text-[11px] flex gap-2">
                      <span
                        className={`font-bold flex-shrink-0 ${
                          m.sender === 'user' ? 'text-purple-400' : 'text-cyan-400'
                        }`}
                      >
                        {m.sender === 'user' ? userCodename : parseResult.charName}:
                      </span>
                      <span className="text-slate-300 truncate">{m.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0c0d14] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!parseResult || isSuccess}
            onClick={handleSubmitImport}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg ${
              parseResult && !isSuccess
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-600/30'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300 animate-bounce" />
                <span>Link Synced!</span>
              </>
            ) : (
              <>
                <span>Sync Character.AI Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
