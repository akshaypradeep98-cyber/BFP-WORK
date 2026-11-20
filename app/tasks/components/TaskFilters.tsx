"use client";

import { CHECK_STAGES } from "@/lib/utils";

export interface FilterableTask {
  title: string;
  status: string;
  check_status?: string | null;
  employee_id: number | null;
  client_id: number | null;
  tax_period?: string | null;
  due_date?: string | null;
  amount?: number | null;
  total_seconds?: number | null;
}

type FieldKey = "status" | "checking" | "employee" | "client" | "taxYear" | "due" | "title" | "amount" | "hours";
type FieldKind = "choice" | "date" | "text" | "number";

export interface FilterRule {
  id: number;
  field: FieldKey;
  op: string;
  values: string[]; // choice fields: any of these
  value: string; // date / text / number
  value2: string; // second date for "between"
}

export interface TaskFilterState {
  match: "all" | "any";
  rules: FilterRule[];
}

interface Named {
  id: number;
  name: string;
}

interface Option {
  value: string;
  label: string;
}

const FIELDS: { key: FieldKey; label: string; kind: FieldKind }[] = [
  { key: "status", label: "Status", kind: "choice" },
  { key: "checking", label: "Checking stage", kind: "choice" },
  { key: "employee", label: "Assigned to", kind: "choice" },
  { key: "client", label: "Client", kind: "choice" },
  { key: "taxYear", label: "Tax year", kind: "choice" },
  { key: "due", label: "Due date", kind: "date" },
  { key: "title", label: "Task name", kind: "text" },
  { key: "amount", label: "Amount (₹)", kind: "number" },
  { key: "hours", label: "Time logged (hours)", kind: "number" },
];

const OPS: Record<FieldKind, Option[]> = {
  choice: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
  ],
  date: [
    { value: "before", label: "is on or before" },
    { value: "after", label: "is on or after" },
    { value: "between", label: "is between" },
    { value: "overdue", label: "is overdue" },
    { value: "empty", label: "is not set" },
  ],
  text: [
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "doesn't contain" },
  ],
  number: [
    { value: "gte", label: "is at least" },
    { value: "lte", label: "is at most" },
  ],
};

const STATUS_OPTIONS: Option[] = [
  { value: "todo", label: "To do" },
  { value: "prog", label: "In progress" },
  { value: "done", label: "Done (in checking)" },
  { value: "completed", label: "Completed" },
];

const fieldKind = (key: FieldKey) => FIELDS.find((f) => f.key === key)!.kind;

let nextId = 1;
export function newRule(field: FieldKey = "status"): FilterRule {
  return { id: nextId++, field, op: OPS[fieldKind(field)][0].value, values: [], value: "", value2: "" };
}

export const DEFAULT_TASK_FILTERS: TaskFilterState = {
  match: "all",
  rules: [{ ...newRule("status"), op: "is_not", values: ["completed"] }],
};

function choiceValue(t: FilterableTask, field: FieldKey): string {
  switch (field) {
    case "status":
      return t.status;
    case "checking":
      return CHECK_STAGES[t.check_status || ""] ? (t.check_status as string) : "none";
    case "employee":
      return t.employee_id ? String(t.employee_id) : "";
    case "client":
      return t.client_id ? String(t.client_id) : "";
    case "taxYear":
      return t.tax_period || "";
    default:
      return "";
  }
}

// A rule with nothing filled in yet doesn't filter anything.
function isActive(r: FilterRule): boolean {
  const kind = fieldKind(r.field);
  if (kind === "choice") return r.values.length > 0;
  if (kind === "date") {
    if (r.op === "overdue" || r.op === "empty") return true;
    return r.op === "between" ? !!(r.value || r.value2) : !!r.value;
  }
  return r.value.trim() !== "";
}

