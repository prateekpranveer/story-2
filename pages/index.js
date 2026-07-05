import React, { useState, useEffect, useCallback, useRef } from "react";
import { client } from "@/src/sanity/lib/client";
import {
  FiMenu,
  FiPlus,
  FiTrash2,
  FiMoon,
  FiSun,
  FiMinus,
  FiType,
  FiBold,
  FiItalic,
  FiUnderline,
  FiX,
  FiLock,
  FiChevronDown,
  FiSearch,
  FiDownload,
  FiCheck,
  FiSliders,
  FiLayers,
  FiMaximize2,
  FiMinimize2,
  FiLoader,
} from "react-icons/fi";

const HARDCODED_PASSWORD = "gotxy";
const GOOGLE_FONTS_API_KEY = "AIzaSyA973m6GgqA06Uk7WoZvW82PSNtZDX-Gdo";

const INITIAL_FONT_OPTIONS = [
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Calibri Light", value: "'Calibri Light', Calibri Light, sans-serif" },
];

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 48; 
const FONT_STEP = 2;

const MIN_LINE_HEIGHT = 1.2;
const MAX_LINE_HEIGHT = 2.4;
const LINE_HEIGHT_STEP = 0.2;

const MIN_FONT_WEIGHT = 100;
const MAX_FONT_WEIGHT = 900;
const FONT_WEIGHT_STEP = 100;

const HIGHLIGHTERS = [
  { name: "Yellow", color: "#fef08a" },
  { name: "Green", color: "#bbf7d0" },
  { name: "Blue", color: "#bfdbfe" },
  { name: "Pink", color: "#fbcfe8" },
  { name: "Purple", color: "#e9d5ff" },
  { name: "Orange", color: "#fed7aa" },
  { name: "Red", color: "#fecaca" },
  { name: "Teal", color: "#99f6e4" },
  { name: "Lime", color: "#d9f99d" },
  { name: "Cyan", color: "#a5f3fc" },
];

const TEXT_COLORS = [
  { name: "Charcoal", color: "#374151" },
  { name: "Ink Blue", color: "#1d4ed8" },
  { name: "Crimson", color: "#b91c1c" },
  { name: "Emerald", color: "#047857" },
  { name: "Violet", color: "#6d28d9" },
  { name: "Amber", color: "#b45309" },
  { name: "Rosewood", color: "#9f1239" },
];

const BG_THEMES = [
  { name: "Snow", color: "#f8fafc" },
  { name: "Cream", color: "#fefcbf" },
  { name: "Mint", color: "#f0fdf4" },
  { name: "Sky", color: "#f0f9ff" },
  { name: "Lavender", color: "#fbf7ff" },
  { name: "Blush", color: "#fff5f5" },
  { name: "Peach", color: "#fffaf0" },
  { name: "Sand", color: "#fafaf9" },
  { name: "Sage", color: "#f4f7f6" },
  { name: "Cyber", color: "#f3f4f6" },
];

const TEXT_STYLES = [
  { name: "Normal text", tag: "p" },
  { name: "Heading 1", tag: "h1" },
  { name: "Heading 2", tag: "h2" },
  { name: "Heading 3", tag: "h3" },
];

