import React, { useState } from 'react';
import { RelationshipScoreBreakdown } from '../types';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  characterId: string;
  scoreData: RelationshipScoreBreakdown;
  onImportTranscript: (text: string) => void;
  requiredGroupAffinity?: number;
}

export const ScoreBreakdownModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  characterName,
  scoreData,
  onImportTranscript,
  requiredGroupAffinity = 30,
}) => {
  const [transcriptText, setTranscriptText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-zinc-100">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-white">{characterName} // Status & Score</h3>
            <p className="text-xs text-zinc-400">Relationship Diagnostics & Metrics</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl cursor-pointer">✕</button>
        </div>

        {/* Live Score Display */}
        <div className="my-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-medium text-zinc-300">Affinity Score</span>
            <span className={`text-2xl font-black ${scoreData.affinity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {scoreData.affinity > 0 ? `+${scoreData.affinity}` : scoreData.affinity}
            </span>
          </div>

          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Current Tier: <strong className="text-indigo-400">{scoreData.tier}</strong></span>
            <span>Threshold for Group: <strong>{scoreData.affinity}/{requiredGroupAffinity}</strong></span>
          </div>

          {/* Meter Bar */}
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-500 ${scoreData.affinity >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, (scoreData.affinity + 50)))}%` }}
            />
          </div>

          {/* Trigger Diagnostics & Last Analysis Summary */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Positive Triggers: <strong className="text-emerald-400">{scoreData.positiveTriggersCount}</strong></span>
            <span>Negative Triggers: <strong className="text-rose-400">{scoreData.negativeTriggersCount}</strong></span>
          </div>

          {scoreData.importedHistorySummary && (
            <div className="mt-2.5 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-300">
              <span className="text-indigo-400 font-semibold block">Last Transcript Analysis:</span>
              <span>{scoreData.importedHistorySummary}</span>
              {scoreData.lastAnalysisTimestamp && (
                <span className="block text-[10px] text-zinc-500 mt-0.5">{scoreData.lastAnalysisTimestamp}</span>
              )}
            </div>
          )}
        </div>

        {/* Import C.AI Chat Accordion */}
        <div className="mb-4">
          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="w-full text-left text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-1 flex items-center justify-between cursor-pointer"
          >
            <span>📥 Import Character.AI Past Conversation</span>
            <span>{showImportBox ? '▲' : '▼'}</span>
          </button>

          {showImportBox && (
            <div className="mt-2 space-y-2">
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste your past conversation transcript from C.AI here..."
                rows={4}
                className="w-full text-xs rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  if (transcriptText.trim()) {
                    onImportTranscript(transcriptText);
                    setTranscriptText('');
                    setShowImportBox(false);
                  }
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Analyze & Recalculate Affinity
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
};
