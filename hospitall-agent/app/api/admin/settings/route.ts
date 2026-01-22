import { NextResponse } from "next/server";
import { requireAdmin, getUserProfile } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Settings interface
interface AdminSettings {
  llmEnabled: boolean;
  llmProvider: "openai" | "anthropic" | "azure" | "google";
  llmModel: string;
  maxTokens: number;
  triageEnabled: boolean;
  rxCheckEnabled: boolean;
  reportAnalysisEnabled: boolean;
  knowledgeBaseEnabled: boolean;
  phiGuardEnabled: boolean;
  auditLoggingEnabled: boolean;
  sessionTimeoutMinutes: number;
  maxUploadSizeMB: number;
  supportedFileTypes: string[];
  defaultLanguage: string;
  criticalAlertEmail: string | null;
  dailyDigestEnabled: boolean;
  lastUpdated: string;
  updatedBy: string | null;
}

// Default settings
const DEFAULT_SETTINGS: AdminSettings = {
  llmEnabled: process.env.HOSPITALL_USE_LLM === "1",
  llmProvider: "google",
  llmModel: process.env.HOSPITALL_LLM_MODEL || "google/gemini-3-flash-preview",
  maxTokens: 4096,
  triageEnabled: true,
  rxCheckEnabled: true,
  reportAnalysisEnabled: true,
  knowledgeBaseEnabled: true,
  phiGuardEnabled: true,
  auditLoggingEnabled: true,
  sessionTimeoutMinutes: 30,
  maxUploadSizeMB: 10,
  supportedFileTypes: ["pdf", "docx", "txt", "md", "png", "jpg", "jpeg"],
  defaultLanguage: "en",
  criticalAlertEmail: null,
  dailyDigestEnabled: false,
  lastUpdated: new Date().toISOString(),
  updatedBy: null,
};

// Validation helpers
const validateSettings = (
  settings: Partial<AdminSettings>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (
    settings.llmProvider !== undefined &&
    !["openai", "anthropic", "azure", "google"].includes(settings.llmProvider)
  ) {
    errors.push("Invalid LLM provider. Must be openai, anthropic, azure, or google.");
  }

  if (
    settings.maxTokens !== undefined &&
    (settings.maxTokens < 100 || settings.maxTokens > 100000)
  ) {
    errors.push("maxTokens must be between 100 and 100000.");
  }

  if (
    settings.sessionTimeoutMinutes !== undefined &&
    (settings.sessionTimeoutMinutes < 5 || settings.sessionTimeoutMinutes > 480)
  ) {
    errors.push("sessionTimeoutMinutes must be between 5 and 480.");
  }

  if (
    settings.maxUploadSizeMB !== undefined &&
    (settings.maxUploadSizeMB < 1 || settings.maxUploadSizeMB > 100)
  ) {
    errors.push("maxUploadSizeMB must be between 1 and 100.");
  }

  if (
    settings.criticalAlertEmail !== undefined &&
    settings.criticalAlertEmail !== null
  ) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.criticalAlertEmail)) {
      errors.push("Invalid email format for criticalAlertEmail.");
    }
  }

  return { valid: errors.length === 0, errors };
};

// Helper to get settings from database
async function getSettingsFromDb(): Promise<AdminSettings> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("admin_settings")
      .select("key, value")
      .order("key");

    if (error) {
      console.error("Error fetching settings:", error);
      return DEFAULT_SETTINGS;
    }

    if (!data || data.length === 0) {
      return DEFAULT_SETTINGS;
    }

    // Reconstruct settings from key-value pairs
    const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of data) {
      settings[row.key] = row.value;
    }

    return settings as unknown as AdminSettings;
  } catch (error) {
    console.error("Error in getSettingsFromDb:", error);
    return DEFAULT_SETTINGS;
  }
}

// Helper to save settings to database
async function saveSettingsToDb(
  settings: Partial<AdminSettings>,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    // Upsert each setting as a key-value pair
    for (const [key, value] of Object.entries(settings)) {
      if (key === "lastUpdated" || key === "updatedBy") continue;

      const { error } = await supabase.from("admin_settings").upsert(
        {
          key,
          value,
          updated_by: userId,
        },
        { onConflict: "key" }
      );

      if (error) {
        console.error(`Error saving setting ${key}:`, error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error in saveSettingsToDb:", error);
    return false;
  }
}

// GET - Retrieve current settings (admin only)
export async function GET() {
  try {
    // Require admin access
    await requireAdmin();

    const settings = await getSettingsFromDb();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message === "Admin access required") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to retrieve settings." },
      { status: 500 }
    );
  }
}

// PUT - Update settings (admin only)
export async function PUT(req: Request) {
  try {
    // Require admin access
    const { user } = await requireAdmin();

    const body = await req.json();
    const updates = body.settings as Partial<AdminSettings>;

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Invalid request body. Expected { settings: {...} }" },
        { status: 400 }
      );
    }

    // Validate the updates
    const validation = validateSettings(updates);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", errors: validation.errors },
        { status: 400 }
      );
    }

    // Prevent updating metadata fields directly
    const { lastUpdated, updatedBy, ...safeUpdates } = updates as AdminSettings;

    // Save to database
    const success = await saveSettingsToDb(safeUpdates, user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    // Fetch updated settings
    const currentSettings = await getSettingsFromDb();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      settings: {
        ...currentSettings,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email || user.id,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message === "Admin access required") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 }
    );
  }
}

// POST - Reset to default settings (admin only)
export async function POST(req: Request) {
  try {
    // Require admin access
    const { user } = await requireAdmin();

    const body = await req.json();

    if (body.action !== "reset") {
      return NextResponse.json(
        { error: "Invalid action. Use { action: 'reset' } to reset settings." },
        { status: 400 }
      );
    }

    // Save default settings to database
    const success = await saveSettingsToDb(DEFAULT_SETTINGS, user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to reset settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Settings reset to defaults.",
      settings: {
        ...DEFAULT_SETTINGS,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email || user.id,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message === "Admin access required") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("Error resetting settings:", error);
    return NextResponse.json(
      { error: "Failed to reset settings." },
      { status: 500 }
    );
  }
}