export default function LiveTextEditor() {
  const [articles, setArticles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [fontWeight, setFontWeight] = useState(400); 
  
  const [fontOptions, setFontOptions] = useState(INITIAL_FONT_OPTIONS);
  const [selectedFont, setSelectedFont] = useState(INITIAL_FONT_OPTIONS[0].value);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [googleFontsList, setGoogleFontsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingGoogleFonts, setLoadingGoogleFonts] = useState(false);
  const [installingFont, setInstallingFont] = useState(null); 

  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isStrikeActive, setIsStrikeActive] = useState(false);
  const [currentStyleTag, setCurrentStyleTag] = useState("p");

  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, show: false });
  
  const [paletteState, setPaletteState] = useState("closed");
  const [textColorPaletteState, setTextColorPaletteState] = useState("closed");
  const [bgPaletteState, setBgPaletteState] = useState("closed");
  const [customBgColor, setCustomBgColor] = useState(null);

  const editorRef = useRef(null);
  const floatingMenuRef = useRef(null);
  const fontDropdownRef = useRef(null);
  const layoutDropdownRef = useRef(null);
  const styleDropdownRef = useRef(null);
  const paletteRef = useRef(null);
  const paletteToggleBtnRef = useRef(null);
  const textColorPaletteRef = useRef(null);
  const textColorPaletteToggleBtnRef = useRef(null);
  const bgPaletteRef = useRef(null);
  const bgPaletteToggleBtnRef = useRef(null);

  const checkActiveFormats = () => {
    if (typeof document !== "undefined") {
      setIsBoldActive(document.queryCommandState("bold"));
      setIsItalicActive(document.queryCommandState("italic"));
      setIsUnderlineActive(document.queryCommandState("underline"));
      setIsStrikeActive(document.queryCommandState("strikeThrough"));
      
      const blockValue = document.queryCommandValue("formatBlock") || "p";
      const cleanedTag = blockValue.replace(/[<>]/g, "").toLowerCase();
      setCurrentStyleTag(["h1", "h2", "h3"].includes(cleanedTag) ? cleanedTag : "p");
    }
  };

  useEffect(() => {
    if (selectedId) {
      setMenuCoords({ top: 0, left: 0, show: false });
    }
  }, [selectedId]);

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
      const doc = await client.getDocument(selectedId);
      setTitle(doc?.title || "");
      setContent(doc?.content || "");
      
      if (editorRef.current) {
        editorRef.current.innerHTML = isLocked ? "" : (doc?.content || "");
      }
      checkActiveFormats();
    }
    fetchContent();
  }, [selectedId, isLocked]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target)) {
        setIsFontDropdownOpen(false);
      }
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target)) {
        setIsLayoutDropdownOpen(false);
      }
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target)) {
        setIsStyleDropdownOpen(false);
      }
      if (
        paletteState === "open" && 
        paletteRef.current && !paletteRef.current.contains(event.target) &&
        paletteToggleBtnRef.current && !paletteToggleBtnRef.current.contains(event.target)
      ) {
        setPaletteState("closing");
      }
      if (
        textColorPaletteState === "open" && 
        textColorPaletteRef.current && !textColorPaletteRef.current.contains(event.target) &&
        textColorPaletteToggleBtnRef.current && !textColorPaletteToggleBtnRef.current.contains(event.target)
      ) {
        setTextColorPaletteState("closing");
      }
      if (
        bgPaletteState === "open" &&
        bgPaletteRef.current && !bgPaletteRef.current.contains(event.target) &&
        bgPaletteToggleBtnRef.current && !bgPaletteToggleBtnRef.current.contains(event.target)
      ) {
        setBgPaletteState("closing");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [paletteState, textColorPaletteState, bgPaletteState]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreenEnabled = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setShowSidebar(false);
      }).catch(err => {
        console.error("Error entering fullscreen mode:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const saveToSanity = useCallback(
    debounce(async (htmlContent, newTitle) => {
      if (!selectedId || isLocked) return;
      setSaving(true);
      try {
        await client
          .patch(selectedId)
          .set({ content: htmlContent, title: newTitle })
          .commit({ autoGenerateArrayKeys: true });
        setLastSaved(Date.now());
      } catch (err) {
        console.error("Save error:", err);
      }
      setSaving(false);
    }, 800),
    [selectedId, isLocked]
  );

  const handleTextSelection = useCallback(() => {
    if (typeof window === "undefined" || isLocked) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) {
      setMenuCoords((prev) => ({ ...prev, show: false }));
      return;
    }

    if (!editorRef.current.contains(selection.anchorNode)) {
      setMenuCoords((prev) => ({ ...prev, show: false }));
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const menuWidth = 350; 
    const menuHeight = 44;

    let calculatedLeft = rect.left + rect.width / 2 - menuWidth / 2;
    let calculatedTop = rect.top - menuHeight - 10;

    if (rect.top - menuHeight - 12 < 0) {
      calculatedTop = rect.bottom + 10;
    }

    const safetyMargin = 16;
    if (calculatedLeft < safetyMargin) {
      calculatedLeft = safetyMargin;
    } else if (calculatedLeft + menuWidth > window.innerWidth - safetyMargin) {
      calculatedLeft = window.innerWidth - menuWidth - safetyMargin;
    }

    setMenuCoords({
      top: calculatedTop,
      left: calculatedLeft,
      show: true
    });
    checkActiveFormats();
  }, [isLocked]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleTextSelection);
    window.addEventListener("resize", handleTextSelection);
    return () => {
      document.removeEventListener("selectionchange", handleTextSelection);
      window.removeEventListener("resize", handleTextSelection);
    };
  }, [handleTextSelection]);

  const handleInput = () => {
    if (!editorRef.current || isLocked) return;
    const html = editorRef.current.innerHTML;
    setContent(html);
    saveToSanity(html, title);
    checkActiveFormats();
  };

  const handleTitleChange = (e) => {
    if (isLocked) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    saveToSanity(content, newTitle);
  };

  const handlePaste = (e) => {
    if (isLocked) return;
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
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
    if (!window.confirm("Are you sure you want to delete this Chapter?")) return;
    const enteredPassword = window.prompt("Enter the administrator password to confirm deletion:");
    if (enteredPassword === null) return; 
    if (enteredPassword !== HARDCODED_PASSWORD) {
      window.alert("Incorrect password. Deletion aborted.");
      return;
    }

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

  const executeCommand = (e, command, value = null) => {
    if (e) e.preventDefault();
    if (isLocked) return;
    document.execCommand(command, false, value);
    handleInput();
  };

  const executeFormatBlock = (e, tag) => {
    e.preventDefault();
    if (isLocked) return;
    document.execCommand("formatBlock", false, `<${tag}>`);
    setIsStyleDropdownOpen(false);
    handleInput();
  };

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === HARDCODED_PASSWORD) {
      setIsLocked(false);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  };

  const installGoogleFont = (fontFamily) => {
    if (fontOptions.some((f) => f.name === fontFamily)) return;

    setInstallingFont(fontFamily);

    setTimeout(() => {
      try {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);

        const newFontObj = { name: fontFamily, value: `'${fontFamily}', sans-serif` };
        setFontOptions((prev) => [...prev, newFontObj]);
      } catch (err) {
        console.error("Failed to install layout font stylesheet link:", err);
      } finally {
        setInstallingFont(null);
      }
    }, 600);
  };

  const getCurrentFontName = () => {
    const font = fontOptions.find((f) => f.value === selectedFont);
    return font ? font.name : "Inter";
  };

  const getCurrentStyleName = () => {
    const matchedStyle = TEXT_STYLES.find((s) => s.tag === currentStyleTag);
    return matchedStyle ? matchedStyle.name : "Normal text";
  };

  useEffect(() => {
    if (!isFontModalOpen || googleFontsList.length > 0) return;

    async function fetchGoogleFonts() {
      setLoadingGoogleFonts(true);
      try {
        const response = await fetch(
          `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${GOOGLE_FONTS_API_KEY}`
        );
        const data = await response.json();
        if (data.items) {
          setGoogleFontsList(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch Google Fonts directory:", error);
      }
      setLoadingGoogleFonts(false);
    }

    fetchGoogleFonts();
  }, [isFontModalOpen, googleFontsList]);

  const filteredGoogleFonts = googleFontsList.filter((font) =>
    font.family.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 30); 

  const wordCount = content
    ? content
        .replace(/<[^>]+>/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  return (
    <div
      style={{ 
        fontFamily: selectedFont,
        backgroundColor: (!darkMode && customBgColor) ? customBgColor : undefined
      }}
      className={`flex min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-zinc-900 text-zinc-100" : "text-zinc-800"
      } ${!customBgColor && !darkMode ? "bg-zinc-50/60" : ""}`}
    >
      <style>{`
        @keyframes bounceRightIn {
          0% { transform: translateX(100%); }
          60% { transform: translateX(-12px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        @keyframes bounceRightOut {
          0% { transform: translateX(0); }
          30% { transform: translateX(-10px); }
          100% { transform: translateX(100%); }
        }
        @keyframes morphPulse {
          0%, 100% { width: 14px; opacity: 0.4; }
          50% { width: 36px; opacity: 0.9; }
        }
        @keyframes fadeOutPill {
          0% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.92); }
        }
        .animate-bounce-right-in {
          animation: bounceRightIn 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-bounce-right-out {
          animation: bounceRightOut 0.45s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
        }
        .animate-morph-pulse {
          animation: morphPulse 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-fade-out-pill {
          animation: fadeOutPill 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .novel-canvas h1 { font-size: 2.25em !important; font-weight: 800 !important; margin: 0px 0px 0.6em 0px !important; display: block !important; }
        .novel-canvas h2 { font-size: 1.75em !important; font-weight: 700 !important; margin: 0px 0px 0.5em 0px !important; display: block !important; }
        .novel-canvas h3 { font-size: 1.35em !important; font-weight: 600 !important; margin: 0px 0px 0.4em 0px !important; display: block !important; }
        .novel-canvas p, .novel-canvas > div, .novel-canvas > * { margin: 0px 0px 0.8em 0px !important; display: block !important; }
      `}</style>

      {paletteState !== "closed" && !isLocked && (
        <div 
          ref={paletteRef}
          onAnimationEnd={() => {
            if (paletteState === "closing") {
              setPaletteState("closed");
            }
          }}
          className={`fixed right-0 top-0 bottom-0 w-[100px] h-screen z-50 flex flex-col shadow-2xl overflow-hidden bg-transparent ${
            paletteState === "open" ? "animate-bounce-right-in" : "animate-bounce-right-out"
          }`}
        >
          {HIGHLIGHTERS.map((hl) => (
            <button
              key={hl.name}
              type="button"
              onMouseDown={(e) => {
                executeCommand(e, "hiliteColor", hl.color);
                setPaletteState("closing"); 
              }}
              className="w-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] border-b border-black/5 flex items-center justify-center relative group"
              style={{ 
                backgroundColor: hl.color, 
                height: `calc(100vh / ${HIGHLIGHTERS.length})` 
              }}
              title={`Highlight ${hl.name}`}
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-zinc-800 tracking-wider uppercase transition-opacity drop-shadow-sm select-none pointer-events-none">
                {hl.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {textColorPaletteState !== "closed" && !isLocked && (
        <div 
          ref={textColorPaletteRef}
          onAnimationEnd={() => {
            if (textColorPaletteState === "closing") {
              setTextColorPaletteState("closed");
            }
          }}
          className={`fixed right-0 top-0 bottom-0 w-[100px] h-screen z-50 flex flex-col shadow-2xl overflow-hidden bg-transparent ${
            textColorPaletteState === "open" ? "animate-bounce-right-in" : "animate-bounce-right-out"
          }`}
        >
          {TEXT_COLORS.map((tc) => (
            <button
              key={tc.name}
              type="button"
              onMouseDown={(e) => {
                executeCommand(e, "foreColor", tc.color);
                setTextColorPaletteState("closing"); 
              }}
              className="w-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] border-b border-black/5 flex items-center justify-center relative group"
              style={{ 
                backgroundColor: tc.color, 
                height: `calc(100vh / ${TEXT_COLORS.length})` 
              }}
              title={`Text Color ${tc.name}`}
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-white tracking-wider uppercase transition-opacity drop-shadow-sm select-none pointer-events-none mix-blend-difference">
                {tc.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {bgPaletteState !== "closed" && !isLocked && (
        <div 
          ref={bgPaletteRef}
          onAnimationEnd={() => {
            if (bgPaletteState === "closing") {
              setBgPaletteState("closed");
            }
          }}
          className={`fixed right-0 top-0 bottom-0 w-[100px] h-screen z-50 flex flex-col shadow-2xl overflow-hidden bg-transparent ${
            bgPaletteState === "open" ? "animate-bounce-right-in" : "animate-bounce-right-out"
          }`}
        >
          {BG_THEMES.map((bg) => (
            <button
              key={bg.name}
              type="button"
              onClick={() => {
                setCustomBgColor(bg.color);
                setBgPaletteState("closing");
              }}
              className="w-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] border-b border-black/5 flex items-center justify-center relative group"
              style={{ 
                backgroundColor: bg.color, 
                height: `calc(100vh / ${BG_THEMES.length})` 
              }}
              title={`Background ${bg.name}`}
            >
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-zinc-700 tracking-wider uppercase transition-opacity drop-shadow-sm select-none pointer-events-none">
                {bg.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 bg-black/30 z-30 animate-in fade-in duration-300"
        ></div>
      )}

      {/* Sidebar Trigger Button */}
      <div 
        className={`absolute top-5 right-5 z-50 transition-all duration-700 ease-in-out ${
          isFullscreen ? "opacity-0 scale-95 pointer-events-none -translate-y-4" : "opacity-100 scale-100"
        }`}
      >
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`p-2 rounded-full border transition-colors ${
            darkMode
              ? "border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 bg-zinc-900"
              : "border-neutral-200 text-neutral-500 hover:bg-neutral-100 bg-white"
          }`}
        >
          <FiMenu size={16} />
        </button>
      </div>

      {/* Floating Exit Fullscreen Button */}
      <div 
        className={`fixed top-5 right-5 z-50 transition-all duration-700 ease-in-out ${
          isFullscreen ? "opacity-40 hover:opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 pointer-events-none -translate-y-4"
        }`}
      >
        <button
          onClick={toggleFullscreenEnabled}
          className={`p-2 rounded-full border shadow-md transition-colors ${
            darkMode
              ? "border-neutral-700 bg-zinc-900 text-neutral-300 hover:bg-neutral-800"
              : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100"
          }`}
          title="Exit Full Screen"
        >
          <FiMinimize2 size={16} />
        </button>
      </div>

      <div
        className={`fixed top-0 left-0 h-screen z-40 transform transition-transform duration-500 ease-out w-64 border-r overflow-y-auto shrink-0 px-5 py-8
          ${darkMode ? "bg-zinc-950 border-zinc-800/80" : "bg-zinc-100 border-zinc-200"}
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={createNewArticle}
          className={`w-full mb-6 flex items-center justify-center gap-2 py-2.5 text-[11px] tracking-wider rounded-sm border transition-colors ${
            darkMode ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800/50" : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <FiPlus size={13} />
          NEW CHAPTER
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
                    ? darkMode ? "bg-zinc-800 text-zinc-100" : "bg-zinc-200 text-zinc-900"
                    : darkMode ? "text-neutral-400 hover:bg-neutral-900/40" : "text-neutral-500 hover:bg-black/5"
                }`}
              >
                {a.title || "Untitled"}
              </button>
              <button
                onClick={() => deleteArticle(a._id)}
                className={`opacity-0 group-hover:opacity-100 p-1.5 rounded transition-opacity ${
                  darkMode ? "text-neutral-600 hover:text-red-400" : "text-neutral-400 hover:text-red-500"
                }`}
                title="Delete scene"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Sheet Workspace */}
      <div 
        className={`relative flex-grow w-full max-w-4xl mx-auto transition-all duration-700 ease-in-out ${
          isFullscreen ? "pl-0 max-w-3xl" : "pl-16"
        }`}
      >
        {isLocked && selectedId && (
          <div className="absolute inset-0 z-30 flex items-start justify-center pt-24 backdrop-blur-md transition-all duration-300">
            <form 
              onSubmit={handleUnlockSubmit}
              className={`flex flex-col items-center w-full max-w-[280px] px-14 py-10 rounded-md border text-center transition-all ${
                darkMode ? "bg-zinc-900/80 border-zinc-800 shadow-xl shadow-black/20" : "bg-white/80 border-zinc-200/80 shadow-xl shadow-zinc-200/50"
              }`}
            >
              <div className={`p-3 mb-4 rounded-full ${darkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}>
                <FiLock size={18} />
              </div>
              <h3 className="text-xs font-light tracking-widest uppercase mb-1">Protected Document</h3>
              <p className={`text-[11px] font-light mb-4 ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                Enter credentials to decrypt the content workspace
              </p>
              
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError(false);
                }}
                placeholder="Password"
                className={`w-full text-center text-xs tracking-widest py-2 px-3 rounded-md border outline-none transition-all ${
                  passwordError 
                    ? "border-red-400 focus:border-red-400" 
                    : darkMode ? "bg-zinc-950/50 border-zinc-800 text-zinc-200 focus:border-zinc-700" : "bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-zinc-300"
                }`}
                autoFocus
              />
              {passwordError && (
                <span className="text-[10px] text-red-400 font-light mt-2 animate-pulse">
                  Incorrect password. Try again.
                </span>
              )}
              <button type="submit" className={`w-full mt-4 py-2 text-[10px] font-medium tracking-widest uppercase rounded-md transition-colors ${darkMode ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200" : "bg-zinc-900 text-zinc-50 hover:bg-zinc-800"}`}>
                Unlock Scene
              </button>
            </form>
          </div>
        )}

        {menuCoords.show && (
          <div
            ref={floatingMenuRef}
            style={{ top: menuCoords.top, left: menuCoords.left }}
            className={`fixed z-50 flex items-center gap-1 px-1.5 py-0.5 rounded-lg border shadow-sm backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 pointer-events-auto select-none ${
              darkMode 
                ? "bg-zinc-950/75 border-zinc-800/40 text-zinc-300 shadow-black/20" 
                : "bg-white/75 border-zinc-200/50 text-zinc-700 shadow-zinc-200/20"
            }`}
          >
            <div className="flex items-center gap-px border-r pr-1 border-zinc-700/10 dark:border-zinc-200/5">
              <button 
                type="button"
                onMouseDown={(e) => executeCommand(e, "bold")}
                className={`p-1 rounded transition-colors ${
                  isBoldActive 
                    ? darkMode ? "bg-zinc-800/60 text-white" : "bg-zinc-200/60 text-black"
                    : darkMode ? "hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100/60 text-zinc-500 hover:text-zinc-800"
                }`}
                title="Bold"
              >
                <FiBold size={11} />
              </button>
              <button 
                type="button"
                onMouseDown={(e) => executeCommand(e, "italic")}
                className={`p-1 rounded transition-colors ${
                  isItalicActive 
                    ? darkMode ? "bg-zinc-800/60 text-white" : "bg-zinc-200/60 text-black"
                    : darkMode ? "hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100/60 text-zinc-500 hover:text-zinc-800"
                }`}
                title="Underline"
              >
                <FiUnderline size={11} />
              </button>
              <button 
                type="button"
                onMouseDown={(e) => executeCommand(e, "strikeThrough")}
                className={`p-1 rounded font-sans font-bold transition-colors text-[10px] line-through w-5 h-5 flex items-center justify-center ${
                  isStrikeActive 
                    ? darkMode ? "bg-zinc-800/60 text-white" : "bg-zinc-200/60 text-black"
                    : darkMode ? "hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100/60 text-zinc-500 hover:text-zinc-800"
                }`}
                title="Strikethrough"
              >
                S
              </button>
            </div>

            <div className="flex items-center gap-1 pl-0.5 border-r pr-1 border-zinc-700/10 dark:border-zinc-200/5">
              <div className="flex items-center">
                <button
                  ref={paletteToggleBtnRef}
                  type="button"
                  onClick={() => {
                    setPaletteState(prev => prev === "open" ? "closing" : "open");
                    if (textColorPaletteState === "open") setTextColorPaletteState("closing");
                    if (bgPaletteState === "open") setBgPaletteState("closing");
                  }}
                  className={`p-1 rounded transition-colors flex items-center justify-center ${
                    paletteState === "open"
                      ? darkMode ? "bg-zinc-800/60 text-white" : "bg-zinc-200/60 text-black"
                      : darkMode ? "hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100/60 text-zinc-500 hover:text-zinc-800"
                  }`}
                  title="Toggle Highlighter Palette"
                >
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-300/80 border border-amber-500/20 flex shadow-sm transform rotate-12" />
                </button>
                <button 
                  type="button"
                  onMouseDown={(e) => executeCommand(e, "hiliteColor", "transparent")}
                  className="p-px flex border border-dashed border-zinc-300/40 dark:border-zinc-700/40 justify-center rounded text-zinc-400/70 hover:text-red-500 transition-colors ml-0.5"
                  title="Clear Highlight Only"
                >
                  <FiX size={9} />
                </button>
              </div>

              <div className="flex items-center">
                <button
                  ref={textColorPaletteToggleBtnRef}
                  type="button"
                  onClick={() => {
                    setTextColorPaletteState(prev => prev === "open" ? "closing" : "open");
                    if (paletteState === "open") setPaletteState("closing");
                    if (bgPaletteState === "open") setBgPaletteState("closing");
                  }}
                  className={`p-1 rounded transition-colors flex items-center justify-center ${
                    textColorPaletteState === "open"
                      ? darkMode ? "bg-zinc-800/60 text-white" : "bg-zinc-200/60 text-black"
                      : darkMode ? "hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100/60 text-zinc-500 hover:text-zinc-800"
                  }`}
                  title="Toggle Text Color Palette"
                >
                  <span className="text-[9px] font-bold tracking-tight text-indigo-500 px-1 bg-white/80 dark:bg-zinc-900 rounded shadow-sm leading-none">A</span>
                </button>
                <button 
                  type="button"
                  onMouseDown={(e) => executeCommand(e, "removeFormat")}
                  className="p-px flex border border-dashed border-zinc-300/40 dark:border-zinc-700/40 justify-center rounded text-zinc-400/70 hover:text-red-500 transition-colors ml-0.5"
                  title="Clear Text Color Only"
                >
                  <FiX size={9} />
                </button>
              </div>
            </div>

            <div className="relative pl-0.5" ref={styleDropdownRef}>
              <button
                type="button"
                onClick={() => !isLocked && setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                className={`flex items-center justify-between gap-1 text-[9px] font-medium rounded px-1.5 py-1 transition-all outline-none border border-transparent select-none ${
                  darkMode 
                    ? "hover:bg-zinc-800/40 text-neutral-400 hover:text-neutral-200" 
                    : "hover:bg-zinc-100/60 text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <span className="min-w-[60px] text-left truncate tracking-wide">{getCurrentStyleName()}</span>
                <FiChevronDown size={8} className="text-neutral-400/70" />
              </button>

              {isStyleDropdownOpen && (
                <div 
                  className={`absolute left-0 mt-1 w-28 rounded-md border p-0.5 shadow-md backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150 z-50 flex flex-col gap-px ${
                    darkMode 
                      ? "bg-zinc-950/85 border-zinc-800/50 text-zinc-300 shadow-black/20" 
                      : "bg-white/85 border-zinc-200/60 text-zinc-700 shadow-zinc-200/10"
                  }`}
                >
                  {TEXT_STYLES.map((style) => (
                    <button
                      key={style.tag}
                      type="button"
                      onMouseDown={(e) => executeFormatBlock(e, style.tag)}
                      className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${
                        currentStyleTag === style.tag
                          ? darkMode ? "bg-zinc-800/60 text-white font-semibold" : "bg-zinc-100 text-zinc-900 font-semibold"
                          : darkMode ? "hover:bg-zinc-800/30 text-neutral-400 hover:text-neutral-200" : "hover:bg-zinc-50/60 text-neutral-500 hover:text-zinc-800"
                      }`}
                    >
                      <span className={
                        style.tag === "h1" ? "text-xs font-bold" :
                        style.tag === "h2" ? "text-[11px] font-bold" :
                        style.tag === "h3" ? "text-[10px] font-semibold" : "text-[10px]"
                      }>
                        {style.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content sheet */}
        <div 
          className={`px-8 pb-32 transition-all duration-700 ease-in-out ${
            isLocked && selectedId ? "blur-sm pointer-events-none select-none opacity-40" : ""
          } ${isFullscreen ? "pt-20" : "pt-4"}`}
        >
          {/* Top bar controls */}
          <div 
            className={`sticky top-2 z-20 flex flex-wrap items-center justify-between gap-4 p-1 mb-4 rounded-xl backdrop-blur-xl transition-all duration-700 ease-in-out ${
              isFullscreen ? "-translate-y-12 opacity-0 pointer-events-none max-h-0 mb-0 py-0 border-transparent overflow-hidden shadow-none" : "max-h-20"
            } ${
              darkMode ? "bg-zinc-900/30 border-zinc-800/60 shadow-black/10 text-zinc-100" : "bg-white/45 border-white/60 shadow-zinc-200/30 text-zinc-800"
            }`}
          >
            {/* Aesthetic breathing morph indicator instead of text/spinner */}
            <div className="flex items-center pl-3 h-5 select-none min-w-[60px]">
              {saving ? (
                <div className="h-[3px] rounded-full bg-neutral-400/60 dark:bg-neutral-500/60 animate-morph-pulse transition-all duration-300" />
              ) : lastSaved ? (
                <div key={lastSaved} className="flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full animate-fade-out-pill text-emerald-500 dark:text-emerald-400">
                  <FiCheck className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 opacity-60" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`text-[11px] font-light tracking-wide px-1.5 select-none ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                {isLocked ? "0" : wordCount} words
              </div>

              <div className={`w-[1px] h-4 ${darkMode ? "bg-zinc-800/60" : "bg-zinc-300/60"}`} />

              <div className="relative" ref={fontDropdownRef}>
                <button
                  type="button"
                  onClick={() => !isLocked && setIsFontDropdownOpen(!isFontDropdownOpen)}
                  disabled={isLocked}
                  className={`flex items-center gap-2 text-[10px] font-light rounded-full pl-3.5 pr-2.5 py-1.5 border outline-none transition-all duration-200 select-none ${
                    darkMode 
                      ? "bg-zinc-950/40 border-zinc-800/80 text-neutral-300 hover:bg-zinc-800/60 hover:border-zinc-700" 
                      : "bg-white/50 border-zinc-200/80 text-neutral-600 hover:bg-zinc-100/80 hover:border-zinc-300"
                  }`}
                >
                  <FiType size={10} className={darkMode ? "text-neutral-500" : "text-neutral-400"} />
                  <span className="min-w-[70px] text-left tracking-wide">{getCurrentFontName()}</span>
                  <FiChevronDown size={11} className={`text-neutral-400 transition-transform duration-200 ${isFontDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isFontDropdownOpen && (
                  <div 
                    className={`absolute left-0 mt-1.5 w-44 rounded-xl border p-1 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 z-50 ${
                      darkMode 
                        ? "bg-zinc-900/95 border-zinc-800/80 text-zinc-200 shadow-black/40" 
                        : "bg-white/95 border-zinc-200 text-zinc-700 shadow-zinc-300/30"
                    }`}
                  >
                    <div className="max-h-56 overflow-y-auto pr-0.5 flex flex-col gap-0.5">
                      {fontOptions.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => {
                            setSelectedFont(f.value);
                            setIsFontDropdownOpen(false);
                          }}
                          style={{ fontFamily: f.value }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs tracking-wide transition-colors ${
                            selectedFont === f.value
                              ? darkMode ? "bg-zinc-800 text-white font-medium" : "bg-zinc-100 text-zinc-900 font-medium"
                              : darkMode ? "hover:bg-zinc-800/50 text-neutral-400 hover:text-neutral-200" : "hover:bg-zinc-50 text-neutral-500 hover:text-zinc-800"
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                    
                    <div className={`mt-1 pt-1 border-t ${darkMode ? "border-zinc-800" : "border-zinc-100"}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFontDropdownOpen(false);
                          setIsFontModalOpen(true);
                        }}
                        className={`w-full text-center py-1.5 rounded-lg text-[10px] tracking-wider transition-colors font-medium border border-dashed ${
                          darkMode 
                            ? "border-zinc-700/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" 
                            : "border-zinc-300 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                        }`}
                      >
                        + ADD GOOGLE FONT
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={`w-[1px] h-4 ${darkMode ? "bg-zinc-800/60" : "bg-zinc-300/60"}`} />

              <div className="relative" ref={layoutDropdownRef}>
                <button
                  type="button"
                  onClick={() => !isLocked && setIsLayoutDropdownOpen(!isLayoutDropdownOpen)}
                  disabled={isLocked}
                  className={`flex items-center gap-2 text-[10px] font-light rounded-full px-3.5 py-1.5 border outline-none transition-all duration-200 select-none ${
                    darkMode 
                      ? "bg-zinc-950/40 border-zinc-800/80 text-neutral-300 hover:bg-zinc-800/60 hover:border-zinc-700" 
                      : "bg-white/50 border-zinc-200/80 text-neutral-600 hover:bg-zinc-100/80 hover:border-zinc-300"
                  }`}
                >
                  <FiSliders size={11} className={darkMode ? "text-neutral-500" : "text-neutral-400"} />
                  <span className="tracking-wide">Layout & Settings</span>
                  <FiChevronDown size={11} className={`text-neutral-400 transition-transform duration-200 ${isLayoutDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isLayoutDropdownOpen && (
                  <div 
                    className={`absolute right-0 mt-1.5 w-60 rounded-xl border p-4 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 z-50 flex flex-col gap-4 ${
                      darkMode 
                        ? "bg-zinc-900/95 border-zinc-800/80 text-zinc-200 shadow-black/40" 
                        : "bg-white/95 border-zinc-200 text-zinc-700 shadow-zinc-300/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-light text-neutral-400">Font Size</span>
                      <div className={`flex items-center rounded-full border overflow-hidden ${darkMode ? "border-zinc-800/60 bg-zinc-950/20" : "border-zinc-200/60 bg-zinc-50"}`}>
                        <button
                          onClick={() => setFontSize((prev) => Math.max(prev - FONT_STEP, MIN_FONT_SIZE))}
                          disabled={fontSize <= MIN_FONT_SIZE}
                          className={`p-1.5 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-200"}`}
                        >
                          <FiMinus size={10} />
                        </button>
                        <span className="text-[10px] font-light w-8 text-center select-none">{fontSize}px</span>
                        <button
                          onClick={() => setFontSize((prev) => Math.min(prev + FONT_STEP, MAX_FONT_SIZE))}
                          disabled={fontSize >= MAX_FONT_SIZE}
                          className={`p-1.5 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-200"}`}
                        >
                          <FiPlus size={10} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-light text-neutral-400">Line Height</span>
                      <div className={`flex items-center rounded-full border overflow-hidden ${darkMode ? "border-zinc-800/60 bg-zinc-950/20" : "border-zinc-200/60 bg-zinc-50"}`}>
                        <button
                          onClick={() => setLineHeight((prev) => Math.max(parseFloat((prev - LINE_HEIGHT_STEP).toFixed(1)), MIN_LINE_HEIGHT))}
                          disabled={lineHeight <= MIN_LINE_HEIGHT}
                          className={`p-1.5 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-200"}`}
                        >
                          <FiMinus size={10} />
                        </button>
                        <span className="text-[10px] font-light w-8 text-center select-none">{lineHeight}LH</span>
                        <button
                          onClick={() => setLineHeight((prev) => Math.min(parseFloat((prev + LINE_HEIGHT_STEP).toFixed(1)), MAX_LINE_HEIGHT))}
                          disabled={lineHeight >= MAX_LINE_HEIGHT}
                          className={`p-1.5 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-200"}`}
                        >
                          <FiPlus size={10} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-light text-neutral-400">Font Weight</span>
                      <div className={`flex items-center rounded-full border overflow-hidden ${darkMode ? "border-zinc-800/60 bg-zinc-950/20" : "border-zinc-200/60 bg-zinc-50"}`}>
                        <button
                          onClick={() => setFontWeight((prev) => Math.max(prev - FONT_WEIGHT_STEP, MIN_FONT_WEIGHT))}
                          disabled={fontWeight <= MIN_FONT_WEIGHT}
                          className={`p-1.5 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-200"}`}
                        >
                          <FiMinus size={10} />
                        </button>
                        <span className="text-[10px] font-light w-8 text-center select-none">{fontWeight}W</span>
                        <button
                          onClick={() => setFontWeight((prev) => Math.min(prev + FONT_WEIGHT_STEP, MAX_FONT_WEIGHT))}
                          disabled={fontWeight >= MAX_FONT_WEIGHT}
                          className={`p-1.5 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-200"}`}
                        >
                          <FiPlus size={10} />
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              <button
                ref={bgPaletteToggleBtnRef}
                disabled={isLocked || darkMode}
                onClick={() => {
                  setBgPaletteState(prev => prev === "open" ? "closing" : "open");
                  if (paletteState === "open") setPaletteState("closing");
                  if (textColorPaletteState === "open") setTextColorPaletteState("closing");
                }}
                className={`p-2 rounded-full border transition-colors ${
                  darkMode 
                    ? "border-zinc-800/60 text-neutral-600 cursor-not-allowed opacity-50" 
                    : bgPaletteState === "open" 
                      ? "bg-zinc-200 border-zinc-300 text-neutral-800" 
                      : "border-zinc-200/60 text-neutral-400 hover:bg-zinc-100/60"
                }`}
                title="Change Background Theme"
              >
                <FiLayers size={12} />
              </button>

              <button
                onClick={toggleFullscreenEnabled}
                disabled={isLocked}
                className={`p-2 rounded-full border transition-colors ${
                  darkMode ? "border-zinc-800/60 text-neutral-400 hover:bg-zinc-800/40" : "border-zinc-200/60 text-neutral-400 hover:bg-zinc-100/60"
                }`}
                title="Toggle Full Screen Mode"
              >
                <FiMaximize2 size={12} />
              </button>

              <button
                onClick={() => {
                  setDarkMode(!darkMode);
                  if (!darkMode) setBgPaletteState("closing");
                }}
                className={`p-2 rounded-full border transition-colors ${
                  darkMode ? "border-zinc-800/60 text-neutral-400 hover:bg-zinc-800/40" : "border-zinc-200/60 text-neutral-400 hover:bg-zinc-100/60"
                }`}
              >
                {darkMode ? <FiSun size={12} /> : <FiMoon size={12} />}
              </button>
            </div>
          </div>

          <input
            type="text"
            value={isLocked ? "" : title}
            onChange={handleTitleChange}
            disabled={isLocked}
            placeholder={isLocked ? "Protected content workspace" : "Untitled scene"}
            className={`w-full text-xl font-light text-slate-600 mb-2 bg-transparent py-2 outline-none placeholder:font-light transition-all duration-700 ease-in-out ${
              darkMode ? "placeholder:text-neutral-700 text-neutral-100" : "placeholder:text-neutral-300 text-neutral-900"
            }`}
          />

          <div
            ref={editorRef}
            contentEditable={!isLocked}
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyUp={checkActiveFormats}
            onClick={checkActiveFormats}
            spellCheck={false}
            className={`min-h-[500px] outline-none transition-all duration-300 novel-canvas
              ${darkMode ? "text-neutral-200" : "text-neutral-700"}
              ${isLocked ? "cursor-not-allowed select-none" : ""}
              [&_b]:font-bold [&_strong]:font-bold`}
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              fontWeight: fontWeight,
            }}
          ></div>
        </div>
      </div>

      {isFontModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-md rounded-2xl border flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95 duration-200 ${
              darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-800"
            }`}
          >
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-zinc-800" : "border-zinc-100"}`}>
              <div>
                <h3 className="text-sm font-medium tracking-wide">Install Google Fonts</h3>
                <p className="text-[11px] font-light text-neutral-400">
                  Dynamically download families for your local canvas workspace
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsFontModalOpen(false);
                  setSearchQuery("");
                }}
                className={`p-1.5 rounded-full transition-colors ${darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"}`}
              >
                <FiX size={15} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative flex items-center">
                <FiSearch size={13} className="absolute left-3.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search for Google Fonts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none transition-colors ${
                    darkMode 
                      ? "bg-zinc-950/60 border-zinc-800 focus:border-zinc-700 text-zinc-200" 
                      : "bg-zinc-50 border-zinc-200 focus:border-zinc-300 text-zinc-800"
                  }`}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-5 min-h-[200px]">
              {loadingGoogleFonts ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-neutral-400">
                  <FiLoader size={18} className="animate-spin" />
                  <span className="text-[11px] font-light">Loading font directory index...</span>
                </div>
              ) : filteredGoogleFonts.length === 0 ? (
                <div className="text-center py-12 text-xs font-light text-neutral-400">
                  No matching font families found.
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredGoogleFonts.map((font) => {
                    const isInstalled = fontOptions.some((f) => f.name === font.family);
                    const isCurrentlyInstalling = installingFont === font.family;

                    return (
                      <div 
                        key={font.family}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                          darkMode ? "border-zinc-800/40 bg-zinc-950/20" : "border-zinc-100 bg-zinc-50/40"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium tracking-wide">{font.family}</span>
                          <span className={`text-[9px] font-light uppercase tracking-wider ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                            {font.category} • {font.variants?.length || 0} weights
                          </span>
                        </div>

                        {isInstalled ? (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-500 px-2.5 py-1 select-none">
                            <FiCheck size={12} />
                            <span>Installed</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={installingFont !== null}
                            onClick={() => installGoogleFont(font.family)}
                            className={`flex items-center gap-1.5 text-[10px] font-medium tracking-wide px-3 py-1.5 rounded-lg border transition-all ${
                              isCurrentlyInstalling 
                                ? "bg-zinc-800 border-zinc-700 text-zinc-400 cursor-not-allowed"
                                : darkMode 
                                  ? "bg-zinc-100 border-zinc-200 text-zinc-950 hover:bg-zinc-200" 
                                  : "bg-zinc-900 border-zinc-800 text-zinc-50 hover:bg-zinc-800"
                            }`}
                          >
                            {isCurrentlyInstalling ? (
                              <>
                                <FiLoader size={11} className="animate-spin" />
                                <span>Installing</span>
                              </>
                            ) : (
                              <>
                                <FiDownload size={11} />
                                <span>Install</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
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