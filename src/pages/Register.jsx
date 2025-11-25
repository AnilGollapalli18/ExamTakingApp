import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signInWithGoogle } from "../services/api";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefillEmail = location.state?.email || "";
  const fromGoogle = !!location.state?.fromGoogle;
  const fromLogin = !!location.state?.fromLogin;

  const [email, setEmail] = useState(prefillEmail);
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const { currentUser, sendSignInLink } = useAuth();

  useEffect(() => {
    // if came from Google sign-in flow and user is already authenticated, let them set name
    if (fromGoogle && currentUser) {
      setEmail(currentUser.email || "");
      setDisplayName(currentUser.displayName || "");
    }
  }, [fromGoogle, currentUser]);

  if (currentUser && !fromGoogle) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const res = await sendSignInLink(email, displayName);
      setStatus("Check your email for a sign-in link.");
    } catch (err) {
      console.error("sendSignInLink failed", err);
      if ((err?.message || "").toLowerCase().includes("quota")) {
        setStatus("Daily email quota exceeded. Try \"Sign in with Google\" or come back later.");
      } else {
        setStatus("Failed to send sign-in link: " + (err?.message || err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      // if user provided a displayName in the form, write it to profile + users collection
      if (displayName) {
        try {
          await updateProfile(auth.currentUser, { displayName });
          const userRef = doc(db, "users", auth.currentUser.uid);
          await setDoc(userRef, { name: displayName }, { merge: true, serverTimestamp: serverTimestamp() });
        } catch (err) {
          console.warn("Failed to set displayName after Google sign-in:", err);
        }
      }
      navigate("/");
    } catch (err) {
      console.error(err);
      setStatus("Google sign-up failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(evt) {
    evt?.preventDefault?.();
    setRegisterError("");
    try {
      // ...existing registration logic calling firebase createUserWithEmailAndPassword or similar...
      // e.g.
      // await auth.createUserWithEmailAndPassword(email, password);
    } catch (err) {
      // Detect Firebase "email already in use" and surface friendly message
      const code = err?.code || "";
      const message = err?.message || String(err);
      if (code === "auth/email-already-in-use" || /already.*in use/i.test(message) || /email.*already/i.test(message)) {
        setRegisterError("An account with that email already exists. Please log in instead.");
      } else {
        setRegisterError(message);
      }
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Register</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        {/* scrolling notice: sits INSIDE the bordered form, above the Email input */}
        <div style={{ overflow: "hidden", borderRadius: 6, marginBottom: 8 }}>
          <style>{`
            @keyframes marqueeRTL {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
          <div style={{ whiteSpace: "nowrap", display: "block" }}>
            <div
              aria-live="polite"
              style={{
                display: "inline-block",
                padding: "10px 0",
                color: "#991b1b",
                animation: "marqueeRTL 14s linear infinite",
                willChange: "transform",
              }}
            >
              Note: sometimes you will not receive email links — please sign in using Google if that happens.
            </div>
          </div>
        </div>

        {status && <div className="text-sm text-green-700">{status}</div>}

        <div>
          <label className="block text-sm mb-1">Full name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full p-2 border rounded" placeholder="Your full name" />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded" placeholder="you@example.com" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded">
          {loading ? "Sending..." : "Send sign-up link"}
        </button>

        <div className="mt-4 text-center">or</div>

        <div className="mt-4">
          <button onClick={handleGoogleSignup} className="w-full py-2 bg-red-600 text-white rounded">
            Sign up with Google
          </button>
        </div>

        <div className="text-center mt-3">
          <span className="text-sm text-gray-600">Already have an account? </span>
          <Link to="/login" className="text-blue-600 text-sm font-medium">Sign in</Link>
        </div>
      </form>

      {registerError && (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: "#b91c1c", background: "#fff1f2", border: "1px solid #fecaca", padding: 10, borderRadius: 6 }}>
            {registerError}
          </div>
          {/* Offer quick navigation to login when the account already exists */}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => navigate("/login")} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db" }}>
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
