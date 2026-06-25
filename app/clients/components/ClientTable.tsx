"use client";

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
}

interface ClientTableProps {
  clients: Client[];
  employees: Employee[];
  searchQuery: string;
  onRowClick: (client: Client) => void;
}

export default function ClientTable({
  clients,
  employees,
  searchQuery,
  onRowClick,
}: ClientTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      (client.type && client.type.toLowerCase().includes(query)) ||
      (client.mobile && client.mobile.includes(query))
    );
  });

  if (filteredClients.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {searchQuery ? "No clients found matching your search" : "No clients"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Client
            </th>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Type
            </th>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Mobile
            </th>
            <th className="text-left px-6 py-3 font-semibold text-gray-900 text-sm">
              Lead
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map((client) => (
            <tr
              key={client.id}
              onClick={() => onRowClick(client)}
              className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
            >
              <td className="px-6 py-4">
                <span className="font-semibold text-gray-900">
                  {client.name}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-600">{client.type}</td>
              <td className="px-6 py-4 text-gray-600">{client.mobile}</td>
              <td className="px-6 py-4">
                {(() => {
                  const leadEmp = employees.find(
                    (e) => e.id === client.lead_employee_id
                  );
                  return leadEmp ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: leadEmp.avatar_color }}
                      >
                        {getInitials(leadEmp.name)}
                      </div>
                      <span className="text-gray-900">{leadEmp.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  );
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
