import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import type { AuthSessionResult } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { api, setAuthToken } from './api';
import type { User } from './types';

// Finish the web popup / redirect handshake if we were opened by one.
WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = 'onefi.auth.v1';

// Google OAuth client IDs — provide via mobile/.env (EXPO_PUBLIC_*). With none
// set, Google sign-in is simply unavailable and the dev mock is used instead.
const GOOGLE = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
};
const GOOGLE_CONFIGURED = Object.values(GOOGLE).some(Boolean);

type PromptFn = () => Promise<AuthSessionResult>;

type AuthState = {
  hydrated: boolean;
  token: string | null;
  user: User | null;
  pending: boolean;
  error: string | null;
  /** Google client id present AND the auth request object is ready. */
  googleAvailable: boolean;
  /** The server still allows the dev mock endpoint. */
  mockAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMock: (email: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

/**
 * Isolates `Google.useAuthRequest` in its own component so the hook only ever
 * runs when Google is actually configured — it throws when a platform's client
 * id is missing, and we don't want that to crash the whole app.
 */
function GoogleAuthBridge({
  onReady,
  onResult,
}: {
  onReady: (prompt: PromptFn | null) => void;
  onResult: (r: AuthSessionResult) => void;
}) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE.webClientId,
    androidClientId: GOOGLE.androidClientId,
    iosClientId: GOOGLE.iosClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    onReady(request ? (promptAsync as PromptFn) : null);
  }, [request, promptAsync, onReady]);

  useEffect(() => {
    if (response) onResult(response);
  }, [response, onResult]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockAvailable, setMockAvailable] = useState(true);
  const [googleReady, setGoogleReady] = useState(false);
  const promptRef = useRef<PromptFn | null>(null);

  const persist = useCallback(async (next: { token: string; user: User } | null) => {
    if (next) {
      setToken(next.token);
      setUser(next.user);
      setAuthToken(next.token);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    } else {
      setToken(null);
      setUser(null);
      setAuthToken(null);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, []);

  // Hydrate once, then re-validate the token against the server.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && alive) {
          const saved = JSON.parse(raw) as { token: string; user: User };
          setToken(saved.token);
          setUser(saved.user);
          setAuthToken(saved.token);
          try {
            const { user: fresh } = await api.me();
            if (alive) {
              setUser(fresh);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: saved.token, user: fresh }));
            }
          } catch (e) {
            if (alive && (e as { status?: number }).status === 401) await persist(null);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [persist]);

  // Learn whether the server still offers the dev mock.
  useEffect(() => {
    api
      .authConfig()
      .then((c) => setMockAvailable(c.mock))
      .catch(() => {});
  }, []);

  const handleGoogleResult = useCallback(
    (response: AuthSessionResult) => {
      if (response.type === 'success') {
        const idToken =
          (response.params as Record<string, string> | undefined)?.id_token ??
          response.authentication?.idToken;
        if (!idToken) {
          setPending(false);
          setError('Google did not return an ID token — check the Web client ID configuration.');
          return;
        }
        api
          .googleAuth(idToken)
          .then((r) => persist(r))
          .catch((e) => setError(e instanceof Error ? e.message : 'Google sign-in failed'))
          .finally(() => setPending(false));
      } else if (response.type === 'error') {
        setPending(false);
        setError(response.error?.message ?? 'Google sign-in was cancelled or failed');
      } else {
        // dismiss / cancel / locked
        setPending(false);
      }
    },
    [persist],
  );

  const handleGoogleReady = useCallback((prompt: PromptFn | null) => {
    promptRef.current = prompt;
    setGoogleReady(!!prompt);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!promptRef.current) {
      setError('Google sign-in isn’t configured on this build. Use the developer sign-in below.');
      return;
    }
    setPending(true);
    try {
      await promptRef.current();
    } catch (e) {
      setPending(false);
      setError(e instanceof Error ? e.message : 'Could not open Google sign-in');
    }
  }, []);

  const signInWithMock = useCallback(
    async (email: string, name?: string) => {
      setError(null);
      setPending(true);
      try {
        const r = await api.mockAuth({ email: email.trim(), name: name?.trim() || undefined });
        await persist(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Developer sign-in failed');
      } finally {
        setPending(false);
      }
    },
    [persist],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const value = useMemo<AuthState>(
    () => ({
      hydrated,
      token,
      user,
      pending,
      error,
      googleAvailable: GOOGLE_CONFIGURED && googleReady,
      mockAvailable,
      signInWithGoogle,
      signInWithMock,
      signOut,
      clearError: () => setError(null),
    }),
    [hydrated, token, user, pending, error, googleReady, mockAvailable, signInWithGoogle, signInWithMock, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {GOOGLE_CONFIGURED && <GoogleAuthBridge onReady={handleGoogleReady} onResult={handleGoogleResult} />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
