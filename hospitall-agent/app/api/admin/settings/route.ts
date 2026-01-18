import { NextResponse } from "next/server";

export const runtime = "nodejs";

// In-memory settings store (in production, use a database)
// This provides a simple key-value store for admin settings
interface AdminSettings {
  // LLM Configuration
  llmEnabled: boolean;
  llmProvider: "openai" | "anthropic" | "azure";
  llmModel: string;
  maxTokens: number;

  // Feature Flags
  triageEnabled: boolean;
  rxCheckEnabled: boolean;
  reportAnalysisEnabled: boolean;
  knowledgeBaseEnabled: boolean;

  // Privacy & Security
  phiGuardEnabled: boolean;
  auditLoggingEnabled: boolean;
  sessionTimeoutMinutes: number;

  // System Configuration
  maxUploadSizeMB: number;
  supportedFileTypes: string[];
  defaultLanguage: string;

  // Notification Settings
  criticalAlertEmail: string | null;
  dailyDigestEnabled: boolean;

  // Metadata
  lastUpdated: string;
  updatedBy: string | null;
}

// Default settings
const DEFAULT_SETTINGS: AdminSettings = {
  llmEnabled: process.env.HOSPITALL_USE_LLM === "1",
  llmProvider: "openai",
  llmModel: "gpt-4",
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

// In-memory store (simulating database)
let currentSettings: AdminSettings = { ...DEFAULT_SETTINGS };

// Validation helpers
const validateSettings = (
  settings: Partial<AdminSettings>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (
    settings.llmProvider !== undefined &&
    !["openai", "anthropic", "azure"].includes(settings.llmProvider)
  ) {
    errors.push("Invalid LLM provider. Must be openai, anthropic, or azure.");
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

// GET - Retrieve current settings
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      settings: currentSettings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to retrieve settings." },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(req: Request) {
  try {
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

    // Apply updates
    currentSettings = {
      ...currentSettings,
      ...safeUpdates,
      lastUpdated: new Date().toISOString(),
      updatedBy: body.updatedBy || "admin",
    };

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      settings: currentSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 }
    );
  }
}

// POST - Reset to default settings
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action !== "reset") {
      return NextResponse.json(
        { error: "Invalid action. Use { action: 'reset' } to reset settings." },
        { status: 400 }
      );
    }

    currentSettings = {
      ...DEFAULT_SETTINGS,
      lastUpdated: new Date().toISOString(),
      updatedBy: body.updatedBy || "admin",
    };

    return NextResponse.json({
      success: true,
      message: "Settings reset to defaults.",
      settings: currentSettings,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    return NextResponse.json(
      { error: "Failed to reset settings." },
      { status: 500 }
    );
  }
}
