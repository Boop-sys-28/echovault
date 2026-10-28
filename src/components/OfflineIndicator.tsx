import React, { useState } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // If online and was not recently offline, or dismissed, render nothing
  if ((isOnline && !wasOffline) || (dismissed && !isOnline)) {
    return null;
  }

  // Back online toast
  if (isOnline && wasOffline) {
    return (
      <aside
        role="status"
        aria-label="Reconnected"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium shadow-lg shadow-emerald-950/40 backdrop-blur-md">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Reconnected // Online</span>
        </div>
      </aside>
    );
  }

  // Offline banner
  return (
    <aside
      role="status"
      aria-label="Offline Mode"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-top-2 max-w-[90vw]"
    >
      <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-950/85 border border-amber-500/40 text-amber-200 text-xs font-medium shadow-xl shadow-amber-950/50 backdrop-blur-md">
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate">Offline Mode — Cached vaults accessible</span>
        <button
          onClick={() => setDismissed(true)}
          title="Dismiss"
          className="p-0.5 rounded-full hover:bg-amber-500/20 text-amber-300 hover:text-white transition cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
