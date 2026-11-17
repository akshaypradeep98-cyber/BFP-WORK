import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/server";

// GET all clients
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const clientIds = (data || []).map((c: any) => c.id);
    const kmpByClient = new Map<number, string[]>();
    if (clientIds.length > 0) {
      const { data: kmps } = await supabase
        .from("client_kmp")
        .select("client_id, name")
        .in("client_id", clientIds);

      (kmps || []).forEach((kmp: any) => {
        if (!kmpByClient.has(kmp.client_id)) kmpByClient.set(kmp.client_id, []);
        kmpByClient.get(kmp.client_id)!.push(kmp.name);
      });
    }

    const enriched = (data || []).map((c: any) => ({
      ...c,
      kmp_names: kmpByClient.get(c.id) || [],
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST create new client
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRequestClient();
    const body = await request.json();
    const { name, type, mobile, address, kmps } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    // Insert new client
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert([
        {
          name,
          type: type || null,
          mobile: mobile || null,
          address: address || null,
        },
      ])
      .select();

    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 500 });
    }

    const clientId = clientData[0].id;

    // Insert KMPs if provided
    if (kmps && kmps.length > 0) {
      const kmpData = kmps.map((kmp: any) => ({
        client_id: clientId,
        name: kmp.name,
        designation: kmp.designation || null,
        mobile: kmp.mobile || null,
      }));

      const { error: kmpError } = await supabase
        .from("client_kmp")
        .insert(kmpData);

      if (kmpError) {
        return NextResponse.json({ error: kmpError.message }, { status: 500 });
      }
    }

    return NextResponse.json(clientData[0], { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
