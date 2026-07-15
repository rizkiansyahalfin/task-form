import { NextRequest } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api-response";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { requireMentorAuth } from "@/server/auth";
import { formService } from "@/services/form.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`forms-archive:${user.id}`);

    const form = await formService.archiveForm(id, user.id);
    return successResponse(form, "Form archived");
  });
}
