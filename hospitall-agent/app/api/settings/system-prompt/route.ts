import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_SYSTEM_PROMPT } from "@/mastra/data/default-settings";

export const runtime = "nodejs";

// Cache the system prompt for 60 seconds to reduce DB calls
let cachedPrompt: { value: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * GET /api/settings/system-prompt
 *
 * Public endpoint to fetch the current system prompt.
 * Used by the chat route to get the admin-configured prompt.
 * Falls back to DEFAULT_SYSTEM_PROMPT if not set in database.
 */
export async function GET() {
  try {
    // Check cache first
    if (cachedPrompt && Date.now() - cachedPrompt.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        systemPrompt: cachedPrompt.value,
        cached: true,
      });
    }

    const supabase = createServiceClient();

    // If Supabase is not configured, return default
    if (!supabase) {
      return NextResponse.json({
        success: true,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        source: "default",
      });
    }

    const { data, error } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "systemPrompt")
      .single();

    if (error || !data) {
      // Not found in DB, return default
      cachedPrompt = { value: DEFAULT_SYSTEM_PROMPT, timestamp: Date.now() };
      return NextResponse.json({
        success: true,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        source: "default",
      });
    }

    // Cache and return the value from DB
    const prompt = typeof data.value === "string" ? data.value : DEFAULT_SYSTEM_PROMPT;
    cachedPrompt = { value: prompt, timestamp: Date.now() };

    return NextResponse.json({
      success: true,
      systemPrompt: prompt,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching system prompt:", error);
    // On error, return default
    return NextResponse.json({
      success: true,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      source: "default",
      error: "Failed to fetch from database",
    });
  }
}
