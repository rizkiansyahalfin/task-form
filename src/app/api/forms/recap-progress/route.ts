import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireMentorAuth } from "@/server/auth";
import { formService } from "@/services/form.service";

export async function GET(_request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    enforceRateLimit(`forms-recap:${user.id}`);

    const recap = await formService.getMultiFormProgress(user.id);
    return successResponse(recap, "Multi-form progress recap retrieved");
  });
}
