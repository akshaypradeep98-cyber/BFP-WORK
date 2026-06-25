"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientTable from "./components/ClientTable";
import ClientModal from "./components/ClientModal";

interface Employee {
  id: number;
  name: string;
  avatar_color: string;
}

interface Client {
  id: number;
  name: string;
  type: string;
  mobile: string;
  lead_employee_id: number;
  employees?: Employee;
  address: string;
  kmps?: any[];
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and fetch data
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="));

      if (!employeeName) {
        router.push("/login");
        return;
      }

      await Promise.all([fetchClients(), fetchEmployees()]);
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

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleAddClick = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleRowClick = async (client: Client) => {
    try {
      const response = await fetch(`/api/clients/${client.id}`);
      if (!response.ok) throw new Error("Failed to fetch client");
      const data = await response.json();
      setSelectedClient(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching client:", error);
    }
  };

  const handleSave = async (clientData: any) => {
    try {
      const url = selectedClient ? `/api/clients/${selectedClient.id}` : "/api/clients";
      const method = selectedClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save client");
      }

      await fetchClients();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete client");
      }

      await fetchClients();
    } catch (error) {
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1C3350] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">BFP Work</h1>
              <p className="text-sm text-gray-300 mt-1">Client Master</p>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title and Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Client Master</h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/clients/export")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                📥 Export to Excel
              </button>
              <button
                onClick={() => router.push("/clients/import")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                📤 Import from Excel
              </button>
              <button
                onClick={handleAddClick}
                className="px-4 py-2 bg-[#1C3350] text-white rounded-lg hover:bg-[#152747] transition font-semibold"
              >
                + Add Client
              </button>
            </div>
          </div>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search by client name, type, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3350] focus:border-transparent"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <ClientTable
            clients={clients}
            employees={employees}
            searchQuery={searchQuery}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Modal */}
      <ClientModal
        isOpen={isModalOpen}
        client={selectedClient}
        employees={employees}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
