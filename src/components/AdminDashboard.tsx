import React, { useState, useEffect, useRef } from "react";
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Standard,
  Subject,
  Topic,
  Chapter,
  Simulation,
  UserRole
} from "../types";
import {
  DEFAULT_STANDARDS,
  DEFAULT_SUBJECTS,
  DEFAULT_TOPICS,
  DEFAULT_CHAPTERS,
  DEFAULT_SIMULATIONS
} from "../data/defaultCurriculum";
import {
  Folder,
  Book,
  Layers,
  FileCode,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileUp,
  Database,
  ArrowRight,
  Eye,
  Settings,
  Shield,
  Clock,
  Code
} from "lucide-react";

interface AdminDashboardProps {
  currentUserEmail: string | null;
  onClose: () => void;
}

export default function AdminDashboard({ currentUserEmail, onClose }: AdminDashboardProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"curriculum" | "simulations" | "system">("curriculum");

  // Data State
  const [standards, setStandards] = useState<Standard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [simulations, setSimulations] = useState<Record<string, Simulation>>({});

  // Form State
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Selected for edits
  const [selectedStandard, setSelectedStandard] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");

  // New item creation states
  const [newStandard, setNewStandard] = useState({ id: "", name: "", order: 1 });
  const [newSubject, setNewSubject] = useState({ id: "", name: "", order: 1 });
  const [newTopic, setNewTopic] = useState({ id: "", name: "", order: 1 });
  const [newChapter, setNewChapter] = useState({ id: "", name: "", order: 1 });

  // Simulation Upload State
  const [selectedUploadTopic, setSelectedUploadTopic] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorFileName, setEditorFileName] = useState("");
  const [editorType, setEditorType] = useState<"html" | "tsx">("html");
  const [selectedSimPreview, setSelectedSimPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all curriculum data
  const fetchData = async () => {
    setLoading(true);
    try {
      const standardsSnap = await getDocs(collection(db, "standards"));
      const subjectsSnap = await getDocs(collection(db, "subjects"));
      const topicsSnap = await getDocs(collection(db, "topics"));
      const chaptersSnap = await getDocs(collection(db, "chapters"));
      const simsSnap = await getDocs(collection(db, "simulations"));

      const standardsList: Standard[] = [];
      standardsSnap.forEach((docSnap) => standardsList.push(docSnap.data() as Standard));
      
      const subjectsList: Subject[] = [];
      subjectsSnap.forEach((docSnap) => subjectsList.push(docSnap.data() as Subject));

      const topicsList: Topic[] = [];
      topicsSnap.forEach((docSnap) => topicsList.push(docSnap.data() as Topic));

      const chaptersList: Chapter[] = [];
      chaptersSnap.forEach((docSnap) => chaptersList.push(docSnap.data() as Chapter));

      const simsMap: Record<string, Simulation> = {};
      simsSnap.forEach((docSnap) => {
        simsMap[docSnap.id] = docSnap.data() as Simulation;
      });

      // Sort by order ascending
      setStandards(standardsList.sort((a, b) => a.order - b.order));
      setSubjects(subjectsList.sort((a, b) => a.order - b.order));
      setTopics(topicsList.sort((a, b) => a.order - b.order));
      setChapters(chaptersList.sort((a, b) => a.order - b.order));
      setSimulations(simsMap);

      // Auto select first standard/subject/topic if none selected
      if (standardsList.length > 0 && !selectedStandard) {
        setSelectedStandard(standardsList[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      showStatus("Failed to load curriculum from database.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update cascade selection
  useEffect(() => {
    const filteredSubjects = subjects.filter((s) => s.standardId === selectedStandard);
    if (filteredSubjects.length > 0) {
      setSelectedSubject(filteredSubjects[0].id);
    } else {
      setSelectedSubject("");
    }
  }, [selectedStandard, subjects]);

  useEffect(() => {
    const filteredChapters = chapters.filter((c) => c.subjectId === selectedSubject);
    if (filteredChapters.length > 0) {
      setSelectedChapter(filteredChapters[0].id);
    } else {
      setSelectedChapter("");
    }
  }, [selectedSubject, chapters]);

  useEffect(() => {
    const filteredTopics = topics.filter((t) => t.chapterId === selectedChapter);
    if (filteredTopics.length > 0) {
      setSelectedTopic(filteredTopics[0].id);
    } else {
      setSelectedTopic("");
    }
  }, [selectedChapter, topics]);

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Seeding the Database
  const seedDatabase = async () => {
    setLoading(true);
    try {
      // Seed standards
      for (const std of DEFAULT_STANDARDS) {
        await setDoc(doc(db, "standards", std.id), std);
      }
      // Seed subjects
      for (const subj of DEFAULT_SUBJECTS) {
        await setDoc(doc(db, "subjects", subj.id), subj);
      }
      // Seed topics
      for (const top of DEFAULT_TOPICS) {
        await setDoc(doc(db, "topics", top.id), top);
      }
      // Seed chapters
      for (const ch of DEFAULT_CHAPTERS) {
        await setDoc(doc(db, "chapters", ch.id), ch);
      }
      // Seed simulations
      for (const [simId, simData] of Object.entries(DEFAULT_SIMULATIONS)) {
        await setDoc(doc(db, "simulations", simId), {
          ...simData,
          uploadedBy: currentUserEmail || "system_seeder",
          uploadedAt: new Date().toISOString()
        });
      }

      showStatus("Database seeded successfully with premium simulations!", "success");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      showStatus(`Seeding failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Add a Standard
  const handleAddStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStandard.id || !newStandard.name) return;
    try {
      const slugId = newStandard.id.toLowerCase().replace(/\s+/g, "-");
      await setDoc(doc(db, "standards", slugId), {
        id: slugId,
        name: newStandard.name,
        order: Number(newStandard.order)
      });
      setNewStandard({ id: "", name: "", order: standards.length + 2 });
      showStatus("Standard added successfully!", "success");
      await fetchData();
    } catch (err: any) {
      showStatus(err.message, "error");
    }
  };

  // Delete an entity
  const handleDeleteEntity = async (collectionName: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${collectionName}? This operation is irreversible.`)) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      showStatus(`${collectionName} deleted successfully.`, "success");
      await fetchData();
    } catch (err: any) {
      showStatus(err.message, "error");
    }
  };

  // Add a Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.id || !newSubject.name || !selectedStandard) return;
    try {
      const finalId = `${selectedStandard}_${newSubject.id.toLowerCase().replace(/\s+/g, "-")}`;
      await setDoc(doc(db, "subjects", finalId), {
        id: finalId,
        standardId: selectedStandard,
        name: newSubject.name,
        order: Number(newSubject.order)
      });
      setNewSubject({ id: "", name: "", order: subjects.length + 2 });
      showStatus("Subject added successfully!", "success");
      await fetchData();
    } catch (err: any) {
      showStatus(err.message, "error");
    }
  };

  // Add a Chapter
  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapter.id || !newChapter.name || !selectedSubject) return;
    try {
      const finalId = `${selectedSubject}_${newChapter.id.toLowerCase().replace(/\s+/g, "-")}`;
      await setDoc(doc(db, "chapters", finalId), {
        id: finalId,
        subjectId: selectedSubject,
        name: newChapter.name,
        order: Number(newChapter.order)
      });
      setNewChapter({ id: "", name: "", order: chapters.length + 2 });
      showStatus("Chapter added successfully!", "success");
      await fetchData();
    } catch (err: any) {
      showStatus(err.message, "error");
    }
  };

  // Add a Topic
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.id || !newTopic.name || !selectedChapter) return;
    try {
      const finalId = `${selectedChapter}_${newTopic.id.toLowerCase().replace(/\s+/g, "-")}`;
      await setDoc(doc(db, "topics", finalId), {
        id: finalId,
        chapterId: selectedChapter,
        name: newTopic.name,
        order: Number(newTopic.order),
        hasSimulation: false
      });
      setNewTopic({ id: "", name: "", order: topics.length + 2 });
      showStatus("Topic added successfully!", "success");
      await fetchData();
    } catch (err: any) {
      showStatus(err.message, "error");
    }
  };

  // File Upload Handlers (Drag and Drop support)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "html" && ext !== "tsx" && ext !== "jsx" && ext !== "js") {
      showStatus("Only HTML, TSX, JS, or JSX files are supported for simulations.", "error");
      return;
    }

    setUploadedFile(file);
    setEditorFileName(file.name);
    setEditorType(ext === "html" ? "html" : "tsx");

    // Read file contents
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditorContent(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // Submit Uploaded Simulation
  const handleUploadSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadTopic || !editorContent) {
      showStatus("Please select a Topic and ensure there is file content.", "error");
      return;
    }

    setLoading(true);
    try {
      const existingSim = simulations[selectedUploadTopic];
      const newVersion = existingSim ? (existingSim.version || 1) + 1 : 1;

      // Create/Update Simulation doc
      const simDoc: Simulation = {
        id: selectedUploadTopic,
        topicId: selectedUploadTopic,
        fileName: editorFileName || `${selectedUploadTopic}_simulation.${editorType}`,
        content: editorContent,
        type: editorType,
        uploadedBy: currentUserEmail || "administrator",
        uploadedAt: new Date().toISOString(),
        version: newVersion
      };

      await setDoc(doc(db, "simulations", selectedUploadTopic), simDoc);

      // Mark corresponding Topic as having simulation
      await updateDoc(doc(db, "topics", selectedUploadTopic), {
        hasSimulation: true
      });

      showStatus(`Simulation '${editorFileName}' uploaded successfully (v${newVersion})!`, "success");
      
      // Reset upload states
      setUploadedFile(null);
      setEditorContent("");
      setEditorFileName("");
      
      await fetchData();
    } catch (err: any) {
      console.error(err);
      showStatus(`Failed to upload simulation: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/95 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-3 md:p-4 text-slate-300 font-sans">
      <div className="w-full max-w-5xl bg-[#1E293B] border border-slate-800 rounded shadow-2xl overflow-hidden mt-4 flex flex-col">
        {/* Header - Compact/Dense */}
        <div className="border-b border-slate-800 p-4 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-1.5 leading-none">
                Curriculum Admin Hub
              </h1>
              <p className="text-[10px] text-slate-400 mt-1">
                Logged in as <span className="font-mono text-slate-300 font-bold">{currentUserEmail}</span> (Administrator)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition cursor-pointer"
            >
              Exit Dashboard
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Dense */}
        <div className="border-b border-slate-800 bg-[#0F172A] px-4 flex items-center justify-between shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("curriculum")}
              className={`py-2.5 px-1 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "curriculum"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Curriculum Manager
            </button>
            <button
              onClick={() => setActiveTab("simulations")}
              className={`py-2.5 px-1 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "simulations"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> Upload Simulations
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`py-2.5 px-1 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "system"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> System & Seed
            </button>
          </div>
        </div>

        {/* Global Toast Message */}
        {statusMessage && (
          <div
            className={`mx-4 mt-3 p-3 rounded text-[11px] flex items-center gap-2 border ${
              statusMessage.type === "success"
                ? "bg-[#10b981]/10 border-emerald-800/40 text-emerald-400"
                : "bg-red-950/40 border-red-800/40 text-red-300"
            }`}
          >
            {statusMessage.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Main Content Area - Dense */}
        <div className="p-4">
          {/* CURRICULUM MANAGER TAB */}
          {activeTab === "curriculum" && (
            <div className="space-y-4">
              {/* Cascade Navigator */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 border border-slate-800 p-3 rounded">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <Folder className="w-3.5 h-3.5 text-indigo-400" /> Standard
                  </label>
                  <select
                    value={selectedStandard}
                    onChange={(e) => setSelectedStandard(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-800 rounded px-3 py-1.5 text-xs outline-none text-white focus:border-indigo-500 transition"
                  >
                    <option value="">-- Select Standard --</option>
                    {standards.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <Book className="w-3.5 h-3.5 text-indigo-400" /> Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedStandard}
                    className="w-full bg-[#1E293B] border border-slate-800 rounded px-3 py-1.5 text-xs outline-none text-white focus:border-indigo-500 transition disabled:opacity-50"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects
                      .filter((s) => s.standardId === selectedStandard)
                      .map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Chapter
                  </label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    disabled={!selectedSubject}
                    className="w-full bg-[#1E293B] border border-slate-800 rounded px-3 py-1.5 text-xs outline-none text-white focus:border-indigo-500 transition disabled:opacity-50"
                  >
                    <option value="">-- Select Chapter --</option>
                    {chapters
                      .filter((c) => c.subjectId === selectedSubject)
                      .map((chap) => (
                        <option key={chap.id} value={chap.id}>
                          {chap.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Topic
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    disabled={!selectedChapter}
                    className="w-full bg-[#1E293B] border border-slate-800 rounded px-3 py-1.5 text-xs outline-none text-white focus:border-indigo-500 transition disabled:opacity-50"
                  >
                    <option value="">-- Select Topic --</option>
                    {topics
                      .filter((t) => t.chapterId === selectedChapter)
                      .map((top) => (
                        <option key={top.id} value={top.id}>
                          {top.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Grid of Add/Delete Managers - Compact Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Standard Manager */}
                <div className="bg-[#0F172A]/80 border border-slate-800 rounded p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-3">
                    <Folder className="w-4 h-4 text-indigo-400" /> Standards ({standards.length})
                  </h2>
                  <form onSubmit={handleAddStandard} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="id, e.g. grade-11"
                      required
                      value={newStandard.id}
                      onChange={(e) => setNewStandard({ ...newStandard, id: e.target.value })}
                      className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-[11px] rounded outline-none focus:border-indigo-500 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Name, e.g. Grade 11"
                      required
                      value={newStandard.name}
                      onChange={(e) => setNewStandard({ ...newStandard, name: e.target.value })}
                      className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-[11px] rounded outline-none focus:border-indigo-500 text-white"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Standard
                    </button>
                  </form>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {standards.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-850 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{st.name}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">ID: {st.id} • Order: {st.order}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteEntity("standards", st.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject Manager */}
                <div className="bg-[#0F172A]/80 border border-slate-800 rounded p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-3">
                    <Book className="w-4 h-4 text-indigo-400" /> Subjects
                  </h2>
                  <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="id, e.g. chemistry"
                      required
                      value={newSubject.id}
                      onChange={(e) => setNewSubject({ ...newSubject, id: e.target.value })}
                      className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-[11px] rounded outline-none focus:border-indigo-500 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Name, e.g. Chemistry"
                      required
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-[11px] rounded outline-none focus:border-indigo-500 text-white"
                    />
                    <button
                      type="submit"
                      disabled={!selectedStandard}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Subject
                    </button>
                  </form>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {subjects
                      .filter((s) => s.standardId === selectedStandard)
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-850 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{sub.name}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">ID: {sub.id} • Parent: {sub.standardId}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteEntity("subjects", sub.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    {subjects.filter((s) => s.standardId === selectedStandard).length === 0 && (
                      <div className="text-center py-4 text-[10px] text-slate-500 font-mono">No subjects defined. Add one above!</div>
                    )}
                  </div>
                </div>

                {/* Chapter Manager */}
                <div className="bg-[#0F172A]/80 border border-slate-800 rounded p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-3">
                    <FileCode className="w-4 h-4 text-indigo-400" /> Chapters
                  </h2>
                  <form onSubmit={handleAddChapter} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="id, e.g. mechanics"
                      required
                      value={newChapter.id}
                      onChange={(e) => setNewChapter({ ...newChapter, id: e.target.value })}
                      className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-[11px] rounded outline-none focus:border-indigo-500 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Name, e.g. Mechanics & Gravity"
                      required
                      value={newChapter.name}
                      onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })}
                      className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-[11px] rounded outline-none focus:border-indigo-500 text-white"
                    />
                    <button
                      type="submit"
                      disabled={!selectedSubject}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Chapter
                    </button>
                  </form>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {chapters
                      .filter((c) => c.subjectId === selectedSubject)
                      .map((chap) => (
                        <div
                          key={chap.id}
                          className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-855 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{chap.name}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">ID: {chap.id}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteEntity("chapters", chap.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    {chapters.filter((c) => c.subjectId === selectedSubject).length === 0 && (
                      <div className="text-center py-4 text-[10px] text-slate-500 font-mono">No chapters defined. Choose a subject and add one!</div>
                    )}
                  </div>
                </div>

                {/* Topic Manager */}
                <div className="bg-[#0F172A]/80 border border-slate-800 rounded p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-3">
                    <Layers className="w-4 h-4 text-indigo-400" /> Topics
                  </h2>
                  <form onSubmit={handleAddTopic} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="id, e.g. gravity"
                      required
                      value={newTopic.id}
                      onChange={(e) => setNewTopic({ ...newTopic, id: e.target.value })}
                      className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-[11px] rounded outline-none focus:border-indigo-500 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Name, e.g. Universal Gravitation"
                      required
                      value={newTopic.name}
                      onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                      className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 text-[11px] rounded outline-none focus:border-indigo-500 text-white"
                    />
                    <button
                      type="submit"
                      disabled={!selectedChapter}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Topic
                    </button>
                  </form>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {topics
                      .filter((t) => t.chapterId === selectedChapter)
                      .map((top) => (
                        <div
                          key={top.id}
                          className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-850 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              {top.name}
                              {top.hasSimulation && (
                                <span className="inline-flex px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] rounded font-bold uppercase">
                                  Simulation Live
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">ID: {top.id}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedUploadTopic(top.id);
                                setActiveTab("simulations");
                              }}
                              title="Upload or Edit Simulation"
                              className="p-1 text-slate-400 hover:text-indigo-400 transition"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntity("topics", top.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    {topics.filter((t) => t.chapterId === selectedChapter).length === 0 && (
                      <div className="text-center py-4 text-[10px] text-slate-500 font-mono">No topics defined. Choose a chapter and add one!</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION UPLOAD & VERSION CONTROL TAB */}
          {activeTab === "simulations" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column - Target Select and Upload Box */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#0F172A]/80 border border-slate-800 p-4 rounded space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-indigo-400" /> Upload Configuration
                  </h2>

                  {/* Select Topic */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Target Topic</label>
                    <select
                      value={selectedUploadTopic}
                      onChange={(e) => {
                        setSelectedUploadTopic(e.target.value);
                        // If there is an existing simulation, load it to editor!
                        const existing = simulations[e.target.value];
                        if (existing) {
                          setEditorContent(existing.content);
                          setEditorFileName(existing.fileName);
                          setEditorType(existing.type);
                        } else {
                          setEditorContent("");
                          setEditorFileName("");
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs outline-none text-white focus:border-indigo-500 transition"
                    >
                      <option value="">-- Choose Topic --</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.hasSimulation ? " (Has Simulation v" + (simulations[t.id]?.version || 1) + ")" : " (Needs Simulation)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded p-5 text-center cursor-pointer transition ${
                      dragActive
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-950/80 text-slate-400"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".html,.tsx,.jsx,.js"
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p className="text-xs font-bold text-slate-300">
                      Drag & Drop simulation file here
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1">
                      Supports .html, .tsx, .jsx, or .js files up to 1MB
                    </p>
                    <button
                      type="button"
                      className="mt-3 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-400 font-bold border border-slate-800 rounded text-[10px] transition"
                    >
                      Select File Manually
                    </button>
                  </div>

                  {/* Active Upload Meta info */}
                  {editorFileName && (
                    <div className="bg-slate-950 border border-slate-850 p-3 rounded text-[11px] space-y-1.5">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">File Name:</span>
                        <span className="text-white font-semibold">{editorFileName}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Format Type:</span>
                        <span className="text-amber-400 uppercase font-bold">{editorType}</span>
                      </div>
                      {simulations[selectedUploadTopic] && (
                        <div className="flex justify-between font-mono border-t border-slate-800 pt-1.5 text-[10px]">
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Existing Version:
                          </span>
                          <span className="text-rose-300 font-bold">
                            v{simulations[selectedUploadTopic].version} (will update to v{simulations[selectedUploadTopic].version + 1})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit upload */}
                  <button
                    onClick={handleUploadSimulation}
                    disabled={!selectedUploadTopic || !editorContent || loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 px-3 rounded text-xs transition shadow-lg shadow-indigo-950/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Save & Commit Simulation
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column - Editor / Code Viewer */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="bg-[#0F172A]/80 border border-slate-800 rounded overflow-hidden flex flex-col h-[520px]">
                  <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex justify-between items-center shrink-0">
                    <span className="text-[10px] font-bold font-mono text-slate-400 flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-indigo-400" /> Interactive Source Code Editor
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (editorContent) {
                            setSelectedSimPreview(editorContent);
                          } else {
                            showStatus("Please write or upload a simulation first.", "error");
                          }
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] rounded border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Live Test Code
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-2 bg-slate-950">
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      placeholder="<!-- Paste your HTML simulation or TSX React source code here. -->&#10;<!-- Click 'Live Test Code' above to preview instantly. -->"
                      className="w-full h-full bg-slate-950 text-slate-300 font-mono text-xs p-2 outline-none resize-none border-0 focus:ring-0 placeholder-slate-600 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM & SEED TAB */}
          {activeTab === "system" && (
            <div className="max-w-2xl mx-auto space-y-4 py-4">
              <div className="bg-[#0F172A]/80 border border-slate-800 rounded p-5 text-center space-y-4">
                <div className="inline-flex p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400">
                  <Database className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Database Seed Tool</h2>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
                    If your Firestore instance is currently blank or doesn't have curriculum standards set up, trigger the Seed process. It will automatically populate Grade 9 & 10 physics, math, chemistry modules and install interactive, beautiful HTML-based simulation engines directly into Firestore!
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={seedDatabase}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded text-xs transition shadow-lg shadow-indigo-950/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Database className="w-4 h-4" /> Seed Premium Curriculum Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Simulation Live Test Modal */}
      {selectedSimPreview && (
        <div className="fixed inset-0 bg-slate-950/98 z-50 flex flex-col p-3 md:p-4 text-slate-100">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
            <div>
              <h2 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Sandbox Live Simulation Test Preview
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Simulated rendering within a fully isolated iframe</p>
            </div>
            <button
              onClick={() => setSelectedSimPreview(null)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition cursor-pointer"
            >
              Close Preview
            </button>
          </div>
          <div className="flex-1 bg-slate-950 rounded border border-slate-800 overflow-hidden relative">
            <iframe
              srcDoc={
                editorType === "html"
                  ? selectedSimPreview
                  : `<!DOCTYPE html>
                     <html>
                     <head>
                       <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
                       <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
                       <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                       <script src="https://cdn.tailwindcss.com"></script>
                       <style>body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 24px; }</style>
                     </head>
                     <body>
                       <div id="root"></div>
                       <script type="text/babel">
                         ${selectedSimPreview.replace(/export\s+default\s+function\s+\w+/g, "function App")}
                         const root = ReactDOM.createRoot(document.getElementById('root'));
                         root.render(<App />);
                       </script>
                     </body>
                     </html>`
              }
              title="Simulation Test Sandbox"
              className="w-full h-full border-0 bg-slate-950"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
