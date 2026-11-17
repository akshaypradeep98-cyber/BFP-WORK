import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Blank starter workbook with the exact headers /api/clients/import
// expects, plus one filled-in example row so the format is unambiguous.
export async function GET() {
  const exampleRow = {
    "Client Name": "Acme Textiles Pvt Ltd",
    Type: "Company",
    Mobile: "9876543210",
    Address: "12 MG Road, Bengaluru",
    KMP: "Ramesh Kumar|Director|9123456780;Suresh Rao|CFO|9123456781",
  };

  const ws = XLSX.utils.json_to_sheet([exampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");

  ws["!cols"] = [
    { wch: 30 }, // Client Name
    { wch: 15 }, // Type
    { wch: 15 }, // Mobile
    { wch: 35 }, // Address
    { wch: 40 }, // KMP
  ];

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="clients_import_template.xlsx"`,
    },
  });
}
