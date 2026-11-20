"use client";

import { useState, useEffect, useRef } from "react";
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
  locked?: boolean;
  // After Level 2 approval: steps the Level 1 checker verified stay frozen;
  // the rest (post-check work) can still be ticked, timed and noted.
  frozenIds?: Set<number>;
  lockMessage?: string;
}

export default function SubtaskChecklist({
  taskId,
  taskTitle,
  subtasks,
  onSubtasksChange,
  locked = false,
  frozenIds,
  lockMessage = "🔒 Locked while this task is with a checker. It can be edited again if it's sent back.",
}: SubtaskChecklistProps) {
  const approvedMode = !!frozenIds && !locked;
  const structureLocked = locked || approvedMode;
  const stepLocked = (id: number) => locked || !!frozenIds?.has(id);

  const [localSubtasks, setLocalSubtasks] = useState(subtasks);
  const [timers, setTimers] = useState<Record<number, number>>({});
  const [runningTimer, setRunningTimer] = useState<number | null>(null);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [minuteInputs, setMinuteInputs] = useState<Record<number, string>>({});
  const [timeError, setTimeError] = useState<string | null>(null);
  const subtasksRef = useRef(localSubtasks);
  subtasksRef.current = localSubtasks;

  // A locked checklist can't log time, so drop any timer left running.
  useEffect(() => {
    if (!locked) return;
    setRunningTimer(null);
    localStorage.removeItem(`task-${taskId}-timer`);
  }, [locked, taskId]);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem(`task-${taskId}-timer`);
    if (savedTimer && !locked) {
      const { subtaskId, elapsed } = JSON.parse(savedTimer);
      setRunningTimer(subtaskId);
      setTimers({ [subtaskId]: elapsed });
    }
  }, [taskId, locked]);

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
    if (stepLocked(subtaskId)) return;
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

  // Adds time to a step and saves the new total. Every path that logs
  // time (pause, stop, switching timers, manual minutes) goes through here
  // so nothing lives only in the browser.
  // Reads through a ref so two saves in one click (e.g. typed minutes,
  // then the timer) build on each other instead of the same stale list.
  const logTime = async (subtaskId: number, addSeconds: number) => {
    if (addSeconds <= 0) return;
    const current = subtasksRef.current.find((s) => s.id === subtaskId);
    await saveTime(subtaskId, (current?.seconds || 0) + addSeconds);
  };

  const saveTime = async (subtaskId: number, newTotal: number) => {
    if (stepLocked(subtaskId)) return;
    setTimeError(null);
    const updated = subtasksRef.current.map((st) =>
      st.id === subtaskId ? { ...st, seconds: newTotal } : st
    );
    subtasksRef.current = updated;
    setLocalSubtasks(updated);
    onSubtasksChange(updated);

    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds: newTotal }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Couldn't save the time");
      }
    } catch (error) {
      console.error("Error updating subtask time:", error);
      setTimeError(
        `${error instanceof Error ? error.message : "Couldn't save the time"} — refresh and try again.`
      );
    }
  };

  const commitRunningTimer = async () => {
    if (runningTimer === null) return;
    const subtaskId = runningTimer;
    const elapsed = timers[subtaskId] || 0;
    setRunningTimer(null);
    setTimers((prev) => ({ ...prev, [subtaskId]: 0 }));
    localStorage.removeItem(`task-${taskId}-timer`);
    await logTime(subtaskId, elapsed);
  };

  const handleAddMinutes = async (subtaskId: number) => {
    const mins = parseInt(minuteInputs[subtaskId] || "");
    if (!mins || mins <= 0) return;
    setMinuteInputs((prev) => ({ ...prev, [subtaskId]: "" }));
    await logTime(subtaskId, mins * 60);
  };

  const handleResetTime = async (subtaskId: number) => {
    if (!window.confirm("Clear all time logged on this step and start again from 0?")) return;
    if (runningTimer === subtaskId) {
      setRunningTimer(null);
      localStorage.removeItem(`task-${taskId}-timer`);
    }
    setTimers((prev) => ({ ...prev, [subtaskId]: 0 }));
    setMinuteInputs((prev) => ({ ...prev, [subtaskId]: "" }));
    await saveTime(subtaskId, 0);
  };

  // The stopwatch continues from the step's logged total, so minutes
  // typed into the box (even if not yet added) count before it starts.
  const handleStartTimer = async (subtaskId: number) => {
    await commitRunningTimer();
    await handleAddMinutes(subtaskId);
    setRunningTimer(subtaskId);
    setTimers((prev) => ({ ...prev, [subtaskId]: 0 }));
  };

  const handleNotesChange = async (subtaskId: number, notes: string) => {
    if (stepLocked(subtaskId)) return;
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
    if (structureLocked) return;
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
    if (structureLocked) return;
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

      {timeError && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md text-sm">
          {timeError}
        </div>
      )}

      {locked && (
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-md text-sm">
          {lockMessage}
        </div>
      )}

      {approvedMode && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
          ✓ Approved. Steps verified in the check are locked; tick off any remaining steps, then mark the task completed below.
        </div>
      )}

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
                    disabled={stepLocked(subtask.id)}
                    className={`mt-1 w-5 h-5 rounded border-gray-300 dark:border-gray-600 accent-accent-400 ${
                      stepLocked(subtask.id) ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
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
                  {!structureLocked && (
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold text-2xl transition"
                    title="Delete step"
                  >
                    ×
                  </button>
                  )}
                </div>
              </div>
            </div>

            {/* Time tracking and notes */}
            <div className="space-y-4 ml-14">
              {/* Timer and manual input - side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Timer section */}
                <div className="flex items-center gap-2 flex-wrap">
                  {stepLocked(subtask.id) ? null : runningTimer === subtask.id ? (
                    <>
                      <span className="font-mono text-lg font-bold text-accent-400">
                        {formatTimerDisplay((subtask.seconds || 0) + (timers[subtask.id] || 0))}
                      </span>
                      <button
                        onClick={commitRunningTimer}
                        className="px-3 py-1 bg-success-500 dark:bg-green-700 text-white text-xs rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition font-semibold"
                      >
                        ⏹ Stop &amp; save
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartTimer(subtask.id)}
                      className="px-3 py-1 bg-primary-600 dark:bg-primary-700 text-white text-xs rounded-md hover:bg-primary-700 dark:hover:bg-primary-800 transition font-semibold"
                    >
                      ▶ Start
                    </button>
                  )}
                  <span
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md"
                    title="Total time logged on this step"
                  >
                    {formatTime(subtask.seconds || 0)} logged
                  </span>
                  {!stepLocked(subtask.id) && ((subtask.seconds || 0) > 0 || runningTimer === subtask.id) && (
                    <button
                      onClick={() => handleResetTime(subtask.id)}
                      className="px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900 transition"
                      title="Clear logged time and start from 0"
                    >
                      ↺ Reset
                    </button>
                  )}
                </div>

                {/* Manual time input */}
                {!stepLocked(subtask.id) && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Minutes"
                    min="1"
                    value={minuteInputs[subtask.id] || ""}
                    onChange={(e) =>
                      setMinuteInputs((prev) => ({ ...prev, [subtask.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddMinutes(subtask.id);
                    }}
                    className="w-24 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                  <button
                    onClick={() => handleAddMinutes(subtask.id)}
                    disabled={!minuteInputs[subtask.id]}
                    className="px-3 py-1 bg-gray-700 dark:bg-gray-600 text-white text-xs rounded-md hover:bg-gray-800 transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Add min
                  </button>
                </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wide">Notes</label>
                <textarea
                  placeholder="Add notes or observations..."
                  value={subtask.notes || ""}
                  onChange={(e) => handleNotesChange(subtask.id, e.target.value)}
                  readOnly={stepLocked(subtask.id)}
                  rows={3}
                  className="read-only:bg-gray-100 dark:read-only:bg-gray-800 read-only:cursor-default w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add step */}
      {!structureLocked && (
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
      )}
    </div>
  );
}