function matches(t: FilterableTask, r: FilterRule, today: string): boolean {
  switch (fieldKind(r.field)) {
    case "choice": {
      const has = r.values.includes(choiceValue(t, r.field));
      return r.op === "is_not" ? !has : has;
    }
    case "date": {
      const d = t.due_date || "";
      if (r.op === "empty") return !d;
      if (!d) return false;
      if (r.op === "overdue") return d < today && t.status !== "completed";
      if (r.op === "before") return d <= r.value;
      if (r.op === "after") return d >= r.value;
      return (!r.value || d >= r.value) && (!r.value2 || d <= r.value2);
    }
    case "text": {
      const has = t.title.toLowerCase().includes(r.value.trim().toLowerCase());
      return r.op === "not_contains" ? !has : has;
    }
    case "number": {
      const n = r.field === "hours" ? (t.total_seconds || 0) / 3600 : t.amount || 0;
      const target = parseFloat(r.value);
      if (Number.isNaN(target)) return true;
      return r.op === "lte" ? n <= target : n >= target;
    }
  }
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function applyTaskFilters<T extends FilterableTask>(
  tasks: T[],
  state: TaskFilterState,
  skipRuleId?: number
): T[] {
  const rules = state.rules.filter((r) => r.id !== skipRuleId && isActive(r));
  if (!rules.length) return tasks;
  const today = todayIso();
  return tasks.filter((t) =>
    state.match === "all" ? rules.every((r) => matches(t, r, today)) : rules.some((r) => matches(t, r, today))
  );
}

interface TaskFiltersProps<T extends FilterableTask> {
  value: TaskFilterState;
  onChange: (value: TaskFilterState) => void;
  tasks: T[];
  employees: Named[];
  clients: Named[];
}

const controlClass =
  "px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500";

export default function TaskFilters<T extends FilterableTask>({
  value,
  onChange,
  tasks,
  employees,
  clients,
}: TaskFiltersProps<T>) {
  const updateRule = (id: number, patch: Partial<FilterRule>) =>
    onChange({ ...value, rules: value.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const removeRule = (id: number) => onChange({ ...value, rules: value.rules.filter((r) => r.id !== id) });
  const addRule = () => {
    const used = new Set(value.rules.map((r) => r.field));
    const next = FIELDS.find((f) => !used.has(f.key))?.key ?? "status";
    onChange({ ...value, rules: [...value.rules, newRule(next)] });
  };

  const optionsFor = (field: FieldKey): Option[] => {
    switch (field) {
      case "status":
        return STATUS_OPTIONS;
      case "checking":
        return [
          { value: "none", label: "Not sent for checking" },
          ...Object.entries(CHECK_STAGES).map(([v, s]) => ({ value: v, label: s.label })),
        ];
      case "employee":
        return employees.map((e) => ({ value: String(e.id), label: e.name }));
      case "client":
        return clients.map((c) => ({ value: String(c.id), label: c.name }));
      case "taxYear":
        return [...new Set(tasks.map((t) => t.tax_period).filter((y): y is string => !!y))]
          .sort()
          .reverse()
          .map((y) => ({ value: y, label: y }));
      default:
        return [];
    }
  };

  const isDefault = JSON.stringify(stripIds(value)) === JSON.stringify(stripIds(DEFAULT_TASK_FILTERS));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="font-bold">Filters</span>
        {value.rules.length > 1 && (
          <>
            <span>— show tasks matching</span>
            <select
              value={value.match}
              onChange={(e) => onChange({ ...value, match: e.target.value as "all" | "any" })}
              className={controlClass}
            >
              <option value="all">all of these</option>
              <option value="any">any of these</option>
            </select>
          </>
        )}
      </div>

      {value.rules.length === 0 && <p className="text-sm text-slate-500">No filters — showing every task.</p>}

      {value.rules.map((rule) => {
        const kind = fieldKind(rule.field);
        // Dependent choices: count only tasks that pass the *other* rules,
        // so options that would give no results drop away (all-of mode).
        const base = value.match === "all" ? applyTaskFilters(tasks, value, rule.id) : tasks;
        const counts = new Map<string, number>();
        if (kind === "choice") {
          for (const t of base) {
            const v = choiceValue(t, rule.field);
            counts.set(v, (counts.get(v) || 0) + 1);
          }
        }
        const options =
          kind === "choice"
            ? optionsFor(rule.field).filter((o) => counts.has(o.value) || rule.values.includes(o.value))
            : [];

        return (
          <div key={rule.id} className="flex flex-wrap items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <select
              value={rule.field}
              onChange={(e) => {
                const field = e.target.value as FieldKey;
                updateRule(rule.id, {
                  field,
                  op: OPS[fieldKind(field)][0].value,
                  values: [],
                  value: "",
                  value2: "",
                });
              }}
              className={controlClass}
            >
              {FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={rule.op}
              onChange={(e) => updateRule(rule.id, { op: e.target.value })}
              className={controlClass}
            >
              {OPS[kind].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="flex-1 min-w-[12rem]">
              {kind === "choice" && (
                <div className="flex flex-wrap gap-1.5">
                  {options.length === 0 && (
                    <span className="text-sm text-slate-500 py-2">No matching values with the other filters</span>
                  )}
                  {options.map((o) => {
                    const on = rule.values.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() =>
                          updateRule(rule.id, {
                            values: on ? rule.values.filter((v) => v !== o.value) : [...rule.values, o.value],
                          })
                        }
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                          on
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "bg-white border-slate-300 text-slate-700 hover:border-violet-400"
                        }`}
                      >
                        {o.label}
                        <span className={on ? "text-violet-200" : "text-slate-400"}> {counts.get(o.value) || 0}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {kind === "date" && (rule.op === "before" || rule.op === "after") && (
                <input
                  type="date"
                  value={rule.value}
                  onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                  className={controlClass}
                />
              )}
              {kind === "date" && rule.op === "between" && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                    className={controlClass}
                  />
                  <span className="text-sm text-slate-500">and</span>
                  <input
                    type="date"
                    value={rule.value2}
                    min={rule.value || undefined}
                    onChange={(e) => updateRule(rule.id, { value2: e.target.value })}
                    className={controlClass}
                  />
                </div>
              )}

              {kind === "text" && (
                <input
                  value={rule.value}
                  onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                  placeholder="e.g. GST"
                  className={`${controlClass} w-full`}
                />
              )}

              {kind === "number" && (
                <input
                  type="number"
                  min="0"
                  step={rule.field === "hours" ? "0.5" : "1"}
                  value={rule.value}
                  onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                  className={`${controlClass} w-40`}
                />
              )}
            </div>

            <button
              onClick={() => removeRule(rule.id)}
              title="Remove filter"
              className="px-2 py-1 text-xl leading-none text-slate-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={addRule} className="text-sm font-semibold text-violet-700 hover:text-violet-900">
          + Add filter
        </button>
        {!isDefault && (
          <button
            onClick={() => onChange({ ...DEFAULT_TASK_FILTERS, rules: DEFAULT_TASK_FILTERS.rules.map((r) => ({ ...r, id: nextId++ })) })}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Reset
          </button>
        )}
        {value.rules.length > 0 && (
          <button
            onClick={() => onChange({ ...value, rules: [] })}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

function stripIds(state: TaskFilterState) {
  return { match: state.match, rules: state.rules.map(({ id: _id, ...rest }) => rest) };
}
