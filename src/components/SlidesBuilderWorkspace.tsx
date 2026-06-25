import React, { useState, useEffect } from "react";
import { Slide, DesignConfig, PresentationDeck, DocumentInfo, ThemeType, AccentType, FontPairingType, CompactnessType } from "../types";
import { 
  Play, 
  Settings2, 
  Trash2, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Palette, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  Check, 
  FileText, 
  Sparkles, 
  Clock, 
  Download, 
  Type as FontIcon, 
  Maximize2, 
  CheckCircle,
  AlertCircle,
  BookOpen
} from "lucide-react";
import SlidePreviewCanvas from "./SlidePreviewCanvas";

interface SlidesBuilderWorkspaceProps {
  deck: PresentationDeck;
  onUpdateDeck: (updatedDeck: PresentationDeck) => void;
  documentInfo: DocumentInfo | null;
  onReset: () => void;
  siteTheme?: "light" | "dark";
}

export default function SlidesBuilderWorkspace({
  deck,
  onUpdateDeck,
  documentInfo,
  onReset,
  siteTheme = "light"
}: SlidesBuilderWorkspaceProps) {
  const isDark = siteTheme === "dark";
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'manuscript'>('content');
  const [isPlaying, setIsPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setActiveSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
        e.preventDefault();
        setActiveSlideIndex((prev) => Math.min(deck.slides.length - 1, prev + 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsPlaying(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying, deck.slides.length]);

  // Default design config in local sub-state so users can edit design rules on the fly!
  const [config, setConfig] = useState<DesignConfig>({
    theme: "charcoal",
    accent: "teal",
    fontPairing: "modern",
    compactness: "normal",
    align: "left",
    showCardBorder: true
  });

  const activeSlide = deck.slides[activeSlideIndex] || null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Deck content modifier functions passed up via deck updates
  const updateSlideAt = (index: number, updatedFields: Partial<Slide>) => {
    const updatedSlides = [...deck.slides];
    updatedSlides[index] = { ...updatedSlides[index], ...updatedFields };
    onUpdateDeck({ ...deck, slides: updatedSlides });
  };

  // Add bullet to active slide
  const handleAddBullet = () => {
    if (!activeSlide) return;
    const bulletsNew = [...(activeSlide.bullets || []), "New strategic proof-point bullet"];
    updateSlideAt(activeSlideIndex, { bullets: bulletsNew });
    triggerToast("Added bullet point");
  };

  // Remove bullet from active slide
  const handleRemoveBullet = (bIndex: number) => {
    if (!activeSlide) return;
    const bulletsNew = (activeSlide.bullets || []).filter((_, idx) => idx !== bIndex);
    updateSlideAt(activeSlideIndex, { bullets: bulletsNew });
    triggerToast("Removed bullet point");
  };

  // Change single bullet text
  const handleBulletChange = (bIndex: number, text: string) => {
    if (!activeSlide) return;
    const bulletsNew = [...(activeSlide.bullets || [])];
    bulletsNew[bIndex] = text;
    updateSlideAt(activeSlideIndex, { bullets: bulletsNew });
  };

  // Toggle active slide heading title
  const handleTitleChange = (text: string) => {
    updateSlideAt(activeSlideIndex, { title: text });
  };

  // Change active slide presenter note text
  const handleNotesChange = (text: string) => {
    updateSlideAt(activeSlideIndex, { presenterNotes: text });
  };

  // Add brand-new slide
  const handleAddNewSlide = () => {
    const newSlideNo = deck.slides.length + 1;
    const newSlide: Slide = {
      slideNumber: newSlideNo,
      title: "New Custom Injected Title",
      bullets: [
        "First foundational premise parameters.",
        "Secondary proof mechanism and variables.",
        "Strategic next-step operational conclusion."
      ],
      presenterNotes: "This notes section guides your speaking path on this injected custom slide. Double-click to expand talking context."
    };

    const newSlides = [...deck.slides];
    newSlides.splice(activeSlideIndex + 1, 0, newSlide);
    
    // Recalculate slide numbers
    const reindexedSlides = newSlides.map((s, idx) => ({
      ...s,
      slideNumber: idx + 1
    }));

    onUpdateDeck({ ...deck, slides: reindexedSlides });
    setActiveSlideIndex(activeSlideIndex + 1);
    triggerToast(`Added Slide ${activeSlideIndex + 2}`);
  };

  // Delete slide
  const handleDeleteSlideAt = (index: number) => {
    if (deck.slides.length <= 1) {
      alert("A presentation must keep at least 1 core slide to display layout properties.");
      return;
    }
    const filteredSlides = deck.slides.filter((_, idx) => idx !== index);
    const reindexed = filteredSlides.map((s, idx) => ({
      ...s,
      slideNumber: idx + 1
    }));

    const nextIndex = Math.max(0, index - 1);
    onUpdateDeck({ ...deck, slides: reindexed });
    setActiveSlideIndex(nextIndex);
    triggerToast("Deleted slide frame");
  };

  // Shift slide left/right index
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === deck.slides.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedSlides = [...deck.slides];
    
    // Swap slides
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[newIndex];
    updatedSlides[newIndex] = temp;

    // Reindex
    const reindexed = updatedSlides.map((s, idx) => ({
      ...s,
      slideNumber: idx + 1
    }));

    onUpdateDeck({ ...deck, slides: reindexed });
    setActiveSlideIndex(newIndex);
    triggerToast(`Moved slide ${direction}`);
  };

  // Mock export / Copy presentation Markdown representation
  const handleExportText = () => {
    try {
      let docText = `# ${deck.title || "Academic Slides Summary"}\n## ${deck.subtitle || "Synthesized Draft"}\n\n`;
      deck.slides.forEach((sl) => {
        docText += `--- \n### Slide ${sl.slideNumber}: ${sl.title}\n`;
        sl.bullets.forEach((b) => {
          docText += `- ${b}\n`;
        });
        docText += `\n*Presenter Notes:* ${sl.presenterNotes}\n\n`;
      });

      const element = document.createElement("a");
      const file = new Blob([docText], { type: 'text/markdown' });
      element.href = URL.createObjectURL(file);
      element.download = "presentation-outline-draft.md";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      triggerToast("Downloaded Markdown Decks!");
    } catch (e: any) {
      alert("Failed exporting manuscript notes.");
    }
  };

  return (
    <div className={`w-full flex flex-col h-full ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`} id="slides-master-workspace">
      
      {/* Toast Alert Indicator */}
      {toastMessage && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 border text-teal-500 font-mono text-[11px] font-bold tracking-wider uppercase px-4 py-2.5 rounded-full shadow-2xl z-50 flex items-center space-x-2 animate-bounce ${
          isDark ? "bg-slate-900 border-teal-500/40" : "bg-white border-teal-500/25 shadow-lg"
        }`}>
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Slide Builder Header Bar */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b gap-4 ${
        isDark ? "border-slate-900 bg-slate-950" : "border-slate-200 bg-white shadow-sm"
      }`}>
        <div>
          <h1 className={`text-xl font-bold font-display tracking-tight flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            <Palette className="w-5 h-5 text-teal-500" />
            <span>Interactive Slide Deck Designer</span>
          </h1>
          <p className={`text-xs mt-0.5 font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Generated presentation for: <strong className="text-teal-600 font-sans font-medium">{deck.title || "Ingested Document"}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center space-x-1 shadow shadow-teal-600/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>Present Mode</span>
          </button>
          <button
            type="button"
            onClick={handleExportText}
            className={`px-3.5 py-1.5 border rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer ${
              isDark 
                ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white" 
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save MD</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className={`px-3 py-1.5 border rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
              isDark 
                ? "bg-red-950/20 hover:bg-red-950/60 border-red-900/40 text-red-300" 
                : "bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
            }`}
          >
            New Document
          </button>
        </div>
      </div>

      {/* Main split work canvas */}
      <div className={`flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden ${isDark ? "bg-slate-950" : "bg-slate-100"}`} style={{ minHeight: "calc(110vh - 120px)" }}>
        
        {/* LEFT COMPACT NAVIGATION RAIL (Thumbnails of all slides) - xl:col-span-3 */}
        <div className={`xl:col-span-3 border-r p-4 flex flex-col justify-between overflow-y-auto max-h-[85vh] ${
          isDark ? "border-slate-900 bg-slate-950/20" : "border-slate-200 bg-white"
        }`} id="slide-nav-rail">
          <div className="space-y-3">
            <div className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-slate-900" : "border-slate-100"}`}>
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Slides Outline ({deck.slides.length})</span>
              <button
                type="button"
                onClick={handleAddNewSlide}
                className="p-1 hover:bg-slate-900/20 text-teal-500 rounded transition-all cursor-pointer"
                title="Inject new slide frame"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {deck.slides.map((sl, index) => {
                const isActive = index === activeSlideIndex;
                return (
                  <div
                    key={index}
                    onClick={() => setActiveSlideIndex(index)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isActive 
                        ? isDark 
                          ? "bg-slate-900/80 border-teal-500 shadow-md scale-[1.01] text-white" 
                          : "bg-teal-55/40 border-teal-500 shadow-sm scale-[1.01] text-teal-950 font-bold"
                        : isDark
                          ? "bg-slate-950 border-slate-900 hover:border-slate-800 text-slate-300"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-mono tracking-wider font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        Slide {sl.slideNumber}
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveSlide(index, 'up'); }}
                          className={`p-0.5 rounded ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveSlide(index, 'down'); }}
                          className={`p-0.5 rounded ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
                          disabled={index === deck.slides.length - 1}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteSlideAt(index); }}
                          className="p-0.5 hover:bg-red-950 text-red-400 hover:rounded"
                          title="Delete slide"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h4 className={`text-xs font-semibold mt-1.5 truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {sl.title || "Untitled Slide Frame"}
                    </h4>
                    <span className={`text-[9px] font-mono mt-0.5 block ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {sl.bullets?.length || 0} discussion bullets
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`pt-4 mt-4 border-t ${isDark ? "border-slate-900" : "border-slate-100"}`}>
            <button
              onClick={handleAddNewSlide}
              className={`w-full py-2 border rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                isDark 
                  ? "bg-slate-950 border-slate-900 hover:bg-slate-900 text-slate-300 hover:text-white" 
                  : "bg-white border-slate-200 hover:bg-slate-100 text-slate-705 hover:text-slate-900 shadow-sm"
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-teal-500" />
              <span>Append New Slide</span>
            </button>
          </div>
        </div>

        {/* MID COLUMN LIVE CANVAS PREVIEW (xl:col-span-5) */}
        <div className={`xl:col-span-5 p-4 flex flex-col justify-between max-h-[85vh] ${
          isDark ? "bg-slate-950/40" : "bg-white border-b xl:border-b-0 border-slate-250 shadow-sm"
        }`} id="slide-preview-column">
          <div className={`flex items-center justify-between border-b pb-2 shrink-0 ${isDark ? "border-slate-900" : "border-slate-100"}`}>
            <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>16:9 Canvas Projector Preview</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-500">Theme: <strong className="text-teal-500 uppercase font-bold">{config.theme}</strong></span>
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isDark ? "bg-slate-900 text-slate-300 hover:text-white" : "bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200"
                }`}
                title="Full screen preview"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col min-h-0 mt-4">
            {activeSlide ? (
              <SlidePreviewCanvas
                slide={activeSlide}
                totalSlides={deck.slides.length}
                config={config}
                className="flex-1 w-full h-full flex flex-col justify-between"
              />
            ) : (
              <div className={`flex-1 w-full flex items-center justify-center rounded-xl font-mono text-xs border ${
                isDark ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-slate-50 text-slate-400 border-slate-200 shadow-inner"
              }`}>
                Select slide below to render
              </div>
            )}
          </div>
        </div>

        {/* RIGHT EDITOR & STYLE CONTROL TABS - xl:col-span-4 */}
        <div className={`xl:col-span-4 p-4 flex flex-col overflow-y-auto max-h-[85vh] border-l ${
          isDark ? "border-slate-900 bg-slate-950" : "border-slate-200 bg-white"
        }`} id="slide-control-tabs">
          
          {/* Tab buttons switcher */}
          <div className={`flex p-1 border rounded-lg mb-4 ${
            isDark ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200 shadow-inner"
          }`}>
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded cursor-pointer ${
                activeTab === 'content' 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : isDark 
                    ? "text-slate-400 hover:text-slate-200" 
                    : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <Edit3 className="w-3 h-3" />
                <span>Content Code</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded cursor-pointer ${
                activeTab === 'design' 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : isDark 
                    ? "text-slate-400 hover:text-slate-200" 
                    : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <Palette className="w-3 h-3" />
                <span>Design Rule</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('manuscript')}
              className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded cursor-pointer ${
                activeTab === 'manuscript' 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : isDark 
                    ? "text-slate-400 hover:text-slate-200" 
                    : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>Source</span>
              </span>
            </button>
          </div>

          {/* Content panel */}
          {activeTab === 'content' && activeSlide && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Slide numbering card */}
              <div className={`flex justify-between items-center text-xs p-2 border rounded-lg ${
                isDark 
                  ? "text-slate-400 bg-slate-900/30 border-slate-900" 
                  : "text-slate-600 bg-slate-50 border-slate-200"
              }`}>
                <span className="font-mono">Editing index {activeSlideIndex + 1} of {deck.slides.length}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSlideAt(activeSlideIndex)}
                  className="text-red-500 hover:text-red-600 font-bold uppercase text-[10px] tracking-wider cursor-pointer"
                >
                  Delete Slide
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isDark ? "text-slate-400" : "text-slate-550"}`}>Slide Title / Main Heading</label>
                <input
                  type="text"
                  value={activeSlide.title || ""}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-mono font-semibold ${
                    isDark 
                      ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-700" 
                      : "bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400"
                  }`}
                  placeholder="e.g. Critical Performance Vulnerabilities"
                />
              </div>

              {/* Bullets lists */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>Bullet Highlights (Add/Delete on fly)</label>
                  <button
                    type="button"
                    onClick={handleAddBullet}
                    className="text-[10px] font-mono uppercase tracking-wider text-teal-500 font-bold hover:text-teal-650 cursor-pointer"
                  >
                    + Add Bullet
                  </button>
                </div>

                <div className="space-y-2 mt-1">
                  {activeSlide.bullets && activeSlide.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className={`p-1.5 border text-[10px] font-mono rounded select-none shrink-0 w-8 text-center self-start ${
                        isDark 
                          ? "bg-slate-905 border-slate-800 text-slate-400" 
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}>
                        #{idx + 1}
                      </div>
                      <textarea
                        value={bullet}
                        onChange={(e) => handleBulletChange(idx, e.target.value)}
                        rows={2}
                        className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 font-sans border ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-700" 
                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                        placeholder={`Bullet point ${idx + 1} explanation`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(idx)}
                        className={`p-2 self-start border rounded-lg transition-all cursor-pointer ${
                          isDark 
                            ? "bg-slate-950 border-slate-800 hover:border-red-900/40 hover:bg-red-950/20 text-slate-500 hover:text-red-400" 
                            : "bg-white border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600"
                        }`}
                        title="Remove highlight"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!activeSlide.bullets || activeSlide.bullets.length === 0) && (
                    <div className={`p-4 border-2 border-dashed rounded-lg text-center text-xs italic ${
                      isDark ? "border-slate-800 text-slate-600" : "border-slate-200 text-slate-400"
                    }`}>
                      No bullets. Use "+ Add Bullet" above.
                    </div>
                  )}
                </div>
              </div>

              {/* Notes textarea */}
              <div className="space-y-1">
                <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isDark ? "text-slate-400" : "text-slate-550"}`}>Presenter Speaking Cues notes</label>
                <textarea
                  value={activeSlide.presenterNotes || ""}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  rows={4}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-mono leading-relaxed ${
                    isDark 
                      ? "bg-slate-950 border-slate-800 text-slate-300 placeholder-slate-705" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                  }`}
                  placeholder="These verbal notes appear under the screen during high-stakes presentations to keep the logic crisp."
                />
              </div>

            </div>
          )}

          {/* Design rule modification panel */}
          {activeTab === 'design' && (
            <div className="space-y-6 animate-fadeIn text-left">
              
              {/* Themes list selection */}
              <div className="space-y-2">
                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isDark ? "text-slate-400" : "text-slate-550"}`}>Background Presets</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "charcoal", name: "Slate Charcoal 🌌" },
                    { id: "nordic", name: "Alpine Light ❄️" },
                    { id: "sepia", name: "Warm Scholar 📜" },
                    { id: "emerald", name: "Emerald Deep 🌲" },
                    { id: "neon", name: "Midnight Cyber 👾" }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setConfig({ ...config, theme: preset.id as ThemeType })}
                      className={`p-2.5 rounded-lg border text-left text-xs font-mono font-medium transition-all flex items-center justify-between cursor-pointer ${
                        config.theme === preset.id 
                          ? "bg-teal-600 text-white border-transparent" 
                          : isDark 
                            ? "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <span>{preset.name}</span>
                      {config.theme === preset.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color highlight selecting */}
              <div className="space-y-2">
                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isDark ? "text-slate-400" : "text-slate-550"}`}>Highlight Color Spec</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "teal", name: "Teal Corporate", dot: "bg-teal-500" },
                    { id: "violet", name: "Violet", dot: "bg-violet-500" },
                    { id: "emerald", name: "Emerald", dot: "bg-emerald-500" },
                    { id: "rose", name: "Rose Ruby", dot: "bg-rose-500" },
                    { id: "amber", name: "Amber Ochre", dot: "bg-amber-500" },
                    { id: "blue", name: "Aqua Sky", dot: "bg-sky-500" }
                  ].map((accentItem) => (
                    <button
                      key={accentItem.id}
                      type="button"
                      onClick={() => setConfig({ ...config, accent: accentItem.id as AccentType })}
                      className={`px-2 py-2.5 rounded-lg border text-left text-[11px] font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
                        config.accent === accentItem.id 
                          ? isDark 
                            ? "bg-slate-905 border-teal-400 text-white font-bold" 
                            : "bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-sm"
                          : isDark 
                            ? "bg-slate-955 border-slate-800 text-slate-400 hover:text-slate-200" 
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${accentItem.dot} shrink-0`} />
                      <span className="truncate">{accentItem.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography configuration presets */}
              <div className="space-y-2">
                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isDark ? "text-slate-400" : "text-slate-550"}`}>Typography Engine Pairings</span>
                <div className="space-y-1.5">
                  {[
                    { id: "modern", name: "Space Grotesk + Inter", desc: "Bold Display & high-tech styling" },
                    { id: "editorial", name: "Playfair Display + Serif", desc: "Premium scholastic textbook elegance" },
                    { id: "technical", name: "JetBrains Mono + Fira", desc: "Scientific analytical compiler outputs" },
                    { id: "corporate", name: "Inter Sans + Inter Plain", desc: "Minimalist slick corporate deck clean" }
                  ].map((fontPair) => (
                    <button
                      key={fontPair.id}
                      type="button"
                      onClick={() => setConfig({ ...config, fontPairing: fontPair.id as FontPairingType })}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-start justify-between transition-all cursor-pointer ${
                        config.fontPairing === fontPair.id 
                          ? isDark ? "bg-teal-605/40 border-teal-500 text-white" : "bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-sm" 
                          : isDark ? "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-mono block font-bold ${isDark ? "text-slate-205" : "text-slate-800"}`}>{fontPair.name}</span>
                        <span className={`text-[10px] mt-0.5 block ${isDark ? "text-slate-500" : "text-slate-500"}`}>{fontPair.desc}</span>
                      </div>
                      {config.fontPairing === fontPair.id && <Check className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout properties alignment and size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isDark ? "text-slate-400" : "text-slate-550"}`}>Text Align alignment</span>
                  <div className={`flex p-1 border rounded-lg ${isDark ? "bg-slate-955 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, align: "left" })}
                      className={`flex-1 py-1 text-xs font-mono font-bold uppercase transition-all rounded cursor-pointer ${
                        config.align === "left" 
                          ? "bg-teal-600 text-white shadow-sm" 
                          : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, align: "center" })}
                      className={`flex-1 py-1 text-xs font-mono font-bold uppercase transition-all rounded cursor-pointer ${
                        config.align === "center" 
                          ? "bg-teal-600 text-white shadow-sm" 
                          : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Center
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isDark ? "text-slate-400" : "text-slate-550"}`}>Content Density scaling</span>
                  <div className={`flex p-1 border rounded-lg ${isDark ? "bg-slate-955 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    {[
                      { id: "compact", name: "S" },
                      { id: "normal", name: "M" },
                      { id: "generous", name: "L" }
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setConfig({ ...config, compactness: sz.id as CompactnessType })}
                        className={`flex-1 py-1 text-xs font-mono font-bold uppercase transition-all rounded cursor-pointer ${
                          config.compactness === sz.id 
                            ? "bg-teal-600 text-white shadow-sm" 
                            : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                        }`}
                        title={`${sz.id} text spacing sizing density`}
                      >
                        {sz.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card visual borders toggling */}
              <div className={`flex items-center justify-between p-3 border rounded-xl ${
                isDark ? "bg-slate-900/30 border-slate-900" : "bg-slate-50 border-slate-200"
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? "text-slate-200" : "text-slate-850"}`}>Decoration Highlight Bar</span>
                  <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Renders matching solid colored lines under slide titles</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, showCardBorder: !config.showCardBorder })}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-350 cursor-pointer ${
                    config.showCardBorder ? "bg-teal-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="w-4.5 h-4.5 bg-white rounded-full shadow" />
                </button>
              </div>

            </div>
          )}

          {/* Manuscript text context panel */}
          {activeTab === 'manuscript' && (
            <div className="space-y-4 animate-fadeIn text-left">
              <div className={`p-3 border rounded-xl flex items-start space-x-2 ${
                isDark ? "bg-teal-950/20 border-teal-900/40" : "bg-teal-50/40 border-teal-200 text-teal-950 shadow-sm"
              }`}>
                <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? "text-teal-400" : "text-teal-650"}`} />
                <div className="text-xs">
                  <span className={`font-bold block ${isDark ? "text-slate-200" : "text-slate-850"}`}>Injected Document Analysis</span>
                  <p className={`mt-0.5 font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {documentInfo ? `${documentInfo.wordCount} words analyzed` : "No document loaded"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${isDark ? "text-slate-400" : "text-slate-550"}`}>Extracted Narrative Text reference</span>
                <div className={`p-3 border max-h-[450px] overflow-y-auto rounded-lg text-xs leading-relaxed font-mono whitespace-pre-wrap select-text ${
                  isDark ? "bg-slate-955 border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700 shadow-inner"
                }`}>
                  {documentInfo?.text || "No attached manuscript available for references."}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* FULL-SCREEN PRESENTATION OVERLAY MODAL */}
      {isPlaying && activeSlide && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-6 animate-scaleIn select-none" id="presentation-overlay-mode">
          
          {/* Top presenter controls */}
          <div className="flex justify-between items-center text-xs border-b border-zinc-800 pb-4">
            <span className="font-mono text-zinc-400">
              Presentation Running: <strong className="text-teal-400">{deck.title}</strong>
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-zinc-500 hidden sm:inline font-mono">Use Arrow keys, Space, Enter or Click slide to navigate • Esc to exit</span>
              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                className="px-4 py-1.5 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 rounded font-mono font-semibold transition-all border border-zinc-800 hover:border-zinc-700 cursor-pointer"
              >
                Exit Show
              </button>
            </div>
          </div>

          {/* Centered slide view with flanking navigation buttons */}
          <div className="flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-4 gap-4 relative">
            {/* Left Flanking navigation button */}
            <button
              type="button"
              onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
              disabled={activeSlideIndex === 0}
              className="p-3.5 rounded-full bg-zinc-900/90 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-2xl hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              title="Previous Slide"
              id="floating-prev-slide"
            >
              <ChevronLeft className="w-5.5 h-5.5" />
            </button>

            {/* 16:9 Slide Screen aspect locked & height constrained */}
            <div 
              className="flex-1 max-h-[calc(100vh-220px)] aspect-[16/9] flex items-center justify-center relative cursor-pointer group/slide select-none"
              onClick={(e) => {
                // Advance slide on click unless at last slide
                if (activeSlideIndex < deck.slides.length - 1) {
                  setActiveSlideIndex((prev) => prev + 1);
                }
              }}
            >
              <SlidePreviewCanvas
                slide={activeSlide}
                totalSlides={deck.slides.length}
                config={config}
                className="w-full h-full max-h-full shadow-2xl border border-zinc-800 rounded-lg group-hover/slide:border-teal-500/20 transition-all"
              />
              
              {/* Subtle helper text overlay on hover */}
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-[10px] font-mono text-zinc-450 px-2 py-1 rounded opacity-0 group-hover/slide:opacity-100 transition-opacity">
                Click slide to advance
              </div>
            </div>

            {/* Right Flanking navigation button */}
            <button
              type="button"
              onClick={() => setActiveSlideIndex(Math.min(deck.slides.length - 1, activeSlideIndex + 1))}
              disabled={activeSlideIndex === deck.slides.length - 1}
              className="p-3.5 rounded-full bg-zinc-900/90 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-2xl hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              title="Next Slide"
              id="floating-next-slide"
            >
              <ChevronRight className="w-5.5 h-5.5" />
            </button>
          </div>

          {/* Persistent bottom slide navigation bar */}
          <div className="flex items-center justify-between border-t border-zinc-900 pt-4 max-w-4xl w-full mx-auto">
            <button
              onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
              disabled={activeSlideIndex === 0}
              className={`px-4 py-2 font-mono text-xs rounded-lg border transition-all cursor-pointer ${
                activeSlideIndex === 0 
                  ? "bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              ◀ Previous Slide
            </button>

            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">
              SLIDE {activeSlideIndex + 1} OF {deck.slides.length}
            </span>

            <button
              onClick={() => setActiveSlideIndex(Math.min(deck.slides.length - 1, activeSlideIndex + 1))}
              disabled={activeSlideIndex === deck.slides.length - 1}
              className={`px-4 py-2 font-mono text-xs rounded-lg border transition-all cursor-pointer ${
                activeSlideIndex === deck.slides.length - 1
                  ? "bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              Next Slide ▶
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
