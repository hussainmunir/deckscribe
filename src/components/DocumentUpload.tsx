import React, { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, Sparkles, Plus, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { DocumentInfo } from "../types";

interface DocumentUploadProps {
  onUploadSuccess: (doc: DocumentInfo) => void;
  onAnalysisSuccess: (analysis: any) => void;
  userApiKey: string;
  siteTheme?: "light" | "dark";
  onMissingApiKey?: () => void;
}

export default function DocumentUpload({
  onUploadSuccess,
  onAnalysisSuccess,
  userApiKey,
  siteTheme = "light",
  onMissingApiKey
}: DocumentUploadProps) {
  const isDark = siteTheme === "dark";
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [slideCount, setSlideCount] = useState<number>(8);
  const [pastedText, setPastedText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startPipelineText = async (customText: string, customTitle: string) => {
    if (!userApiKey) {
      if (onMissingApiKey) {
        onMissingApiKey();
      } else {
        setErrorMsg("Please provide your own Google Gemini API Key in the application settings first.");
      }
      return;
    }

    if (!customText.trim()) {
      setErrorMsg("Please paste or type content into the text area before generating.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setLoadingStep(1);
    setLoadingMessage("Parsing custom raw intelligence context...");

    try {
      const wordCount = customText.split(/\s+/).filter(Boolean).length;
      const documentInfo: DocumentInfo = {
        title: customTitle || "Pasted Narrative Draft",
        text: customText,
        wordCount,
      };

      onUploadSuccess(documentInfo);

      setLoadingStep(2);
      setLoadingMessage("Activating Gemini Flash slide layout engines...");

      setTimeout(() => {
        setLoadingStep(3);
        setLoadingMessage("Synthesizing structural speaker guides and bullet talking points...");
      }, 1500);

      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (userApiKey) {
        requestHeaders["x-gemini-key"] = userApiKey;
      }

      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          text: customText,
          title: documentInfo.title,
          slideCount
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server slide synthesis failed: status ${response.status}`);
      }

      const slideResponse = await response.json();
      onAnalysisSuccess(slideResponse);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while generating presentation slides.");
      setLoading(false);
    }
  };

  const startPipelineFile = async (file: File) => {
    if (!userApiKey) {
      if (onMissingApiKey) {
        onMissingApiKey();
      } else {
        setErrorMsg("Please provide your own Google Gemini API Key in the application settings first.");
      }
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      let extractedText = "";
      const fileName = file.name;

      if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
        setLoadingStep(1);
        setLoadingMessage("Reading PDF text layout grids...");
        extractedText = await extractTextFromPDF(file, (msg) => {
          setLoadingMessage(msg);
        });
      } else if (file.type === "text/plain" || fileName.endsWith(".txt")) {
        setLoadingStep(1);
        setLoadingMessage("Ingesting plain text document components...");
        extractedText = await file.text();
      } else {
        throw new Error("Unsupported format. Only PDF (.pdf) and raw text (.txt) files are supported directly.");
      }

      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      if (wordCount < 10) {
        throw new Error("This document is too short to construct structured slides.");
      }

      const documentInfo: DocumentInfo = {
        title: fileName.replace(/\.[^/.]+$/, ""),
        text: extractedText,
        wordCount,
      };

      onUploadSuccess(documentInfo);

      setLoadingStep(2);
      setLoadingMessage("Processing reasoning contexts on Gemini Flash...");

      setTimeout(() => {
        setLoadingStep(3);
        setLoadingMessage("Designing presentation cards & talking bulletins...");
      }, 1500);

      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (userApiKey) {
        requestHeaders["x-gemini-key"] = userApiKey;
      }

      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          text: extractedText,
          title: documentInfo.title,
          slideCount
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server slides generation failed: Status ${response.status}`);
      }

      const result = await response.json();
      onAnalysisSuccess(result);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while reading or parsing the file.");
      setLoading(false);
    }
  };

  const loadPdfJS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      // Use standard modern PDF.js CDN URL to avoid legacy browser fetch polyfills
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        if ((window as any).pdfjsLib) {
          resolve((window as any).pdfjsLib);
        } else {
          reject(new Error("PDF.js library loaded but pdfjsLib global was not found."));
        }
      };
      script.onerror = () => {
        reject(new Error("Failed to load PDF.js library from CDN."));
      };
      document.head.appendChild(script);
    });
  };

  const extractTextFromPDF = async (file: File, updateMsg: (msg: string) => void): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    
    updateMsg("Loading PDF processing engine...");
    const pdfjsLib = await loadPdfJS();

    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    updateMsg("Accessing PDF document bounds...");
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const maxPages = Math.min(pdf.numPages, 30); // 30 page cap is standard
    
    let fullText = "";
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      updateMsg(`Deconstructing PDF pages: ${pageNum} of ${maxPages}...`);
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      startPipelineFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      startPipelineFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-xl mx-auto p-4" id="upload-panel">
      {loading ? (
        <div className={`w-full border rounded-2xl p-8 flex flex-col items-center text-center space-y-6 shadow-xl ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`} id="upload-loading-view">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto text-teal-400 w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2 w-full">
            <h3 className={`text-base font-semibold font-display ${isDark ? "text-slate-100" : "text-slate-800"}`}>Generating Slides</h3>
            <p className="text-xs text-teal-400 font-mono min-h-[40px] px-2 leading-relaxed">{loadingMessage}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full pt-2">
            <div className="flex flex-col space-y-1">
              <div className={`h-1.5 rounded-full ${loadingStep >= 1 ? "bg-teal-505 animate-shimmer" : isDark ? "bg-slate-800" : "bg-slate-200"}`} />
              <span className={`text-[9px] uppercase tracking-wider font-mono ${loadingStep >= 1 ? "text-teal-550 font-bold" : "text-slate-400"}`}>1. Parse</span>
            </div>
            <div className="flex flex-col space-y-1">
              <div className={`h-1.5 rounded-full ${loadingStep >= 2 ? "bg-teal-505 animate-shimmer" : isDark ? "bg-slate-800" : "bg-slate-200"}`} />
              <span className={`text-[9px] uppercase tracking-wider font-mono ${loadingStep >= 2 ? "text-teal-550 font-bold" : "text-slate-400"}`}>2. Reasoning</span>
            </div>
            <div className="flex flex-col space-y-1">
              <div className={`h-1.5 rounded-full ${loadingStep >= 3 ? "bg-teal-505 animate-shimmer" : isDark ? "bg-slate-800" : "bg-slate-200"}`} />
              <span className={`text-[9px] uppercase tracking-wider font-mono ${loadingStep >= 3 ? "text-teal-550 font-bold" : "text-slate-400"}`}>3. Design</span>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-6"
        >
          {/* Deck size configuration */}
          <div className={`p-4 border rounded-xl flex items-center justify-between ${
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="space-y-0.5 animate-fade-in">
              <span className={`text-xs font-bold block ${isDark ? "text-slate-200" : "text-slate-850"}`}>Suggested Deck Size</span>
              <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Target slides Gemini Flash should produce</p>
            </div>
            <div className={`flex p-1 border rounded-lg ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              {[5, 8, 10, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSlideCount(num)}
                  className={`px-3 py-1 rounded text-xs transition-all font-mono font-bold ${
                    slideCount === num 
                      ? "bg-teal-600 text-white" 
                      : isDark 
                        ? "text-slate-400 hover:text-slate-200" 
                        : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Selector options for file vs copy-paste */}
          <div className={`flex space-x-2 border-b pb-2 ${isDark ? "border-slate-900" : "border-slate-100"}`}>
            <button
              onClick={() => setShowPasteArea(false)}
              className={`pb-2 px-4 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all ${
                !showPasteArea 
                  ? "text-teal-500 border-teal-500" 
                  : isDark 
                    ? "text-slate-500 hover:text-slate-300 border-transparent" 
                    : "text-slate-450 hover:text-slate-700 border-transparent"
              }`}
            >
              Attach Document
            </button>
            <button
              onClick={() => setShowPasteArea(true)}
              className={`pb-2 px-4 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all ${
                showPasteArea 
                  ? "text-teal-500 border-teal-500" 
                  : isDark 
                    ? "text-slate-500 hover:text-slate-300 border-transparent" 
                    : "text-slate-450 hover:text-slate-700 border-transparent"
              }`}
            >
              Paste Plan or Raw Text
            </button>
          </div>

          {!showPasteArea ? (
            /* Upload box */
            <div
              className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 shadow-lg ${
                isDragging
                  ? "border-teal-500 bg-teal-505/10 scale-[1.01]"
                  : isDark
                    ? "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60"
                    : "border-slate-250 hover:border-slate-350 bg-white hover:bg-slate-50/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              id="file-drop-area"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt"
                className="hidden"
              />
              
              <div className={`p-3.5 border rounded-full mb-3 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                <Upload className={`w-6 h-6 ${isDark ? "text-slate-300" : "text-slate-650"}`} />
              </div>

              <h4 className={`text-base font-bold font-display ${isDark ? "text-slate-100" : "text-slate-800"}`}>Select PDF or TXT Paper</h4>
              <p className={`text-xs mt-1 max-w-xs mx-auto ${isDark ? "text-slate-400" : "text-slate-550"}`}>
                Upload dense academic PDFs, financial logs, or tech documentation to convert them into a presentation deck instantly.
              </p>

              <button
                type="button"
                className={`mt-5 px-4 py-2 border text-xs font-bold shadow-sm transition-all rounded-lg ${
                  isDark 
                    ? "bg-slate-950 border-slate-800 text-slate-200 hover:text-white" 
                    : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Choose File From Local
              </button>
            </div>
          ) : (
            /* Paste area */
            <div className={`space-y-3 p-5 border rounded-xl ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`} id="paste-input-area">
              <div className="space-y-1">
                <label className={`text-[10px] uppercase tracking-wider font-mono font-semibold ${isDark ? "text-slate-400" : "text-slate-550"}`}>Presentation Topic / Draft Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Scalability Strategy Review"
                  id="paste-title-input"
                  className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-teal-500 ${
                    isDark 
                      ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-700" 
                      : "bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] uppercase tracking-wider font-mono font-semibold ${isDark ? "text-slate-400" : "text-slate-550"}`}>Raw Text Content to Analyze</label>
                <textarea
                  placeholder="Paste raw notes, minutes, manuscript chapters, or outlines. Prompt instructions will transform this content into perfect speaking slides..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={5}
                  className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-teal-500 font-sans ${
                    isDark 
                      ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-700" 
                      : "bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400"
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const titleInp = document.getElementById("paste-title-input") as HTMLInputElement;
                  startPipelineText(pastedText, titleInp?.value || "Narrative Presentation");
                }}
                className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Deconstruct Text into Slides</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 border rounded-xl flex items-start space-x-2.5 text-xs ${
                isDark ? "bg-red-950/20 border-red-900/55 text-red-200" : "bg-red-50 border-red-200 text-red-800"
              }`}
              id="upload-error-banner"
            >
              <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Pipeline Halt</span>
                <span>{errorMsg}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
