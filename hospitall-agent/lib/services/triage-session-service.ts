import { createServiceClient } from "@/lib/supabase/server";

const SESSION_TTL_MINUTES = 30;

export interface TriageIntakeState {
  text?: string;
  ageYears?: number;
  severity?: number;
  durationHours?: number;
  pregnant?: boolean;
  sexAtBirth?: string;
  awaiting?: "symptoms" | "severity" | "duration" | "age";
  skipSeverity?: boolean;
  skipDuration?: boolean;
  skipAge?: boolean;
  updatedAt: number;
}

/**
 * Get triage session state from database
 * Returns null if session doesn't exist or is expired
 */
export async function getTriageState(
  sessionId: string
): Promise<TriageIntakeState | null> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("triage_sessions")
      .select("state, expires_at")
      .eq("session_id", sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      // Clean up expired session
      await clearTriageState(sessionId);
      return null;
    }

    return data.state as TriageIntakeState;
  } catch (error) {
    console.error("Error getting triage state:", error);
    return null;
  }
}

/**
 * Set or update triage session state
 * Uses upsert to handle both create and update cases
 */
export async function setTriageState(
  sessionId: string,
  state: TriageIntakeState,
  userId?: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MINUTES * 60 * 1000);

    // Update the state with current timestamp
    const stateWithTimestamp: TriageIntakeState = {
      ...state,
      updatedAt: Date.now(),
    };

    const { error } = await supabase.from("triage_sessions").upsert(
      {
        session_id: sessionId,
        user_id: userId || null,
        state: stateWithTimestamp,
        updated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: "session_id",
      }
    );

    if (error) {
      console.error("Error setting triage state:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in setTriageState:", error);
    return false;
  }
}

/**
 * Clear/delete a triage session
 */
export async function clearTriageState(sessionId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("triage_sessions")
      .delete()
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error clearing triage state:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in clearTriageState:", error);
    return false;
  }
}

/**
 * Clean up all expired sessions
 * This should be called by a cron job
 */
export async function cleanupExpiredSessions(): Promise<{
  success: boolean;
  deletedCount: number;
}> {
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // First, count expired sessions
    const { count, error: countError } = await supabase
      .from("triage_sessions")
      .select("*", { count: "exact", head: true })
      .lt("expires_at", now);

    if (countError) {
      console.error("Error counting expired sessions:", countError);
      return { success: false, deletedCount: 0 };
    }

    // Delete expired sessions
    const { error: deleteError } = await supabase
      .from("triage_sessions")
      .delete()
      .lt("expires_at", now);

    if (deleteError) {
      console.error("Error deleting expired sessions:", deleteError);
      return { success: false, deletedCount: 0 };
    }

    return { success: true, deletedCount: count || 0 };
  } catch (error) {
    console.error("Error in cleanupExpiredSessions:", error);
    return { success: false, deletedCount: 0 };
  }
}

/**
 * Get session statistics (for admin dashboard)
 */
export async function getSessionStats(): Promise<{
  activeCount: number;
  expiredCount: number;
} | null> {
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // Count active sessions
    const { count: activeCount, error: activeError } = await supabase
      .from("triage_sessions")
      .select("*", { count: "exact", head: true })
      .gte("expires_at", now);

    if (activeError) {
      console.error("Error counting active sessions:", activeError);
      return null;
    }

    // Count expired sessions
    const { count: expiredCount, error: expiredError } = await supabase
      .from("triage_sessions")
      .select("*", { count: "exact", head: true })
      .lt("expires_at", now);

    if (expiredError) {
      console.error("Error counting expired sessions:", expiredError);
      return null;
    }

    return {
      activeCount: activeCount || 0,
      expiredCount: expiredCount || 0,
    };
  } catch (error) {
    console.error("Error in getSessionStats:", error);
    return null;
  }
}
