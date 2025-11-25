import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import * as api from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // sendSignInLink now accepts optional displayName to persist for later (email signup case)
  const sendSignInLink = useCallback(async (email, displayName = null, redirectUrl = null) => {
    // persist displayName temporarily so after email link complete we can set it on the user
    try {
      if (displayName) {
        try { sessionStorage.setItem('pendingDisplayName', displayName); } catch (e) {}
      } else {
        try { sessionStorage.removeItem('pendingDisplayName'); } catch (e) {}
      }

      // api.sendSignInLink signature in your project takes (email, redirectUrl)
      if (api && typeof api.sendSignInLink === 'function') {
        return await api.sendSignInLink(email, redirectUrl || (window.location.origin + '/complete-signin'));
      }

      throw new Error('sendSignInLink not implemented in api');
    } catch (err) {
      console.error('sendSignInLink failed', err);
      throw err;
    }
  }, []);

  // completeSignIn should finish sign-in and, for email signups, set displayName if provided earlier.
  const completeSignIn = useCallback(async (url) => {
    let userResult = null;
    if (api && typeof api.completeSignIn === 'function') {
      userResult = await api.completeSignIn(url);
    }

    // If a displayName was stored for email signup, apply it to the firebase user if missing
    try {
      const pendingName = sessionStorage.getItem('pendingDisplayName');
      const fbUser = auth && auth.currentUser ? auth.currentUser : null;
      if (pendingName && fbUser && (!fbUser.displayName || fbUser.displayName.trim() === '')) {
        // prefer server API if available
        if (api && typeof api.setDisplayName === 'function') {
          await api.setDisplayName({ uid: fbUser.uid, displayName: pendingName });
        } else {
          await updateProfile(fbUser, { displayName: pendingName });
        }
        try { sessionStorage.removeItem('pendingDisplayName'); } catch (e) {}
      }
    } catch (err) {
      console.warn('Could not apply pending displayName', err);
    }

    return userResult;
  }, []);

  const loginWithPassword = useCallback((creds) => api.loginWithPassword && api.loginWithPassword(creds), []);
  // robust logout: use Firebase auth.signOut (your project exports `auth`) — do not assume api.logout exists.
  const logout = useCallback(async () => {
    try {
      if (auth && typeof auth.signOut === 'function') {
        await auth.signOut();
        setCurrentUser(null);
        return;
      }
      // last-resort: clear common tokens
      try { localStorage.removeItem('authToken'); } catch (e) {}
      try { sessionStorage.removeItem('authToken'); } catch (e) {}
      return Promise.resolve();
    } catch (err) {
      console.error('logout failed', err);
      throw err;
    }
  }, []);
  const signInWithGoogle = useCallback(() => api.signInWithGoogle(), []);
  const setPasswordForCurrentUser = useCallback((pw) => api.setPasswordForCurrentUser(pw), []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Don't call useNavigate() here (AuthProvider may mount outside Router).
  // We'll use window.location to redirect to /login instead.

  // Auto-logout after 1 hour of inactivity (mouse/keyboard/touch/scroll/click)
  useEffect(() => {
    const INACTIVITY_MS = 60 * 60 * 1000; // 1 hour

    let timer = null;
    const resetTimer = () => {
      try { localStorage.setItem("lastActivity", String(Date.now())); } catch (_) {}
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          if (typeof logout === "function") await logout();
        } catch (e) {
          /* ignore logout errors */
        } finally {
          try { window.location.href = "/login"; } catch (_) {}
         }
       }, INACTIVITY_MS);
     };

    // Events considered as "activity"
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "click", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    // visibility change: treat showing the page as activity
    const onVisibility = () => { if (!document.hidden) resetTimer(); };
    document.addEventListener("visibilitychange", onVisibility);

    // initialize timer and also check persisted lastActivity on mount
    try {
      const last = Number(localStorage.getItem("lastActivity") || "0");
      if (last && Date.now() - last >= INACTIVITY_MS) {
        (async () => {
          try { if (typeof logout === "function") await logout(); } catch (_) {}
          try { window.location.href = "/login"; } catch (_) {}
         })();
       } else {
         resetTimer();
       }
     } catch {
       resetTimer();
     }

     return () => {
       events.forEach((ev) => window.removeEventListener(ev, resetTimer));
       document.removeEventListener("visibilitychange", onVisibility);
       if (timer) {
         clearTimeout(timer);
         timer = null;
       }
     };
  }, [logout]);

  const value = { currentUser, loading, sendSignInLink, completeSignIn, loginWithPassword, logout, signInWithGoogle, setPasswordForCurrentUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
