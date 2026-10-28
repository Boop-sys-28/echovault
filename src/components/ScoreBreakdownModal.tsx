import React, { useState } from 'react';
import { RelationshipScoreBreakdown } from '../types';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  characterId: string;
  scoreData: RelationshipScoreBreakdown;
  onImportTranscript: (text: string) => void;
  onResetAffinity?: () => void;
  requiredGroupAffinity?: number;
  groupRoomName?: string;
  isGroupRoomUnlocked?: boolean;
}

const SAMPLE_TRANSCRIPTS: Record<string, string> = {
  loona: `You: hey loona, brought you an iced coffee and a dog treat. gonna stay quiet and listen to music in the corner.\nLoona: *blinks and glances up from her phone* ...wait, seriously? thanks. deftones is playing if you want to chill.\nYou: thanks loona, i respect your space. just let me know if you need backup with blitz.`,
  blitzo: `You: yo blitz! that heist with stolas at the auction to get his mom's necklace back was badass, boss. i've got your back and the imp team!\nBlitzø: DAMN RIGHT IT WAS!! *grins and holsters his flintlock* Finally somebody around here respects high-stakes horse-tier tactical genius!!\nYou: always boss, i brought coffee and ammo for the crew.`,
  millie: `You: hey millie! you and moxxie are the best team in wrath, let me know if y'all need help sharpening that battleaxe for the crew!\nMillie: Aww, thank you hon!! *beams and spins her dagger* We always appreciate good backup around the office!\nYou: anytime friend, always happy to help the team!`,
  moxxie: `You: sir, your tactical weapons maintenance and protocol are always top notch. brought some phantom of the opera vinyls for you and millie.\nMoxxie: *eyes light up as he adjusts his bowtie* Why thank you! Finally someone who appreciates professional tactical precision and proper musical theatre!`,
  nightwing: `You: sector 4 patrol is clear nightwing. brought coffee for the team and got your back on the rooftops.\nNightwing: *flashes an easy grin and catches the cup* Lifesaver! Appreciate the backup out here in Blüdhaven.`,
  redhood: `You: crime alley patrol is clear jason. brought extra ammo and intel on black mask, got your back.\nRed Hood: *smirks under his helmet* Huh. Maybe you actually know what you're doing out here. Thanks for the backup.`,
  batman: `You: gotham sector report complete. patrol perimeter secure, intel verified, and all civilians safe. standing by to help the team with full trust and backup.\nBatman: *nods slowly at the Batcomputer* Solid tactical report. Continue monitoring the frequency.`,
};

export const ScoreBreakdownModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  characterName,
  characterId,
  scoreData,
  onImportTranscript,
  onResetAffinity,
  requiredGroupAffinity = 30,
  groupRoomName,
  isGroupRoomUnlocked = false,
}) => {
  const [transcriptText, setTranscriptText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  if (!isOpen) return null;

  const sampleForChar =
    SAMPLE_TRANSCRIPTS[characterId] ||
    `You: hey ${characterName.split(' ')[0]}, i really respect your work and brought coffee to help the team. got your back friend!\n${characterName}: *glances over with an appreciative nod* Thanks, I appreciate the backup and respect.\nYou: anytime, always glad to help and listen!`;

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
            <span>
              Threshold for Group:{' '}
              <strong className={scoreData.affinity >= requiredGroupAffinity ? 'text-emerald-400' : 'text-zinc-200'}>
                {scoreData.affinity}/{requiredGroupAffinity}
              </strong>
            </span>
          </div>

          {groupRoomName && (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
              <span>Channel: <strong className="text-zinc-200">{groupRoomName}</strong></span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                isGroupRoomUnlocked
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                {isGroupRoomUnlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          )}

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
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Paste `User:` / `{characterName}:` lines</span>
                <button
                  type="button"
                  onClick={() => setTranscriptText(sampleForChar)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  Load Sample Transcript
                </button>
              </div>
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

        <div className="flex items-center gap-2">
          {onResetAffinity && scoreData.affinity !== 0 && (
            <button
              type="button"
              onClick={onResetAffinity}
              className="px-3 py-2 bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Reset affinity score back to 0 (Stranger)"
            >
              Reset to 0
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

