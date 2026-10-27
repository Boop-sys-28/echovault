import React, { useState } from 'react';
import { Zap, Lock, User, Sparkles, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [error, setError] = useState('');

  const colors = [
    { id: 'purple', class: 'bg-purple-600', ring: 'ring-purple-400' },
    { id: 'cyan', class: 'bg-cyan-500', ring: 'ring-cyan-400' },
    { id: 'pink', class: 'bg-pink-500', ring: 'ring-pink-400' },
    { id: 'emerald', class: 'bg-emerald-500', ring: 'ring-emerald-400' },
    { id: 'amber', class: 'bg-amber-500', ring: 'ring-amber-400' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please provide a username or handle.');
      return;
    }
    if (!password.trim()) {
      setError('Please provide an access key or password.');
      return;
    }

    const user: UserProfile = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      codename: cleanUsername || 'Operative',
      avatarColor: selectedColor,
      createdAt: Date.now(),
    };

    onLogin(user);
  };

  const handleGoogleLogin = () => {
    const googleUser: UserProfile = {
      id: `google-${Date.now()}`,
      username: 'user_google',
      codename: 'user_google',
      avatarColor: 'purple',
      createdAt: Date.now(),
    };
    onLogin(googleUser);
  };

  const handleQuickGuest = () => {
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      username: 'Operative_07',
      codename: 'Operative_07',
      avatarColor: 'purple',
      createdAt: Date.now(),
    };
    onLogin(guestUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090a0f] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
      {/* Subtle Ambient Glass Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] sm:w-[500px] h-[280px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] sm:w-[400px] h-[260px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0d0f17]/85 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-2xl space-y-5 my-auto">
        {/* Clean Modern Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/25 text-white">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            EchoVault
          </h1>
        </div>

        {/* Segmented Tab Toggle */}
        <div className="flex bg-[#131622]/90 p-1 rounded-2xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
              !isRegister
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition cursor-pointer ${
              isRegister
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setError('');
                setUsername(e.target.value);
              }}
              className="w-full mt-1.5 bg-[#131622]/90 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setError('');
                setPassword(e.target.value);
              }}
              className="w-full mt-1.5 bg-[#131622]/90 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition"
            />
          </div>

          {isRegister && (
            <div className="pt-1">
              <label className="text-xs font-medium text-slate-300 block mb-2">
                Accent Color
              </label>
              <div className="flex gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-7 h-7 rounded-full ${c.class} transition transform cursor-pointer ${
                      selectedColor === c.id ? `ring-2 ${c.ring} scale-110` : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-400 font-medium pt-0.5">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-sm font-semibold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-[0.98] cursor-pointer"
          >
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* OR Divider */}
          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              OR
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-2xl bg-[#131622]/90 hover:bg-[#1a1f30] border border-white/10 hover:border-white/25 text-sm font-semibold text-slate-100 transition flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.85-.075-1.665-.215-2.45H12v4.635h6.445c-.28 1.495-1.125 2.765-2.395 3.615v3.005h3.875c2.265-2.085 3.565-5.16 3.565-8.805z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.875-3.005c-1.075.72-2.45 1.145-4.065 1.145-3.125 0-5.775-2.11-6.72-4.945H1.275v3.1C3.25 21.305 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.285c-.24-.72-.375-1.49-.375-2.285s.135-1.565.375-2.285v-3.1H1.275C.465 8.23 0 10.06 0 12s.465 3.77 1.275 5.385l4.005-3.1z"
              />
              <path
                fill="#EA4335"
                d="M12 4.77c1.76 0 3.34.605 4.585 1.795l3.44-3.44C17.95 1.19 15.235 0 12 0 7.31 0 3.25 2.695 1.275 6.615l4.005 3.1c.945-2.835 3.595-4.945 6.72-4.945z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>

        {/* Quick Guest Access */}
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleQuickGuest}
            className="w-full py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
