import React, { useState } from 'react';
import { X, Shield, Lock, Eye, EyeOff, Calculator } from 'lucide-react';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  currentPin: string;
  tabBlurLock: boolean;
  onSave: (newPin: string, tabBlurLock: boolean) => void;
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  currentPin,
  tabBlurLock,
  onSave,
  onClose,
}) => {
  const [pin, setPin] = useState(currentPin);
  const [blurLock, setBlurLock] = useState(tabBlurLock);
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(pin, blurLock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#131622] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" /> Privacy & Vault Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Client-side safeguards protect your conversations from wandering eyes in shared or public spaces.
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] font-mono text-slate-300 uppercase flex items-center justify-between">
              <span>Master Access PIN</span>
              <span className="text-[10px] text-slate-500">4-8 digits</span>
            </label>
            <div className="relative mt-1">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={8}
                placeholder="Leave blank for no PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-[#090a0f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Auto Lock on Tab Blur */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> Auto-Lock on Tab Switch
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Locks session immediately when switching to another browser window
              </p>
            </div>
            <input
              type="checkbox"
              checked={blurLock}
              onChange={(e) => setBlurLock(e.target.checked)}
              className="accent-purple-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Stealth Calculator info */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" /> Double-ESC Stealth Panic
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Quickly masks entire app as a scientific calculator
              </p>
            </div>
            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              Esc × 2
            </span>
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between px-1">
            <span>Shortcut to Lock:</span>
            <span className="text-slate-400">Ctrl + L / Cmd + L</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-zinc-950 shadow-md shadow-cyan-500/20 transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
