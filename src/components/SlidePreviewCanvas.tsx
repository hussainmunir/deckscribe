import React from "react";
import { Slide, DesignConfig } from "../types";
import { Sparkles, ArrowRight, User, GraduationCap, Quote } from "lucide-react";

interface SlidePreviewCanvasProps {
  slide: Slide;
  totalSlides: number;
  config: DesignConfig;
  className?: string;
}

export default function SlidePreviewCanvas({
  slide,
  totalSlides,
  config,
  className = "aspect-[16/9]"
}: SlidePreviewCanvasProps) {
  if (!slide) {
    return (
      <div className={`w-full flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800 text-slate-500 ${className}`}>
        No active slide chosen. Select or add a slide to preview.
      </div>
    );
  }

  // Choose Font Pairing Styles
  const getFontStyles = () => {
    switch (config.fontPairing) {
      case "editorial":
        return {
          title: "font-serif tracking-normal font-bold",
          body: "font-serif",
          bulletIcon: "❦"
        };
      case "technical":
        return {
          title: "font-mono tracking-tight font-bold",
          body: "font-mono",
          bulletIcon: "❯"
        };
      case "modern":
        return {
          title: "font-sans uppercase tracking-tight font-black",
          body: "font-sans",
          bulletIcon: "✦"
        };
      case "corporate":
      default:
        return {
          title: "font-sans tracking-tight font-extrabold",
          body: "font-sans",
          bulletIcon: "■"
        };
    }
  };

  // Choose Theme Backgrounds, Cards, Borders and Text Colors
  const getThemeClasses = () => {
    switch (config.theme) {
      case "nordic":
        return {
          container: "bg-slate-100 text-slate-900 border-slate-300",
          card: "bg-white border-slate-200/80 shadow-md",
          titleText: "text-slate-900",
          bodyText: "text-slate-700",
          notesBg: "bg-slate-200/55 text-slate-800 border-slate-300/60",
          decoratorGlow: "bg-teal-300/10"
        };
      case "sepia":
        return {
          container: "bg-stone-100 text-stone-900 border-stone-300",
          card: "bg-[#f5f2eb] border-stone-200/90 shadow-sm",
          titleText: "text-stone-900",
          bodyText: "text-stone-800",
          notesBg: "bg-stone-200/60 text-stone-800 border-stone-300/60",
          decoratorGlow: "bg-amber-300/5"
        };
      case "emerald":
        return {
          container: "bg-emerald-950 text-emerald-100 border-emerald-900",
          card: "bg-emerald-900/25 border-emerald-800/40 shadow-xl",
          titleText: "text-emerald-500",
          bodyText: "text-emerald-200/90",
          notesBg: "bg-emerald-950/60 text-emerald-300 border-emerald-900/50",
          decoratorGlow: "bg-emerald-400/5"
        };
      case "neon":
        return {
          container: "bg-black text-zinc-100 border-zinc-900",
          card: "bg-zinc-950 border-emerald-500/25 shadow-inner shadow-emerald-950",
          titleText: "text-white tracking-widest uppercase font-mono border-b border-emerald-500/20 pb-1.5",
          bodyText: "text-zinc-300",
          notesBg: "bg-zinc-900/80 text-emerald-400 border-emerald-500/10 font-mono",
          decoratorGlow: "bg-emerald-500/5"
        };
      case "charcoal":
      default:
        return {
          container: "bg-slate-950 text-slate-100 border-slate-800",
          card: "bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm",
          titleText: "text-slate-100",
          bodyText: "text-slate-300",
          notesBg: "bg-teal-950/25 text-teal-200 border-teal-900/40",
          decoratorGlow: "bg-teal-500/5"
        };
    }
  };

  // Choose Accent color highlights
  const getAccentColor = () => {
    switch (config.accent) {
      case "violet": return { primary: "text-violet-500", rawHex: "#8b5cf6", bg: "bg-violet-500/10 border-violet-500/20" };
      case "emerald": return { primary: "text-emerald-500", rawHex: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/20" };
      case "rose": return { primary: "text-rose-500", rawHex: "#f43f5e", bg: "bg-rose-500/10 border-rose-500/20" };
      case "amber": return { primary: "text-amber-500", rawHex: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/20" };
      case "blue": return { primary: "text-sky-500", rawHex: "#0ea5e9", bg: "bg-sky-500/10 border-sky-500/20" };
      case "teal":
      default:
        return { primary: "text-teal-400", rawHex: "#14b8a6", bg: "bg-teal-500/10 border-teal-500/20" };
    }
  };

  // Content density scale values
  const getDensityStyle = () => {
    switch (config.compactness) {
      case "compact":
        return {
          titleSize: "text-base sm:text-lg md:text-xl",
          bulletSize: "text-[11px] sm:text-[13px] leading-relaxed",
          bulletSpacing: "space-y-1.5",
          cardPadding: "p-4 sm:p-5"
        };
      case "generous":
        return {
          titleSize: "text-xl sm:text-3xl md:text-4xl",
          bulletSize: "text-sm sm:text-lg leading-relaxed",
          bulletSpacing: "space-y-4",
          cardPadding: "p-8 sm:p-10"
        };
      case "normal":
      default:
        return {
          titleSize: "text-lg sm:text-2xl md:text-3xl",
          bulletSize: "text-xs sm:text-base leading-relaxed",
          bulletSpacing: "space-y-2.5",
          cardPadding: "p-6 sm:p-8"
        };
    }
  };

  const fonts = getFontStyles();
  const theme = getThemeClasses();
  const accent = getAccentColor();
  const density = getDensityStyle();

  return (
    <div
      className={`relative w-full rounded-2xl border flex flex-col justify-between overflow-hidden transition-all duration-300 select-text ${theme.container} ${fonts.body} ${className}`}
      id="slide-projection-screen"
      style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)" }}
    >
      {/* Visual background ambient lighting glows for premium feeling */}
      <div className={`absolute top-0 right-0 w-1/3 h-1/3 rounded-full blur-[80px] transition-all ${theme.decoratorGlow}`} />
      <div className={`absolute bottom-0 left-0 w-1/3 h-1/3 rounded-full blur-[80px] transition-all ${theme.decoratorGlow}`} />

      {/* Presentation canvas inner margin */}
      <div className="flex-1 flex flex-col justify-between p-5 sm:p-7 md:p-9 relative z-10">
        
        {/* Slide Tracker Top Header */}
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5 shrink-0">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: accent.rawHex }} />
            <span className="text-[10px] sm:text-xs font-mono tracking-widest uppercase opacity-60">
              Presentation Outline Project
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-mono font-bold opacity-50">
            SLIDE {slide.slideNumber} / {totalSlides}
          </span>
        </div>

        {/* Dynamic Center/Left-aligned Slide Body area */}
        <div className={`flex-1 flex flex-col justify-center my-auto ${config.align === "center" ? "items-center text-center" : "items-start text-left"}`}>
          <div className="w-full max-w-4xl space-y-4">
            
            <h2 className={`text-teal-400 ${fonts.title} ${density.titleSize} ${theme.titleText}`} style={{ color: config.align === "center" ? undefined : accent.rawHex }}>
              {slide.title || "Untitled Slide Frame"}
            </h2>

            {/* Flat accent indicator bar */}
            {config.showCardBorder && (
              <div
                className={`h-1 w-16 rounded-full transition-all ${config.align === "center" ? "mx-auto" : "mr-auto"}`}
                style={{ backgroundColor: accent.rawHex }}
              />
            )}

            {/* Bullet points array */}
            <div className="pt-2">
              <ul className={`text-slate-300 ${density.bulletSpacing}`}>
                {slide.bullets && slide.bullets.length > 0 ? (
                  slide.bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-3 text-left ${density.bulletSize} ${theme.bodyText} opacity-95 hover:opacity-100 transition-opacity`}
                    >
                      <span
                        className="font-bold select-none text-[12px] sm:text-sm pt-0.5 shrink-0"
                        style={{ color: accent.rawHex }}
                      >
                        {fonts.bulletIcon}
                      </span>
                      <span className="leading-normal">{bullet}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No bullet content. Use the slide content editor to populate metrics.</p>
                )}
              </ul>
            </div>

          </div>
        </div>

        {/* Mini presenter notes display pinned when presenting */}
        <div className="flex justify-between items-center text-[10px] opacity-40 shrink-0 select-none">
          <span>Editable Slides Design Platform</span>
          <span>Press ESC to leave presentation preview</span>
        </div>
      </div>
    </div>
  );
}
