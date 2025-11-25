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
      setStatus("Check your email for a sign-up link.");
    } catch (err) {
      console.error("sendSignInLink failed", err);
      if ((err?.message || "").toLowerCase().includes("quota")) {
        setStatus("Daily email quota exceeded. Try \"Sign in with Google\" or come back later.");
      } else {
        setStatus("Failed to send sign-up link: " + (err?.message || err));
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
      // existing registration logic
    } catch (err) {
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
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Join our exam portal platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
          {/* scrolling notice */}
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
                  padding: "8px 0",
                  color: "#991b1b",
                  fontSize: "0.875rem",
                  animation: "marqueeRTL 14s linear infinite",
                  willChange: "transform",
                }}
              >
                Note: sometimes you will not receive email links — please sign up using Google if that happens.
              </div>
            </div>
          </div>

          {status && <div className="text-sm text-green-700 bg-green-50 p-3 rounded">{status}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm" 
              placeholder="Your full name" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm" 
              placeholder="you@example.com" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 sm:py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base sm:text-sm"
          >
            {loading ? "Sending..." : "Send Sign-Up Link"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">or</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleSignup} 
          className="w-full py-3 sm:py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors text-base sm:text-sm"
          disabled={loading}
        >
          Sign Up with Google
        </button>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Sign In
          </Link>
        </div>

        {registerError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-700 text-sm mb-3">{registerError}</div>
            <button 
              onClick={() => navigate("/login")} 
              className="w-full px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
