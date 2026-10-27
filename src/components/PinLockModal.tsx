import React, { useState } from 'react';
import { ShieldCheck, Unlock, Eye, EyeOff } from 'lucide-react';
import { playLockSound } from '../utils/audio';

interface PinLockModalProps {
  isOpen: boolean;
  masterPin: string;
  onUnlock: () => void;
  onTriggerStealth: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  masterPin,
  onUnlock,
  onTriggerStealth,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!masterPin || pinInput.trim() === masterPin.trim()) {
      setError(false);
      setPinInput('');
      playLockSound();
      onUnlock();
    } else {
      setError(true);
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-[#131622] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
        {/* Shield Icon */}
        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">PulseDirect Locked</h3>
          <p className="text-xs text-slate-400 mt-1">
            {masterPin ? 'Enter master PIN to resume active session' : 'Session locked. Press unlock or enter PIN'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              maxLength={8}
              autoFocus
              placeholder="••••"
              value={pinInput}
              onChange={(e) => {
                setError(false);
                setPinInput(e.target.value);
              }}
              className="w-full text-center text-2xl tracking-[0.4em] py-3 bg-[#090a0f] border border-white/10 rounded-2xl text-white focus:outline-none focus:border-purple-500 transition font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-mono animate-bounce">
              Incorrect master PIN
            </p>
          )}

          <div className="flex gap-2 w-full pt-1">
            <button
              type="button"
              onClick={onTriggerStealth}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-semibold transition flex items-center justify-center gap-1.5 border border-white/5"
            >
              Scientific Calc
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30"
            >
              <Unlock className="w-3.5 h-3.5" /> Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
