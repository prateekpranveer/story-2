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
  FiX,
  FiLock,
  FiUnlock,
} from "react-icons/fi";

const HARDCODED_PASSWORD = "gotxy"; // Change this to your desired password

const FONT_OPTIONS = [
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Calibri", value: "'Calibri', Calibri, sans-serif" },
];

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 48; 
const FONT_STEP = 2;

const MIN_LINE_HEIGHT = 1.4;
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
  
  // Password Protection States
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [fontWeight, setFontWeight] = useState(300);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);

  const editorRef = useRef(null);

  // Re-lock whenever switching documents
  useEffect(() => {
    if (selectedId) {
      setIsLocked(true);
      setPasswordInput("");
      setPasswordError(false);
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
      if (editorRef.current) editorRef.current.innerHTML = doc?.content || "";
    }
    fetchContent();
  }, [selectedId]);

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

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContent(html);
    saveToSanity(html, title);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    saveToSanity(content, newTitle);
  };

  // Intercept paste events to strip hidden formatting and paste plain text
  const handlePaste = (e) => {
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
    // 1. Confirm basic intent to delete
    if (!window.confirm("Are you sure you want to delete this script?")) return;

    // 2. Request the hardcoded password
    const enteredPassword = window.prompt("Enter the administrator password to confirm deletion:");
    
    if (enteredPassword === null) return; // User pressed Cancel
    
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

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
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

  const wordCount = content
    ? content
        .replace(/<[^>]+>/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  return (
    <div
      style={{ fontFamily: selectedFont }}
      className={`flex min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50/60 text-zinc-800"
      }`}
    >
      {/* Backdrop on mobile when sidebar is open */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
        ></div>
      )}

      {/* Mobile toggle button */}
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

      {/* Structural Sidebar */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen z-40 transform md:transform-none
          transition-colors duration-300 w-64 border-r overflow-y-auto shrink-0 px-5 py-8
          ${darkMode ? "bg-zinc-950 border-zinc-800/80" : "bg-zinc-100 border-zinc-200"}
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
                    ? darkMode ? "bg-zinc-800 text-zinc-100" : "bg-zinc-200 text-zinc-900"
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

      {/* Main Content Sheet Area */}
      <div className="relative flex-grow w-full max-w-4xl mx-auto">
        
        {/* Aesthetic Password Protected Modal Cover */}
        {isLocked && selectedId && (
          <div className="absolute inset-0 z-30 flex items-start justify-center pt-24 backdrop-blur-md transition-all duration-300">
            <form 
              onSubmit={handleUnlockSubmit}
              className={`flex flex-col items-center w-full max-w-[280px] px-14 py-10 rounded-md border text-center transition-all ${
                darkMode 
                  ? "bg-zinc-900/80 border-zinc-800 shadow-xl shadow-black/20" 
                  : "bg-white/80 border-zinc-200/80 shadow-xl shadow-zinc-200/50"
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
                    : darkMode 
                      ? "bg-zinc-950/50 border-zinc-800 text-zinc-200 focus:border-zinc-700" 
                      : "bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-zinc-300"
                }`}
                autoFocus
              />
              
              {passwordError && (
                <span className="text-[10px] text-red-400 font-light mt-2 animate-pulse">
                  Incorrect password. Try again.
                </span>
              )}
              
              <button
                type="submit"
                className={`w-full mt-4 py-2 text-[10px] font-medium tracking-widest uppercase rounded-md transition-colors ${
                  darkMode 
                    ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200" 
                    : "bg-zinc-900 text-zinc-50 hover:bg-zinc-800"
                }`}
              >
                Unlock Scene
              </button>
            </form>
          </div>
        )}

        {/* Content Sheet (Includes Blur and Non-interactability if locked) */}
        <div className={`px-8 pt-4 pb-32 transition-all duration-300 ${isLocked && selectedId ? "blur-sm pointer-events-none select-none opacity-40" : ""}`}>
          
          {/* Unified Control Toolbar (SUPER GLASSY) */}
          <div className={`sticky top-2 z-20 flex flex-wrap items-center justify-between gap-4 p-1 mb-4 rounded-xl backdrop-blur-xl transition-all ${
            darkMode 
              ? "bg-zinc-900/30 border-zinc-800/60 shadow-black/10 text-zinc-100" 
              : "bg-white/45 border-white/60 shadow-zinc-200/30 text-zinc-800"
          }`}>
            {/* Left Side: Sync Status Indicator */}
            <div className="flex items-center pl-2 h-5 select-none">
              {saving ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              ) : lastSaved ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-400/70 shrink-0" />
                  <span className={`text-[11px] font-light tracking-wide ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                    {lastSaved}
                  </span>
                </div>
              ) : (
                <span className={`w-2.5 h-2.5 rounded-full border border-dashed shrink-0 ${darkMode ? "border-neutral-700" : "border-neutral-300"}`} />
              )}
            </div>

            {/* Right Side: Tools Cluster */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Word Count aligned next to format options */}
              <div className={`text-[11px] tracking-wide font-light pr-1 select-none ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                {wordCount} words
              </div>

              {/* Rich Text Format Options */}
              <div className="flex items-center gap-0.5">
                <button 
                  type="button"
                  onClick={() => executeCommand("bold")}
                  className={`p-2 rounded transition-colors ${darkMode ? "hover:bg-zinc-800/40 text-zinc-300" : "hover:bg-zinc-200/50 text-zinc-700"}`}
                  title="Bold"
                >
                  <FiBold size={13} />
                </button>
                <button 
                  type="button"
                  onClick={() => executeCommand("italic")}
                  className={`p-2 rounded transition-colors ${darkMode ? "hover:bg-zinc-800/40 text-zinc-300" : "hover:bg-zinc-200/50 text-zinc-700"}`}
                  title="Italic"
                >
                  <FiItalic size={13} />
                </button>
                <button 
                  type="button"
                  onClick={() => executeCommand("strikeThrough")}
                  className={`p-2 rounded font-sans font-bold transition-colors text-xs line-through ${darkMode ? "hover:bg-zinc-800/40 text-zinc-300" : "hover:bg-zinc-200/50 text-zinc-700"}`}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>

              <div className={`w-[1px] h-4 ${darkMode ? "bg-zinc-800/60" : "bg-zinc-300/60"}`} />
              
              {/* Highlighters */}
              <div className="flex items-center gap-1">
                {HIGHLIGHTERS.map((hl) => (
                  <button
                    key={hl.name}
                    type="button"
                    onClick={() => executeCommand("hiliteColor", hl.color)}
                    className="w-4 h-4 rounded-full transition-transform hover:scale-110 border border-black/10"
                    style={{ backgroundColor: hl.color }}
                    title={`${hl.name} Highlight`}
                  />
                ))}
                <button 
                  type="button"
                  onClick={() => executeCommand("hiliteColor", "transparent")}
                  className={`p-1 rounded transition-colors ml-1 border border-dashed ${
                    darkMode ? "border-zinc-700 hover:bg-zinc-800/40 text-zinc-500" : "border-zinc-300 hover:bg-zinc-200/50 text-zinc-400"
                  }`}
                  title="Clear Highlight"
                >
                  <FiX size={10} />
                </button>
              </div>

              <div className={`w-[1px] h-4 ${darkMode ? "bg-zinc-800/60" : "bg-zinc-300/60"}`} />

              {/* Typography Configuration */}
              <div className="relative flex items-center">
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className={`text-[10px] font-light rounded-full pl-3 pr-8 py-1.5 border appearance-none outline-none transition-colors cursor-pointer ${
                    darkMode
                      ? "bg-zinc-950/40 border-zinc-800/60 text-neutral-300 hover:bg-zinc-800/40"
                      : "bg-white/40 border-zinc-200/60 text-neutral-600 hover:bg-zinc-100/60"
                  }`}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value} className={darkMode ? "bg-zinc-950" : "bg-white"}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <FiType size={11} className="absolute right-3 pointer-events-none text-neutral-400" />
              </div>

              {/* Sizing Toggles */}
              <div className={`flex items-center rounded-full border overflow-hidden ${darkMode ? "border-zinc-800/60" : "border-zinc-200/60"}`}>
                <button
                  onClick={() => setFontSize((prev) => Math.max(prev - FONT_STEP, MIN_FONT_SIZE))}
                  disabled={fontSize <= MIN_FONT_SIZE}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-100/60"}`}
                  title="Decrease size"
                >
                  <FiMinus size={10} />
                </button>
                <span className={`text-[10px] font-light w-8 text-center select-none ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize((prev) => Math.min(prev + FONT_STEP, MAX_FONT_SIZE))}
                  disabled={fontSize >= MAX_FONT_SIZE}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-100/60"}`}
                  title="Increase size"
                >
                  <FiPlus size={10} />
                </button>

                <div className={`w-[1px] h-4 ${darkMode ? "bg-zinc-800/60" : "bg-zinc-200/60"}`} />

                <button
                  onClick={() => setLineHeight((prev) => Math.max(parseFloat((prev - LINE_HEIGHT_STEP).toFixed(1)), MIN_LINE_HEIGHT))}
                  disabled={lineHeight <= MIN_LINE_HEIGHT}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-100/60"}`}
                  title="Decrease Spacing"
                >
                  <FiMinus size={10} />
                </button>
                <span className={`text-[10px] font-light w-10 text-center select-none ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  {lineHeight}LH
                </span>
                <button
                  onClick={() => setLineHeight((prev) => Math.min(parseFloat((prev + LINE_HEIGHT_STEP).toFixed(1)), MAX_LINE_HEIGHT))}
                  disabled={lineHeight >= MAX_LINE_HEIGHT}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-100/60"}`}
                  title="Increase Spacing"
                >
                  <FiPlus size={10} />
                </button>

                <div className={`w-[1px] h-4 ${darkMode ? "bg-zinc-800/60" : "bg-zinc-200/60"}`} />

                {/* Font Weight Toggle */}
                <button
                  onClick={() => setFontWeight((prev) => Math.max(prev - FONT_WEIGHT_STEP, MIN_FONT_WEIGHT))}
                  disabled={fontWeight <= MIN_FONT_WEIGHT}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-100/60"}`}
                  title="Decrease Weight"
                >
                  <FiMinus size={10} />
                </button>
                <span className={`text-[10px] font-light w-10 text-center select-none ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  {fontWeight}W
                </span>
                <button
                  onClick={() => setFontWeight((prev) => Math.min(prev + FONT_WEIGHT_STEP, MAX_FONT_WEIGHT))}
                  disabled={fontWeight >= MAX_FONT_WEIGHT}
                  className={`p-2 transition-colors disabled:opacity-30 ${darkMode ? "text-neutral-400 hover:bg-zinc-800/40" : "text-neutral-400 hover:bg-zinc-100/60"}`}
                  title="Increase Weight"
                >
                  <FiPlus size={10} />
                </button>
              </div>

              {/* Dark Mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full border transition-colors ${
                  darkMode
                    ? "border-zinc-800/60 text-neutral-400 hover:bg-zinc-800/40"
                    : "border-zinc-200/60 text-neutral-400 hover:bg-zinc-100/60"
                }`}
              >
                {darkMode ? <FiSun size={12} /> : <FiMoon size={12} />}
              </button>
            </div>
          </div>


          {/* Scene Title */}
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

          {/* Writing Canvas */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            spellCheck={false}
            className={`min-h-[500px] outline-none transition-all duration-150 ${
              darkMode ? "text-neutral-200" : "text-neutral-700"
            }`}
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