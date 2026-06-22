"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "sirat_admin_session";
const VALID_EMAIL    = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMAIL    ?? "";
const VALID_PASSWORD = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PASSWORD ?? "";

// Module-level shared state so all useAuth() instances stay in sync
type Session = { email: string } | null;
type Listener = (s: Session) => void;
let _session: Session = null;
let _loading = true;
const _listeners = new Set<Listener>();

function setSession(s: Session) {
  _session = s;
  _listeners.forEach((fn) => fn(s));
}

export function useAuth() {
  const [user, setUser]               = useState<Session>(_session);
  const [authLoading, setAuthLoading] = useState(_loading);
  const router = useRouter();

  useEffect(() => {
    // Subscribe to shared state
    const listener: Listener = (s) => setUser(s);
    _listeners.add(listener);

    // Restore session once on first mount
    if (_loading) {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        _session = stored ? JSON.parse(stored) : null;
      } catch { /* ignore */ }
      _loading = false;
      setSession(_session);
      setAuthLoading(false);
    } else {
      setUser(_session);
      setAuthLoading(false);
    }

    return () => { _listeners.delete(listener); };
  }, []);

  async function login(email: string, password: string) {
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      const session = { email };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setSession(session);
    } else {
      throw new Error("invalid_credentials");
    }
  }

  async function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    router.push("/dashboard");
  }

  return { user, authLoading, login, logout };
}
