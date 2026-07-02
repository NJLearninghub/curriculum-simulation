import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, testFirebaseConnection } from "./lib/firebase";
import { UserProfile } from "./types";
import AuthScreen from "./components/AuthScreen";
import CurriculumViewer from "./components/CurriculumViewer";
import AdminDashboard from "./components/AdminDashboard";
import { LogOut, Shield, GraduationCap, Sparkles, Terminal, Activity, RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  // 1. Connection Test & Auth Observer
  useEffect(() => {
    // Run connection test on boot
    testFirebaseConnection().then(() => {
      setConnectionTested(true);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Fetch additional profile data (e.g. role) from Firestore
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Fallback profile if the doc is missing
            const role = firebaseUser.email?.toLowerCase() === "janinihal7@gmail.com" ? "admin" : "student";
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role,
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          // Standard student fallback
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            role: "student",
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAdminOpen(false);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Auth screen state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-slate-300 font-sans">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <p className="text-xs font-mono mt-4 tracking-widest text-slate-500 uppercase">Connecting to Portal...</p>
      </div>
    );
  }

  // Not signed in -> render AuthScreen
  if (!user || !profile) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 flex flex-col font-sans">
      {/* Visual Ambient Background Lines */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-600/5 via-transparent to-transparent pointer-events-none z-0"></div>

      {/* Primary Header Navbar - Compact/Dense (h-12 style) */}
      <header id="app-header" className="border-b border-slate-800 bg-[#1E293B] relative z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-950/40">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold tracking-tight text-white">SimuCurric</h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded font-mono text-[9px] text-indigo-300 font-bold uppercase">
                  v4.0
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono hidden sm:block">Interactive Curriculum Simulation Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Info Tag - Compact */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                isAdmin 
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20" 
                  : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
              }`}>
                {profile.role}
              </div>
              <div className="hidden md:block text-right text-[10px]">
                <div className="font-semibold text-slate-200">{profile.email}</div>
                <div className="text-[8px] text-slate-500 font-mono">UID: {profile.uid.substring(0, 6)}</div>
              </div>
            </div>

            {/* Admin Hub Shortcut Toggle */}
            {isAdmin && (
              <button
                onClick={() => setAdminOpen(true)}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" /> Admin Hub
              </button>
            )}

            {/* Logout trigger */}
            <button
              onClick={handleSignOut}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Learning Dashboard Viewport */}
      <main className="flex-1 relative z-40 p-4 bg-slate-900/40">
        <CurriculumViewer
          currentUserEmail={profile.email}
          isAdmin={isAdmin}
          onOpenAdmin={() => setAdminOpen(true)}
        />
      </main>

      {/* Footer System Credits - Styled as High Density Status Bar */}
      {isAdmin && (
        <footer className="h-6 bg-indigo-800 flex items-center px-4 justify-between shrink-0 text-[10px] font-mono border-t border-indigo-900 relative z-20">
          <div className="flex gap-4 items-center">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"></span>
              SYSTEM STATUS: OPTIMAL
            </div>
            <div className="text-indigo-200 hidden sm:block">DB LATENCY: 12ms</div>
          </div>
          <div className="text-indigo-100 uppercase tracking-tighter">
            Firebase Instance: ai-studio-37d9b36b-8281-44bc-bfcc-f633171e3bd7
          </div>
        </footer>
      )}

      {/* Admin Dashboard Overlay Portal */}
      {adminOpen && (
        <AdminDashboard
          currentUserEmail={profile.email}
          onClose={() => setAdminOpen(false)}
        />
      )}
    </div>
  );
}
