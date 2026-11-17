"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavbarRefined from "@/components/NavbarRefined";
import AddClientModal from "./components/AddClientModal";
import { getCurrentUserFromCookies } from "@/lib/auth";

interface Client {
  id: number;
  name: string;
  type?: string;
  retainer?: number;
  status?: string;
  kmp_names?: string[];
}

export default function ClientsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [canManageClients, setCanManageClients] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const empId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_id="))
        ?.split("=")[1];

      if (!empId) {
        router.push("/login");
        return;
      }

      const user = getCurrentUserFromCookies();
      setCanManageClients(
        user?.classification === "admin" || user?.classification === "manager"
      );

      await fetchClients();
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete client");

      setClients(clients.filter((c) => c.id !== clientId));
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client");
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
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Clients 💼</h1>
            <p className="text-slate-600">Accounts you manage and their engagement status</p>
          </div>
          {canManageClients && (
            <div className="flex items-center gap-3">
              <Link
                href="/clients/export"
                className="px-5 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Export
              </Link>
              <Link
                href="/clients/import"
                className="px-5 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Import
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-violet-600/30 transition"
              >
                + Add Client
              </button>
            </div>
          )}
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-violet-500/6">
            <p className="text-slate-600 mb-4">No clients yet</p>
            {canManageClients && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-violet-600/30 transition"
              >
                + Add Your First Client
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-500/6 overflow-hidden">
            <div className="grid grid-cols-6 gap-6 px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-100">
              <div>Client</div>
              <div>KMP</div>
              <div>Retainer</div>
              <div>Status</div>
              <div></div>
              <div></div>
            </div>

            <div className="divide-y divide-slate-100">
              {clients.map((client, idx) => (
                <div
                  key={client.id}
                  className={`grid grid-cols-6 gap-6 px-6 py-4 items-center hover:bg-slate-50 transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-600 font-semibold">{client.type || "N/A"}</div>
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-slate-700">
                    {client.kmp_names && client.kmp_names.length > 0
                      ? client.kmp_names.join(", ")
                      : "—"}
                  </div>
                  <div className="font-semibold text-sm text-slate-700">
                    {client.retainer ? `₹${client.retainer}` : "—"}
                  </div>
                  <div>
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      • {client.status || "Active"}
                    </span>
                  </div>
                  <div></div>
                  <div>
                    {canManageClients && (
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onCreated={fetchClients}
        />
      )}
    </div>
  );
}
