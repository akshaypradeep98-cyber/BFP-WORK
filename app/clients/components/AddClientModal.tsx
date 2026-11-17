"use client";

import { useState } from "react";

interface AddClientModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CLIENT_TYPES = ["Individual", "Partnership", "Company", "LLP", "Trust", "HUF"];

export default function AddClientModal({ onClose, onCreated }: AddClientModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [kmpName, setKmpName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Client name is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: type || null,
          mobile: mobile.trim() || null,
          address: address.trim() || null,
          kmps: kmpName.trim() ? [{ name: kmpName.trim() }] : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Failed to create client");
        setIsSaving(false);
        return;
      }

      onCreated();
      onClose();
    } catch (err) {
      setError("Failed to create client");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Add Client</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSaving}
            >
              <option value="">Select type...</option>
              {CLIENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">KMP Name</label>
            <input
              type="text"
              value={kmpName}
              onChange={(e) => setKmpName(e.target.value)}
              placeholder="Key managerial person's name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isSaving}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-violet-600/30 transition disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
