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
      // Check if email exists in Firebase auth
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (!methods || methods.length === 0) {
        // Not registered -> Redirect to Register page with prefilled email
        setStatus("Email not found. Redirecting to Sign up...");
        navigate("/register", { state: { email, fromLogin: true } });
        return;
      }

      // Email exists in the system — do NOT send a sign-in link.
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
      // Google sign-in: direct provider sign-in; do not send email link
      await googleSignIn();
      navigate("/dashboard");
    } catch (err) {
      setStatus("Google sign-in failed: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  // small helper: navigate to Register page, pass current email to prefill and mark fromLogin
  const goToRegister = () => {
    navigate("/register", { state: { email, fromLogin: true } });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>

      <form onSubmit={handleSignIn} className="space-y-4 bg-white p-6 rounded shadow">
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

        {status && <div className="text-sm text-red-600">{status}</div>}

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
            placeholder="you@example.com"
          />
        </div>

        <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded">
          {loading ? "Processing..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4 text-center">or</div>

      <div className="mt-4">
        <button onClick={handleGoogle} className="w-full py-2 bg-red-600 text-white rounded">
          Sign in with Google
        </button>
      </div>

      <div className="mt-4 text-center text-sm">
        <span>Don't have an account? </span>
        <button
          type="button"
          onClick={goToRegister}
          className="text-blue-600 hover:underline"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
