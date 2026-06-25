import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET single client with KMPs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const { data: kmps, error: kmpsError } = await supabase
      .from("client_kmp")
      .select("*")
      .eq("client_id", id);

    if (kmpsError) {
      return NextResponse.json({ error: kmpsError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...client,
      kmps: kmps || [],
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, mobile, lead_employee_id, address, kmps } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    // Update client
    const { data: updatedClient, error: updateError } = await supabase
      .from("clients")
      .update({
        name,
        type: type || null,
        mobile: mobile || null,
        lead_employee_id: lead_employee_id || null,
        address: address || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Delete existing KMPs
    const { error: deleteError } = await supabase
      .from("client_kmp")
      .delete()
      .eq("client_id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Insert new KMPs
    if (kmps && kmps.length > 0) {
      const kmpData = kmps.map((kmp: any) => ({
        client_id: id,
        name: kmp.name,
        designation: kmp.designation || null,
        mobile: kmp.mobile || null,
      }));

      const { error: insertError } = await supabase
        .from("client_kmp")
        .insert(kmpData);

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(updatedClient[0]);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
