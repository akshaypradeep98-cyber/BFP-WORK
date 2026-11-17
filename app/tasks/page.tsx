"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavbarRefined from "@/components/NavbarRefined";
import TaskTable from "./components/TaskTable";
import TaskModal from "./components/TaskModal";
import WhatsAppNotificationModal from "@/components/WhatsAppNotificationModal";

interface Employee {
  id: number;
  name: string;
  avatar_color?: string;
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
  const [userClassification, setUserClassification] = useState<string>("");

  // Check authentication and fetch data
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const employeeName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_name="))
        ?.split("=")[1];

      const classification = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_classification="))
        ?.split("=")[1];

      if (!employeeName) {
        router.push("/login");
        return;
      }

      setCurrentUserName(decodeURIComponent(employeeName));
      setUserClassification(classification || "");

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
      // Get current user's employee ID
      const employeeId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_id="))
        ?.split("=")[1];

      const classification = document.cookie
        .split("; ")
        .find((row) => row.startsWith("employee_classification="))
        ?.split("=")[1];

      // For non-admins, filter by employee_id; for admins, show all
      const url =
        classification === "admin"
          ? "/api/tasks"
          : `/api/tasks?employee_id=${employeeId}`;

      const response = await fetch(url);
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
      const response = await fetch("/api/employees/directory");
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
    if (userClassification !== "admin") {
      alert("Only admins can create tasks");
      return;
    }
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-orange-50">
      <NavbarRefined />

      {/* Main Content */}
      <div className="px-11 py-9">
        {/* Page Title and Actions */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Tasks 📋</h1>
            <p className="text-slate-600">Track work across every stage of the pipeline</p>
          </div>
          {userClassification === "admin" && (
            <button
              onClick={handleAddClick}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-violet-600/30 transition"
            >
              + New Task
            </button>
          )}
        </div>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search by task title, client, or employee..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 mb-6"
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-violet-500/6 overflow-hidden">
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
