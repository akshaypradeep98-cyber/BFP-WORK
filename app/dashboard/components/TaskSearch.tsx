"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CHECK_STAGES } from "@/lib/utils";

interface SearchTask {
  id: number;
  title: string;
  client_id: number | null;
  employee_id: number | null;
  tax_period?: string | null;
  status: string;
  check_status?: string | null;
  due_date?: string | null;
}

interface Named {
  id: number;
  name: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  todo: { label: "To do", className: "bg-gray-100 text-gray-800" },
  prog: { label: "In progress", className: "bg-amber-100 text-amber-800" },
  done: { label: "Done", className: "bg-green-100 text-green-800" },
  completed: { label: "Completed", className: "bg-slate-200 text-slate-700" },
};

const inputClass =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load ${url}`);
  }
  return response.json();
}

export default function TaskSearch() {
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [clients, setClients] = useState<Named[]>([]);
  const [people, setPeople] = useState<Named[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [taskQuery, setTaskQuery] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [taxYear, setTaxYear] = useState("");
  const [doneBy, setDoneBy] = useState("");

  useEffect(() => {
    Promise.all([
      getJson<SearchTask[]>("/api/tasks"),
      getJson<Named[]>("/api/clients"),
      getJson<Named[]>("/api/employees/directory"),
    ])
      .then(([t, c, p]) => {
        setTasks(t || []);
        setClients(c || []);
        setPeople(p || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load tasks"))
      .finally(() => setIsLoading(false));
  }, []);

  const clientName = (id: number | null) => clients.find((c) => c.id === id)?.name || "";
  const personName = (id: number | null) => people.find((p) => p.id === id)?.name || "";

  const taxYears = useMemo(
    () =>
      [...new Set(tasks.map((t) => t.tax_period).filter((y): y is string => !!y))].sort().reverse(),
    [tasks]
  );

  const hasFilter = !!(taskQuery.trim() || clientQuery.trim() || taxYear || doneBy);

  const results = useMemo(() => {
    const tq = taskQuery.trim().toLowerCase();
    const cq = clientQuery.trim().toLowerCase();
    return tasks
      .filter((t) => !tq || t.title.toLowerCase().includes(tq))
      .filter((t) => !cq || clientName(t.client_id).toLowerCase().includes(cq))
      .filter((t) => !taxYear || t.tax_period === taxYear)
      .filter((t) => !doneBy || String(t.employee_id) === doneBy)
      .sort((a, b) => (b.tax_period || "").localeCompare(a.tax_period || "") || b.id - a.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, clients, taskQuery, clientQuery, taxYear, doneBy]);

  const clearFilters = () => {
    setTaskQuery("");
    setClientQuery("");
    setTaxYear("");
    setDoneBy("");
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-slate-900">🔎 Search Tasks</h2>
        {hasFilter && (
          <button onClick={clearFilters} className="text-sm font-semibold text-violet-600 hover:text-violet-800">
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          value={taskQuery}
          onChange={(e) => setTaskQuery(e.target.value)}
          placeholder="Task name (e.g. GST, ITR)"
          className={inputClass}
        />
        <input
          value={clientQuery}
          onChange={(e) => setClientQuery(e.target.value)}
          placeholder="Client name"
          className={inputClass}
        />
        <select value={taxYear} onChange={(e) => setTaxYear(e.target.value)} className={inputClass}>
          <option value="">All tax years</option>
          {taxYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select value={doneBy} onChange={(e) => setDoneBy(e.target.value)} className={inputClass}>
          <option value="">Done by anyone</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}

      {!error && hasFilter && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            {isLoading ? "Loading..." : `${results.length} task${results.length === 1 ? "" : "s"} found`}
          </p>
          {results.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-700">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Task</th>
                    <th className="px-4 py-2.5 font-semibold">Client</th>
                    <th className="px-4 py-2.5 font-semibold">Tax year</th>
                    <th className="px-4 py-2.5 font-semibold">Done by</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Checking</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 100).map((t) => {
                    const status = STATUS_LABELS[t.status];
                    const stage = CHECK_STAGES[t.check_status || ""];
                    return (
                      <tr key={t.id} className="border-t border-slate-100 hover:bg-violet-50">
                        <td className="px-4 py-2.5">
                          <Link href={`/tasks/${t.id}`} className="font-semibold text-violet-700 hover:underline">
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">{clientName(t.client_id) || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{t.tax_period || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-700">{personName(t.employee_id) || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              status?.className ?? "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {status?.label ?? t.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {stage ? (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${stage.className}`}>
                              {stage.label}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {results.length > 100 && (
            <p className="text-xs text-slate-500 mt-2">Showing the first 100. Narrow the search to see more.</p>
          )}
        </div>
      )}
    </div>
  );
}
