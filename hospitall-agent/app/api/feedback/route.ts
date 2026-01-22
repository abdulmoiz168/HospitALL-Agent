import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { logFeedback } from "@/lib/services/logging-service";

export const runtime = "nodejs";

interface FeedbackRequest {
  conversationLogId: string;
  rating: -1 | 1;
  comment?: string;
}

export async function POST(req: Request) {
  try {
    // Get authenticated user (optional for feedback)
    const user = await getUser();

    const body: FeedbackRequest = await req.json();

    // Validate required fields
    if (!body.conversationLogId) {
      return NextResponse.json(
        { error: "conversationLogId is required" },
        { status: 400 }
      );
    }

    if (body.rating !== -1 && body.rating !== 1) {
      return NextResponse.json(
        { error: "rating must be -1 (negative) or 1 (positive)" },
        { status: 400 }
      );
    }

    // Validate comment length if provided
    if (body.comment && body.comment.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be 1000 characters or less" },
        { status: 400 }
      );
    }

    const success = await logFeedback({
      userId: user?.id,
      conversationLogId: body.conversationLogId,
      rating: body.rating,
      comment: body.comment,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
