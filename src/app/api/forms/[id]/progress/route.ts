import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireMentorAuth } from "@/server/auth";
import { formService } from "@/services/form.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`forms-progress:${user.id}:${id}`);

    const progress = await formService.getFormProgress(id, user.id);
    return successResponse(progress, "Form progress retrieved");
  });
}
