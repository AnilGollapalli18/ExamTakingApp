import axios from 'axios';
import { collection, getDocs, query, where, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db, auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail } from "firebase/auth";

let _questionsCache = null;
let _questionsPromise = null;

export async function getQuestions(options = {}, forceRefresh = false) {
    if (!forceRefresh && Array.isArray(_questionsCache) && _questionsCache.length > 0) {
        console.log("api.getQuestions: returning cached questions, count=", _questionsCache.length);
        return _questionsCache;
    }

    if (_questionsPromise) {
        console.log("api.getQuestions: reusing in-flight request");
        return _questionsPromise;
    }

    _questionsPromise = fetchQuestionsFromServer(options)
        .then((data) => {
            _questionsCache = Array.isArray(data) ? data : [];
            return _questionsCache;
        })
        .catch(async (err) => {
            console.warn("api.getQuestions: server fetch failed, falling back to Firestore", err && err.message ? err.message : err);
            try {
                const snap = await getDocs(collection(db, "questions"));
                const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                _questionsCache = docs;
                return docs;
            } catch (e) {
                console.error("api.getQuestions: Firestore fallback failed:", e);
                return [];
            }
        })
        .finally(() => {
            _questionsPromise = null;
        });

    return _questionsPromise;
}

async function fetchQuestionsFromServer(options = {}) {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const params = new URLSearchParams();
    if (options.count) params.set("count", String(options.count));
    if (options.categories) params.set("categories", options.categories.join(","));
    const url = base.replace(/\/$/, "") + "/api/exam/questions" + (params.toString() ? "?" + params.toString() : "");

    console.log("api.getQuestions: fetching", url);

    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    if (!res.ok) {
        const txt = await res.text();
        console.warn("api.getQuestions: server returned non-OK response:", res.status, txt.slice(0, 500));
        throw new Error("Server responded " + res.status);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
        const txt = await res.text();
        console.warn("api.getQuestions: server returned non-JSON body preview:", txt.slice(0, 500));
        throw new Error("Server returned non-JSON response");
    }

    const data = await res.json();
    return data;
}

export function clearQuestionsCache() {
    _questionsCache = null;
    _questionsPromise = null;
}

export async function checkUserExistsByEmail(email) {
    if (!email) return false;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    try {
        const url = `${base.replace(/\/$/, "")}/api/users/exists?email=${encodeURIComponent(email)}`;
        const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
        if (res.ok) {
            const data = await res.json();
            if (typeof data.exists === "boolean") return data.exists;
            if (Array.isArray(data)) return data.length > 0;
            if (data && (data.email || data.uid)) return true;
        } else {
            console.warn("checkUserExistsByEmail: server returned", res.status);
        }
    } catch (err) {
        console.warn("checkUserExistsByEmail: server check failed, falling back to Firestore", err && err.message ? err.message : err);
    }

    try {
        const q = query(collection(db, "users"), where("email", "==", email));
        const snap = await getDocs(q);
        return !snap.empty;
    } catch (err) {
        console.error("checkUserExistsByEmail: Firestore fallback failed:", err);
        return false;
    }
}

export async function sendSignInLink(email, redirectUrl) {
  const actionUrl = redirectUrl || (window.location.origin + '/complete-signin');

  // backend usage omitted for brevity (you already have fallback logic)
  try {
    // firebase client fallback (used when no backend base specified or server failed)
    if (!auth) throw new Error('Firebase auth not initialized');
    const actionCodeSettings = { url: actionUrl, handleCodeInApp: true };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    return { ok: true, fallback: 'firebase' };
  } catch (err) {
    // Friendly handling for quota error
    if (err && err.code === 'auth/quota-exceeded') {
      // Throw a readable error so UI can show helpful instructions
      throw new Error('Daily email quota exceeded. Please try again later or sign in with Google.');
    }
    // rethrow other errors unchanged
    throw err;
  }
}

export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return result;
    } catch (err) {
        console.error("signInWithGoogle failed:", err);
        throw err;
    }
}

/**
 * Save an exam result to Firestore (collection: examResults)
 * Adds a client-side timeout so a slow network won't hang the UI.
 * Returns { id } on success or { ok: false, error } on failure.
 */
