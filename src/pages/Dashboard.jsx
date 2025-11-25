import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { examAPI } from '../services/api';
import { auth as firebaseAuth } from '../services/firebase';
import { Play, Clock, BookOpen, Award, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // use hooks defensively in case their shape differs
  const auth = useAuth();
  const examCtx = useExam();
  const user = auth?.user ?? null;

  // ensure authUser exists early so it can be referenced safely later
  const authUser = auth?.currentUser ?? auth?.user ?? null;
  const uid = authUser?.uid ?? user?.uid ?? null;
  
  // do not assume one exact name for sign-out; detect common variations
  // auth context exposes signOut alias (we ensured it in AuthContext)
  const signOutFn = typeof auth?.signOut === 'function' ? auth.signOut : (typeof auth?.logout === 'function' ? auth.logout : null);
  const resetExam = typeof examCtx?.resetExam === 'function' ? examCtx.resetExam : null;
  const setQuestions = typeof examCtx?.setQuestions === 'function' ? examCtx.setQuestions : null;
  const setExamStarted = typeof examCtx?.setExamStarted === 'function' ? examCtx.setExamStarted : null;
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // --- Profile name edit state ---
  const [headerName, setHeaderName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  // password set state for profile dropdown
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  // Ensure sign-out always awaits the auth signOut and then redirects
  const handleSignOut = async () => {
    setProfileOpen(false);
    setError('');
    try {
      if (signOutFn && typeof signOutFn === 'function') {
        await Promise.resolve(signOutFn());
      } else {
        // final fallback: clear storage then navigate
        try { localStorage.removeItem('authToken'); } catch (_) {}
        try { sessionStorage.removeItem('authToken'); } catch (_) {}
      }
    } catch (err) {
      console.error('Sign out failed', err);
      setError('Sign out failed. Please try again.');
      return;
    }
    navigate('/login');
  };

  /** ---- START REAL EXAM ---- **/
  const startRealExam = async (openInNewTab = false) => {
    setLoading(true);
    setError('');
    try {
      if (typeof resetExam === 'function') resetExam();

      // Force fresh fetch via examAPI helper in src/services/api.js
      const questions = await examAPI.getQuestions(10, { force: true }).then(r => r?.data?.questions ?? r?.questions ?? r);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No questions returned from server.');
      }

      if (examCtx && typeof examCtx.setQuestions === 'function' && typeof examCtx.setExamStarted === 'function') {
        examCtx.setQuestions(questions);
        examCtx.setExamStarted(true);
      } else {
        // fallback: store in sessionStorage so /exam can read them
        try {
          sessionStorage.setItem('pendingExamQuestions', JSON.stringify(questions));
          sessionStorage.setItem('pendingExamStarted', '1');
        } catch (e) {
          console.error('Failed to save questions to sessionStorage', e);
        }
      }

      navigate('/exam');
    } catch (err) {
      console.error('startRealExam error:', err);
      setError(err?.message || 'Failed to load exam questions');
    } finally {
      setLoading(false);
    }
  };

  // open sample questions route in the same SPA (same tab)
  const openSamplePage = () => {
    navigate('/sample'); // change to '/preview' if your route is named differently
  };

  /** ---- CLICK PROFILE OUTSIDE CLOSE ---- **/
  useEffect(() => {
    function onDocClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // headerName initialized from auth profile or user object or localStorage fallback
  useEffect(() => {
    const fromAuth = (authUser?.displayName && authUser.displayName.trim() !== '') ? authUser.displayName : (user?.displayName || user?.username || '');
    const persisted = uid ? localStorage.getItem(`profileDisplayName_${uid}`) : null;
    const chosen = persisted || fromAuth || (user?.email ? user.email.split('@')[0] : 'User');
    setHeaderName(chosen);
    setEditingName(chosen);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.displayName, user?.displayName, uid]);

  const avatarLetter = (headerName && headerName.charAt(0).toUpperCase()) || 'U';

  const profileDisplayName = headerName;

  // Save profile display name (try AuthContext helper, Firebase SDK, then persist locally)
  const saveProfileName = async () => {
    if (!editingName || savingName) return;
    setSavingName(true);
    try {
      // 1) prefer auth.updateProfile if provided by context
      if (auth && typeof auth.updateProfile === 'function') {
        await auth.updateProfile({ displayName: editingName });
      } else if (firebaseAuth && firebaseAuth.currentUser && typeof firebaseAuth.currentUser.updateProfile === 'function') {
        await firebaseAuth.currentUser.updateProfile({ displayName: editingName });
      } else if (auth && typeof auth.setUserName === 'function') {
        await auth.setUserName(editingName);
      } else {
        // fallback: persist locally keyed by uid
        if (uid) localStorage.setItem(`profileDisplayName_${uid}`, editingName);
      }
      setHeaderName(editingName);
      setProfileOpen(false);
    } catch (e) {
      console.warn('Failed to save profile name', e);
      // still update locally so UI reflects change
      if (uid) localStorage.setItem(`profileDisplayName_${uid}`, editingName);
      setHeaderName(editingName);
      setProfileOpen(false);
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    setPasswordMsg("");
    if (!newPassword || !confirmPassword) {
      setPasswordMsg("Enter and confirm a password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters.");
      return;
    }

    if (!firebaseAuth || !firebaseAuth.currentUser) {
      setPasswordMsg("Unable to set password: auth backend not available.");
      return;
    }

    setSavingPassword(true);
    try {
      // Prefer SDK updatePassword if available
      if (typeof firebaseAuth.currentUser.updatePassword === "function") {
        await firebaseAuth.currentUser.updatePassword(newPassword);
      } else if (typeof firebaseAuth.updatePassword === "function") {
        // firebase v9 modular: updatePassword(auth.currentUser, newPassword)
        await firebaseAuth.updatePassword(firebaseAuth.currentUser, newPassword);
      } else {
        throw new Error("Auth SDK does not support password update in this build.");
      }

      // Persist a local hint (optional) and show success
      if (uid) localStorage.setItem(`profilePasswordSet_${uid}`, "1");
      setPasswordMsg("Password saved. You can now sign in using email and this password.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/requires-recent-login" || /requires recent/i.test(String(err))) {
        setPasswordMsg("Security: please re-authenticate (sign out and sign in again) and try saving the password.");
      } else {
        setPasswordMsg(err?.message || String(err));
      }
    } finally {
      setSavingPassword(false);
    }
  };

  // ensure UI shows full name where appropriate (use displayName, not avatarLetter)

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Welcome back, {headerName}!</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Ready to test your knowledge? Start a new exam or review your progress.
            </p>
          </div>

          {/* Profile dropdown */}
          <div className="relative w-full sm:w-auto" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((s) => !s)}
              className="w-full sm:w-auto flex items-center gap-2 sm:gap-3 bg-white border rounded-full px-3 sm:px-4 py-2 sm:py-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
                {avatarLetter}
              </div>
              <span className="text-sm text-gray-700 truncate">{headerName}</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-3 sm:p-4 border-b">
                  <div className="text-sm font-medium truncate">{profileDisplayName}</div>
                  <div className="text-xs text-gray-500 truncate mt-1">{authUser?.email ?? user?.email ?? "—"}</div>
                </div>
                <div className="p-3 sm:p-4 space-y-3 max-h-96 overflow-y-auto">
                  {/* Inline editable name */}
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Your name</label>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter name to display"
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={saveProfileName}
                        disabled={savingName}
                        className="flex-1 text-xs sm:text-sm px-3 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
                      >
                        {savingName ? 'Saving...' : 'Save Name'}
                      </button>
                      <button
                        onClick={() => { setEditingName(headerName); }}
                        className="flex-1 text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Password setup */}
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Email</label>
                    <div className="text-sm text-gray-700 truncate mt-1">{authUser?.email ?? user?.email ?? "—"}</div>
                    <label className="text-xs text-gray-500 font-medium mt-3 block">Set / Save Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full p-2 border border-gray-300 rounded mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full p-2 border border-gray-300 rounded mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={savePassword}
                        disabled={savingPassword}
                        className="flex-1 text-xs sm:text-sm px-3 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
                      >
                        {savingPassword ? 'Saving...' : 'Save Password'}
                      </button>
                      <button
                        onClick={() => { setNewPassword(''); setConfirmPassword(''); setPasswordMsg(''); }}
                        className="flex-1 text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    {passwordMsg && <div style={{ marginTop: 8, fontSize: '0.75rem', color: passwordMsg.startsWith("Password saved") ? "#065f46" : "#b91c1c" }}>{passwordMsg}</div>}
                  </div>

                  <div className="border-t pt-3">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded font-medium text-sm transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
             </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

          {/* Start Exam */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Play className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
              Start New Exam
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Begin a 30-minute exam with 15 randomized questions.
            </p>

            <button
              type="button"
              onClick={() => navigate('/sample')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
            >
              {loading ? 'Loading...' : 'Start Exam'}
            </button>
          </div>

          {/* Exam Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border-t-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Exam Information</h2>
            <ul className="text-gray-600 space-y-2 text-sm sm:text-base">
              <li>Duration: 30 minutes</li>
              <li>Questions: 15 MCQs</li>
              <li>Auto-submit when time expires</li>
              <li>Passing grade: 60%</li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border-t-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Exam Tips</h2>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>Read each question carefully</li>
              <li>Review answers before submitting</li>
              <li>Keep track of time</li>
            </ul>
          </div>

        </div>

        {/* History + Achievements */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button
            onClick={() => navigate('/history')}
            className="bg-white hover:bg-gray-50 rounded-xl shadow-lg p-6 text-left transition-colors border hover:shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">View Exam History</h3>
                <p className="text-sm sm:text-base text-gray-600 truncate">Check your past performance</p>
              </div>
            </div>
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6 border hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Achievements</h3>
                <p className="text-sm sm:text-base text-gray-600">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ensure no inline SamplePreview component is rendered inside Dashboard — Start Exam must open the sample page instead
export default Dashboard;




// import React, { useEffect, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { useExam } from '../contexts/ExamContext';
// import { examAPI } from '../services/api';
// import { auth as firebaseAuth } from '../services/firebase';
// import { Play, Clock, BookOpen, Award, TrendingUp } from 'lucide-react';
// import LoadingSpinner from '../components/UI/LoadingSpinner';

// const Dashboard = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   // use hooks defensively in case their shape differs
//   const auth = useAuth();
//   const examCtx = useExam();
//   const user = auth?.user ?? null;

//   // ensure authUser exists early so it can be referenced safely later
//   const authUser = auth?.currentUser ?? auth?.user ?? null;
//   const uid = authUser?.uid ?? user?.uid ?? null;
  
//   // do not assume one exact name for sign-out; detect common variations
//   // auth context exposes signOut alias (we ensured it in AuthContext)
//   const signOutFn = typeof auth?.signOut === 'function' ? auth.signOut : (typeof auth?.logout === 'function' ? auth.logout : null);
//   const resetExam = typeof examCtx?.resetExam === 'function' ? examCtx.resetExam : null;
//   const setQuestions = typeof examCtx?.setQuestions === 'function' ? examCtx.setQuestions : null;
//   const setExamStarted = typeof examCtx?.setExamStarted === 'function' ? examCtx.setExamStarted : null;
//   const navigate = useNavigate();
//   const [profileOpen, setProfileOpen] = useState(false);
//   const profileRef = useRef(null);

//   // --- Profile name edit state ---
//   const [headerName, setHeaderName] = useState('');
//   const [editingName, setEditingName] = useState('');
//   const [savingName, setSavingName] = useState(false);
//   // password set state for profile dropdown
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [savingPassword, setSavingPassword] = useState(false);
//   const [passwordMsg, setPasswordMsg] = useState('');

//   // Ensure sign-out always awaits the auth signOut and then redirects
//   const handleSignOut = async () => {
//     setProfileOpen(false);
//     setError('');
//     try {
//       if (signOutFn && typeof signOutFn === 'function') {
//         await Promise.resolve(signOutFn());
//       } else {
//         // final fallback: clear storage then navigate
//         try { localStorage.removeItem('authToken'); } catch (_) {}
//         try { sessionStorage.removeItem('authToken'); } catch (_) {}
//       }
//     } catch (err) {
//       console.error('Sign out failed', err);
//       setError('Sign out failed. Please try again.');
//       return;
//     }
//     navigate('/login');
//   };

//   /** ---- START REAL EXAM ---- **/
//   const startRealExam = async (openInNewTab = false) => {
//     setLoading(true);
//     setError('');
//     try {
//       if (typeof resetExam === 'function') resetExam();

//       // Force fresh fetch via examAPI helper in src/services/api.js
//       const questions = await examAPI.getQuestions(10, { force: true }).then(r => r?.data?.questions ?? r?.questions ?? r);

//       if (!Array.isArray(questions) || questions.length === 0) {
//         throw new Error('No questions returned from server.');
//       }

//       if (examCtx && typeof examCtx.setQuestions === 'function' && typeof examCtx.setExamStarted === 'function') {
//         examCtx.setQuestions(questions);
//         examCtx.setExamStarted(true);
//       } else {
//         // fallback: store in sessionStorage so /exam can read them
//         try {
//           sessionStorage.setItem('pendingExamQuestions', JSON.stringify(questions));
//           sessionStorage.setItem('pendingExamStarted', '1');
//         } catch (e) {
//           console.error('Failed to save questions to sessionStorage', e);
//         }
//       }

//       navigate('/exam');
//     } catch (err) {
//       console.error('startRealExam error:', err);
//       setError(err?.message || 'Failed to load exam questions');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // open sample questions route in the same SPA (same tab)
//   const openSamplePage = () => {
//     navigate('/sample'); // change to '/preview' if your route is named differently
//   };

//   /** ---- CLICK PROFILE OUTSIDE CLOSE ---- **/
//   useEffect(() => {
//     function onDocClick(e) {
//       if (!profileRef.current) return;
//       if (!profileRef.current.contains(e.target)) setProfileOpen(false);
//     }
//     document.addEventListener('mousedown', onDocClick);
//     return () => document.removeEventListener('mousedown', onDocClick);
//   }, []);

//   // Prefer showing the Google/Firebase displayName in the profile dropdown
//   const profileDisplayName = authUser?.displayName && authUser.displayName.trim() !== ""
//     ? authUser.displayName
//     : headerName;

//   // headerName initialized from auth profile or user object or localStorage fallback
//   useEffect(() => {
//   //   const fromAuth = (authUser?.displayName && authUser.displayName.trim() !== '') ? authUser.displayName : (user?.displayName || user?.username || '');
//   //   const persisted = uid ? localStorage.getItem(`profileDisplayName_${uid}`) : null;
//   //   const chosen = persisted || fromAuth || (user?.email ? user.email.split('@')[0] : 'User');
//   //   setHeaderName(chosen);
//   //   setEditingName(chosen);
//   // // eslint-disable-next-line react-hooks/exhaustive-deps
//   // }, [authUser?.displayName, user?.displayName, uid]);
//   // useEffect(() => {
//   // pick the first available email (authUser preferred, then user)
//   const email = authUser?.email || user?.email || '';

//   // derive the part before @ (if you prefer full email, use `email` directly)
//   const emailUsername = email.includes('@') ? email.split('@')[0] : (email || 'User');

//   // ensure unique key per user (backticks are required)
//   const persisted = uid ? localStorage.getItem(`profileDisplayName_${uid}`) : null;

//   // prefer persisted value for this uid, otherwise use email username
//   const chosen = persisted || emailUsername;

//   setHeaderName(chosen);
//   setEditingName(chosen);

// // update deps to include uid and the email fields we use
// // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [authUser?.email, user?.email, uid]);


//   const avatarLetter = (headerName && headerName.charAt(0).toUpperCase()) || 'U';

//   const profileDisplayName = headerName;

//   // Save profile display name (try AuthContext helper, Firebase SDK, then persist locally)
//   const saveProfileName = async () => {
//     if (!editingName || savingName) return;
//     setSavingName(true);
//     try {
//       // 1) prefer auth.updateProfile if provided by context
//       if (auth && typeof auth.updateProfile === 'function') {
//         await auth.updateProfile({ displayName: editingName });
//       } else if (firebaseAuth && firebaseAuth.currentUser && typeof firebaseAuth.currentUser.updateProfile === 'function') {
//         await firebaseAuth.currentUser.updateProfile({ displayName: editingName });
//       } else if (auth && typeof auth.setUserName === 'function') {
//         await auth.setUserName(editingName);
//       } else {
//         // fallback: persist locally keyed by uid
//         if (uid) localStorage.setItem(`profileDisplayName_${uid}`, editingName);
//       }
//       setHeaderName(editingName);
//       setProfileOpen(false);
//     } catch (e) {
//       console.warn('Failed to save profile name', e);
//       // still update locally so UI reflects change
//       if (uid) localStorage.setItem(`profileDisplayName_${uid}`, editingName);
//       setHeaderName(editingName);
//       setProfileOpen(false);
//     } finally {
//       setSavingName(false);
//     }
//   };

//   const savePassword = async () => {
//     setPasswordMsg("");
//     if (!newPassword || !confirmPassword) {
//       setPasswordMsg("Enter and confirm a password.");
//       return;
//     }
//     if (newPassword !== confirmPassword) {
//       setPasswordMsg("Passwords do not match.");
//       return;
//     }
//     if (newPassword.length < 6) {
//       setPasswordMsg("Password must be at least 6 characters.");
//       return;
//     }

//     if (!firebaseAuth || !firebaseAuth.currentUser) {
//       setPasswordMsg("Unable to set password: auth backend not available.");
//       return;
//     }

//     setSavingPassword(true);
//     try {
//       // Prefer SDK updatePassword if available
//       if (typeof firebaseAuth.currentUser.updatePassword === "function") {
//         await firebaseAuth.currentUser.updatePassword(newPassword);
//       } else if (typeof firebaseAuth.updatePassword === "function") {
//         // firebase v9 modular: updatePassword(auth.currentUser, newPassword)
//         await firebaseAuth.updatePassword(firebaseAuth.currentUser, newPassword);
//       } else {
//         throw new Error("Auth SDK does not support password update in this build.");
//       }

//       // Persist a local hint (optional) and show success
//       if (uid) localStorage.setItem(`profilePasswordSet_${uid}`, "1");
//       setPasswordMsg("Password saved. You can now sign in using email and this password.");
//       setNewPassword("");
//       setConfirmPassword("");
//     } catch (err) {
//       const code = err?.code || "";
//       if (code === "auth/requires-recent-login" || /requires recent/i.test(String(err))) {
//         setPasswordMsg("Security: please re-authenticate (sign out and sign in again) and try saving the password.");
//       } else {
//         setPasswordMsg(err?.message || String(err));
//       }
//     } finally {
//       setSavingPassword(false);
//     }
//   };

//   // ensure UI shows full name where appropriate (use displayName, not avatarLetter)

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

//         {/* Header */}
//         <div className="mb-8 flex items-start justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Welcome back, {headerName}!</h1>
//             <p className="mt-2 text-gray-600">
//               Ready to test your knowledge? Start a new exam or review your progress.
//             </p>
//           </div>

//           {/* Profile dropdown */}
//           <div className="relative" ref={profileRef}>
//             <button
//               onClick={() => setProfileOpen((s) => !s)}
//               className="flex items-center gap-3 bg-white border rounded-full px-3 py-1 shadow-sm hover:shadow-md"
//             >
//               <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-700">
//                 {avatarLetter}
//               </div>
//               <span className="text-sm text-gray-700 truncate" style={{ maxWidth: 140 }}>
//                 {headerName}
//               </span>
//             </button>

//             {profileOpen && (
//               <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50">
//                 <div className="p-4 border-b">
//                   <div className="text-sm font-medium truncate">{profileDisplayName}</div>
//                   <div className="text-xs text-gray-500 truncate" style={{ marginTop: 4 }}>{authUser?.email ?? user?.email ?? "—"}</div>
//                 </div>
//                 <div className="p-3 space-y-2">
//                   {/* Inline editable name */}
//                   <div>
//                     <label className="text-xs text-gray-500">Your name</label>
//                     <input
//                       value={editingName}
//                       onChange={(e) => setEditingName(e.target.value)}
//                       className="w-full p-2 border rounded mt-1"
//                       placeholder="Enter name to display"
//                     />
//                     <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
//                       <button
//                         onClick={saveProfileName}
//                         disabled={savingName}
//                         className="flex-1 text-sm px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
//                       >
//                         {savingName ? 'Saving...' : 'Save Name'}
//                       </button>
//                       <button
//                         onClick={() => { setEditingName(headerName); }}
//                         className="flex-1 text-sm px-3 py-2 border rounded"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </div>

//                   {/* Password setup: enter & confirm password, then Save */}
//                   <div>
//                     {/* <label className="text-xs text-gray-500">Email</label>
//                     <div className="text-sm text-gray-700 truncate" style={{ marginTop: 4 }}>{user?.email ?? "—"}</div> */}
//                     <label className="text-xs text-gray-500" style={{ marginTop: 10, display: "block" }}>Set / Save Password</label>
//                     <input
//                       type="password"
//                       value={newPassword}
//                       onChange={(e) => setNewPassword(e.target.value)}
//                       placeholder="Enter password"
//                       className="w-full p-2 border rounded mt-1"
//                     />
//                     <input
//                       type="password"
//                       value={confirmPassword}
//                       onChange={(e) => setConfirmPassword(e.target.value)}
//                       placeholder="Re-enter password"
//                       className="w-full p-2 border rounded mt-2"
//                     />
//                     <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
//                       <button
//                         onClick={savePassword}
//                         disabled={savingPassword}
//                         className="flex-1 text-sm px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
//                       >
//                         {savingPassword ? 'Saving...' : 'Save Password'}
//                       </button>
//                       <button
//                         onClick={() => { setNewPassword(''); setConfirmPassword(''); setPasswordMsg(''); }}
//                         className="flex-1 text-sm px-3 py-2 border rounded"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                     {passwordMsg && <div style={{ marginTop: 8, fontSize: 13, color: passwordMsg.startsWith("Password saved") ? "#065f46" : "#b91c1c" }}>{passwordMsg}</div>}
//                   </div>

//                   <div>
//                     <button
//                       onClick={handleSignOut}
//                       className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50 rounded"
//                     >
//                       Sign Out
//                     </button>
//                   </div>
//                 </div>
//              </div>
//             )}
//           </div>
//         </div>

//         {/* Error */}
//         {error && (
//           <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
//             {error}
//           </div>
//         )}

//         {/* CARDS */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

//           {/* Start Exam */}
//           <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-500">
//             <div className="flex items-center justify-between mb-6">
//               <div className="p-3 bg-blue-100 rounded-full">
//                 <Play className="h-8 w-8 text-blue-600" />
//               </div>
//             </div>
//             <h2 className="text-xl font-semibold text-gray-900 mb-3">
//               Start New Exam
//             </h2>
//             <p className="text-gray-600 mb-6">
//               Begin a 30-minute exam with 15 randomized questions.
//             </p>

//             {/* 🔵 Open PREVIEW PAGE */}
//             <button
//               type="button"
//               onClick={() => navigate('/sample')} // navigate to sample page in same tab (SPA)
//               disabled={loading}
//               className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
//             >
//               {loading ? 'Loading...' : 'Start Exam'}
//             </button>
//             {/* If you want a separate real exam button, you can add:
//               <button onClick={() => startRealExam(false)}>Start Real Exam</button>
//             */}
//           </div>

//           {/* Exam Information */}
//           <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-green-500">
//             <div className="flex items-center mb-6">
//               <div className="p-3 bg-green-100 rounded-full"> 
//                 <Clock className="h-8 w-8 text-green-600" />
//               </div>
//             </div>
//             <h2 className="text-xl font-semibold text-gray-900 mb-3">Exam Information</h2>
//             <ul className="text-gray-600 space-y-2">
//               <li>Duration: 30 minutes</li>
//               <li>Questions: 15 MCQs</li>
//               <li>Auto-submit when time expires</li>
//               <li>Passing grade: 60%</li>
//             </ul>
//           </div>

//           {/* Tips */}
//           <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-purple-500">
//             <div className="flex items-center mb-6">
//               <div className="p-3 bg-purple-100 rounded-full">
//                 <BookOpen className="h-8 w-8 text-purple-600" />
//               </div>
//             </div>
//             <h2 className="text-xl font-semibold text-gray-900 mb-3">Exam Tips</h2>
//             <ul className="text-gray-600 space-y-2 text-sm">
//               <li>Read each question carefully</li>
//               <li>Review answers before submitting</li>
//               <li>Keep track of time</li>
//             </ul>
//           </div>

//         </div>

//         {/* History + Achievements */}
//         <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
//           <button
//             onClick={() => navigate('/history')}
//             className="bg-white hover:bg-gray-50 rounded-xl shadow-lg p-6 text-left transition-colors border"
//           >
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-orange-100 rounded-full">
//                 <TrendingUp className="h-6 w-6 text-orange-600" />
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900">View Exam History</h3>
//                 <p className="text-gray-600">Check your past performance</p>
//               </div>
//             </div>
//           </button>

//           <div className="bg-white rounded-xl shadow-lg p-6 border">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-yellow-100 rounded-full">
//                 <Award className="h-6 w-6 text-yellow-600" />
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
//                 <p className="text-gray-600">Coming soon...</p>
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// // ensure no inline SamplePreview component is rendered inside Dashboard — Start Exam must open the sample page instead
// export default Dashboard;