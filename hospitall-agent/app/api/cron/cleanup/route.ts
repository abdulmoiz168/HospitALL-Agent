import { NextResponse } from "next/server";
import { cleanupExpiredSessions } from "@/lib/services/triage-session-service";

export const runtime = "nodejs";

// Vercel Cron jobs call this endpoint
// Configured in vercel.json to run every 5 minutes
export async function GET(req: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, require the cron secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Clean up expired triage sessions
    const result = await cleanupExpiredSessions();

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to cleanup sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deletedCount} expired sessions.`,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup job failed" },
      { status: 500 }
    );
  }
}
