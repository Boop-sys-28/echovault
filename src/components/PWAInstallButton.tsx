import React, { useState } from 'react';
import { Download, CheckCircle2, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'sidebar';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already installed and compact/sidebar, don't clutter the UI
  if (isInstalled && variant !== 'full') {
    return null;
  }

  // If not installable and not iOS and not already installed, hide for browsers that don't support install
  if (!isInstallable && !isIOS && !isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    setInstalling(true);
    try {
      const outcome = await install();
      if (outcome === 'ios') {
        setShowIOSModal(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      {variant === 'sidebar' && (
        <button
          onClick={handleInstallClick}
          title="Install EchoVault App"
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/15 to-indigo-500/10 border border-purple-500/25 hover:border-purple-400/40 text-purple-200 hover:text-white transition group cursor-pointer text-xs font-medium ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Download className="w-3.5 h-3.5 text-purple-300 group-hover:text-purple-100" />
            </div>
            <span className="truncate">Install App</span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
            PWA
          </span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          title="Install EchoVault as Native App"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 text-purple-200 hover:text-white text-xs font-medium transition cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-purple-300" />
          <span>Install</span>
        </button>
      )}

      {variant === 'full' && (
        <div className={`p-4 rounded-xl bg-white/[0.03] border border-white/10 ${className}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Progressive Web App (PWA)</span>
                {isInstalled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Installed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Install EchoVault on your home screen or desktop dock for instant launch, offline vault caching, and full-screen distraction-free messaging.
              </p>
            </div>
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{installing ? 'Installing...' : 'Install App'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* iOS Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0f111a] border border-white/10 p-5 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Download className="w-4 h-4 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white text-sm">Install EchoVault on iOS</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Apple Safari does not allow automatic 1-click install. You can easily add EchoVault to your Home Screen:
            </p>

            <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                Tap the <Share className="inline w-3.5 h-3.5 text-blue-400 mx-1 align-baseline" /> <strong>Share</strong> icon in the Safari toolbar (bottom on iPhone, top on iPad).
              </li>
              <li className="leading-relaxed">
                Scroll down and tap <PlusSquare className="inline w-3.5 h-3.5 text-purple-400 mx-1 align-baseline" /> <strong>Add to Home Screen</strong>.
              </li>
              <li className="leading-relaxed">
                Tap <strong>Add</strong> in the top right corner.
              </li>
            </ol>

            <div className="pt-2">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
