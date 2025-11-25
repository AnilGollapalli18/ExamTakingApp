import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isSignInWithEmailLink } from "firebase/auth";
import { auth } from "../services/firebase";
import { checkUserExistsByEmail, sendSignInLink, signInWithGoogle } from "../services/api";
import { fetchSignInMethodsForEmail } from "firebase/auth";

export default function Login(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const { currentUser, completeSignIn, signInWithGoogle: googleSignIn, sendSignInLink } = useAuth();

  useEffect(() => {
    const url = window.location.href;
    if (isSignInWithEmailLink(auth, url)) {
      setStatus("Completing sign-in...");
      completeSignIn(url)
        .then(() => {
          setStatus("Signed in");
          navigate("/");
        })
        .catch((err) => {
          console.error(err);
          setStatus("Failed to complete sign-in: " + err.message);
        });
    }
  }, [completeSignIn, navigate]);

  if (currentUser) return <Navigate to="/" replace />;

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (!methods || methods.length === 0) {
        setStatus("Email not found. Redirecting to Sign up...");
        navigate("/register", { state: { email, fromLogin: true } });
        return;
      }

      setStatus("Email already registered. Redirecting to dashboard...");
      navigate("/dashboard");
    } catch (err) {
      setStatus("Sign-in failed: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(e) {
    e?.preventDefault?.();
    setLoading(true);
    setStatus("");
    try {
      await googleSignIn();
      navigate("/dashboard");
    } catch (err) {
      setStatus("Google sign-in failed: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  const goToRegister = () => {
    navigate("/register", { state: { email, fromLogin: true } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Sign in to your exam portal account</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
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
                Note: sometimes you will not receive email links — please sign in using Google if that happens.
              </div>
            </div>
          </div>

          {status && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{status}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Processing..." : "Sign In"}
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
          onClick={handleGoogle} 
          className="w-full py-3 sm:py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors text-base sm:text-sm"
          disabled={loading}
        >
          Sign In with Google
        </button>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <button
            type="button"
            onClick={goToRegister}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
