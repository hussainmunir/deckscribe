import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Settings,
  Presentation,
  Sparkles,
  BookOpen,
  X,
  Key,
  CheckCircle,
  Play,
  ChevronDown,
  User,
  Trash2,
  Edit3,
  Search,
  History,
  Plus,
  Download,
  Activity,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import DocumentUpload from "./components/DocumentUpload";
import SlidesBuilderWorkspace from "./components/SlidesBuilderWorkspace";

import { DocumentInfo, PresentationDeck, UserProfile, GenerationHistoryEntry } from "./types";
import { SAMPLE_PAPERS, SamplePaper } from "./data/samples";

export default function App() {
  const [siteTheme, setSiteTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("deckscribe_site_theme");
    return saved === "dark" ? "dark" : "light";
  });
  const isDark = siteTheme === "dark";

  useEffect(() => {
    localStorage.setItem("deckscribe_site_theme", siteTheme);
    // Ensure the html or body element gets light/dark class as well if needed
    const root = document.documentElement;
    if (siteTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [siteTheme]);

  // Try to load user API key from cache
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("workspace_custom_gemini_key") || "";
  });
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<DocumentInfo | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState<PresentationDeck | null>(null);
  const [slideTargetCount, setSlideTargetCount] = useState<number>(8);

  // Auto loading pipeline status when running preloaded samples
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleMessage, setSampleMessage] = useState("");
  const [sampleStep, setSampleStep] = useState(1);

  // --- START MULTIUSER ARCHITECTURE ---
  const AVATAR_GRADIENTS = [
    "from-indigo-500 to-purple-600",
    "from-pink-500 to-rose-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-blue-500 to-cyan-600",
    "from-violet-500 to-fuchsia-600"
  ];

  // User profiles state
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("deckscribe_profiles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "prof-default", name: "Hussain Munir", avatarColor: "from-indigo-500 to-purple-600" }
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem("deckscribe_active_profile_id") || "prof-default";
  });

  // Keep active profile object derived
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || { id: "prof-default", name: "Hussain Munir", avatarColor: "from-indigo-500 to-purple-600" };

  // Generations history state
  const [history, setHistory] = useState<GenerationHistoryEntry[]>(() => {
    const saved = localStorage.getItem("deckscribe_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Key of currently loaded record (so we can auto-save modifications)
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  // Profile switcher dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  // Sync profiles
  useEffect(() => {
    localStorage.setItem("deckscribe_profiles", JSON.stringify(profiles));
  }, [profiles]);

  // Sync active profile id
  useEffect(() => {
    localStorage.setItem("deckscribe_active_profile_id", activeProfileId);
  }, [activeProfileId]);

  // Sync history
  useEffect(() => {
    localStorage.setItem("deckscribe_history", JSON.stringify(history));
  }, [history]);

  const handleCreateProfile = (name: string) => {
    if (!name.trim()) return;
    const newId = "prof-" + Date.now();
    const randomGradient = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
    const newProfile: UserProfile = {
      id: newId,
      name: name.trim(),
      avatarColor: randomGradient
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newId);
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      alert("At least one user profile is required!");
      return;
    }
    if (id === "prof-default") {
      alert("The default corporate profile cannot be deleted!");
      return;
    }
    if (confirm(`Are you sure you want to delete profile "${profiles.find(p => p.id === id)?.name}"? This action will also delete all slide generations belonging to this user profile.`)) {
      setProfiles(prev => prev.filter(p => p.id !== id));
      setHistory(prev => prev.filter(item => item.userId !== id));
      if (activeProfileId === id) {
        const remaining = profiles.filter(p => p.id !== id);
        setActiveProfileId(remaining[0]?.id || "prof-default");
      }
    }
  };

  const handleLoadHistoryEntry = (entry: GenerationHistoryEntry) => {
    setCurrentDocument(entry.documentInfo);
    setGeneratedDeck(entry.deck);
    setCurrentHistoryId(entry.id);
  };

  const handleDeleteHistoryEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this presentation from your history?")) {
      setHistory(prev => prev.filter(item => item.id !== id));
      if (currentHistoryId === id) {
        handleReset();
      }
    }
  };

  const handleRenameHistoryEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = history.find(item => item.id === id);
    if (!target) return;
    const newTitle = prompt("Enter a new title for this presentation:", target.title);
    if (newTitle && newTitle.trim()) {
      setHistory(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, title: newTitle.trim() };
        }
        return item;
      }));
    }
  };

  // Save API key when updated
  const saveApiKey = (key: string) => {
    localStorage.setItem("workspace_custom_gemini_key", key);
    setApiKey(key);
    setIsConfigOpen(false);
  };

  // Pre-load / load a sample whitepaper instantly!
  const loadSample = async (sample: SamplePaper) => {
    setSampleLoading(true);
    setSampleStep(1);
    setSampleMessage("Retrieving preloaded semantic manuscript context...");

    const documentInfo: DocumentInfo = {
      title: sample.title,
      text: sample.text,
      wordCount: sample.wordCount,
    };

    setCurrentDocument(documentInfo);

    setTimeout(() => {
      setSampleStep(2);
      setSampleMessage("Activating Gemini Flash deck design engine...");
    }, 1200);

    setTimeout(() => {
      setSampleStep(3);
      setSampleMessage("Formulating slide chapters & voice coaching cues...");
    }, 2400);

    try {
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (apiKey) {
        requestHeaders["x-gemini-key"] = apiKey;
      }

      await new Promise(resolve => setTimeout(resolve, 3600));

      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          text: sample.text,
          title: sample.title,
          slideCount: slideTargetCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server slide synthesis failed: Status ${response.status}`);
      }

      const deckResult = await response.json();
      setGeneratedDeck(deckResult);

      // Save to history!
      const entryId = "deck-" + Date.now();
      const newEntry: GenerationHistoryEntry = {
        id: entryId,
        title: deckResult.title || documentInfo.title || "Untitled Presentation",
        documentInfo,
        deck: deckResult,
        timestamp: new Date().toLocaleString(),
        slideCount: deckResult.slides.length,
        userId: activeProfileId
      };
      setHistory(prev => [newEntry, ...prev]);
      setCurrentHistoryId(entryId);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not deconstruct sample paper. Please verify your GEMINI_API_KEY environment configuration.");
      // reset state on crash
      setCurrentDocument(null);
    } finally {
      setSampleLoading(false);
    }
  };

  const handleUploadSuccess = (doc: DocumentInfo) => {
    setCurrentDocument(doc);
  };

  const handleAnalysisSuccess = (deck: PresentationDeck) => {
    setGeneratedDeck(deck);

    // Save to history!
    const entryId = "deck-" + Date.now();
    const newEntry: GenerationHistoryEntry = {
      id: entryId,
      title: deck.title || currentDocument?.title || "Untitled Presentation",
      documentInfo: currentDocument,
      deck,
      timestamp: new Date().toLocaleString(),
      slideCount: deck.slides.length,
      userId: activeProfileId
    };
    setHistory(prev => [newEntry, ...prev]);
    setCurrentHistoryId(entryId);
  };

  const handleUpdateDeck = (updatedDeck: PresentationDeck) => {
    setGeneratedDeck(updatedDeck);

    // Auto-save edited deck back to history!
    if (currentHistoryId) {
      setHistory(prev => prev.map(item => {
        if (item.id === currentHistoryId) {
          return {
            ...item,
            title: updatedDeck.title || item.title,
            deck: updatedDeck,
            slideCount: updatedDeck.slides.length
          };
        }
        return item;
      }));
    }
  };

  const handleReset = () => {
    setCurrentDocument(null);
    setGeneratedDeck(null);
    setCurrentHistoryId(null);
  };

  // Filter history entries by profile ID and search term
  const userHistory = history.filter(item => item.userId === activeProfileId);
  const filteredHistory = userHistory.filter(item => 
    item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    (item.documentInfo?.title && item.documentInfo.title.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className={`h-screen w-full flex flex-col font-sans transition-colors duration-200 overflow-hidden select-none ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`} id="app-root">
      
      {/* Top Header Navigation Panel */}
      <header className={`h-16 flex items-center justify-between px-6 border-b z-10 shrink-0 transition-colors duration-200 ${
        isDark ? "border-slate-900 bg-slate-950 text-slate-100" : "border-slate-200 bg-white text-slate-900"
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/10">
            <Presentation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-bold text-base tracking-tight leading-none flex items-center gap-1.5 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              <span>DeckScribe</span>
              <span className={`text-[10px] font-mono tracking-wider font-extrabold uppercase py-0.5 px-1.5 rounded ${
                isDark ? "bg-teal-950 border border-teal-900/40 text-teal-400" : "bg-teal-50 border border-teal-200 text-teal-600"
              }`}>
                v2.0
              </span>
            </h1>
            <p className={`text-[10px] font-mono mt-0.5 ${isDark ? "text-slate-500" : "text-slate-450"}`}>Automated Slide Deck Customizer</p>
          </div>
        </div>

        {/* Header CTA & config */}
        <div className="flex items-center space-x-3">
          {currentDocument && !sampleLoading && (
            <button
              onClick={handleReset}
              className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                isDark
                  ? "border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300"
                  : "border-slate-200 hover:border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Analyze New Document
            </button>
          )}

          {/* User Profile Selector Dropdown */}
          <div className="relative" id="profile-switcher-dropdown-container">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-xs ${
                isDark
                  ? "bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-705 text-slate-300"
                  : "bg-slate-100 border-slate-250 hover:bg-slate-200 hover:border-slate-300 text-slate-700"
              }`}
              title="Switch Profile & Manage History"
            >
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${activeProfile.avatarColor} flex items-center justify-center text-[9px] font-bold text-white uppercase`}>
                {activeProfile.name.charAt(0)}
              </div>
              <span className={`font-mono font-bold max-w-[80px] sm:max-w-[120px] truncate leading-none ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {activeProfile.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <AnimatePresence>
              {isProfileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsProfileDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute right-0 mt-2 w-64 border rounded-xl shadow-2xl p-3.5 space-y-3.5 z-50 text-left ${
                      isDark 
                        ? "bg-slate-900/95 border-slate-800 text-slate-100" 
                        : "bg-white/95 border-slate-200 text-slate-900"
                    }`}
                    style={{ backdropFilter: "blur(20px)" }}
                  >
                    <div>
                      <h4 className={`text-[10px] font-mono uppercase tracking-wider font-extrabold flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        <User className="w-3.5 h-3.5 text-teal-400" />
                        <span>Workplace Profiles</span>
                      </h4>
                      <p className={`text-[9px] font-mono mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Partition slide generations per individual user.</p>
                    </div>

                    <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1" id="profiles-list-scroll">
                      {profiles.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setActiveProfileId(p.id);
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            p.id === activeProfileId 
                              ? "bg-teal-600/10 border border-teal-500/20 text-teal-600 font-bold" 
                              : isDark 
                                ? "hover:bg-slate-800 border border-transparent text-slate-400 hover:text-slate-200"
                                : "hover:bg-slate-100 border border-transparent text-slate-650 hover:text-slate-800"
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${p.avatarColor} flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0`}>
                              {p.name.charAt(0)}
                            </div>
                            <span className="truncate">{p.name}</span>
                          </div>
                          {p.id !== "prof-default" && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteProfile(p.id, e)}
                              className={`p-1 rounded transition-colors shrink-0 ${
                                isDark 
                                  ? "text-slate-600 hover:text-rose-400 hover:bg-slate-800" 
                                  : "text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                              }`}
                              title="Delete profile"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className={`border-t pt-2.5 space-y-2 ${isDark ? "border-slate-800/80" : "border-slate-100"}`}>
                      <div className={`text-[9px] uppercase font-mono tracking-wider font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>Add New User</div>
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          placeholder="User Name..."
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateProfile(newProfileName);
                              setNewProfileName("");
                              setIsProfileDropdownOpen(false);
                            }
                          }}
                          className={`flex-1 border rounded px-2.5 py-1 text-xs font-sans min-w-0 focus:outline-none focus:border-teal-500 ${
                            isDark 
                              ? "bg-slate-950 border-slate-850 text-slate-200 placeholder-slate-750" 
                              : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-450"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleCreateProfile(newProfileName);
                            setNewProfileName("");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="p-1 px-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold font-mono shrink-0 cursor-pointer"
                        >
                          ADD
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
            isDark 
              ? "bg-slate-900 border-slate-800/80 text-slate-400" 
              : "bg-slate-100 border-slate-200 text-slate-600"
          }`}>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>gemini-3.5-flash</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setSiteTheme(prev => prev === "light" ? "dark" : "light")}
            className={`p-2 rounded-lg border transition-all cursor-pointer relative ${
              isDark 
                ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400 hover:text-amber-300" 
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-600 hover:text-indigo-700"
            }`}
            title={`Switch to ${isDark ? "Light" : "Dark"} Theme`}
            id="theme-toggle-btn"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsConfigOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer relative ${
              !apiKey
                ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-600 dark:text-amber-400 animate-pulse"
                : isDark 
                  ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-teal-400 hover:text-teal-300" 
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-teal-600 hover:text-teal-700"
            }`}
            title={apiKey ? "Update Gemini API Key" : "Add Gemini API Key Required"}
            id="header-api-key-btn"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? "API Key Active" : "Set API Key"}</span>
            {apiKey && (
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container Split Body */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative">
        <AnimatePresence mode="wait">
          {!generatedDeck ? (
            /* Dashboard Upload/Selection Landing Zone split layout */
            <motion.div
              key="landing"
              className="flex-1 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="landing-grid">
                
                {/* LEFT CONTEXT GENERATOR - lg:col-span-7 */}
                <div className="lg:col-span-7 space-y-8 flex flex-col items-center lg:items-stretch" id="generator-column">
                  
                  {/* Central Welcoming Branding */}
                  <div className="text-center lg:text-left space-y-2.5 max-w-lg">
                    <span className={`text-[10px] inline-block font-mono font-extrabold tracking-widest px-3 py-1 rounded-full uppercase ${
                      isDark 
                        ? "text-teal-400 bg-teal-950/40 border border-teal-900/40" 
                        : "text-teal-600 bg-teal-55/70 border border-teal-150"
                    }`}>
                      Document-to-Presentation Workspace
                    </span>
                    <h2 className={`text-3xl font-extrabold tracking-tight pt-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                      Deconstruct Documents into Beautiful Slides
                    </h2>
                    <p className={`text-xs sm:text-sm leading-relaxed font-sans ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Transform dense whitepapers, minutes, articles, or notes into a modular PowerPoint-like slide deck. Edit slide titles, bullets, presenter talking notes, and instantly customize presets of design layout rules.
                    </p>
                  </div>

                  {/* Upload layer */}
                  <div className="w-full max-w-xl animate-fade-in">
                    <DocumentUpload
                      onUploadSuccess={handleUploadSuccess}
                      onAnalysisSuccess={handleAnalysisSuccess}
                      userApiKey={apiKey}
                      siteTheme={siteTheme}
                      onMissingApiKey={() => setIsConfigOpen(true)}
                    />
                  </div>
                </div>

                {/* RIGHT HISTORY PERSISTENCE - lg:col-span-5 */}
                <div className="lg:col-span-5" id="history-column">
                  <div className={`border rounded-2xl p-5 sm:p-6 flex flex-col space-y-4 ${
                    isDark 
                      ? "bg-slate-900/10 border-slate-900" 
                      : "bg-white border-slate-200 shadow-sm"
                  }`} id="generation-history-card">
                    <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-slate-900" : "border-slate-100"}`}>
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                          <History className="w-4 h-4 text-teal-500" />
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold font-display ${isDark ? "text-slate-100" : "text-slate-800"}`}>Generation History</h3>
                          <p className="text-[10px] text-slate-500 font-mono">Switch profiles to filter decks</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-extrabold py-0.5 px-2 border rounded ${
                        isDark 
                          ? "text-teal-400 bg-teal-950 border border-teal-900/30" 
                          : "text-teal-650 bg-teal-50 border border-teal-200"
                      }`}>
                        {userHistory.length} decks
                      </span>
                    </div>

                    {/* Search across past records */}
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className={`absolute left-2.5 top-2.5 w-3.5 h-3.5 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                        <input
                          type="text"
                          placeholder={`Search ${activeProfile.name}'s decks...`}
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          className={`w-full border rounded-lg pl-8 p-2 text-xs font-sans focus:outline-none focus:border-teal-500 ${
                            isDark 
                              ? "bg-slate-950 border-slate-850 text-slate-200 placeholder-slate-705" 
                              : "bg-slate-50 border-slate-200 text-slate-805 placeholder-slate-400"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Infinite history list entries */}
                    <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1" id="history-scroll-list">
                      {filteredHistory.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-12 text-center space-y-3 border rounded-xl px-4 ${
                          isDark ? "bg-slate-950/20 border-slate-900/45 text-slate-400" : "bg-slate-50 border-slate-150 text-slate-700"
                        }`}>
                          <div className={`p-3 border rounded-full ${isDark ? "bg-slate-900/40 border-slate-850/40 text-slate-500" : "bg-white border-slate-200 text-slate-400"}`}>
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>No Past Slides Catalogued</h4>
                            <p className={`text-[10px] font-mono mt-1 leading-relaxed max-w-[240px] mx-auto ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                              Generations of {activeProfile.name} are kept isolated here. Create layouts to populate history!
                            </p>
                          </div>
                        </div>
                      ) : (
                        filteredHistory.map((entry) => (
                          <div
                            key={entry.id}
                            onClick={() => handleLoadHistoryEntry(entry)}
                            className={`group relative p-3.5 border rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer space-y-2.5 ${
                              isDark 
                                ? "bg-slate-900/25 border-slate-900 hover:border-teal-500/35 hover:bg-slate-900/50" 
                                : "bg-white border-slate-200 hover:border-teal-505/35 hover:bg-teal-50/10 shadow-sm"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                  isDark 
                                    ? "text-teal-400 bg-teal-950/40 border border-teal-900/20" 
                                    : "text-teal-650 bg-teal-50 border border-teal-150"
                                }`}>
                                  {entry.slideCount} Slides
                                </span>
                                <span className={`text-[9px] font-mono ml-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{entry.timestamp}</span>
                              </div>
                              
                              {/* Hover menu control tray */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1.5 transition-all">
                                <button
                                  type="button"
                                  title="Download JSON slide definition"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entry.deck, null, 2));
                                    const downloadAnchor = document.createElement('a');
                                    downloadAnchor.setAttribute("href", dataStr);
                                    downloadAnchor.setAttribute("download", `${entry.title.replace(/\s+/g, "_")}_deckcribe.json`);
                                    document.body.appendChild(downloadAnchor);
                                    downloadAnchor.click();
                                    downloadAnchor.remove();
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-150 text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  title="Rename presentation"
                                  onClick={(e) => handleRenameHistoryEntry(entry.id, e)}
                                  className={`p-1 rounded transition-colors ${
                                    isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-150 text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete permanently"
                                  onClick={(e) => handleDeleteHistoryEntry(entry.id, e)}
                                  className={`p-1 rounded transition-colors ${
                                    isDark ? "hover:bg-slate-800 hover:text-rose-450 text-slate-400" : "hover:bg-slate-150 hover:text-rose-600 text-slate-500"
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <h4 className={`text-xs font-bold leading-snug group-hover:text-teal-500 transition-colors line-clamp-2 ${
                                isDark ? "text-slate-200" : "text-slate-800"
                              }`}>
                                {entry.title}
                              </h4>
                              {entry.documentInfo && (
                                <p className={`text-[9.5px] font-mono truncate mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                  Source: {entry.documentInfo.title}
                                </p>
                              )}
                            </div>

                            <div className="text-[9.5px] text-teal-500 hover:underline flex items-center space-x-1 font-mono uppercase font-bold pt-1">
                              <span>Load Slide Workspace</span>
                              <span>→</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : sampleLoading ? (
            /* Separator Screen for preloading sample processing */
            <motion.div
              key="sample-loading"
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center space-y-6 shadow-xl">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto text-teal-400 w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-2 w-full">
                  <h3 className="text-sm font-bold text-slate-100 font-display">Ingesting Core Parameters</h3>
                  <p className="text-xs text-teal-400 font-mono min-h-[40px] px-2 leading-relaxed">{sampleMessage}</p>
                </div>

                {/* Stepper Progress */}
                <div className="grid grid-cols-3 gap-2 w-full pt-4">
                  <div className="flex flex-col space-y-1">
                    <div className={`h-1.5 rounded-full ${sampleStep >= 1 ? "bg-teal-500 animate-shimmer" : "bg-slate-800"}`} />
                    <span className={`text-[9px] uppercase tracking-wider font-mono ${sampleStep >= 1 ? "text-teal-400 font-bold" : "text-slate-500"}`}>1. Parse</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className={`h-1.5 rounded-full ${sampleStep >= 2 ? "bg-teal-500 animate-shimmer" : "bg-slate-800"}`} />
                    <span className={`text-[9px] uppercase tracking-wider font-mono ${sampleStep >= 2 ? "text-teal-400 font-bold" : "text-slate-500"}`}>2. Reasoning</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className={`h-1.5 rounded-full ${sampleStep >= 3 ? "bg-teal-500 animate-shimmer" : "bg-slate-800"}`} />
                    <span className={`text-[9px] uppercase tracking-wider font-mono ${sampleStep >= 3 ? "text-teal-400 font-bold" : "text-slate-500"}`}>3. Design</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Workspace Panel containing the custom slides designer */
            <motion.div
              key="workspace"
              className="flex-1 w-full flex flex-col min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex-1 overflow-y-auto w-full">
                <SlidesBuilderWorkspace
                  deck={generatedDeck}
                  onUpdateDeck={handleUpdateDeck}
                  documentInfo={currentDocument}
                  onReset={handleReset}
                  siteTheme={siteTheme}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Config Modal for Custom API key overlay */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" id="config-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-left"
            >
              <button
                onClick={() => setIsConfigOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                  <Key className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Client Key Configurations</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Google Gemini API secrets setup</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provide your custom Google Gemini API Key below. This key is stored locally in your browser's local storage and used to securely interact with the Gemini API.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">GEMINI API KEY</label>
                  <input
                    type="password"
                    defaultValue={apiKey}
                    placeholder="AIzaSy..."
                    id="client-api-key-input"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("client-api-key-input") as HTMLInputElement;
                    saveApiKey(el?.value || "");
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-lg text-xs shadow-lg shadow-teal-600/10 hover:shadow-teal-600/25 hover:from-teal-500 hover:to-emerald-500 transition-all font-mono uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
