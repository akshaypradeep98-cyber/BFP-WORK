"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskTable from "./components/TaskTable";
import TaskModal from "./components/TaskModal";
import WhatsAppNotificationModal from "@/components/WhatsAppNotificationModal";

interface Employee {
  id: number;
  name: string;
  avatar_color: string;
}

interface Client {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  color: string;
}

interface Task {
  id: number;
  title: string;
  client_id: number;
  employee_id: number;
  division_id: number;
  due_date: string;
  amount: number;
  status: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({
    employeeName: "",
    taskTitle: "",
    clientName: "",
    dueDate: "",
    assignerName: "",
  });
  const [currentUserName, setCurrentUserName] = useState("");

  // Check authentication and fetch data
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="))
        ?.split("=")[1];

      if (!employeeName) {
        router.push("/login");
        return;
      }

      setCurrentUserName(decodeURIComponent(employeeName));

      await Promise.all([
        fetchTasks(),
        fetchEmployees(),
        fetchClients(),
        fetchDivisions(),
      ]);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await fetch("/api/divisions");
      if (!response.ok) throw new Error("Failed to fetch divisions");
      const data = await response.json();
      setDivisions(data);
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleRowClick = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  const handleSave = async (taskData: any) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save task");
      }

      const createdTask = await response.json();
      await fetchTasks();

      // Get assigned employee name
      const assignedEmployee = employees.find(
        (e) => e.id === createdTask.employee_id
      );
      const clientName = clients.find((c) => c.id === createdTask.client_id)
        ?.name || "Unknown Client";

      if (assignedEmployee) {
        // Show WhatsApp notification
        setWhatsAppData({
          employeeName: assignedEmployee.name,
          taskTitle: createdTask.title,
          clientName: clientName,
          dueDate: createdTask.due_date,
          assignerName: currentUserName,
        });
        setShowWhatsAppModal(true);
      }

      setIsModalOpen(false);
    } catch (error) {
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary-600 dark:bg-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">BFP Work</h1>
              <p className="text-sm text-gray-300 mt-1">Tasks</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-white hover:opacity-80 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Page Title and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">✓ Tasks</h2>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-800 transition font-semibold min-h-[44px] whitespace-nowrap w-full sm:w-auto"
          >
            + Add Task
          </button>
        </div>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search by task title, client, or employee..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 dark:bg-gray-700 dark:text-white text-sm"
        />

        {/* Table */}
        <div className="bg-white dark:bg-gray-700 rounded-md shadow border border-gray-200 dark:border-gray-600 overflow-hidden">
          <TaskTable
            tasks={tasks}
            employees={employees}
            clients={clients}
            divisions={divisions}
            searchQuery={searchQuery}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isModalOpen}
        employees={employees}
        clients={clients}
        divisions={divisions}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* WhatsApp Notification Modal */}
      <WhatsAppNotificationModal
        isOpen={showWhatsAppModal}
        employeeName={whatsAppData.employeeName}
        taskTitle={whatsAppData.taskTitle}
        clientName={whatsAppData.clientName}
        dueDate={whatsAppData.dueDate}
        assignerName={whatsAppData.assignerName}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
}