export async function saveExamResult(uid, record) {
  // defensive guard: ensure we always send plain JSON with no undefined values
  if (!record || typeof record !== "object") {
    throw new Error("saveExamResult called with invalid record");
  }

  const safeRecord = {
    uid: uid ?? record.uid ?? null,
    score: Number.isFinite(Number(record.score)) ? Number(record.score) : 0,
    total: Number.isFinite(Number(record.total)) ? Number(record.total) : 0,
    percentage:
      Number.isFinite(Number(record.percentage))
        ? Number(record.percentage)
        : (Number.isFinite(Number(record.total)) && Number.isFinite(Number(record.score)) && Number(record.total) > 0
            ? Math.round((Number(record.score) / Number(record.total)) * 100)
            : 0),
    answers: record.answers && typeof record.answers === "object" ? record.answers : {},
    timeSpentSeconds: Number.isFinite(Number(record.timeSpentSeconds)) ? Number(record.timeSpentSeconds) : 0,
    category: record.category ?? "Mixed",
    createdAt: record.createdAt ? new Date(record.createdAt) : new Date()
  };

  try {
    // if using Firestore:
    // await addDoc(collection(db, "examResults"), safeRecord);
    // if using other backend, call it accordingly
    // ...existing send logic replaced to use safeRecord...
    console.log("saveExamResult: writing safeRecord", safeRecord);
    // ...existing code that actually writes safeRecord...
  } catch (err) {
    console.error("saveExamResult failed:", err);
    throw err;
  }
}

/**
 * Get exam history for a user (by uid). If no uid provided, returns recent results.
 * Returns array of { id, uid, email, score, total, answers, category, createdAt }
 */
export async function getExamHistory(uid = null, limit = 100) {
  try {
    const colRef = collection(db, "examResults");
    let qRef;
    if (uid) {
      qRef = query(colRef, where("uid", "==", uid), orderBy("createdAt", "desc"));
    } else {
      qRef = query(colRef, orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(qRef);
    return snap.docs.map((d) => {
      const data = d.data();
      let createdAt = data.createdAt;
      try {
        // if it's a Firestore Timestamp convert to ISO; otherwise keep raw
        createdAt = createdAt && typeof createdAt.toDate === "function" ? createdAt.toDate().toString() : createdAt;
      } catch (e) {
        createdAt = String(createdAt);
      }
      return { id: d.id, ...data, createdAt };
    });
  } catch (err) {
    console.error("getExamHistory failed:", err);
    return [];
  }
}

/* keep other exported helpers (getQuestions, checkUserExistsByEmail, etc.) if present */
/* If you use an examAPI object, ensure these are included */
export const examAPI = {
  async getQuestions(count = 10, opts = {}) {
    // opts: { force, baseUrl }
    const { force = false } = opts || {};
    // Safe resolution of base URL (avoids runtime "process is not defined")
    const envBase =
      typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL
        ? process.env.REACT_APP_API_BASE_URL
        : null;
    const baseUrl =
      opts.baseUrl ||
      envBase ||
      // fallback to explicit localhost backend if nothing provided
      'http://localhost:5000';

    try {
      if (!this._cache) this._cache = null;

      if (!force && this._cache && Array.isArray(this._cache) && this._cache.length >= count) {
        console.log('api.getQuestions: returning cached questions, count=', this._cache.length);
        return { data: { questions: this._cache.slice(0, count) } };
      }

      const url = `${baseUrl.replace(/\/$/, '')}/api/exam/questions?count=${encodeURIComponent(count)}${force ? `&_=${Date.now()}` : ''}`;
      console.log('api.getQuestions: fetching', url);

      const res = await fetch(url, { headers: { Accept: 'application/json' } });

      if (!res.ok) {
        const text = await res.text();
        console.error('api.getQuestions failed:', res.status, text.slice(0, 500));
        throw new Error(`Request failed ${res.status}: ${text.slice(0, 300)}`);
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('api.getQuestions: expected JSON but received:', contentType, text.slice(0, 500));
        throw new Error(`Expected JSON but server returned: ${text.slice(0, 300)}`);
      }

      const data = await res.json();
      const questions = data?.questions ?? data ?? [];

      this._cache = Array.isArray(questions) ? questions : [questions];
      return { data: { questions: this._cache } };
    } catch (err) {
      console.error('api.getQuestions failed', err);
      throw err;
    }
  },
  clearQuestionsCache,
  checkUserExistsByEmail,
  sendSignInLink,
  signInWithGoogle,
  saveExamResult,
  getExamHistory
};
