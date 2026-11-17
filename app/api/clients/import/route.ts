import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";


export async function POST(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const duplicateHandling = formData.get("duplicateHandling") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!duplicateHandling) {
      return NextResponse.json(
        { error: "Duplicate handling rule required" },
        { status: 400 }
      );
    }

    // Read file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    // Fetch existing clients
    const { data: existingClients } = await supabase
      .from("clients")
      .select("id, name");

    const existingClientMap = new Map(
      (existingClients || []).map((c: any) => [c.name?.toLowerCase(), c])
    );

    const results = {
      newAdded: 0,
      updated: 0,
      skipped: 0,
      totalProcessed: 0,
      errors: [] as any[],
    };

    const startTime = Date.now();

    // Process each row
    for (const row of data) {
      results.totalProcessed++;

      const clientName = row["Client Name"]?.toString().trim();
      if (!clientName) {
        results.errors.push({
          row: results.totalProcessed,
          issue: "Missing client name",
        });
        continue;
      }

      const type = row["Type"]?.toString().trim() || null;
      const mobile = row["Mobile"]?.toString().trim() || null;
      const address = row["Address"]?.toString().trim() || null;
      const kmpString = row["KMP"]?.toString().trim() || "";

      // Check for duplicates
      const existingClient = existingClientMap.get(clientName.toLowerCase());

      if (existingClient) {
        if (duplicateHandling === "skip") {
          results.skipped++;
          continue;
        } else if (duplicateHandling === "update") {
          // Update existing client
          const { error: updateError } = await supabase
            .from("clients")
            .update({
              type,
              mobile,
              address,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingClient.id);

          if (updateError) {
            results.errors.push({
              row: results.totalProcessed,
              client: clientName,
              issue: updateError.message,
            });
            continue;
          }

          // Update KMPs
          await supabase
            .from("client_kmp")
            .delete()
            .eq("client_id", existingClient.id);

          if (kmpString) {
            const kmps = parseKmps(kmpString, existingClient.id);
            if (kmps.length > 0) {
              const { error: kmpError } = await supabase
                .from("client_kmp")
                .insert(kmps);

              if (kmpError) {
                results.errors.push({
                  row: results.totalProcessed,
                  client: clientName,
                  issue: `KMP error: ${kmpError.message}`,
                });
              }
            }
          }

          results.updated++;
        }
      } else {
        // Create new client
        const { data: newClient, error: createError } = await supabase
          .from("clients")
          .insert([
            {
              name: clientName,
              type,
              mobile,
              address,
            },
          ])
          .select();

        if (createError) {
          results.errors.push({
            row: results.totalProcessed,
            client: clientName,
            issue: createError.message,
          });
          continue;
        }

        const clientId = newClient[0].id;

        // Insert KMPs
        if (kmpString) {
          const kmps = parseKmps(kmpString, clientId);
          if (kmps.length > 0) {
            const { error: kmpError } = await supabase
              .from("client_kmp")
              .insert(kmps);

            if (kmpError) {
              results.errors.push({
                row: results.totalProcessed,
                client: clientName,
                issue: `KMP error: ${kmpError.message}`,
              });
            }
          }
        }

        results.newAdded++;
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      results,
      duration: `${duration}s`,
    });
  } catch (error) {
    console.error("Error importing clients:", error);
    return NextResponse.json(
      { error: "Failed to import clients" },
      { status: 500 }
    );
  }
}

function parseKmps(kmpString: string, clientId: number) {
  const kmps = [];
  const kmpParts = kmpString.split(";");

  for (const part of kmpParts) {
    if (!part.trim()) continue;
    const [name, designation, mobile] = part.split("|");
    if (name?.trim()) {
      kmps.push({
        client_id: clientId,
        name: name.trim(),
        designation: designation?.trim() || null,
        mobile: mobile?.trim() || null,
      });
    }
  }

  return kmps;
}
