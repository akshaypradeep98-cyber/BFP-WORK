"use client";

import { useState, useEffect } from "react";
import { formatTime, formatTimerDisplay } from "@/lib/taskTemplates";

interface Subtask {
  id: number;
  task_id: number;
  title: string;
  done: boolean;
  seconds: number;
  notes: string;
  sort_order: number;
}

interface SubtaskChecklistProps {
  taskId: number;
  taskTitle: string;
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
}

export default function SubtaskChecklist({
  taskId,
  taskTitle,
  subtasks,
  onSubtasksChange,
}: SubtaskChecklistProps) {
  const [localSubtasks, setLocalSubtasks] = useState(subtasks);
  const [timers, setTimers] = useState<Record<number, number>>({});
  const [runningTimer, setRunningTimer] = useState<number | null>(null);
  const [newStepTitle, setNewStepTitle] = useState("");

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem(`task-${taskId}-timer`);
    if (savedTimer) {
      const { subtaskId, elapsed } = JSON.parse(savedTimer);
      setRunningTimer(subtaskId);
      setTimers({ [subtaskId]: elapsed });
    }
  }, [taskId]);

  // Timer effect
  useEffect(() => {
    if (runningTimer === null) return;

    localStorage.setItem(
      `task-${taskId}-timer`,
      JSON.stringify({ subtaskId: runningTimer, elapsed: timers[runningTimer] || 0 })
    );

    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = {
          ...prev,
          [runningTimer]: (prev[runningTimer] || 0) + 1,
        };
        localStorage.setItem(
          `task-${taskId}-timer`,
          JSON.stringify({ subtaskId: runningTimer, elapsed: updated[runningTimer] })
        );
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTimer, taskId, timers]);

  const handleCheckbox = async (subtaskId: number) => {
    const updated = localSubtasks.map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    setLocalSubtasks(updated);
    onSubtasksChange(updated);

    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: updated.find((s) => s.id === subtaskId)?.done }),
      });
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  const handleStartTimer = (subtaskId: number) => {
    setRunningTimer(subtaskId);
    setTimers((prev) => ({ ...prev, [subtaskId]: prev[subtaskId] || 0 }));
  };

  const handlePauseTimer = (subtaskId: number) => {
    setRunningTimer(null);
  };

  const handleStopTimer = async (subtaskId: number) => {
    setRunningTimer(null);
    const elapsed = timers[subtaskId] || 0;

    const updated = localSubtasks.map((st) =>
      st.id === subtaskId
        ? { ...st, seconds: st.seconds + elapsed }
        : st
    );
    setLocalSubtasks(updated);
    onSubtasksChange(updated);

    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seconds: updated.find((s) => s.id === subtaskId)?.seconds,
        }),
      });
    } catch (error) {
      console.error("Error updating subtask time:", error);
    }

    setTimers((prev) => ({ ...prev, [subtaskId]: 0 }));
    localStorage.removeItem(`task-${taskId}-timer`);
  };

  const handleAddMinutes = async (subtaskId: number, minutes: number) => {
    const updated = localSubtasks.map((st) =>
      st.id === subtaskId
        ? { ...st, seconds: st.seconds + minutes * 60 }
        : st
    );
    setLocalSubtasks(updated);
    onSubtasksChange(updated);

    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seconds: updated.find((s) => s.id === subtaskId)?.seconds,
        }),
      });
    } catch (error) {
      console.error("Error updating subtask time:", error);
    }
  };

  const handleNotesChange = async (subtaskId: number, notes: string) => {
    const updated = localSubtasks.map((st) =>
      st.id === subtaskId ? { ...st, notes } : st
    );
    setLocalSubtasks(updated);

    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch (error) {
      console.error("Error updating subtask notes:", error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    const updated = localSubtasks.filter((st) => st.id !== subtaskId);
    setLocalSubtasks(updated);
    onSubtasksChange(updated);

    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newStepTitle }),
      });

      const newSubtask = await response.json();
      const updated = [...localSubtasks, newSubtask];
      setLocalSubtasks(updated);
      onSubtasksChange(updated);
      setNewStepTitle("");
    } catch (error) {
      console.error("Error adding subtask:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Title Heading */}
      <div className="mb-6 pb-4 border-b-2 border-accent-400">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Checklist for</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{taskTitle}</h3>
      </div>

      {/* Checklist Items */}
      <div className="space-y-4">
        {localSubtasks.map((subtask, index) => (
          <div
            key={subtask.id || `temp-${index}`}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-5 hover:shadow-sm transition"
          >
            {/* Main row with checkbox and title */}
            <div className="flex items-start gap-4 mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 text-white flex items-center justify-center font-bold text-lg">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={subtask.done}
                    onChange={() => handleCheckbox(subtask.id)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-gray-600 cursor-pointer accent-accent-400"
                  />
                  <p
                    className={`flex-1 text-base font-medium leading-relaxed ${
                      subtask.done
                        ? "line-through text-gray-400 dark:text-gray-500"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {subtask.title}
                  </p>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold text-2xl transition"
                    title="Delete step"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Time tracking and notes */}
            <div className="space-y-4 ml-14">
              {/* Timer and manual input - side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Timer section */}
                <div className="flex items-center gap-2 flex-wrap">
                  {runningTimer === subtask.id ? (
                    <>
                      <span className="font-mono text-lg font-bold text-accent-400">
                        {formatTimerDisplay(timers[subtask.id] || 0)}
                      </span>
                      <button
                        onClick={() => handlePauseTimer(subtask.id)}
                        className="px-3 py-1 bg-amber-500 dark:bg-amber-600 text-white text-xs rounded-md hover:bg-amber-600 dark:hover:bg-amber-700 transition font-semibold"
                      >
                        ⏸ Pause
                      </button>
                      <button
                        onClick={() => handleStopTimer(subtask.id)}
                        className="px-3 py-1 bg-success-500 dark:bg-green-700 text-white text-xs rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition font-semibold"
                      >
                        ✓ Stop
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartTimer(subtask.id)}
                        className="px-3 py-1 bg-primary-600 dark:bg-primary-700 text-white text-xs rounded-md hover:bg-primary-700 dark:hover:bg-primary-800 transition font-semibold"
                      >
                        ▶ {timers[subtask.id] ? "Resume" : "Start"}
                      </button>
                      {(timers[subtask.id] || subtask.seconds) > 0 && (
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md">
                          {formatTime((timers[subtask.id] || 0) + subtask.seconds)}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Manual time input */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Add minutes"
                    min="0"
                    className="w-24 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400"
                    onBlur={(e) => {
                      const mins = parseInt(e.target.value);
                      if (mins > 0) {
                        handleAddMinutes(subtask.id, mins);
                        e.target.value = "";
                      }
                    }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">min</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wide">Notes</label>
                <textarea
                  placeholder="Add notes or observations..."
                  value={subtask.notes || ""}
                  onChange={(e) => handleNotesChange(subtask.id, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add step */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={newStepTitle}
          onChange={(e) => setNewStepTitle(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleAddStep();
            }
          }}
          placeholder="Add a new step..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 text-sm dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={handleAddStep}
          className="px-6 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-800 transition text-sm font-semibold whitespace-nowrap"
        >
          + Add Step
        </button>
      </div>
    </div>
  );
}
