import { useState, useEffect } from "react";
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import {
  Standard,
  Subject,
  Topic,
  Chapter,
  Simulation
} from "../types";
import {
  BookOpen,
  GraduationCap,
  PlayCircle,
  Code,
  Maximize2,
  FolderOpen,
  Clock,
  User,
  Activity,
  Award,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  Globe,
  FileCode,
  Search,
  X,
  Star
} from "lucide-react";

interface CurriculumViewerProps {
  currentUserEmail: string | null;
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export default function CurriculumViewer({
  currentUserEmail,
  isAdmin,
  onOpenAdmin
}: CurriculumViewerProps) {
  // Navigation State
  const [standards, setStandards] = useState<Standard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [selectedStandardId, setSelectedStandardId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  // Loaded simulation state
  const [loadingSim, setLoadingSim] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);
  const [viewCode, setViewCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stats
  const [simulationsCount, setSimulationsCount] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Favorites Collapsible State
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);

  // Bookmark States
  const [bookmarkedChapters, setBookmarkedChapters] = useState<string[]>([]);
  const [bookmarkedTopics, setBookmarkedTopics] = useState<string[]>([]);

  // Load Bookmarks from Firestore & LocalStorage
  useEffect(() => {
    const loadBookmarks = async () => {
      const user = auth.currentUser;
      if (!user) {
        setBookmarkedChapters([]);
        setBookmarkedTopics([]);
        return;
      }

      // Sync user-specific local storage first for instant feedback
      const localChapsKey = `bookmarkedChapters_${user.uid}`;
      const localTopicsKey = `bookmarkedTopics_${user.uid}`;
      const localChaps = localStorage.getItem(localChapsKey);
      const localTopics = localStorage.getItem(localTopicsKey);
      
      setBookmarkedChapters(localChaps ? JSON.parse(localChaps) : []);
      setBookmarkedTopics(localTopics ? JSON.parse(localTopics) : []);

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const chaps = data.bookmarkedChapters || [];
          const topics = data.bookmarkedTopics || [];
          
          setBookmarkedChapters(chaps);
          setBookmarkedTopics(topics);
          
          localStorage.setItem(localChapsKey, JSON.stringify(chaps));
          localStorage.setItem(localTopicsKey, JSON.stringify(topics));
        } else {
          // If no doc exists yet, reset state and local keys
          setBookmarkedChapters([]);
          setBookmarkedTopics([]);
          localStorage.removeItem(localChapsKey);
          localStorage.removeItem(localTopicsKey);
        }
      } catch (err) {
        console.error("Error loading bookmarks from Firestore:", err);
      }
    };
    loadBookmarks();
  }, [currentUserEmail]);

  const toggleBookmarkChapter = async (chapterId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    let newBookmarks = [...bookmarkedChapters];
    if (newBookmarks.includes(chapterId)) {
      newBookmarks = newBookmarks.filter((id) => id !== chapterId);
    } else {
      newBookmarks.push(chapterId);
    }
    setBookmarkedChapters(newBookmarks);
    localStorage.setItem(`bookmarkedChapters_${user.uid}`, JSON.stringify(newBookmarks));

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { bookmarkedChapters: newBookmarks }, { merge: true });
    } catch (err) {
      console.error("Error saving chapter bookmark to Firestore:", err);
    }
  };

  const toggleBookmarkTopic = async (topicId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    let newBookmarks = [...bookmarkedTopics];
    if (newBookmarks.includes(topicId)) {
      newBookmarks = newBookmarks.filter((id) => id !== topicId);
    } else {
      newBookmarks.push(topicId);
    }
    setBookmarkedTopics(newBookmarks);
    localStorage.setItem(`bookmarkedTopics_${user.uid}`, JSON.stringify(newBookmarks));

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { bookmarkedTopics: newBookmarks }, { merge: true });
    } catch (err) {
      console.error("Error saving topic bookmark to Firestore:", err);
    }
  };

  // Fetch all curriculum data
  const loadCurriculum = async () => {
    try {
      const standardsSnap = await getDocs(collection(db, "standards"));
      const subjectsSnap = await getDocs(collection(db, "subjects"));
      const topicsSnap = await getDocs(collection(db, "topics"));
      const chaptersSnap = await getDocs(collection(db, "chapters"));
      const simsSnap = await getDocs(collection(db, "simulations"));

      const standardsList: Standard[] = [];
      standardsSnap.forEach((docSnap) => {
        const std = docSnap.data() as Standard;
        if (std.name.includes("11") || std.name.includes("12")) {
          standardsList.push(std);
        }
      });

      const subjectsList: Subject[] = [];
      subjectsSnap.forEach((docSnap) => subjectsList.push(docSnap.data() as Subject));

      const topicsList: Topic[] = [];
      topicsSnap.forEach((docSnap) => topicsList.push(docSnap.data() as Topic));

      const chaptersList: Chapter[] = [];
      chaptersSnap.forEach((docSnap) => chaptersList.push(docSnap.data() as Chapter));

      setStandards(standardsList.sort((a, b) => a.order - b.order));
      setSubjects(subjectsList.sort((a, b) => a.order - b.order));
      setTopics(topicsList.sort((a, b) => a.order - b.order));
      setChapters(chaptersList.sort((a, b) => a.order - b.order));
      setSimulationsCount(simsSnap.size);

      // Auto-select standard & subject if available
      if (standardsList.length > 0) {
        setSelectedStandardId(standardsList[0].id);
      }
    } catch (err) {
      console.error("Error loading curriculum view:", err);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, []);

  // Set default subject when standard changes
  useEffect(() => {
    if (selectedStandardId) {
      const filtered = subjects.filter((s) => s.standardId === selectedStandardId);
      if (filtered.length > 0) {
        setSelectedSubjectId(filtered[0].id);
      } else {
        setSelectedSubjectId("");
      }
    }
  }, [selectedStandardId, subjects]);

  // Load simulation details when topic changes
  useEffect(() => {
    const fetchSimulation = async () => {
      if (!selectedTopicId) {
        setActiveSimulation(null);
        return;
      }

      const topic = topics.find((t) => t.id === selectedTopicId);
      if (!topic || !topic.hasSimulation) {
        setActiveSimulation(null);
        return;
      }

      setLoadingSim(true);
      try {
        const simDoc = await getDoc(doc(db, "simulations", selectedTopicId));
        if (simDoc.exists()) {
          setActiveSimulation(simDoc.data() as Simulation);
        } else {
          setActiveSimulation(null);
        }
      } catch (err) {
        console.error("Error fetching simulation content:", err);
        setActiveSimulation(null);
      } finally {
        setLoadingSim(false);
      }
    };

    fetchSimulation();
  }, [selectedTopicId, topics]);

  // Lock body scroll when simulation is in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const activeStandard = standards.find((s) => s.id === selectedStandardId);
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const activeTopic = topics.find((t) => t.id === selectedTopicId);

  // Filter matching topics based on search query
  const query = searchQuery.trim().toLowerCase();
  const matchingTopics = topics.filter((top) => {
    // Trace back to standard
    const chap = chapters.find((c) => c.id === top.chapterId);
    if (!chap) return false;
    const subject = subjects.find((s) => s.id === chap.subjectId);
    if (!subject || subject.standardId !== selectedStandardId) return false;

    // Check if matches top name, or chap name, or subject name
    const matchesTopicName = top.name.toLowerCase().includes(query);
    const matchesChapterName = chap.name.toLowerCase().includes(query);
    const matchesSubjectName = subject.name.toLowerCase().includes(query);

    return matchesTopicName || matchesChapterName || matchesSubjectName;
  });

  // Create standard React sandbox HTML wrapper for TSX files
  const getTranspiledIframeContent = (sim: Simulation) => {
    if (sim.type === "html") {
      return sim.content;
    }

    // Replace the export default statement with a known variable assignment
    const processedContent = sim.content.replace(/export\s+default\s+/g, "const __DefaultExport__ = ");

    // TSX Renderer
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulation Preview</title>
  
  <!-- Import Map for bare module specifiers -->
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18",
        "react-dom": "https://esm.sh/react-dom@18",
        "react-dom/client": "https://esm.sh/react-dom@18/client",
        "lucide-react": "https://esm.sh/lucide-react",
        "recharts": "https://esm.sh/recharts",
        "d3": "https://esm.sh/d3",
        "canvas-confetti": "https://esm.sh/canvas-confetti"
      }
    }
  </script>

  <!-- Load Babel standalone for compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Load Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 16px;
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    /* Simple custom scrollbar inside simulation */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #475569;
    }
  </style>
