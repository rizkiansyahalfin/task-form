import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireMentorAuth } from "@/server/auth";
import { submissionService } from "@/services/submission.service";

export async function GET(_request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    enforceRateLimit(`dashboard:${user.id}`);

    const stats = await submissionService.getDashboardStats(user.id);
    return successResponse(stats, "Dashboard stats retrieved");
  });
}
