import React, { useState, useEffect, useCallback, useRef } from "react";
import { client } from "@/src/sanity/lib/client";

const totalGoal = 1000;

export default function LiveTextEditor() {
  const [articles, setArticles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // sidebar toggle

  const editorRef = useRef(null);

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
      const doc = await client.getDocument(selectedId);
      setTitle(doc?.title || "");
      setContent(doc?.content || "");
      if (editorRef.current) editorRef.current.innerHTML = doc?.content || "";
    }
    fetchContent();
  }, [selectedId]);

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

  const handleInput = () => {
    const html = editorRef.current.innerHTML;
    setContent(html);
    saveToSanity(html, title);
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

      // Animate switch if deleted article was selected
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

  // Word count and progress
  const wordCount = content
    ? content
        .replace(/<[^>]+>/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;
  const progress = Math.min((wordCount / totalGoal) * 100, 100);

  return (
    <div
      className={`flex min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-slate-900 text-white" : "bg-yellow-50 text-slate-800"
      }`}
    >
      {/* Backdrop on mobile when sidebar is open */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden animate-fadeIn"
        ></div>
      )}

      {/* Mobile toggle button moved to top-right */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="absolute top-4 right-4 z-50 md:hidden bg-gray-700 text-white px-3 py-2 rounded transition-transform duration-300 hover:scale-105"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full md:h-auto z-40 md:z-auto transform md:transform-none 
          transition-transform duration-300 w-72 border-r 
          ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-slate-50 border-gray-300"
          }
          p-6 ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <h2 className="font-bold mono text-purple-800 mb-3 text-lg">The Story</h2>
        <button
          onClick={createNewArticle}
          className="w-full mb-3 mono py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 hover:scale-105"
        >
          ➕ Add Scene
        </button>
        <div className="flex flex-col gap-2">
          {articles.map((a) => (
            <div
              key={a._id}
              className="flex justify-between items-center gap-2 animate-slideIn"
            >
              <button
                onClick={() => {
                  setSelectedId(a._id);
                  setShowSidebar(false); // close on mobile
                }}
                className={`flex gap-2 text-left px-3 py-2 rounded text-[13px] tracking-wide transition-all duration-300 ${
                  selectedId === a._id
                    ? "bg-pink-700 border border-2 text-white dark:bg-blue-700 dark:text-white"
                    : "hover:bg-pink-200 border border-pink-600 dark:hover:bg-gray-700"
                }`}
              >
                <span className="w-[180px]">{a.title || "Untitled"}</span>
                <button
                  onClick={() => deleteArticle(a._id)}
                  className="hover:text-red-800 text-sm px-2 transition-all duration-200 hover:scale-110"
                  title="Delete scene"
                >
                  X
                </button>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor */}
      
      <div className="flex-grow w-full px-6 pt-6 max-w-5xl mx-auto animate-fadeIn">
        
        {/* Saving Feature */}
        
<div className="flex gap-2 w-40 h-4 items-center">
  {saving ? (
    <div className="flex gap-1">
      <div className="w-2 h-2 rounded-full bg-blue-300 animate-[dot-bounce_0.8s_infinite]"></div>
      <div className="w-2 h-2 rounded-full bg-pink-300 animate-[dot-bounce_0.8s_infinite_0.15s]"></div>
      <div className="w-2 h-2 rounded-full bg-purple-300 animate-[dot-bounce_0.8s_infinite_0.3s]"></div>
    </div>
  ) : lastSaved ? (
    <div className="flex gap-2 items-center">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
      </div>
      <span className="text-green-700 text-xs font-medium">
        Saved at {lastSaved}
      </span>
    </div>
  ) : (
    <div className="flex gap-2 items-center">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
      </div>
      <span className="text-gray-400 text-xs">Not saved yet</span>
    </div>
  )}
</div>





            {/* Saving Feature end */}


        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter title..."
          className="w-full mt-4 text-3xl font-light font-serif bg-transparent mb-4 outline-none transition-all duration-300 focus:scale-[1.02]"
        />
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[300px] text-[16px] leading-relaxed outline-none prose max-w-none font-serif transition-all duration-300"
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            padding: "8px 0",
          }}
        ></div>
      </div>

      {/* Bottom Word Count & Dark Mode Toggle */}
      <div
        className={`fixed bottom-0 left-0 right-0 px-6 shadow-md transition-all duration-500 ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/*
        <div className="w-full mx-auto flex justify-between items-center">
          <div className="flex gap-6 text-sm">
            <span>Word count: {wordCount}</span>
            <span>Goal: {totalGoal}</span>
          </div>
          
        </div>
        <div className="w-full h-[6px] bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-sky-800 transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
          */}


        
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
