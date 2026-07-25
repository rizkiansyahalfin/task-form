import { NextRequest } from "next/server";
import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireMentorAuth } from "@/server/auth";
import { submissionService } from "@/services/submission.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`submissions-feedback-update:${user.id}`);

    const body = await request.json();
    const { feedbacks } = body as { feedbacks: Record<string, string> };

    if (!feedbacks || typeof feedbacks !== "object") {
      throw new Error("feedbacks object is required");
    }

    const updatedSubmission = await submissionService.updateAnswerFeedback(id, user.id, feedbacks);
    return successResponse(updatedSubmission, "Feedback updated successfully");
  });
}
