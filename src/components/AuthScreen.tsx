import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Lock, User, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { UserProfile, RegisteredUserAccount } from '../types';

const GOOGLE_CLIENT_ID =
  '582604110796-c17utrvna0oemctiqj68dngqqd8ovnnn.apps.googleusercontent.com';

const REGISTERED_USERS_STORAGE_KEY = 'pulsedirect_registered_users';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleJwtPayload {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: 'popup' | 'redirect';
            itp_support?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: {
            isNotDisplayed?: () => boolean;
            isSkippedMoment?: () => boolean;
          }) => void) => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: { access_token?: string; error?: string }) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Decodes a Google Identity Services JWT credential token payload (base64url)
 * to extract the user's real display name, email, and profile picture URL.
 */
function decodeGoogleJwtPayload(jwtToken: string): GoogleJwtPayload | null {
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as GoogleJwtPayload;
  } catch {
    return null;
  }
}

function getRegisteredAccounts(): RegisteredUserAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => {
        const username = typeof item.username === 'string' && item.username.trim() ? item.username.trim() : 'Operative_07';
        const email =
          typeof item.email === 'string' && item.email.trim()
            ? item.email.trim().toLowerCase()
            : `${username.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        return {
          id: typeof item.id === 'string' ? item.id : `user-${Date.now()}`,
          email,
          username,
          codename: typeof item.codename === 'string' && item.codename.trim() ? item.codename.trim() : username,
          password: typeof item.password === 'string' ? item.password : '',
          provider: 'local' as const,
          avatarColor: typeof item.avatarColor === 'string' ? item.avatarColor : 'purple',
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        };
      });
  } catch {
    return [];
  }
}

function saveRegisteredAccounts(accounts: RegisteredUserAccount[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // ignore storage quota errors
  }
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [error, setError] = useState('');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  const colors = [
    { id: 'purple', class: 'bg-purple-600', ring: 'ring-purple-400' },
    { id: 'cyan', class: 'bg-cyan-500', ring: 'ring-cyan-400' },
    { id: 'pink', class: 'bg-pink-500', ring: 'ring-pink-400' },
    { id: 'emerald', class: 'bg-emerald-500', ring: 'ring-emerald-400' },
    { id: 'amber', class: 'bg-amber-500', ring: 'ring-amber-400' },
  ];

  // Handle Google Identity Services JWT credential callback
  const handleCredentialResponse = useCallback(
    (response: GoogleCredentialResponse) => {
      setIsSigningInGoogle(false);
      if (!response?.credential) return;
      const payload = decodeGoogleJwtPayload(response.credential);
      if (!payload) return;

      const displayName =
        payload.name ||
        payload.given_name ||
        (payload.email ? payload.email.split('@')[0] : 'Google User');
      const handleName = payload.email
        ? payload.email.split('@')[0]
        : displayName.replace(/\s+/g, '_').toLowerCase();

      onLogin({
        id: payload.sub ? `google-${payload.sub}` : `google-${Date.now()}`,
        username: handleName,
        codename: displayName,
        email: payload.email,
        avatarUrl: payload.picture,
        provider: 'google',
        avatarColor: 'purple',
        createdAt: Date.now(),
      });
    },
    [onLogin]
  );

  // Initialize Google Identity Services in the background for prompt/popup support
  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    const initGis = () => {
      const gsi = window.google?.accounts?.id;
      if (!gsi) return false;
      try {
        gsi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
          itp_support: true,
        });
        return true;
      } catch {
        return false;
      }
    };

    if (!initGis()) {
      timer = setInterval(() => {
        attempts += 1;
        if (initGis() || attempts > 40) {
          if (timer) clearInterval(timer);
        }
      }, 200);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [handleCredentialResponse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmailFormat(cleanEmail)) {
      setError('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    const accounts = getRegisteredAccounts();

    if (isRegister) {
      if (!cleanUsername) {
        setError('Please enter a Display Username / Codename.');
        return;
      }

      const existing = accounts.find(
        acc => (acc.email || '').toLowerCase() === cleanEmail
      );
      if (existing) {
        setError('An account with this email already exists. Please switch to Sign In.');
        return;
      }

      const newAccount: RegisteredUserAccount = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        username: cleanUsername,
        codename: cleanUsername,
        password: cleanPassword,
        provider: 'local',
        avatarColor: selectedColor,
        createdAt: Date.now(),
      };

      saveRegisteredAccounts([...accounts, newAccount]);

      const { password: _omittedPassword, ...userProfile } = newAccount;
      onLogin(userProfile);
      return;
    }

    // Sign In tab: authenticate by matching entered email and password
    const matchedAccount = accounts.find(
      acc => (acc.email || '').toLowerCase() === cleanEmail
    );

    if (!matchedAccount) {
      setError('No account found with this email address. Please switch to Register to create one.');
      return;
    }

    if (matchedAccount.password !== cleanPassword) {
      setError('Incorrect password for this email address.');
      return;
    }

    const { password: _omittedPassword, ...userProfile } = matchedAccount;
    onLogin(userProfile);
  };

  const fallbackToGuestOrDemoGoogle = () => {
    const cleanName = username.trim();
    const cleanMail = email.trim().toLowerCase();
    const derivedName =
      cleanName ||
      (cleanMail && cleanMail.includes('@') ? cleanMail.split('@')[0] : 'Operative_07');

    const fallbackUser: UserProfile = {
      id: `google-demo-${Date.now()}`,
      username: derivedName.replace(/\s+/g, '_').toLowerCase(),
      codename: derivedName,
      email: isValidEmailFormat(cleanMail)
        ? cleanMail
        : `${derivedName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      provider: 'google',
      avatarColor: selectedColor || 'purple',
      createdAt: Date.now(),
    };
    onLogin(fallbackUser);
  };

  // Single "Continue with Google" handler wired to Google Identity Services
  const handleContinueWithGoogle = () => {
    setError('');
    setIsSigningInGoogle(true);

    // Safety timer so button never stays permanently disabled if user closes popup manually
    const safetyResetTimer = setTimeout(() => {
      setIsSigningInGoogle(false);
    }, 8000);

    const oauth2 = window.google?.accounts?.oauth2;
    const gsi = window.google?.accounts?.id;

    if (oauth2) {
      try {
        const tokenClient = oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            clearTimeout(safetyResetTimer);
            setIsSigningInGoogle(false);
            if (tokenResponse.error || !tokenResponse.access_token) {
              fallbackToGuestOrDemoGoogle();
              return;
            }
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              if (!res.ok) throw new Error('Failed to fetch Google profile');
              const profile = (await res.json()) as GoogleJwtPayload;
              const displayName =
                profile.name ||
                profile.given_name ||
                (profile.email ? profile.email.split('@')[0] : 'Google User');
              const handleName = profile.email
                ? profile.email.split('@')[0]
                : displayName.replace(/\s+/g, '_').toLowerCase();

              onLogin({
                id: profile.sub ? `google-${profile.sub}` : `google-${Date.now()}`,
                username: handleName,
                codename: displayName,
                email: profile.email,
                avatarUrl: profile.picture,
                provider: 'google',
                avatarColor: 'purple',
                createdAt: Date.now(),
              });
            } catch {
              fallbackToGuestOrDemoGoogle();
            }
          },
          error_callback: () => {
            clearTimeout(safetyResetTimer);
            setIsSigningInGoogle(false);
            fallbackToGuestOrDemoGoogle();
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {
        // Fall through to GIS prompt or guest fallback
      }
    }

    if (gsi) {
      try {
        gsi.prompt((notification) => {
          if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
            clearTimeout(safetyResetTimer);
            setIsSigningInGoogle(false);
            fallbackToGuestOrDemoGoogle();
          }
        });
        return;
      } catch {
        // Fall through to guest fallback
      }
    }

    clearTimeout(safetyResetTimer);
    setIsSigningInGoogle(false);
    fallbackToGuestOrDemoGoogle();
  };

  const handleQuickGuest = () => {
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      username: 'Operative_07',
      codename: 'Operative_07',
      provider: 'guest',
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
          {/* 1. Email Address (shown on both Sign In and Register tabs) */}
          <div>
            <label
              htmlFor="auth-email-input"
              className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              Email Address
            </label>
            <input
              id="auth-email-input"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setError('');
                setEmail(e.target.value);
              }}
              className="w-full mt-1.5 bg-[#131622]/90 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition"
            />
          </div>

          {/* 2. Display Username / Codename (shown on Register tab) */}
          {isRegister && (
            <div>
              <label
                htmlFor="auth-username-input"
                className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-purple-400" />
                Display Username / Codename
              </label>
              <input
                id="auth-username-input"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="e.g. Operative_07"
                value={username}
                onChange={(e) => {
                  setError('');
                  setUsername(e.target.value);
                }}
                className="w-full mt-1.5 bg-[#131622]/90 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition"
              />
            </div>
          )}

          {/* 3. Password (shown on both Sign In and Register tabs) */}
          <div>
            <label
              htmlFor="auth-password-input"
              className="text-xs font-medium text-slate-300 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              Password
            </label>
            <input
              id="auth-password-input"
              name="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
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

          {/* Single Clean "Continue with Google" Button wired to Google Identity Services */}
          <button
            type="button"
            disabled={isSigningInGoogle}
            onClick={handleContinueWithGoogle}
            className="w-full py-3 px-4 rounded-2xl bg-[#131622]/90 hover:bg-[#1a1f30] border border-white/10 hover:border-white/25 text-sm font-semibold text-slate-100 transition flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-60"
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

        {/* Quick Guest Access Fallback */}
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
