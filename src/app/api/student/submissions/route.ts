import { NextRequest } from "next/server";
import { z } from "zod";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/server/auth";
import { submissionService } from "@/services/submission.service";
import { submitFormSchema } from "@/schemas";

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

export async function PUT(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    enforceRateLimit(`student-submission-put:${user.id}`);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return successResponse(null, "Submission ID is required", undefined, 400);
    }

    const body = await request.json();
    const data = submitFormSchema.parse(body);

    const submission = await submissionService.updateStudentSubmission(id, user.email, data);

    return successResponse(submission, "Submission updated");
  });
}
