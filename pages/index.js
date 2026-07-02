import React, { useState, useEffect, useCallback, useRef } from "react";
import { client } from "@/src/sanity/lib/client";
import {
  FiMenu,
  FiPlus,
  FiTrash2,
  FiMoon,
  FiSun,
  FiClock,
  FiMinus,
  FiZap,
  FiType,
  FiCheck,
  FiTv,
  FiPlay,
  FiPause,
  FiRefreshCw,
} from "react-icons/fi";

const WPM_PRESETS = [
  { label: "Tutorial", value: 130 },
  { label: "Standard", value: 150 },
  { label: "Vlog", value: 170 },
];

const FONT_OPTIONS = [
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Calibri Light", value: "'Calibri Light', Calibri, sans-serif" },
  { name: "Merriweather", value: "'Merriweather', serif" },
  { name: "Playfair Display", value: "'Playfair Display', serif" },
  { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { name: "Lora", value: "'Lora', serif" },
];

const FONT_WEIGHTS = [
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
];

const THEMES = [
  { id: "zinc", name: "Monochrome", color: "bg-zinc-500", accentClass: "zinc" },
  { id: "violet", name: "Amethyst", color: "bg-violet-500", accentClass: "violet" },
  { id: "blue", name: "Sapphire", color: "bg-blue-500", accentClass: "blue" },
  { id: "emerald", name: "Emerald", color: "bg-emerald-500", accentClass: "emerald" },
  { id: "amber", name: "Amber", color: "bg-amber-500", accentClass: "amber" },
  { id: "rose", name: "Rose", color: "bg-rose-500", accentClass: "rose" },
];

const getThemeClasses = (themeId, isDark) => {
  const mappings = {
    zinc: {
      appBg: isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50/60 text-zinc-800",
      sidebarBg: isDark ? "bg-zinc-950 border-zinc-800/80" : "bg-zinc-100 border-zinc-200",
      bgActive: isDark ? "bg-zinc-800 text-zinc-100" : "bg-zinc-200 text-zinc-900",
      borderActive: "border-zinc-500",
      textAccent: isDark ? "text-zinc-400" : "text-zinc-600",
      aiActive: "border-zinc-500/50 text-zinc-600 bg-zinc-500/10 dark:text-zinc-300 dark:bg-zinc-500/20",
      hudBg: isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-100 border-zinc-200",
    },
    violet: {
      appBg: isDark ? "bg-gray-900 text-neutral-100" : "bg-violet-50/40 text-neutral-800",
      sidebarBg: isDark ? "bg-violet-900 border-violet-900/40" : "bg-violet-100/70 border-violet-200/80",
      bgActive: isDark ? "bg-violet-900/60 text-violet-200" : "bg-violet-200/70 text-violet-950",
      borderActive: "border-violet-500",
      textAccent: isDark ? "text-violet-400" : "text-violet-600",
      aiActive: "border-violet-500/50 text-violet-600 bg-violet-500/10 dark:text-violet-300 dark:bg-violet-500/20",
      hudBg: isDark ? "bg-violet-950/50 border-violet-900/30" : "bg-violet-100/70 border-violet-200/60",
    },
    blue: {
      appBg: isDark ? "bg-gray-900 text-neutral-200" : "bg-blue-50/40 text-neutral-800",
      sidebarBg: isDark ? "bg-gray-900 border-blue-900/40" : "bg-blue-100/70 border-blue-200/80",
      bgActive: isDark ? "bg-blue-900/60 text-blue-200" : "bg-blue-200/70 text-blue-950",
      borderActive: "border-blue-500",
      textAccent: isDark ? "text-blue-400" : "text-blue-600",
      aiActive: "border-blue-500/50 text-blue-600 bg-violet-500/10 dark:text-blue-300 dark:bg-blue-500/20",
      hudBg: isDark ? "bg-blue-950/50 border-blue-900/30" : "bg-blue-100/70 border-blue-200/60",
    },
    emerald: {
      appBg: isDark ? "bg-gray-900 text-neutral-200" : "bg-emerald-50/30 text-neutral-800",
      sidebarBg: isDark ? "bg-gray-900 border-emerald-900/30" : "bg-emerald-100/60 border-emerald-200/70",
      bgActive: isDark ? "bg-gray-900 text-emerald-200" : "bg-emerald-200/60 text-emerald-950",
      borderActive: "border-emerald-500",
      textAccent: isDark ? "text-emerald-400" : "text-emerald-600",
      aiActive: "border-emerald-500/50 text-emerald-600 bg-emerald-500/10 dark:text-emerald-300 dark:bg-emerald-500/20",
      hudBg: isDark ? "bg-gray-950/40 border-emerald-900/30" : "bg-emerald-100/60 border-emerald-200/60",
    },
    amber: {
      appBg: isDark ? "bg-amber-950/10 text-neutral-200" : "bg-amber-50/30 text-neutral-800",
      sidebarBg: isDark ? "bg-amber-950/40 border-amber-900/30" : "bg-amber-100/60 border-amber-200/70",
      bgActive: isDark ? "bg-amber-900/40 text-amber-200" : "bg-amber-200/60 text-amber-950",
      borderActive: "border-amber-500",
      textAccent: isDark ? "text-amber-400" : "text-amber-600",
      aiActive: "border-amber-500/50 text-amber-600 bg-amber-500/10 dark:text-amber-300 dark:bg-amber-500/20",
      hudBg: isDark ? "bg-gray-950/40 border-amber-900/30" : "bg-amber-100/60 border-amber-200/60",
    },
    rose: {
      appBg: isDark ? "bg-rose-900 text-neutral-200" : "bg-rose-50/30 text-neutral-800",
      sidebarBg: isDark ? "bg-rose-900 border-rose-900/30" : "bg-rose-100/60 border-rose-200/70",
      bgActive: isDark ? "bg-rose-900/50 text-rose-200" : "bg-rose-200/60 text-rose-950",
      borderActive: "border-rose-500",
      textAccent: isDark ? "text-rose-400" : "text-rose-600",
      aiActive: "border-rose-500/50 text-rose-600 bg-rose-500/10 dark:text-rose-300 dark:bg-rose-500/20",
      hudBg: isDark ? "bg-rose-950/40 border-rose-900/30" : "bg-rose-100/60 border-rose-200/60",
    },
  };
  return mappings[themeId] || mappings.zinc;
};

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 48; // Increased for better teleprompter visibility
const FONT_STEP = 2;

const MIN_LINE_HEIGHT = 1.4;
const MAX_LINE_HEIGHT = 2.4;
const LINE_HEIGHT_STEP = 0.2;

export default function LiveTextEditor() {
  const [articles, setArticles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [wpm, setWpm] = useState(150);
  const [showWpmMenu, setShowWpmMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("zinc");
  const [wpmInput, setWpmInput] = useState("150");
  
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [fontWeight, setFontWeight] = useState("300");
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  
  const [aiMode, setAiMode] = useState(false);

  // Teleprompter Engine Engine States
  const [teleprompterMode, setTeleprompterMode] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // Base pixels per frame layout

  const editorRef = useRef(null);
  const wpmMenuRef = useRef(null);
  const themeMenuRef = useRef(null);
  const fetchControllerRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  const themeThemeClass = getThemeClasses(currentTheme, darkMode);



  useEffect(() => {
  const handler = (e) => {
    alert(`Key: ${e.key}`);
    console.log(e);
  };

  window.addEventListener("keydown", handler);

  return () => window.removeEventListener("keydown", handler);
}, []);




  useEffect(() => {
    async function fetchArticles() {
      const result = await client.fetch(
        `*[_type == "novelContent"]{_id, title, content, completed}`
      );
      setArticles(result);
      if (result.length > 0) setSelectedId(result[0]._id);
    }
    fetchArticles();
  }, []);

  useEffect(() => {
    async function fetchContent() {
      if (!selectedId) return;
      removeGhostText(); 
      const doc = await client.getDocument(selectedId);
      setTitle(doc?.title || "");
      setContent(doc?.content || "");
      if (editorRef.current) editorRef.current.innerHTML = doc?.content || "";
    }
    fetchContent();
  }, [selectedId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wpmMenuRef.current && !wpmMenuRef.current.contains(e.target)) {
        setShowWpmMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Teleprompter Automated Scroll Loop Handler Matrix
  useEffect(() => {
    if (isScrolling && teleprompterMode) {
      const performScroll = () => {
        window.scrollBy(0, scrollSpeed);
        scrollIntervalRef.current = requestAnimationFrame(performScroll);
      };
      scrollIntervalRef.current = requestAnimationFrame(performScroll);
    } else {
      cancelAnimationFrame(scrollIntervalRef.current);
    }

    return () => cancelAnimationFrame(scrollIntervalRef.current);
  }, [isScrolling, scrollSpeed, teleprompterMode]);

  // Global Key Down Interception for Physical Volume Button Configuration
  useEffect(() => {
    const handleHardwareKeys = (e) => {
      if (!teleprompterMode) return;

      // Intercept standard volume triggers safely to configure scrolling rate metrics
      if (e.key === "VolumeUp" || e.key === "ArrowUp") {
        e.preventDefault();
        setScrollSpeed((prev) => Math.min(prev + 0.5, 10));
      } else if (e.key === "VolumeDown" || e.key === "ArrowDown") {
        e.preventDefault();
        setScrollSpeed((prev) => Math.max(prev - 0.5, 0.5));
      } else if (e.key === " ") {
        e.preventDefault();
        setIsScrolling((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleHardwareKeys);
    return () => window.removeEventListener("keydown", handleHardwareKeys);
  }, [teleprompterMode]);

  const saveToSanity = useCallback(
    debounce(async (htmlContent, newTitle) => {
      if (!selectedId) return;
      setSaving(true);
      try {
        await client
          .patch(selectedId)
          .set({ content: htmlContent, title: newTitle })
          .commit({ autoGenerateArrayKeys: true });
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error("Save error:", err);
      }
      setSaving(false);
    }, 800),
    [selectedId]
  );

  const removeGhostText = () => {
    const ghost = document.getElementById("ghost-suggestion");
    if (ghost) ghost.remove();
  };

  const insertGhostText = (text) => {
    removeGhostText(); 

    const ghost = document.createElement("span");
    ghost.id = "ghost-suggestion";
    ghost.contentEditable = "false";
    ghost.style.opacity = "0.35";
    ghost.style.pointerEvents = "none";
    ghost.innerText = text;

    const selection = window.getSelection();
    if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.insertNode(ghost);
      range.setStartBefore(ghost);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.appendChild(ghost);
    }
  };

  const acceptGhostText = () => {
    const ghost = document.getElementById("ghost-suggestion");
    if (ghost) {
      const text = ghost.innerText;
      const textNode = document.createTextNode(text);
      ghost.parentNode.replaceChild(textNode, ghost);

      const selection = window.getSelection();
      const range = document.createRange();
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    }
  };

  const fetchSuggestion = useCallback(
    debounce(async (currentText) => {
      if (!aiMode) return;

      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      try {
        const response = await fetch("/api/ghost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: currentText,
            mode: currentText.trim().length === 0 ? "start" : "continue",
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.suggestion) {
            insertGhostText(data.suggestion);
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("AI fetch error:", err);
        }
      }
    }, 1000),
    [aiMode]
  );

  const handleKeyDown = (e) => {
    const ghost = document.getElementById("ghost-suggestion");
    
    if (e.key === "Tab" && ghost) {
      e.preventDefault();
      acceptGhostText();
    } else if (
      e.key !== "Shift" &&
      e.key !== "Control" &&
      e.key !== "Alt" &&
      e.key !== "Meta" &&
      ghost
    ) {
      removeGhostText();
    }
  };

  const handleInput = () => {
    removeGhostText(); 
    const html = editorRef.current.innerHTML;
    const plainText = editorRef.current.innerText; 
    
    setContent(html);
    saveToSanity(html, title);

    if (aiMode) {
      fetchSuggestion(plainText);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    saveToSanity(content, newTitle);
  };

  const createNewArticle = async () => {
    const doc = await client.create({
      _type: "novelContent",
      title: "Untitled",
      content: "",
      completed: false,
    });
    setArticles((prev) => [...prev, doc]);
    setSelectedId(doc._id);
  };

  const deleteArticle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scene?")) return;
    try {
      await client.delete(id);
      setArticles((prev) => prev.filter((a) => a._id !== id));

      if (selectedId === id) {
        const remaining = articles.filter((a) => a._id !== id);
        if (remaining.length > 0) {
          setSelectedId(remaining[0]._id);
        } else {
          setSelectedId(null);
          setTitle("");
          setContent("");
          if (editorRef.current) editorRef.current.innerHTML = "";
        }
      }
    } catch (err) {
      console.error("Error deleting article:", err);
    }
  };

  const applyWpm = (value) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setWpm(num);
      setWpmInput(String(num));
    }
    setShowWpmMenu(false);
  };

  const toggleFontWeight = () => {
    setFontWeight((prev) => {
      if (prev === "300") return "400";
      if (prev === "400") return "500";
      return "300";
    });
  };

  const resetTeleprompterScroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsScrolling(false);
  };

  const wordCount = content
    ? content
        .replace(/<[^>]+>/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  const totalSeconds = Math.round((wordCount / wpm) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      style={{ fontFamily: selectedFont }}
      className={`flex min-h-screen transition-colors duration-300 ${
        teleprompterMode ? "bg-black text-white" : themeThemeClass.appBg
      }`}
    >
      {/* Dynamic Mirror Bar Component Target Overlay */}
      {teleprompterMode && (
        <div 
          className="fixed left-0 right-0 top-1/2 -translate-y-1/2 h-24 bg-red-600/30 border-y border-red-500/50 pointer-events-none z-50 flex items-center justify-between px-4"
        >
          <div className="text-[9px] uppercase tracking-widest text-red-400 font-bold bg-black/40 px-2 py-0.5 rounded-sm">
            Focus Lock
          </div>
          <div className="text-[9px] uppercase tracking-widest text-red-400 font-bold bg-black/40 px-2 py-0.5 rounded-sm">
            Speed: {scrollSpeed}px
          </div>
        </div>
      )}

      {/* Backdrop on mobile when sidebar is open */}
      {showSidebar && !teleprompterMode && (
        <div
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
        ></div>
      )}

      {/* Mobile toggle button */}
      {!teleprompterMode && (
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`absolute top-5 right-5 z-50 md:hidden p-2 rounded-full border transition-colors ${
            darkMode
              ? "border-neutral-700/60 text-neutral-300 hover:bg-neutral-800"
              : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
          }`}
        >
          <FiMenu size={16} />
        </button>
      )}

      {/* Dynamic Structural Sidebar */}
      {!teleprompterMode && (
        <div
          className={`fixed md:sticky top-0 left-0 h-screen z-40 transform md:transform-none
            transition-colors duration-300 w-64 border-r overflow-y-auto shrink-0 px-5 py-8
            ${themeThemeClass.sidebarBg}
            ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        >
          <h2
            className={`text-[11px] font-normal uppercase tracking-[0.15em] mb-5 ${
              darkMode ? "text-neutral-500" : "text-neutral-400"
            }`}
          >
            Scripts
          </h2>

          <button
            onClick={createNewArticle}
            className={`w-full mb-6 flex items-center justify-center gap-2 py-2.5 text-[11px] tracking-wider rounded-sm border transition-colors ${
              darkMode
                ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800/50"
                : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <FiPlus size={13} />
            NEW SCRIPT
          </button>

          <div className="flex flex-col gap-1">
            {articles.map((a) => (
              <div key={a._id} className="group flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedId(a._id);
                    setShowSidebar(false);
                  }}
                  className={`flex-1 text-left px-3 py-3 rounded-md text-[10px] tracking-wide truncate transition-colors ${
                    selectedId === a._id
                      ? themeThemeClass.bgActive
                      : darkMode
                      ? "text-neutral-400 hover:bg-neutral-900/40"
                      : "text-neutral-500 hover:bg-black/5"
                  }`}
                >
                  {a.title || "Untitled"}
                </button>
                <button
                  onClick={() => deleteArticle(a._id)}
                  className={`opacity-0 group-hover:opacity-100 p-1.5 rounded transition-opacity ${
                    darkMode
                      ? "text-neutral-600 hover:text-red-400"
                      : "text-neutral-400 hover:text-red-500"
                  }`}
                  title="Delete scene"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Sheet Area */}
      <div className={`flex-grow w-full px-8 pt-10 pb-32 max-w-3xl mx-auto transition-all ${teleprompterMode ? "my-auto py-48" : ""}`}>
        
        {/* Fixed Control Box for Teleprompter Session Engine */}
        {teleprompterMode && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-neutral-800 backdrop-blur px-4 py-2.5 rounded-full flex items-center gap-4 z-50 text-white shadow-2xl">
            <button 
              onClick={() => setIsScrolling(!isScrolling)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
              title={isScrolling ? "Pause scrolling" : "Start scrolling"}
            >
              {isScrolling ? <FiPause size={14} /> : <FiPlay size={14} />}
            </button>
            <button 
              onClick={resetTeleprompterScroll}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition"
              title="Reset position"
            >
              <FiRefreshCw size={13} />
            </button>
            <div className="w-[1px] h-4 bg-neutral-800" />
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setScrollSpeed(p => Math.max(p - 0.5, 0.5))}
                className="text-[11px] px-2 py-0.5 bg-neutral-800 rounded hover:bg-neutral-700"
              >
                -
              </button>
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 w-12 text-center">
                {scrollSpeed.toFixed(1)}px
              </span>
              <button 
                onClick={() => setScrollSpeed(p => Math.min(p + 0.5, 10))}
                className="text-[11px] px-2 py-0.5 bg-neutral-800 rounded hover:bg-neutral-700"
              >
                +
              </button>
            </div>
            <div className="w-[1px] h-4 bg-neutral-800" />
            <button 
              onClick={() => {
                setTeleprompterMode(false);
                setIsScrolling(false);
              }}
              className="text-[10px] bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full text-white font-medium tracking-wider uppercase transition-colors"
            >
              Exit Mode
            </button>
          </div>
        )}

        {!teleprompterMode && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center h-5 select-none">
              {saving ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-400/70 shrink-0" />
                  <span className={`text-[12px] font-light tracking-wide ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                    {lastSaved}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full border border-dashed shrink-0 ${darkMode ? "border-neutral-800" : "border-neutral-300"}`} />
                </div>
              )}
            </div>

            {/* Configuration Engine Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Teleprompter Toggle Trigger */}
              <button
                onClick={() => {
                  setTeleprompterMode(true);
                  if (fontSize < 24) setFontSize(28); // Standardize scaling target configuration
                }}
                className={`px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                  darkMode
                    ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                    : "border-neutral-200 text-neutral-400 hover:bg-neutral-100"
                }`}
                title="Launch Teleprompter Mirror Workspace"
              >
                <FiTv size={13} />
                <span className="text-[11px] uppercase tracking-wider font-medium">PROMPTER</span>
              </button>

              <button
                onClick={() => {
                  setAiMode(!aiMode);
                  if (aiMode) removeGhostText(); 
                }}
                className={`px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                  aiMode
                    ? themeThemeClass.aiActive
                    : darkMode
                    ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                    : "border-neutral-200 text-neutral-400 hover:bg-neutral-100"
                }`}
                title="Toggle AI Ghost Suggestions"
              >
                <FiZap size={13} className={aiMode ? "fill-current" : ""} />
                <span className="text-[11px] uppercase tracking-wider font-medium">
                  {aiMode ? "AI ON" : "AI OFF"}
                </span>
              </button>

              <div className="relative flex items-center">
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className={`text-[11px] font-light rounded-full pl-3 pr-8 py-1.5 border appearance-none outline-none transition-colors cursor-pointer ${
                    darkMode
                      ? "bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                      : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <FiType size={11} className="absolute right-3 pointer-events-none text-neutral-400" />
              </div>

              <button
                onClick={toggleFontWeight}
                className={`text-[11px] font-light rounded-full px-3 py-1.5 border transition-colors ${
                  darkMode
                    ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                    : "border-neutral-200 text-neutral-400 hover:bg-neutral-100"
                }`}
                title="Toggle Font Weight"
              >
                W: {FONT_WEIGHTS.find(w => w.value === fontWeight)?.label}
              </button>

              <div className={`flex items-center rounded-full border overflow-hidden ${darkMode ? "border-neutral-700" : "border-neutral-200"}`}>
                <button
                  onClick={() => setFontSize((prev) => Math.max(prev - FONT_STEP, MIN_FONT_SIZE))}
                  disabled={fontSize <= MIN_FONT_SIZE}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-400 hover:bg-neutral-100"}`}
                  title="Decrease size"
                >
                  <FiMinus size={11} />
                </button>
                <span className={`text-[11px] font-light w-8 text-center select-none ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize((prev) => Math.min(prev + FONT_STEP, MAX_FONT_SIZE))}
                  disabled={fontSize >= MAX_FONT_SIZE}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-400 hover:bg-neutral-100"}`}
                  title="Increase size"
                >
                  <FiPlus size={11} />
                </button>

                <div className={`w-[1px] h-4 ${darkMode ? "bg-neutral-800" : "bg-neutral-200"}`} />

                <button
                  onClick={() => setLineHeight((prev) => Math.max(parseFloat((prev - LINE_HEIGHT_STEP).toFixed(1)), MIN_LINE_HEIGHT))}
                  disabled={lineHeight <= MIN_LINE_HEIGHT}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-400 hover:bg-neutral-100"}`}
                  title="Decrease Line Spacing"
                >
                  <FiMinus size={11} />
                </button>
                <span className={`text-[11px] font-light w-10 text-center select-none ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  {lineHeight}LH
                </span>
                <button
                  onClick={() => setLineHeight((prev) => Math.min(parseFloat((prev + LINE_HEIGHT_STEP).toFixed(1)), MAX_LINE_HEIGHT))}
                  disabled={lineHeight >= MAX_LINE_HEIGHT}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-400 hover:bg-neutral-100"}`}
                  title="Increase Line Spacing"
                >
                  <FiPlus size={11} />
                </button>
              </div>

              <div className="relative" ref={themeMenuRef}>
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-transform active:scale-95 ${
                    darkMode ? "border-neutral-700" : "border-neutral-200"
                  }`}
                  title="Change Theme Palette"
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${THEMES.find(t => t.id === currentTheme)?.color}`} />
                </button>

                {showThemeMenu && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-40 rounded-xl border shadow-xl p-2.5 z-50 ${
                      darkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                    }`}
                  >
                    <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 px-1 ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                      Palette Signature
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setCurrentTheme(t.id);
                            setShowThemeMenu(false);
                          }}
                          className={`h-9 rounded-lg flex items-center justify-center transition-colors border ${
                            currentTheme === t.id
                              ? darkMode
                                ? "border-neutral-400 bg-neutral-800"
                                : "border-neutral-900 bg-neutral-50"
                              : "border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                          title={t.name}
                        >
                          <span className={`w-4 h-4 rounded-full ${t.color} flex items-center justify-center text-white`}>
                            {currentTheme === t.id && <FiCheck size={10} />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full border transition-colors ${
                  darkMode
                    ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                    : "border-neutral-200 text-neutral-400 hover:bg-neutral-100"
                }`}
              >
                {darkMode ? <FiSun size={14} /> : <FiMoon size={14} />}
              </button>
            </div>
          </div>
        )}

        {!teleprompterMode && (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled scene"
            className={`w-full text-2xl font-light bg-transparent mb-6 outline-none placeholder:font-light ${
              darkMode
                ? "placeholder:text-neutral-700 text-neutral-100"
                : "placeholder:text-neutral-300 text-neutral-900"
            }`}
          />
        )}

        {/* Dynamic Context Writing Canvas */}
        <div
          ref={editorRef}
          contentEditable={!teleprompterMode}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className={`min-h-[400px] outline-none transition-all duration-150 ${
            teleprompterMode 
              ? "text-white select-none pointer-events-none text-center" 
              : darkMode 
              ? "text-neutral-200" 
              : "text-neutral-700"
          }`}
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            fontWeight: fontWeight,
            transform: teleprompterMode ? "scaleX(-1)" : "none", // Teleprompter Mirror Transformation
          }}
        ></div>
      </div>

      {/* Analytical HUD System */}
      {!teleprompterMode && (
        <div
          className={`fixed bottom-0 left-0 right-0 md:left-64 px-8 py-2 border-t transition-colors duration-300 z-20 ${themeThemeClass.hudBg}`}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiClock size={13} className={darkMode ? "text-neutral-500" : "text-neutral-400"} />
              <span className={`text-[11px] font-light tracking-wide ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                {formattedTime}{" "}
                <span className={darkMode ? "text-neutral-600" : "text-neutral-400"}>
                  est. video length
                </span>
              </span>
            </div>

            <div className="relative" ref={wpmMenuRef}>
              <button
                onClick={() => {
                  setWpmInput(String(wpm));
                  setShowWpmMenu((v) => !v);
                }}
                className={`text-[9px] font-light rounded-full px-2.5 py-1 border transition-colors ${
                  darkMode
                    ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                    : "border-neutral-200 text-neutral-400 hover:bg-neutral-100"
                }`}
              >
                {wordCount} words · {wpm} wpm
              </button>

              {showWpmMenu && (
                <div
                  className={`absolute bottom-full right-0 mb-2 w-52 rounded-lg border shadow-lg p-3 z-50 ${
                    darkMode
                      ? "bg-neutral-900 border-neutral-800"
                      : "bg-white border-neutral-200"
                  }`}
                >
                  <p className={`text-[10px] uppercase tracking-[0.1em] mb-2 ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                    Speaking pace
                  </p>

                  <div className="flex flex-col gap-1 mb-3">
                    {WPM_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => applyWpm(preset.value)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] font-light transition-colors ${
                          wpm === preset.value
                            ? themeThemeClass.bgActive
                            : darkMode
                            ? "text-neutral-400 hover:bg-neutral-800"
                            : "text-neutral-500 hover:bg-neutral-50"
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className={darkMode ? "text-neutral-500" : "text-neutral-400"}>
                          {preset.value} wpm
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={wpmInput}
                      onChange={(e) => setWpmInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyWpm(wpmInput);
                      }}
                      className={`w-full text-[12px] font-light rounded-md px-2 py-1.5 outline-none border ${
                        darkMode
                          ? "bg-neutral-950 border-neutral-700 text-neutral-200"
                          : "bg-neutral-50 border-neutral-200 text-neutral-700"
                      }`}
                      placeholder="Custom wpm"
                    />
                    <button
                      onClick={() => applyWpm(wpmInput)}
                      className={`text-[12px] font-light px-2.5 py-1.5 rounded-md border transition-colors ${
                        darkMode
                          ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                          : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}