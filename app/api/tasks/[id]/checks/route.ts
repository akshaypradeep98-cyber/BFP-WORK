import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";

// GET all checks (with checker names + notes) for a task, so the article
// who did the work and the senior/manager reviewing it can both see what
// each checker wrote.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRequestClient();
    const { id } = await params;

    const { data: checks, error } = await supabase
      .from("task_checks")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Checker names: the caller may be an article who isn't the checker
    // and isn't admin/manager, so RLS on employees would otherwise hide
    // these rows. Name-only lookup via the admin client, same pattern as
    // /api/checks/level1/[id].
    const admin = createAdminClient();
    const checkerIds = [...new Set((checks || []).map((c) => c.checker_id))];
    const { data: checkers } = checkerIds.length
      ? await admin.from("employees").select("id, name").in("id", checkerIds)
      : { data: [] };

    const withCheckerNames = (checks || []).map((c) => ({
      ...c,
      checker_name: checkers?.find((e) => e.id === c.checker_id)?.name || "Unknown",
    }));

    return NextResponse.json(withCheckerNames);
  } catch (error) {
    console.error("Error fetching task checks:", error);
    return NextResponse.json(
      { error: "Failed to fetch task checks" },
      { status: 500 }
    );
  }
}