</head>
<body>
  <div id="root" class="flex-1 flex flex-col"></div>
  
  <script type="text/babel" data-type="module" data-presets="react,typescript">
    ${processedContent}
    
    import React from "react";
    import ReactDOM from "react-dom/client";

    try {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        
        // Find component to render
        const Component = (typeof __DefaultExport__ !== 'undefined') 
          ? __DefaultExport__ 
          : (typeof App !== 'undefined' ? App : null);
          
        if (Component) {
          root.render(React.createElement(Component));
        } else {
          rootElement.innerHTML = \`
            <div style="padding: 20px; background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 8px; color: #ef4444; font-family: monospace;">
              <h3 style="margin-top: 0; font-weight: bold;">Rendering Error</h3>
              <p>No default export or "App" component was found in this file.</p>
            </div>
          \`;
        }
      }
    } catch (e) {
      console.error("Render error:", e);
      document.body.innerHTML = \`
        <div style="padding: 20px; background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 8px; color: #ef4444; font-family: monospace; margin: 16px;">
          <h3 style="margin-top: 0; font-weight: bold;">Execution Error</h3>
          <p>\${e.message}</p>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-2 md:p-3 text-slate-300 font-sans max-w-7xl mx-auto">
      
      {/* LEFT PANEL - Curriculum Navigation Sidebar (Accordion/List) */}
      <div className="lg:col-span-4 flex flex-col space-y-3">
        {/* Standard Selector Tab Bar */}
        <div className="flex bg-[#1E293B] border border-slate-800 p-1 rounded gap-1">
          {standards.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setSelectedStandardId(st.id);
                setSelectedTopicId("");
              }}
              className={`flex-1 py-1 px-2.5 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
                selectedStandardId === st.id
                  ? "bg-indigo-600 text-white shadow shadow-indigo-900/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              {st.name}
            </button>
          ))}
          {standards.length === 0 && (
            <div className="text-center w-full py-1 text-xs text-slate-500 font-mono">Loading grades...</div>
          )}
        </div>

        {/* Subjects & Accordion of Chapters */}
        <div className="bg-[#0F172A] border border-slate-800 rounded p-3 flex-1 flex flex-col min-h-[480px]">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Subjects in {activeStandard?.name || "Curriculum"}
          </h2>

          {/* Search Bar Input */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters, topics, or subjects..."
              className="w-full bg-[#1E293B]/60 border border-slate-800 focus:border-indigo-500/80 rounded pl-8 pr-8 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* My Favorites Section */}
          <div className="mb-3 border-b border-slate-800/80 pb-3">
            <button
              onClick={() => setFavoritesExpanded(!favoritesExpanded)}
              className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-400/90 hover:text-amber-300 transition outline-none cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Star className={`w-3.5 h-3.5 text-amber-400 ${bookmarkedChapters.length > 0 || bookmarkedTopics.length > 0 ? "fill-amber-400" : ""}`} />
                My Favorites ({bookmarkedChapters.length + bookmarkedTopics.length})
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${favoritesExpanded ? "rotate-90 text-amber-400" : "text-slate-500"}`} />
            </button>

            {favoritesExpanded && (
              <div className="mt-2 space-y-1 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {bookmarkedChapters.length === 0 && bookmarkedTopics.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic pl-1 py-1.5 font-mono">
                    No favorites starred yet. Click the star icon on any topic or chapter below to save them here!
                  </div>
                ) : (
                  <>
                    {/* Render bookmarked topics */}
                    {bookmarkedTopics.map((topicId) => {
                      const topic = topics.find((t) => t.id === topicId);
                      if (!topic) return null;
                      const subject = subjects.find((s) => s.id === topic.subjectId);
                      const standard = standards.find((st) => st.id === subject?.standardId);

                      return (
                        <div
                          key={topic.id}
                          className="flex items-center justify-between p-1.5 rounded bg-[#1E293B]/40 hover:bg-[#1E293B]/70 border border-slate-800/50 transition group"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="text-[10px] font-bold text-slate-300 truncate">
                              {topic.name}
                            </div>
                            <div className="text-[8px] text-slate-500 font-mono truncate mt-0.5">
                              Topic &bull; {subject?.name || "Science"} &bull; {standard?.name || ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                if (subject) {
                                  setSelectedStandardId(subject.standardId);
                                  setSelectedSubjectId(subject.id);
                                }
                              }}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-400 rounded text-[8px] font-bold font-mono uppercase tracking-tighter text-slate-400 border border-slate-700/60 transition cursor-pointer"
                              title="Go to Topic"
                            >
                              Go
                            </button>
                            <button
                              onClick={() => toggleBookmarkTopic(topic.id)}
                              className="text-amber-400 hover:text-slate-500 transition p-0.5 cursor-pointer"
                              title="Remove bookmark"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Render bookmarked chapters */}
                    {bookmarkedChapters.map((chapId) => {
                      const chap = chapters.find((c) => c.id === chapId);
                      if (!chap) return null;
                      const topic = topics.find((t) => t.id === chap.topicId);
                      const subject = subjects.find((s) => s.id === topic?.subjectId);
                      const standard = standards.find((st) => st.id === subject?.standardId);

                      return (
                        <div
                          key={chap.id}
                          className="flex items-center justify-between p-1.5 rounded bg-[#1E293B]/40 hover:bg-[#1E293B]/70 border border-slate-800/50 transition group"
                        >
                          <button
                            onClick={() => {
                              if (subject && topic) {
                                setSelectedStandardId(subject.standardId);
                                setSelectedSubjectId(subject.id);
                              }
                              const firstTopic = topics.find((t) => t.chapterId === chap.id);
                              if (firstTopic) {
                                setSelectedTopicId(firstTopic.id);
                              }
                            }}
                            className="flex-1 text-left min-w-0 pr-2 cursor-pointer focus:outline-none"
                          >
                            <div className="text-[10px] font-bold text-slate-300 truncate group-hover:text-white transition">
                              {chap.name}
                            </div>
                            <div className="text-[8px] text-slate-500 font-mono truncate mt-0.5">
                              Chapter &bull; {subject?.name || "Science"} &bull; {standard?.name || ""}
                            </div>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            {chap.hasSimulation && (
                              <span className="text-[7px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Sim</span>
                            )}
                            <button
                              onClick={() => toggleBookmarkChapter(chap.id)}
                              className="text-amber-400 hover:text-slate-500 transition p-0.5 cursor-pointer"
                              title="Remove bookmark"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Subject Horizontal Badges */}
          <div className="flex flex-wrap gap-1 mb-3 border-b border-slate-800/80 pb-2">
            {subjects
              .filter((s) => s.standardId === selectedStandardId)
              .map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubjectId(sub.id);
                    setSelectedTopicId("");
                  }}
                  className={`px-2 py-1 text-[11px] font-bold rounded border transition cursor-pointer ${
                    selectedSubjectId === sub.id
                      ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                      : "bg-[#1E293B] border-slate-750 hover:border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            {subjects.filter((s) => s.standardId === selectedStandardId).length === 0 && (
              <div className="text-[10px] text-slate-500 font-mono py-1">No subjects defined for this standard.</div>
            )}
          </div>

          {/* Topics and Chapters List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[420px]">
            {query ? (
              <div className="space-y-1.5">
                <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono pl-1 flex justify-between items-center mb-1">
                  <span>Search Results ({matchingTopics.length})</span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-indigo-400 hover:text-indigo-300 transition text-[8px] uppercase font-bold cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
                
                <div className="space-y-1">
                  {matchingTopics.map((top) => {
                    const chap = chapters.find((c) => c.id === top.chapterId);
                    const subject = subjects.find((s) => s.id === chap?.subjectId);
                    
                    return (
                      <div
                        key={top.id}
                        onClick={() => {
                          if (subject) {
                            setSelectedSubjectId(subject.id);
                          }
                          setSelectedTopicId(top.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            if (subject) {
                              setSelectedSubjectId(subject.id);
                            }
                            setSelectedTopicId(top.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`w-full text-left p-2 rounded border transition flex flex-col gap-0.5 group cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${
                          selectedTopicId === top.id
                            ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400 font-medium"
                            : "bg-[#1E293B]/30 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1 rounded transition-all ${
                                selectedTopicId === top.id
                                  ? "bg-indigo-500/20 text-indigo-400"
                                  : "bg-[#111827] text-slate-500 group-hover:text-slate-300"
                              }`}
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold leading-snug">{top.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {top.hasSimulation && (
                              <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase font-bold">Sim</span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmarkTopic(top.id);
                              }}
                              className="p-1 hover:bg-slate-800 rounded transition cursor-pointer text-slate-500 hover:text-amber-400"
                              title={bookmarkedTopics.includes(top.id) ? "Remove Bookmark" : "Bookmark Topic"}
                            >
                              <Star className={`w-3.5 h-3.5 ${bookmarkedTopics.includes(top.id) ? "fill-amber-400 text-amber-400" : "text-slate-500 hover:text-amber-400"}`} />
                            </button>
                          </div>
                        </div>
                        {subject && chap && (
                          <div className="text-[9px] text-slate-500 font-mono pl-7 leading-none mt-0.5">
                            {subject.name} &bull; {chap.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {matchingTopics.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-500 font-mono bg-slate-950/40 rounded border border-dashed border-slate-800 p-4">
                      No matching chapters or topics found for "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            ) : (
              chapters
                .filter((c) => c.subjectId === selectedSubjectId)
                .map((chapter) => {
                  const chapterTopics = topics.filter((t) => t.chapterId === chapter.id);
                  return (
                    <div key={chapter.id} className="space-y-1">
                       <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono flex items-center justify-between pl-1">
                        <div className="flex items-center gap-1">
                          <FileCode className="w-2.5 h-2.5 text-indigo-500/60" /> {chapter.name}
                        </div>
                        <button
                          onClick={() => toggleBookmarkChapter(chapter.id)}
                          className="text-slate-500 hover:text-amber-400 p-1 transition cursor-pointer"
                          title={bookmarkedChapters.includes(chapter.id) ? "Remove Chapter Bookmark" : "Bookmark Chapter"}
                        >
                          <Star className={`w-3 h-3 ${bookmarkedChapters.includes(chapter.id) ? "fill-amber-400 text-amber-400" : "text-slate-500 hover:text-amber-400"}`} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        {chapterTopics.map((top) => (
                          <div
                            key={top.id}
                            onClick={() => setSelectedTopicId(top.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setSelectedTopicId(top.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`w-full text-left p-2 rounded border transition flex items-center justify-between group cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${
                              selectedTopicId === top.id
                                ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400 font-medium"
                                : "bg-[#1E293B]/30 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1 rounded transition-all ${
                                  selectedTopicId === top.id
                                    ? "bg-indigo-500/20 text-indigo-400"
                                    : "bg-[#111827] text-slate-500 group-hover:text-slate-300"
                                }`}
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-semibold leading-snug">{top.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {top.hasSimulation && (
                                <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase font-bold" title="Simulation Available">Sim</span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmarkTopic(top.id);
                                }}
                                className="p-1 hover:bg-slate-800 rounded transition cursor-pointer text-slate-500 hover:text-amber-400"
                                title={bookmarkedTopics.includes(top.id) ? "Remove Bookmark" : "Bookmark Topic"}
                              >
                                <Star className={`w-3.5 h-3.5 ${bookmarkedTopics.includes(top.id) ? "fill-amber-400 text-amber-400" : "text-slate-500 hover:text-amber-400"}`} />
                              </button>
                              {!top.hasSimulation && (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </div>
                          </div>
                        ))}

                        {chapterTopics.length === 0 && (
                          <div className="text-[10px] text-slate-600 font-mono pl-3 py-1">No topics defined.</div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}

            {!query && chapters.filter((c) => c.subjectId === selectedSubjectId).length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500 font-mono bg-slate-950 rounded border border-dashed border-slate-800 p-4">
                No active modules found. Click 'Admin Hub' to seed default science simulations!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Simulation Viewer Screen */}
      <div className="lg:col-span-8 flex flex-col space-y-3">
        {selectedTopicId && activeSimulation ? (
          /* Active Simulation Window */
          <div
            className={`bg-[#0F172A] overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${
              isFullscreen
                ? "fixed inset-0 z-[100] bg-slate-950 border-0 rounded-none lg:fixed"
                : "border border-slate-800 rounded lg:sticky lg:top-[60px] lg:z-20 h-[75vh] sm:h-[80vh] lg:h-[calc(100vh-145px)] min-h-[480px] max-h-[720px]"
            }`}
          >
            {/* Header / Meta bar */}
            <div id="simulation-header" className="bg-[#1E293B] border-b border-slate-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-1 px-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400 font-mono text-[9px] font-bold uppercase">
                  {isAdmin ? `${activeSimulation.type} v${activeSimulation.version}` : `Interactive Lab`}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                    {activeTopic?.name}
                    <button
                      onClick={() => toggleBookmarkTopic(activeTopic?.id || "")}
                      className="text-slate-500 hover:text-amber-400 p-1 transition cursor-pointer"
                      title={bookmarkedTopics.includes(activeTopic?.id || "") ? "Remove bookmark" : "Bookmark this topic"}
                    >
                      <Star className={`w-3.5 h-3.5 ${bookmarkedTopics.includes(activeTopic?.id || "") ? "fill-amber-400 text-amber-400" : "text-slate-500 hover:text-amber-400"}`} />
                    </button>
                  </h3>
                  <p className="text-[9px] text-slate-500 mt-1 font-mono">
                    Module: {activeStandard?.name} • {activeSubject?.name}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setViewCode(!viewCode)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold border flex items-center gap-1 transition cursor-pointer ${
                      viewCode
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-[#0F172A] border-slate-700 hover:border-slate-600 text-slate-300"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> {viewCode ? "View Simulation" : "Inspect Code"}
                  </button>
                )}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700 rounded text-slate-300 transition"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
              {viewCode ? (
                /* Source Code inspection panel */
                <div className="flex-1 flex flex-col">
                  <div className="bg-slate-900 px-4 py-1.5 text-[9px] text-slate-500 font-mono border-b border-slate-800 flex justify-between">
                    <span>FILE: {activeSimulation.fileName}</span>
                    <span>SIZE: {Math.round(activeSimulation.content.length / 1024 * 10) / 10} KB</span>
                  </div>
                  <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-slate-300 bg-slate-950 leading-relaxed max-w-full selection:bg-indigo-800 selection:text-white">
                    <code>{activeSimulation.content}</code>
                  </pre>
                </div>
              ) : (
                /* Live Simulation IFrame Box */
                <iframe
                  srcDoc={getTranspiledIframeContent(activeSimulation)}
                  title={activeTopic?.name}
                  className="w-full h-full border-0 bg-slate-950 animate-fade-in"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Footer metadata info */}
            {!isFullscreen && isAdmin && (
              <div className="bg-slate-950/60 border-t border-slate-800 px-4 py-2 text-[9px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-600" /> Commited: {new Date(activeSimulation.uploadedAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <User className="w-3 h-3 text-slate-600" /> Author: {activeSimulation.uploadedBy}
                </div>
              </div>
            )}
          </div>
        ) : selectedTopicId && !activeSimulation ? (
          /* Empty Simulation / Admin Upload Helper */
          <div className="bg-[#0F172A] border border-slate-800 rounded h-[380px] flex flex-col items-center justify-center text-center p-6">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 mb-3">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">{isAdmin ? "Simulation Pending" : "Interactive Lab Coming Soon"}</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed">
              {isAdmin 
                ? "This topic has been registered in the curriculum tree, but no simulation file has been uploaded yet."
                : "This topic doesn't have an interactive lab yet. Try exploring another topic on the left sidebar!"}
            </p>

            {isAdmin ? (
              <div className="mt-4 space-y-2">
                <button
                  onClick={onOpenAdmin}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded text-xs transition shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-1 cursor-pointer mx-auto"
                >
                  <FileCode className="w-4 h-4" /> Upload Simulation Now
                </button>
              </div>
            ) : (
              <div className="mt-4 p-2.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-500 max-w-sm flex items-start gap-1.5 text-left">
                <Info className="w-3.5 h-3.5 text-sky-500 mt-0.5 shrink-0" />
                <span>Your teacher or administrator will add an interactive lab for this topic soon.</span>
              </div>
            )}
          </div>
        ) : (
          /* Landing Dashboard Page (No active chapter selected) */
          <div className="space-y-4">
            {/* Elegant Hero Banner */}
            <div className="bg-[#1E293B] border border-slate-800 rounded p-4 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="space-y-1.5 relative max-w-lg">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400 text-[9px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Virtual Learning Environment
                </div>
                <h2 className="text-base font-bold tracking-tight text-white mt-0.5">Interactive Science & Math Simulations</h2>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Select a Grade Standard, pick a Subject module, and explore dynamic, fully interactive physics models, mathematical graphs, and science experiments in real-time.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded flex items-center gap-2 w-full md:w-auto shrink-0 font-mono">
                <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-base font-bold text-white leading-none">{simulationsCount}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">Simulations Loaded</div>
                </div>
              </div>
            </div>

            {/* Quick Stat Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#0F172A]/80 border border-slate-800 p-3.5 rounded flex items-start gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded">
                  <GraduationCap className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Standard Alignment</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">Mapped to curriculum benchmarks for simple and robust classroom support.</p>
                </div>
              </div>

              <div className="bg-[#0F172A]/80 border border-slate-800 p-3.5 rounded flex items-start gap-2.5">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Secure & Safe</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">Simulations run safely in your browser for a secure and smooth experience.</p>
                </div>
              </div>

              <div className="bg-[#0F172A]/80 border border-slate-800 p-3.5 rounded flex items-start gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fun & Engaging</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">Play with visual parameters and watch real-time science and math come to life.</p>
                </div>
              </div>
            </div>

            {/* My Favorites Section */}
            <div className="bg-[#1E293B]/40 border border-slate-800 rounded p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">My Favorites ({bookmarkedTopics.length})</h3>
                </div>
              </div>
              
              {bookmarkedTopics.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center bg-[#0F172A]/50 rounded border border-slate-800/50">
                  No bookmarked simulations yet. Explore topics and chapters on the left, and click the star icon next to any simulation to save it here for quick access!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bookmarkedTopics.map((topicId) => {
                    const topic = topics.find((t) => t.id === topicId);
                    if (!topic) return null;
                    const chap = chapters.find((c) => c.id === topic.chapterId);
                    const subject = subjects.find((s) => s.id === chap?.subjectId);
                    const standard = standards.find((st) => st.id === subject?.standardId);

                    return (
                      <div
                        key={topic.id}
                        className="bg-[#0F172A] border border-slate-800 hover:border-indigo-500/40 rounded p-3 flex flex-col justify-between gap-3 shadow transition-all duration-200 hover:-translate-y-0.5 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                              {subject?.name || "Science"}
                            </span>
                            <button
                              onClick={() => toggleBookmarkTopic(topic.id)}
                              className="text-amber-400 hover:text-slate-500 transition p-0.5 cursor-pointer"
                              title="Remove Bookmark"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                            </button>
                          </div>
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition line-clamp-1 mt-1">
                            {topic.name}
                          </h4>
                          <p className="text-[9px] text-slate-500 line-clamp-1">
                            {standard?.name} &bull; {chap?.name}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (subject && chap) {
                              setSelectedStandardId(subject.standardId);
                              setSelectedSubjectId(subject.id);
                            }
                            setSelectedTopicId(topic.id);
                          }}
                          className="w-full py-1 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition"
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Launch Simulation
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quickstart prompt card */}
            <div className="bg-[#0F172A]/60 border border-slate-800 p-4 rounded flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <p className="text-[11px] text-slate-300">Ready to explore? Pick an interactive module on the sidebar to launch an interactive simulation.</p>
              </div>
              {standards.length === 0 && (
                <button
                  onClick={onOpenAdmin}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer self-stretch md:self-auto text-center justify-center"
                >
                  Seed Default Models <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
