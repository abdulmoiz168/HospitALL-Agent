import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createServiceClientRequired } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Analytics data interfaces
interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostCents: number;
  avgLatencyMs: number;
  uniqueUsers: number;
  llmRequests: number;
}

interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  costCents: number;
}

interface IntentBreakdown {
  intent: string;
  count: number;
}

interface RecentConversation {
  id: string;
  sessionId: string;
  intent: string | null;
  sanitizedMessage: string;
  responseSummary: string | null;
  createdAt: string;
}

interface RecentError {
  id: string;
  endpoint: string;
  errorType: string;
  errorMessage: string;
  createdAt: string;
}

interface AnalyticsData {
  summary: UsageSummary;
  dailyUsage: DailyUsage[];
  intentBreakdown: IntentBreakdown[];
  recentConversations: RecentConversation[];
  recentErrors: RecentError[];
  feedbackStats: {
    positive: number;
    negative: number;
  };
}

// GET - Retrieve analytics data (admin only)
export async function GET(req: Request) {
  try {
    // Require admin access
    await requireAdmin();

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "7", 10);

    const supabase = createServiceClientRequired();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Fetch usage metrics summary
    const { data: usageData, error: usageError } = await supabase
      .from("usage_metrics")
      .select("*")
      .gte("created_at", startDateStr);

    if (usageError) {
      console.error("Error fetching usage metrics:", usageError);
    }

    // Calculate summary
    const summary: UsageSummary = {
      totalRequests: usageData?.length || 0,
      totalTokens: usageData?.reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0,
      totalInputTokens: usageData?.reduce((sum, u) => sum + (u.input_tokens || 0), 0) || 0,
      totalOutputTokens: usageData?.reduce((sum, u) => sum + (u.output_tokens || 0), 0) || 0,
      estimatedCostCents: usageData?.reduce((sum, u) => sum + parseFloat(u.estimated_cost_cents || "0"), 0) || 0,
      avgLatencyMs: usageData?.length
        ? Math.round(usageData.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / usageData.length)
        : 0,
      uniqueUsers: new Set(usageData?.map((u) => u.user_id).filter(Boolean)).size,
      llmRequests: usageData?.filter((u) => u.external_llm_used).length || 0,
    };

    // Calculate daily usage
    const dailyMap = new Map<string, DailyUsage>();
    usageData?.forEach((u) => {
      const date = new Date(u.created_at).toISOString().split("T")[0];
      const existing = dailyMap.get(date) || { date, requests: 0, tokens: 0, costCents: 0 };
      existing.requests += 1;
      existing.tokens += u.total_tokens || 0;
      existing.costCents += parseFloat(u.estimated_cost_cents || "0");
      dailyMap.set(date, existing);
    });
    const dailyUsage = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Fetch intent breakdown from conversation logs
    const { data: convData } = await supabase
      .from("conversation_logs")
      .select("intent")
      .gte("created_at", startDateStr);

    const intentMap = new Map<string, number>();
    convData?.forEach((c) => {
      const intent = c.intent || "unknown";
      intentMap.set(intent, (intentMap.get(intent) || 0) + 1);
    });
    const intentBreakdown = Array.from(intentMap.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count);

    // Fetch recent conversations
    const { data: recentConvData } = await supabase
      .from("conversation_logs")
      .select("id, session_id, intent, sanitized_message, response_summary, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    const recentConversations: RecentConversation[] = (recentConvData || []).map((c) => ({
      id: c.id,
      sessionId: c.session_id,
      intent: c.intent,
      sanitizedMessage: c.sanitized_message,
      responseSummary: c.response_summary,
      createdAt: c.created_at,
    }));

    // Fetch recent errors
    const { data: errorData } = await supabase
      .from("error_logs")
      .select("id, endpoint, error_type, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const recentErrors: RecentError[] = (errorData || []).map((e) => ({
      id: e.id,
      endpoint: e.endpoint,
      errorType: e.error_type,
      errorMessage: e.error_message,
      createdAt: e.created_at,
    }));

    // Fetch feedback stats
    const { data: feedbackData } = await supabase
      .from("feedback")
      .select("rating")
      .gte("created_at", startDateStr);

    const feedbackStats = {
      positive: feedbackData?.filter((f) => f.rating === 1).length || 0,
      negative: feedbackData?.filter((f) => f.rating === -1).length || 0,
    };

    const analytics: AnalyticsData = {
      summary,
      dailyUsage,
      intentBreakdown,
      recentConversations,
      recentErrors,
      feedbackStats,
    };

    return NextResponse.json({
      success: true,
      analytics,
      periodDays: days,
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
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to retrieve analytics." },
      { status: 500 }
    );
  }
}
