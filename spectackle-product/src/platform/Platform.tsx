import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Context, responseError, type Profile, type Status, type Template } from './context';
import { getApps, initializeApp } from 'firebase/app';
import { browserSessionPersistence, connectAuthEmulator, getAuth, onAuthStateChanged, setPersistence, type Auth, type User } from 'firebase/auth';

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selected, select] = useState<Template | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    void (async () => {
      try {
        const response = await fetch('/api/platform/status', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Start the local GD backend, then reload this page.');
        const value = await response.json() as Status;
        if (typeof value.enabled !== 'boolean') throw new Error('The GD backend returned an invalid platform status.');
        if (!active) return;
        setStatus(value);
        if (!value.enabled) { setReady(true); return; }
        if (value.emulator && (!import.meta.env.DEV || !value.project_id.startsWith('demo-'))) throw new Error('Firebase emulators are only available in local development with a demo project.');
        const apiKey = value.emulator ? 'demo-key' : import.meta.env.VITE_GD_FIREBASE_API_KEY;
        if (!apiKey) throw new Error('Configure VITE_GD_FIREBASE_API_KEY for Firebase sign-in.');
        const name = `gd-${value.project_id}-${value.emulator ? 'emulator' : 'firebase'}`;
        const existing = getApps().find(app => app.name === name);
        const app = existing ?? initializeApp({ projectId: value.project_id, apiKey, authDomain: `${value.project_id}.firebaseapp.com` }, name);
        const identity = getAuth(app);
        if (value.emulator && !existing) connectAuthEmulator(identity, 'http://127.0.0.1:9099', { disableWarnings: true });
        await setPersistence(identity, browserSessionPersistence);
        if (!active) return;
        setAuth(identity);
        unsubscribe = onAuthStateChanged(identity, account => {
          if (!active) return;
          setError(''); setProfile(null); select(null); setUser(account); setReady(true);
        }, failure => { if (active) { setError(failure.message); setReady(true); } });
      } catch (failure) {
        if (active) { setError(failure instanceof Error ? failure.message : 'Firebase setup failed.'); setReady(true); }
      } finally { clearTimeout(timeout); }
    })();
    return () => { active = false; controller.abort(); clearTimeout(timeout); unsubscribe?.(); };
  }, []);

  const token = useCallback(async () => {
    if (!status?.enabled) return undefined;
    if (!auth?.currentUser) throw new Error('Sign in to continue.');
    return auth.currentUser.getIdToken();
  }, [status, auth]);
  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!path.startsWith('/api/')) throw new Error('Only local GD API paths are supported.');
    const headers = new Headers(init.headers);
    const idToken = await token();
    if (idToken) headers.set('Authorization', `Bearer ${idToken}`);
    return fetch(path, { ...init, headers, cache: 'no-store' });
  }, [token]);
  const reload = useCallback(async () => {
    if (!auth?.currentUser || !status?.enabled) return;
    const response = await request('/api/platform/me');
    if (!response.ok) throw await responseError(response);
    const value = await response.json() as Profile;
    if (auth.currentUser.uid === value.user.uid) { setProfile(value); setError(''); }
  }, [request, auth, status]);
  useEffect(() => {
    if (user) void reload().catch(failure => setError(failure.message));
  }, [user, reload]);

  return <Context.Provider value={{ ready, error, status, auth, user, profile, selected, select, token, request, reload }}>{children}</Context.Provider>;
}
