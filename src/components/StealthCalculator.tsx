import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { playKeyClickSound } from '../utils/audio';

interface StealthCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StealthCalculator: React.FC<StealthCalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');

  if (!isOpen) return null;

  const handlePress = (val: string) => {
    playKeyClickSound();
    if (val === 'C') {
      setDisplay('0');
      return;
    }
    if (val === 'DEL') {
      setDisplay(prev => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
      return;
    }
    if (val === '=') {
      try {
        const sanitized = display
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-');
        // Basic safe expression calculation
        // eslint-disable-next-line no-new-func
        const result = Function(`'use strict'; return (${sanitized})`)();
        setDisplay(Number.isFinite(result) ? String(result) : 'Error');
      } catch {
        setDisplay('Error');
      }
      return;
    }

    setDisplay(prev => {
      if (prev === '0' || prev === 'Error') {
        return val;
      }
      return prev + val;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Scientific Calc v2.4</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
            title="Exit Disguise (Esc x2 or Click Lock)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Display */}
        <div className="h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-end px-4 text-2xl font-mono tracking-wider overflow-x-auto text-emerald-400 font-medium">
          {display}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2 font-mono text-sm">
          <button
            onClick={() => handlePress('C')}
            className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 font-bold active:scale-95 transition"
          >
            C
          </button>
          <button
            onClick={() => handlePress('(')}
            className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
          >
            (
          </button>
          <button
            onClick={() => handlePress(')')}
            className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
          >
            )
          </button>
          <button
            onClick={() => handlePress('÷')}
            className="p-3 rounded-xl bg-amber-600/30 text-amber-300 hover:bg-amber-600/40 font-bold active:scale-95 transition"
          >
            ÷
          </button>

          <button onClick={() => handlePress('7')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">7</button>
          <button onClick={() => handlePress('8')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">8</button>
          <button onClick={() => handlePress('9')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">9</button>
          <button
            onClick={() => handlePress('×')}
            className="p-3 rounded-xl bg-amber-600/30 text-amber-300 hover:bg-amber-600/40 font-bold active:scale-95 transition"
          >
            ×
          </button>

          <button onClick={() => handlePress('4')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">4</button>
          <button onClick={() => handlePress('5')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">5</button>
          <button onClick={() => handlePress('6')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">6</button>
          <button
            onClick={() => handlePress('−')}
            className="p-3 rounded-xl bg-amber-600/30 text-amber-300 hover:bg-amber-600/40 font-bold active:scale-95 transition"
          >
            −
          </button>

          <button onClick={() => handlePress('1')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">1</button>
          <button onClick={() => handlePress('2')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">2</button>
          <button onClick={() => handlePress('3')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">3</button>
          <button
            onClick={() => handlePress('+')}
            className="p-3 rounded-xl bg-amber-600/30 text-amber-300 hover:bg-amber-600/40 font-bold active:scale-95 transition"
          >
            +
          </button>

          <button onClick={() => handlePress('0')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 col-span-2 active:scale-95 transition">0</button>
          <button onClick={() => handlePress('.')} className="p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 transition">.</button>
          <button
            onClick={() => handlePress('=')}
            className="p-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 active:scale-95 transition shadow-lg shadow-emerald-900/30"
          >
            =
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => handlePress('DEL')}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-mono transition"
          >
            <Delete className="w-3.5 h-3.5" /> Backspace
          </button>
          <p className="text-[10px] text-zinc-500 font-mono">
            ESC × 2 to return
          </p>
        </div>
      </div>
    </div>
  );
};
