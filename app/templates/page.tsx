"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";

interface TemplateSubtask {
  id: number;
  text: string;
  sort_order: number;
}

interface Template {
  id: number;
  name: string;
  category: string;
  keyword?: string;
  subtasks?: TemplateSubtask[];
}

const CATEGORIES = ["GST", "Income Tax", "Companies Act", "Others"];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groupedTemplates, setGroupedTemplates] = useState<Record<string, Template[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [userClassification, setUserClassification] = useState("");
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "GST",
    keyword: "",
  });
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [editingSubtasks, setEditingSubtasks] = useState<Record<number, TemplateSubtask[]>>({});
  const [newSubtaskText, setNewSubtaskText] = useState<Record<number, string>>({});

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const classification = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_classification="))
        ?.split("=")[1];

      if (classification !== "admin") {
        router.push("/dashboard");
        return;
      }

      setUserClassification(classification || "");
      await fetchTemplates();
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);

      // Group by category
      const grouped = data.reduce(
        (acc: Record<string, Template[]>, template: Template) => {
          const category = template.category || "Uncategorized";
          if (!acc[category]) acc[category] = [];
          acc[category].push(template);
          return acc;
        },
        {}
      );
      setGroupedTemplates(grouped);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplateSubtasks = async (templateId: number) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      const data = await response.json();
      setEditingSubtasks((prev) => ({
        ...prev,
        [templateId]: data.subtasks || [],
      }));
      setNewSubtaskText((prev) => ({
        ...prev,
        [templateId]: "",
      }));
    } catch (error) {
      console.error("Error loading template subtasks:", error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      alert("Template name is required");
      return;
    }

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) throw new Error("Failed to create template");
      await fetchTemplates();
      setShowNewTemplateForm(false);
      setNewTemplate({ name: "", category: "GST", keyword: "" });
    } catch (error) {
      alert("Error creating template: " + error);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("Delete this template? This won't affect existing tasks.")) return;

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");
      await fetchTemplates();
    } catch (error) {
      alert("Error deleting template: " + error);
    }
  };

  const handleAddSubtask = async (templateId: number) => {
    const text = newSubtaskText[templateId]?.trim();
    if (!text) {
      alert("Subtask text is required");
      return;
    }

    try {
      const subtasks = editingSubtasks[templateId] || [];
      const maxOrder = subtasks.length > 0
        ? Math.max(...subtasks.map((s) => s.sort_order))
        : 0;

      const response = await fetch(`/api/templates/${templateId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sort_order: maxOrder + 1,
        }),
      });

      if (!response.ok) throw new Error("Failed to add subtask");
      await loadTemplateSubtasks(templateId);
    } catch (error) {
      alert("Error adding subtask: " + error);
    }
  };

  const handleUpdateSubtask = async (templateId: number, subtaskId: number, newText: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });

      if (!response.ok) throw new Error("Failed to update subtask");
      await loadTemplateSubtasks(templateId);
    } catch (error) {
      alert("Error updating subtask: " + error);
    }
  };

  const handleDeleteSubtask = async (templateId: number, subtaskId: number) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/subtasks/${subtaskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete subtask");
      await loadTemplateSubtasks(templateId);
    } catch (error) {
      alert("Error deleting subtask: " + error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      <div className="px-11 py-9">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Templates 📋</h1>
            <p className="text-slate-600">Manage task templates and subtask libraries</p>
          </div>
          <button
            onClick={() => setShowNewTemplateForm(!showNewTemplateForm)}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-violet-600/30 transition"
          >
            + New Template
          </button>
        </div>

        {/* New Template Form */}
        {showNewTemplateForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-500/6 p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Create New Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., GSTR-3B Monthly Return"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Keyword (optional)
                  </label>
                  <input
                    type="text"
                    value={newTemplate.keyword}
                    onChange={(e) => setNewTemplate({ ...newTemplate, keyword: e.target.value })}
                    placeholder="e.g., GSTR3B"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition"
                >
                  Create Template
                </button>
                <button
                  onClick={() => setShowNewTemplateForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates by Category */}
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-slate-900 mb-4">{category}</h2>
              <div className="space-y-3">
                {categoryTemplates.map((template) => (
                  <div key={template.id} className="bg-white rounded-lg shadow-sm border border-violet-500/6">
                    {/* Template Header */}
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                      onClick={() => {
                        if (expandedTemplate === template.id) {
                          setExpandedTemplate(null);
                        } else {
                          setExpandedTemplate(template.id);
                          if (!editingSubtasks[template.id]) {
                            loadTemplateSubtasks(template.id);
                          }
                        }
                      }}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{template.name}</h3>
                        <p className="text-sm text-slate-500">
                          {template.keyword && `${template.keyword} • `}
                          {editingSubtasks[template.id]?.length || 0} subtasks
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {category}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Subtasks Editor */}
                    {expandedTemplate === template.id && (
                      <div className="border-t border-slate-200 p-4 bg-slate-50">
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                          {editingSubtasks[template.id]?.map((subtask, idx) => (
                            <div key={subtask.id} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                              <span className="text-xs font-semibold text-slate-600 w-5 h-5 flex items-center justify-center bg-slate-200 rounded-full">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={subtask.text}
                                onChange={(e) => {
                                  const updated = [...(editingSubtasks[template.id] || [])];
                                  updated[idx] = { ...subtask, text: e.target.value };
                                  setEditingSubtasks({ ...editingSubtasks, [template.id]: updated });
                                }}
                                onBlur={() => handleUpdateSubtask(template.id, subtask.id, subtask.text)}
                                className="flex-1 text-sm px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                              <button
                                onClick={() => handleDeleteSubtask(template.id, subtask.id)}
                                className="text-red-500 hover:text-red-700 font-bold text-lg"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Subtask */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubtaskText[template.id] || ""}
                            onChange={(e) => setNewSubtaskText({ ...newSubtaskText, [template.id]: e.target.value })}
                            onKeyPress={(e) => e.key === "Enter" && handleAddSubtask(template.id)}
                            placeholder="Add a new step..."
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <button
                            onClick={() => handleAddSubtask(template.id)}
                            className="px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
