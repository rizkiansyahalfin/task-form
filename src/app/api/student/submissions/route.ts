import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/server/auth";
import { submissionService } from "@/services/submission.service";

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    enforceRateLimit(`student-submission-get:${user.id}`);

    const searchParams = request.nextUrl.searchParams;
    const formId = searchParams.get("formId") ?? undefined;
    const slug = searchParams.get("slug") ?? undefined;

    const submission = await submissionService.getStudentSubmission(user.email, {
      formId,
      slug,
    });

    return successResponse(submission, "Student submission retrieved");
  });
}
