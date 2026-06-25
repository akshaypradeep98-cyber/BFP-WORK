import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/auth";
import { getRandomAvatarColor } from "@/lib/utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET all employees
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      username,
      password,
      mobile,
      classification,
      specialisation,
      date_of_birth,
      weekly_capacity,
    } = body;

    // Validate required fields
    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: "Name, email, username, and password are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from("employees")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate random avatar color
    const avatarColor = getRandomAvatarColor();

    // Insert new employee
    const { data, error } = await supabase
      .from("employees")
      .insert([
        {
          name,
          email,
          username,
          password_hash: hashedPassword,
          mobile: mobile || null,
          classification: classification || null,
          specialisation: specialisation || null,
          date_of_birth: date_of_birth || null,
          weekly_capacity: weekly_capacity || 40,
          on_leave: false,
          avatar_color: avatarColor,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
