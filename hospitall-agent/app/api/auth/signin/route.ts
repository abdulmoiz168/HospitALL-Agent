import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Signin error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Fetch user profile to get role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", data.user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || "patient",
        name: profile?.name,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
