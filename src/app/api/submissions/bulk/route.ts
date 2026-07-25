import { NextRequest } from "next/server";
import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireMentorAuth } from "@/server/auth";
import { submissionService } from "@/services/submission.service";
import { SubmissionStatus } from "@prisma/client";

export async function PATCH(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    enforceRateLimit(`submissions-bulk-update:${user.id}`);

    const body = await request.json();
    const { submissionIds, status } = body as { submissionIds: string[]; status: SubmissionStatus };

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      throw new Error("submissionIds must be a non-empty array");
    }

    if (!status) {
      throw new Error("status is required");
    }

    const result = await submissionService.bulkUpdateStatus(submissionIds, user.id, status);
    return successResponse(result, `Updated ${result.count} submission(s)`);
  });
}

export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    enforceRateLimit(`submissions-bulk-delete:${user.id}`);

    const body = await request.json();
    const { submissionIds } = body as { submissionIds: string[] };

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      throw new Error("submissionIds must be a non-empty array");
    }

    const result = await submissionService.bulkDeleteSubmissions(submissionIds, user.id);
    return successResponse(result, `Deleted ${result.count} submission(s)`);
  });
}
