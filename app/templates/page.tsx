"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TemplateSubtask {
  id: number;
  template_id: number;
  title: string;
  notes: string | null;
  sort_order: number;
}

interface Template {
  id: number;
  name: string;
  category: string;
  keyword: string | null;
  subtask_count: number;
  subtasks?: TemplateSubtask[];
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    keyword: "",
  });
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    notes: "",
  });

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const classification = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_classification="))
        ?.split("=")[1];

      if (classification !== "admin") {
        router.push("/dashboard");
        return;
      }

      await fetchTemplates();
    };

    checkAuth();
  }, [router]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplateSubtasks = async (templateId: number) => {
    try {
      const response = await fetch(
        `/api/templates/${templateId}/subtasks`
      );
      if (!response.ok) throw new Error("Failed to fetch subtasks");
      const subtasks = await response.json();
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplate({ ...template, subtasks });
      }
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (selectedTemplate) {
        // Update
        const response = await fetch(
          `/api/templates/${selectedTemplate.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) throw new Error("Failed to update template");
        await fetchTemplates();
      } else {
        // Create
        const response = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Failed to create template");
        await fetchTemplates();
      }

      setShowModal(false);
      setFormData({ name: "", category: "", keyword: "" });
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template");
    }
  };

  const handleAddSubtask = async () => {
    if (!selectedTemplate || !newSubtask.title.trim()) return;

    try {
      const response = await fetch(
        `/api/templates/${selectedTemplate.id}/subtasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSubtask),
        }
      );

      if (!response.ok) throw new Error("Failed to add subtask");
      await fetchTemplateSubtasks(selectedTemplate.id);
      setNewSubtask({ title: "", notes: "" });
      setShowSubtaskModal(false);
    } catch (error) {
      console.error("Error adding subtask:", error);
      alert("Error adding subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!selectedTemplate) return;
    if (!confirm("Delete this subtask?")) return;

    try {
      const response = await fetch(
        `/api/templates/${selectedTemplate.id}/subtasks/${subtaskId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete subtask");
      await fetchTemplateSubtasks(selectedTemplate.id);
    } catch (error) {
      console.error("Error deleting subtask:", error);
      alert("Error deleting subtask");
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("Delete this template? Tasks created from it will not be affected."))
      return;

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");
      await fetchTemplates();
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Error deleting template");
    }
  };

  const openCreateTemplate = () => {
    setSelectedTemplate(null);
    setFormData({ name: "", category: "", keyword: "" });
    setShowModal(true);
  };

  const openEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      keyword: template.keyword || "",
    });
    setShowModal(true);
    fetchTemplateSubtasks(template.id);
  };

  const groupedTemplates = templates.reduce(
    (acc: Record<string, Template[]>, template) => {
      const category = template.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    },
    {}
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-firm-cream flex items-center justify-center">
        <div className="text-firm-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-firm-cream dark:bg-gray-900">
      {/* Header */}
      <div className="bg-firm-900 dark:bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Task Templates</h1>
              <p className="text-sm text-gray-300 mt-1">Manage task templates and subtasks</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-white hover:text-gray-300 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-firm-text dark:text-white">
            Templates
          </h2>
          <button
            onClick={openCreateTemplate}
            className="btn-primary px-4 py-2"
          >
            + New Template
          </button>
        </div>

        {/* Templates by Category */}
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-firm-900 dark:text-white mb-4 border-b border-firm-border dark:border-gray-700 pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="card p-4 cursor-pointer hover:shadow-lg transition"
                    onClick={() => openEditTemplate(template)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-firm-text dark:text-white">
                          {template.name}
                        </h4>
                        {template.keyword && (
                          <p className="text-xs text-firm-muted dark:text-gray-400 mt-1">
                            Keyword: {template.keyword}
                          </p>
                        )}
                        <p className="text-sm text-firm-muted dark:text-gray-400 mt-2">
                          {template.subtask_count} subtask{template.subtask_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-firm-muted dark:text-gray-400">No templates yet</p>
            <button
              onClick={openCreateTemplate}
              className="btn-primary mt-4 px-4 py-2"
            >
              Create your first template
            </button>
          </div>
        )}
      </div>

      {/* Template Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-firm-900 dark:bg-gray-700 text-white p-6 sticky top-0">
              <h2 className="text-2xl font-bold">
                {selectedTemplate ? "Edit Template" : "Create Template"}
              </h2>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-firm-text dark:text-gray-200 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ROC Annual Filing"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-firm-text dark:text-gray-200 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., ROC Filing, ITR Filing"
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-firm-text dark:text-gray-200 mb-1">
                  Keyword (optional)
                </label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="e.g., AOC-4"
                  className="input-base w-full"
                />
              </div>

              {selectedTemplate && selectedTemplate.subtasks && (
                <div className="mt-6 pt-6 border-t border-firm-border dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-firm-text dark:text-white">
                      Subtasks ({selectedTemplate.subtasks.length})
                    </h3>
                    <button
                      onClick={() => setShowSubtaskModal(true)}
                      className="btn-accent text-sm px-3 py-1"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedTemplate.subtasks.map((subtask, idx) => (
                      <div
                        key={subtask.id}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-firm-text dark:text-white text-sm">
                            {idx + 1}. {subtask.title}
                          </p>
                          {subtask.notes && (
                            <p className="text-xs text-firm-muted dark:text-gray-400">
                              {subtask.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium ml-2"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 dark:bg-gray-700 p-6 flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="btn-primary px-4 py-2"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subtask Modal */}
      {showSubtaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-firm-900 dark:bg-gray-700 text-white p-6">
              <h3 className="text-lg font-bold">Add Subtask</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-firm-text dark:text-gray-200 mb-1">
                  Subtask Title *
                </label>
                <input
                  type="text"
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  placeholder="e.g., Prepare documents"
                  className="input-base w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-firm-text dark:text-gray-200 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={newSubtask.notes}
                  onChange={(e) => setNewSubtask({ ...newSubtask, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="input-base w-full resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="border-t bg-gray-50 dark:bg-gray-700 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubtaskModal(false)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubtask}
                className="btn-primary px-4 py-2 text-sm"
              >
                Add Subtask
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
