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
} from "react-icons/fi";

const WPM_PRESETS = [
  { label: "Tutorial", value: 130 },
  { label: "Standard", value: 150 },
  { label: "Vlog", value: 170 },
];

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28;
const FONT_STEP = 2;

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
  const [wpmInput, setWpmInput] = useState("150");
  const [fontSize, setFontSize] = useState(15);
  
  // AI Ghost State
  const [aiMode, setAiMode] = useState(false);

  const editorRef = useRef(null);
  const wpmMenuRef = useRef(null);
  const fetchControllerRef = useRef(null);

  // Fetch all articles
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

  // Fetch selected article content
  useEffect(() => {
    async function fetchContent() {
      if (!selectedId) return;
      removeGhostText(); // clear ghost if switching articles
      const doc = await client.getDocument(selectedId);
      setTitle(doc?.title || "");
      setContent(doc?.content || "");
      if (editorRef.current) editorRef.current.innerHTML = doc?.content || "";
    }
    fetchContent();
  }, [selectedId]);

  // Close WPM popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wpmMenuRef.current && !wpmMenuRef.current.contains(e.target)) {
        setShowWpmMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save to Sanity (debounced)
  const saveToSanity = useCallback(
    debounce(async (htmlContent, newTitle) => {
      if (!selectedId) return;
      setSaving(true);
      try {
        await client
          .patch(selectedId)
          .set({ content: htmlContent, title: newTitle })
          .commit({ autoGenerateArrayKeys: true });
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Save error:", err);
      }
      setSaving(false);
    }, 800),
    [selectedId]
  );

  // --- AI GHOST SUGGESTION LOGIC ---

  const removeGhostText = () => {
    const ghost = document.getElementById("ghost-suggestion");
    if (ghost) ghost.remove();
  };

  const insertGhostText = (text) => {
    removeGhostText(); // Ensure no duplicates

    const ghost = document.createElement("span");
    ghost.id = "ghost-suggestion";
    ghost.contentEditable = "false";
    // Styling the ghost text
    ghost.style.opacity = "0.35";
    ghost.style.pointerEvents = "none";
    ghost.innerText = text;

    // Insert directly at the current cursor location
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.insertNode(ghost);
      // Keep cursor immediately BEFORE the ghost text
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

      // Move cursor to the end of the newly inserted text
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      // Manually trigger save to persist the accepted text
      handleInput();
    }
  };

  // Debounced API call to fetch AI continuation
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
    }, 1000), // Waits 1 second after typing stops before querying API
    [aiMode]
  );

  const handleKeyDown = (e) => {
    const ghost = document.getElementById("ghost-suggestion");
    
    // Accept suggestion with Tab
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
      // Remove ghost text instantly if user continues typing anything else
      removeGhostText();
    }
  };

  const handleInput = () => {
    removeGhostText(); // Strip ghost text out before saving so it never hits the DB
    const html = editorRef.current.innerHTML;
    const plainText = editorRef.current.innerText; // Get plain text for AI context
    
    setContent(html);
    saveToSanity(html, title);

    if (aiMode) {
      fetchSuggestion(plainText);
    }
  };

  // --- END AI LOGIC ---

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

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + FONT_STEP, MAX_FONT_SIZE));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - FONT_STEP, MIN_FONT_SIZE));
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
      style={{ fontFamily: "'Calibri Light', Calibri, 'Segoe UI', sans-serif" }}
      className={`flex min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-neutral-950 text-neutral-200" : "bg-neutral-50 text-neutral-800"
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
            ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"
        }`}
      >
        <FiMenu size={16} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full md:h-auto z-40 md:z-auto transform md:transform-none
          transition-transform duration-300 w-64 border-r
          ${
            darkMode
              ? "bg-neutral-950 border-neutral-800"
              : "bg-white border-neutral-200"
          }
          px-5 py-8 ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
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
          className={`w-full mb-6 flex items-center justify-center gap-2 py-2.5 text-[13px] rounded-md border transition-colors ${
            darkMode
              ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          <FiPlus size={13} />
          New script
        </button>

        <div className="flex flex-col gap-1">
          {articles.map((a) => (
            <div key={a._id} className="group flex items-center gap-1">
              <button
                onClick={() => {
                  setSelectedId(a._id);
                  setShowSidebar(false);
                }}
                className={`flex-1 text-left px-3 py-2 rounded-md text-[13px] truncate transition-colors ${
                  selectedId === a._id
                    ? darkMode
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-neutral-900"
                    : darkMode
                    ? "text-neutral-400 hover:bg-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {a.title || "Untitled"}
              </button>
              <button
                onClick={() => deleteArticle(a._id)}
                className={`opacity-0 group-hover:opacity-100 p-1.5 rounded transition-opacity ${
                  darkMode
                    ? "text-neutral-600 hover:text-red-400"
                    : "text-neutral-300 hover:text-red-500"
                }`}
                title="Delete scene"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-grow w-full px-8 pt-10 pb-24 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 h-4">
            {saving ? (
              <span
                className={`text-[12px] font-light ${
                  darkMode ? "text-neutral-500" : "text-neutral-400"
                }`}
              >
                Saving…
              </span>
            ) : lastSaved ? (
              <span
                className={`text-[12px] font-light ${
                  darkMode ? "text-neutral-500" : "text-neutral-400"
                }`}
              >
                Saved at {lastSaved}
              </span>
            ) : (
              <span
                className={`text-[12px] font-light ${
                  darkMode ? "text-neutral-600" : "text-neutral-300"
                }`}
              >
                Not saved yet
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* AI Toggle Button */}
            <button
              onClick={() => {
                setAiMode(!aiMode);
                if (aiMode) removeGhostText(); 
              }}
              className={`px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                aiMode
                  ? "border-amber-500/50 text-amber-600 bg-amber-500/10"
                  : darkMode
                  ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                  : "border-neutral-200 text-neutral-400 hover:bg-neutral-100"
              }`}
              title="Toggle AI Ghost Suggestions"
            >
              <FiZap size={13} className={aiMode ? "fill-amber-500/20" : ""} />
              <span className="text-[11px] uppercase tracking-wider font-medium">
                {aiMode ? "AI ON" : "AI OFF"}
              </span>
            </button>

            {/* Font size stepper */}
            <div
              className={`flex items-center rounded-full border overflow-hidden ${
                darkMode ? "border-neutral-700" : "border-neutral-200"
              }`}
            >
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= MIN_FONT_SIZE}
                className={`p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  darkMode
                    ? "text-neutral-400 hover:bg-neutral-800"
                    : "text-neutral-400 hover:bg-neutral-100"
                }`}
                title="Decrease font size"
              >
                <FiMinus size={12} />
              </button>
              <span
                className={`text-[11px] font-light w-7 text-center select-none ${
                  darkMode ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                {fontSize}
              </span>
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= MAX_FONT_SIZE}
                className={`p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  darkMode
                    ? "text-neutral-400 hover:bg-neutral-800"
                    : "text-neutral-400 hover:bg-neutral-100"
                }`}
                title="Increase font size"
              >
                <FiPlus size={12} />
              </button>
            </div>

            {/* Dark mode toggle */}
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

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className={`min-h-[400px] leading-[1.8] outline-none font-light transition-all duration-150 ${
            darkMode ? "text-neutral-300" : "text-neutral-700"
          }`}
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            fontSize: `${fontSize}px`,
          }}
        ></div>
      </div>

      {/* Bottom: estimated video runtime */}
      <div
        className={`fixed bottom-0 left-0 right-0 md:left-64 px-8 py-3 border-t transition-colors duration-300 ${
          darkMode
            ? "bg-neutral-950 border-neutral-800"
            : "bg-white border-neutral-200"
        }`}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiClock
              size={13}
              className={darkMode ? "text-neutral-500" : "text-neutral-400"}
            />
            <span
              className={`text-[13px] font-light tracking-wide ${
                darkMode ? "text-neutral-300" : "text-neutral-700"
              }`}
            >
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
              className={`text-[11px] font-light rounded-full px-2.5 py-1 border transition-colors ${
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
                <p
                  className={`text-[10px] uppercase tracking-[0.1em] mb-2 ${
                    darkMode ? "text-neutral-500" : "text-neutral-400"
                  }`}
                >
                  Speaking pace
                </p>

                <div className="flex flex-col gap-1 mb-3">
                  {WPM_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => applyWpm(preset.value)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] font-light transition-colors ${
                        wpm === preset.value
                          ? darkMode
                            ? "bg-neutral-800 text-white"
                            : "bg-neutral-100 text-neutral-900"
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
    </div>
  );
}

// Debounce helper
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}