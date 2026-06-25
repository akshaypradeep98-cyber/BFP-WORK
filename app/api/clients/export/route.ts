import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .order("name");

    if (clientsError) {
      return NextResponse.json(
        { error: clientsError.message },
        { status: 500 }
      );
    }

    // Fetch all KMPs
    const { data: kmps, error: kmpsError } = await supabase
      .from("client_kmp")
      .select("*");

    if (kmpsError) {
      return NextResponse.json({ error: kmpsError.message }, { status: 500 });
    }

    // Fetch all employees for name mapping
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name");

    if (employeesError) {
      return NextResponse.json(
        { error: employeesError.message },
        { status: 500 }
      );
    }

    // Create employee map for quick lookup
    const employeeMap = new Map(employees?.map((e: any) => [e.id, e.name]) || []);

    // Create KMP map grouped by client_id
    const kmpMap = new Map<number, any[]>();
    (kmps || []).forEach((kmp: any) => {
      if (!kmpMap.has(kmp.client_id)) {
        kmpMap.set(kmp.client_id, []);
      }
      kmpMap.get(kmp.client_id)!.push(kmp);
    });

    // Format data for Excel
    const excelData = (clients || []).map((client: any) => {
      const clientKmps = kmpMap.get(client.id) || [];
      const kmpString = clientKmps
        .map((kmp: any) => `${kmp.name}|${kmp.designation || ""}|${kmp.mobile || ""}`)
        .join(";");

      return {
        "Client Name": client.name,
        Type: client.type || "",
        Mobile: client.mobile || "",
        Address: client.address || "",
        "Lead Employee": employeeMap.get(client.lead_employee_id) || "",
        KMP: kmpString,
        Documents: "",
      };
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");

    // Set column widths
    ws["!cols"] = [
      { wch: 30 }, // Client Name
      { wch: 15 }, // Type
      { wch: 15 }, // Mobile
      { wch: 35 }, // Address
      { wch: 20 }, // Lead Employee
      { wch: 40 }, // KMP
      { wch: 30 }, // Documents
    ];

    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    // Create filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `clients_${date}.xlsx`;

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting clients:", error);
    return NextResponse.json(
      { error: "Failed to export clients" },
      { status: 500 }
    );
  }
}
