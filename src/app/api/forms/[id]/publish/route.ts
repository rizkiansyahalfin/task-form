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
    enforceRateLimit(`forms-publish:${user.id}`);

    const form = await formService.publishForm(id, user.id);
    return successResponse(form, "Form published");
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const user = await requireMentorAuth();
    const { id } = await params;
    enforceRateLimit(`forms-unpublish:${user.id}`);

    const form = await formService.unpublishForm(id, user.id);
    return successResponse(form, "Form unpublished");
  });
}
