"use client";

import { useEffect, useState } from "react";

interface Note {
  id: number;
  content: string;
  is_private: boolean;
  created_by: number;
  note_date: string | null;
  created_at: string;
}

interface NotesPanelProps {
  date: string;
  onClose: () => void;
}

// Very small, safe formatter: splits on newlines and renders **bold**
// and leading "- " bullets as React elements, never via
// dangerouslySetInnerHTML, so arbitrary text can never execute as markup.
function renderFormatted(content: string) {
  return content.split("\n").map((line, i) => {
    const isBullet = line.trim().startsWith("- ");
    const text = isBullet ? line.trim().slice(2) : line;
    const parts = text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={j}>{part}</span>
      )
    );
    return (
      <div key={i} className={isBullet ? "pl-4 relative before:content-['•'] before:absolute before:left-0" : ""}>
        {parts}
      </div>
    );
  });
}

export default function NotesPanel({ date, onClose }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/notes?date=${date}`);
      if (res.ok) setNotes(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/calendar/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), is_private: isPrivate, note_date: date }),
      });
      if (res.ok) {
        setContent("");
        setIsPrivate(false);
        await fetchNotes();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/calendar/notes/${id}`, { method: "DELETE" });
    fetchNotes();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Notes — {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-slate-400">No notes for this date yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                  {renderFormatted(note.content)}
                </div>
                <div className="flex items-center justify-between mt-2">
                  {note.is_private && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      Private
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-xs text-red-600 font-semibold hover:underline ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="border-t border-slate-100 pt-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note... (**bold**, - bullets)"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-2"
            disabled={isSaving}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
              Private (only visible to me)
            </label>
            <button
              type="submit"
              disabled={isSaving || !content.trim()}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-lg font-bold text-sm disabled:opacity-50"
            >
              {isSaving ? "Adding..." : "Add Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
