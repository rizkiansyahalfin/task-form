import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { updateSubmissionStatusSchema } from "@/schemas";
import { requireMentorAuth } from "@/server/auth";
import { submissionService } from "@/services/submission.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`submissions-get:${user.id}`);

    const submission = await submissionService.getSubmission(id, user.id);
    return successResponse(submission, "Submission retrieved");
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`submissions-update:${user.id}`);

    const body = await request.json();
    const { status } = updateSubmissionStatusSchema.parse(body);

    const submission = await submissionService.updateStatus(id, user.id, status);
    return successResponse(submission, "Submission status updated");
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`submissions-delete:${user.id}`);

    await submissionService.deleteSubmission(id, user.id);
    return successResponse(null, "Submission deleted");
  });
}
