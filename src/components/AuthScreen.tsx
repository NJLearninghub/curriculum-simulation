import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { LogIn, UserPlus, Info, AlertCircle } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Register user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Auto assign admin role to janinihal7@gmail.com, student to others
        const role = email.toLowerCase() === "janinihal7@gmail.com" ? "admin" : "student";

        // Save user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          role,
          createdAt: new Date().toISOString()
        });

        setInfoMessage(`Account created successfully! Signed in as ${role}.`);
      } else {
        // Login user
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if profile exists, otherwise create it
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const role = user.email?.toLowerCase() === "janinihal7@gmail.com" ? "admin" : "student";
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          role,
          createdAt: new Date().toISOString()
        });
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      setError(
        "Google authentication failed. Note: Popups may be blocked inside the AI Studio iframe. Please use email & password login or open the app in a new tab."
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick dev logins that auto-provision the accounts if missing
  const handleQuickLogin = async (targetEmail: string) => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    const defaultPassword = "password123";

    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, targetEmail, defaultPassword);
      onAuthSuccess();
    } catch (err: any) {
      // If user does not exist, create them!
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, targetEmail, defaultPassword);
          const user = userCredential.user;
          const role = targetEmail.toLowerCase() === "janinihal7@gmail.com" ? "admin" : "student";

          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            role,
            createdAt: new Date().toISOString()
          });
          onAuthSuccess();
        } catch (createErr: any) {
          setError(`Developer quick login failed: ${createErr.message}`);
        }
      } else {
        setError(`Developer quick login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4 font-sans text-slate-300">
      <div className="w-full max-w-sm bg-[#1E293B] border border-slate-800 rounded-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-6">
          <div className="inline-flex p-2.5 bg-indigo-500/10 rounded text-indigo-400 mb-2 border border-indigo-500/20">
            <LogIn className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">Curriculum & Simulation Portal</h1>
          <p className="text-[10px] text-slate-400 mt-1">
            Secure sign-in via Firebase Authentication
          </p>
        </div>

        {error && error.includes("operation-not-allowed") ? (
          <div className="mb-4 p-3.5 bg-amber-950/40 border border-amber-800/60 rounded text-[11px] text-amber-200 space-y-2">
            <div className="flex items-start gap-2 font-bold text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Email/Password Provider Disabled</span>
            </div>
            <p className="leading-relaxed">
              Firebase Email/Password Authentication is not enabled for your project yet. To enable it:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>
                <a
                  href={`https://console.firebase.google.com/project/${auth.app.options.projectId || "gen-lang-client-0053781770"}/authentication/providers`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline font-bold inline-flex items-center gap-0.5"
                >
                  Click here to open Firebase Console ↗
                </a>
              </li>
              <li>Click <strong>"Add new provider"</strong> and select <strong>"Email/Password"</strong></li>
              <li>Toggle <strong>"Enable"</strong> and click <strong>"Save"</strong></li>
            </ol>
            <p className="text-[10px] text-slate-400 italic">
              Once saved, return here and try the Quick Login or sign in again.
            </p>
          </div>
        ) : error ? (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded flex items-start gap-2 text-[11px] text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {infoMessage && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded flex items-start gap-2 text-[11px] text-emerald-300">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded px-3 py-1.5 text-xs outline-none transition text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded px-3 py-1.5 text-xs outline-none transition text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded text-xs transition shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] text-slate-400 hover:text-white transition underline cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Register"}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#1E293B] px-2 text-slate-500 font-mono">OR</span>
          </div>
        </div>

        {/* Google Sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-200 font-bold py-2 px-3 rounded text-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.5 5.5 0 0 1 8.5 13a5.5 5.5 0 0 1 5.49-5.514c2.254 0 3.881.974 4.743 1.8l3.185-3.185C19.863 4.131 16.963 3 13.99 3A10 10 0 0 0 4 13a10 10 0 0 0 9.99 10c5.523 0 10.01-4.487 10.01-10 0-.61-.054-1.21-.16-1.715H12.24z"
            />
          </svg>
          Sign In with Google
        </button>
      </div>
    </div>
  );
}
